const BN = '\n',
  MAX_GENERATION_ATTEMPTS = 10;

var Markov = makeClass();

Markov.prototype = {

  _chooseChild: function (parent, path) {
    //console.log("_chooseChild: " + parent.token);

    var mlms = this.maxLengthMatchingSequence;

    // bail if we don't have maxLengthMatchingSequence
    if (mlms < this.N || path.length <= mlms) return parent.select();

    console.log('\nSo far: ', this._nodesToTokens(path));
    console.log('           "' + parent.token + '" has '+parent.childNodes().length +
      ' option(s): [' + nodeStr(parent.childNodes()) + "] ");
    console.log();

    var start = nodeStr(path, true);
    console.log("start: "+start);

    var child, nodes = path.splice(-(this.N - 1)),
      excludes = [];

    console.log('path: ', nodeStr(path) +" :: ", nodeStr(nodes));

    while (!child) {

      console.log('select: ', excludes, nodes.length);
      var candidate = parent.select(excludes);

      if (!candidate) {
        console.log('FAIL with excludes = [', excludes + '] str="'+start+'"');
        return false // if no candidates left, return false;
      }

      //var check = nodes.slice(0).push(candidate)
      check = this._nodesToTokens(nodes.splice(0));
      check.push(candidate.token);

      console.log('isSubArray?', check);

      if (isSubArray(check, this.input)) {
        console.log("Yes, excluding '"+candidate.token+"'");
        excludes.push(candidate.token);
        continue; // try again
      }

      console.log('No, done: ', candidate.token);
      child = candidate; // found a good one
    }

    return child;
  },

  init: function (n) {

    this.N = n;
    this.root = new Node(null, 'ROOT');
    this.maxLengthMatchingSequence = 0;
  },

  loadTokens: function (tokens) {

    this.input = tokens.slice(0);
    for (var i = 0; i < tokens.length; i++) {
      var node = this.root,
        words = tokens.slice(i, i + this.N);
      for (var j = 0; j < words.length; j++) {
        node = node.addChild(words[j]);
      }
    }
    return this;
  },

  generateTokens: function (num) {

    var node, parent, tries = 0;
    var nodes = [node = this.root.select()];

    while (tries < MAX_GENERATION_ATTEMPTS) {

      parent = this._search(nodes);
      node = this._chooseChild(parent, nodes);

      if (node) {
        nodes.push(node);

        if (nodes.length == num) {
          return this._nodesToTokens(nodes);
        }
      }
      else {
        //console.warn(tries, 'Failed with: ', nodeStr(nodes));
        nodes = [node = this.root.select()];
        tries++;
      }
    }

    console.error('\n\nFailed after ' + tries + ' tries');
      //, with '+ nodes.length + ' tokens: \'', nodeStr(nodes)+"'");
  },

  generateUntil: function (regex, minLength, maxLength) {

    minLength = minLength || 1;
    maxLength = maxLength || Number.MAX_VALUE;

    var mn, tokens, tries = 0;

    while (++tries < MAX_GENERATION_ATTEMPTS) {

      // generate the min number of tokens
      tokens = this.generateTokens(minLength);

      // keep adding one and checking until we pass the max
      while (tokens.length < maxLength) {

        mn = this._nextOnPath(tokens); // TODO: change to this._search(tokens)

        if (mn && mn.token) {
          tokens.push(mn.token);

          // check against our regex
          if (mn.token.search(regex) > -1) {
            return tokens;
          }
        }
      }
    }

    // uh-oh, we failed
    throw Error(BN + "RiMarkov failed to complete after " + tries + " attempts." +
      "You may need to add more text to your model..." + BN);
  },

  getCompletions: function (pre, post) {

    var tn, node, atest, nexts, result = [];

    if (post) { // fill the center

      if (pre.length + post.length > this.N) {
        err('Sum of pre.length && post.length must be < N, was ' +
          (pre.length + post.length));
      }

      if (!(tn = this._findNode(pre))) return;

      nexts = tn.childNodes();
      for (var i = 0; i < nexts.length; i++) {

        node = nexts[i];
        atest = pre.slice(0);
        atest.push(node.token);
        post.map(function (p) {
          atest.push(p);
        });

        if (this._findNode(atest)) result.push(node.token);
      }

      return result;

    } else { // fill the end

      var hash = this.getProbabilities(pre);
      return Object.keys(hash).sort(function (a, b) {
        return hash[b] - hash[a];
      });
    }
  },

  getProbabilities: function (path) {

    //if (typeof path === 'string') path = [path];
    path = (typeof path === 'string') ? [path] : path;

    if (path.length > this.N) {
      path = path.slice(Math.max(0, path.length - (this.N - 1)), path.length);
    }

    var tn, probs = {};
    if (!(tn = this._findNode(path))) return {};

    var nexts = tn.childNodes();
    for (var i = 0; i < nexts.length; i++) {
      if (nexts[i]) {
        probs[nexts[i].token] = nexts[i].probability();
      }
    }

    return probs;
  },

  getProbability: function (data) {

    if (data && data.length) {
      var tn = (typeof data === 'string') ?
        this.root.find(data) : this._findNode(data);
      if (tn) return tn.probability();
    }

    return 0;
  },

  print: function () {

    console && console.log(this.root.asTree(0).replace(/{}/g, ''));
    return this;
  },

  /////////////////////////////// end API //////////////////////////////////

  _nodesToTokens(nodes) {
    //console.log('_nodesToTokens', nodes);
    return nodes.map(function (n) {
      return n.token;
    });
  },

  /*
   * Follows 'path' (using the last n-1 tokens) from root and returns
   * the node for the last element if it exists, otherwise undefined
   * @param  {String[]} path
   * @return {Node}
   */
  _search: function (path) {

    var token, node = this.root;
    if (path) {
      var tpath = path.slice(0);
      tpath = tpath.splice(-(this.N - 1)); // TODO: opt
      for (var i = 0; i < tpath.length; i++) {
        if (node) {
          token = tpath[i].token || tpath[i];
          node = node.children[token];
        }
      }
    }
    // if (node && node.childNodes().length)
    return node;
  },

  /* Follow path down the tree, then probabilistically select the next node */
  _nextOnPath: function (path) {

    var idx = Math.max(0, path.length - (this.N - 1)),
      node = this.root.find(path[idx++]);

    for (var i = idx; i < path.length; i++) {
      if (node) node = node.find(path[i]);
    }

    if (node) return node.select();
  },

  _findNode: function (path) {

    var numNodes = Math.min(path.length, this.N - 1),
      firstIdx = Math.max(0, path.length - (this.N - 1)),
      node = this.root.find(path[firstIdx++]);

    if (node) {
      var nodes = [node];
      for (var i = firstIdx; i < path.length; i++) {
        node = node.find(path[i]);
        if (!node) return;
        nodes.push(node);
      }

      return nodes[nodes.length - 1];
    }
  }
}

/////////////////////////////// Node //////////////////////////////////////////

function Node(parent, word) {

  this.children = {};
  this.parent = parent;
  this.token = word;
  this.count = 0;

  // find a (direct) child with matching token, given a word or node
  this.find = function (word) {
    //if (word && word.token) word = word.token; // if a node
    return this.children[word && word.token ? word.token : word];
  }

  /**
   * Choose a (direct) child according to probability
   * @param  {String[]} excludes - tokens which may not be selected
   * @return selected Node or undefined
   */
  this.select = function (excludes) {

    var selector, sum = 1,
      pTotal = 0,
      nodes = this.childNodes();

    if (excludes && excludes.length) {

      for (var i = nodes.length - 1; i >= 0; i--) {
        if (excludes.indexOf(nodes[i].token) > -1) {
          //console.log('removing: '+nodes[i].token);
          nodes.splice(i, 1);
        }
      }

      sum = nodes.reduce(function (total, n) {
        return total + n.probability();
      }, 0);
    }

    selector = Math.random() * sum;

    for (var i = 0; i < nodes.length; i++) {
      pTotal += nodes[i].probability();
      if (selector < pTotal)
        return nodes[i];
    }

    console.log('no hit for select() with excludes = '+excludes);
  }

  this.childNodes = function () {
    var res = [];
    for (var k in this.children) {
      res.push(this.children[k]);
    }
    return res;
  }

  this.addChild = function (word, count) {

    count = count || 1;
    var node = this.children[word];
    if (!node) {
      node = new Node(this, word);
      this.children[word] = node;
    }
    node.count++;
    return node;
  }

  this.childCount = function () {
    var sum = 0;
    for (var k in this.children) {
      sum += this.children[k].count;
    }
    return sum;
  }

  this.probability = function () {
    return this.count / this.parent.childCount();
  }

  this.toString = function () {
    return '[ ' + this.token + ' (' + this.count +
      '/' + this.probability().toFixed(3) + '%)]';
  }

  this.stringify = function (theNode, str, depth, sort) {

    var encode = function (tok) {
      if (tok === BN) tok = '\\n';
      if (tok === '\r') tok = '\\r';
      if (tok === '\t') tok = '\\t';
      if (tok === '\r\n') tok = '\\r\\n';
      return tok;
    }

    var i, j, k, node, mn = theNode,
      l = [],
      indent = BN;

    sort = sort || false;

    for (k in theNode.children) {
      l.push(theNode.children[k]);
    }

    if (!l.length) return str;

    if (sort) l.sort();

    for (j = 0; j < depth; j++) {
      indent += '    ';
    }

    for (i = 0; i < l.length; i++) {

      node = l[i];

      if (!node) break;

      var tok = encode(node.token);

      //str += indent + "'" + tok + "'";
      str += indent + tok;

      if (!node.count)
        err("ILLEGAL FREQ: " + node.count + " " + mn.token + "," + node.token);

      if (node.parent) {
        str += " [" + node.count + ",p=" +
          (node.probability().toFixed(3)) + "] {";
      }

      if (this.childCount()) {
        str = this.stringify(node, str, depth + 1, sort);
      } else {
        str += "}";
      }
    }

    indent = BN;
    for (j = 0; j < depth - 1; j++) {
      indent += "    ";
    }

    return str + indent + "}";
  }

  this.asTree = function (sort) {
    var s = this.token + ' ';
    if (this.parent) {
      s += '(' + this.count + ')->';
    }
    s += '{';
    return this.childCount() ? this.stringify(this, s, 1, sort) : s + '}';
  }
}

function makeClass() { // from: Resig
  return function (args) {
    if (this instanceof arguments.callee) {
      if (typeof this.init == "function") {
        this.init.apply(this, args && args.callee ? args : arguments);
      }
    } else return new arguments.callee(arguments);
  };
}

function nodeStr(nodes, format) {
  if (format) {
    var a = [];
    for (var i = 0; i < nodes.length; i++)
      a.push(nodes[i].token);
    return RiTa.untokenize(a);
  }
  var s = '';
  for (var i = 0; i < nodes.length; i++) {
    s += nodes[i].token + ','
  }
  return s;
};

// --------------------------------------------------------------
if (0) {

  var RiTa = require('./node_modules/rita/lib/rita');
  var RiMarkov = Markov;

  var sample = "One reason people lie is to achieve personal power. Achieving personal power is helpful for one who pretends to be more confident than he really is. For example, one of my friends threw a party at his house last month. He asked me to come to his party and bring a date. However, I did not have a girlfriend. One of my other friends, who had a date to go to the party with, asked me about my date. I did not want to be embarrassed, so I claimed that I had a lot of work to do. I said I could easily find a date even better than his if I wanted to. I also told him that his date was ugly. I achieved power to help me feel confident; however, I embarrassed my friend and his date. Although this lie helped me at the time, since then it has made me look down on myself.";

  var rm = new RiMarkov(4);
  //rm.maxLengthMatchingSequence = 5;
  rm.loadTokens(RiTa.tokenize(sample));
  //rm.print();
  for (var i = 0; i < 10; i++) {
    var toks = rm.generateTokens(7);
    console.log(i, RiTa.untokenize(toks));
  }

}

function isSubArray(find, arr) {
  OUT: for (var i = find.length - 1; i < arr.length; i++) {
    for (var j = 0; j < find.length; j++) {
      //console.log('check:', find[find.length - j -1] +' =? '+arr[i-j]);
      if (find[find.length - j - 1] !== arr[i - j]) {
        continue OUT;
      }
      if (j === find.length - 1)
        return true;
    }
  }
  return false;
}

// exports.isSubArray = isSubArray;
// exports.RiMarkov = Markov;

if (window) { // for browser

  window['RiMarkov'] = Markov;

} else if (typeof module !== 'undefined') { // for node

  module.exports['RiMarkov'] = Markov;
}

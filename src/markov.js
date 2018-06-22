const BN = '\n',
  SSDLM = 'D=l1m_',
  MAX_GENERATION_ATTEMPTS = 10;

var Markov = makeClass();

Markov.prototype = {

  init: function (n) {

    this.N = n;
    this.root = new Node(null, 'ROOT');
    this.starts = new Node(null, 'STARTS');
    this.maxLengthMatchingSequence = 0;
  },

  loadSentences: function (sentences) {

    var seq, allWords = [];

    // collect all the words, marking sentence starts
    for (var i = 0; i < sentences.length; i++) {
      var sentence = RiTa.trim(sentences[i].replace(/\s+/, ' '))
      //console.log(i + ") " + sentences[i]);

      var tokens = RiTa.tokenize(sentence);
      for (var j = 0; j < tokens.length; j++) {
        allWords.push(j == 0 ? SSDLM + tokens[j] : tokens[j]);
      }
    }

    // create all sequences of length N
    for (i = 0; i < allWords.length; i++) {
      seq = [];
      for (j = 0; j < this.N; j++) {
        if ((i + j) < allWords.length) {
          seq[j] = allWords[i + j];
        }
      }

      this._addSentenceSequence(seq);
    }

    console.log("Loaded " + sentences.length + " sentences");
  },

  _addSentenceSequence: function (toAdd) {

    var node = this.root;
    for (var i = 0; i < toAdd.length; i++) {
      if (!toAdd[i] || !node.token) continue;
      if (toAdd[i].startsWith(SSDLM)) {
        toAdd[i] = toAdd[i].substring(SSDLM.length);
        if (node == this.root) this.starts.addChild(toAdd[i]);
      }
      node = node.addChild(toAdd[i]);
    }
  },

  _getSentenceStart: function () {
    var node = this.starts.select();
    return this.root.children[node.token];
  },

  _isSentenceStart: function (node) {
    if (!node) return false;
    return this.starts.children[node.token] ? true : false;
  },

  _flatten: function (nodes) {
    return RiTa.untokenize(this._nodesToTokens(nodes));
  },

  _validateSentence: function (result, nodes) {

    var sent = this._flatten(nodes);

    if (!sent || !sent.length) {
      console.log("Bad validate arg: ", nodes);
      return false;
    }

    if (sent[0] !== sent[0].toUpperCase()) {
      console.log("Skipping: bad first char in '" + sent + "'");
      return false;
    }

    if (!sent.match(/[!?.]$/)) {
      console.log("Skipping: bad last char='" + sent[sent.length - 1] + "' in '" + sent + "'");
      return false;
    }

    //     if (result.indexOf(candidate) > -1) {
    //       console.log("Skipping: duplicate sentence: '" + sent + "'");
    //       return false;
    //     }

    result.push(sent);

    return true;
  },

  _onGenerationIncomplete: function (tries, successes) {

    console.warn('\nRiMarkov failed to complete after ' + tries +
      ' tries and ' + successes + ' successful generations.' +
      ' You may need to add more text to the model...' + BN);
  },

  generateSentences: function (num, minTokens, maxTokens) {

    minTokens = minTokens || 5;
    maxTokens = maxTokens || 35;

    //return;
    if (!this.starts.childCount()) {
      console.error('generateSentences() can only be called when the ' +
        'model was created with sentences, otherwise use generateTokens()');
    }

    var node, sent, tries = 0,
      result = [];

    var l = 0; // tmp

    while (result.length < num && l < 100) {

      // choose a sentence start, according to probability
      sent = (sent && sent.length) ? sent : [node = this._getSentenceStart()];

      if (!node) throw Error("Invalid state0");

      if (node.isLeaf()) {

        node = this._search(sent);
        //node = node.leafTraversal(this.root, this.N);

        // we ended up at a another leaf // TODO: remove
        if (node.isLeaf()) {
          console.log(l + ") FAILED LEAF-TRAV: " + node);
          if (sent.length > minTokens) {
            if (!this._validateSentence(result, sent)) {
              tries++;
              console.log("Give up on try #" + tries, node, this._flatten(sent));
            }
            sent = [];
            continue;
          }
        }
      }

      if (!node) throw Error("Invalid state4");

      if (node.isLeaf()) throw Error("Invalid state5: " + node);

      // select the next child, according to probability
      node = node.select();
      //console.log(l + ") NODE: " + node, this._isSentenceStart(node));


      // do we have a candidate for the next start?
      if (this._isSentenceStart(node)) {

        var tok = node.token;
        //console.log(l + ") CHECK: " + node);
        if (sent.length > minTokens && !this._validateSentence(result, sent)) {
            tries++;
        }
        else {
          sent = [];
          continue;
        }
      }

      sent.push(node);

      var k = this._flatten(sent);

      if (sent.length > maxTokens) {
        console.log("FAIL(maxlen): " + this._flatten(sent));
        if (++tries >= MAX_GENERATION_ATTEMPTS) {
          this._onGenerationIncomplete(tries, result.length);
          break; // give-up (&& result = null; ?)
        }
        sent = null;
      }

      l++;
    }

    return result;
  },

  generateSentence: function () {
    return this.generateSentences(1)[0];
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
    var tokens = [node = this.root.select()];

    while (tries < MAX_GENERATION_ATTEMPTS) {

      parent = this._search(tokens);

      //node = this._chooseChild(parent, nodes);

      if (parent.isLeaf()) { // try again
        tokens = [node = this.root.select()];
        tries++;
        continue;
      }

      node = parent.select();

      if (node) {
        tokens.push(node);

        if (tokens.length == num) {
          return this._nodesToTokens(tokens);
        }

      } else {
        //console.warn(tries, 'Failed with: ', nodeStr(nodes));
        tokens = [node = this.root.select()];
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
        else break;

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
  },

  // LATER
  _chooseChild: function (parent, path) {
    //console.log("_chooseChild: " + parent.token);

    var mlms = this.maxLengthMatchingSequence;

    // bail if we don't have maxLengthMatchingSequence
    if (mlms < this.N || path.length <= mlms) return parent.select();

    // WORKING here

    console.log('\nSo far: ', this._nodesToTokens(path));
    console.log('           "' + parent.token + '" has ' + parent.childNodes().length +
      ' option(s): [' + nodeStr(parent.childNodes()) + "] ");
    console.log();

    var start = nodeStr(path, true);
    console.log("start: " + start);

    var child, nodes = path.splice(-(this.N - 1)),
      excludes = [];

    console.log('path: ', nodeStr(path) + " :: ", nodeStr(nodes));

    while (!child) {

      console.log('select: ', excludes, nodes.length);
      var candidate = parent.select(excludes);

      if (!candidate) {
        console.log('FAIL with excludes = [', excludes + '] str="' + start + '"');
        return false // if no candidates left, return false;
      }

      //var check = nodes.slice(0).push(candidate)
      check = this._nodesToTokens(nodes.splice(0));
      check.push(candidate.token);

      console.log('isSubArray?', check);

      if (isSubArray(check, this.input)) {
        console.log("Yes, excluding '" + candidate.token + "'");
        excludes.push(candidate.token);
        continue; // try again
      }

      console.log('No, done: ', candidate.token);
      child = candidate; // found a good one
    }

    return child;
  }
}

/////////////////////////////// Node //////////////////////////////////////////

function Node(parent, word) {

  this.children = {};
  this.isStart = false;
  this.parent = parent;
  this.token = word;
  this.count = 0;

  // find a (direct) child with matching token, given a word or node
  this.find = function (word) {
    //if (word && word.token) word = word.token; // if a node
    return this.children[word && word.token ? word.token : word];
  }

  this.isLeaf = function () {
    return this.childCount() < 1;
  }

  // this.leafTraversal = function (root, n) {
  //
  //   var node = this;
  //
  //   console.log("LEAF: " + node);
  //
  //   var path = [];
  //   for (var i = 0; i < n - 1; i++) {
  //     path.unshift(node);
  //     node = node.parent;
  //     if (!node) err("Invalid state1", node);
  //   }
  //
  //   if (path.length !== n - 1) throw Error("Invalid state2" + path);
  //
  //   //console.log(this._flatten(path));
  //
  //   node = root;
  //   for (var i = 0; i < path.length; i++) {
  //     node = node.children[path[i].token];
  //     if (!node) throw Error("Invalid state3");
  //     console.log(i + ") " + node);
  //   }
  //
  //   return node;
  // }

  /**
   * Choose a (direct) child according to probability
   * @param  {String[]} excludes - tokens which may not be selected
   * @return selected Node or undefined
   */
  this.select = function (filter) {

    var selector, sum = 1,
      nodes = this.childNodes(),
      pTotal = 0;

    if (!nodes || !nodes.length)
      throw Error("Invalid arg to select(no children) " + this);

    if (filter) {

      if (isFunction(filter)) {
        for (var i = nodes.length - 1; i >= 0; i--) {
          if (!filter(nodes[i].token)) {
            //console.log('removing: '+nodes[i].token);
            nodes.splice(i, 1);
          }
        }
      }
      else if (Array.isArray(filter)) {
        for (var i = nodes.length - 1; i >= 0; i--) {
          if (filter.indexOf(nodes[i].token) > -1) {
            nodes.splice(i, 1);
          }
        }
      }
      else {
        throw Error("Invalid filter: "+filter);
      }

      if (!nodes.length) return; // nothing left after filtering

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

    throw Error(this + '\nno hit for select() with filter: ' + filter
      + "\nnodes(" + nodes.length + ") -> " + nodes);
  }

  this.childNodes = function () { // remove ?
    var res = [];
    for (var k in this.children) {
      res.push(this.children[k]);
    }
    return res;
  }

  // increments child node and returns it
  this.addChild = function (word, count) {

    count = count || 1;
    var node = this.children[word];
    if (!node) {

      node = new Node(this, word);
      this.children[word] = node;
    }
    node.count += count;

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
    return this.parent ? this.count / this.parent.childCount() : -1;
  }

  this.toString = function () {
    return this.parent ? this.token + '(' + this.count +
      '/' + this.probability().toFixed(3) + '%)' : 'Root'
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

      if (!this.childCount()) {
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

  var sample = "One reason people lie is to achieve personal power. Achieving personal power is helpful for one who pretends to be more confident than he really is. For example, one of my friends threw a party at his house last month. He asked me to come to his party and bring a date. However, I did not have a girlfriend. One of my other friends, who had a date to go to the party with, asked me about my date. I did not want to be embarrassed, so I claimed that I had a lot of work to do. I said I could easily find a date even better than his if I wanted to. I also told him that his date was ugly. I achieved power to help me feel confident; however, I embarrassed my friend and his date. Although this lie helped me at the time, since then it has made me look down on myself.";

  var rm = new Markov(4);
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

function err() {
  var msg = "[RiTa] " + arguments[0];
  for (var i = 1; i < arguments.length; i++)
    msg += '\n' + arguments[i];
  throw Error(msg);
}

function isFunction(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
};

// exports.isSubArray = isSubArray;
// exports.RiMarkov = Markov;

if (window) { // for browser

  window['RiMarkov'] = Markov;

} else if (typeof module !== 'undefined') { // for node

  module.exports['RiMarkov'] = Markov;
}

// TODO: allow for real-time weighting ala memo
const BN = '\n';
const SSDLM = '<s/>';
const MI = Number.MAX_SAFE_INTEGER;
const MAX_GENERATION_ATTEMPTS = 100;

class Markov {

  constructor(n) {

    this.N = n;
    this.root = new Node(null, 'ROOT');
    this.maxLengthMatchingSequence = 0;
  }

  loadTokens(tokens) {

    this.input = tokens.slice(0);
    for (var i = 0; i < tokens.length; i++) {
      var node = this.root,
        words = tokens.slice(i, i + this.N);
      for (var j = 0; j < words.length; j++) {
        node = node.addChild(words[j]);
      }
    }
    return this;
  }

  loadSentences(sentences) {

    var tokens = [];

    // collect all the words, adding a token for sentence starts
    for (var i = 0; i < sentences.length; i++) {
      var sentence = RiTa.trim(sentences[i].replace(/\s+/, ' '))
      var words = RiTa.tokenize(sentence);
      tokens.push(SSDLM, ...words);
    }

    // create nodes for all sequences of length N
    for (var i = 0; i < tokens.length; i++) {
      var node = this.root,
        toAdd = tokens.slice(i, i + this.N);
      for (var j = 0; j < toAdd.length; j++) {
        node = node.addChild(toAdd[j]);
      }
    }
    //console.log("Loaded " + sentences.length + " sentences");
  }

  generateSentences(num, { minTokens = 5, maxTokens = 35, startToken = undefined, maxLengthMatch = MI } = {}) {

    //console.log(num + " {" + minTokens + "," + maxTokens + "," + startToken + "}");

    var node, sent, tries = 0;
    var result = [];

    while (tries < MAX_GENERATION_ATTEMPTS) {

      if (result.length == num) return result;

      // choose a sentence start, according to probability
      sent = sent || [node = startToken ?
        this.root.child(SSDLM).child(startToken) : this.root.child(SSDLM).select()];

      if (!node) {
        if (startToken) throw Error(startToken ?
          "No start token found: " + startToken : "Invalid state: " + this);
      }

      if (node.isLeaf()) {
        node = this._search(sent);

        // we ended up at a another leaf
        if (!node || node.isLeaf()) {
          if (sent.length < minTokens || !this._validateSentence(result, sent)) {
            tries++;
          }
          sent = null;
          continue;
        }
      }

      // select the next child, according to probabilities
      node = node.select();

      // do we have a candidate for the next start?
      if (node.token === SSDLM) {

        // its a sentence, or we restart and try again
        if (sent.length < minTokens || !this._validateSentence(result, sent)) {
          tries++;
        }
        sent = null;
        continue;
      }

      // add new node to the sentence
      sent.push(node);

      // check if we've exceeded max-length
      if (sent.length > maxTokens) {
        //console.log("FAIL #"+tries+" (maxlen): " + this._flatten(sent));
        sent = null;
        tries++;
      }
      //console.log("tries="+tries);
    }

    //if (tries >= MAX_GENERATION_ATTEMPTS) {
    throw Error('\nRiMarkov failed to complete after ' + tries +
      ' tries and ' + result.length + ' successful generation(s).' +
      ' You may need to add more text to the model...' + BN);
    //}
  }

  generateSentence({ minTokens = 5, maxTokens = 35, startToken = undefined, maxLengthMatch = MI } = {}) {

    return this.generateSentences(1, arguments[0])[0];
  }

  generateTokens(num, { startToken = undefined, maxLengthMatch = MI } = {}) {

    var node, parent, tries = 0;
    var tokens;

    while (tries < MAX_GENERATION_ATTEMPTS) {

      tokens = tokens || [node = startToken ?
        this.root.child(startToken) :this.root.select()];

      parent = this._search(tokens);
      //node = this._chooseChild(parent, nodes); // TODO: for mlms

      if (!parent || parent.isLeaf()) { // try again
        tokens = null;
        tries++;
        continue;
      }

      node = parent.select();

      if (!node) throw Error('Invalid state'); // shouldn't happen

      if (tokens.push(node) < num) continue;

      return this._nodesToTokens(tokens);
    }

    throw Error('\n\nFailed after ' + tries + ' tries');
    //, with '+ nodes.length + ' tokens: \'', nodeStr(nodes)+"'");
  }

  generateUntil(regex, minLength, maxLength) { // add-arg: start

    minLength = minLength || 1;
    maxLength = maxLength || Number.MAX_VALUE;

    var tries = 0;

    OUT: while (++tries < MAX_GENERATION_ATTEMPTS) {

      // generate the min number of tokens
      var tokens = this.generateTokens(minLength);

      // keep adding one and checking until we pass the max
      while (tokens.length < maxLength) {

        var mn = this._search(tokens);

        if (!mn || mn.isLeaf()) continue OUT; // hit a leaf, restart

        mn = mn.select();

        tokens.push(mn.token);

        // check against our regex
        if (mn.token.search(regex) > -1) return tokens;
      }
    }

    throw Error(BN + "RiMarkov failed to complete after " + tries + " attempts." +
      "You may need to add more text to your model..." + BN);
  }

  getCompletions(pre, post) {

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
  }

  getProbabilities(path) {

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
  }

  getProbability(data) {

    if (data && data.length) {
      var tn = (typeof data === 'string') ?
        this.root.child(data) : this._findNode(data);
      if (tn) return tn.probability();
    }

    return 0;
  }

  toString() {
    return this.root.asTree().replace(/{}/g, '');
  }

  size() {

    return this.root.childCount();
  }

  ready(url) {

    return this.size() > 0;
  }

  ////////////////////////////// end API ////////////////////////////////

  _flatten(nodes) {

    return RiTa.untokenize(this._nodesToTokens(nodes));
  }

  _validateSentence(result, nodes) {

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
      //console.log("Skipping: bad last char='"
      //+ sent[sent.length - 1] + "' in '" + sent + "'");
      return false;
    }

    if (result.indexOf(sent) > -1) {
      //console.log("Skipping: duplicate sentence: '" + sent + "'");
      return false;
    }

    result.push(sent);

    return true;
  }

  _nodesToTokens(nodes) {
    //console.log('_nodesToTokens', nodes);
    return nodes.map(function (n) {
      return n.token;
    });
  }

  /*
   * Follows 'path' (using the last n-1 tokens) from root and returns
   * the node for the last element if it exists, otherwise undefined
   * @param  {String[]} path
   * @return {Node}
   */
  _search(path) {

    if (!path || !path.length) return this.root;

    var idx = Math.max(0, path.length - (this.N - 1)),
      node = this.root.child(path[idx++]);

    for (var i = idx; i < path.length; i++) {
      if (node) node = node.child(path[i]);
    }

    if (node) return node;
  }

  _findNode(path) {

    var numNodes = Math.min(path.length, this.N - 1),
      firstIdx = Math.max(0, path.length - (this.N - 1)),
      node = this.root.child(path[firstIdx++]);

    if (node) {
      var nodes = [node];
      for (var i = firstIdx; i < path.length; i++) {
        node = node.child(path[i]);
        if (!node) return;
        nodes.push(node);
      }

      return nodes[nodes.length - 1];
    }
  }

  // LATER
  _chooseChild(parent, path) {
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

class Node {

  constructor(parent, word) {

    this.children = {};
    this.parent = parent;
    this.token = word;
    this.count = 0;
  }

  /*
   * find a (direct) child with matching token, given a word or node
   */
  child(word) {
    return this.children[word && word.token ? word.token : word];
  }

  /*
   * increments count for a child node and returns it
   */
  addChild(word, count) {

    count = count || 1;
    var node = this.children[word];
    if (!node) {

      node = new Node(this, word);
      this.children[word] = node;
    }
    node.count += count;

    return node;
  }

  /*
   * Choose a (direct) child according to probability
   */
  select(filter) {

    function applyFilter(filter, nodes) {
      if (isFunction(filter)) {
        for (var i = nodes.length - 1; i >= 0; i--) {
          if (!filter(nodes[i].token)) nodes.splice(i, 1);
        }
      } else if (Array.isArray(filter)) {
        for (var i = nodes.length - 1; i >= 0; i--) {
          if (filter.indexOf(nodes[i].token) > -1) nodes.splice(i, 1);
        }
      } else {
        throw Error("Invalid filter: " + filter);
      }
      return nodes;
    }

    var selector, sum = 1,
      nodes = this.childNodes(),
      pTotal = 0;

    if (!nodes || !nodes.length)
      throw Error("Invalid arg to select(no children) " + this);

    if (filter) {

      nodes = applyFilter(filter, nodes);

      if (!nodes.length) return; // nothing left after filtering

      sum = nodes.reduce(function (total, n) {
        return total + n.probability();
      }, 0);
    }

    selector = Math.random() * sum;

    for (var i = 0; i < nodes.length; i++) {

      pTotal += nodes[i].probability();
      if (selector < pTotal) {
        // make sure we don't return a sentence start (<s/>) node
        var result = nodes[i].token === SSDLM ? nodes[i].select() : nodes[i];
        if (!result) throw Error('Unexpected state');
        return result
      }
    }

    throw Error(this + '\nno hit for select() with filter: ' + filter +
      "\nnodes(" + nodes.length + ") -> " + nodes);
  }

  isLeaf() {
    return this.childCount() < 1;
  }

  childNodes() {
    return Object.values(this.children);
  }

  childCount() {
    var sum = 0;
    for (var k in this.children) {
      if (k === SSDLM) continue;
      sum += this.children[k].count;
    }
    return sum;
  }

  probability() {
    return this.parent ? this.count / this.parent.childCount() : -1;
  }

  toString() {
    return this.parent ? this.token + '(' + this.count +
      '/' + this.probability().toFixed(3) + '%)' : 'Root'
  }

  stringify(theNode, str, depth, sort) {

    var i, j, k, node, mn = theNode,
      l = [],
      indent = BN;

    sort = sort || false;

    for (k in theNode.children) l.push(theNode.children[k]);

    if (!l.length) return str;

    if (sort) l.sort();

    for (j = 0; j < depth; j++) indent += '    ';

    for (i = 0; i < l.length; i++) {

      node = l[i];
      if (!node) break;
      var tok = this._encode(node.token);
      str += indent + tok;

      if (!node.count)
        err("ILLEGAL FREQ: " + node.count + " " + mn.token + "," + node.token);

      if (node.parent) str += " [" + node.count + ",p=" +
        (node.probability().toFixed(3)) + "] {";

      str = !this.childCount() ? this.stringify(node, str, depth + 1, sort) : str + '}';
    }

    indent = BN;
    for (j = 0; j < depth - 1; j++) indent += "    ";

    return str + indent + "}";
  }

  asTree(sort) {

    var s = this.token + ' ';
    if (this.parent) {
      s += '(' + this.count + ')->';
    }
    s += '{';
    return this.childCount() ? this.stringify(this, s, 1, sort) : s + '}';
  }

  _encode(tok) {

    if (tok === BN) tok = '\\n';
    if (tok === '\r') tok = '\\r';
    if (tok === '\t') tok = '\\t';
    if (tok === '\r\n') tok = '\\r\\n';
    return tok;
  }
}

// --------------------------------------------------------------

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
}

// exports.isSubArray = isSubArray;
// exports.RiMarkov = Markov;

if (window) { // for browser

  window['RiMarkov'] = Markov;

} else if (typeof module !== 'undefined') { // for node

  module.exports['RiMarkov'] = Markov;
}

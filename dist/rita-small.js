/*jshint browser:true, -W100:true, evil:true */

(function(window, undefined) {

var E = '', SP = ' ', EA = [], N = 'number', S = 'string', O = 'object',
  A = 'array', B = 'boolean', R = 'regexp', F = 'function', BN = '\n';

function makeClass() { // from: Resig, TODO: make work with strict
  return function(args) {
    if (this instanceof arguments.callee) {
      if (typeof this.init == "function") {
        this.init.apply(this, args && args.callee ? args : arguments);
      }
    } else return new arguments.callee(arguments);
  };
}

function printProgress(msg, prog, lb) {
  if (process && process.stdout) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(msg + prog + '%' + (lb?'\n':''));
  }
}

function is(obj, type) {
  return get(obj) === type;
}

function ok(obj, type) {
  if (get(obj) != type) {
    throw TypeError('Expected ' + (type ? type.toUpperCase() : type + E) +
      ", but received " + (obj ? get(obj).toUpperCase() : obj + E));
  }
  return true;
}

function isNum(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function okeys(obj) {
  var keys = []; // replaces Object.keys();
  for (var k in obj) keys.push(k);
  return keys;
}

function err() {
  var msg = "[RiTa] " + arguments[0];
  for (var i = 1; i < arguments.length; i++)
    msg += '\n' + arguments[i];
  throw Error(msg);
}

function warn() {
  if (RiTa.SILENT || !console) return;
  if (arguments && arguments.length) {
    console.warn("[WARN] " + arguments[0]);
    for (var i = 1; i < arguments.length; i++)
      console.warn(arguments[i]);
  }
}

function log() {
  if (RiTa.SILENT || !console) return;
  console.log.apply(console, arguments);
}

function strOk(str) {
  return (typeof str === S && str.length > 0);
}

function trim(str) {
  if (!strOk(str)) return str;
  // from: http://blog.stevenlevithan.com/archives/faster-trim-javascript
  return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

function last(word) {
  if (!word || !word.length) return E;
  return word.charAt(word.length - 1);
}

function extend(l1, l2) {
  for (var i = 0; i < l2.length; i++)
    l1.push(l2[i]);
}

function endsWith(str, ending) {
  if (!is(str, S)) return false;
  return new RegExp(ending + '$').test(str);
}

function startsWith(str, starting) {
  if (!is(str, S)) return false;
  return new RegExp('^' + starting).test(str);
}

function equalsIgnoreCase(str1, str2) {
  return (is(str1, S) && is(str2, S)) ?
    (str1.toLowerCase() === str2.toLowerCase()) : false;
}

function isNode() {
  return (typeof module != 'undefined' && module.exports);
}

function shuffle(oldArray) { // shuffle array
  var newArray = oldArray.slice(),
    len = newArray.length,
    i = len;
  while (i--) {
    var p = parseInt(Math.random() * len),
      t = newArray[i];
    newArray[i] = newArray[p];
    newArray[p] = t;
  }
  return newArray;
}

function inArray(array, val) {
  return (!array) ? false : array.indexOf(val) > -1;
}

function escapeRegExp(string) {
  return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

// From: http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
function get(obj) {
  if (typeof obj != 'undefined') // else return undef
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

function tagForPENN(words) {
  if (!words || !words.length) return EA;
  var arr = is(words, S) ? RiTa.tokenize(words) : words;
  return PosTagger.tag(arr);
}

function tagForWordNet(words) {
  var pos, posArr = tagForPENN(words);
  if (words && posArr.length) {
    for (var i = 0; i < posArr.length; i++) {
      pos = posArr[i];
      posArr[i] = '-'; // default=other
      if (PosTagger.isNoun(pos)) posArr[i] = 'n';
      else if (PosTagger.isVerb(pos)) posArr[i] = 'v';
      else if (PosTagger.isAdverb(pos)) posArr[i] = 'r';
      else if (PosTagger.isAdj(pos)) posArr[i] = 'a';
    }
    return posArr;
  }
  return EA;
}

'use strict';

var FEATURES = [ 'tokens', 'stresses', 'phonemes', 'syllables', 'pos', 'text' ];

var RiTa = {

  VERSION: '1.2.20',

  /* For tokenization, Can't -> Can not, etc. */
  SPLIT_CONTRACTIONS: false,

  JAVA: 1, JS: 2, NODE: 3,

  DATA_LOADED: 'DataLoaded', INTERNAL: 'Internal', UNKNOWN: 'Unknown',

  // For Conjugator =================================
  FIRST_PERSON: 1,
  SECOND_PERSON: 2,
  THIRD_PERSON: 3,
  PAST_TENSE: 4,
  PRESENT_TENSE: 5,
  FUTURE_TENSE: 6,
  SINGULAR: 7,
  PLURAL: 8,
  NORMAL: 9,
  FEATURE_DELIM: ':',
  STRESSED: '1',
  UNSTRESSED: '0',
  PHONEME_BOUNDARY: '-',
  WORD_BOUNDARY: " ",
  SYLLABLE_BOUNDARY: "/",
  SENTENCE_BOUNDARY: "|",
  VOWELS: "aeiou",
  ABBREVIATIONS: ["Adm.", "Capt.", "Cmdr.", "Col.", "Dr.", "Gen.", "Gov.", "Lt.", "Maj.", "Messrs.", "Mr.", "Mrs.", "Ms.", "Prof.", "Rep.", "Reps.", "Rev.", "Sen.", "Sens.", "Sgt.", "Sr.", "St.", "a.k.a.", "c.f.", "i.e.", "e.g.", "vs.", "v.", "Jan.", "Feb.", "Mar.", "Apr.", "Mar.", "Jun.", "Jul.", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."],
  LEX_WARN: "A minimal Lexicon is currently in use. For word features outside the lexicon, use a larger version of RiTa.",
  LTS_WARN: 'No LTS-rules found: features/tagging may be inaccurate!',

  /* The infinitive verb form  - 'to eat an apple' */
  INFINITIVE: 1,

  /* Gerund form of a verb  - 'eating an apple' */
  GERUND: 2,

  /* The imperative verb form - 'eat an apple!' */
  IMPERATIVE: 3,

  /* Bare infinitive verb form - 'eat an apple' */
  BARE_INFINITIVE: 4,

  /* The subjunctive verb form */
  SUBJUNCTIVE: 5,

  /* Set to true to disable all console output */
  SILENT: false,

  /* Stemmer types */
  LANCASTER: "Lancaster",
  PORTER: "Porter",
  PLING: "Pling",

  NON_BREAKING_SPACE: '<sp/>',
	PARAGRAPH_BREAK: '<p/>',  //   regex: /<p\/?>/g;
	LINE_BREAK: '<br/>',

  STOP_WORDS: [ ".", ",", "the",
    "and", "a", "of", "\"", "in", "i", ":", "you", "is", "to",
    "that", ")", "(", "it", "for", "on", "!", "have", "with", "?",
    "this", "be", "...", "not", "are", "as", "was", "but", "or", "from",
    "my", "at", "if", "they", "your", "all", "he", "by", "one",
    "me", "what", "so", "can", "will", "do", "an", "about", "we", "just",
    "would", "there", "no", "like", "out", "his", "has", "up", "more", "who",
    "when", "don't", "some", "had", "them", "any", "their", "it's", "only",
    ";", "which", "i'm", "been", "other", "were", "how", "then", "now",
    "her", "than", "she", "well", "also", "us", "very", "because",
    "am", "here", "could", "even", "him", "into", "our", "much",
    "too", "did", "should", "over", "want", "these", "may", "where", "most",
    "many", "those", "does", "why", "please", "off", "going", "its", "i've",
    "down", "that's", "can't", "you're", "didn't", "another", "around",
    "must",  "few", "doesn't", "every", "yes", "each", "maybe",
    "i'll", "away", "doing", "oh", "else", "isn't", "he's", "there's", "hi",
    "won't", "ok", "they're", "yeah", "mine", "we're", "what's", "shall",
    "she's", "hello", "okay", "here's", "-", "less"
  ],

  stemmers: {},

  // Start functions =================================

  random: function() {
    var currentRandom = Math.random();
    if (!arguments.length) return currentRandom;
    return (arguments.length === 1) ? currentRandom * arguments[0] :
      currentRandom * (arguments[1] - arguments[0]) + arguments[0];
  },

  randomItem: function(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  distance: function(x1, y1, x2, y2) {
    var dx = x1 - x2, dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  },

  getPosTags: function(words, useWordNetTags) {
    return (useWordNetTags) ? tagForWordNet(words) : tagForPENN(words);
  },

  getPosTagsInline: function(words, delimiter) {

    if (!words || !words.length) return E;

    delimiter = delimiter || '/';
    words = is(words, S) ? RiTa.tokenize(words) : words;

    var sb = E,
      tags = RiTa.getPosTags(words);
    for (var i = 0; i < words.length; i++) {

      sb += (words[i]);
      if (!RiTa.isPunctuation(words[i])) {
        sb += delimiter + tags[i];
      }
      sb += SP;
    }

    return sb.trim();
  },

  getPresentParticiple: function(verb) {
    return Conjugator().getPresentParticiple(verb);
  },

  getPastParticiple: function(verb) {
    return Conjugator().getPastParticiple(verb);
  },

  concordance: function(text, options) {
    return Concorder(text, options).concordance();
  },

  kwic: function(text, word, options) {
    wordCount = (options && options.wordCount) || 4;
    return Concorder(text, options).kwic(word, wordCount);
  },

  conjugate: function(verb, args) {
    return Conjugator().conjugate(verb, args);
  },

  upperCaseFirst: function(s) {
    return s.charAt(0).toUpperCase() + s.substring(1);
  },

  pluralize: function(word) {

    if (!strOk(word)) return E;

    var i, rule, rules = PLURAL_RULES;

    if (inArray(MODALS, word.toLowerCase())) {
      return word;
    }

    for (i = 0; i < rules.length; i++) {
      rule = rules[i];
      if (rule.applies(word.toLowerCase())) {
        return rule.fire(word);
      }
    }

    return DEFAULT_PLURAL_RULE.fire(word);
  },

  singularize: function(word) {

    if (!strOk(word)) return E;

    var i, rule, rules = SINGULAR_RULES;
    if (inArray(MODALS, word.toLowerCase())) {
      return word;
    }
    i = rules.length;
    while (i--) {
      rule = rules[i];
      if (rule.applies(word.toLowerCase())) {
        return rule.fire(word);
      }
    }
    return this.stem(word, 'Pling');
  },

  trim: function(str) {
    return trim(str); // delegate to private
  },

  tokenize: function(words, regex) {

    if (!is(words,S)) return [];

    if (regex) return words.split(regex);

    words = trim(words);

    words = words.replace(/([\\?!\"\u201C\\.,;:@#$%&])/g, " $1 ");
    words = words.replace(/\\.\\.\\./g, " ... ");
    words = words.replace(/\\s+/g, SP);
    words = words.replace(/,([^0-9])/g, " , $1");
    words = words.replace(/([^.])([.])([\])}>\"'’]*)\\s*$/g, "$1 $2$3 ");
    words = words.replace(/([\[\](){}<>])/g, " $1 ");
    words = words.replace(/--/g, " -- ");
    words = words.replace(/$/g, SP);
    words = words.replace(/^/g, SP);
    words = words.replace(/([^'])' | '/g, "$1 ' ");
    words = words.replace(/ \u2018/g, " \u2018 ");
    words = words.replace(/'([SMD]) /g, " '$1 ");

    if (RiTa.SPLIT_CONTRACTIONS) {

      words = words.replace(/([Cc])an['’]t/g, "$1an not");
      words = words.replace(/([Dd])idn['’]t/g, "$1id not");
      words = words.replace(/([CcWw])ouldn['’]t/g, "$1ould not");
      words = words.replace(/([Ss])houldn['’]t/g, "$1hould not");
      words = words.replace(/ ([Ii])t['’]s/g, " $1t is");
      words = words.replace(/n['’]t /g, " not ");
      words = words.replace(/['’]ve /g, " have ");
      words = words.replace(/['’]re /g, " are ");

    }

    // "Nicole I. Kidman" gets tokenized as "Nicole I . Kidman"
    words = words.replace(/ ([A-Z]) \\./g, " $1. ");
    words = words.replace(/\\s+/g, SP);
    words = words.replace(/^\\s+/g, E);

    return trim(words).split(/\s+/);
  },

  untokenize: function(arr, delim) {

    delim = delim || SP;

    var thisPunct, lastPunct, thisQuote, lastQuote, thisComma, isLast,
      lastComma, punct = /^[,\.\;\:\?\!\)""“”\u2019‘`']+$/, dbug = 0,
      quotes = /^[\(""“”\u2019‘`']+$/, squotes = /^[\u2019‘`']+$/,
      apostrophes = /^[\u2019']+$/, afterQuote = false,
      withinQuote = arr.length && quotes.test(arr[0]),
      result = arr[0] || E, midSentence = false;


    for (var i = 1; i < arr.length; i++) {

      if (!arr[i]) continue;

      thisComma = arr[i] === ',';
      thisPunct = punct.test(arr[i]);
      thisQuote = quotes.test(arr[i]);
      lastComma = arr[i-1] === ',';
      lastPunct = punct.test(arr[i - 1]);
      lastQuote = quotes.test(arr[i -1]);
      lastEndWithS = arr[i-1].charAt(arr[i-1].length-1) === 's';
      isLast = (i == arr.length - 1);

      //if (arr[i]==="'" && arr[i-1]==='?')
      dbug&& console.log('before "'+arr[i]+'"',i, 'inquote? '+withinQuote,'thisPunct?',thisPunct,'thisQuote',thisQuote);

      if (thisQuote) {

        if (withinQuote) {

          // no-delim, mark quotation done
          afterQuote = true;
          withinQuote = false;
        }
        else if (!(apostrophes.test(arr[i]) && lastEndWithS)) {
          dbug&&console.log('set withinQuote=1');
          withinQuote = true;
          afterQuote = false;
          // if (lastPunct) {
            // dbug&&console.log('hit0', arr[i], arr[i-1]);
            result += delim;
          // }
        }

      } else if (afterQuote && !thisPunct) {

        result += delim;
        dbug&&console.log('hit1', arr[i]);
        afterQuote = false;

      } else if (lastQuote && thisComma) {

        midSentence = true;

      } else if (midSentence && lastComma) {

        result += delim;
        dbug&&console.log('hit2', arr[i]);
        midSentence = false;

      } else if ((!thisPunct && !lastQuote) || (!isLast && thisPunct && lastPunct)) {

        result += delim;
      }

      result += arr[i]; // add to result

      if (thisPunct && !lastPunct && !withinQuote && squotes.test(arr[i])) {

        dbug && console.log('hitnew', arr[i]);
        result += delim; // fix to #477
      }
    }

    return result.trim();
  },

  splitSentences: function(text, regex) {
    var misterless = text.replace(/(Mr|Mrs|Ms|Dr|Prof)\./g, "$1☁☃");
    var arr = misterless.match(/(\S.+?[.!?])(?=\s+|$)/g);
    if (arr) {
      var finishedArray = arr.map(function (item) {
        return item.replace(/☁☃/g, ".");
      });
      return finishedArray;
    }
    else {
      return [text];
    }
  },

  isAbbreviation: function(input, caseSensitive) {

    // Converts 'input' to Titlecase (1st letter upper, rest lower)
    var titleCase = function(input) {

      if (!input || !input.length) return input;
      return input.substring(0, 1).toUpperCase() + input.substring(1);
    };

    caseSensitive = caseSensitive || false;
    input = caseSensitive ? input : titleCase(input);

    return inArray(this.ABBREVIATIONS, input);
  },

  loadString: function(url, callback, linebreakChars) {

    var loadStringNode = function(url, callback, linebreakChars) {

      var data = '', lb = linebreakChars || BN,
        isUrl = /.+?:\/\/.+/.test(url), me = this;

      //log("Using Node for: "+url +" isUrl="+isUrl);

      if (isUrl) {

        var httpcb = function(response) {
          response.on('data', function(chunk) {
            data += chunk;
          });
          response.on('error', function(e) {
            throw e;
          });
          response.on('end', function() {
            data = data.toString('utf-8').replace(/[\r\n]+/g, lb).trim();
            me.fireDataLoaded(url, callback, data);
          });
        };

        var req = require('http').request(url, httpcb);
        req.on('socket', function(socket) { // shouldnt be needed

          socket.setTimeout(5000); // ?
          socket.on('timeout', function() {
            req.abort();
            throw Error("[RiTa] loadString timed-out and aborted request");
          });
        });

        req.end();

      } else {

        // try with node file-system
        var rq = require('fs');
        rq.readFile(url, function(e, data) {
          if (e || !data) {
            err("[Node] Error reading file: " + url + BN + e);
            throw e;
          }
          data = data.toString('utf-8').replace(/[\r\n]+/g, lb).trim();
          me.fireDataLoaded(url, callback, data);
        });
      }
      //return data;
    };

    ok(url, S);

    if (isNode()) {
      return loadStringNode.apply(this, arguments);
    }

    var me = this, res = '', lb = linebreakChars || BN,
      req = new XMLHttpRequest();

    req.addEventListener('error', function () {
      console.error('[RiTa] loadStrings() unable to load ' + url);
    });

    req.open('GET', url, true);
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        if (req.status === 200) {
          var ret = [];
          // remove blank lines
          var arr = req.responseText.match(/[^\r\n]+/g);
          for (var k in arr) {
            ret[k] = arr[k];
          }
          ret = ret.join(BN);
          me.fireDataLoaded(url, callback, ret);
          //callback(res);
        } else {
          console.error('[RiTa] loadString() unable to load: ' + url);
        }
      }
    };
    req.send(null);
    return res;
  },

  loadStrings: function(url, callback, linebreakChars) {

    var loadStringsNode = function(url, callback) {

      var data = '', isUrl = /.+?:\/\/.+/.test(url), me = this;

      function processResponse(data) {
        data = data.toString('utf-8').trim();
        var lines = data.split(/(\r\n|\n)/gm);
        me.fireDataLoaded(url, callback, lines);
      }
      //log("Using Node for: "+url +" isUrl="+isUrl);

      if (isUrl) {

        var httpcb = function(response) {
          response.on('data', function(chunk) {
            data += chunk;
          });
          response.on('error', function(e) {
            throw e;
          });
          response.on('end', function() {
            processResponse(data);
          });
        };

        var req = require('http').request(url, httpcb);
        req.on('socket', function(socket) { // shouldnt be needed

          socket.setTimeout(5000); // ?
          socket.on('timeout', function() {
            req.abort();
            throw Error("[RiTa] loadString timed-out and aborted request");
          });
        });
        req.end();

      } else {

        // try with node file-system
        var rq = require('fs');
        rq.readFile(url, function(e, data) {
          if (e || !data) {
            err("[Node] Error reading file: " + url + BN + e);
            throw e;
          }
          processResponse(data);
        });
      }
      //return data;
    };

    ok(url, S);

    if (isNode()) {
      return loadStringsNode.apply(this, arguments);
    }

    var me = this, res = '', lb = linebreakChars || BN,
      req = new XMLHttpRequest();

    req.addEventListener('error', function () {
      console.error('[RiTa] loadStrings() unable to load ' + url);
    });

    req.open('GET', url, true);
    req.onreadystatechange = function () {
      if (req.readyState === 4) {
        if (req.status === 200) {

          // remove blank lines
          var arr = req.responseText.match(/[^\r\n]+/g);
          var ret = [];
          for (var k in arr) {
            ret[k] = arr[k];
          }
          me.fireDataLoaded(url, callback, ret);
          //callback(res);
        } else {
          console.error('[RiTa] loadString() unable to load: ' + url);
        }
      }
    };
    req.send(null);
    return res;
  },

  fireDataLoaded: function(url, callback, data) {

    //log('fireDataLoaded: '+url, callback, data);
    return (callback) ? callback(data, url) :
      RiTaEvent({
        name: 'RiTaLoader',
        urls: is(url, S) ? [ url ] : url
      }, DATA_LOADED, data)._fire();
  },

  isQuestion: function(sentence) {

    var sentenceArr = RiTa.tokenize(sentence);

    for (var i = 0; i < QUESTION_STARTS.length; i++) {
      if (equalsIgnoreCase(sentenceArr[0], QUESTION_STARTS[i]))
        return true;
    }
    return false;
  },

  isSentenceEnd: function(currentWord, nextWord) {

    if (!is(currentWord, S) || !is(nextWord, S))
      return false;

    var cw = currentWord.charAt(0),
      cWL = currentWord.length;

    // token is a mid-sentence abbreviation (mainly, titles) --> middle of sent
    if (RiTa.isAbbreviation(currentWord))
      return false;

    if (cWL > 1 && cw.indexOf("`'\"([{<") != -1 && RiTa.isAbbreviation(currentWord.substring(1)))
      return false;

    if (cWL > 2 && ((currentWord.charAt(0) == '\'' && currentWord.charAt(1) == '\'') ||
      (currentWord.charAt(0) == '`' && currentWord.charAt(1) == '`')) &&
      RiTa.isAbbreviation(currentWord.substring(2)))
    {
      return false;
    }

    var nTL = nextWord.length,
      currentToken0 = currentWord.charAt(cWL - 1),
      currentToken1 = (cWL > 1) ? currentWord.charAt(cWL - 2) : SP,
      currentToken2 = (cWL > 2) ? currentWord.charAt(cWL - 3) : SP,
      nextToken0 = nextWord.charAt(0),
      nextToken1 = (nTL > 1) ? nextWord.charAt(1) : SP,
      nextToken2 = (nTL > 2) ? nextWord.charAt(2) : SP;

    // nextToken does not begin with an upper case,
    // [`'"([{<] + upper case, `` + upper case, or < -> middle of sent.
    if (!(nextToken0 == nextToken0.toUpperCase() ||
        (nextToken1 == nextToken1.toUpperCase() && nextToken0.indexOf("`'\"([{<") != -1) ||
        (nextToken2 == nextToken2.toUpperCase() && ((nextToken0 == '`' && nextToken1 == '`') ||
          (nextToken0 == '\'' && nextToken1 == '\''))) ||
        nextWord == "_" || nextToken0 == '<'))
      return false;

    // ends with ?, !, [!?.]["'}>)], or [?!.]'' -> end of sentence
    if (currentToken0 == '?' || currentToken0 == '!' ||
      (currentToken1.indexOf("?!.") != -1 && currentToken0.indexOf("\"'}>)") != -1) ||
      (currentToken2.indexOf("?!.") != -1 && currentToken1 == '\'' && currentToken0 == '\''))
      return true;

    // last char not "." -> middle of sentence
    if (currentToken0 != '.') return false;

    // Note: wont handle Q. / A. at start of sentence, as in a news wire
    //if (startOfSentence && (currentWord.equalsIgnoreCase("Q.")
    //|| currentWord.equalsIgnoreCase("A.")))return true;

    // single upper-case alpha + "." -> middle of sentence
    if (cWL == 2 && currentToken1 == currentToken1.toUpperCase())
      return false;

    // double initial (X.Y.) -> middle of sentence << added for ACE
    if (cWL == 4 && currentToken2 == '.' && (currentToken1 == currentToken1.toUpperCase() && currentWord.charAt(0) == currentWord.charAt(0).toUpperCase()))
      return false;

    return true;
  },

  isW_Question: function(sentence) {
    var sentenceArr = RiTa.tokenize((sentence));
    for (var i = 0; i < W_QUESTION_STARTS.length; i++)
      if (equalsIgnoreCase(sentenceArr[0], W_QUESTION_STARTS[i]))
        return true;
    return false;
  },

  unescapeHTML: function(input) {

    if (!input || !input.length) return input;

    var answer = input.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&").replace(/&quot;/g, "\"");

    String.fromCharCodePoint = function() { // uggh
      var codeunits = [];
      for (var i = 0; i < arguments.length; i++) {
        var c = arguments[i];
        if (arguments[i] < 0x10000) {
          codeunits.push(arguments[i]);
        } else if (arguments[i] < 0x110000) {
          c -= 0x10000;
          codeunits.push((c >> 10 & 0x3FF) + 0xD800);
          codeunits.push((c & 0x3FF) + 0xDC00);
        }
      }
      return String.fromCharCode.apply(String, codeunits);
    };

    answer = answer.replace(/&#(\d+);/g, function(_, n) {
      return String.fromCharCodePoint(parseInt(n, 10));
    }).replace(/&#x([0-9a-f]+);/gi, function(_, n) {
      return String.fromCharCodePoint(parseInt(n, 16));
    });

    return answer;
  },

  randomOrdering: function(num) {

    var o = [];
    if (num) {
      for (var z = 0; z < num; z++) o.push(z);
      // Array shuffle, from http://jsfromhell.com/array/shuffle
      for (var j, x, i = o.length; i; j = parseInt(Math.random() * i),
        x = o[--i], o[i] = o[j], o[j] = x) { /* no-op */ }
    }
    return o;
  },

  // Trims punctuation from each side of token
  //   (doesnt trim whitespace or internal punctuation).
  trimPunctuation: function(text) {

    if (!is(text,S)) return text;

    var s = '[�`~\"\/' + "\\'_\\-[\\]{}()*+!?%&.,\\\\^$|#@<>|+=;:\u2018\u2019\u201C\u201D]";
    var regex = new RegExp("^" + s + "+|" + s + "+$", 'g');

    return (text === E) ? E : text.replace(regex,E);
  },

  stripPunctuation: function(text) {
    return (text === E) ? E : text.replace(PUNCTUATION_CLASS,E);
  },

  isPunctuation: function(text) {
    if (!text || !text.length) return false;
    return ONLY_PUNCT.test(text);
  },

  hasPunctuation: function(text) {
    if (!text || !text.length) return false;
    return ONLY_PUNCT.test(text);
  },

  env: function() {
    return isNode() ? RiTa.NODE : RiTa.JS;
  },

  chomp: function(txt) {
    return txt.replace(/\s+$|^\s+/g,E);
  },

  getPhonemes: function(words) {
    return RiString(words).analyze().get(RiTa.PHONEMES);
  },

  getStresses: function(words) {
    return RiString(words).analyze().get(RiTa.STRESSES);
  },

  getSyllables: function(words) {
    return RiString(words).analyze().get(RiTa.SYLLABLES);
  },

  getWordCount: function(words) {
    return RiTa.tokenize(words).length;
  },

  stem: function(word, type) {

    type = type || 'Porter';

    if (type != 'Lancaster' && type != 'Porter' && type != 'Pling')
      err('Bad stemmer type: ' + type);

    if (word.indexOf(SP) < 0) return RiTa.stemmers[type](word);

    // remove non-words && white-space chars
    word = word.replace(/[^\w]/g, SP).replace(/\s+/g, SP);

    var res = [],
      words = word.split(SP);

    for (var i = 0; i < words.length; i++) {

      res.push(RiTa.stemmers[type](words[i]));
    }

    return res.join(SP);
  },

  /*
   * Takes pair of strings or string-arrays and returns the med
   * @param normalized based on max-length if 3rd (optional) parameter is true
   */
  minEditDistance: function(a, b, adjusted) {

    var func = adjusted ? MinEditDist.computeAdjusted : MinEditDist.computeRaw;
    return func.call(MinEditDist, a, b);
  }

}; // end RiTa object

// set feature names (PHONEMES, SYLLABLES, etc.) as RiTa constants
for (var i = 0; i < FEATURES.length; i++) {
  RiTa[FEATURES[i].toUpperCase()] = FEATURES[i];
}

var RiLexicon = makeClass();

RiLexicon.SILENCE_LTS = false;

RiLexicon.prototype = {

  init: function() {

    if (typeof _dict === 'undefined') {
      this.data = {};
      this.keys = [];
    }
    else
      this.reload();
  },

  clear: function() {

    this.data = {};
    this.keys = [];
  },

  reload: function() {
    if (typeof _dict != 'undefined') {
        this.data = _dict();
        this.keys = okeys(this.data); // cache
    }
  },

  addWord: function(word, pronunciationData, posData) {

    this.data[word.toLowerCase()] = [
      pronunciationData.toLowerCase(),
      posData.toLowerCase()
    ];
    this.keys = okeys(this.data);
    return this;
  },

  similarByLetter: function(input, minAllowedDist, preserveLength) {

    var minVal = Number.MAX_VALUE,
      minLen = 2,
      result = [];

    if (!(input && input.length)) return EA;

    if (arguments.length == 2 && is(minAllowedDist,B))  { // (input, preserveLength)
      preserveLength = minAllowedDist;
      minAllowedDist = 1;
    }

    input = input.toLowerCase();
    minAllowedDist = minAllowedDist || 1;
    preserveLength = preserveLength || false;

    var med, inputS = input + 's',
      inputES = input + 'es',
      inputLen = input.length;

    for (var i = 0; i < this.size(); i++) {

      var entry = this.keys[i];

      if (entry.length < minLen)
        continue;

      if (preserveLength && (entry.length != inputLen))
        continue;

      if (entry === input || entry === inputS || entry === inputES)
        continue;

      med = MinEditDist.computeRaw(entry, input);

      // we found something even closer
      if (med >= minAllowedDist && med < minVal) {

        minVal = med;
        result = [entry];
      }

      // we have another best to add
      else if (med === minVal) {

        result.push(entry);
      }
    }

    return result;
  },

  similarBySound: function(input, minEditDist, minimumWordLen) {

    minEditDist = minEditDist || 1;

    var minVal = Number.MAX_VALUE,
      entry, result = [], minLen = minimumWordLen || 2,
      phonesArr, phones = RiTa.getPhonemes(input), med,
      targetPhonesArr = phones ? phones.split('-') : [],
      input_s = input + 's', input_es = input + 'es';

    if (!targetPhonesArr[0] || !(input && input.length)) return EA;

    //console.log("TARGET "+targetPhonesArr);

    for (var i = 0; i < this.size(); i++) {

      entry = this.keys[i];

      if (entry.length < minLen) continue;

      // entry = entry.toLowerCase(); // all lowercase

      if (entry === input || entry === input_s || entry === input_es)
        continue;

      phones = this.data[entry][0];
      //if (i<10) console.log(phones+" :: "+);
      phonesArr = phones.replace(/1/g, E).replace(/ /g, '-').split('-');

      med = MinEditDist.computeRaw(phonesArr, targetPhonesArr);

      // found something even closer
      if (med >= minEditDist && med < minVal) {

        minVal = med;
        result = [entry];
        //console.log("BEST "+entry + " "+med + " "+phonesArr);
      }

      // another best to add
      else if (med === minVal) {

        //console.log("TIED "+entry + " "+med + " "+phonesArr);
        result.push(entry);
      }
    }

    return result;
  },

  similarBySoundAndLetter: function(word) {

    function intersect() { // https://gist.github.com/lovasoa/3361645
      var i, all, n, len, ret = [], obj={}, shortest = 0,
        nOthers = arguments.length-1, nShortest = arguments[0].length;
      for (i=0; i<=nOthers; i++){
        n = arguments[i].length;
        if (n < nShortest) {
          shortest = i;
          nShortest = n;
        }
      }
      for (i=0; i <= nOthers; i++) {
        n = (i ===  shortest)? 0 : (i || shortest);
        len = arguments[n].length;
        for (var j=0; j < len; j++) {
          var elem = arguments[n][j];
          if (obj[elem] === i - 1) {
            if (i === nOthers) {
              ret.push(elem);
              obj[elem] = 0;
            } else {
              obj[elem] = i;
            }
          } else if (i === 0) {
            obj[elem] = 0;
          }
        }
      }
      return ret;
    }

    var result = [], simSound, simLetter = this.similarByLetter(word);

    if (simLetter.length < 1)
      return result;

    simSound = this.similarBySound(word);

    if (simSound.length < 1)
      return result;

    return intersect(simSound, simLetter);
  },

  substrings: function(word, minLength) {

    minLength = minLength || (minLength === 0) || 4;

    var result = [];
    for (var i = 0; i < this.size(); i++) {

      if (this.keys[i] === word || this.keys[i].length < minLength)
        continue;
      if (word.indexOf(this.keys[i]) >= 0)
        result.push(this.keys[i]);
    }

    return result;
  },

  superstrings: function(word) {

    var result = [];

    for (var i = 0; i < this.size(); i++) {

      if (this.keys[i] === word) continue;
      if (this.keys[i].indexOf(word) >= 0)
        result.push(this.keys[i]);
    }

    return result;
  },

  words: function() {

    var a = arguments,
      shuffled = false,
      regex, wordArr = [];

    switch (a.length) {

      case 2:

        if (is(a[0], B)) {

          shuffled = a[0];
          regex = (is(a[1], R)) ? a[1] : new RegExp(a[1]);
        } else {

          shuffled = a[1];
          regex = (is(a[0], R)) ? a[0] : new RegExp(a[0]);
        }

        break;

      case 1:

        if (is(a[0], B)) {
          return a[0] ? shuffle(this.keys) : this.keys;
        }

        regex = (is(a[0], R)) ? a[0] : new RegExp(a[0]);

        break;

      case 0:

        return this.keys;
    }

    for (var i = 0; i < this.size(); i++) {

      if (regex.test(this.keys[i])) {

        wordArr.push(this.keys[i]);
      }
    }

    return shuffled ? shuffle(wordArr) : wordArr;
  },

  _isVowel: function(c) {

    return (strOk(c) && RiTa.VOWELS.indexOf(c) > -1);
  },

  _isConsonant: function(p) {

    return (typeof p === S && p.length === 1 &&
      RiTa.VOWELS.indexOf(p) < 0 && /^[a-z\u00C0-\u00ff]+$/.test(p));
  },

  _isPlural: function(word) {

    if (NULL_PLURALS.applies(word))
      return true;

    var stem = RiTa.stem(word, 'Pling');
    if (stem === word)
      return false;

    var sing = RiTa.singularize(word);
    var data = this.data[sing];

    if (data && data.length === 2) {
      var pos = data[1].split(SP);
      for (var i = 0; i < pos.length; i++) {
        if (pos[i] === 'nn')
          return true;
      }

    } else if (word.endsWith("ses") || word.endsWith("zes")) {

      sing = word.substring(0, word.length - 1);
      data = this.data[sing];
      if (data && data.length === 2) {
          var pos = data[1].split(SP);
          for (var i = 0; i < pos.length; i++) {
              if (pos[i] === 'nn')
                  return true;
          }
      }
    }
    return false;
  },

  containsWord: function(word) {

    if (!this.data || !strOk(word)) return false;
    word = word.toLowerCase();
    return this.data[word] || this._isPlural(word);
  },

  isRhyme: function(word1, word2, useLTS) {
    var phones1 = this._getRawPhones(word1, useLTS),
        phones2 = this._getRawPhones(word2, useLTS);

    if (!strOk(word1) || !strOk(word2) || equalsIgnoreCase(word1, word2) || phones2 === phones1)
      return false;

    var p1 = this._lastStressedVowelPhonemeToEnd(word1, useLTS),
      p2 = this._lastStressedVowelPhonemeToEnd(word2, useLTS);

    return (strOk(p1) && strOk(p2) && p1 === p2);
  },

  rhymes: function(word) {

      var p = this._lastStressedPhoneToEnd(word),
        phones, results = [];

      for (var i = 0; i < this.size(); i++) {

        if (this.keys[i] === word)
          continue;

        phones = this.data[this.keys[i]][0];

        if (endsWith(phones, p))
          results.push(this.keys[i]);
      }
      return (results.length > 0) ? results : EA;


    return EA;
  },

  alliterations: function(word, matchMinLength, useLTS) {

    if (word.indexOf(" ") > -1) return [];

    if (this._isVowel(word.charAt(0))) return [];


    matchMinLength = matchMinLength || 4;

    var c2, results = [],
      c1 = this._firstPhoneme(this._firstStressedSyllable(word, useLTS));

    for (var i = 0; i < this.size(); i++) {

      c2 = this._firstPhoneme(
          this._firstStressedSyllable(this.keys[i], useLTS));

      if(c2._isVowel) return [];

      if (c2 && c1 === c2 && this.keys[i].length >= matchMinLength) {
        results.push(this.keys[i]);
      }
    }

    return shuffle(results);
  },

  isAlliteration: function(word1, word2, useLTS) {

    if (!strOk(word1) || !strOk(word2) || word1.indexOf(" ") > -1 || word2.indexOf(" ") > -1)
      return false;

    var c1 = this._firstPhoneme(this._firstStressedSyllable(word1, useLTS)),
      c2 = this._firstPhoneme(this._firstStressedSyllable(word2, useLTS));

    if (this._isVowel(c1.charAt(0)) || this._isVowel(c2.charAt(0)))
      return false;

    return strOk(c1) && strOk(c2) && c1 === c2;
  },

  _firstSyllable: function(word, useLTS) {
     var raw = this._getRawPhones(word, useLTS);
     if (!strOk(raw)) return E;
     if(word === "URL") console.log(raw);
     var syllables = raw.split(" ");
     return syllables[0];
  },

  _firstStressedSyllable: function(word, useLTS) {

    var raw = this._getRawPhones(word, useLTS),
      idx = -1, c, firstToEnd;

    if (!strOk(raw)) return E; // return null?

    idx = raw.indexOf(RiTa.STRESSED);

    if (idx < 0) return E; // no stresses... return null?

    c = raw.charAt(--idx);

    while (c != ' ') {
      if (--idx < 0) {
        // single-stressed syllable
        idx = 0;
        break;
      }
      c = raw.charAt(idx);
    }

    firstToEnd = idx === 0 ? raw : trim(raw.substring(idx));
    idx = firstToEnd.indexOf(' ');

    return idx < 0 ? firstToEnd : firstToEnd.substring(0, idx);
  },

  isVerb: function(word) {

    return this._checkType(word, PosTagger.VERBS);
  },

  isNoun: function(word) {

    var result = this._checkType(word, PosTagger.NOUNS);
    if (!result) {
      var singular = RiTa.singularize(word);
      if (singular !== word) {
        result = this._checkType(singular, PosTagger.NOUNS);
      }
    }
    return result;
  },

  isAdverb: function(word) {

    return this._checkType(word, PosTagger.ADV);
  },

  isAdjective: function(word) {

    return this._checkType(word, PosTagger.ADJ);
  },

  size: function() {
    var s = this.keys.length;
    if (RiTa.LEX_WARN && s === 0) {
      warn(RiTa.LEX_WARN);
      RiTa.LEX_WARN = 0;
    }
    return s;
  },

  _checkType: function(word, tagArray) {

    if (word && word.indexOf(SP) != -1)
      throw Error("[RiTa] _checkType() expects a single word, found: " + word);

    var psa = this._getPosArr(word);
    if (RiTa.LEX_WARN && psa.length < 1 && this.size() <= 1000) {
      warn(RiTa.LEX_WARN);
      RiTa.LEX_WARN = 0; // only once
    }

    for (var i = 0; i < psa.length; i++) {
      if (tagArray.indexOf(psa[i]) > -1)
        return true;
    }

    return false;
  },

  _getSyllables: function(word) {

    // TODO: use feature cache?
    if (!strOk(word)) return E;

    var wordArr = RiTa.tokenize(word), raw = [];
    for (var i = 0; i < wordArr.length; i++)
      raw[i] = this._getRawPhones(wordArr[i]).replace(/\s/g, '/');
    // console.log("[RiTa] syllables" + " " + word + " " + raw);
    return RiTa.untokenize(raw).replace(/1/g, E).trim();
  },

  _getPhonemes: function(word) {

    if (!strOk(word)) return E;

    var wordArr = RiTa.tokenize(word), raw = [];

    for (var i = 0; i < wordArr.length; i++) {

      if (RiTa.isPunctuation(wordArr[i])) continue;

      raw[i] = this._getRawPhones(wordArr[i]);

      if (!raw[i].length) return E;

      raw[i] = raw[i].replace(/ /g, "-");
    }

    return RiTa.untokenize(raw).replace(/1/g, E).trim();
  },

  _getStresses: function(word) {

    var i, stresses = [], phones, raw = [],
      wordArr = is(word, A) ? word : RiTa.tokenize(word);

    if (!strOk(word)) return E;

    for (i = 0; i < wordArr.length; i++) {

      if (!RiTa.isPunctuation(wordArr[i]))
        raw[i] = this._getRawPhones(wordArr[i]);
    }

    for (i = 0; i < raw.length; i++) {

      if (raw[i]) { // ignore undefined array items (eg Punctuation)

        phones = raw[i].split(SP);
        for (var j = 0; j < phones.length; j++) {

          var isStress = (phones[j].indexOf(RiTa.STRESSED) > -1) ?
            RiTa.STRESSED : RiTa.UNSTRESSED;

          if (j > 0) isStress = "/" + isStress;

          stresses.push(isStress);
        }
      }
    }

    return stresses.join(SP).replace(/ \//g, "/");
  },

  lexicalData: function(dictionaryDataObject) {

    if (arguments.length === 1) {
      this.data = dictionaryDataObject;
      return this;
    }

    return this.data;
  },

  /* Returns the raw (RiTa-format) dictionary entry for the given word   */
  _lookupRaw: function(word) {

    word = word && word.toLowerCase();
    if (this.data && this.data[word])
      return this.data[word];
    //log("[RiTa] No lexicon entry for '" + word + "'");
  },

  _getRawPhones: function(word, useLTS) {

    var phones, lts, rdata = this._lookupRaw(word);
    useLTS = useLTS || false;

    if (rdata === undefined || (useLTS && !RiTa.SILENT && !RiLexicon.SILENCE_LTS)) {

      lts = this._letterToSound();
      phones = lts && lts.getPhones(word);
      if (phones && phones.length)
        return RiString._syllabify(phones);

    }
    return (rdata && rdata.length === 2) ? rdata[0] : E;
  },

  _getPosData: function(word) {

    var rdata = this._lookupRaw(word);
    return (rdata && rdata.length === 2) ? rdata[1] : E;
  },


  _getPosArr: function(word) {

    var pl = this._getPosData(word);
    if (!strOk(pl)) return EA;
    return pl.split(SP);
  },

  _getBestPos: function(word) {

    var pl = this._getPosArr(word);
    return (pl.length > 0) ? pl[0] : [];
  },

  _firstPhoneme: function(rawPhones) {

    if (!strOk(rawPhones)) return E;

    var phones = rawPhones.split(RiTa.PHONEME_BOUNDARY);

    if (phones) return phones[0];

    return E; // return null?
  },

  _firstConsonant: function(rawPhones) {

    if (!strOk(rawPhones)) return E;

    var phones = rawPhones.split(RiTa.PHONEME_BOUNDARY);

    if (phones) {

      for (var j = 0; j < phones.length; j++) {
        if (this._isConsonant(phones[j].charAt(0))) // first letter only
          return phones[j];
      }
    }
    return E; // return null?
  },

  _lastStressedVowelPhonemeToEnd: function(word, useLTS) {

    if (!strOk(word)) return E; // return null?


    var raw = this._lastStressedPhoneToEnd(word, useLTS);
    if (!strOk(raw)) return E; // return null?

    var syllables = raw.split(" ");
    var lastSyllable = syllables[syllables.length - 1];
    lastSyllable = lastSyllable.replace("[^a-z-1 ]", "");

    var idx = -1;
    for (var i = 0; i < lastSyllable.length; i++) {
      var c = lastSyllable.charAt(i);
      if(this._isVowel(c)){
        idx = i;
        break;
      }
    }
  word + " " + raw + " last:" + lastSyllable + " idx=" + idx + " result:" + lastSyllable.substring(idx)
   return lastSyllable.substring(idx);
  },

  _lastStressedPhoneToEnd: function(word, useLTS) {

    if (!strOk(word)) return E; // return null?

    var idx, c, result;
    var raw = this._getRawPhones(word, useLTS);

    if (!strOk(raw)) return E; // return null?

    idx = raw.lastIndexOf(RiTa.STRESSED);

    if (idx < 0) return E; // return null?

    c = raw.charAt(--idx);
    while (c != '-' && c != ' ') {
      if (--idx < 0) {
        return raw; // single-stressed syllable
      }
      c = raw.charAt(idx);
    }
    result = raw.substring(idx + 1);

    return result;
  },

  randomWord: function() { // takes nothing, pos, syllableCount, or both

    var i, j, rdata, numSyls, pluralize = false,
      ran = Math.floor(Math.random() * this.size()),
      found = false, a = arguments, words = this.keys;

    if (typeof a[0] === "string") {

        a[0] = trim(a[0]).toLowerCase();

        pluralize = (a[0] === "nns");

        if (a[0] === "v")
            a[0] = "vb";
        if (a[0] === "r")
            a[0] = "rb";
        if (a[0] === "a")
            a[0] = "jj";
        if (a[0] === "n" || a[0] === "nns") {
            a[0] = "nn";
        }
    }

    switch (a.length) {

      case 2: // a[0]=pos  a[1]=syllableCount


        for (i = 0; i < words.length; i++) {
          j = (ran + i) % words.length;
          rdata = this.data[words[j]];
          numSyls = rdata[0].split(SP).length;
          if (numSyls === a[1] && a[0] === rdata[1].split(SP)[0]) {
            return pluralize ? RiTa.pluralize(words[j]) : words[j];
          }
        }

        //warn("No words with pos=" + a[0] + " found");

      case 1:

        if (is(a[0], S)) { // a[0] = pos

          for (i = 0; i < words.length; i++) {
            j = (ran + i) % words.length;
            rdata = this.data[words[j]];
            if (a[0] === rdata[1].split(SP)[0]) {
              return pluralize ? RiTa.pluralize(words[j]) : words[j];
            }
          }

          //warn("No words with pos=" + a[0] + " found");

        } else {

          // a[0] = syllableCount
          for (i = 0; i < words.length; i++) {
            j = (ran + i) % words.length;
            rdata = this.data[words[j]];
            if (rdata[0].split(SP).length === a[0]) {
              return words[j];
            }
          }
        }
        return E;

      case 0:
        return words[ran];
    }

    return E;
  },

  _letterToSound: function() { // lazy load
    if (!this.lts) {
      if (typeof LetterToSound !== 'undefined')
        this.lts = new LetterToSound();
    }
    return this.lts;
  }

};

var RiMarkov = makeClass();

RiMarkov.MAX_GENERATION_ATTEMPTS = 5000;
var SSRE = /"?[A-Z][a-z"',;`-]*/;
var SSDLM = 'D=l1m_';

RiMarkov.prototype = {

  init: function(nFactor, recognizeSentences, allowDuplicates) {

    var a = this._initArgs.apply(this, arguments);

    ok(a[0], N);

    this.N = a[0];
    this.rawText = '';
    this.pathTrace = [];
    //this.sentenceList = [];
    this.sentenceStarts = [];
    this.minSentenceLength = 6;
    this.maxSentenceLength = 35;
    this.root = new TextNode(null, 'ROOT');
    this.isSentenceAware = (a.length > 1 && !a[1]) ? false : true;
    this.allowDuplicates = (a.length > 2 && !a[2]) ? false : true;
    //this.maxMatchingSequence = this.N + 1;
    this.printIgnoredText = false;
  },

  _initArgs: function() {

    var a = arguments, t = get(a[0]);
    // recurse, ignore 'this'
    if (a.length && (t === O || t === 'global' || t === 'window'))
      return this._initArgs.apply(this, Array.prototype.slice.call(a, 1));
    return a;
  },

  getProbability: function(data) {

    if (!this.root) err("Model not initd: null root!");

    var tn = is(data, S) ? this.root.lookup(data) : this._findNode(data);

    return (tn) ? tn.probability() : 0;

  },

  getProbabilities: function(path) {

    if (is(path, S)) path = [path];

    if (path.length > this.N) {

      path = path.slice(Math.max(0, path.length - (this.N - 1)), path.length);
    }

    var probs = {},
      tn = this._findNode(path);

    if (!tn) return {};

    var nexts = tn.childNodes();
    for (var i = 0; i < nexts.length; i++) {
      var node = nexts[i];
      if (node) {
        probs[node.token] = node.probability();
      }
    }

    return probs;
  },

  getCompletions: function(pre, post) {

    var tn, result = [],
      node, atest, nexts;

    if (post) { // fill the center

      if (pre.length + post.length > this.N) {

        err('Sum of pre.length && post.length must be < N, was '
          + (pre.length + post.length));
      }

      tn = this._findNode(pre);
      if (!tn) return null;

      nexts = tn.childNodes();
      for (var i = 0; i < nexts.length; i++) {

        node = nexts[i];

        atest = pre.slice(0); // clone

        atest.push(node.token);

        for (var j = 0; j < post.length; j++)
          atest.push(post[j]);

        if (this._findNode(atest)) result.push(node.token);
      }

      return result;

    } else { // fill the end

      var hash = this.getProbabilities(pre);
      return okeys(hash).sort(function(a, b) {
        return hash[b] - hash[a];
      });
    }
  },

  generateUntil: function(regex, minLength, maxLength) {

    minLength = minLength || 1;
    maxLength = maxLength || Number.MAX_VALUE;

    var mn, tokens, tries = 0, maxTries = 999;

    OUT: while (++tries < maxTries) {

      // generate the min number of tokens
      tokens = this.generateTokens(minLength);

      // keep adding one and checking until we pass the max
      while (tokens.length < maxLength) {

        mn = this._nextNodeForArr(tokens);

        if (!mn || !mn.token)
          continue OUT; // fail, restart

        tokens.push(mn.token);

        // check against our regex
        if (mn.token.search(regex) > -1)
          return tokens;
      }
    }

    // uh-oh, we failed
    if (tries >= maxTries)
      err(BN+"RiMarkov failed to complete after " + tries + " attempts." +
      "You may need to add more text to your model..."+BN);

    return tokens;

  },

  generateTokens: function(targetNumber) {

    var mn, tries = 0, maxTries = 500, tokens = [], res = [];

    OUT: while (++tries < maxTries) {

      mn = this.root.selectChild(null, true);
      if (!mn || !mn.token) continue OUT;
      tokens.push(mn);

      while (tokens.length < targetNumber) {

        mn = this._nextNodeForArr(tokens);
        if (!mn || !mn.token) { // hit the end
          tokens = []; // start over
          continue OUT;
        }

        tokens.push(mn);
      }

      break;
    }

    // uh-oh, looks like we failed...
    if (tokens.length < targetNumber) {

      this._onGenerationIncomplete(tries, tokens.length);
    }

    for (var i = 0; i < tokens.length; i++) {
      res.push(tokens[i].token);
    }

    return res;
  },

  sentenceAware: function() {

    if (arguments.length > 0)
      throw Error('sentenceAware() takes no arguments, instead ' +
        'use the constructor RiMarkov(n, recognizeSentences);');
    return this.isSentenceAware;
  },

  print: function() {

    if (console) console.log(this.root.asTree(false));
    return this;
  },

  ready: function(url) {
    return this.size() > 0;
  },

  loadFrom: function(url, multiplier, regex, callback) {

    var me = this;

    is(url, S) || ok(url, A);

    if (is(multiplier, F)) {
      callback = multiplier;
      multiplier = undefined;
    }
    else if (is(regex, F)) {
      callback = regex;
      regex = undefined;
    }

    RiTa.loadStrings(url, function(data) {

      data = data.join(BN);
      me.loadText(data, multiplier, regex);
      callback && is(callback, F) && (callback(data));
    });
  },

  loadText: function(text, multiplier, regex, progress) {

    //log("loadText: "+text.length + " "+this.isSentenceAware);

    ok(text, S);

    this.rawText += text;

    multiplier = Math.round(multiplier || 1);

    var result = !this.isSentenceAware ?
      this.loadTokens(RiTa.tokenize(text, regex), multiplier) :
      this._loadSentences(text, multiplier, progress);

    return result;
  },

  loadTokens: function(tokens, multiplier) {

    multiplier = Math.round(multiplier || 1);

    this.root.count += tokens.length; // here?

    for (var toAdd, k = 0; k < tokens.length; k++) {
      toAdd = [];

      for (var j = 0; j < this.N; j++) {
        if ((k + j) < tokens.length)
          toAdd[j] = (tokens[k + j]) ? tokens[k + j] : null;
        else
          toAdd[j] = null;
      }

      // hack to deal with multiplier...
      for (var l = 0; l < multiplier; l++) {

        var node = this.root;
        for (var i = 0; i < toAdd.length; i++) {
          if (node.token) {
            node = node.addChild(toAdd[i], 1);
          }
        }
      }
    }

    return this;
  },

  generateSentence: function() {

    return this.generateSentences(1)[0];
  },

  generateSentences: function(num) {

    if (!this.isSentenceAware) {
      err('generateSentences() can only be called when the model is ' +
        'in \'sentence-aware\' mode, otherwise use generateTokens()');
    }

    var mn = this._getSentenceStart(),
      s = mn.token + SP, result = [], tries = 0,
      totalTries = 0, wordsInSentence = 1;

    while (result.length < num) {

      if (wordsInSentence >= this.maxSentenceLength) { // too long: restart
        mn = this._getSentenceStart();
        s = mn.token + SP;
        wordsInSentence = 1;
      }

      if (mn.isLeaf()) {
        mn = this._tracePathFromRoot(mn);
        continue;
      }

      mn = this._nextNodeForNode(mn);

      if (mn.isSentenceStart) {

        if (wordsInSentence >= this.minSentenceLength) {

          var candidate = RiTa.untokenize(s.trim().split(/\s+/));

          // deals with incorrect output: "word( next" -> "word (next"
          candidate = candidate.replace(/(.)\( /, "$1 ("); // added DCH: 5/2/14

          if (this._validateSentence(candidate)) {

            // got one, store and reset the counters
            if (result.indexOf(candidate) < 0)
              result.push(candidate);

            //log(result.length+" RESULTS SO FAR");
            totalTries += tries;
            tries = 0;
          }
        }

        mn = this._getSentenceStart();
        s = mn.token + SP;
        wordsInSentence = 1;
        continue;
      }

      // add the next word
      wordsInSentence++;
      s += mn.token + SP;

      // check if its time to give up
      if (++tries >= RiMarkov.MAX_GENERATION_ATTEMPTS) {

        this._onGenerationIncomplete(totalTries += tries, result.length);
        break; // give-up
      }
    }

    return result;
  },

  _validateSentence: function(sent) {

    var tokens = RiTa.tokenize(sent),
      first = tokens[0],
      last = tokens[tokens.length - 1];

    if (!first.match(/[A-Z]\S*/)) {
      if (this.printIgnoredText)
        log("Skipping: bad first char in '" + sent + "'");
      return false;
    }

    if (!last.match(/[!?.]/)) {
      if (this.printIgnoredText)
        log("Bad last token: '" + last + "' in: " + sent);
      return false;
    }

    if (!this.allowDuplicates) {

      if (!this.isSentenceAware) {
        err('Invalid state: allowDuplicates must be' +
          ' true when not generating sentences');
      }

      if (this.rawText.indexOf(sent) > -1) {

        if (++this.skippedDups >= RiMarkov.MAX_GENERATION_ATTEMPTS) {
          // TODO: NEVER CALLED, add warning here?
          this.allowDuplicates = true;
          this.skippedDups = 0;
        }

        if (this.printIgnoredText)
          console.log('Ignoring duplicate: ' + sent);

        return false;
      }
    }

    var words = sent.split(/\s+/);
    if (RiTa.isAbbreviation(words[words.length - 1])) {
      //log("BAD SENTENCE: "+sent);
      return false;
    }

    return true;
  },

  _tracePathFromRoot: function(node) {

    node.pathFromRoot(this.pathTrace);

    this.pathTrace.pop(); // ignore the first element
    var mn = this.root;
    while (this.pathTrace.length) {
      var search = this.pathTrace.pop();
      mn = mn.lookup(search);
    }

    return mn;
  },

  _nextNodeForArr: function(previousTokens) {

    // Follow the seed path down the tree
    var firstLookupIdx = Math.max(0, previousTokens.length - (this.N - 1)),
      node = this.root.lookup(previousTokens[firstLookupIdx++]);

    for (var i = firstLookupIdx; i < previousTokens.length; i++) {

      if (node) node = node.lookup(previousTokens[i]);
    }

    // Now select the next node
    return node ? node.selectChild(null, true) : null;
  },

  _nextNodeForNode: function(current) {

    var attempts = 0,
      selector, pTotal = 0,
      nodes = current.childNodes(),
      maxProbMisses = 1000;

    while (true) {

      pTotal = 0;
      selector = Math.random();
      for (var i = 0, j = nodes.length; i < j; i++) {

        pTotal += nodes[i].probability();
        if (current.isRoot() && (this.isSentenceAware && !nodes[i].isSentenceStart)) {
          continue;
        }
        if (selector < pTotal) {
          return nodes[i];
        }
      }

      attempts++;
      warn('Prob. miss (#\'+attempts+\') in RiMarkov.nextNode().' +
        ' Make sure there are a sufficient\n       # of sentences' +
        ' in the model that are longer than \'minSentenceLength\'');

      if (attempts == maxProbMisses) // should never happen
        err('PROB. MISS' + current + ' total=' + pTotal + ' selector=' + selector);
    }
  },

  _clean: function(sentence) {

    return RiTa.trim(sentence.replace(/\s+/, SP));
  },

  _onGenerationIncomplete: function(tries, successes) {

    warn(BN+'RiMarkov failed to complete after ' + tries +
      ' tries and ' + successes + ' successful generations.' +
      ' You may need to add more text to the model...'+BN);
  },

  // Loads a sentence[] into the model; each element must be a single sentence
  _loadSentences: function(text, multiplier, progress) {

    var i, j, toAdd, tokens, allWords = [],
      sentences = RiTa.splitSentences(text),
      mult = Math.round(multiplier || 1);

    // Clean sentences and add valid starters
    for (i = 0; i < sentences.length; i++) {

      tokens = RiTa.tokenize(this._clean(sentences[i]));

      if (!this._validSentenceStart(tokens[0])) {

        if (this.printIgnoredText) {
          warn("Skipping (bad sentence start): " + tokens);
        }
        continue;
      }

      //log("Added sentence start] " + tokens);

      allWords.push(SSDLM + tokens[0]); // hack for sentence-starts

      for (j = 1; j < tokens.length; j++) {
        allWords.push(tokens[j]);
      }
    }

    // Add word sequences to the model
    for (i = 0; i < allWords.length; i++) {
      toAdd = [];
      for (j = 0; j < this.N; j++) {
        if ((i + j) < allWords.length) {
          toAdd[j] = allWords[i + j];
        }
      }

      // hack to deal with multiplier...
      for (j = 0; j < mult; j++) {
        this._addSentenceSequence(toAdd);
      }

      if (progress && (!(i % 10000))) {
        printProgress('Building model: ', parseInt(((i/allWords.length)*1000))/10);
      }
    }
    progress && printProgress('Building model: ', 100, 0);

    this.root.count += allWords.length;

    return this;
  },

  size: function() {

    return this.root.count;
  },

  _validSentenceStart: function(word) {

    return (!this.isSentenceAware || word && word.match(SSRE));
  },

  _addSentenceSequence: function(toAdd) {

    var node = this.root;

    for (var i = 0; i < toAdd.length; i++) {

      if (!toAdd[i] || !node.token) continue;

      var add = toAdd[i];

      if (startsWith(add, SSDLM)) {

        add = add.substring(SSDLM.length);

        var parent = node;
        node = node.addChild(add, 1);
        node.isSentenceStart = true;

        if (parent.isRoot()) {
          this.sentenceStarts.push(node.token);
        }

      } else {

        node = node.addChild(add, 1);
      }
    }
  },

  _getSentenceStart: function() {

    if (!this.isSentenceAware) {
      err("getSentenceStart() can only " +
        "be called when the model is in 'sentence-aware' mode...");
    }

    if (!this.sentenceStarts || !this.sentenceStarts.length)
      err('No sentence starts found! genSen=' + this.isSentenceAware);

    return this.root.lookup(RiTa.randomItem(this.sentenceStarts));
  },

  _findNode: function(path) {

    if (!path || !is(path, A) || !path.length)
      return null;

    var nFactor = this.N;
    var numNodes = Math.min(path.length, nFactor - 1);
    var firstLookupIdx = Math.max(0, path.length - (nFactor - 1));
    var node = this.root.lookup(path[firstLookupIdx++]);

    if (!node) return null;

    var idx = 0; // found at least one good node
    var nodes = [];
    nodes[idx++] = node;
    for (var i = firstLookupIdx; i < path.length; i++) {
      node = node.lookup(path[i]);
      if (!node) return null;
      nodes[idx++] = node;
    }

    return nodes ? nodes[nodes.length - 1] : null;
  }
};

var RiWordNet = function() { // stub
    throw Error("RiWordNet is not yet implemented in JavaScript!");
};

var RiString = makeClass();

RiString._phones = {
  consonants: ['b', 'ch', 'd', 'dh', 'f', 'g', 'hh', 'jh', 'k', 'l', 'm',
    'n', 'ng', 'p', 'r', 's', 'sh', 't', 'th', 'v', 'w', 'y', 'z', 'zh'
  ],
  vowels: ['aa', 'ae', 'ah', 'ao', 'aw', 'ax', 'ay', 'eh', 'er', 'ey', 'ih',
    'iy', 'ow', 'oy', 'uh', 'uw'
  ],
  onsets: ['p', 't', 'k', 'b', 'd', 'g', 'f', 'v', 'th', 'dh', 's', 'z',
    'sh', 'ch', 'jh', 'm', 'n', 'r', 'l', 'hh', 'w', 'y', 'p r', 't r',
    'k r', 'b r', 'd r', 'g r', 'f r', 'th r', 'sh r', 'p l', 'k l', 'b l',
    'g l', 'f l', 's l', 't w', 'k w', 'd w', 's w', 's p', 's t', 's k',
    's f', 's m', 's n', 'g w', 'sh w', 's p r', 's p l', 's t r', 's k r',
    's k w', 's k l', 'th w', 'zh', 'p y', 'k y', 'b y', 'f y', 'hh y',
    'v y', 'th y', 'm y', 's p y', 's k y', 'g y', 'hh w', ''
  ],
  digits: ['z-ih-r-ow', 'w-ah-n', 't-uw', 'th-r-iy', 'f-ao-r', 'f-ay-v',
    's-ih-k-s', 's-eh1-v-ax-n', 'ey-t', 'n-ih-n'
  ]
};

RiString._syllabify = function(input) { // adapted from FreeTTS

  // Takes a syllabification and turns it into a string of phonemes,
  // delimited with dashes, with spaces between syllables
  var stringify = function(syllables) {

    var i, j, ret = [];
    for (i = 0; i < syllables.length; i++) {

      var syl = syllables[i],stress = syl[0][0],
        onset = syl[1],nucleus = syl[2],coda = syl[3];

      if (stress !== undefined && nucleus.length) // dch
        nucleus[0] += (E + stress);

      var data = [];
      for (j = 0; j < onset.length; j++)
        data.push(onset[j]);
      for (j = 0; j < nucleus.length; j++)
        data.push(nucleus[j]);
      for (j = 0; j < coda.length; j++)
        data.push(coda[j]);

      ret.push(data.join('-'));
    }

    return ret.join(SP);
  };

  var dbug, None, internuclei = [], syllables = [], // returned data structure.
    sylls = ((typeof(input) == 'string') ? input.split('-') : input);

  for (var i = 0; i < sylls.length; i++) {
    var phoneme = sylls[i].trim(), stress = None;
    if (!phoneme.length) continue;
    if (isNum(last(phoneme))) {
      stress = parseInt(last(phoneme));
      phoneme = phoneme.substring(0, phoneme.length - 1);
    }

    if (dbug) log(i + ")" + phoneme + ' stress=' + stress + ' inter=' + internuclei.join(':'));

    if (inArray(RiString._phones.vowels, phoneme)) {

      // Split the consonants seen since the last nucleus into coda and onset.
      var coda = None, onset = None;

      // Make the largest onset we can. The 'split' variable marks the break point.
      for (var split = 0; split < internuclei.length + 1; split++) {

        coda = internuclei.slice(0, split);
        onset = internuclei.slice(split, internuclei.length);

        if (dbug) log('  ' + split + ') onset=' + onset.join(':') +
          '  coda=' + coda.join(':') + '  inter=' + internuclei.join(':'));

        // If we are looking at a valid onset, or if we're at the start of the word
        // (in which case an invalid onset is better than a coda that doesn't follow
        // a nucleus), or if we've gone through all of the onsets and we didn't find
        // any that are valid, then split the nonvowels we've seen at this location.
        var bool = inArray(RiString._phones.onsets, onset.join(" "));
        if (bool || syllables.length === 0 || onset.length === 0) {
          if (dbug) log('  break ' + phoneme);
          break;
        }
      }

      // Tack the coda onto the coda of the last syllable.
      // Can't do it if this is the first syllable.
      if (syllables.length > 0) {
        extend(syllables[syllables.length - 1][3], coda);
        if (dbug) log('  tack: ' + coda + ' -> len=' +
          syllables[syllables.length - 1][3].length + " [" +
          syllables[syllables.length - 1][3] + "]");
      }

      // Make a new syllable out of the onset and nucleus.
      var toPush = [[stress], onset, [phoneme], []];
      syllables.push(toPush);

      // At this point we've processed the internuclei list.
      internuclei = [];
    }
    else if (!inArray(RiString._phones.consonants, phoneme) && phoneme != " ") {
      throw Error('Invalid phoneme: ' + phoneme);
    }
    else { // a consonant
      internuclei.push(phoneme);
    }
  }

  // Done looping through phonemes. We may have consonants left at the end.
  // We may have even not found a nucleus.
  if (internuclei.length > 0) {
    if (syllables.length === 0) {
      syllables.push([[None], internuclei, [],[]]);
    } else {
      extend(syllables[syllables.length - 1][3], internuclei);
    }
  }

  return stringify(syllables);
};

function initFeatureMap(rs) { // for RiString
  if (!rs._features) {
    rs._features = {};
  } else {
    ['tokens', 'stresses', 'phonemes', 'syllables', 'pos'].forEach(function (f) {
      delete rs._features[f];
    });
  }
  rs._features.text = rs.text();
}

RiString.prototype = {

  init: function(text) {

    if (is(text, N)) {

      text = String.fromCharCode(text);
    }

    text = text || '';

    // convenience fields, in case we use this object for rendering
    this.x = 0;
    this.y = 0;
    this.z = 0;

    this._text = text;
    this._features = undefined;
  },

  copy: function() {

    var rs = RiString(this._text),
      feats = this.features();

    if (feats) {
      rs._features = {};

      for (var prop in feats) {

        rs._features[prop] = feats[prop];
      }
    }
    return rs;
  },

  features: function() {

    if (!this._features) {
      this.analyze();
    }
    return this._features;
  },

  analyze: function() {

    var phonemes = E, syllables = E, stresses = E, slash = '/',
      delim = '-', stressyls, phones, lts, ltsPhones, useRaw,
      words = RiTa.tokenize(this._text), lex = RiTa.lexicon;

    if (!this._features) initFeatureMap(this);

    this._features.tokens = words.join(SP);
    this._features.pos = RiTa.getPosTags(this._text).join(SP);

    for (var i = 0, l = words.length; i < l; i++) {

      useRaw = false;
      phones = lex._getRawPhones(words[i]);

      if (!phones) {

        lts = lex._letterToSound();
        ltsPhones = lts && lts.getPhones(words[i]);
        if (ltsPhones && ltsPhones.length > 0) {

          if (words[i].match(/[a-zA-Z]+/))
            log("[RiTa] Used LTS-rules for '" + words[i] + "'");

          phones = RiString._syllabify(ltsPhones);

        } else {

          phones = words[i];
          useRaw = true;
        }
      }

      phonemes += phones.replace(/[0-2]/g, E).replace(/ /g, delim) + SP;
      syllables += phones.replace(/ /g, slash).replace(/1/g, E) + SP;

      if (!useRaw) {
        stressyls = phones.split(SP);
        for (var j = 0; j < stressyls.length; j++) {

          if (!stressyls[j].length) continue;

          stresses += (stressyls[j].indexOf(RiTa.STRESSED) > -1) ?
            RiTa.STRESSED : RiTa.UNSTRESSED;

          if (j < stressyls.length - 1) stresses += slash;
        }
      } else {

        stresses += words[i];
      }

      if (!endsWith(stresses, SP)) stresses += SP;
    }

    stresses = stresses.trim();
    phonemes = phonemes.trim().replace(/\\s+/, SP);
    syllables = syllables.trim().replace(/\\s+/, SP);

    this._features.stresses = stresses;
    this._features.phonemes = phonemes;
    this._features.syllables = syllables;

    return this;
  },

  get: function(featureName) {

    this._features || this.analyze();

    var s = this._features[featureName];

    if (!s && (FEATURES.indexOf(featureName) > -1) &&
      (!this._features.hasOwnProperty(featureName)))
    {
      this.analyze();
      s = this._features[featureName];
    }

    return s;
  },

  set: function(featureName, featureValue) {

    this._features || (this._features = {});
    this._features[featureName] = featureValue;
    //log(this._features);
    return this;
  },

  endsWith: function(substr) {

    return endsWith(this._text, substr);
  },

  equals: function(arg) {

    return is(arg.text, F) && arg.text() === this._text;
  },

  equalsIgnoreCase: function(arg) {

    if (typeof arg === S) {

      return arg.toLowerCase() === this._text.toLowerCase();

    } else {

      return arg.text().toLowerCase() === this._text.toLowerCase();
    }
  },

  text: function(theText) {

    if (arguments.length > 0) {
      this._text = theText;
      initFeatureMap(this);
      return this;
    }
    return this._text;
  },

  pos: function() {

    var words = RiTa.tokenize(this._text);
    var tags = PosTagger.tag(words);

    for (var i = 0, l = tags.length; i < l; i++) {
      if (!strOk(tags[i]))
        err("RiString: can't parse pos for:" + words[i]);
    }

    return tags;
  },

  posAt: function(index) {

    var tags = this.pos();

    if (!tags || !tags.length)
      return E;

    return tags[ Math.min(index < 0 ?
      tags.length + index : index, tags.length - 1) ];
  },

  wordAt: function(index) {

    var words = this.words();
    if (index < 0 || index >= words.length)
      return E;
    return words[index];
  },

  wordCount: function() {

    return this._text.length ? this.words().length : 0;
  },

  words: function() {

    return RiTa.tokenize(this._text);
  },

  indexOf: function(searchstring, start) {

    return this._text.indexOf(searchstring, start);
  },

  lastIndexOf: function(searchstring, start) {

    return this._text.lastIndexOf(searchstring, start);
  },

  length: function() {

    return this._text.length;
  },

  match: function(regex) {

    return this._text.match(regex) || [];
  },

  slice: function(begin, end) {

    return this._text.slice(begin, end) || E;
  },

  insertChar: function(idx, toInsert) {

    var s = this.text();

    if (idx > s.length || idx < -s.length) {

      warn("RiString.insertChar: bad index=" + idx);
      return this;
    }

    idx = idx < 0 ? idx += s.length : idx;
    var beg = s.substring(0, idx);
    var end = s.substring(idx);

    if (toInsert) beg += toInsert;

    return this.text(beg + end);
  },

  removeChar: function(idx) {

    var s = this.text();

    if (idx > s.length || idx < -s.length) {
      warn("RiString.removeChar: bad index=" + idx);
      return this;
    }
    idx = idx < 0 ? idx += s.length : idx;

    this.text(this._text.substring(0, idx).concat(this._text.substring(idx + 1)));
    return this;
  },

  replaceChar: function(idx, replaceWith) {

    var s = this.text();

    if (idx > s.length || idx < -s.length) {
      warn("RiString.replaceChar: bad index=" + idx);
      return this;
    }
    idx = idx < 0 ? idx += s.length : idx;

    s = this.text();
    var beg = s.substring(0, idx),
      end = s.substring(idx + 1);

    if (replaceWith)
      beg += replaceWith;

    return this.text(beg + end);
  },

  replaceFirst: function(regex, replaceWith) {

    // strip out global if we have it
    if (regex && !is(regex, S) && regex.global) {

      var flags = '';
      regex.ignoreCase && (flags += 'i');
      regex.multiline && (flags += 'm');
      regex.sticky && (flags += 'y');
      regex = new RegExp(regex.source, flags);
    }

    this._text = this._text.replace(regex, replaceWith);
    return this;
  },

  replaceAll: function(pattern, replacement) {

    var flags = 'g';

    if (pattern && (replacement || replacement === '')) {

      if (!is(pattern, S) && pattern.source) {

        pattern.ignoreCase && (flags += 'i');
        pattern.multiline && (flags += 'm');
        pattern.sticky && (flags += 'y');

        pattern = pattern.source;
      } else {

        pattern = escapeRegExp(pattern);
      }

      //console.log("RE: /"+pattern+"/"+flags);

      this._text = this._text.replace(new RegExp(pattern, flags), replacement);
    }

    return this;
  },

  removeWord: function(wordIdx) {

    return this.replaceWord(wordIdx, E);
  },

  insertWord: function(wordIdx, newWord) {

    var words = this.words(); //  tokenize

    if (wordIdx < 0) wordIdx += words.length;

    // log("insertWord("+ newWord+', '+wordIdx+") -> words["+wordIdx+"] = " + words[wordIdx]);

    if (newWord && newWord.length >= 0 && wordIdx >= 0 && wordIdx < words.length) {

      words[wordIdx] = newWord + SP + words[wordIdx];

      this.text(RiTa.untokenize(words));
    }

    return this;
  },

  toCharArray: function() {

    return this._text.split(RiTa.E);
  },

  replaceWord: function(wordIdx, newWord) {

    //log("replaceWord: "+wordIdx+", '"+newWord+"'");

    var words = this.words(); //  tokenize

    if (wordIdx < 0) wordIdx += words.length;

    if ((newWord || newWord === E) && wordIdx >= 0 && wordIdx < words.length) {

      words[wordIdx] = newWord;

      this.text(RiTa.untokenize(words));
    }

    return this;
  },

  split: function(separator, limit) {

    var parts = this._text.split(separator, limit);
    var rs = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i])
        rs.push(new RiString(parts[i]));
    }
    return rs;
  },

  startsWith: function(substr) {

    return this.indexOf(substr) === 0;
  },

  substr: function(start, length) {

    return this._text.substr(start, length);
  },

  substring: function(from, to) {

    return this._text.substring(from, to);
  },

  toLowerCase: function() {

    return this.text(this._text.toLowerCase());
  },

  toString: function() {

    return '[' + this._text + ']';
  },

  toUpperCase: function() {

    return this.text(this._text.toUpperCase());
  },

  trim: function() {

    return this.text(trim(this._text));
  },

  charAt: function(index) {

    return this._text.charAt(index);
  },

  concat: function(riString) {

    return this._text.concat(riString.text());
  }
};

var RiGrammar = makeClass();

var OR_PATT = /\s*\|\s*/, STRIP_TICKS = /`([^`]*)`/g,
  PROB_PATT = /(.*[^\s])\s*\[([0-9.]+)\](.*)/;

RiGrammar.START_RULE = "<start>";
RiGrammar.EXEC_PATT = /(.*?)(`[^`]+?\(.*?\);?`)(.*)/;

RiGrammar.prototype = {

  init: function(grammar) {

    this._rules = {};
    this.execDisabled = false;

    if (grammar) {

      // a String or Object, but make sure its not a PApplet (e.g., this)
      if (is(grammar, S) || (is(grammar, O) && typeof grammar.loadStrings !== F))
        this.load(grammar);
    }
  },

  ready: function(url) {

    return (okeys(this._rules).length > 0);
  },

  loadFrom: function(url, callback) {

    RiTa.loadStrings(url, function(data) {

      data = data.join(BN);
      this.load(data);
      is(callback, F) && (callback(data));

    }.bind(this));
  },

  load: function(grammar) {

    this.reset();

    if (is(grammar, S)) {

      if (typeof YAML != 'undefined') { // found a yaml-parser, so try it first

        try {
          //console.log('trying YAML');
          grammar = YAML.parse(grammar);

        } catch (e) {

          warn('YAML parsing failed, trying JSON');
        }
      }

      if (!is(grammar, O)) { // we failed with our yaml-parser, so try JSON
        try {

          //console.log('trying JSON');
          grammar = JSON.parse(grammar);

        } catch (e) {

          var ex = e;
        }
      }
    }

    if (ex || !is(grammar, O)) {

      if (typeof YAML != 'undefined') {
        err('Grammar appears to be invalid JSON/YAML, please check it!' +
          ' (http://jsonlint.com/ or http://yamllint.com/)', grammar);
      }
      else {
        var isnode = RiTa.env() === RiTa.NODE, verb =  isnode ? 'require'
          : 'include', syntax = isnode ? "YAML = require('yamljs')" :
            '<script src="yaml.min.js"></script>';

        err('Grammar appears to be invalid JSON, please check it at ' +
          'http://jsonlint.com/. If you are using YAML, be sure to '  +
          verb + ' yamljs (https://github.com/jeremyfa/yaml.js), e.g. ' +
          syntax, grammar);
      }

      return;
    }

    for (var rule in grammar) {
      this.addRule(rule, grammar[rule]);
    }

    return this;
  },

  addRule: function(name, theRule, weight) {

    var dbug = false;

    weight = weight || 1.0; // default

    if (dbug) log('addRule: "' + name + '" : "' + theRule +
      '"       [' + get(theRule) + ']');

    var ruleset = theRule;
    if (!is(theRule, A))
      ruleset = theRule.split(OR_PATT);

    for (var i = 0; i < ruleset.length; i++) {

      var rule = ruleset[i];
      var prob = weight;
      var m = PROB_PATT.exec(rule);

      if (m) // found weighting
      {
        if (dbug) {
          log("Found weight for " + rule);
          for (i = 0; i < m.length; i++)
            log("  " + i + ") '" + m[i] + "'");
        }

        rule = m[1] + m[3];
        prob = m[2];

        if (dbug) log("weight=" + prob + " rule='" + rule + "'");
      }

      if (this.hasRule(name)) {

        if (dbug) log("rule exists");
        var temp = this._rules[name];
        temp[rule] = prob;
      } else {

        var temp2 = {};
        temp2[rule] = prob;
        this._rules[name] = temp2;

        if (dbug) log("added rule: " + name);
      }
    }

    return this;
  },

  removeRule: function(name) {

    delete this._rules[name];
    return this;
  },

  reset: function() {

    this._rules = {};
    return this;

  },

  doRule: function(pre) {

    var getStochasticRule = function(temp) { // map

      var name, dbug = false, p = Math.random(), result, total = 0;
      if (dbug) log("getStochasticRule(" + temp + ")");
      for (name in temp) {
        total += parseFloat(temp[name]);
      }

      if (dbug) log("total=" + total + "p=" + p);
      for (name in temp) {
        if (dbug) log("  name=" + name);
        var amt = temp[name] / total;
        if (dbug) log("amt=" + amt);
        if (p < amt) {
          result = name;
          if (dbug) log("hit!=" + name);
          break;
        } else {
          p -= amt;
        }
      }
      return result;
    }

    var cnt = 0,
      name = E,
      rules = this._rules[pre];

    if (!rules) return null;

    for (name in rules) cnt++;

    if (!cnt) return null;

    return (cnt == 1) ? name : getStochasticRule(rules);
  },


  getGrammar: function() {

    var s = E;
    for (var name in this._rules) {
      s += (name + BN);
      var choices = this._rules[name];
      for (var p in choices) {
        s += ("  '" + p + "' [" + choices[p] + ']' + BN);
      }
    }
    return RiTa.chomp(s);
  },

  print: function() {

    if (console) {
      var ln = "\n------------------------------";
      console.log(ln + BN + this.getGrammar() + ln);
    }
    return this;
  },

  hasRule: function(name) {

    return (typeof this._rules[name] !== 'undefined');
  },

  expandWith: function(literal, symbol) { // TODO: finish

    var copy = function(rs) {

      var tmp = RiGrammar();
      for (var name in rs._rules) {
        tmp._rules[name] = rs._rules[name];
      }
      return tmp;
    }

    var name, gr = copy(this),
      match = false;

    for (name in gr._rules) {

      if (name === symbol) {

        var obj = {};
        obj[literal] = 1.0;
        gr._rules[name] = obj;
        match = true;
      }
    }

    if (!match)
      err("Rule '" + symbol + "' not found in grammar");

    // TODO: tmp, awful hack, write this correctly
    var tries, maxTries = 1000;
    for (tries = 0; tries < maxTries; tries++) {
      var s = gr.expand();
      if (s.indexOf(literal) > -1)
        return s;
    }
    err("RiGrammar failed to complete after " + tries + " tries" + BN);
  },

  expand: function(context) {

    return this.expandFrom(RiGrammar.START_RULE, context);
  },

  expandFrom: function(rule, context) {

    var expandRule = function(g, prod) {

      var entry, idx, pre, expanded, post, dbug = 0;
      if (dbug) log("expandRule(" + prod + ")");

      for (var name in g._rules) {

        entry = g._rules[name];
        if (dbug) log("  name=" + name + "  entry=" + JSON.stringify(entry) + "  prod=" + prod + (idx?"  idx=" + idx:''));
        idx = prod.indexOf(name);

        if (idx >= 0) { // got a match, split into 3 parts

          if (dbug) log('matched: '+name);
          pre = prod.substring(0, idx) || E;
          expanded = g.doRule(name) || E;
          post = prod.substring(idx + name.length) || E;

          if (dbug) log("  pre=" + pre + "  expanded=" + expanded +
            "  post=" + post + "  result=" + pre + expanded + post);
          return pre + expanded + post;
        }
      }
      return null; // no rules matched
    }

    var Scope = function(context) { // class
      "use strict";

      this.names = [];
      this.eval = function(s) {
        return eval(s);
      };
      this.put = function(name, val) {
        "use strict";
        var code = "(function() {\n";
        code += 'var ' + name + ' = '+val+';\n';
        code += 'return function(str) {return eval(str)};\n})()';
        this.eval = this.eval(code);
        this.names.push(name);
      };

      if (context) {
        var scope = this;
        if (typeof context === 'function') {
          scope.put(context.name, context);
        }
        else if (typeof context === 'object') {
          okeys(context).forEach(function (f) {
            if (typeof context[f] === 'function')
              scope.put(f, context[f]);
          });
        }
      }
    }

    var handleExec = function(input, context) {

      //console.log('handleExec('+input+", ",context+')');
      if (!input || !input.length) return null;

      // strip backticks and eval
      var res, exec = input.replace(STRIP_TICKS, '$1');

      try {

        res = eval(exec); // try in global context
        return res ? res + E : null;

      } catch (e) {

        if (context) { // create sandbox for context args

          try {
            res = new Scope(context).eval(exec);
            return res ? res + '' : null;
          }
          catch (e) { /* fall through */ }
        }
      }
      return input;
    }

    var countTicks = function(theCall) {
      var count = 0;
      for (var i = 0; i < theCall.length; i++) {
        if (theCall.charAt(i) == '`')
          count++;
      }
      return count;
    }

    // -----------------------------------------------------

    if (!okeys(this._rules).length)
      err("(RiGrammar) No grammar rules found!");

    if (!this.hasRule(rule))
      err("Rule not found: " + rule + BN + "Rules:" + BN + JSON.stringify(this._rules));

    var parts, theCall, callResult, tries = 0, maxIterations = 1000;

    while (++tries < maxIterations) {

      var next = expandRule(this, rule);
      if (next && next.length) { // matched a rule
        rule = next;
        continue;
      }

      if (this.execDisabled) break; // return

      // finished rules, check for back-ticked exec calls
      parts = RiGrammar.EXEC_PATT.exec(rule);

      if (!parts || !parts.length) break; // return, no evals

      if (parts.length > 2) {

        theCall = parts[2];

        if (countTicks(theCall) != 2) {
          warn("Unable to parse recursive exec: " + theCall + "...");
          return null;
        }

        callResult = handleExec(theCall, context);
        if (!callResult) {

          if (0) log("[WARN] (RiGrammar.expandFrom) Unexpected" +
            " state: eval(" + theCall + ") :: returning '" + rule + "'");
          break; // return
        }

        rule = parts[1] + callResult;
        if (parts.length > 3) rule += parts[3];
      }
    }

    if (tries >= maxIterations)
      log("[WARN] max number of iterations reached: " + maxIterations);

    return RiTa.unescapeHTML(rule);
  }

}; // end RiGrammar

var callbacksDisabled = false;
var RiTaEvent = makeClass();

RiTaEvent.ID = 0;
RiTaEvent.prototype = {

  init: function(source, eventType, data) {

    is(source, O) || ok(source, S);
    this._id = ++RiTaEvent.ID;
    this._data = data;
    this._source = source;
    this._type = eventType || RiTa.UNKNOWN;
  },

  toString: function() {
    var s = 'RiTaEvent[#' + this._id + ' type=' +
      '(' + this._type + ') source=' + this._source.toString();
    s += !this._data ? s += ' data=null' :
      (' data-length=' + this._data.toString().length);
    return s + ']';
  },

  isType: function(t) {
    return this._type === t;
  },

  _fire: function(callback) {

    callback = callback || window.onRiTaEvent;
    if (callback && is(callback, F)) {
      try {
        callback(this); // first arg ??
        return this;

      } catch (err) {
        callbacksDisabled = true;
        var msg = "RiTaEvent: error calling '" + callback + "': " + err;
        is(callback, S) && (msg += " Callback must be a function in JS!");
        warn(msg);
        throw err;
      }
    }
  }
};

var StringTokenizer = makeClass();

StringTokenizer.prototype = {

  init: function(str, delim) {

    this.idx = 0;
    this.text = str;
    this.delim = delim || " ";
    this.tokens = str.split(delim);
  },

  nextToken: function() {

    return (this.idx < this.tokens.length) ? this.tokens[this.idx++] : null;
  }
};

var TextNode = makeClass();

TextNode.prototype = {

  init: function(parent, token) {
    this.count = 0;
    this.children = {};
    this.parent = parent;
    this.token = token;
  },

  pathFromRoot: function(result) {
    var mn = this;
    while (true) {
      if (mn.isRoot()) break;
      result.push(mn.token);
      mn = mn.parent;
    }
  },

  selectChild: function(regex, probabalisticSelect) {
    var ps = probabalisticSelect || true;
    return this.children ? this._select(this.childNodes(regex), ps) : null;
  },

  _select: function(arr, probabalisticSelect) {
    if (!arr) throw TypeError("bad arg to '_select()'");
    probabalisticSelect = probabalisticSelect || false;
    return (probabalisticSelect ? this._probabalisticSelect(arr) : arr[Math.floor((Math.random() * arr.length))]);
  },

  _probabalisticSelect: function(arr) {

    if (!arr) throw TypeError("bad arg to '_probabalisticSelect()'");

    //log("RiTa.probabalisticSelect("+c+", size="+c.size()+")");
    if (!arr.length) return null;
    if (arr.length == 1) return arr[0];

    // select from multiple options based on frequency
    var pTotal = 0,
      selector = Math.random();
    for (var i = 0; i < arr.length; i++) {

      pTotal += arr[i].probability();
      if (selector < pTotal)
        return arr[i];
    }
    err("Invalid State in RiTa.probabalisticSelect()");
  },

  addChild: function(newToken, initialCount) {

    initialCount = initialCount || 1;

    var node = this.children[newToken];

    //  add first instance of this token
    if (!node) {

      node = new TextNode(this, newToken);
      node.count = initialCount;
      this.children[newToken] = node;
    } else {

      node.count++;
    }

    return node;
  },

  asTree: function(sort) {
    var s = this.token + " ";
    if (!this.isRoot())
      s += "(" + this.count + ")->";
    s += "{";
    if (!this.isLeaf())
      return this.childrenToString(this, s, 1, sort);
    return s + "}";
  },

  isRoot: function() {
    return !this.parent;
  },

  isLeaf: function() {
    return this.childCount() === 0;
  },

  probability: function() {
    //log('probability: '+ this.count+'/'+this.siblingCount());
    return this.count / this.siblingCount();
  },

  childNodes: function(regex) {
    if (!this.children) return EA;
    regex = is(regex, S) ? new RegExp(regex) : regex;
    var res = [];
    for (var k in this.children) {
      var nd = this.children[k];
      if (!regex || (nd && nd.token && nd.token.search(regex) > -1)) {
        res.push(nd);
      }
    }
    return res;
  },

  siblingCount: function() {
    if (!this.parent) err("Illegal siblingCount on ROOT!");
    return this.parent.childCount();
  },

  childCount: function() {
    if (!this.children) return 0;
    var sum = 0;
    for (var k in this.children) {
      if (k && this.children[k])
        sum += this.children[k].count;
    }
    return sum;
  },

  // takes node or string, returns node
  lookup: function(obj) {
    if (!obj) return null;
    obj = (typeof obj != S && obj.token) ? obj.token : obj;
    return obj ? this.children[obj] : null;
  },

  childrenToString: function(textNode, str, depth, sort) {

    var i, j, k, mn = textNode,
      l = [],
      node = null,
      indent = BN;

    sort = sort || false;

    for (k in textNode.children) {
      l.push(textNode.children[k]);
    }

    if (!l.length) return str;

    if (sort) l.sort();

    for (j = 0; j < depth; j++)
      indent += "  ";

    for (i = 0; i < l.length; i++) {

      node = l[i];

      if (!node) break;

      var tok = node.token;
      if (tok) {
        (tok == BN) && (tok = "\\n");
        (tok == "\r") && (tok = "\\r");
        (tok == "\t") && (tok = "\\t");
        (tok == "\r\n") && (tok = "\\r\\n");
      }

      str += indent + "'" + tok + "'";

      if (!node.count)
        err("ILLEGAL FREQ: " + node.count + " -> " + mn.token + "," + node.token);

      if (!node.isRoot())
        str += " [" + node.count + ",p=" + //formatter.format
        (node.probability().toFixed(3)) + "]->{";

      if (node.children)
        str = this.childrenToString(node, str, depth + 1, sort);
      else
        str += "}";
    }

    indent = BN;
    for (j = 0; j < depth - 1; j++)
      indent += "  ";

    return str + indent + "}";
  },

  toString: function() {
    return '[ ' + this.token + " (" + this.count + '/' + this.probability().toFixed(3) + '%)]';
  }
};

var Conjugator = makeClass();

Conjugator.prototype = {

  init: function() {

    this.perfect = this.progressive = this.passive = this.interrogative = false;
    this.tense = RiTa.PRESENT_TENSE;
    this.person = RiTa.FIRST_PERSON;
    this.number = RiTa.SINGULAR;
    this.form = RiTa.NORMAL;
  },

  // !@# TODO: add handling of past tense modals.
  conjugate: function(theVerb, args) {

    var v, s, actualModal, conjs = [],
      frontVG, verbForm;

    if (!theVerb || !theVerb.length) return E;

    if (!args) return theVerb;

    // ------------------ handle arguments ------------------

    v = theVerb.toLowerCase();
    if (v === "am" || v === "are" || v === "is" || v === "was" || v === "were") {
      v = "be";
    }
    frontVG = v;

    args.number && (this.number = args.number);
    args.person && (this.person = args.person);
    args.tense && (this.tense = args.tense);
    args.form && (this.form = args.form);
    args.passive && (this.passive = args.passive);
    args.progressive && (this.progressive = args.progressive);
    args.interrogative && (this.interrogative = args.interrogative);
    args.perfect && (this.perfect = args.perfect);

    // ----------------------- start ---------------------------
    if (this.form == RiTa.INFINITIVE) {
      actualModal = "to";
    }

    if (this.tense == RiTa.FUTURE_TENSE) {
      actualModal = "will";
    }

    if (this.passive) {
      conjs.push(this.getPastParticiple(frontVG));
      frontVG = "be";
    }

    if (this.progressive) {
      conjs.push(this.getPresentParticiple(frontVG));
      frontVG = "be";
    }

    if (this.perfect) {
      conjs.push(this.getPastParticiple(frontVG));
      frontVG = "have";
    }

    if (actualModal) {

      // log("push: "+frontVG);
      conjs.push(frontVG);
      frontVG = null;
    }

    // Now inflect frontVG (if it exists) and push it on restVG
    if (frontVG) {

      if (this.form === RiTa.GERUND) { // gerund - use ING form

        var pp = this.getPresentParticiple(frontVG);

        // !@# not yet implemented! ??? WHAT?
        conjs.push(pp);
      } else if (this.interrogative && frontVG != "be" && conjs.length < 1) {

        conjs.push(frontVG);
      } else {

        verbForm = this.getVerbForm(frontVG, this.tense, this.person, this.number);
        conjs.push(verbForm);
      }
    }

    // add modal, and we're done
    actualModal && conjs.push(actualModal);

    s = E;
    for (var i = 0; i < conjs.length; i++) {
      s = conjs[i] + " " + s;
    }

    // !@# test this
    endsWith(s, "peted") && err("Unexpected output: " + this.toString());

    return trim(s);
  },

  checkRules: function(ruleSet, theVerb) {

    var res, name = ruleSet.name,
      rules = ruleSet.rules,
      defRule = ruleSet.defaultRule;

    if (!rules) err("no rule: " + ruleSet.name + ' of ' + theVerb);

    if (inArray(MODALS, theVerb)) return theVerb;

    for (var i = 0; i < rules.length; i++) {

      //log("checkRules2("+name+").fire("+i+")="+rules[i].regex);
      if (rules[i].applies(theVerb)) {

        var got = rules[i].fire(theVerb);

        //log("HIT("+name+").fire("+i+")="+rules[i].regex+"_returns: "+got);
        return got;
      }
    }
    //log("NO HIT!");

    if (ruleSet.doubling && inArray(VERB_CONS_DOUBLING, theVerb)) {

      //log("doDoubling!");
      theVerb = this.doubleFinalConsonant(theVerb);
    }

    res = defRule.fire(theVerb);

    //log("checkRules("+name+").returns: "+res);

    return res;
  },

  doubleFinalConsonant: function(word) {
    return word + word.charAt(word.length - 1);
  },

  getPast: function(theVerb, pers, numb) {

    if (theVerb.toLowerCase() == "be") {

      switch (numb) {

        case RiTa.SINGULAR:

          switch (pers) {

            case RiTa.FIRST_PERSON:
              break;

            case RiTa.THIRD_PERSON:
              return "was";

            case RiTa.SECOND_PERSON:
              return "were";

          }
          break;

        case RiTa.PLURAL:

          return "were";
      }
    }

    return this.checkRules(PAST_TENSE_RULESET, theVerb);
  },

  getPresent: function(theVerb, person, number) {

    person = person || this.person;
    number = number || this.number;

    if ((person == RiTa.THIRD_PERSON) && (number == RiTa.SINGULAR)) {

      return this.checkRules(PRESENT_TENSE_RULESET, theVerb);
    } else if (theVerb == "be") {

      if (number == RiTa.SINGULAR) {

        switch (person) {

          case RiTa.FIRST_PERSON:
            return "am";

          case RiTa.SECOND_PERSON:
            return "are";

          case RiTa.THIRD_PERSON:
            return "is";

            // default: ???
        }

      } else {
        return "are";
      }
    }
    return theVerb;
  },

  getPresentParticiple: function(theVerb) {

    return strOk(theVerb) ? this.checkRules(PRESENT_PARTICIPLE_RULESET, theVerb) : E;
  },

  getPastParticiple: function(theVerb) {

    return strOk(theVerb) ? this.checkRules(PAST_PARTICIPLE_RULESET, theVerb) : E;
  },

  getVerbForm: function(theVerb, tense, person, number) {

    switch (tense) {
      case RiTa.PRESENT_TENSE:
        return this.getPresent(theVerb, person, number);
      case RiTa.PAST_TENSE:
        return this.getPast(theVerb, person, number);
    }
    return theVerb;
  },

  toString: function() {
    return "  ---------------------" + BN + "  Passive = " + this.passive +
      BN + "  Perfect = " + this.perfect + BN + "  Progressive = " +
      this.progressive + BN + "  ---------------------" + BN + "  Number = " +
      this.number + BN + "  Person = " + this.person + BN + "  Tense = " +
      this.tense + BN + "  ---------------------" + BN;
  }
};

var PosTagger = { // singleton

  NOUNS: ['nn', 'nns', 'nnp', 'nnps'],
  VERBS: ['vb', 'vbd', 'vbg', 'vbn', 'vbp', 'vbz'],
  ADJ: ['jj', 'jjr', 'jjs'],
  ADV: ['rb', 'rbr', 'rbs', 'rp'],
  DBUG: 0,

  isVerb: function(tag) {
    return inArray(this.VERBS, tag);
  },

  isNoun: function(tag) {
    return inArray(this.NOUNS, tag);
  },

  isAdverb: function(tag) {
    return inArray(this.ADV, tag);
  },

  isAdj: function(tag) {
    return inArray(this.ADJ, tag);
  },

  hasTag: function(choices, tag) {
    ok(choices, A);
    var choiceStr = choices.join();
    return (choiceStr.indexOf(tag) > -1);
  },

  // Returns an array of parts-of-speech from the Penn tagset,
  // each corresponding to one word of input
  tag: function (words) {

    var result = [],
      choices2d = [],
      lex = RiTa.lexicon;

    words = is(words, A) ? words : [words];

    for (var i = 0, l = words.length; i < l; i++) {


      if (words[i].length < 1) {

        result.push(E);
        continue;
      }

      if (words[i].length == 1) {

        result.push(this._handleSingleLetter(words[i]));
        continue;
      }

      var data = lex && lex._getPosArr(words[i]);
      if (!data.length) {

        // use stemmer categories if no lexicon

        choices2d[i] = [];
        var tag = 'nn';
        if (endsWith(words[i], 's')) {
          tag = 'nns';
        }

        if (!RiTa.SILENT) { // warn
          if (RiTa.LEX_WARN && lex.size() <= 1000) {
            warn(RiTa.LEX_WARN);
            RiTa.LEX_WARN = false;
          }
          if (RiTa.LTS_WARN && typeof LetterToSound === 'undefined') {
            warn(RiTa.LTS_WARN);
            RiTa.LTS_WARN = false;
          }
        }

        if (endsWith(words[i], 's')) {
          var sub2, sub = words[i].substring(0, words[i].length - 1);

          if (endsWith(words[i], 'es'))
            sub2 = words[i].substring(0, words[i].length - 2)

          if (this._lexHas("n", sub) || (sub2 && this._lexHas("n", sub2))) {
            choices2d.push("nns");
          } else {
            var sing = RiTa.singularize(words[i]);
            if (this._lexHas("n", sing)) choices2d.push("nns");
          }

        } else {

          var sing = RiTa.singularize(words[i]);

          if (this._lexHas("n", sing)) {
            choices2d.push("nns");
            tag = 'nns';
          } else if (checkPluralNoLex(words[i])){
             tag = 'nns';
            //common plurals
          }
        }

        result.push(tag);

      } else {

        result.push(data[0]);
        choices2d[i] = data;
      }
    }

    // Adjust pos according to transformation rules
    return this._applyContext(words, result, choices2d);
  },

  _handleSingleLetter: function(c) {

    var result = c;

    if (c === 'a' || c === 'A')
      result = 'dt';
    else if (c === 'I')
      result = 'prp';
    else if (c >= '0' && c <= '9')
      result = 'cd';

    return result;
  },

  _ct: function(i, frm, to) { // log custom tag

    if (this.DBUG) console.log("\n  Custom(" +
      i + ") tagged '" + frm + "' -> '"+ to + "'\n\n");
  },

  // Applies a customized subset of the Brill transformations
  _applyContext: function(words, result, choices) {

    (this.DBUG) && console.log("ac("+words+","+result+","+choices+")");
    var sW = startsWith, eW = endsWith, eic = equalsIgnoreCase;

    // Apply transformations
    for (var i = 0, l = words.length; i < l; i++) {

      var word = words[i], tag = result[i];

      // transform 1a: DT, {VBD | VBP | VB} --> DT, NN
      if (i > 0 && (result[i - 1] == "dt")) {

        if (sW(tag, "vb")) {
          tag = "nn";

        // transform 7: if a word has been categorized as a
        // common noun and it ends with "s", then set its type to plural common noun (NNS)
        if (word.match(/^.*[^s]s$/)) {
            if (!NULL_PLURALS.applies(word))
            tag = "nns";
        }

          this._ct("1a", word, tag);
        }

        // transform 1b: DT, {RB | RBR | RBS} --> DT, {JJ |
        // JJR | JJS}
        else if (sW(tag, "rb")) {

          tag = (tag.length > 2) ? "jj" + tag.charAt(2) : "jj";
	        this._ct("1b", word, tag);
        }
      }

      // transform 2: convert a noun to a number (cd) if it is
      // all digits and/or a decimal "."
      if (sW(tag, "n") && !choices[i]) {
        if (isNum(word)) {
          tag = "cd";
        } // mods: dch (add choice check above) <---- ? >
      }

      // transform 3: convert a noun to a past participle if
      // word ends with "ed" and (following any nn or prp?)
      if (i > 0 && sW(tag, "n") && eW(word, "ed") && !eW(word,"eed") && result[i - 1].match(/^(nn|prp)$/)) {
        tag = "vbn";
      }

      // transform 4: convert any type to adverb if it ends in "ly";
      if (eW(word, "ly")) {
        tag = "rb";
      }

      // transform 5: convert a common noun (NN or NNS) to a
      // adjective if it ends with "al", special-case for mammal
      if (sW(tag, "nn") && eW(word, "al") && word != 'mammal') {
        tag = "jj";
      }

      // transform 6: convert a noun to a verb if the
      // preceeding word is modal
      if (i > 0 && sW(tag, "nn") && sW(result[i - 1], "md")) {
        tag = "vb";
      }

      // transform 8: convert a common noun to a present
      // participle verb (i.e., a gerund)
      if (sW(tag, "nn") && eW(word, "ing")) {

        // DH: fixed here -- add check on choices for any verb: eg. // 'morning'
        if (this.hasTag(choices[i], "vb")) {
          tag = "vbg";
          this._ct(8, word, tag);
        }
      }

      // transform 9(dch): convert plural nouns (which are also 3sg-verbs) to
      // 3sg-verbs when following a singular noun (the dog dances, Dave dances, he dances)
      if (i > 0 && tag == "nns" && this.hasTag(choices[i], "vbz") && result[i - 1].match(/^(nn|prp|nnp)$/)) {
        tag = "vbz";
        this._ct(9, word, tag);
      }

      // transform 10(dch): convert common nouns to proper
      // nouns when they start w' a capital
      if (sW(tag, "nn") && (word.charAt(0)===word.charAt(0).toUpperCase())) {
        //if it is not at the start of a sentence or it is the only word
        // or when it is at the start of a sentence but can't be found in the dictionary
        if(i != 0 || words.length===1 || (i == 0 && !this._lexHas('nn', RiTa.singularize(word).toLowerCase()))){
           tag = eW(tag, "s") ? "nnps" : "nnp";
           this._ct(10, word, tag);
        }
      }


      // transform 11(dch): convert plural nouns (which are
      // also 3sg-verbs) to 3sg-verbs when followed by adverb
      if (i < result.length - 1 && tag == "nns" && sW(result[i + 1], "rb")
					&& this.hasTag(choices[i], "vbz")) {
				tag = "vbz";
        this._ct(11, word, tag);
			}

      // transform 12(dch): convert plural nouns which have an entry for their base form to vbz
      if (tag === "nns") {

          // is preceded by one of the following
          if (i > 0 && ["nn", "prp", "cc", "nnp"].indexOf(result[i - 1]) > -1) {
              // if word is ends with s or es and is 'nns' and has a vb
              if (this._lexHas('vb', RiTa.singularize(word))) {
                  tag = "vbz";
                  this._ct(12, word, tag);
              }
          } // if only word and not in lexicon
          else if (words.length === 1 && !choices[i].length) {
              // if the stem of a single word could be both nn and vb, return nns
              // only return vbz when the stem is vb but not nn
              if (!this._lexHas('nn', RiTa.singularize(word)) && this._lexHas('vb', RiTa.singularize(word))) {
                  tag = "vbz";
                  this._ct(12, word, tag);
              }

          }
      }

      //transform 13(cqx): convert a vb/ potential vb to vbp when following nns (Elephants dance, they dance)
      if (tag === "vb" || (tag === "nn" && this.hasTag(choices[i], "vb"))) {
          if (i > 0 && result[i - 1].match(/^(nns|nnps|prp)$/)) {
          tag = "vbp";
          this._ct(13, word, tag);
          }
        }

      result[i] = tag;
    }

    return result;
  },

  _lexHas: function(pos, words) { // takes ([n|v|a|r] or a full tag)

    var words = is(words, A) || [words];

    for (var i = 0; i < words.length; i++) {

      if (RiTa.lexicon.containsWord(words[i])) {

        if (pos == null) return true;

        var tags = RiTa.lexicon._getPosArr(words[i]);

        for (var j = 0; j < tags.length; j++) {

          if (pos === 'n' && PosTagger.isNoun(tags[j]) ||
              pos === 'v' && PosTagger.isVerb(tags[j]) ||
              pos === 'r' && PosTagger.isAdverb(tags[j]) ||
              pos === 'a' && PosTagger.isAdj(tags[j]) ||
              pos === tags[j])
          {
            return true;
          }
        }
      }
    }
  }

}; // end PosTagger


 // Default Stemmer (adapted from https://github.com/kristopolous/Porter-Stemmer)
 // Stemming demo/comparison - http://text-processing.com/demo/stem/
RiTa.stemmers.Porter = (function() {

  var step2list = {
      'ational': 'ate',
      'tional': 'tion',
      'enci': 'ence',
      'anci': 'ance',
      'izer': 'ize',
      'bli': 'ble',
      'alli': 'al',
      'entli': 'ent',
      'eli': 'e',
      'ousli': 'ous',
      'ization': 'ize',
      'ation': 'ate',
      'ator': 'ate',
      'alism': 'al',
      'iveness': 'ive',
      'fulness': 'ful',
      'ousness': 'ous',
      'aliti': 'al',
      'iviti': 'ive',
      'biliti': 'ble',
      'logi': 'log'
    },

    step3list = {
      'icate': 'ic',
      'ative': '',
      'alize': 'al',
      'iciti': 'ic',
      'ical': 'ic',
      'ful': '',
      'ness': ''
    },

    c = '[^aeiou]', // consonant
    v = '[aeiouy]', // vowel
    C = c + '[^aeiouy]*', // consonant sequence
    V = v + '[aeiou]*', // vowel sequence

    mgr0 = '^(' + C + ')?' + V + C, // [C]VC... is m>0
    meq1 = '^(' + C + ')?' + V + C + '(' + V + ')?$', // [C]VC[V] is m=1
    mgr1 = '^(' + C + ')?' + V + C + V + C, // [C]VCVC... is m>1
    s_v = '^(' + C + ')?' + v; // vowel in stem

  return function(w) {

    var fp, stem, suffix, firstch, re, re2, re3, re4, origword = w;

    if (w.length < 3) {
      return w;
    }

    firstch = w.substr(0, 1);
    if (firstch == "y") {
      w = firstch + w.substr(1);
    }

    // Step 1a
    re = /^(.+?)(ss|i)es$/;
    re2 = /^(.+?)([^s])s$/;

    if (re.test(w)) {
      w = w.replace(re, "$1$2");
    } else if (re2.test(w)) {
      w = w.replace(re2, "$1$2");
    }

    // Step 1b
    re = /^(.+?)eed$/;
    re2 = /^(.+?)(ed|ing)$/;
    if (re.test(w)) {
      fp = re.exec(w);
      re = new RegExp(mgr0);
      if (re.test(fp[1])) {
        re = /.$/;
        w = w.replace(re,E);
      }
    } else if (re2.test(w)) {
      fp = re2.exec(w);
      stem = fp[1];
      re2 = new RegExp(s_v);
      if (re2.test(stem)) {
        w = stem;
        re2 = /(at|bl|iz)$/;
        re3 = new RegExp("([^aeiouylsz])\\1$");
        re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
        if (re2.test(w)) {
          w = w + "e";
        } else if (re3.test(w)) {
          re = /.$/;
          w = w.replace(re,E);
        } else if (re4.test(w)) {
          w = w + "e";
        }
      }
    }

    // Step 1c
    re = /^(.+?)y$/;
    if (re.test(w)) {
      fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(s_v);
      if (re.test(stem)) w = stem + "i";
    }

    // Step 2
    re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
    if (re.test(w)) {
      fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = new RegExp(mgr0);
      if (re.test(stem)) {
        w = stem + step2list[suffix];
      }
    }

    // Step 3
    re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
    if (re.test(w)) {
      fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = new RegExp(mgr0);
      if (re.test(stem)) {
        w = stem + step3list[suffix];
      }
    }

    // Step 4
    re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
    re2 = /^(.+?)(s|t)(ion)$/;
    if (re.test(w)) {
      fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(mgr1);
      if (re.test(stem)) {
        w = stem;
      }
    } else if (re2.test(w)) {
      fp = re2.exec(w);
      stem = fp[1] + fp[2];
      re2 = new RegExp(mgr1);
      if (re2.test(stem)) {
        w = stem;
      }
    }

    // Step 5
    re = /^(.+?)e$/;
    if (re.test(w)) {
      fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(mgr1);
      re2 = new RegExp(meq1);
      re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
      if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
        w = stem;
      }
    }

    re = /ll$/;
    re2 = new RegExp(mgr1);
    if (re.test(w) && re2.test(w)) {
      re = /.$/;
      w = w.replace(re,E);
    }

    // and turn initial Y back to y
    if (firstch == "y") {
      w = firstch.toLowerCase() + w.substr(1);
    }

    return w;
  };

})();

RiTa.stemmers.Lancaster = (function() {

  function accept(token) {

    return (token.match(/^[aeiou]/)) ?
      (token.length > 1) : (token.length > 2 && token.match(/[aeiouy]/));
  }

  // take a token, look up the applicable rule and do the stem
  function applyRules(token, intact) {

    var section = token.substr(-1),
      rules = ruleTable[section],
      input = token;

    if (rules) {

      for (var i = 0; i < rules.length; i++) {

        // only apply intact rules to intact tokens
        if ((intact || !rules[i].intact) && token.substr(0 - rules[i].pattern.length) == rules[i].pattern) {

          // hack off only as much as the rule indicates
          var result = token.substr(0, token.length - rules[i].size);

          // if the rules wants us to apply an appendage do so
          if (rules[i].appendage) {
            result += rules[i].appendage;
          }

          if (accept(result)) {

            token = result;

            // see what the rules wants to do next
            if (rules[i].continuation) {

              // this rule thinks there still might be stem left. keep at it.
              // since we've applied a change we'll pass false in for intact
              return applyRules(result, false);

            } else {

              // the rule thinks we're done stemming. drop out.
              return result;
            }
          }
        }
      }
    }
    // else // warn('No stemming rules (LancasterImpl) found for: '+input);

    return token;
  }

  var ruleTable = { // indexed by last character of word

    "a": [{
      "continuation": false,
      "intact": true,
      "pattern": "ia",
      "size": "2"
    }, {
      "continuation": false,
      "intact": true,
      "pattern": "a",
      "size": "1"
    }],
    "b": [{
      "continuation": false,
      "intact": false,
      "pattern": "bb",
      "size": "1"
    }],
    "c": [{
      "appendage": "s",
      "continuation": false,
      "intact": false,
      "pattern": "ytic",
      "size": "3"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ic",
      "size": "2"
    }, {
      "appendage": "t",
      "continuation": true,
      "intact": false,
      "pattern": "nc",
      "size": "1"
    }],
    "d": [{
      "continuation": false,
      "intact": false,
      "pattern": "dd",
      "size": "1"
    }, {
      "appendage": "y",
      "continuation": true,
      "intact": false,
      "pattern": "ied",
      "size": "3"
    }, {
      "appendage": "s",
      "continuation": false,
      "intact": false,
      "pattern": "ceed",
      "size": "2"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "eed",
      "size": "1"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ed",
      "size": "2"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "hood",
      "size": "4"
    }],
    "e": [{
      "continuation": true,
      "intact": false,
      "pattern": "e",
      "size": "1"
    }],
    "f": [{
      "appendage": "v",
      "continuation": false,
      "intact": false,
      "pattern": "lief",
      "size": "1"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "if",
      "size": "2"
    }],
    "g": [{
      "continuation": true,
      "intact": false,
      "pattern": "ing",
      "size": "3"
    }, {
      "appendage": "y",
      "continuation": false,
      "intact": false,
      "pattern": "iag",
      "size": "3"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ag",
      "size": "2"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "gg",
      "size": "1"
    }],
    "h": [{
      "continuation": false,
      "intact": true,
      "pattern": "th",
      "size": "2"
    }, {
      "appendage": "c",
      "continuation": false,
      "intact": false,
      "pattern": "guish",
      "size": "5"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ish",
      "size": "3"
    }],
    "i": [{
      "continuation": false,
      "intact": true,
      "pattern": "i",
      "size": "1"
    }, {
      "appendage": "y",
      "continuation": true,
      "intact": false,
      "pattern": "i",
      "size": "1"
    }],
    "j": [{
      "appendage": "d",
      "continuation": false,
      "intact": false,
      "pattern": "ij",
      "size": "1"
    }, {
      "appendage": "s",
      "continuation": false,
      "intact": false,
      "pattern": "fuj",
      "size": "1"
    }, {
      "appendage": "d",
      "continuation": false,
      "intact": false,
      "pattern": "uj",
      "size": "1"
    }, {
      "appendage": "d",
      "continuation": false,
      "intact": false,
      "pattern": "oj",
      "size": "1"
    }, {
      "appendage": "r",
      "continuation": false,
      "intact": false,
      "pattern": "hej",
      "size": "1"
    }, {
      "appendage": "t",
      "continuation": false,
      "intact": false,
      "pattern": "verj",
      "size": "1"
    }, {
      "appendage": "t",
      "continuation": false,
      "intact": false,
      "pattern": "misj",
      "size": "2"
    }, {
      "appendage": "d",
      "continuation": false,
      "intact": false,
      "pattern": "nj",
      "size": "1"
    }, {
      "appendage": "s",
      "continuation": false,
      "intact": false,
      "pattern": "j",
      "size": "1"
    }],
    "l": [{
      "continuation": false,
      "intact": false,
      "pattern": "ifiabl",
      "size": "6"
    }, {
      "appendage": "y",
      "continuation": false,
      "intact": false,
      "pattern": "iabl",
      "size": "4"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "abl",
      "size": "3"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "ibl",
      "size": "3"
    }, {
      "appendage": "l",
      "continuation": true,
      "intact": false,
      "pattern": "bil",
      "size": "2"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "cl",
      "size": "1"
    }, {
      "appendage": "y",
      "continuation": false,
      "intact": false,
      "pattern": "iful",
      "size": "4"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ful",
      "size": "3"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "ul",
      "size": "2"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ial",
      "size": "3"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ual",
      "size": "3"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "al",
      "size": "2"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "ll",
      "size": "1"
    }],
    "m": [{
      "continuation": false,
      "intact": false,
      "pattern": "ium",
      "size": "3"
    }, {
      "continuation": false,
      "intact": true,
      "pattern": "um",
      "size": "2"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ism",
      "size": "3"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "mm",
      "size": "1"
    }],
    "n": [{
      "appendage": "j",
      "continuation": true,
      "intact": false,
      "pattern": "sion",
      "size": "4"
    }, {
      "appendage": "c",
      "continuation": false,
      "intact": false,
      "pattern": "xion",
      "size": "4"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ion",
      "size": "3"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ian",
      "size": "3"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "an",
      "size": "2"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "een",
      "size": "0"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "en",
      "size": "2"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "nn",
      "size": "1"
    }],
    "p": [{
      "continuation": true,
      "intact": false,
      "pattern": "ship",
      "size": "4"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "pp",
      "size": "1"
    }],
    "r": [{
      "continuation": true,
      "intact": false,
      "pattern": "er",
      "size": "2"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "ear",
      "size": "0"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "ar",
      "size": "2"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "or",
      "size": "2"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ur",
      "size": "2"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "rr",
      "size": "1"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "tr",
      "size": "1"
    }, {
      "appendage": "y",
      "continuation": true,
      "intact": false,
      "pattern": "ier",
      "size": "3"
    }],
    "s": [{
      "appendage": "y",
      "continuation": true,
      "intact": false,
      "pattern": "ies",
      "size": "3"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "sis",
      "size": "2"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "is",
      "size": "2"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ness",
      "size": "4"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "ss",
      "size": "0"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ous",
      "size": "3"
    }, {
      "continuation": false,
      "intact": true,
      "pattern": "us",
      "size": "2"
    }, {
      "continuation": true,
      "intact": true,
      "pattern": "s",
      "size": "1"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "s",
      "size": "0"
    }],
    "t": [{
      "appendage": "y",
      "continuation": false,
      "intact": false,
      "pattern": "plicat",
      "size": "4"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "at",
      "size": "2"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ment",
      "size": "4"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ent",
      "size": "3"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ant",
      "size": "3"
    }, {
      "appendage": "b",
      "continuation": false,
      "intact": false,
      "pattern": "ript",
      "size": "2"
    }, {
      "appendage": "b",
      "continuation": false,
      "intact": false,
      "pattern": "orpt",
      "size": "2"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "duct",
      "size": "1"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "sumpt",
      "size": "2"
    }, {
      "appendage": "i",
      "continuation": false,
      "intact": false,
      "pattern": "cept",
      "size": "2"
    }, {
      "appendage": "v",
      "continuation": false,
      "intact": false,
      "pattern": "olut",
      "size": "2"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "sist",
      "size": "0"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ist",
      "size": "3"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "tt",
      "size": "1"
    }],
    "u": [{
      "continuation": false,
      "intact": false,
      "pattern": "iqu",
      "size": "3"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "ogu",
      "size": "1"
    }],
    "v": [{
      "appendage": "j",
      "continuation": true,
      "intact": false,
      "pattern": "siv",
      "size": "3"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "eiv",
      "size": "0"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "iv",
      "size": "2"
    }],
    "y": [{
      "continuation": true,
      "intact": false,
      "pattern": "bly",
      "size": "1"
    }, {
      "appendage": "y",
      "continuation": true,
      "intact": false,
      "pattern": "ily",
      "size": "3"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "ply",
      "size": "0"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ly",
      "size": "2"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "ogy",
      "size": "1"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "phy",
      "size": "1"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "omy",
      "size": "1"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "opy",
      "size": "1"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ity",
      "size": "3"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ety",
      "size": "3"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "lty",
      "size": "2"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "istry",
      "size": "5"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ary",
      "size": "3"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "ory",
      "size": "3"
    }, {
      "continuation": false,
      "intact": false,
      "pattern": "ify",
      "size": "3"
    }, {
      "appendage": "t",
      "continuation": true,
      "intact": false,
      "pattern": "ncy",
      "size": "2"
    }, {
      "continuation": true,
      "intact": false,
      "pattern": "acy",
      "size": "3"
    }],
    "z": [{
      "continuation": true,
      "intact": false,
      "pattern": "iz",
      "size": "2"
    }, {
      "appendage": "s",
      "continuation": false,
      "intact": false,
      "pattern": "yz",
      "size": "1"
    }]
  };

  return function(token) {

    return applyRules(token.toLowerCase(), true);
  };

})();

// PlingStemmer categories

/* Words that are both singular and plural */
var categorySP = ['acoustics', 'aesthetics', 'aquatics', 'basics', 'ceramics', 'classics', 'cosmetics', 'dialectics', 'deer', 'dynamics', 'ethics', 'harmonics', 'heroics', 'mechanics', 'metrics', 'optics', 'people', 'physics', 'polemics', 'pyrotechnics', 'quadratics', 'quarters', 'statistics', 'tactics', 'tropics'];

/* Words that end in '-se' in their plural forms (like 'nurse' etc.) */
var categorySE_SES = ['abuses', 'apocalypses', 'blouses', 'bruises', 'chaises','cheeses', 'chemises', 'clauses', 'corpses', 'courses', 'crazes','creases', 'cruises', 'curses', 'databases', 'dazes', 'defenses', 'demises', 'discourses', 'diseases', 'doses','eclipses', 'enterprises','expenses', 'friezes', 'fuses', 'glimpses', 'guises', 'hearses', 'horses', 'houses', 'impasses', 'impulses', 'kamikazes', 'mazes','mousses','noises', 'nooses', 'noses', 'nurses', 'obverses', 'offenses', 'overdoses', 'phrases', 'posses', 'premises', 'pretenses', 'proteases', 'pulses',  'purposes', 'purses', 'racehorses', 'recluses','recourses', 'relapses', 'responses', 'roses', 'ruses', 'spouses', 'stripteases', 'subleases', 'sunrises', 'tortoises', 'trapezes', 'treatises', 'universes', 'vases', 'verses', 'vises', 'wheelbases'];

/* Words that do not have a distinct plural form (like 'atlas' etc.) */
var category00 = ['alias', 'asbestos', 'atlas', 'barracks', 'bathos', 'bias', 'breeches', 'britches', 'canvas', 'chaos', 'clippers', 'contretemps', 'corps', 'cosmos', 'crossroads', 'diabetes', 'ethos', 'gallows', 'gas', 'graffiti', 'headquarters', 'herpes', 'high-jinks', 'innings', 'jackanapes', 'lens', 'means', 'measles', 'mews', 'mumps', 'news', 'pathos', 'pincers', 'pliers', 'proceedings', 'rabies', 'rhinoceros', 'sassafras', 'scissors', 'series', 'shears', 'species', 'tuna'];

/* Words that change from '-um' to '-a' (like 'curriculum' etc.), listed in their plural forms */
var categoryUM_A = ['addenda', 'agenda', 'aquaria', 'bacteria', 'candelabra', 'compendia', 'consortia', 'crania', 'curricula', 'data', 'desiderata', 'dicta', 'emporia', 'enconia', 'errata', 'extrema', 'gymnasia', 'honoraria', 'interregna', 'lustra', 'maxima', 'media', 'memoranda', 'millenia', 'minima', 'momenta', 'optima', 'ova', 'phyla', 'quanta', 'rostra', 'spectra', 'specula', 'stadia', 'strata', 'symposia', 'trapezia', 'ultimata', 'vacua', 'vela'];

/* Words that change from '-on' to '-a' (like 'phenomenon' etc.), listed in their plural forms */
var categoryON_A = ['aphelia', 'asyndeta', 'automata', 'criteria', 'hyperbata', 'noumena', 'organa', 'perihelia', 'phenomena', 'prolegomena','referenda'];

/* Words that change from '-o' to '-i' (like 'libretto' etc.), listed in their plural forms */
var categoryO_I = ['alti', 'bassi', 'canti', 'contralti', 'crescendi', 'libretti', 'soli', 'soprani', 'tempi', 'virtuosi'];

/*  Words that change from '-us' to '-i' (like 'fungus' etc.), listed in their plural forms		 */
var categoryUS_I = ['alumni', 'bacilli', 'cacti', 'foci', 'fungi', 'genii', 'hippopotami', 'incubi', 'nimbi', 'nuclei', 'nucleoli', 'octopi', 'radii', 'stimuli', 'styli', 'succubi', 'syllabi', 'termini', 'tori', 'umbilici', 'uteri'];

/* Words that change from '-ix' to '-ices' (like 'appendix' etc.), listed in their plural forms */
var categoryIX_ICES = ['appendices', 'cervices'];

/* Words that change from '-is' to '-es' (like 'axis' etc.), listed in their plural forms, plus everybody ending in theses */
var categoryIS_ES = ['analyses', 'axes', 'bases','crises', 'diagnoses', 'ellipses', 'emphases', 'neuroses', 'oases', 'paralyses', 'prognoses', 'synopses'];

/* Words that change from '-oe' to '-oes' (like 'toe' etc.), listed in their plural forms*/
var categoryOE_OES = ['aloes', 'backhoes', 'beroes', 'canoes', 'chigoes', 'cohoes', 'does', 'felloes', 'floes', 'foes', 'gumshoes', 'hammertoes', 'hoes', 'hoopoes', 'horseshoes', 'leucothoes', 'mahoes', 'mistletoes', 'oboes', 'overshoes', 'pahoehoes', 'pekoes', 'roes', 'shoes', 'sloes', 'snowshoes', 'throes', 'tic-tac-toes', 'tick-tack-toes', 'ticktacktoes', 'tiptoes', 'tit-tat-toes', 'toes', 'toetoes', 'tuckahoes', 'woes'];

/* Words that change from '-ex' to '-ices' (like 'index' etc.), listed in their plural forms*/
var categoryEX_ICES = ['apices', 'codices', 'cortices', 'indices', 'latices', 'murices', 'pontifices', 'silices', 'simplices', 'vertices', 'vortices'];

/* Words that change from '-u' to '-us' (like 'emu' etc.), listed in their plural forms*/
var categoryU_US = [ 'menus', 'gurus', 'apercus', 'barbus', 'cornus', 'ecrus', 'emus', 'fondus', 'gnus', 'iglus', 'mus', 'nandus', 'napus', 'poilus', 'quipus', 'snafus', 'tabus', 'tamandus', 'tatus', 'timucus', 'tiramisus', 'tofus', 'tutus'];

/* Words that change from '-sse' to '-sses' (like 'finesse' etc.), listed in their plural forms,plus those ending in mousse*/
var categorySSE_SSES = ['bouillabaisses', 'coulisses', 'crevasses', 'crosses', 'cuisses', 'demitasses', 'ecrevisses', 'fesses', 'finesses', 'fosses', 'impasses', 'lacrosses', 'largesses', 'masses', 'noblesses', 'palliasses', 'pelisses', 'politesses', 'posses', 'tasses', 'wrasses'];

/* Words that change from '-che' to '-ches' (like 'brioche' etc.), listed in their plural forms*/
var categoryCHE_CHES = ['adrenarches', 'attaches', 'avalanches', 'barouches', 'brioches', 'caches', 'caleches', 'caroches', 'cartouches', 'cliches', 'cloches', 'creches', 'demarches', 'douches', 'gouaches', 'guilloches', 'headaches', 'heartaches', 'huaraches', 'menarches', 'microfiches', 'moustaches', 'mustaches', 'niches', 'panaches', 'panoches', 'pastiches', 'penuches', 'pinches', 'postiches', 'psyches', 'quiches', 'schottisches', 'seiches', 'soutaches', 'synecdoches', 'thelarches', 'troches'];

/* Words that end with '-ics' and do not exist as nouns without the 's' (like 'aerobics' etc.)*/
var categoryICS = ['aerobatics', 'aerobics', 'aerodynamics', 'aeromechanics', 'aeronautics', 'alphanumerics', 'animatronics', 'apologetics', 'architectonics', 'astrodynamics', 'astronautics', 'astrophysics', 'athletics', 'atmospherics', 'autogenics', 'avionics', 'ballistics', 'bibliotics', 'bioethics', 'biometrics', 'bionics', 'bionomics', 'biophysics', 'biosystematics', 'cacogenics', 'calisthenics', 'callisthenics', 'catoptrics', 'civics', 'cladistics', 'cryogenics', 'cryonics', 'cryptanalytics', 'cybernetics', 'cytoarchitectonics', 'cytogenetics', 'diagnostics', 'dietetics', 'dramatics', 'dysgenics', 'econometrics', 'economics', 'electromagnetics', 'electronics', 'electrostatics', 'endodontics', 'enterics', 'ergonomics', 'eugenics', 'eurhythmics', 'eurythmics', 'exodontics', 'fibreoptics', 'futuristics', 'genetics', 'genomics', 'geographics', 'geophysics', 'geopolitics', 'geriatrics', 'glyptics', 'graphics', 'gymnastics', 'hermeneutics', 'histrionics', 'homiletics', 'hydraulics', 'hydrodynamics', 'hydrokinetics', 'hydroponics', 'hydrostatics', 'hygienics', 'informatics', 'kinematics', 'kinesthetics', 'kinetics', 'lexicostatistics', 'linguistics', 'lithoglyptics', 'liturgics', 'logistics', 'macrobiotics', 'macroeconomics', 'magnetics', 'magnetohydrodynamics', 'mathematics', 'metamathematics', 'metaphysics', 'microeconomics', 'microelectronics', 'mnemonics', 'morphophonemics', 'neuroethics', 'neurolinguistics', 'nucleonics', 'numismatics', 'obstetrics', 'onomastics', 'orthodontics', 'orthopaedics', 'orthopedics', 'orthoptics', 'paediatrics', 'patristics', 'patristics', 'pedagogics', 'pediatrics', 'periodontics', 'pharmaceutics', 'pharmacogenetics', 'pharmacokinetics', 'phonemics', 'phonetics', 'phonics', 'photomechanics', 'physiatrics', 'pneumatics', 'poetics', 'politics', 'pragmatics', 'prosthetics', 'prosthodontics', 'proteomics', 'proxemics', 'psycholinguistics', 'psychometrics', 'psychonomics', 'psychophysics', 'psychotherapeutics', 'robotics', 'semantics', 'semiotics', 'semitropics', 'sociolinguistics', 'stemmatics', 'strategics', 'subtropics', 'systematics', 'tectonics', 'telerobotics', 'therapeutics', 'thermionics', 'thermodynamics', 'thermostatics'];

/* Words that change from '-ie' to '-ies' (like 'auntie' etc.), listed in their plural forms*/
var categoryIE_IES = ['aeries', 'anomies', 'aunties', 'baddies', 'beanies', 'birdies', 'bogies', 'bonhomies', 'boogies', 'bookies', 'booties', 'bourgeoisies', 'brasseries', 'brassies', 'brownies', 'caddies', 'calories', 'camaraderies', 'charcuteries',  'collies', 'commies', 'cookies', 'coolies', 'coonties', 'cooties', 'coteries', 'cowpies', 'cowries', 'cozies', 'crappies', 'crossties', 'curies', 'darkies', 'dearies', 'dickies', 'dies', 'dixies', 'doggies', 'dogies', 'eyries', 'faeries', 'falsies', 'floozies', 'folies', 'foodies', 'freebies', 'gendarmeries', 'genies', 'gillies', 'goalies', 'goonies', 'grannies','groupies', 'hankies', 'hippies', 'hoagies', 'honkies', 'indies', 'junkies', 'kelpies', 'kilocalories', 'laddies', 'lassies', 'lies', 'lingeries', 'magpies', 'magpies', 'mashies', 'mealies', 'meanies', 'menageries', 'mollies', 'moxies', 'neckties', 'newbies', 'nighties', 'nookies', 'oldies', 'panties', 'patisseries', 'pies', 'pinkies', 'pixies', 'porkpies', 'potpies', 'prairies', 'preemies', 'pyxies', 'quickies','reveries', 'rookies', 'rotisseries', 'scrapies', 'sharpies', 'smoothies', 'softies', 'stoolies', 'stymies', 'swaggies', 'sweeties', 'talkies', 'techies', 'ties', 'tooshies', 'toughies', 'townies', 'veggies', 'walkie-talkies', 'wedgies', 'weenies', 'yuppies', 'zombies'];

/* Maps irregular Germanic English plural nouns to their singular form */
var categoryIRR = [ 'blondes', 'blonde', 'teeth', 'tooth', 'beefs', 'beef', 'brethren', 'brother', 'busses', 'bus', 'cattle', 'cow', 'children', 'child', 'corpora', 'corpus', 'genera', 'genus', 'genies', 'genie', 'genii', 'genie', 'lice', 'louse', 'mice', 'mouse', 'mongooses', 'mongoose', 'monies', 'money', 'octopodes', 'octopus',  'oxen', 'ox', 'people', 'person', 'soliloquies', 'soliloquy', 'taxis', 'taxi', 'throes', 'throes', 'trilbys', 'trilby', 'innings', 'inning', 'alibis', 'alibi', 'skis', 'ski' ];

function checkPluralNoLex(s) {
  var cats = [
    categoryUM_A,
    categoryON_A,
    categoryO_I,
    categoryUS_I,
    categoryIX_ICES
  ];
  for (var i = 0; i < cats.length; i++) {
    if (cats[i].indexOf(s) > -1)
      return true;
  }
  var idx = categoryIRR.indexOf(s); // plurals at even indices
  return (idx%2 === 0) ? true : false;
}

/* From the PlingStemmer impl in the Java Tools package (see http://mpii.de/yago-naga/javatools). */
RiTa.stemmers.Pling = (function() {

  function isPlural(s) {
    return s !== stem(s);
  }

  // Note that a word can be both plural and singular
  function isSingular(s) {
    return (categorySP._arrayContains(s.toLowerCase()) || !isPlural(s));
  }

  function isSingularAndPlural(s) {
    return (categorySP._arrayContains(s.toLowerCase()));
  }

  // Cuts a suffix from a string (that is the number of chars given by the
  function cut(s, suffix) {
    return (s.substring(0, s.length - suffix.length));
  }

  /* Returns true if a word is probably not Latin */
  function noLatin(s) {
    return (s.indexOf('h') > 0 || s.indexOf('j') > 0 || s.indexOf('k') > 0 || s.indexOf('w') > 0 || s.indexOf('y') > 0 || s.indexOf('z') > 0 || s.indexOf("ou") > 0 || s.indexOf("sh") > 0 || s.indexOf("ch") > 0 || s._endsWith("aus"));
  }

  /* Returns true if a word is probably Greek */
  function greek(s) {
    return (s.indexOf("ph") > 0 || s.indexOf('y') > 0 && s._endsWith("nges"));
  }

  function stem(s) {

    // Handle irregular ones
    if (categoryIRR._arrayContains(s)) {
        var index = categoryIRR.indexOf(s),
            irreg;
        if (index % 2 == 0)
            irreg = categoryIRR[index + 1];
        return (irreg);
    }
    // -on to -a
    if (categoryON_A._arrayContains(s))
      return (cut(s, "a") + "on");

    // -um to -a
    if (categoryUM_A._arrayContains(s))
      return (cut(s, "a") + "um");

    // -x to -ices
    if (categoryIX_ICES._arrayContains(s))
      return (cut(s, "ices") + "ix");

    // -o to -i
    if (categoryO_I._arrayContains(s))
      return (cut(s, "i") + "o");

    // -se to ses
    if (categorySE_SES._arrayContains(s))
      return (cut(s, "s"));

    // -is to -es
    if (categoryIS_ES._arrayContains(s) || s._endsWith("theses"))
      return (cut(s, "es") + "is");

    // -us to -i
    if (categoryUS_I._arrayContains(s))
      return (cut(s, "i") + "us");

    //Wrong plural
    if (s._endsWith("uses") && (categoryUS_I._arrayContains(cut(s, "uses") + "i") || s === ("genuses") || s === ("corpuses")))
      return (cut(s, "es"));

    // -ex to -ices
    if (categoryEX_ICES._arrayContains(s))
      return (cut(s, "ices") + "ex");

    // Words that do not inflect in the plural
    if (s._endsWith("ois") || s._endsWith("itis") || category00._arrayContains(s) || categoryICS._arrayContains(s))
      return (s);

    // -en to -ina
    // No other common words end in -ina
    if (s._endsWith("ina"))
      return (cut(s, "en"));

    // -a to -ae
    // No other common words end in -ae
    if (s._endsWith("ae") && s !== 'pleae') // special case
      return (cut(s, "e"));

    // -a to -ata
    // No other common words end in -ata
    if (s._endsWith("ata"))
      return (cut(s, "ta"));

    // trix to -trices
    // No common word ends with -trice(s)
    if (s._endsWith("trices"))
      return (cut(s, "trices") + "trix");

    // -us to -us
    //No other common word ends in -us, except for false plurals of French words
    //Catch words that are not latin or known to end in -u
    if (s._endsWith("us") && !s._endsWith("eaus") && !s._endsWith("ieus") && !noLatin(s) && !categoryU_US._arrayContains(s))
      return (s);

    // -tooth to -teeth
    // -goose to -geese
    // -foot to -feet
    // -zoon to -zoa
    //No other common words end with the indicated suffixes
    if (s._endsWith("teeth"))
      return (cut(s, "teeth") + "tooth");
    if (s._endsWith("geese"))
      return (cut(s, "geese") + "goose");
    if (s._endsWith("feet"))
      return (cut(s, "feet") + "foot");
    if (s._endsWith("zoa"))
      return (cut(s, "zoa") + "zoon");

    // -men to -man
    // -firemen to -fireman
    if(s._endsWith("men")) return (cut(s,"men")+"man");

    // -martinis to -martini
    // -bikinis to -bikini
    if(s._endsWith("inis")) return (cut(s,"inis")+"ini");

    // -children to -child
    // -schoolchildren to -schoolchild
    if(s._endsWith("children")) return (cut(s,"ren"));

    // -eau to -eaux
    //No other common words end in eaux
    if (s._endsWith("eaux"))
      return (cut(s, "x"));

    // -ieu to -ieux
    //No other common words end in ieux
    if (s._endsWith("ieux"))
      return (cut(s, "x"));

    // -nx to -nges
    // Pay attention not to kill words ending in -nge with plural -nges
    // Take only Greek words (works fine, only a handfull of exceptions)
    if (s._endsWith("nges") && greek(s))
      return (cut(s, "nges") + "nx");

    // -[sc]h to -[sc]hes
    //No other common word ends with "shes", "ches" or "she(s)"
    //Quite a lot end with "che(s)", filter them out
    if (s._endsWith("shes") || s._endsWith("ches") && !categoryCHE_CHES._arrayContains(s))
      return (cut(s, "es"));

    // -ss to -sses
    // No other common singular word ends with "sses"
    // Filter out those ending in "sse(s)"
    if (s._endsWith("sses") && !categorySSE_SSES._arrayContains(s) && !s._endsWith("mousses"))
      return (cut(s, "es"));

    // -x to -xes
    // No other common word ends with "xe(s)" except for "axe"
    if (s._endsWith("xes") && s !== "axes")
      return (cut(s, "es"));

    // -[nlw]ife to -[nlw]ives
    //No other common word ends with "[nlw]ive(s)" except for olive
    if (s._endsWith("nives") || s._endsWith("lives") && !s._endsWith("olives") || s._endsWith("wives"))
      return (cut(s, "ves") + "fe");

    // -[aeo]lf to -ves  exceptions: valve, solve
    // -[^d]eaf to -ves  exceptions: heave, weave
    // -arf to -ves      no exception
    if (s._endsWith("alves") && !s._endsWith("valves") || s._endsWith("olves") && !s._endsWith("solves") || s._endsWith("eaves") && !s._endsWith("heaves") && !s._endsWith("weaves") || s._endsWith("arves") || s._endsWith("shelves")|| s._endsWith("selves"))
      return (cut(s, "ves") + "f");

    // -y to -ies
    // -ies is very uncommon as a singular suffix
    // but -ie is quite common, filter them out
    if (s._endsWith("ies") && !categoryIE_IES._arrayContains(s))
      return (cut(s, "ies") + "y");

    // -o to -oes
    // Some words end with -oe, so don't kill the "e"
    if (s._endsWith("oes") && !categoryOE_OES._arrayContains(s))
      return (cut(s, "es"));

    // -s to -ses
    // -z to -zes
    // no words end with "-ses" or "-zes" in singular
    if (s._endsWith("ses") || s._endsWith("zes"))
      return (cut(s, "es"));

    // - to -s
    if (s._endsWith("s") && !s._endsWith("ss") && !s._endsWith("is"))
      return (cut(s, "s"));

    return (s);
  }

  return function(token) {

    return stem(token.toLowerCase());
  };

})();

Array.prototype._arrayContains = function(ele) {
  return (this.indexOf(ele) > -1);
};

String.prototype._endsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

var MinEditDist = {

  _min3: function(a, b, c) {

    var min = a;
    if (b < min) min = b;
    if (c < min) min = c;
    return min;
  },

  // med where each array element either matches or does not
  _computeRawArray: function(srcArr, trgArr) {

    //log((srcArr)+" "+(trgArr));

    var matrix = []; // matrix
    var sI; // ith element of s
    var tJ; // jth element of t
    var cost; // cost
    var i, j, sl, tl;

    // Step 1 ----------------------------------------------

    if (!srcArr.length) return trgArr.length;

    if (!trgArr.length) return srcArr.length;

    // Step 2 ----------------------------------------------

    for (i = 0, sl = srcArr.length; i <= sl; i++) {

      matrix[i] = [];
      matrix[i][0] = i;
    }

    for (j = 0, tl = trgArr.length; j <= tl; j++)
      matrix[0][j] = j;

    // Step 3 ----------------------------------------------

    for (i = 1, sl = srcArr.length; i <= sl; i++) {

      sI = srcArr[i - 1];

      // Step 4 --------------------------------------------

      for (j = 1, tl = trgArr.length; j <= tl; j++) {

        tJ = trgArr[j - 1];

        // Step 5 ------------------------------------------

        cost = (sI === tJ) ? 0 : 1;

        // Step 6 ------------------------------------------

        matrix[i][j] = this._min3(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost);
      }
    }

    // Step 7 ----------------------------------------------

    return matrix[srcArr.length][trgArr.length];
  },


  // med for 2 strings (or 2 arrays)
  computeRaw: function(source, target) {

    //log('computeRaw: '+arguments.length+ " "+Type.get(source));

    if (is(source, A)) return this._computeRawArray(source, target);

    if (!source.length && !target.length) return 0;

    var i, j, matrix = []; // matrix
    var cost; // cost
    var sI; // ith character of s
    var tJ; // jth character of t

    // Step 1 ----------------------------------------------

    var sourceLength = source.length;
    var targetLength = target.length;

    if (!sourceLength) return targetLength;

    if (!targetLength) return sourceLength;

    // Step 2 ----------------------------------------------

    for (i = 0; i <= sourceLength; i++) {
      matrix[i] = [];
      matrix[i][0] = i;
    }

    for (j = 0; j <= targetLength; j++)
      matrix[0][j] = j;

    // Step 3 ----------------------------------------------

    for (i = 1; i <= sourceLength; i++) {
      sI = source.charAt(i - 1);

      // Step 4 --------------------------------------------

      for (j = 1; j <= targetLength; j++) {
        tJ = target.charAt(j - 1);

        // Step 5 ------------------------------------------

        cost = (sI == tJ) ? 0 : 1;

        // Step 6 ------------------------------------------
        matrix[i][j] = this._min3(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost);
      }
    }

    // Step 7 ----------------------------------------------

    return matrix[sourceLength][targetLength];

  },

  // med 2 strings (or 2 string arrays) divided by max of their lengths
  computeAdjusted: function(source, target) {

    var st = get(source), tt = get(source);

    if (st === tt) {
      if (tt === S) {
        if (!source.length && !target.length) return 0;
        //log(this.computeRaw(source, target)+'/'+(source.length + target.length));
        return this.computeRaw(source, target) / Math.max(source.length, target.length);
      } else if (tt === A) {
        if (!source.length && !target.length) return 0;
        //log(_computeRawArray(source, target)+'/'+(source.length + target.length));
        return this._computeRawArray(source, target) / Math.max(source.length, target.length);
      }
    }
    err('Unexpected args: ' + source + "/" + target);
  }
};

var Concorder = makeClass();

Concorder.prototype = {

  init: function(text, options) {

    this.model = null;
    this.wordsToIgnore = [];
    this.ignoreCase = false;
    this.ignoreStopWords = false;
    this.ignorePunctuation = false;

    if (options) {
      options.ignoreCase && (this.ignoreCase = true);
      options.ignoreStopWords && (this.ignoreStopWords = true);
      options.ignorePunctuation && (this.ignorePunctuation = true);
      options.wordsToIgnore && (this.wordsToIgnore = options.wordsToIgnore);
    }

    if (this.ignoreStopWords)
      this.wordsToIgnore = this.wordsToIgnore.concat(RiTa.STOP_WORDS);

    this.words = is(text, A) ? text : RiTa.tokenize(text);
  },

  count: function(word) {

    var value = this.lookup(word);
    return value === null ? 0 : value.count;
  },

  concordance: function() {

    if (!this.model) this.build();

    var result = {};
    for (var name in this.model)
      result[name] = this.model[name].indexes.length;

    // TODO: need to sort by value here
    return result;
  },

  kwic: function(word, numWords) {

    var value = this.lookup(word), result = [];
    if (value) {
      var idxs = value.indexes;
      for (var i = 0; i < idxs.length; i++) {
          var sub = this.words.slice(Math.max(0,idxs[i] - numWords),
            Math.min(this.words.length, idxs[i] + numWords+1));

          if (i < 1 || (idxs[i] - idxs[i - 1]) > numWords)
            result.push(RiTa.untokenize(sub));
      }
    }
    return result;
  },

  build: function() {

    if (!this.words) throw Error('No text in model');

    this.model = {};
    var ts = +new Date();
    for (var j = 0; j < this.words.length; j++) {

      var word = this.words[j];
      if (this.ignorable(word)) continue;
      var lookup = this.lookup(word);

      // The typeof check below fixes a strange bug in Firefox: #XYZ
      // where the string 'watch' comes back from lookup as a function
      // TODO: resolve in a better way
      if (!lookup || typeof lookup !== 'object') {

         lookup = { word: word, key: this.compareKey(word), indexes: [] };
         this.model[lookup.key] = lookup;
      }
      lookup.indexes.push(j);
    }
  },

  ignorable: function(key) {

    if (this.ignorePunctuation && RiTa.isPunctuation(key))
      return true;

    for (var i = 0; i < this.wordsToIgnore.length; i++) {
      var word = this.wordsToIgnore[i];
      if ((this.ignoreCase && key.toUpperCase() === word.toUpperCase()) || key===word)
          return true;
    }
    return false;
  },

  compareKey: function(word) {
    return this.ignoreCase ? word.toLowerCase() : word;
  },

  lookup: function(word) {
    var key = this.compareKey(word);
    if (!this.model) this.build();
    return this.model[key];
  }
};

var RE = makeClass();

RE.prototype = {

  init: function(regex, offset, suffix) {
    this.regex = new RegExp(regex);
    this.offset = offset;
    this.suffix = suffix || '';
  },

  applies: function(word) {
    return this.regex.test(trim(word));
  },

  fire: function(word) {
    return this.truncate(trim(word)) + this.suffix;
  },

  analyze: function(word) {
    return ((this.suffix != E) && endsWith(word, this.suffix)) ? true : false;
  },

  truncate: function(word) {
    return (this.offset === 0) ? word : word.substr(0, word.length - this.offset);
  }
};

var QUESTION_STARTS =   [ "Was", "What", "When", "Where", "Which", "Why", "Who", "Will", "Would",
                          "How", "If", "Who", "Is", "Could", "Might", "Does", "Are", "Have" ];

var W_QUESTION_STARTS = [ "Was", "What", "When", "Where", "Which", "Why", "Who", "Will", "Would" ];

var PUNCTUATION_CLASS = /[�`~\"\/'_\-[\]{}()*+!?%&.,\\^$|#@<>|+=;:\u2018\u2019\u201C\u201D]/g; // TODO: add smart-quotes

var ONLY_PUNCT = /^[^0-9A-Za-z\s]*$/,
  DEFAULT_PLURAL_RULE = RE("^((\\w+)(-\\w+)*)(\\s((\\w+)(-\\w+)*))*$", 0, "s"),
  ALL_PUNCT = /^[-[\]{}()*+!?%&.,\\^$|#@<>|+=;:]+$/g;

var NULL_PLURALS = RE( // these don't change for plural/singular
  "^(bantu|bengalese|bengali|beninese|boche|bonsai|booze|cellulose|digitalis|mess|moose|" + "burmese|chinese|colossus|congolese|discus|emphasis|expertise|finess|fructose|gabonese|gauze|glucose|grease|guyanese|haze|incense|japanese|javanese|journalese|" + "lebanese|malaise|manganese|mayonnaise|maltese|menopause|merchandise|nitrocellulose|olympics|overuse|paradise|poise|polymerase|portuguese|prose|recompense|remorse|repose|senegalese|siamese|singhalese|innings|" + "sleaze|sinhalese|sioux|sudanese|suspense|swiss|taiwanese|togolese|vietnamese|unease|aircraft|anise|antifreeze|applause|archdiocese|" + "anopheles|apparatus|asparagus|barracks|bellows|bison|bluefish|bob|bourgeois|" + "bream|brill|butterfingers|cargo|carp|catfish|chassis|clothes|chub|cod|codfish|" + "coley|contretemps|corps|crawfish|crayfish|crossroads|cuttlefish|dace|deer|dice|" + "dogfish|doings|dory|downstairs|eldest|earnings|economics|electronics|finnan|" + "firstborn|fish|flatfish|flounder|fowl|fry|fries|works|globefish|goldfish|golf|" + "grand|grief|gudgeon|gulden|haddock|hake|halibut|headquarters|herring|hertz|horsepower|" + "goods|hovercraft|hundredweight|ironworks|jackanapes|kilohertz|kurus|kwacha|ling|lungfish|" + "mackerel|means|megahertz|moorfowl|moorgame|mullet|nepalese|offspring|pampas|parr|pants|" + "patois|pekinese|penn'orth|perch|pickerel|pike|pince-nez|plaice|precis|quid|rand|" + "rendezvous|revers|roach|roux|salmon|samurai|series|seychelles|seychellois|shad|" + "sheep|shellfish|smelt|spacecraft|species|starfish|stockfish|sunfish|superficies|" + "sweepstakes|swordfish|tench|tennis|[a-z]+osis|[a-z]+itis|[a-z]+ness|" + "tobacco|tope|triceps|trout|tuna|tunafish|tunny|turbot|trousers|" + "undersigned|veg|waterfowl|waterworks|waxworks|whiting|wildfowl|woodworm|" + "yen|aries|pisces|forceps|lieder|jeans|physics|mathematics|news|odds|politics|remains|" + "acoustics|aesthetics|aquatics|basics|ceramics|classics|cosmetics|dialectics|dynamics|ethics|harmonics|heroics|mechanics|metrics|optics|physics|polemics|pyrotechnics|" + "surroundings|thanks|statistics|goods|aids|wildlife)$", 0);



var SINGULAR_RULES = [
  NULL_PLURALS,
  RE("whizzes", 3),
  RE("^(buses|octopuses)$", 2),
  RE("(houses|horses|cases)$", 1),
  RE("^(toes|wheezes|oozes)$", 1),
  RE("(men|women)$", 2, "an"),
  RE("^[lm]ice$", 3, "ouse"),
  RE("^children", 3),
  RE("^(appendices|indices|matrices)", 3, "x"),
  RE("^(data)$", 1, "um"),
  RE("people", 4, "rson"),
  RE("^meninges|phalanges$", 3, "x"),
  RE("schemata$", 2, "s"),
  RE("^corpora$", 3, "us"),
  RE("^(curi|formul|vertebr|larv|uln|alumn|signor|alg|minuti)ae$", 1),
  RE("^apices|cortices$", 4, "ex"),
  RE("femora", 3, "ur"),
  RE("^(medi|millenni|consorti|sept|memorabili)a$", 1, "um"),
  RE("concerti", 1, "o")
];

var C = "[bcdfghjklmnpqrstvwxyz]",
  VL = "[lraeiou]";

var PLURAL_RULES = [
    RE("prognosis", 2, "es"),
    NULL_PLURALS,
    RE("^(piano|photo|solo|ego|tobacco|cargo|golf|grief)$", 0, "s"),
    RE("^(wildlife)$", 0, "s"),
    RE("^concerto$", 1, "i"),
    RE(C + "o$", 0, "es"),
    RE(C + "y$", 1, "ies"),
    RE("^ox$", 0, "en"),
    RE("^(stimul|alumn|termin)us$", 2, "i"),
    RE("^corpus$", 2, "ora"),
    RE("(xis|sis)$", 2, "es"),
    RE("whiz$", 0, "zes"),
    RE("([zsx]|ch|sh)$", 0, "es"),
    RE(VL + "fe$", 2, "ves"),
    RE(VL + "f$", 1, "ves"),
    RE("(eu|eau)$", 0, "x"),
    RE("(man|woman)$", 2, "en"),
    RE("money$", 2, "ies"),
    RE("person$", 4, "ople"),
    RE("motif$", 0, "s"),
    RE("^meninx|phalanx$", 1, "ges"),
    RE("schema$", 0, "ta"),
    RE("^bus$", 0, "ses"),
    RE("child$", 0, "ren"),
    RE("^(curi|formul|vertebr|larv|uln|alumn|signor|alg|minuti)a$", 0, "e"),
    RE("^(maharaj|raj|myn|mull)a$", 0, "hs"),
    RE("^aide-de-camp$", 8, "s-de-camp"),
    RE("^apex|cortex$", 2, "ices"),
    RE("^weltanschauung$", 0, "en"),
    RE("^lied$", 0, "er"),
    RE("^tooth$", 4, "eeth"),
    RE("^[lm]ouse$", 4, "ice"),
    RE("^foot$", 3, "eet"),
    RE("femur", 2, "ora"),
    RE("goose", 4, "eese"),
    RE("(human|german|roman)$", 0, "s"),
    RE("^(monarch|loch|stomach)$", 0, "s"),
    RE("^(taxi|chief|proof|ref|relief|roof|belief)$", 0, "s"),
    RE("^(co|no)$", 0, "'s"),
    RE("^blond$", 0, "es"),
    RE("^(medi|millenni|consorti|sept|memorabili)um$", 2, "a"),

    // Latin stems
    RE("^(memorandum|bacterium|curriculum|minimum|" + "maximum|referendum|spectrum|phenomenon|criterion)$", 2, "a"),
    RE("^(appendix|index|matrix)", 2, "ices")
  ],

  ANY_STEM = "^((\\w+)(-\\w+)*)(\\s((\\w+)(-\\w+)*))*$",
  CONS = "[bcdfghjklmnpqrstvwxyz]",
  VERBAL_PREFIX = "((be|with|pre|un|over|re|mis|under|out|up|fore|for|counter|co|sub)(-?))",
  AUXILIARIES = ["do", "have", "be"],
  MODALS = ["shall", "would", "may", "might", "ought", "should"],
  SYMBOLS = ["!", "?", "$", "%", "*", "+", "-", "="],

  ING_FORM_RULES = [
    RE(CONS + "ie$", 2, "ying", 1),
    RE("[^ie]e$", 1, "ing", 1),
    RE("^bog-down$", 5, "ging-down", 0),
    RE("^chivy$", 1, "vying", 0),
    RE("^trek$", 1, "cking", 0),
    RE("^bring$", 0, "ing", 0),
    RE("^be$", 0, "ing", 0),
    RE("^age$", 1, "ing", 0),
    RE("(ibe)$", 1, "ing", 0)
  ],

  PAST_PARTICIPLE_RULES = [

    RE(CONS + "y$", 1, "ied", 1),
    RE("^" + VERBAL_PREFIX + "?(bring)$", 3, "ought", 0),
    RE("^" + VERBAL_PREFIX + "?(take|rise|strew|blow|draw|drive|know|give|" + "arise|gnaw|grave|grow|hew|know|mow|see|sew|throw|prove|saw|quartersaw|" + "partake|sake|shake|shew|show|shrive|sightsee|strew|strive)$",
      0, "n", 0),
    RE("^" + VERBAL_PREFIX + "?[gd]o$", 0, "ne", 1),
    RE("^(beat|eat|be|fall)$", 0, "en", 0),
    RE("^(have)$", 2, "d", 0),
    RE("^" + VERBAL_PREFIX + "?bid$", 0, "den", 0),
    RE("^" + VERBAL_PREFIX + "?[lps]ay$", 1, "id", 1),
    RE("^behave$", 0, "d", 0),
    RE("^" + VERBAL_PREFIX + "?have$", 2, "d", 1),
    RE("(sink|slink|drink|shrink|stink)$", 3, "unk", 0),
    RE("(([sfc][twlp]?r?|w?r)ing|hang)$", 3, "ung", 0),
    RE("^" + VERBAL_PREFIX + "?(shear|swear|bear|wear|tear)$", 3, "orn", 0),
    RE("^" + VERBAL_PREFIX + "?(bend|spend|send|lend)$", 1, "t", 0),
    RE("^" + VERBAL_PREFIX + "?(weep|sleep|sweep|creep|keep$)$", 2, "pt", 0),
    RE("^" + VERBAL_PREFIX + "?(sell|tell)$", 3, "old", 0),
    RE("^(outfight|beseech)$", 4, "ought", 0),
    RE("^bethink$", 3, "ought", 0),
    RE("^buy$", 2, "ought", 0),
    RE("^aby$", 1, "ought", 0),
    RE("^tarmac", 0, "ked", 0),
    RE("^abide$", 3, "ode", 0),
    RE("^" + VERBAL_PREFIX + "?(speak|(a?)wake|break)$", 3, "oken", 0),
    RE("^backbite$", 1, "ten", 0),
    RE("^backslide$", 1, "den", 0),
    RE("^become$", 3, "ame", 0),
    RE("^begird$", 3, "irt", 0),
    RE("^outlie$", 2, "ay", 0),
    RE("^rebind$", 3, "ound", 0),
    RE("^relay$", 2, "aid", 0),
    RE("^shit$", 3, "hat", 0),
    RE("^bereave$", 4, "eft", 0),
    RE("^foreswear$", 3, "ore", 0),
    RE("^overfly$", 1, "own", 0),
    RE("^beget$", 2, "otten", 0),
    RE("^begin$", 3, "gun", 0),
    RE("^bestride$", 1, "den", 0),
    RE("^bite$", 1, "ten", 0),
    RE("^bleed$", 4, "led", 0),
    RE("^bog-down$", 5, "ged-down", 0),
    RE("^bind$", 3, "ound", 0),
    RE("^(.*)feed$", 4, "fed", 0),
    RE("^breed$", 4, "red", 0),
    RE("^brei", 0, "d", 0),
    RE("^bring$", 3, "ought", 0),
    RE("^build$", 1, "t", 0),
    RE("^come", 0),
    RE("^catch$", 3, "ught", 0),
    RE("^chivy$", 1, "vied", 0),
    RE("^choose$", 3, "sen", 0),
    RE("^cleave$", 4, "oven", 0),
    RE("^crossbreed$", 4, "red", 0),
    RE("^deal", 0, "t", 0),
    RE("^dow$", 1, "ught", 0),
    RE("^dream", 0, "t", 0),
    RE("^dig$", 3, "dug", 0),
    RE("^dwell$", 2, "lt", 0),
    RE("^enwind$", 3, "ound", 0),
    RE("^feel$", 3, "elt", 0),
    RE("^flee$", 2, "ed", 0),
    RE("^floodlight$", 5, "lit", 0),
    RE("^fly$", 1, "own", 0),
    RE("^forbear$", 3, "orne", 0),
    RE("^forerun$", 3, "ran", 0),
    RE("^forget$", 2, "otten", 0),
    RE("^fight$", 4, "ought", 0),
    RE("^find$", 3, "ound", 0),
    RE("^freeze$", 4, "ozen", 0),
    RE("^gainsay$", 2, "aid", 0),
    RE("^gin$", 3, "gan", 0),
    RE("^gen-up$", 3, "ned-up", 0),
    RE("^ghostwrite$", 1, "ten", 0),
    RE("^get$", 2, "otten", 0),
    RE("^grind$", 3, "ound", 0),
    RE("^hacksaw", 0, "n", 0),
    RE("^hear", 0, "d", 0),
    RE("^hold$", 3, "eld", 0),
    RE("^hide$", 1, "den", 0),
    RE("^honey$", 2, "ied", 0),
    RE("^inbreed$", 4, "red", 0),
    RE("^indwell$", 3, "elt", 0),
    RE("^interbreed$", 4, "red", 0),
    RE("^interweave$", 4, "oven", 0),
    RE("^inweave$", 4, "oven", 0),
    RE("^ken$", 2, "ent", 0),
    RE("^kneel$", 3, "elt", 0),
    RE("^lie$", 2, "ain", 0),
    RE("^leap$", 0, "t", 0),
    RE("^learn$", 0, "t", 0),
    RE("^lead$", 4, "led", 0),
    RE("^leave$", 4, "eft", 0),
    RE("^light$", 5, "lit", 0),
    RE("^lose$", 3, "ost", 0),
    RE("^make$", 3, "ade", 0),
    RE("^mean", 0, "t", 0),
    RE("^meet$", 4, "met", 0),
    RE("^misbecome$", 3, "ame", 0),
    RE("^misdeal$", 2, "alt", 0),
    RE("^mishear$", 1, "d", 0),
    RE("^mislead$", 4, "led", 0),
    RE("^misunderstand$", 3, "ood", 0),
    RE("^outbreed$", 4, "red", 0),
    RE("^outrun$", 3, "ran", 0),
    RE("^outride$", 1, "den", 0),
    RE("^outshine$", 3, "one", 0),
    RE("^outshoot$", 4, "hot", 0),
    RE("^outstand$", 3, "ood", 0),
    RE("^outthink$", 3, "ought", 0),
    RE("^outgo$", 2, "went", 0),
    RE("^overbear$", 3, "orne", 0),
    RE("^overbuild$", 3, "ilt", 0),
    RE("^overcome$", 3, "ame", 0),
    RE("^overfly$", 2, "lew", 0),
    RE("^overhear$", 2, "ard", 0),
    RE("^overlie$", 2, "ain", 0),
    RE("^overrun$", 3, "ran", 0),
    RE("^override$", 1, "den", 0),
    RE("^overshoot$", 4, "hot", 0),
    RE("^overwind$", 3, "ound", 0),
    RE("^overwrite$", 1, "ten", 0),
    RE("^plead$", 2, "d", 0),
    //RE("^run$", 3, "ran", 0), //DH
    //RE("^rerun$", 3, "run", 0),
    RE("^rebuild$", 3, "ilt", 0),
    RE("^red$", 3, "red", 0),
    RE("^redo$", 1, "one", 0),
    RE("^remake$", 3, "ade", 0),
    RE("^resit$", 3, "sat", 0),
    RE("^rethink$", 3, "ought", 0),
    RE("^rewind$", 3, "ound", 0),
    RE("^rewrite$", 1, "ten", 0),
    RE("^ride$", 1, "den", 0),
    RE("^reeve$", 4, "ove", 0),
    RE("^sit$", 3, "sat", 0),
    RE("^shoe$", 3, "hod", 0),
    RE("^shine$", 3, "one", 0),
    RE("^shoot$", 4, "hot", 0),
    RE("^ski$", 1, "i'd", 0),
    RE("^slide$", 1, "den", 0),
    RE("^smite$", 1, "ten", 0),
    RE("^seek$", 3, "ought", 0),
    RE("^spit$", 3, "pat", 0),
    RE("^speed$", 4, "ped", 0),
    RE("^spellbind$", 3, "ound", 0),
    RE("^spoil$", 2, "ilt", 0),
    RE("^spotlight$", 5, "lit", 0),
    RE("^spin$", 3, "pun", 0),
    RE("^steal$", 3, "olen", 0),
    RE("^stand$", 3, "ood", 0),
    RE("^stave$", 3, "ove", 0),
    RE("^stride$", 1, "den", 0),
    RE("^strike$", 3, "uck", 0),
    RE("^stick$", 3, "uck", 0),
    RE("^swell$", 3, "ollen", 0),
    RE("^swim$", 3, "wum", 0),
    RE("^teach$", 4, "aught", 0),
    RE("^think$", 3, "ought", 0),
    RE("^tread$", 3, "odden", 0),
    RE("^typewrite$", 1, "ten", 0),
    RE("^unbind$", 3, "ound", 0),
    RE("^underbuy$", 2, "ought", 0),
    RE("^undergird$", 3, "irt", 0),
    RE("^undergo$", 1, "one", 0),
    RE("^underlie$", 2, "ain", 0),
    RE("^undershoot$", 4, "hot", 0),
    RE("^understand$", 3, "ood", 0),
    RE("^unfreeze$", 4, "ozen", 0),
    RE("^unlearn", 0, "t", 0),
    RE("^unmake$", 3, "ade", 0),
    RE("^unreeve$", 4, "ove", 0),
    RE("^unstick$", 3, "uck", 0),
    RE("^unteach$", 4, "aught", 0),
    RE("^unthink$", 3, "ought", 0),
    RE("^untread$", 3, "odden", 0),
    RE("^unwind$", 3, "ound", 0),
    RE("^upbuild$", 1, "t", 0),
    RE("^uphold$", 3, "eld", 0),
    RE("^upheave$", 4, "ove", 0),
    RE("^waylay$", 2, "ain", 0),
    RE("^whipsaw$", 2, "awn", 0),
    RE("^withhold$", 3, "eld", 0),
    RE("^withstand$", 3, "ood", 0),
    RE("^win$", 3, "won", 0),
    RE("^wind$", 3, "ound", 0),
    RE("^weave$", 4, "oven", 0),
    RE("^write$", 1, "ten", 0),
    RE("^trek$", 1, "cked", 0),
    RE("^ko$", 1, "o'd", 0),
    RE("^win$", 2, "on", 0),

    RE("e$", 0, "d", 1),

    // Null past forms
    RE("^" + VERBAL_PREFIX + "?(cast|thrust|typeset|cut|bid|upset|wet|bet|cut|hit|hurt|inset|let|cost|burst|beat|beset|set|upset|hit|offset|put|quit|" + "wed|typeset|wed|spread|split|slit|read|run|rerun|shut|shed)$", 0)
  ],

  PAST_TENSE_RULES = [
    RE("^(reduce)$", 0, "d", 0),
    RE("e$", 0, "d", 1),
    RE("^" + VERBAL_PREFIX + "?[pls]ay$", 1, "id", 1),
    RE(CONS + "y$", 1, "ied", 1),
    RE("^(fling|cling|hang)$", 3, "ung", 0),
    RE("(([sfc][twlp]?r?|w?r)ing)$", 3, "ang", 1),
    RE("^" + VERBAL_PREFIX + "?(bend|spend|send|lend|spend)$", 1, "t", 0),
    RE("^" + VERBAL_PREFIX + "?lie$", 2, "ay", 0),
    RE("^" + VERBAL_PREFIX + "?(weep|sleep|sweep|creep|keep)$", 2, "pt",
      0),
    RE("^" + VERBAL_PREFIX + "?(sell|tell)$", 3, "old", 0),
    RE("^" + VERBAL_PREFIX + "?do$", 1, "id", 0),
    RE("^" + VERBAL_PREFIX + "?dig$", 2, "ug", 0),
    RE("^behave$", 0, "d", 0),
    RE("^(have)$", 2, "d", 0),
    RE("(sink|drink)$", 3, "ank", 0),
    RE("^swing$", 3, "ung", 0),
    RE("^be$", 2, "was", 0),
    RE("^outfight$", 4, "ought", 0),
    RE("^tarmac", 0, "ked", 0),
    RE("^abide$", 3, "ode", 0),
    RE("^aby$", 1, "ought", 0),
    RE("^become$", 3, "ame", 0),
    RE("^begird$", 3, "irt", 0),
    RE("^outlie$", 2, "ay", 0),
    RE("^rebind$", 3, "ound", 0),
    RE("^shit$", 3, "hat", 0),
    RE("^bereave$", 4, "eft", 0),
    RE("^foreswear$", 3, "ore", 0),
    RE("^bename$", 3, "empt", 0),
    RE("^beseech$", 4, "ought", 0),
    RE("^bethink$", 3, "ought", 0),
    RE("^bleed$", 4, "led", 0),
    RE("^bog-down$", 5, "ged-down", 0),
    RE("^buy$", 2, "ought", 0),
    RE("^bind$", 3, "ound", 0),
    RE("^(.*)feed$", 4, "fed", 0),
    RE("^breed$", 4, "red", 0),
    RE("^brei$", 2, "eid", 0),
    RE("^bring$", 3, "ought", 0),
    RE("^build$", 3, "ilt", 0),
    RE("^come$", 3, "ame", 0),
    RE("^catch$", 3, "ught", 0),
    RE("^clothe$", 5, "lad", 0),
    RE("^crossbreed$", 4, "red", 0),
    RE("^deal$", 2, "alt", 0),
    RE("^dow$", 1, "ught", 0),
    RE("^dream$", 2, "amt", 0),
    RE("^dwell$", 3, "elt", 0),
    RE("^enwind$", 3, "ound", 0),
    RE("^feel$", 3, "elt", 0),
    RE("^flee$", 3, "led", 0),
    RE("^floodlight$", 5, "lit", 0),
    RE("^arise$", 3, "ose", 0),
    RE("^eat$", 3, "ate", 0),
    RE("^backbite$", 4, "bit", 0),
    RE("^backslide$", 4, "lid", 0),
    RE("^befall$", 3, "ell", 0),
    RE("^begin$", 3, "gan", 0),
    RE("^beget$", 3, "got", 0),
    RE("^behold$", 3, "eld", 0),
    RE("^bespeak$", 3, "oke", 0),
    RE("^bestride$", 3, "ode", 0),
    RE("^betake$", 3, "ook", 0),
    RE("^bite$", 4, "bit", 0),
    RE("^blow$", 3, "lew", 0),
    RE("^bear$", 3, "ore", 0),
    RE("^break$", 3, "oke", 0),
    RE("^choose$", 4, "ose", 0),
    RE("^cleave$", 4, "ove", 0),
    RE("^countersink$", 3, "ank", 0),
    RE("^drink$", 3, "ank", 0),
    RE("^draw$", 3, "rew", 0),
    RE("^drive$", 3, "ove", 0),
    RE("^fall$", 3, "ell", 0),
    RE("^fly$", 2, "lew", 0),
    RE("^flyblow$", 3, "lew", 0),
    RE("^forbid$", 2, "ade", 0),
    RE("^forbear$", 3, "ore", 0),
    RE("^foreknow$", 3, "new", 0),
    RE("^foresee$", 3, "saw", 0),
    RE("^forespeak$", 3, "oke", 0),
    RE("^forego$", 2, "went", 0),
    RE("^forgive$", 3, "ave", 0),
    RE("^forget$", 3, "got", 0),
    RE("^forsake$", 3, "ook", 0),
    RE("^forspeak$", 3, "oke", 0),
    RE("^forswear$", 3, "ore", 0),
    RE("^forgo$", 2, "went", 0),
    RE("^fight$", 4, "ought", 0),
    RE("^find$", 3, "ound", 0),
    RE("^freeze$", 4, "oze", 0),
    RE("^give$", 3, "ave", 0),
    RE("^geld$", 3, "elt", 0),
    RE("^gen-up$", 3, "ned-up", 0),
    RE("^ghostwrite$", 3, "ote", 0),
    RE("^get$", 3, "got", 0),
    RE("^grow$", 3, "rew", 0),
    RE("^grind$", 3, "ound", 0),
    RE("^hear$", 2, "ard", 0),
    RE("^hold$", 3, "eld", 0),
    RE("^hide$", 4, "hid", 0),
    RE("^honey$", 2, "ied", 0),
    RE("^inbreed$", 4, "red", 0),
    RE("^indwell$", 3, "elt", 0),
    RE("^interbreed$", 4, "red", 0),
    RE("^interweave$", 4, "ove", 0),
    RE("^inweave$", 4, "ove", 0),
    RE("^ken$", 2, "ent", 0),
    RE("^kneel$", 3, "elt", 0),
    RE("^^know$$", 3, "new", 0),
    RE("^leap$", 2, "apt", 0),
    RE("^learn$", 2, "rnt", 0),
    RE("^lead$", 4, "led", 0),
    RE("^leave$", 4, "eft", 0),
    RE("^light$", 5, "lit", 0),
    RE("^lose$", 3, "ost", 0),
    RE("^make$", 3, "ade", 0),
    RE("^mean$", 2, "ant", 0),
    RE("^meet$", 4, "met", 0),
    RE("^misbecome$", 3, "ame", 0),
    RE("^misdeal$", 2, "alt", 0),
    RE("^misgive$", 3, "ave", 0),
    RE("^mishear$", 2, "ard", 0),
    RE("^mislead$", 4, "led", 0),
    RE("^mistake$", 3, "ook", 0),
    RE("^misunderstand$", 3, "ood", 0),
    RE("^outbreed$", 4, "red", 0),
    RE("^outgrow$", 3, "rew", 0),
    RE("^outride$", 3, "ode", 0),
    RE("^outshine$", 3, "one", 0),
    RE("^outshoot$", 4, "hot", 0),
    RE("^outstand$", 3, "ood", 0),
    RE("^outthink$", 3, "ought", 0),
    RE("^outgo$", 2, "went", 0),
    RE("^outwear$", 3, "ore", 0),
    RE("^overblow$", 3, "lew", 0),
    RE("^overbear$", 3, "ore", 0),
    RE("^overbuild$", 3, "ilt", 0),
    RE("^overcome$", 3, "ame", 0),
    RE("^overdraw$", 3, "rew", 0),
    RE("^overdrive$", 3, "ove", 0),
    RE("^overfly$", 2, "lew", 0),
    RE("^overgrow$", 3, "rew", 0),
    RE("^overhear$", 2, "ard", 0),
    RE("^overpass$", 3, "ast", 0),
    RE("^override$", 3, "ode", 0),
    RE("^oversee$", 3, "saw", 0),
    RE("^overshoot$", 4, "hot", 0),
    RE("^overthrow$", 3, "rew", 0),
    RE("^overtake$", 3, "ook", 0),
    RE("^overwind$", 3, "ound", 0),
    RE("^overwrite$", 3, "ote", 0),
    RE("^partake$", 3, "ook", 0),
    RE("^" + VERBAL_PREFIX + "?run$", 2, "an", 0),
    RE("^ring$", 3, "ang", 0),
    RE("^rebuild$", 3, "ilt", 0),
    RE("^red", 0),
    RE("^reave$", 4, "eft", 0),
    RE("^remake$", 3, "ade", 0),
    RE("^resit$", 3, "sat", 0),
    RE("^rethink$", 3, "ought", 0),
    RE("^retake$", 3, "ook", 0),
    RE("^rewind$", 3, "ound", 0),
    RE("^rewrite$", 3, "ote", 0),
    RE("^ride$", 3, "ode", 0),
    RE("^rise$", 3, "ose", 0),
    RE("^reeve$", 4, "ove", 0),
    RE("^sing$", 3, "ang", 0),
    RE("^sink$", 3, "ank", 0),
    RE("^sit$", 3, "sat", 0),
    RE("^see$", 3, "saw", 0),
    RE("^shoe$", 3, "hod", 0),
    RE("^shine$", 3, "one", 0),
    RE("^shake$", 3, "ook", 0),
    RE("^shoot$", 4, "hot", 0),
    RE("^shrink$", 3, "ank", 0),
    RE("^shrive$", 3, "ove", 0),
    RE("^sightsee$", 3, "saw", 0),
    RE("^ski$", 1, "i'd", 0),
    RE("^skydive$", 3, "ove", 0),
    RE("^slay$", 3, "lew", 0),
    RE("^slide$", 4, "lid", 0),
    RE("^slink$", 3, "unk", 0),
    RE("^smite$", 4, "mit", 0),
    RE("^seek$", 3, "ought", 0),
    RE("^spit$", 3, "pat", 0),
    RE("^speed$", 4, "ped", 0),
    RE("^spellbind$", 3, "ound", 0),
    RE("^spoil$", 2, "ilt", 0),
    RE("^speak$", 3, "oke", 0),
    RE("^spotlight$", 5, "lit", 0),
    RE("^spring$", 3, "ang", 0),
    RE("^spin$", 3, "pun", 0),
    RE("^stink$", 3, "ank", 0),
    RE("^steal$", 3, "ole", 0),
    RE("^stand$", 3, "ood", 0),
    RE("^stave$", 3, "ove", 0),
    RE("^stride$", 3, "ode", 0),
    RE("^strive$", 3, "ove", 0),
    RE("^strike$", 3, "uck", 0),
    RE("^stick$", 3, "uck", 0),
    RE("^swim$", 3, "wam", 0),
    RE("^swear$", 3, "ore", 0),
    RE("^teach$", 4, "aught", 0),
    RE("^think$", 3, "ought", 0),
    RE("^throw$", 3, "rew", 0),
    RE("^take$", 3, "ook", 0),
    RE("^tear$", 3, "ore", 0),
    RE("^transship$", 4, "hip", 0),
    RE("^tread$", 4, "rod", 0),
    RE("^typewrite$", 3, "ote", 0),
    RE("^unbind$", 3, "ound", 0),
    RE("^unclothe$", 5, "lad", 0),
    RE("^underbuy$", 2, "ought", 0),
    RE("^undergird$", 3, "irt", 0),
    RE("^undershoot$", 4, "hot", 0),
    RE("^understand$", 3, "ood", 0),
    RE("^undertake$", 3, "ook", 0),
    RE("^undergo$", 2, "went", 0),
    RE("^underwrite$", 3, "ote", 0),
    RE("^unfreeze$", 4, "oze", 0),
    RE("^unlearn$", 2, "rnt", 0),
    RE("^unmake$", 3, "ade", 0),
    RE("^unreeve$", 4, "ove", 0),
    RE("^unspeak$", 3, "oke", 0),
    RE("^unstick$", 3, "uck", 0),
    RE("^unswear$", 3, "ore", 0),
    RE("^unteach$", 4, "aught", 0),
    RE("^unthink$", 3, "ought", 0),
    RE("^untread$", 4, "rod", 0),
    RE("^unwind$", 3, "ound", 0),
    RE("^upbuild$", 3, "ilt", 0),
    RE("^uphold$", 3, "eld", 0),
    RE("^upheave$", 4, "ove", 0),
    RE("^uprise$", 3, "ose", 0),
    RE("^upspring$", 3, "ang", 0),
    RE("^go$", 2, "went", 0),
    RE("^wiredraw$", 3, "rew", 0),
    RE("^withdraw$", 3, "rew", 0),
    RE("^withhold$", 3, "eld", 0),
    RE("^withstand$", 3, "ood", 0),
    RE("^wake$", 3, "oke", 0),
    RE("^win$", 3, "won", 0),
    RE("^wear$", 3, "ore", 0),
    RE("^wind$", 3, "ound", 0),
    RE("^weave$", 4, "ove", 0),
    RE("^write$", 3, "ote", 0),
    RE("^trek$", 1, "cked", 0),
    RE("^ko$", 1, "o'd", 0),
    RE("^bid", 2, "ade", 0),
    RE("^win$", 2, "on", 0),
    RE("^swim", 2, "am", 0),

    // Null past forms
    RE("^" + VERBAL_PREFIX + "?(cast|thrust|typeset|cut|bid|upset|wet|bet|cut|hit|hurt|inset|" + "let|cost|burst|beat|beset|set|upset|offset|put|quit|wed|typeset|" + "wed|spread|split|slit|read|run|shut|shed|lay)$", 0)
  ],

  PRESENT_TENSE_RULES = [
    RE("^aby$", 0, "es", 0),
    RE("^bog-down$", 5, "s-down", 0),
    RE("^chivy$", 1, "vies", 0),
    RE("^gen-up$", 3, "s-up", 0),
    RE("^prologue$", 3, "gs", 0),
    RE("^picknic$", 0, "ks", 0),
    //RE("^swim$", 0, "s", 0),
    RE("^ko$", 0, "'s", 0),
    RE("[osz]$", 0, "es", 1),
    RE("^have$", 2, "s", 0),
    RE(CONS + "y$", 1, "ies", 1),
    RE("^be$", 2, "is"),
    RE("([zsx]|ch|sh)$", 0, "es", 1)
  ],

  VERB_CONS_DOUBLING = ["abat", "abet", "abhor", "abut", "accur", "acquit", "adlib",
    "admit", "aerobat", "aerosol", "agendaset", "allot", "alot", "anagram",
    "annul", "appal", "apparel", "armbar", "aver", "babysit", "airdrop", "appal",
    "blackleg", "bobsled", "bur", "chum", "confab", "counterplot", "curet", "dib",
    "backdrop", "backfil", "backflip", "backlog", "backpedal", "backslap",
    "backstab", "bag", "balfun", "ballot", "ban", "bar", "barbel", "bareleg",
    "barrel", "bat", "bayonet", "becom", "bed", "bedevil", "bedwet", "beenhop",
    "befit", "befog", "beg", "beget", "begin", "bejewel", "bemedal", "benefit",
    "benum", "beset", "besot", "bestir", "bet", "betassel", "bevel", "bewig",
    "bib", "bid", "billet", "bin", "bip", "bit", "bitmap", "blab", "blag", "blam",
    "blan", "blat", "bles", "blim", "blip", "blob", "bloodlet", "blot", "blub",
    "blur", "bob", "bodypop", "bog", "booby-trap", "boobytrap", "booksel",
    "bootleg", "bop", "bot", "bowel", "bracket", "brag", "brig", "brim", "bud",
    "buffet", "bug", "bullshit", "bum", "bun", "bus", "but", "cab", "cabal", "cam",
    "can", "cancel", "cap", "caracol", "caravan", "carburet", "carnap", "carol",
    "carpetbag", "castanet", "cat", "catcal", "catnap", "cavil", "chan", "chanel",
    "channel", "chap", "char", "chargecap", "chat", "chin", "chip", "chir",
    "chirrup", "chisel", "chop", "chug", "chur", "clam", "clap", "clearcut",
    "clip", "clodhop", "clog", "clop", "closet", "clot", "club", "co-occur",
    "co-program", "co-refer", "co-run", "co-star", "cob", "cobweb", "cod", "coif",
    "com", "combat", "comit", "commit", "compel", "con", "concur", "confer",
    "confiscat", "control", "cop", "coquet", "coral", "corbel", "corral", "cosset",
    "cotransmit", "councel", "council", "counsel", "court-martial", "crab", "cram",
    "crap", "crib", "crop", "crossleg", "cub", "cudgel", "cum", "cun", "cup",
    "cut", "dab", "dag", "dam", "dan", "dap", "daysit", "de-control", "de-gazet",
    "de-hul", "de-instal", "de-mob", "de-program", "de-rig", "de-skil", "deadpan",
    "debag", "debar", "log", "decommit", "decontrol", "defer", "defog", "deg",
    "degas", "deinstal", "demit", "demob", "demur", "den", "denet", "depig",
    "depip", "depit", "der", "deskil", "deter", "devil", "diagram", "dial", "dig",
    "dim", "din", "dip", "disbar", "disbud", "discomfit", "disembed", "disembowel",
    "dishevel", "disinter", "dispel", "disprefer", "distil", "dog", "dognap",
    "don", "doorstep", "dot", "dowel", "drag", "drat", "driftnet", "distil",
    "egotrip", "enrol", "enthral", "extol", "fulfil", "gaffe", "golliwog", "idyl",
    "inspan", "drip", "drivel", "drop", "drub", "drug", "drum", "dub", "duel",
    "dun", "dybbuk", "earwig", "eavesdrop", "ecolabel", "eitherspigot",
    "electroblot", "embed", "emit", "empanel", "enamel", "endlabel", "endtrim",
    "enrol", "enthral", "entrammel", "entrap", "enwrap", "equal", "equip", "estop",
    "exaggerat", "excel", "expel", "extol", "fag", "fan", "farewel", "fat",
    "featherbed", "feget", "fet", "fib", "fig", "fin", "fingerspel", "fingertip",
    "fit", "flab", "flag", "flap", "flip", "flit", "flog", "flop", "fob", "focus",
    "fog", "footbal", "footslog", "fop", "forbid", "forget", "format",
    "fortunetel", "fot", "foxtrot", "frag", "freefal", "fret", "frig", "frip",
    "frog", "frug", "fuel", "fufil", "fulfil", "fullyfit", "fun", "funnel", "fur",
    "furpul", "gab", "gad", "gag", "gam", "gambol", "gap", "garot", "garrot",
    "gas", "gat", "gel", "gen", "get", "giftwrap", "gig", "gimbal", "gin", "glam",
    "glenden", "glendin", "globetrot", "glug", "glut", "gob", "goldpan", "goostep",
    "gossip", "grab", "gravel", "grid", "grin", "grip", "grit", "groundhop",
    "grovel", "grub", "gum", "gun", "gunrun", "gut", "gyp", "haircut", "ham",
    "han", "handbag", "handicap", "handknit", "handset", "hap", "hareleg", "hat",
    "headbut", "hedgehop", "hem", "hen", "hiccup", "highwal", "hip", "hit",
    "hobnob", "hog", "hop", "horsewhip", "hostel", "hot", "hotdog", "hovel", "hug",
    "hum", "humbug", "hup", "hushkit", "hut", "illfit", "imbed", "immunblot",
    "immunoblot", "impannel", "impel", "imperil", "incur", "infer", "infil",
    "inflam", "initial", "input", "inset", "instil", "inter", "interbed",
    "intercrop", "intercut", "interfer", "instal", "instil", "intermit", "japan",
    "jug", "kris", "manumit", "mishit", "mousse", "mud", "interwar", "jab", "jag",
    "jam", "jar", "jawdrop", "jet", "jetlag", "jewel", "jib", "jig", "jitterbug",
    "job", "jog", "jog-trot", "jot", "jut", "ken", "kennel", "kid", "kidnap",
    "kip", "kissogram", "kit", "knap", "kneecap", "knit", "knob", "knot", "kor",
    "label", "lag", "lam", "lap", "lavel", "leafcut", "leapfrog", "leg", "lem",
    "lep", "let", "level", "libel", "lid", "lig", "lip", "lob", "log", "lok",
    "lollop", "longleg", "lop", "lowbal", "lug", "mackerel", "mahom", "man", "map",
    "mar", "marshal", "marvel", "mat", "matchwin", "metal", "micro-program",
    "microplan", "microprogram", "milksop", "mis-cal", "mis-club", "mis-spel",
    "miscal", "mishit", "mislabel", "mit", "mob", "mod", "model", "mohmam",
    "monogram", "mop", "mothbal", "mug", "multilevel", "mum", "nab", "nag", "nan",
    "nap", "net", "nightclub", "nightsit", "nip", "nod", "nonplus", "norkop",
    "nostril", "not", "nut", "nutmeg", "occur", "ocur", "offput", "offset", "omit",
    "ommit", "onlap", "out-general", "out-gun", "out-jab", "out-plan", "out-pol",
    "out-pul", "out-put", "out-run", "out-sel", "outbid", "outcrop", "outfit",
    "outgas", "outgun", "outhit", "outjab", "outpol", "output", "outrun",
    "outship", "outshop", "outsin", "outstrip", "outswel", "outspan", "overcrop",
    "pettifog", "photostat", "pouf", "preset", "prim", "pug", "ret", "rosin",
    "outwit", "over-commit", "over-control", "over-fil", "over-fit", "over-lap",
    "over-model", "over-pedal", "over-pet", "over-run", "over-sel", "over-step",
    "over-tip", "over-top", "overbid", "overcal", "overcommit", "overcontrol",
    "overcrap", "overdub", "overfil", "overhat", "overhit", "overlap", "overman",
    "overplot", "overrun", "overshop", "overstep", "overtip", "overtop", "overwet",
    "overwil", "pad", "paintbal", "pan", "panel", "paperclip", "par", "parallel",
    "parcel", "partiescal", "pat", "patrol", "pedal", "peewit", "peg", "pen",
    "pencil", "pep", "permit", "pet", "petal", "photoset", "phototypeset", "phut",
    "picket", "pig", "pilot", "pin", "pinbal", "pip", "pipefit", "pipet", "pit",
    "plan", "plit", "plod", "plop", "plot", "plug", "plumet", "plummet", "pod",
    "policyset", "polyfil", "ponytrek", "pop", "pot", "pram", "prebag",
    "predistil", "predril", "prefer", "prefil", "preinstal", "prep", "preplan",
    "preprogram", "prizewin", "prod", "profer", "prog", "program", "prop",
    "propel", "pub", "pummel", "pun", "pup", "pushfit", "put", "quarel", "quarrel",
    "quickskim", "quickstep", "quickwit", "quip", "quit", "quivertip", "quiz",
    "rabbit", "rabit", "radiolabel", "rag", "ram", "ramrod", "rap", "rat",
    "ratecap", "ravel", "re-admit", "re-cal", "re-cap", "re-channel", "re-dig",
    "re-dril", "re-emit", "re-fil", "re-fit", "re-flag", "re-format", "re-fret",
    "re-hab", "re-instal", "re-inter", "re-lap", "re-let", "re-map", "re-metal",
    "re-model", "re-pastel", "re-plan", "re-plot", "re-plug", "re-pot",
    "re-program", "re-refer", "re-rig", "re-rol", "re-run", "re-sel", "re-set",
    "re-skin", "re-stal", "re-submit", "re-tel", "re-top", "re-transmit",
    "re-trim", "re-wrap", "readmit", "reallot", "rebel", "rebid", "rebin", "rebut",
    "recap", "rechannel", "recommit", "recrop", "recur", "recut", "red", "redril",
    "refer", "refit", "reformat", "refret", "refuel", "reget", "regret", "reinter",
    "rejig", "rekit", "reknot", "relabel", "relet", "rem", "remap", "remetal",
    "remit", "remodel", "reoccur", "rep", "repel", "repin", "replan", "replot",
    "repol", "repot", "reprogram", "rerun", "reset", "resignal", "resit", "reskil",
    "resubmit", "retransfer", "retransmit", "retro-fit", "retrofit", "rev",
    "revel", "revet", "rewrap", "rib", "richochet", "ricochet", "rid", "rig",
    "rim", "ringlet", "rip", "rit", "rival", "rivet", "roadrun", "rob", "rocket",
    "rod", "roset", "rot", "rowel", "rub", "run", "runnel", "rut", "sab", "sad",
    "sag", "sandbag", "sap", "scab", "scalpel", "scam", "scan", "scar", "scat",
    "schlep", "scrag", "scram", "shall", "sled", "smut", "stet", "sulfuret",
    "trepan", "unrip", "unstop", "whir", "whop", "wig", "scrap", "scrat", "scrub",
    "scrum", "scud", "scum", "scur", "semi-control", "semi-skil", "semi-skim",
    "semiskil", "sentinel", "set", "shag", "sham", "shed", "shim", "shin", "ship",
    "shir", "shit", "shlap", "shop", "shopfit", "shortfal", "shot", "shovel",
    "shred", "shrinkwrap", "shrivel", "shrug", "shun", "shut", "side-step",
    "sideslip", "sidestep", "signal", "sin", "sinbin", "sip", "sit", "skid",
    "skim", "skin", "skip", "skir", "skrag", "slab", "slag", "slam", "slap",
    "slim", "slip", "slit", "slob", "slog", "slop", "slot", "slowclap", "slug",
    "slum", "slur", "smit", "snag", "snap", "snip", "snivel", "snog", "snorkel",
    "snowcem", "snub", "snug", "sob", "sod", "softpedal", "son", "sop", "spam",
    "span", "spar", "spat", "spiderweb", "spin", "spiral", "spit", "splat",
    "split", "spot", "sprag", "spraygun", "sprig", "springtip", "spud", "spur",
    "squat", "squirrel", "stab", "stag", "star", "stem", "sten", "stencil", "step",
    "stir", "stop", "storytel", "strap", "strim", "strip", "strop", "strug",
    "strum", "strut", "stub", "stud", "stun", "sub", "subcrop", "sublet", "submit",
    "subset", "suedetrim", "sum", "summit", "sun", "suntan", "sup", "super-chil",
    "superad", "swab", "swag", "swan", "swap", "swat", "swig", "swim", "swivel",
    "swot", "tab", "tag", "tan", "tansfer", "tap", "tar", "tassel", "tat", "tefer",
    "teleshop", "tendril", "terschel", "th'strip", "thermal", "thermostat", "thin",
    "throb", "thrum", "thud", "thug", "tightlip", "tin", "tinsel", "tip", "tittup",
    "toecap", "tog", "tom", "tomorrow", "top", "tot", "total", "towel", "traget",
    "trainspot", "tram", "trammel", "transfer", "tranship", "transit", "transmit",
    "transship", "trap", "travel", "trek", "trendset", "trim", "trip", "tripod",
    "trod", "trog", "trot", "trousseaushop", "trowel", "trup", "tub", "tug",
    "tunnel", "tup", "tut", "twat", "twig", "twin", "twit", "typeset", "tyset",
    "un-man", "unban", "unbar", "unbob", "uncap", "unclip", "uncompel", "undam",
    "under-bil", "under-cut", "under-fit", "under-pin", "under-skil", "underbid",
    "undercut", "underlet", "underman", "underpin", "unfit", "unfulfil", "unknot",
    "unlip", "unlywil", "unman", "unpad", "unpeg", "unpin", "unplug", "unravel",
    "unrol", "unscrol", "unsnap", "unstal", "unstep", "unstir", "untap", "unwrap",
    "unzip", "up", "upset", "upskil", "upwel", "ven", "verbal", "vet", "victual",
    "vignet", "wad", "wag", "wainscot", "wan", "war", "water-log", "waterfal",
    "waterfil", "waterlog", "weasel", "web", "wed", "wet", "wham", "whet", "whip",
    "whir", "whiteskin", "whiz", "whup", "wildcat", "win", "windmil", "wit",
    "woodchop", "woodcut", "wor", "worship", "wrap", "wiretap", "yen", "yak",
    "yap", "yarnspin", "yip", "yodel", "zag", "zap", "zig", "zig-zag", "zigzag",
    "zip", "ztrip", "hand-bag", "hocus", "hocus-pocus"
  ],

  PAST_PARTICIPLE_RULESET = {
    name: "PAST_PARTICIPLE",
    defaultRule: RE(ANY_STEM, 0, "ed", 2),
    rules: PAST_PARTICIPLE_RULES,
    doubling: true
  },

  PRESENT_PARTICIPLE_RULESET = {
    name: "ING_FORM",
    defaultRule: RE(ANY_STEM, 0, "ing", 2),
    rules: ING_FORM_RULES,
    doubling: true
  },

  PAST_TENSE_RULESET = {
    name: "PAST_TENSE",
    defaultRule: RE(ANY_STEM, 0, "ed", 2),
    rules: PAST_TENSE_RULES,
    doubling: true
  },

  PRESENT_TENSE_RULESET = {
    name: "PRESENT_TENSE",
    defaultRule: RE(ANY_STEM, 0, "s", 2),
    rules: PRESENT_TENSE_RULES,
    doubling: false
  };

if (!RiTa.SILENT && !isNode() && console)
  console.log('[INFO] RiTaJS.version [' + RiTa.VERSION + ']');

// A minimized dictionary, generated according to the list 
// "1,000 most common US English words"
// https://gist.github.com/deekayen/4148741

function _dict() { return {
'a':['ey1','dt'],
'able':['ey1 b-ah-l','jj'],
'about':['ah b-aw1-t','in jj rb rp rbr'],
'above':['ah b-ah1-v','in jj rb'],
'act':['ae1-k-t','nn vbp vb'],
'add':['ae1-d','vb vbp'],
'afraid':['ah f-r-ey1-d','jj'],
'after':['ae1-f t-er','in rb rp'],
'again':['ah g-eh1-n','rb'],
'against':['ah g-eh1-n-s-t','in'],
'age':['ey1-jh','nn vb vbp'],
'ago':['ah g-ow1','rb in'],
'agree':['ah g-r-iy1','vb vbp'],
'air':['eh1-r','nn vb'],
'all':['ao1-l','dt rb pdt'],
'allow':['ah l-aw1','vb vbp'],
'also':['ao1-l s-ow','rb .'],
'always':['ao1-l w-ey-z','rb'],
'am':['ae1-m','vbp rb'],
'among':['ah m-ah1-ng','in'],
'an':['ae1-n','dt cc jj nnp'],
'and':['ae1-n-d','cc jj rb nnp'],
'anger':['ae1-ng g-er','nn vb vbp'],
'animal':['ae1 n-ah m-ah-l','nn jj'],
'answer':['ae1-n s-er','nn vb vbp'],
'any':['eh1 n-iy','dt rb'],
'appear':['ah p-ih1-r','vb vbp'],
'apple':['ae1 p-ah-l','nn'],
'are':['aa1-r','vbp nnp'],
'area':['eh1 r-iy ah','nn'],
'arm':['aa1-r-m','nn vb'],
'arrange':['er ey1-n-jh','vb vbp'],
'arrive':['er ay1-v','vb vbp'],
'art':['aa1-r-t','nn'],
'as':['ae1-z','in nnp jj rb'],
'ask':['ae1-s-k','vb vbp'],
'at':['ae1-t','in rb rp'],
'atom':['ae1 t-ah-m','nn'],
'baby':['b-ey1 b-iy','nn uh'],
'back':['b-ae1-k','rb in jj nn rp vb vbp'],
'bad':['b-ae1-d','jj nn rb'],
'ball':['b-ao1-l','nn vb'],
'band':['b-ae1-n-d','nn vb'],
'bank':['b-ae1-ng-k','nn vbp vb'],
'bar':['b-aa1-r','nn vb vbp'],
'base':['b-ey1-s','nn vbp jj vb'],
'basic':['b-ey1 s-ih-k','jj nn'],
'bat':['b-ae1-t','nn vb'],
'be':['b-iy1','vb'],
'bear':['b-eh1-r','vb nn vbp'],
'beat':['b-iy1-t','vb jj nn vbd vbn vbp'],
'beauty':['b-y-uw1 t-iy','nn'],
'bed':['b-eh1-d','nn vb vbp'],
'before':['b-ih f-ao1-r','in rb rp'],
'begin':['b-ih g-ih1-n','vb vbp'],
'behind':['b-ih hh-ay1-n-d','in nn rb rp'],
'believe':['b-ih l-iy1-v','vbp vb'],
'bell':['b-eh1-l','nn'],
'best':['b-eh1-s-t','jjs rbs jjss nn rb vb'],
'better':['b-eh1 t-er','jjr rbr jj rb vb'],
'between':['b-ih t-w-iy1-n','in rb'],
'big':['b-ih1-g','jj rb'],
'bird':['b-er1-d','nn'],
'bit':['b-ih1-t','nn vbd vbn jj rb vb'],
'black':['b-l-ae1-k','jj nn vb'],
'block':['b-l-aa1-k','nn vbp jj vb'],
'blood':['b-l-ah1-d','nn vb'],
'blow':['b-l-ow1','nn vb vbp'],
'blue':['b-l-uw1','jj nn'],
'board':['b-ao1-r-d','nn rb vb'],
'boat':['b-ow1-t','nn vb'],
'body':['b-aa1 d-iy','nn'],
'bone':['b-ow1-n','nn vb'],
'book':['b-uh1-k','nn vb'],
'both':['b-aa1-th','jj rb prp'],
'bottom':['b-aa1 t-ah-m','nn jj vb'],
'box':['b-aa1-k-s','nn vb'],
'boy':['b-oy1','nn uh'],
'branch':['b-r-ae1-n-ch','nn vb'],
'bread':['b-r-eh1-d','nn'],
'break':['b-r-ey1-k','vb nn vbp'],
'bright':['b-r-ay1-t','jj rb'],
'bring':['b-r-ih1-ng','vb vbp'],
'broad':['b-r-ao1-d','jj'],
'broke':['b-r-ow1-k','vbd vbn jj rb vb'],
'brother':['b-r-ah1 dh-er','nn'],
'brown':['b-r-aw1-n','jj nn vb'],
'build':['b-ih1-l-d','vb vbn vbp nn'],
'burn':['b-er1-n','vb vbp nn'],
'busy':['b-ih1 z-iy','jj'],
'but':['b-ah1-t','cc in jj rb'],
'buy':['b-ay1','vb vbp nn jj'],
'by':['b-ay1','in rb rp'],
'call':['k-ao1-l','vb nn vbp'],
'camp':['k-ae1-m-p','nn vb'],
'can':['k-ae1-n','md nn vb'],
'capital':['k-ae1 p-ah t-ah-l','nn jj'],
'captain':['k-ae1-p t-ah-n','nn vb vbp'],
'car':['k-aa1-r','nn'],
'card':['k-aa1-r-d','nn'],
'care':['k-eh1-r','nn vb vbp'],
'carry':['k-ae1 r-iy','vb nn vbp'],
'case':['k-ey1-s','nn vb'],
'cat':['k-ae1-t','nn'],
'catch':['k-ae1-ch','vb vbp nn'],
'cause':['k-aa1-z','nn vb vbg vbp'],
'cell':['s-eh1-l','nn'],
'cent':['s-eh1-n-t','nn'],
'center':['s-eh1-n t-er','nn jj rb vb vbp'],
'century':['s-eh1-n ch-er iy','nn'],
'certain':['s-er1 t-ah-n','jj rb'],
'chair':['ch-eh1-r','nn vb'],
'chance':['ch-ae1-n-s','nn jj vb vbp'],
'change':['ch-ey1-n-jh','nn vbp vb'],
'character':['k-eh1 r-ih-k t-er','nn'],
'charge':['ch-aa1-r-jh','nn vbp vb'],
'chart':['ch-aa1-r-t','nn vb vbp'],
'check':['ch-eh1-k','nn vbp vb'],
'chick':['ch-ih1-k','nn'],
'chief':['ch-iy1-f','jj nn'],
'child':['ch-ay1-l-d','nn'],
'choose':['ch-uw1-z','vb vbp'],
'chord':['k-ao1-r-d','nn'],
'circle':['s-er1 k-ah-l','nn vb'],
'city':['s-ih1 t-iy','nn'],
'claim':['k-l-ey1-m','nn vbp vb'],
'class':['k-l-ae1-s','nn vb'],
'clean':['k-l-iy1-n','jj vbp rb vb'],
'clear':['k-l-ih1-r','jj rb vb vbp'],
'climb':['k-l-ay1-m','vb vbp nn'],
'clock':['k-l-aa1-k','nn vb vbp'],
'close':['k-l-ow1-s','vb vbp jj'],
'clothe':['k-l-ow1-dh','vb'],
'cloud':['k-l-aw1-d','nn vb vbp'],
'coast':['k-ow1-s-t','nn vb'],
'coat':['k-ow1-t','nn vb'],
'cold':['k-ow1-l-d','jj nn'],
'collect':['k-ah l-eh1-k-t','vb jj vbp'],
'colony':['k-aa1 l-ah n-iy','nn'],
'color':['k-ah1 l-er','nn jj vb vbp'],
'column':['k-aa1 l-ah-m','nn'],
'come':['k-ah1-m','vb vbd vbn vbp vbz jj'],
'common':['k-aa1 m-ah-n','jj nn'],
'company':['k-ah1-m p-ah n-iy','nn'],
'compare':['k-ah-m p-eh1-r','vb vbp nn'],
'complete':['k-ah-m p-l-iy1-t','jj vb vbp'],
'condition':['k-ah-n d-ih1 sh-ah-n','nn vbp vb'],
'connect':['k-ah n-eh1-k-t','vb vbp'],
'consider':['k-ah-n s-ih1 d-er','vb vbp'],
'consonant':['k-aa1-n s-ah n-ah-n-t','jj nn'],
'contain':['k-ah-n t-ey1-n','vb vbp'],
'continent':['k-aa1-n t-ah n-ah-n-t','nn'],
'continue':['k-ah-n t-ih1 n-y-uw','vb vbp'],
'control':['k-ah-n t-r-ow1-l','nn jj vb vbp'],
'cook':['k-uh1-k','nn vb vbp'],
'cool':['k-uw1-l','jj nn rb vb vbp'],
'copy':['k-aa1 p-iy','nn vbp vb'],
'corn':['k-ao1-r-n','nn'],
'corner':['k-ao1-r n-er','nn jj vb'],
'correct':['k-er eh1-k-t','jj vbp vb'],
'cost':['k-aa1-s-t','nn vbd vbn vbp vb'],
'cotton':['k-aa1 t-ah-n','nn'],
'could':['k-uh1-d','md'],
'count':['k-aw1-n-t','nn vb vbp'],
'country':['k-ah1-n t-r-iy','nn'],
'course':['k-ao1-r-s','nn rb vb'],
'cover':['k-ah1 v-er','vb nn vbp'],
'cow':['k-aw1','nn vb'],
'crease':['k-r-iy1-s','nn'],
'create':['k-r-iy ey1-t','vb vbp'],
'crop':['k-r-aa1-p','nn rp vb vbp'],
'cross':['k-r-ao1-s','vb jj nn rb vbp'],
'crowd':['k-r-aw1-d','nn vbp vb'],
'cry':['k-r-ay1','nn vb vbp'],
'current':['k-er1 ah-n-t','jj nn'],
'cut':['k-ah1-t','vb vbd vbn vbp jj nn'],
'dad':['d-ae1-d','nn'],
'dance':['d-ae1-n-s','nn vb vbp'],
'danger':['d-ey1-n jh-er','nn'],
'dark':['d-aa1-r-k','jj nn rb'],
'day':['d-ey1','nn'],
'dead':['d-eh1-d','jj nn rb vbn'],
'deal':['d-iy1-l','nn vb vbp'],
'dear':['d-ih1-r','jj nn rb uh'],
'death':['d-eh1-th','nn'],
'decide':['d-ih s-ay1-d','vb vbp'],
'decimal':['d-eh1 s-ah m-ah-l','nn jj'],
'deep':['d-iy1-p','jj rb'],
'degree':['d-ih g-r-iy1','nn'],
'depend':['d-ih p-eh1-n-d','vb vbp'],
'describe':['d-ih s-k-r-ay1-b','vb vbp'],
'desert':['d-eh1 z-er-t','nn jj vb vbp'],
'design':['d-ih z-ay1-n','nn vb vbp'],
'determine':['d-ah t-er1 m-ah-n','vb vbp'],
'develop':['d-ih v-eh1 l-ah-p','vb vbp'],
'dictionary':['d-ih1-k sh-ah n-eh r-iy','nn'],
'die':['d-ay1','vb vbp nn'],
'differ':['d-ih1 f-er','vbp vb'],
'difficult':['d-ih1 f-ah k-ah-l-t','jj'],
'direct':['d-er eh1-k-t','jj vbp rb vb'],
'discuss':['d-ih s-k-ah1-s','vb vbp'],
'distant':['d-ih1 s-t-ah-n-t','jj'],
'divide':['d-ih v-ay1-d','vb nn vbp'],
'division':['d-ih v-ih1 zh-ah-n','nn'],
'do':['d-uw1','vb'],
'doctor':['d-aa1-k t-er','nn vb'],
'dog':['d-ao1-g','nn'],
'dollar':['d-aa1 l-er','nn'],
'done':['d-ah1-n','vbn jj rb vbd'],
'door':['d-ao1-r','nn rb'],
'double':['d-ah1 b-ah-l','jj vbp nn rb vb'],
'down':['d-aw1-n','rb in rbr vbp jj nn rp vb'],
'draw':['d-r-ao1','vb vbp nn'],
'dream':['d-r-iy1-m','nn vb vbp'],
'dress':['d-r-eh1-s','nn vbp vb'],
'drink':['d-r-ih1-ng-k','nn vbp vb'],
'drive':['d-r-ay1-v','nn vbp vb'],
'drop':['d-r-aa1-p','nn jj vb vbp'],
'dry':['d-r-ay1','jj vb vbp'],
'duck':['d-ah1-k','nn vb'],
'during':['d-uh1 r-ih-ng','in'],
'each':['iy1-ch','dt'],
'ear':['ih1-r','nn'],
'early':['er1 l-iy','jj rb'],
'earth':['er1-th','nn'],
'ease':['iy1-z','vb nn vbp'],
'east':['iy1-s-t','jj nn rb'],
'eat':['iy1-t','vb vbp'],
'edge':['eh1-jh','nn vb'],
'effect':['ih f-eh1-k-t','nn jj vb vbp'],
'egg':['eh1-g','nn vb'],
'eight':['ey1- t','cd'],
'either':['iy1 dh-er','dt cc in rb rbr'],
'electric':['ih l-eh1-k t-r-ih-k','jj nn'],
'element':['eh1 l-ah m-ah-n-t','nn'],
'else':['eh1-l-s','rb jj nn'],
'end':['eh1-n-d','nn vbp jj rb vb'],
'enemy':['eh1 n-ah m-iy','nn'],
'energy':['eh1 n-er jh-iy','nn'],
'engine':['eh1-n jh-ah-n','nn'],
'enough':['ih-n ah1-f','rb jj nn'],
'enter':['eh1-n t-er','vb vbn vbp'],
'equal':['iy1 k-w-ah-l','jj nn vb vbp'],
'equate':['ih k-w-ey1-t','vb vbp'],
'especially':['ah s-p-eh1-sh l-iy','rb'],
'even':['iy1 v-ih-n','rb vb'],
'evening':['iy1-v n-ih-ng','nn vbg'],
'event':['ih v-eh1-n-t','nn'],
'ever':['eh1 v-er','rb rbr rp'],
'every':['eh1 v-er iy','dt'],
'exact':['ih-g z-ae1-k-t','jj vb'],
'example':['ih-g z-ae1-m p-ah-l','nn'],
'except':['ih-k s-eh1-p-t','in vb'],
'excite':['ih-k s-ay1-t','vb'],
'exercise':['eh1-k s-er s-ay-z','nn vbp vb'],
'expect':['ih-k s-p-eh1-k-t','vbp vb in'],
'experience':['ih-k s-p-ih1 r-iy ah-n-s','nn vbp vb'],
'experiment':['ih-k s-p-eh1 r-ah m-ah-n-t','nn vbp vb'],
'eye':['ay1','nn vb'],
'face':['f-ey1-s','nn vbp jj rb vb'],
'fact':['f-ae1-k-t','nn'],
'fair':['f-eh1-r','jj nn rb'],
'fall':['f-ao1-l','nn vbp vb'],
'family':['f-ae1 m-ah l-iy','nn'],
'famous':['f-ey1 m-ah-s','jj'],
'far':['f-aa1-r','rb in jj'],
'farm':['f-aa1-r-m','nn vb'],
'fast':['f-ae1-s-t','rb jj nn rp'],
'fat':['f-ae1-t','jj nn'],
'father':['f-aa1 dh-er','nn vb'],
'favor':['f-ey1 v-er','nn vbp vb'],
'fear':['f-ih1-r','nn vb vbp'],
'feed':['f-iy1-d','nn vb'],
'feel':['f-iy1-l','vb vbp nn'],
'fell':['f-eh1-l','vbd jj nn vbn'],
'few':['f-y-uw1','jj'],
'field':['f-iy1-l-d','nn jj vb vbp'],
'fig':['f-ih1-g','nn'],
'fight':['f-ay1-t','nn vb vbp'],
'figure':['f-ih1 g-y-er','nn vb vbp vbz'],
'fill':['f-ih1-l','vb vbp nn'],
'final':['f-ay1 n-ah-l','jj'],
'find':['f-ay1-n-d','vb vbp nn'],
'fine':['f-ay1-n','jj nn rb vb'],
'finger':['f-ih1-ng g-er','nn vb'],
'finish':['f-ih1 n-ih-sh','vb nn vbp'],
'fire':['f-ay1 er','nn vb'],
'first':['f-er1-s-t','jj rb nn'],
'fish':['f-ih1-sh','nn vb'],
'fit':['f-ih1-t','vb vbn vbp jj nn rb vbd'],
'five':['f-ay1-v','cd'],
'flat':['f-l-ae1-t','jj nn rb'],
'floor':['f-l-ao1-r','nn'],
'flow':['f-l-ow1','nn vbp vb'],
'flower':['f-l-aw1 er','nn vb vbp'],
'fly':['f-l-ay1','vb nn vbp'],
'follow':['f-aa1 l-ow','vb vbp'],
'food':['f-uw1-d','nn'],
'foot':['f-uh1-t','nn vbp jj vb'],
'for':['f-ao1-r','in nnp cc jj rb rp'],
'force':['f-ao1-r-s','nn vb nnp vbp'],
'forest':['f-ao1 r-ah-s-t','nn'],
'form':['f-ao1-r-m','nn vbp jj vb'],
'forward':['f-ao1-r w-er-d','rb jj nn vb'],
'found':['f-aw1-n-d','vbd vbn vb'],
'four':['f-ao1-r','cd'],
'fraction':['f-r-ae1-k sh-ah-n','nn'],
'free':['f-r-iy1','jj rb vb vbp'],
'fresh':['f-r-eh1-sh','jj rb'],
'friend':['f-r-eh1-n-d','nn'],
'from':['f-r-ah1-m','in rb rp'],
'front':['f-r-ah1-n-t','nn jj vb'],
'fruit':['f-r-uw1-t','nn'],
'full':['f-uh1-l','jj rb'],
'fun':['f-ah1-n','nn jj'],
'game':['g-ey1-m','nn'],
'garden':['g-aa1-r d-ah-n','nn vb'],
'gas':['g-ae1-s','nn vb'],
'gather':['g-ae1 dh-er','vb vbp'],
'general':['jh-eh1 n-er ah-l','jj nn'],
'gentle':['jh-eh1-n t-ah-l','jj vb'],
'get':['g-eh1-t','vb vbp'],
'girl':['g-er1-l','nn'],
'give':['g-ih1-v','vb nn vbp'],
'glad':['g-l-ae1-d','jj'],
'glass':['g-l-ae1-s','nn'],
'go':['g-ow1','vb jj nn rp vbp'],
'gold':['g-ow1-l-d','nn jj'],
'gone':['g-ao1-n','vbn jj'],
'good':['g-uh1-d','jj nn rb'],
'got':['g-aa1-t','vbd vbn vbp vb'],
'govern':['g-ah1 v-er-n','vb vbp'],
'grand':['g-r-ae1-n-d','jj'],
'grass':['g-r-ae1-s','nn vb'],
'gray':['g-r-ey1','jj nn vb'],
'great':['g-r-ey1-t','jj rb'],
'green':['g-r-iy1-n','jj nn vb'],
'ground':['g-r-aw1-n-d','nn jj vb vbd vbn'],
'group':['g-r-uw1-p','nn vb vbp'],
'grow':['g-r-ow1','vb vbp'],
'guess':['g-eh1-s','vbp nn vb'],
'guide':['g-ay1-d','nn vbp vb'],
'gun':['g-ah1-n','nn vb'],
'hair':['hh-eh1-r','nn'],
'half':['hh-ae1-f','nn jj prp'],
'hand':['hh-ae1-n-d','nn rb vb vbp jj'],
'happen':['hh-ae1 p-ah-n','vb vbp'],
'happy':['hh-ae1 p-iy','jj'],
'hard':['hh-aa1-r-d','jj rb'],
'has':['hh-ae1-z','vbz vbn .'],
'hat':['hh-ae1-t','nn'],
'have':['hh-ae1-v','vbp jj nn vb vbn'],
'he':['hh-iy1','prp vb'],
'head':['hh-eh1-d','nn jj rb vb vbp'],
'hear':['hh-ih1-r','vb vbp'],
'heart':['hh-aa1-r-t','nn rb vb'],
'heat':['hh-iy1-t','nn vb vbp'],
'heavy':['hh-eh1 v-iy','jj nn rb'],
'held':['hh-eh1-l-d','vbn vbd jj'],
'help':['hh-eh1-l-p','vb nn vbp'],
'her':['hh-er','prp$'],
'here':['hh-ih1-r','rb'],
'high':['hh-ay1','jj nn rb rp'],
'hill':['hh-ih1-l','nn'],
'him':['hh-ih1-m','prp'],
'his':['hh-ih1-z','prp$'],
'history':['hh-ih1 s-t-er iy','nn'],
'hit':['hh-ih1-t','vbd jj nn vb vbn vbp'],
'hold':['hh-ow1-l-d','vb nn rb vbp'],
'hole':['hh-ow1-l','nn vbp vb'],
'home':['hh-ow1-m','nn vbp rb vb'],
'hope':['hh-ow1-p','nn vb vbp'],
'horse':['hh-ao1-r-s','nn'],
'hot':['hh-aa1-t','jj'],
'hour':['aw1 er','nn'],
'house':['hh-aw1-s','nn vbp vb'],
'how':['hh-aw1','wrb'],
'huge':['hh-y-uw1-jh','jj'],
'human':['hh-y-uw1 m-ah-n','jj nn'],
'hundred':['hh-ah1-n d-r-ah-d','nn'],
'hunt':['hh-ah1-n-t','nn vb vbp'],
'hurry':['hh-er1 iy','nn vbp vb'],
'ice':['ay1-s','nn jj'],
'idea':['ay d-iy1 ah','nn'],
'if':['ih1-f','in'],
'imagine':['ih m-ae1 jh-ah-n','vb vbp'],
'in':['ih-n','in nn rb rp nnp rbr'],
'inch':['ih1-n-ch','nn rb vb'],
'include':['ih-n k-l-uw1-d','vbp vbn vb'],
'indicate':['ih1-n d-ah k-ey-t','vb vbp'],
'industry':['ih1-n d-ah-s t-r-iy','nn'],
'insect':['ih1-n s-eh-k-t','nn jj'],
'instant':['ih1-n s-t-ah-n-t','nn jj'],
'instrument':['ih1-n s-t-r-ah m-ah-n-t','nn'],
'interest':['ih1-n t-r-ah-s-t','nn vbp vb'],
'invent':['ih-n v-eh1-n-t','vb vbp'],
'iron':['ay1 er-n','nn vb'],
'is':['ih1-s','vbz'],
'island':['ay1 l-ah-n-d','nn'],
'it':['ih1-t','prp'],
'job':['jh-aa1-b','nn'],
'join':['jh-oy1-n','vb vbp'],
'joy':['jh-oy1','nn'],
'jump':['jh-ah1-m-p','nn vbp jj vb'],
'just':['jh-ah1-s-t','rb jj rp'],
'keep':['k-iy1-p','vb nn vbp'],
'key':['k-iy1','jj nn vb'],
'kill':['k-ih1-l','vb vbp nn'],
'kind':['k-ay1-n-d','nn jj rb'],
'king':['k-ih1-ng','nn'],
'know':['n-ow1','vb nn vbp'],
'lady':['l-ey1 d-iy','nn'],
'lake':['l-ey1-k','nn'],
'land':['l-ae1-n-d','nn vbp vb'],
'language':['l-ae1-ng g-w-ah-jh','nn'],
'large':['l-aa1-r-jh','jj rb'],
'last':['l-ae1-s-t','jj nn rb vb vbp'],
'late':['l-ey1-t','jj rb'],
'laugh':['l-ae1-f','nn vbp vb'],
'law':['l-ao1','nn'],
'lay':['l-ey1','vbd vbp jj vb'],
'lead':['l-eh1-d','vb vbn vbp jj nn'],
'learn':['l-er1-n','vb vbp'],
'least':['l-iy1-s-t','jjs rbs jj'],
'leave':['l-iy1-v','vb nn vbp'],
'led':['l-eh1-d','vbn vbd vb'],
'left':['l-eh1-f-t','vbn jj nn rb vbd'],
'leg':['l-eh1-g','nn'],
'length':['l-eh1-ng-k-th','nn'],
'less':['l-eh1-s','jjr jjs cc rb rbr rbs'],
'let':['l-eh1-t','vb vbd vbn vbp nn'],
'letter':['l-eh1 t-er','nn vb'],
'level':['l-eh1 v-ah-l','nn vbp jj vb'],
'lie':['l-ay1','vb vbp nn'],
'life':['l-ay1-f','nn rb'],
'lift':['l-ih1-f-t','vb nn vbp'],
'light':['l-ay1-t','nn jj rb vb vbp'],
'like':['l-ay1-k','in jj nn vb vbp'],
'line':['l-ay1-n','nn vbp rb vb'],
'liquid':['l-ih1 k-w-ah-d','jj nn'],
'list':['l-ih1-s-t','nn vbp vb'],
'listen':['l-ih1 s-ah-n','vb vbp'],
'little':['l-ih1 t-ah-l','jj rb'],
'live':['l-ay1-v','vb rb vbp jj'],
'locate':['l-ow1 k-ey-t','vb vbp'],
'log':['l-ao1-g','nn vb vbp'],
'lone':['l-ow1-n','jj'],
'long':['l-ao1-ng','jj vb vbp rb'],
'look':['l-uh1-k','vb nn vbp'],
'lost':['l-ao1-s-t','vbd vbn jj'],
'lot':['l-aa1-t','nn rb jj'],
'loud':['l-aw1-d','jj rb'],
'love':['l-ah1-v','nn nnp vb vbp'],
'low':['l-ow1','jj nn rb rp'],
'machine':['m-ah sh-iy1-n','nn'],
'made':['m-ey1-d','vbn vbd jj'],
'magnet':['m-ae1-g n-ah-t','nn'],
'main':['m-ey1-n','jj nn'],
'major':['m-ey1 jh-er','jj nn vb vbp'],
'make':['m-ey1-k','vb nn vbp'],
'man':['m-ae1-n','nn jj vb uh'],
'many':['m-eh1 n-iy','jj dt rb vb pdt'],
'map':['m-ae1-p','nn vbp vb'],
'mark':['m-aa1-r-k','nn vbp vb'],
'market':['m-aa1-r k-ah-t','nn vbp vb'],
'mass':['m-ae1-s','nn jj rb vb'],
'master':['m-ae1 s-t-er','nn jj vb jjr'],
'match':['m-ae1-ch','vb vbp nn'],
'material':['m-ah t-ih1 r-iy ah-l','nn jj'],
'matter':['m-ae1 t-er','nn vbp vb'],
'may':['m-ey1','md nnp'],
'me':['m-iy1','prp'],
'mean':['m-iy1-n','vb vbp jj'],
'measure':['m-eh1 zh-er','nn vbp vb'],
'meat':['m-iy1-t','nn'],
'meet':['m-iy1-t','vb vbp nn'],
'melody':['m-eh1 l-ah d-iy','nn'],
'metal':['m-eh1 t-ah-l','nn'],
'method':['m-eh1 th-ah-d','nn'],
'middle':['m-ih1 d-ah-l','nn jj'],
'might':['m-ay1-t','md nn'],
'mile':['m-ay1-l','nn'],
'milk':['m-ih1-l-k','nn vb'],
'million':['m-ih1 l-y-ah-n','nn'],
'mind':['m-ay1-n-d','nn rb vb'],
'mine':['m-ay1-n','nn vb prp vbp'],
'minute':['m-ih1 n-ah-t','nn jj'],
'miss':['m-ih1-s','vb vbp nn'],
'mix':['m-ih1-k-s','nn vbp vb'],
'modern':['m-aa1 d-er-n','jj nn'],
'molecule':['m-aa1 l-ah k-y-uw-l','nn'],
'moment':['m-ow1 m-ah-n-t','nn'],
'money':['m-ah1 n-iy','nn'],
'month':['m-ah1-n-th','nn'],
'moon':['m-uw1-n','nn vb'],
'more':['m-ao1-r','jjr rbr nn jj rb rp'],
'morning':['m-ao1-r n-ih-ng','nn'],
'most':['m-ow1-s-t','rbs jj nn rb jjs'],
'mother':['m-ah1 dh-er','nn vb'],
'motion':['m-ow1 sh-ah-n','nn vb'],
'mount':['m-aw1-n-t','vb nn vbp'],
'mountain':['m-aw1-n t-ah-n','nn'],
'mouth':['m-aw1-th','nn vb'],
'move':['m-uw1-v','nn vbp vb'],
'much':['m-ah1-ch','jj dt nn rb'],
'multiply':['m-ah1-l t-ah p-l-ay','vb vbp'],
'music':['m-y-uw1 z-ih-k','nn'],
'must':['m-ah1-s-t','md'],
'my':['m-ay1','prp$'],
'name':['n-ey1-m','nn vb uh vbp'],
'nation':['n-ey1 sh-ah-n','nn'],
'natural':['n-ae1 ch-er ah-l','jj nn'],
'nature':['n-ey1 ch-er','nn jj'],
'near':['n-ih1-r','in rb vb jj'],
'necessary':['n-eh1 s-ah s-eh r-iy','jj'],
'neck':['n-eh1-k','nn rb vb'],
'need':['n-iy1-d','nn vbp md vb'],
'neighbor':['n-ey1 b-er','nn vb'],
'never':['n-eh1 v-er','rb rbr'],
'new':['n-uw1','jj'],
'next':['n-eh1-k-s-t','jj in rb'],
'night':['n-ay1-t','nn rb'],
'nine':['n-ih1-n','cd'],
'no':['n-ow1','dt jj nn rb uh'],
'noise':['n-oy1-z','nn'],
'noon':['n-uw1-n','nn'],
'nor':['n-ao1-r','cc'],
'north':['n-ao1-r-th','rb jj nn'],
'nose':['n-ow1-z','nn vb'],
'note':['n-ow1-t','nn vbp vb'],
'nothing':['n-ah1 th-ih-ng','nn'],
'notice':['n-ow1 t-ah-s','nn vb vbp'],
'noun':['n-aw1-n','nn'],
'now':['n-aw1','rb jj nn uh'],
'number':['n-ah1-m b-er','nn vb vbp'],
'numeral':['n-uw1 m-er ah-l','nn'],
'object':['aa1-b jh-eh-k-t','nn vbp vb'],
'observe':['ah-b z-er1-v','vb vbp'],
'occur':['ah k-er1','vb vbp'],
'ocean':['ow1 sh-ah-n','nn'],
'of':['ah1-v','in rb rp nnp'],
'off':['ao1-f','in rb jj nn rp'],
'offer':['ao1 f-er','nn vb vbp'],
'office':['ao1 f-ah-s','nn'],
'often':['ao1 f-ah-n','rb'],
'oh':['ow1','uh'],
'oil':['oy1-l','nn'],
'old':['ow1-l-d','jj'],
'on':['aa1-n','in nnp rbr jj rb rp'],
'once':['w-ah1-n-s','rb in'],
'one':['w-ah1-n','cd'],
'only':['ow1-n l-iy','rb in jj'],
'open':['ow1 p-ah-n','jj vbp nn rb rp vb'],
'operate':['aa1 p-er ey-t','vb vbp'],
'opposite':['aa1 p-ah z-ah-t','jj in nn'],
'or':['ao1-r','cc nnp'],
'order':['ao1-r d-er','nn vbp in vb'],
'organ':['ao1-r g-ah-n','nn'],
'original':['er ih1 jh-ah n-ah-l','jj nn'],
'other':['ah1 dh-er','jj nn'],
'our':['aw1 er','prp$'],
'out':['aw1-t','in jj nn rb rp'],
'over':['ow1 v-er','in rp jj rb'],
'own':['ow1-n','jj vbn vbp vb'],
'oxygen':['aa1-k s-ah jh-ah-n','nn'],
'page':['p-ey1-jh','nn vb'],
'paint':['p-ey1-n-t','nn vb vbp'],
'pair':['p-eh1-r','nn vb'],
'paper':['p-ey1 p-er','nn vb'],
'paragraph':['p-ae1 r-ah g-r-ae-f','nn'],
'parent':['p-eh1 r-ah-n-t','nn jj'],
'part':['p-aa1-r-t','nn jj rb vb'],
'particular':['p-er t-ih1 k-y-ah l-er','jj nn rb'],
'party':['p-aa1-r t-iy','nn vb'],
'pass':['p-ae1-s','vb vbp nn'],
'past':['p-ae1-s-t','jj in nn rb'],
'path':['p-ae1-th','nn'],
'pattern':['p-ae1 t-er-n','nn vb'],
'pay':['p-ey1','vb vbd vbp nn'],
'perhaps':['p-er hh-ae1-p-s','rb'],
'period':['p-ih1 r-iy ah-d','nn'],
'person':['p-er1 s-ah-n','nn'],
'phrase':['f-r-ey1-z','nn vb'],
'pick':['p-ih1-k','vb vbp nn'],
'picture':['p-ih1-k ch-er','nn vb vbp'],
'piece':['p-iy1-s','nn vb'],
'pitch':['p-ih1-ch','nn jj vb vbp'],
'place':['p-l-ey1-s','nn vbp rb vb'],
'plain':['p-l-ey1-n','jj nn rb'],
'plan':['p-l-ae1-n','nn vb vbn vbp'],
'plane':['p-l-ey1-n','nn vb'],
'planet':['p-l-ae1 n-ah-t','nn'],
'plant':['p-l-ae1-n-t','nn vb'],
'play':['p-l-ey1','vb nn vbp'],
'please':['p-l-iy1-z','vb uh vbp'],
'plural':['p-l-uh1 r-ah-l','nn jj'],
'poem':['p-ow1 ah-m','nn'],
'point':['p-oy1-n-t','nn vbp rb vb'],
'poor':['p-uh1-r','jj nn nnp'],
'populate':['p-aa1 p-y-ah l-ey-t','vb vbp'],
'port':['p-ao1-r-t','nn jj'],
'pose':['p-ow1-z','vb vbp nn'],
'position':['p-ah z-ih1 sh-ah-n','nn vbp vb'],
'possible':['p-aa1 s-ah b-ah-l','jj rb'],
'post':['p-ow1-s-t','nn in jj vb vbd vbp'],
'pound':['p-aw1-n-d','nn vb vbp'],
'power':['p-aw1 er','nn vbp vb'],
'practice':['p-r-ae1-k t-ah-s','nn vb vbp'],
'prepare':['p-r-iy p-eh1-r','vb vbp'],
'present':['p-r-eh1 z-ah-n-t','jj vbp rb nn vb'],
'press':['p-r-eh1-s','nn vbp vb'],
'pretty':['p-r-ih1 t-iy','rb jj'],
'print':['p-r-ih1-n-t','nn vb vbp'],
'probable':['p-r-aa1 b-ah b-ah-l','jj'],
'problem':['p-r-aa1 b-l-ah-m','nn'],
'process':['p-r-aa1 s-eh-s','nn vbp vb'],
'produce':['p-r-ah d-uw1-s','vb vbp nn'],
'product':['p-r-aa1 d-ah-k-t','nn'],
'proper':['p-r-aa1 p-er','jj'],
'property':['p-r-aa1 p-er t-iy','nn'],
'protect':['p-r-ah t-eh1-k-t','vb vbp'],
'prove':['p-r-uw1-v','vb vbp'],
'provide':['p-r-ah v-ay1-d','vb vbp'],
'pull':['p-uh1-l','vb vbp nn'],
'push':['p-uh1-sh','vb vbp nn'],
'put':['p-uh1-t','vb jj nn vbp vbd vbn'],
'quart':['k-w-ao1-r-t','nn'],
'question':['k-w-eh1-s ch-ah-n','nn vb vbp'],
'quick':['k-w-ih1-k','jj nn rb'],
'quiet':['k-w-ay1 ah-t','jj nn vb'],
'quite':['k-w-ay1-t','rb pdt'],
'quotient':['k-w-ow1 t-ih ah-n-t','nn'],
'race':['r-ey1-s','nn vb'],
'radio':['r-ey1 d-iy ow','nn vb'],
'rail':['r-ey1-l','nn vb'],
'rain':['r-ey1-n','nn vb'],
'raise':['r-ey1-z','vb vbp nn'],
'range':['r-ey1-n-jh','nn jj vb vbp vbz'],
'rather':['r-ae1 dh-er','rb in'],
'reach':['r-iy1-ch','vb vbp nn'],
'read':['r-eh1-d','vb nn vbp vbd vbn'],
'ready':['r-eh1 d-iy','jj rb vb'],
'real':['r-iy1-l','jj nn rb'],
'reason':['r-iy1 z-ah-n','nn vb vbp'],
'receive':['r-ah s-iy1-v','vb vbp'],
'record':['r-ah k-ao1-r-d','nn jj vb vbp'],
'red':['r-eh1-d','jj nn'],
'region':['r-iy1 jh-ah-n','nn'],
'remember':['r-ih m-eh1-m b-er','vb vbp'],
'repeat':['r-ih p-iy1-t','vb jj nn vbp'],
'reply':['r-ih p-l-ay1','nn vb vbp'],
'represent':['r-eh p-r-ah z-eh1-n-t','vb vbp'],
'require':['r-iy k-w-ay1 er','vb vbp'],
'rest':['r-eh1-s-t','nn vbp vb rb'],
'result':['r-ih z-ah1-l-t','nn vbp vb'],
'rich':['r-ih1-ch','jj'],
'ride':['r-ay1-d','vb nn vbp'],
'right':['r-ay1-t','nn rb vb in jj'],
'ring':['r-ih1-ng','nn vb vbp'],
'rise':['r-ay1-z','nn vbp vb'],
'river':['r-ih1 v-er','nn'],
'road':['r-ow1-d','nn'],
'rock':['r-aa1-k','nn jj vb vbp'],
'roll':['r-ow1-l','nn vb vbp'],
'room':['r-uw1-m','nn vb'],
'root':['r-uw1-t','nn vbp vb'],
'rope':['r-ow1-p','nn vb'],
'rose':['r-ow1-z','vbd jj nn'],
'round':['r-aw1-n-d','nn in jj vbp rb vb'],
'row':['r-ow1','nn vbp vb'],
'rub':['r-ah1-b','nn vb vbp'],
'rule':['r-uw1-l','nn vbp vb'],
'run':['r-ah1-n','vb vbd vbn vbp nn'],
'safe':['s-ey1-f','jj nn'],
'said':['s-eh1-d','vbd vbn jj vb'],
'sail':['s-ey1-l','vb vbp nn'],
'salt':['s-ao1-l-t','nn jj vb'],
'same':['s-ey1-m','jj'],
'sand':['s-ae1-n-d','nn vb'],
'save':['s-ey1-v','vb in vbp'],
'saw':['s-ao1','vbd nn'],
'say':['s-ey1','vbp nn nnp vb uh'],
'scale':['s-k-ey1-l','nn vb'],
'school':['s-k-uw1-l','nn vb'],
'science':['s-ay1 ah-n-s','nn jj'],
'score':['s-k-ao1-r','nn vb vbp'],
'sea':['s-iy1','nn vb vbp'],
'search':['s-er1-ch','nn vb vbp'],
'season':['s-iy1 z-ah-n','nn vb'],
'seat':['s-iy1-t','nn vb vbp'],
'second':['s-eh1 k-ah-n-d','nn jj rb vb'],
'section':['s-eh1-k sh-ah-n','nn nnp'],
'see':['s-iy1','vb uh vbp'],
'seed':['s-iy1-d','nn vb'],
'seem':['s-iy1-m','vb vbp'],
'segment':['s-eh1-g m-ah-n-t','nn vb vbp'],
'select':['s-ah l-eh1-k-t','vb vbp jj'],
'self':['s-eh1-l-f','nn prp'],
'sell':['s-eh1-l','vb vbp nn'],
'send':['s-eh1-n-d','vb vbp'],
'sense':['s-eh1-n-s','nn vbp vb'],
'sentence':['s-eh1-n t-ah-n-s','nn vb'],
'separate':['s-eh1 p-er ey-t','jj vbp vb'],
'serve':['s-er1-v','vb vbp'],
'set':['s-eh1-t','vbn vbd vbp jj nn vb'],
'settle':['s-eh1 t-ah-l','vb vbp'],
'seven':['s-eh1 v-ah-n','cd'],
'several':['s-eh1 v-r-ah-l','jj rb'],
'shall':['sh-ae1-l','md'],
'shape':['sh-ey1-p','nn vbp vb'],
'share':['sh-eh1-r','nn vbp jj vb'],
'sharp':['sh-aa1-r-p','jj'],
'she':['sh-iy1','prp'],
'sheet':['sh-iy1-t','nn'],
'shell':['sh-eh1-l','nn jj vb'],
'shine':['sh-ay1-n','nn vbp vb'],
'ship':['sh-ih1-p','nn vbp vb'],
'shoe':['sh-uw1','nn'],
'shop':['sh-aa1-p','nn vb vbp'],
'shore':['sh-ao1-r','nn jj rb vb'],
'short':['sh-ao1-r-t','jj nn rb vb'],
'should':['sh-uh1-d','md'],
'shoulder':['sh-ow1-l d-er','nn vbp rb vb'],
'shout':['sh-aw1-t','vb vbp nn'],
'show':['sh-ow1','nn vb vbp'],
'side':['s-ay1-d','nn vbp jj rb vb'],
'sight':['s-ay1-t','nn vb'],
'sign':['s-ay1-n','nn vbp vb'],
'silent':['s-ay1 l-ah-n-t','jj'],
'silver':['s-ih1-l v-er','nn jj jjr'],
'similar':['s-ih1 m-ah l-er','jj'],
'simple':['s-ih1-m p-ah-l','jj nn'],
'since':['s-ih1-n-s','in rb'],
'sing':['s-ih1-ng','vb vbp'],
'single':['s-ih1-ng g-ah-l','jj vbp nn rb vb'],
'sister':['s-ih1 s-t-er','nn jj'],
'sit':['s-ih1-t','vb vbp'],
'six':['s-ih1-k-s','cd'],
'size':['s-ay1-z','nn vbp vb'],
'skill':['s-k-ih1-l','nn vb'],
'skin':['s-k-ih1-n','nn'],
'sky':['s-k-ay1','nn'],
'slave':['s-l-ey1-v','nn'],
'sleep':['s-l-iy1-p','vb nn vbp'],
'slip':['s-l-ih1-p','vb nn vbp'],
'slow':['s-l-ow1','jj vbp rb vb'],
'small':['s-m-ao1-l','jj'],
'smell':['s-m-eh1-l','nn vb vbp'],
'smile':['s-m-ay1-l','nn vb vbp'],
'snow':['s-n-ow1','nn vb'],
'so':['s-ow1','rb cc in'],
'soft':['s-aa1-f-t','jj rb'],
'soil':['s-oy1-l','nn vb'],
'soldier':['s-ow1-l jh-er','nn'],
'solution':['s-ah l-uw1 sh-ah-n','nn'],
'solve':['s-aa1-l-v','vb vbp'],
'some':['s-ah1-m','dt nn rb'],
'son':['s-ah1-n','nn'],
'song':['s-ao1-ng','nn'],
'soon':['s-uw1-n','rb'],
'sound':['s-aw1-n-d','nn jj rb vb vbp'],
'south':['s-aw1-th','rb jj nn'],
'space':['s-p-ey1-s','nn vb'],
'speak':['s-p-iy1-k','vb vbp'],
'special':['s-p-eh1 sh-ah-l','jj nn'],
'speech':['s-p-iy1-ch','nn'],
'speed':['s-p-iy1-d','nn vb'],
'spell':['s-p-eh1-l','vb nn vbp'],
'spend':['s-p-eh1-n-d','vb vbp'],
'spoke':['s-p-ow1-k','vbd nn'],
'spot':['s-p-aa1-t','nn jj vb vbp'],
'spread':['s-p-r-eh1-d','nn vbd vbn vbp jj vb'],
'spring':['s-p-r-ih1-ng','nn vb vbp'],
'square':['s-k-w-eh1-r','nn jj rb vb vbp'],
'stand':['s-t-ae1-n-d','vb nn vbp'],
'star':['s-t-aa1-r','nn jj vb'],
'start':['s-t-aa1-r-t','vb vbp nn rp'],
'state':['s-t-ey1-t','nn jj vb vbp'],
'station':['s-t-ey1 sh-ah-n','nn vb'],
'stay':['s-t-ey1','vb vbp nn'],
'stead':['s-t-eh1-d','nn'],
'steam':['s-t-iy1-m','nn vb'],
'steel':['s-t-iy1-l','nn jj'],
'step':['s-t-eh1-p','nn vbp vb'],
'stick':['s-t-ih1-k','vb vbp nn'],
'still':['s-t-ih1-l','rb jj nn vb'],
'stone':['s-t-ow1-n','nn rb vb'],
'stop':['s-t-aa1-p','vb nn vbp'],
'store':['s-t-ao1-r','nn vb vbp'],
'story':['s-t-ao1 r-iy','nn'],
'straight':['s-t-r-ey1-t','jj rb'],
'strange':['s-t-r-ey1-n-jh','jj'],
'stream':['s-t-r-iy1-m','nn vb'],
'street':['s-t-r-iy1-t','nn'],
'stretch':['s-t-r-eh1-ch','nn vbp jj vb'],
'string':['s-t-r-ih1-ng','nn vb'],
'strong':['s-t-r-ao1-ng','jj rb'],
'student':['s-t-uw1 d-ah-n-t','nn'],
'study':['s-t-ah1 d-iy','nn vbp vb'],
'subject':['s-ah-b jh-eh1-k-t','nn jj vb'],
'substance':['s-ah1-b s-t-ah-n-s','nn'],
'subtract':['s-ah-b t-r-ae1-k-t','vb vbp'],
'success':['s-ah-k s-eh1-s','nn'],
'such':['s-ah1-ch','jj pdt dt'],
'sudden':['s-ah1 d-ah-n','jj'],
'suffix':['s-ah1 f-ih-k-s','nn'],
'sugar':['sh-uh1 g-er','nn vb'],
'suggest':['s-ah-g jh-eh1-s-t','vbp vb'],
'suit':['s-uw1-t','nn vbp rb vb'],
'summer':['s-ah1 m-er','nn'],
'sun':['s-ah1-n','nn vb'],
'supply':['s-ah p-l-ay1','nn vbp vb'],
'support':['s-ah p-ao1-r-t','nn vb vbp'],
'sure':['sh-uh1-r','jj pdt rb uh'],
'surface':['s-er1 f-ah-s','nn vb vbp'],
'surprise':['s-er p-r-ay1-z','nn jj rb vb'],
'swim':['s-w-ih1-m','vb vbp nn'],
'syllable':['s-ih1 l-ah b-ah-l','nn'],
'symbol':['s-ih1-m b-ah-l','nn'],
'system':['s-ih1 s-t-ah-m','nn'],
'table':['t-ey1 b-ah-l','nn vb'],
'tail':['t-ey1-l','nn jj vb'],
'take':['t-ey1-k','vb nn vbp'],
'talk':['t-ao1-k','vb vbp nn'],
'tall':['t-ao1-l','jj'],
'teach':['t-iy1-ch','vb vbp'],
'team':['t-iy1-m','nn vb vbp'],
'tell':['t-eh1-l','vb vbp'],
'temperature':['t-eh1-m p-r-ah ch-er','nn'],
'ten':['t-eh1-n','nn'],
'term':['t-er1-m','nn vb vbp'],
'test':['t-eh1-s-t','nn vbp vb'],
'than':['dh-ae1-n','in rb rbr'],
'thank':['th-ae1-ng-k','vb vbp'],
'that':['dh-ae1-t','in dt nn rb rp uh wp wdt'],
'the':['dh-ah','dt'],
'their':['dh-eh1-r','prp$'],
'them':['dh-eh1-m','prp dt'],
'then':['dh-eh1-n','rb in jj'],
'there':['dh-eh1-r','ex rb uh'],
'these':['dh-iy1-z','dt'],
'they':['dh-ey1','prp'],
'thick':['th-ih1-k','jj nn rb'],
'thin':['th-ih1-n','jj rb vb'],
'thing':['th-ih1-ng','nn'],
'think':['th-ih1-ng-k','vbp vb nn'],
'third':['th-er1-d','nn jj rb'],
'this':['dh-ih1-s','dt rb pdt'],
'those':['dh-ow1-z','dt'],
'though':['dh-ow1','in rb'],
'thought':['th-ao1-t','vbd nn vbn'],
'thousand':['th-aw1 z-ah-n-d','nn'],
'three':['th-r-iy1','cd'],
'through':['th-r-uw1','in jj rb rp'],
'throw':['th-r-ow1','vb vbp nn'],
'thus':['dh-ah1-s','rb'],
'tie':['t-ay1','nn vbp vb'],
'time':['t-ay1-m','nn vb'],
'tiny':['t-ay1 n-iy','jj'],
'tire':['t-ay1 er','nn vbp vb'],
'to':['t-uw1','to rb'],
'together':['t-ah g-eh1 dh-er','rb in rp'],
'tone':['t-ow1-n','nn vb'],
'too':['t-uw1','rb'],
'tool':['t-uw1-l','nn vb'],
'top':['t-aa1-p','jj nn vbp rb vb'],
'total':['t-ow1 t-ah-l','jj nn vb vbp'],
'touch':['t-ah1-ch','nn rb vb vbp'],
'toward':['t-ah w-ao1-r-d','in'],
'town':['t-aw1-n','nn'],
'track':['t-r-ae1-k','nn vbp vb'],
'trade':['t-r-ey1-d','nn vbp vb'],
'train':['t-r-ey1-n','nn vb vbp'],
'travel':['t-r-ae1 v-ah-l','nn vbp vb'],
'tree':['t-r-iy1','nn'],
'triangle':['t-r-ay1 ae-ng g-ah-l','nn'],
'trip':['t-r-ih1-p','nn vb'],
'trouble':['t-r-ah1 b-ah-l','nn vbd vbp jj vb'],
'truck':['t-r-ah1-k','nn vb vbp'],
'true':['t-r-uw1','jj'],
'try':['t-r-ay1','vb vbp nn'],
'tube':['t-uw1-b','nn'],
'turn':['t-er1-n','vb nn rb vbp'],
'twenty':['t-w-eh1-n t-iy','nn'],
'two':['t-uw1','cd'],
'type':['t-ay1-p','nn vb'],
'under':['ah1-n d-er','in jj rb rp'],
'unit':['y-uw1 n-ah-t','nn'],
'until':['ah-n t-ih1-l','in'],
'up':['ah1-p','in jj rb rp vb nnp rbr'],
'us':['ah1-s','prp'],
'use':['y-uw1-s','nn vb vbp'],
'usual':['y-uw1 zh-ah w-ah-l','jj rb'],
'valley':['v-ae1 l-iy','nn'],
'value':['v-ae1-l y-uw','nn vbp vb'],
'vary':['v-eh1 r-iy','vbp vb'],
'verb':['v-er1-b','nn'],
'very':['v-eh1 r-iy','rb jj'],
'view':['v-y-uw1','nn vbp vb'],
'village':['v-ih1 l-ah-jh','nn'],
'visit':['v-ih1 z-ah-t','nn vb vbp'],
'voice':['v-oy1-s','nn vbp vb'],
'vowel':['v-aw1 ah-l','nn jj'],
'wait':['w-ey1-t','vb vbp nn'],
'walk':['w-ao1-k','vb vbp nn'],
'wall':['w-ao1-l','nn vbp vb'],
'want':['w-aa1-n-t','vbp vb nn'],
'war':['w-ao1-r','nn nnp vb'],
'warm':['w-ao1-r-m','jj vb'],
'wash':['w-aa1-sh','nn vbp vb'],
'watch':['w-aa1-ch','vb jj nn vbp'],
'water':['w-ao1 t-er','nn vb jj'],
'wave':['w-ey1-v','nn vb vbp'],
'way':['w-ey1','nn rb'],
'we':['w-iy1','prp'],
'wear':['w-eh1-r','vb jj nn vbp'],
'weather':['w-eh1 dh-er','nn vb vbp'],
'week':['w-iy1-k','nn'],
'weight':['w-ey1-t','nn vb'],
'well':['w-eh1-l','rb vbp jj nn vb uh'],
'were':['w-er','vbd vb'],
'west':['w-eh1-s-t','nn jj rb jjs'],
'what':['w-ah1-t','wp wdt in'],
'wheel':['w-iy1-l','nn vb vbp'],
'when':['w-eh1-n','wrb in'],
'where':['w-eh1-r','wrb'],
'whether':['w-eh1 dh-er','in cc'],
'which':['w-ih1-ch','wdt wp'],
'while':['w-ay1-l','in jj nn rb vb'],
'white':['w-ay1-t','jj nn'],
'who':['hh-uw1','wp nn'],
'whole':['hh-ow1-l','jj nn rp'],
'whose':['hh-uw1-z','wp$'],
'why':['w-ay1','wrb'],
'wide':['w-ay1-d','jj rb'],
'wife':['w-ay1-f','nn'],
'wild':['w-ay1-l-d','jj rb'],
'will':['w-ih1-l','md vbp nn vb'],
'win':['w-ih1-n','vb nn vbp'],
'wind':['w-ay1-n-d','nn vbp vb'],
'window':['w-ih1-n d-ow','nn'],
'wing':['w-ih1-ng','nn vb'],
'winter':['w-ih1-n t-er','nn vb'],
'wire':['w-ay1 er','nn vb'],
'wish':['w-ih1-sh','vbp nn vb'],
'with':['w-ih1-dh','in jj rb rp'],
'woman':['w-uh1 m-ah-n','nn vb'],
'wonder':['w-ah1-n d-er','nn vbp jj vb jjr'],
'wood':['w-uh1-d','nn'],
'word':['w-er1-d','nn vb'],
'work':['w-er1-k','nn vb vbp'],
'world':['w-er1-l-d','nn rb'],
'would':['w-uh1-d','md'],
'write':['r-ay1-t','vb vbp'],
'written':['r-ih1 t-ah-n','vbn jj'],
'wrong':['r-ao1-ng','jj nn rb vb'],
'yard':['y-aa1-r-d','nn'],
'year':['y-ih1-r','nn jj'],
'yellow':['y-eh1 l-ow','jj nn vb'],
'yes':['y-eh1-s','uh rb'],
'yet':['y-eh1-t','rb cc'],
'you':['y-uw1','prp rp'],
'young':['y-ah1-ng','jj'],
'your':['y-ao1-r','prp$']
}; }

var LetterToSound = makeClass(); // (adapted from FreeTTS)

LetterToSound.prototype = {

  init: function() {
    this.warnedForNoLTS = false;
    this.letterIndex = {};
    this.fval_buff = [];
    this.stateMachine = null;
    this.numStates = 0;
    for (var i = 0; i < LetterToSound.RULES.length; i++)
      this.parseAndAdd(LetterToSound.RULES[i]);
  },

  _createState: function(type, tokenizer) {

    if (type === "STATE") {
      var index = parseInt(tokenizer.nextToken());
      var c = tokenizer.nextToken();
      var qtrue = parseInt(tokenizer.nextToken());
      var qfalse = parseInt(tokenizer.nextToken());

      return new DecisionState(index, c.charAt(0), qtrue, qfalse);

    } else if (type === "PHONE") {

      return new FinalState(tokenizer.nextToken());
    }

    throw Error("Unexpected type: " + type);
  },

  // Creates a word from an input line and adds it to the state machine
  parseAndAdd: function(line) {
    var tokenizer = new StringTokenizer(line, SP);
    var type = tokenizer.nextToken();

    if (type === "STATE" || type === "PHONE") {
      this.stateMachine[this.numStates++] = this._createState(type, tokenizer);
    } else if (type === "INDEX") {
      var index = parseInt(tokenizer.nextToken());
      if (index != this.numStates) {
        throw Error("Bad INDEX in file.");
      } else {
        var c = tokenizer.nextToken();
        this.letterIndex[c] = index;
      }
      //log(type+" : "+c+" : "+index + " "+this.letterIndex[c]);
    } else if (type == "TOTAL") {
      this.stateMachine = [];
      this.stateMachineSize = parseInt(tokenizer.nextToken());
    }
  },

  getPhones: function(input, delim) {

    var i, ph, result = [];

    delim = delim || '-';

    if (is(input, S)) {

      if (!input.length) return E;

      input = RiTa.tokenize(input);
    }

    for (i = 0; i < input.length; i++) {
      ph = this._computePhones(input[i]);
      result[i] = ph ? ph.join(delim) : E;
    }

    result = result.join(delim).replace(/ax/g, 'ah');

    result.replace("/0/g","");

    if (result.length > 0 && result.indexOf("1") === -1 && result.indexOf(" ") === -1) {
          ph = result.split("-");
          result = "";
          for (var i = 0; i < ph.length; i++) {
              if (/[aeiou]/.test(ph[i])) ph[i] += "1";
              result += ph[i] + "-";
          }
          if(ph.length > 1) result = result.substring(0, result.length - 1);
      }

    return result;
  },

  _computePhones: function(word) {

    var dig, phoneList = [], windowSize = 4,
      full_buff, tmp, currentState, startIndex, stateIndex, c;


    if (!word || !word.length || RiTa.isPunctuation(word))
      return null;

    if (!LetterToSound.RULES) {
      if (!this.warnedForNoLTS) {

        this.warnedForNoLTS = true;
        console.warn("[WARN] No LTS-rules found: for word features outside the lexicon, use a larger version of RiTa.");
      }
      return null;
    }

    word = word.toLowerCase();

    if (isNum(word)) {

      word = (word.length > 1) ? word.split(E) : [word];

      for (var k = 0; k < word.length; k++) {

        dig = parseInt(word[k]);
        if (dig < 0 || dig > 9)
          throw Error("Attempt to pass multi-digit number to LTS: '" + word + "'");

        phoneList.push(RiString._phones.digits[dig]);
      }
      return phoneList;
    }

    // Create "000#word#000", uggh
    tmp = "000#" + word.trim() + "#000", full_buff = tmp.split(E);

    for (var pos = 0; pos < word.length; pos++) {

      for (var i = 0; i < windowSize; i++) {

        this.fval_buff[i] = full_buff[pos + i];
        this.fval_buff[i + windowSize] =
          full_buff[i + pos + 1 + windowSize];
      }

      c = word.charAt(pos);
      startIndex = this.letterIndex[c];

      // must check for null here, not 0 (and not ===)
      if (!isNum(startIndex)) {
        warn("Unable to generate LTS for '" + word + "'\n       No LTS index for character: '" +
          c + "', isDigit=" + isNum(c) + ", isPunct=" + RiTa.isPunctuation(c));
        return null;
      }

      stateIndex = parseInt(startIndex);

      currentState = this.getState(stateIndex);

      while (!(currentState instanceof FinalState)) {

        stateIndex = currentState.getNextState(this.fval_buff);
        currentState = this.getState(stateIndex);
      }

      currentState.append(phoneList);
    }

    return phoneList;
  },

  getState: function(i) {

    if (is(i, N)) {
      var state = null;
      if (is(this.stateMachine[i], S)) {
        state = this.getState(this.stateMachine[i]);
      } else
        state = this.stateMachine[i];
      return state;
    } else {
      var tokenizer = new StringTokenizer(i, " ");
      return this.getState(tokenizer.nextToken(), tokenizer);
    }
  }
};

// DecisionState

var DecisionState = makeClass();

DecisionState.TYPE = 1;

DecisionState.prototype = {

  init: function(index, c, qtrue, qfalse) {

    this.c = c;
    this.index = index;
    this.qtrue = qtrue;
    this.qfalse = qfalse;
  },

  type: function() {
    return "DecisionState";
  },

  getNextState: function(chars) {

    return (chars[this.index] == this.c) ? this.qtrue : this.qfalse;
  }
};

// FinalState

var FinalState = makeClass();

FinalState.TYPE = 2;

FinalState.prototype = {

  // "epsilon" is used to indicate an empty list.
  init: function(phones) {

    this.phoneList = [];

    if (phones === ("epsilon")) {
      this.phoneList = null;
    } else if (is(phones, A)) {
      this.phoneList = phones;
    } else {
      var i = phones.indexOf('-');
      if (i != -1) {
        this.phoneList[0] = phones.substring(0, i);
        this.phoneList[1] = phones.substring(i + 1);
      } else {
        this.phoneList[0] = phones;
      }
    }
  },

  type: function() { return "FinalState"; },

  append: function(array) {

    if (!this.phoneList) return;
    for (var i = 0; i < this.phoneList.length; i++)
      array.push(this.phoneList[i]);
  }
};

LetterToSound.RULES=[
'TOTAL 13100',
'INDEX 0 a',
'STATE 4 r 2 1',
'STATE 6 0 4 3',
'STATE 3 e 6 5',
'STATE 4 u 8 7',
'STATE 4 y 10 9',
'STATE 3 w 12 11',
'STATE 5 t 14 13',
'STATE 3 e 16 15',
'STATE 3 e 18 17',
'STATE 4 # 20 19',
'STATE 3 w 22 21',
'STATE 1 0 24 23',
'STATE 5 e 26 25',
'STATE 5 n 28 27',
'STATE 2 h 29 28',
'STATE 5 e 31 30',
'STATE 2 r 33 32',
'STATE 5 e 35 34',
'STATE 5 t 28 36',
'STATE 3 e 38 37',
'STATE 3 e 40 39',
'STATE 2 c 42 41',
'STATE 2 a 43 42',
'STATE 5 y 45 44',
'STATE 5 r 47 46',
'STATE 5 d 49 48',
'PHONE eh1',
'STATE 5 m 51 50',
'PHONE epsilon',
'PHONE aa1',
'STATE 4 i 53 52',
'STATE 4 g 55 54',
'STATE 4 n 57 56',
'STATE 1 # 59 58',
'STATE 5 g 61 60',
'STATE 1 0 63 62',
'STATE 1 u 29 64',
'STATE 3 o 28 65',
'STATE 4 u 67 66',
'STATE 3 a 29 68',
'STATE 2 l 68 69',
'STATE 1 # 42 70',
'PHONE ey1',
'STATE 1 l 72 71',
'STATE 5 i 74 73',
'STATE 3 n 26 75',
'STATE 5 a 77 76',
'STATE 2 # 79 78',
'STATE 5 i 26 80',
'STATE 1 0 82 81',
'STATE 2 w 28 83',
'STATE 2 r 29 84',
'STATE 5 i 86 85',
'STATE 5 r 88 87',
'STATE 6 # 90 89',
'STATE 1 0 92 91',
'STATE 4 b 94 93',
'STATE 1 # 96 95',
'STATE 4 k 98 97',
'STATE 5 t 100 99',
'STATE 1 0 102 101',
'STATE 2 # 104 103',
'STATE 1 # 63 105',
'PHONE aw1',
'STATE 6 e 107 106',
'STATE 4 w 109 108',
'STATE 4 d 28 110',
'STATE 1 o 111 107',
'PHONE ah',
'STATE 2 y 68 112',
'STATE 2 p 42 113',
'STATE 1 t 72 42',
'PHONE ey',
'STATE 5 e 115 114',
'STATE 6 # 29 116',
'STATE 2 c 26 117',
'STATE 5 i 119 118',
'STATE 3 p 26 120',
'STATE 6 o 100 28',
'STATE 3 n 26 121',
'STATE 1 0 82 122',
'STATE 1 # 82 123',
'PHONE ao1',
'STATE 1 s 125 124',
'STATE 1 # 28 126',
'STATE 4 y 128 127',
'STATE 6 o 130 129',
'STATE 5 n 132 131',
'STATE 3 z 133 26',
'STATE 3 w 135 134',
'STATE 4 t 137 136',
'STATE 1 # 139 138',
'STATE 3 m 100 140',
'STATE 1 i 142 141',
'STATE 1 # 28 68',
'STATE 1 c 28 143',
'STATE 5 d 100 144',
'STATE 4 t 146 145',
'STATE 1 b 42 28',
'STATE 6 n 148 147',
'PHONE ae1',
'STATE 1 # 150 149',
'STATE 3 c 152 151',
'STATE 2 n 154 153',
'STATE 3 l 100 82',
'PHONE aw',
'STATE 1 o 111 155',
'PHONE ow1',
'STATE 1 # 157 156',
'STATE 3 l 82 158',
'STATE 4 n 160 159',
'PHONE ow',
'STATE 1 c 28 68',
'STATE 1 l 162 161',
'STATE 5 r 164 163',
'STATE 6 l 166 165',
'STATE 6 z 28 167',
'STATE 2 e 26 168',
'STATE 5 e 170 169',
'STATE 6 s 172 171',
'STATE 6 # 29 173',
'STATE 3 h 175 174',
'STATE 5 # 28 176',
'STATE 1 r 82 28',
'STATE 5 l 178 177',
'STATE 6 # 179 126',
'PHONE ih1',
'STATE 2 # 181 180',
'STATE 5 a 183 182',
'STATE 6 # 29 184',
'STATE 4 t 186 185',
'STATE 5 l 188 187',
'STATE 3 t 190 189',
'PHONE ay',
'STATE 6 d 192 191',
'STATE 4 t 194 193',
'STATE 3 i 196 195',
'STATE 3 u 198 197',
'STATE 3 i 28 199',
'STATE 2 s 42 200',
'STATE 6 r 42 201',
'STATE 1 t 203 202',
'STATE 2 n 42 204',
'STATE 1 r 68 205',
'STATE 2 d 100 28',
'STATE 5 o 28 206',
'STATE 1 c 42 207',
'STATE 5 e 28 208',
'STATE 4 g 42 28',
'STATE 5 l 210 209',
'STATE 3 h 82 211',
'STATE 2 # 213 212',
'STATE 6 a 82 214',
'STATE 1 # 82 215',
'PHONE ao',
'STATE 2 b 217 216',
'STATE 4 n 219 218',
'STATE 3 a 29 220',
'STATE 1 e 154 82',
'STATE 2 n 222 221',
'STATE 1 c 28 223',
'STATE 3 d 42 224',
'STATE 3 d 225 72',
'STATE 5 t 227 226',
'STATE 2 q 82 228',
'STATE 6 t 28 229',
'STATE 2 c 28 230',
'STATE 6 o 232 231',
'STATE 3 u 26 233',
'STATE 5 o 235 234',
'STATE 6 e 28 236',
'STATE 6 # 29 237',
'STATE 2 # 238 28',
'STATE 6 s 240 239',
'STATE 6 y 26 241',
'STATE 6 e 100 242',
'STATE 2 e 28 243',
'STATE 2 b 245 244',
'STATE 2 p 28 246',
'STATE 2 h 247 28',
'STATE 1 # 249 248',
'STATE 3 w 251 250',
'STATE 5 o 253 252',
'STATE 6 s 230 254',
'STATE 6 z 256 255',
'STATE 4 n 100 257',
'STATE 1 0 100 258',
'STATE 6 # 260 259',
'STATE 3 m 261 42',
'STATE 1 a 263 262',
'STATE 2 s 42 264',
'STATE 6 s 266 265',
'STATE 4 t 268 267',
'STATE 4 l 68 42',
'STATE 2 t 29 82',
'STATE 3 o 28 269',
'STATE 4 l 29 100',
'STATE 3 t 42 270',
'STATE 2 t 42 271',
'STATE 6 n 68 272',
'STATE 3 r 42 273',
'STATE 6 # 42 274',
'STATE 1 # 28 275',
'STATE 4 t 276 28',
'STATE 4 s 28 277',
'STATE 2 c 68 278',
'STATE 4 n 68 279',
'STATE 1 t 28 280',
'STATE 5 s 68 281',
'STATE 6 # 283 282',
'STATE 3 n 107 284',
'STATE 2 c 82 285',
'STATE 5 t 82 286',
'STATE 5 n 82 287',
'STATE 5 s 29 288',
'STATE 2 e 154 289',
'STATE 1 e 111 107',
'STATE 5 c 107 290',
'STATE 4 l 292 291',
'STATE 3 m 68 293',
'STATE 4 u 63 294',
'STATE 1 a 28 295',
'STATE 1 i 68 28',
'STATE 1 # 28 296',
'STATE 2 t 42 297',
'STATE 2 i 72 42',
'STATE 3 o 28 298',
'STATE 2 q 82 299',
'STATE 1 r 26 300',
'STATE 1 c 302 301',
'PHONE aa',
'STATE 6 a 26 303',
'STATE 3 s 29 304',
'STATE 3 r 26 305',
'STATE 5 y 307 306',
'STATE 6 l 309 308',
'STATE 2 # 311 310',
'STATE 3 v 313 312',
'STATE 3 p 28 26',
'STATE 6 b 100 314',
'STATE 3 h 28 29',
'STATE 6 i 316 315',
'STATE 6 o 26 100',
'STATE 1 # 82 317',
'STATE 5 c 28 318',
'STATE 5 d 126 28',
'STATE 1 # 319 28',
'PHONE ih',
'STATE 5 o 321 320',
'STATE 3 o 323 322',
'STATE 4 w 325 324',
'STATE 4 l 327 326',
'STATE 5 r 328 42',
'STATE 2 # 42 329',
'STATE 2 a 331 330',
'STATE 6 n 333 332',
'STATE 1 0 100 68',
'STATE 1 0 335 334',
'STATE 3 n 337 336',
'STATE 5 o 28 338',
'STATE 5 a 29 42',
'STATE 2 e 72 42',
'STATE 6 g 29 339',
'STATE 3 r 42 340',
'STATE 6 e 42 341',
'STATE 4 k 343 342',
'STATE 4 t 345 344',
'STATE 3 o 28 346',
'STATE 3 o 28 42',
'STATE 2 a 348 347',
'STATE 2 i 350 349',
'STATE 1 a 42 68',
'STATE 6 r 352 351',
'STATE 3 l 100 68',
'STATE 2 # 354 353',
'STATE 2 m 42 355',
'STATE 5 r 100 68',
'STATE 4 l 28 68',
'STATE 2 g 68 356',
'STATE 4 l 28 357',
'STATE 5 h 28 358',
'STATE 4 p 68 359',
'STATE 5 s 361 360',
'STATE 5 d 107 362',
'STATE 3 s 82 363',
'STATE 6 e 365 364',
'STATE 5 d 82 366',
'STATE 5 r 368 367',
'STATE 5 l 29 82',
'STATE 2 o 154 369',
'STATE 6 o 107 370',
'STATE 4 s 372 371',
'STATE 3 h 373 68',
'STATE 3 i 68 374',
'STATE 4 i 28 375',
'STATE 4 k 28 376',
'STATE 1 o 68 377',
'STATE 1 c 42 378',
'STATE 1 # 380 379',
'STATE 1 # 29 381',
'STATE 1 e 383 382',
'STATE 6 # 385 384',
'STATE 3 s 29 230',
'STATE 6 c 387 386',
'STATE 3 c 26 388',
'STATE 2 i 26 389',
'STATE 5 u 391 390',
'STATE 6 # 26 392',
'STATE 6 # 29 393',
'STATE 3 p 28 394',
'STATE 6 n 28 230',
'STATE 3 m 230 395',
'STATE 6 t 26 396',
'STATE 6 e 28 26',
'STATE 2 # 398 397',
'STATE 3 m 400 399',
'STATE 3 m 26 401',
'STATE 2 h 82 402',
'STATE 5 s 404 403',
'STATE 6 e 28 126',
'STATE 5 l 406 405',
'STATE 6 # 29 407',
'STATE 4 w 409 408',
'STATE 2 j 29 28',
'STATE 4 l 411 410',
'STATE 5 a 413 412',
'STATE 4 g 100 414',
'STATE 6 o 288 82',
'STATE 6 e 26 42',
'STATE 6 # 42 415',
'STATE 3 r 42 416',
'STATE 6 # 29 68',
'STATE 6 a 418 417',
'STATE 4 t 420 419',
'STATE 2 t 100 421',
'STATE 4 d 42 422',
'STATE 3 u 42 423',
'STATE 2 i 42 424',
'STATE 6 a 426 425',
'STATE 2 a 26 427',
'STATE 3 g 68 42',
'STATE 1 u 68 428',
'STATE 4 y 42 429',
'STATE 3 m 42 430',
'STATE 4 w 82 431',
'STATE 3 u 42 432',
'STATE 4 w 82 433',
'STATE 1 0 42 434',
'STATE 1 l 29 435',
'STATE 3 n 437 436',
'STATE 3 d 42 438',
'STATE 6 o 42 439',
'STATE 2 l 247 440',
'STATE 6 n 68 42',
'STATE 6 n 442 441',
'STATE 1 a 444 443',
'STATE 5 s 68 28',
'STATE 5 t 445 28',
'STATE 1 h 28 68',
'STATE 4 f 68 446',
'STATE 2 s 28 447',
'STATE 6 t 82 448',
'STATE 3 n 82 449',
'STATE 6 t 450 82',
'STATE 5 s 452 451',
'STATE 5 b 63 453',
'STATE 6 t 455 454',
'STATE 5 l 457 456',
'STATE 3 l 82 458',
'STATE 1 0 460 459',
'STATE 1 # 111 107',
'STATE 4 u 105 461',
'STATE 3 a 230 462',
'STATE 2 t 463 68',
'STATE 1 n 465 464',
'STATE 4 o 28 466',
'STATE 4 t 28 467',
'STATE 2 r 28 468',
'STATE 1 e 42 469',
'STATE 6 e 471 470',
'STATE 5 a 473 472',
'STATE 3 p 29 474',
'STATE 2 c 476 475',
'STATE 2 r 100 26',
'STATE 3 v 29 477',
'STATE 3 c 26 478',
'STATE 1 i 26 479',
'STATE 2 a 28 100',
'STATE 3 l 29 26',
'STATE 2 s 26 480',
'STATE 3 h 482 481',
'STATE 6 s 230 28',
'STATE 3 m 100 26',
'STATE 6 s 230 483',
'STATE 3 c 26 484',
'STATE 6 l 230 485',
'STATE 6 b 100 486',
'STATE 6 m 26 28',
'STATE 3 n 230 487',
'STATE 3 g 100 488',
'STATE 6 o 230 29',
'STATE 3 p 29 100',
'STATE 5 t 28 29',
'STATE 5 r 28 489',
'STATE 6 # 126 28',
'STATE 1 0 491 490',
'STATE 4 b 493 492',
'STATE 4 t 495 494',
'STATE 4 l 497 496',
'STATE 5 a 68 498',
'STATE 5 a 500 499',
'STATE 5 a 502 501',
'STATE 6 r 68 503',
'STATE 3 k 29 68',
'STATE 5 t 505 504',
'STATE 1 # 42 72',
'STATE 3 p 42 28',
'STATE 6 v 507 506',
'STATE 2 # 509 508',
'STATE 3 o 28 510',
'STATE 1 0 512 511',
'STATE 3 n 29 513',
'STATE 4 v 42 514',
'STATE 1 i 515 42',
'STATE 1 e 100 516',
'STATE 5 s 518 517',
'STATE 3 m 42 519',
'STATE 3 m 42 520',
'STATE 1 0 42 521',
'STATE 2 # 523 522',
'STATE 2 # 525 524',
'STATE 4 l 527 526',
'STATE 1 t 529 528',
'STATE 4 x 100 530',
'STATE 2 i 532 531',
'STATE 4 l 29 533',
'STATE 3 r 535 534',
'STATE 2 e 42 536',
'STATE 1 c 42 537',
'STATE 2 s 539 538',
'STATE 3 l 72 540',
'STATE 3 h 100 541',
'STATE 3 h 42 100',
'STATE 4 d 28 542',
'STATE 4 t 68 28',
'STATE 1 b 28 100',
'STATE 5 l 100 543',
'STATE 6 h 105 544',
'STATE 3 h 63 545',
'STATE 3 b 63 546',
'STATE 3 f 82 107',
'STATE 5 t 547 82',
'STATE 2 k 63 82',
'STATE 2 k 63 548',
'STATE 5 r 82 549',
'STATE 5 s 82 498',
'STATE 3 g 551 550',
'STATE 6 i 82 552',
'STATE 6 e 105 82',
'STATE 2 c 82 553',
'STATE 6 u 82 554',
'STATE 4 i 556 555',
'STATE 3 v 558 557',
'STATE 1 n 29 82',
'STATE 2 s 560 559',
'STATE 3 h 562 561',
'STATE 3 i 68 563',
'STATE 1 e 68 564',
'STATE 1 a 68 565',
'STATE 1 t 42 566',
'STATE 3 l 568 567',
'STATE 3 b 569 29',
'STATE 5 o 571 570',
'STATE 6 # 29 572',
'STATE 3 c 29 573',
'STATE 3 h 100 574',
'STATE 6 i 100 575',
'STATE 3 p 26 576',
'STATE 3 f 26 577',
'STATE 3 l 579 578',
'STATE 2 u 26 580',
'STATE 5 k 29 581',
'STATE 6 o 582 29',
'STATE 6 u 28 583',
'STATE 3 k 26 100',
'STATE 6 # 26 584',
'STATE 6 e 26 585',
'STATE 6 c 230 586',
'STATE 6 # 29 587',
'STATE 2 l 589 588',
'STATE 3 o 591 590',
'STATE 4 l 593 592',
'STATE 6 y 595 594',
'STATE 6 i 100 596',
'STATE 6 s 598 597',
'STATE 6 r 600 599',
'STATE 2 t 602 601',
'STATE 2 s 604 603',
'STATE 5 c 29 82',
'STATE 5 o 606 605',
'STATE 6 # 608 607',
'STATE 5 o 610 609',
'STATE 6 # 29 611',
'STATE 5 h 82 612',
'STATE 4 c 614 613',
'STATE 4 s 42 29',
'STATE 6 e 616 615',
'STATE 4 t 618 617',
'STATE 4 z 29 619',
'STATE 3 r 42 620',
'STATE 4 g 622 621',
'STATE 3 u 623 42',
'STATE 3 l 230 42',
'STATE 4 z 100 624',
'STATE 2 # 230 29',
'STATE 2 r 625 42',
'STATE 1 d 100 42',
'STATE 5 a 28 626',
'STATE 6 t 29 627',
'STATE 1 # 42 628',
'STATE 3 l 629 42',
'STATE 6 t 68 630',
'STATE 1 # 632 631',
'STATE 6 k 634 633',
'STATE 1 # 42 635',
'STATE 3 t 42 636',
'STATE 4 n 638 637',
'STATE 1 0 640 639',
'STATE 3 g 642 641',
'STATE 3 m 68 42',
'STATE 1 0 644 643',
'STATE 3 a 29 645',
'STATE 4 l 29 42',
'STATE 4 c 29 646',
'STATE 3 l 42 647',
'STATE 2 a 68 648',
'STATE 1 i 68 649',
'STATE 3 m 68 650',
'STATE 1 e 652 651',
'STATE 3 s 331 42',
'STATE 3 r 29 653',
'STATE 3 p 100 42',
'STATE 6 o 28 654',
'STATE 6 g 68 655',
'STATE 2 e 657 656',
'STATE 3 r 63 82',
'STATE 5 s 659 658',
'STATE 2 t 63 82',
'STATE 3 r 82 63',
'STATE 5 b 82 660',
'STATE 3 s 662 661',
'STATE 5 c 63 663',
'STATE 6 t 82 664',
'STATE 1 o 154 665',
'STATE 6 m 230 82',
'STATE 4 o 667 666',
'STATE 2 a 29 28',
'STATE 3 j 230 68',
'STATE 2 i 230 68',
'STATE 3 h 669 668',
'STATE 3 s 68 670',
'STATE 3 g 672 671',
'PHONE ae',
'STATE 3 u 29 673',
'STATE 4 m 28 674',
'STATE 1 e 28 68',
'STATE 2 o 42 675',
'STATE 3 p 677 676',
'STATE 2 u 28 678',
'STATE 1 e 230 29',
'STATE 2 s 680 679',
'STATE 3 h 26 29',
'STATE 3 h 682 681',
'STATE 2 g 28 683',
'STATE 6 # 100 684',
'STATE 6 e 26 100',
'STATE 1 # 686 685',
'STATE 1 # 26 687',
'STATE 6 e 26 688',
'STATE 6 t 26 689',
'STATE 3 i 28 690',
'STATE 6 s 29 691',
'STATE 5 b 29 692',
'STATE 3 m 28 693',
'STATE 3 l 28 694',
'STATE 6 c 100 695',
'STATE 3 c 100 696',
'STATE 6 e 698 697',
'STATE 1 n 28 699',
'STATE 1 c 126 700',
'STATE 4 n 702 701',
'STATE 5 t 704 703',
'STATE 4 e 28 705',
'STATE 5 a 707 706',
'STATE 4 l 709 708',
'STATE 3 c 28 68',
'STATE 1 0 42 68',
'STATE 4 g 711 710',
'STATE 4 g 230 712',
'STATE 2 e 68 713',
'STATE 1 d 42 714',
'STATE 4 a 28 715',
'STATE 5 s 717 716',
'STATE 6 # 719 718',
'STATE 3 t 82 720',
'STATE 4 a 28 721',
'STATE 6 # 29 722',
'STATE 3 v 724 723',
'STATE 4 n 100 29',
'STATE 5 m 726 725',
'STATE 6 # 29 727',
'STATE 3 b 100 728',
'STATE 3 p 729 82',
'STATE 4 a 28 730',
'STATE 5 h 82 100',
'STATE 6 c 732 731',
'STATE 4 n 734 733',
'STATE 4 s 42 735',
'STATE 2 r 68 736',
'STATE 3 t 738 737',
'STATE 3 m 740 739',
'STATE 4 w 82 741',
'STATE 2 i 100 742',
'PHONE w-ey1',
'STATE 1 o 42 743',
'STATE 3 m 42 100',
'STATE 6 s 42 744',
'STATE 3 m 42 745',
'STATE 3 r 42 28',
'STATE 2 p 42 746',
'STATE 1 o 42 747',
'STATE 1 0 749 748',
'STATE 6 r 751 750',
'STATE 3 v 753 752',
'STATE 4 c 29 754',
'STATE 6 n 42 755',
'STATE 3 l 42 756',
'STATE 4 x 100 757',
'STATE 2 0 100 758',
'STATE 2 o 29 759',
'STATE 2 # 42 230',
'STATE 2 c 42 760',
'STATE 2 e 68 42',
'STATE 4 l 68 761',
'STATE 3 m 100 762',
'STATE 1 # 42 763',
'STATE 4 d 42 740',
'STATE 3 i 765 764',
'STATE 2 u 68 766',
'STATE 1 t 68 42',
'STATE 1 t 42 767',
'STATE 2 e 247 768',
'STATE 3 g 42 247',
'STATE 3 n 68 247',
'STATE 5 h 28 769',
'STATE 6 u 68 28',
'STATE 2 t 105 770',
'STATE 6 e 771 82',
'STATE 3 h 107 772',
'STATE 3 h 63 105',
'STATE 6 i 63 773',
'STATE 6 # 82 774',
'STATE 5 t 154 82',
'STATE 5 d 111 775',
'STATE 6 e 82 776',
'STATE 2 a 154 777',
'STATE 4 e 628 778',
'STATE 2 a 28 105',
'STATE 3 w 780 779',
'STATE 1 l 562 781',
'STATE 3 t 100 782',
'STATE 2 a 100 68',
'STATE 2 i 68 562',
'STATE 3 h 100 783',
'STATE 1 # 28 784',
'STATE 3 l 786 785',
'STATE 5 k 788 787',
'STATE 5 a 790 789',
'STATE 2 c 28 791',
'STATE 3 h 29 792',
'STATE 3 c 793 29',
'STATE 2 g 26 28',
'STATE 6 c 26 28',
'STATE 6 y 29 794',
'STATE 2 a 795 29',
'STATE 1 e 26 796',
'STATE 3 h 26 797',
'STATE 3 m 26 798',
'STATE 6 u 26 799',
'STATE 1 # 26 28',
'STATE 1 a 28 800',
'STATE 5 c 802 801',
'STATE 5 p 230 29',
'STATE 3 l 100 803',
'STATE 3 p 804 26',
'STATE 3 c 230 805',
'STATE 3 t 230 806',
'STATE 3 d 100 807',
'STATE 3 f 26 808',
'STATE 2 t 28 809',
'STATE 1 # 126 28',
'STATE 5 a 811 810',
'STATE 5 g 813 812',
'STATE 4 n 68 28',
'STATE 2 c 28 100',
'STATE 4 n 815 814',
'STATE 5 t 817 816',
'STATE 6 r 68 818',
'STATE 4 h 820 819',
'STATE 6 # 822 821',
'STATE 2 a 824 823',
'STATE 6 n 100 68',
'STATE 1 o 100 825',
'STATE 2 u 68 826',
'STATE 2 t 42 827',
'STATE 3 i 829 828',
'STATE 5 a 230 830',
'STATE 6 o 100 831',
'STATE 5 t 82 832',
'STATE 5 a 29 833',
'STATE 3 m 82 834',
'STATE 4 e 836 835',
'STATE 6 r 838 837',
'STATE 6 n 840 839',
'STATE 4 c 72 841',
'STATE 5 d 843 842',
'STATE 6 a 100 844',
'STATE 6 s 68 845',
'STATE 6 s 29 846',
'STATE 5 l 230 82',
'STATE 5 g 100 847',
'STATE 6 t 849 848',
'STATE 4 t 100 850',
'STATE 1 0 852 851',
'STATE 1 0 853 68',
'STATE 4 l 68 230',
'STATE 2 e 68 854',
'STATE 4 n 856 855',
'STATE 4 l 858 857',
'STATE 3 d 42 859',
'STATE 4 n 42 29',
'STATE 4 y 42 860',
'STATE 1 0 100 247',
'STATE 4 c 42 861',
'STATE 6 n 42 862',
'STATE 3 n 42 863',
'STATE 6 e 42 68',
'STATE 6 i 42 864',
'STATE 3 o 28 865',
'STATE 4 m 867 866',
'STATE 2 s 869 868',
'STATE 3 o 28 870',
'STATE 6 l 872 871',
'STATE 4 l 873 562',
'STATE 4 s 29 100',
'STATE 3 b 42 68',
'STATE 3 b 42 100',
'STATE 4 j 68 874',
'STATE 2 e 68 875',
'STATE 1 # 68 876',
'STATE 3 l 878 877',
'STATE 4 h 68 879',
'STATE 4 l 100 880',
'STATE 4 c 882 881',
'STATE 2 e 42 883',
'STATE 2 c 42 884',
'STATE 1 t 68 885',
'STATE 1 d 42 886',
'STATE 3 p 42 887',
'STATE 1 u 28 888',
'STATE 1 r 29 889',
'STATE 3 l 105 82',
'STATE 3 r 63 771',
'STATE 5 s 63 890',
'STATE 5 m 63 891',
'STATE 5 t 82 63',
'STATE 6 # 82 892',
'STATE 2 r 154 82',
'STATE 4 k 894 893',
'STATE 3 g 68 895',
'STATE 2 o 68 896',
'STATE 1 u 68 897',
'STATE 3 c 100 68',
'STATE 3 w 29 898',
'STATE 4 f 28 899',
'STATE 1 u 901 900',
'STATE 1 i 42 902',
'STATE 5 a 904 903',
'STATE 3 m 29 905',
'STATE 2 p 28 906',
'STATE 6 g 26 28',
'STATE 1 o 28 907',
'STATE 3 u 29 908',
'STATE 6 e 29 909',
'STATE 1 n 29 910',
'STATE 3 v 28 230',
'STATE 6 s 29 28',
'STATE 3 l 26 911',
'STATE 2 s 26 29',
'STATE 6 l 26 912',
'STATE 2 a 28 913',
'STATE 6 a 915 914',
'STATE 3 m 917 916',
'STATE 6 t 100 918',
'STATE 6 n 28 26',
'STATE 6 m 28 919',
'STATE 6 h 100 920',
'STATE 3 p 26 921',
'STATE 3 c 230 922',
'STATE 6 n 126 923',
'STATE 4 l 925 924',
'STATE 6 # 927 926',
'STATE 6 # 929 928',
'STATE 6 e 931 930',
'STATE 4 a 28 932',
'STATE 5 y 26 933',
'STATE 5 d 935 934',
'STATE 6 e 82 936',
'STATE 6 n 230 937',
'STATE 4 e 939 938',
'STATE 6 # 940 29',
'STATE 6 s 82 941',
'STATE 3 b 82 942',
'STATE 1 0 944 943',
'STATE 1 p 68 945',
'STATE 4 p 68 946',
'STATE 2 o 68 947',
'STATE 2 i 949 948',
'STATE 4 e 951 950',
'STATE 2 d 953 952',
'STATE 5 o 29 954',
'STATE 6 l 562 955',
'STATE 3 n 68 956',
'STATE 5 l 82 68',
'STATE 5 a 29 957',
'STATE 4 h 959 958',
'STATE 3 m 28 960',
'STATE 6 s 962 961',
'STATE 4 n 100 963',
'STATE 6 s 965 964',
'STATE 3 p 230 966',
'STATE 4 n 562 100',
'STATE 5 v 968 967',
'STATE 6 a 230 969',
'STATE 3 c 29 970',
'STATE 6 m 230 971',
'STATE 3 t 230 972',
'STATE 6 # 29 973',
'STATE 1 0 975 974',
'STATE 2 q 29 976',
'STATE 4 s 756 977',
'STATE 1 # 979 978',
'STATE 4 v 42 980',
'STATE 3 d 100 562',
'STATE 1 c 68 981',
'STATE 2 o 29 982',
'STATE 3 m 42 983',
'STATE 2 s 29 42',
'STATE 1 r 100 29',
'STATE 3 f 230 984',
'STATE 4 k 42 985',
'STATE 2 e 42 986',
'STATE 3 b 28 987',
'STATE 3 c 42 988',
'STATE 2 t 42 989',
'STATE 4 i 28 990',
'STATE 4 d 100 991',
'STATE 6 l 68 992',
'STATE 3 r 994 993',
'STATE 3 p 42 995',
'STATE 3 x 100 996',
'STATE 3 m 998 997',
'STATE 3 l 1000 999',
'STATE 6 r 68 100',
'STATE 3 r 42 1001',
'STATE 3 r 42 1002',
'STATE 2 n 68 29',
'STATE 2 i 529 42',
'STATE 1 m 42 1003',
'STATE 4 m 1005 1004',
'STATE 2 # 42 68',
'STATE 3 d 42 1006',
'STATE 2 p 42 1007',
'STATE 1 l 72 1008',
'STATE 1 e 68 42',
'STATE 1 d 68 42',
'STATE 3 n 42 1009',
'STATE 3 r 1011 1010',
'STATE 2 n 1012 28',
'STATE 5 d 82 1013',
'STATE 6 e 63 82',
'STATE 6 u 29 1014',
'STATE 6 k 82 1015',
'STATE 4 h 1017 1016',
'STATE 3 i 562 1018',
'STATE 3 f 100 1019',
'STATE 2 e 68 230',
'STATE 1 e 68 1020',
'STATE 2 o 68 1021',
'STATE 4 l 28 1022',
'STATE 2 r 42 1023',
'STATE 2 r 28 42',
'STATE 1 a 72 42',
'STATE 5 o 1025 1024',
'STATE 6 # 29 1026',
'STATE 2 m 29 230',
'STATE 5 o 28 1027',
'STATE 6 o 29 1028',
'STATE 3 l 29 1029',
'STATE 6 i 230 29',
'STATE 2 i 230 1030',
'STATE 6 d 26 28',
'STATE 6 t 1032 1031',
'STATE 1 u 28 1033',
'STATE 6 o 1035 1034',
'STATE 5 j 29 1036',
'STATE 3 s 230 909',
'STATE 6 e 230 1037',
'STATE 3 g 230 1038',
'STATE 6 z 28 1039',
'STATE 3 s 26 1040',
'STATE 6 u 230 1041',
'STATE 3 b 100 29',
'STATE 6 # 1042 126',
'STATE 4 a 28 1043',
'STATE 5 s 1045 1044',
'STATE 6 b 1047 1046',
'STATE 4 h 230 29',
'STATE 5 c 1049 1048',
'STATE 5 a 1051 1050',
'STATE 6 # 100 1052',
'STATE 3 l 100 1053',
'STATE 4 m 1055 1054',
'STATE 5 t 1057 1056',
'STATE 5 m 1059 1058',
'STATE 6 e 82 1060',
'STATE 6 a 82 1061',
'STATE 6 m 100 68',
'STATE 4 w 82 1062',
'STATE 2 c 68 1063',
'STATE 2 r 230 1064',
'STATE 2 h 82 1065',
'STATE 3 f 82 1066',
'STATE 4 b 1068 1067',
'STATE 6 i 1070 1069',
'STATE 6 t 230 1071',
'STATE 4 d 29 1072',
'STATE 1 o 68 1073',
'STATE 3 l 1075 1074',
'STATE 1 p 68 1076',
'STATE 3 w 1078 1077',
'STATE 3 r 28 1079',
'STATE 2 c 82 1080',
'STATE 6 n 1082 1081',
'STATE 4 c 1084 1083',
'STATE 6 c 562 1085',
'STATE 6 n 68 1086',
'STATE 3 c 1088 1087',
'STATE 4 n 1090 1089',
'STATE 6 a 1092 1091',
'STATE 3 h 28 1093',
'STATE 6 o 1095 1094',
'STATE 4 n 1097 1096',
'STATE 3 f 42 1098',
'STATE 4 t 1100 1099',
'STATE 4 n 100 1101',
'STATE 4 v 68 1102',
'STATE 6 e 1104 1103',
'STATE 3 m 29 1105',
'STATE 3 v 230 1106',
'STATE 3 b 29 1107',
'STATE 3 s 68 1108',
'STATE 3 s 100 1109',
'STATE 4 n 29 1110',
'STATE 6 u 42 1111',
'STATE 6 s 1113 1112',
'STATE 4 d 68 1114',
'STATE 2 t 68 1115',
'STATE 4 t 42 1116',
'STATE 4 z 42 193',
'STATE 4 l 1118 1117',
'STATE 2 i 1120 1119',
'STATE 2 s 29 1121',
'STATE 2 l 42 1122',
'STATE 4 n 29 100',
'STATE 1 # 1124 1123',
'STATE 2 b 29 1125',
'STATE 3 n 42 1126',
'STATE 1 0 1127 42',
'STATE 2 r 42 68',
'STATE 6 z 29 1128',
'STATE 4 n 100 1129',
'STATE 6 n 68 873',
'STATE 6 n 1131 1130',
'STATE 6 l 1133 1132',
'STATE 4 d 100 1134',
'STATE 2 d 42 1135',
'STATE 6 t 1137 1136',
'STATE 6 y 42 1138',
'STATE 3 h 1140 1139',
'STATE 4 b 42 68',
'STATE 2 # 1142 1141',
'STATE 1 0 42 1143',
'STATE 1 c 68 42',
'STATE 4 d 42 1144',
'STATE 1 # 42 68',
'STATE 4 l 1146 1145',
'STATE 2 s 42 1147',
'STATE 3 g 1148 42',
'STATE 3 g 42 1149',
'STATE 6 l 68 1150',
'STATE 2 t 42 1151',
'STATE 4 l 68 28',
'STATE 5 r 82 1152',
'STATE 6 i 82 1153',
'STATE 6 l 82 1154',
'STATE 4 m 1156 1155',
'STATE 2 r 1157 68',
'STATE 2 c 1159 1158',
'STATE 3 l 68 1160',
'STATE 2 t 68 1161',
'STATE 2 a 68 1162',
'STATE 2 r 68 28',
'STATE 3 s 28 1163',
'STATE 6 # 1165 1164',
'STATE 6 # 1166 28',
'STATE 3 h 1168 1167',
'STATE 1 e 28 1169',
'STATE 5 # 28 1170',
'STATE 3 i 28 1171',
'STATE 1 s 29 1172',
'STATE 1 m 29 1173',
'STATE 1 a 28 26',
'STATE 3 t 28 1174',
'STATE 5 q 1176 1175',
'STATE 5 t 1178 1177',
'STATE 3 f 29 1179',
'STATE 6 i 29 1180',
'STATE 6 c 28 1181',
'STATE 2 # 1182 100',
'STATE 3 k 26 1183',
'STATE 3 c 1185 1184',
'STATE 5 y 126 28',
'STATE 4 w 1187 1186',
'STATE 3 w 1189 1188',
'STATE 6 k 29 68',
'STATE 3 b 711 1190',
'STATE 3 l 100 42',
'STATE 6 s 1192 1191',
'STATE 6 e 1194 1193',
'STATE 5 k 100 1195',
'STATE 2 u 29 1196',
'STATE 6 i 42 1197',
'STATE 3 r 1198 42',
'STATE 5 r 1200 1199',
'STATE 5 a 1202 1201',
'STATE 5 n 1204 1203',
'STATE 6 o 100 1205',
'STATE 5 u 68 1206',
'STATE 6 o 29 230',
'STATE 6 r 82 29',
'STATE 6 o 100 1207',
'STATE 4 o 28 1208',
'STATE 1 a 133 42',
'STATE 2 n 29 1209',
'STATE 2 s 1211 1210',
'STATE 3 c 82 1212',
'STATE 3 h 1214 1213',
'STATE 1 b 42 1215',
'STATE 6 r 1217 1216',
'STATE 4 l 230 68',
'STATE 4 m 68 1218',
'STATE 4 n 29 68',
'STATE 2 a 68 937',
'STATE 1 n 42 1219',
'STATE 1 g 72 42',
'STATE 3 c 42 1220',
'STATE 2 a 1222 1221',
'STATE 5 g 100 1223',
'STATE 2 s 42 28',
'STATE 2 g 1225 1224',
'STATE 4 g 68 1226',
'STATE 4 m 68 100',
'STATE 3 h 100 1227',
'STATE 5 k 100 1228',
'STATE 6 a 100 1229',
'STATE 3 h 100 1230',
'STATE 5 l 1231 29',
'STATE 5 p 100 1232',
'STATE 3 o 28 1233',
'STATE 5 g 1235 1234',
'STATE 6 e 29 1236',
'STATE 5 r 28 29',
'STATE 5 n 28 1237',
'STATE 6 n 1239 1238',
'STATE 4 b 562 1240',
'STATE 3 l 68 29',
'STATE 3 j 68 562',
'STATE 4 b 1242 1241',
'STATE 4 n 1244 1243',
'STATE 3 d 42 1245',
'STATE 4 t 68 29',
'STATE 4 h 68 1246',
'STATE 6 # 82 1247',
'STATE 5 t 82 1248',
'STATE 6 o 29 1249',
'STATE 6 o 1251 1250',
'STATE 6 e 230 1252',
'STATE 6 g 100 1253',
'STATE 6 y 68 1254',
'STATE 5 m 82 1255',
'STATE 1 # 1257 1256',
'STATE 6 k 608 1258',
'STATE 4 o 28 1259',
'STATE 3 b 68 1260',
'STATE 4 n 100 1261',
'STATE 3 v 230 68',
'STATE 2 # 1262 100',
'STATE 2 # 230 42',
'STATE 3 l 42 1263',
'STATE 3 t 42 68',
'STATE 2 g 1265 1264',
'STATE 1 # 29 1266',
'STATE 2 # 1268 1267',
'STATE 3 t 29 1269',
'STATE 4 s 29 42',
'STATE 5 c 42 1270',
'STATE 3 d 42 1271',
'STATE 6 o 1273 1272',
'STATE 4 b 1275 1274',
'STATE 4 t 1277 1276',
'STATE 2 p 230 1278',
'STATE 2 g 42 1279',
'STATE 4 v 1280 100',
'STATE 3 h 42 1281',
'STATE 2 f 42 1282',
'STATE 6 i 68 1283',
'STATE 4 n 68 1284',
'STATE 4 t 68 1285',
'STATE 4 n 1287 1286',
'STATE 4 z 42 100',
'STATE 4 k 42 1288',
'STATE 3 t 100 42',
'STATE 3 l 42 271',
'STATE 4 y 42 1289',
'STATE 3 g 42 1290',
'STATE 1 e 42 1291',
'STATE 3 f 42 1096',
'STATE 2 n 72 42',
'STATE 3 c 42 68',
'STATE 1 i 247 1292',
'STATE 1 o 247 331',
'STATE 2 a 29 82',
'STATE 3 f 1294 1293',
'STATE 6 s 82 1295',
'STATE 4 a 28 1296',
'STATE 2 g 100 1297',
'STATE 1 a 68 29',
'STATE 3 y 562 1298',
'STATE 3 h 68 562',
'STATE 3 n 68 1299',
'STATE 2 o 230 1300',
'STATE 2 i 29 1301',
'STATE 2 s 42 72',
'STATE 5 # 1303 1302',
'STATE 3 y 29 1304',
'STATE 2 i 230 29',
'STATE 1 d 28 1305',
'STATE 1 s 100 28',
'STATE 6 # 28 1306',
'STATE 1 h 28 1307',
'STATE 2 a 1308 29',
'STATE 2 e 230 1309',
'STATE 3 u 230 1310',
'STATE 1 e 26 28',
'STATE 6 i 1312 1311',
'STATE 3 m 29 230',
'STATE 5 d 1314 1313',
'STATE 3 m 230 1315',
'STATE 5 t 230 1316',
'STATE 6 h 29 400',
'STATE 6 m 28 1317',
'STATE 6 n 1319 1318',
'STATE 6 l 230 1320',
'STATE 3 f 29 1321',
'STATE 6 a 230 100',
'STATE 5 t 1323 1322',
'STATE 6 k 29 82',
'STATE 6 # 1325 1324',
'STATE 5 k 1327 1326',
'STATE 6 y 68 1328',
'STATE 3 w 1330 1329',
'STATE 5 t 68 1331',
'STATE 6 y 68 1332',
'STATE 2 f 230 1333',
'STATE 5 d 1335 1334',
'STATE 1 t 29 1336',
'STATE 6 l 100 1337',
'STATE 1 a 42 1338',
'STATE 4 w 1340 1339',
'STATE 6 o 100 1341',
'STATE 5 u 68 1342',
'STATE 6 n 68 1343',
'STATE 6 l 100 1344',
'STATE 6 o 68 100',
'STATE 6 a 562 100',
'STATE 5 p 100 1345',
'STATE 6 i 29 100',
'STATE 4 g 1347 1346',
'STATE 3 d 29 230',
'STATE 3 w 82 1348',
'STATE 1 n 82 1349',
'STATE 2 e 1351 1350',
'STATE 4 v 1353 1352',
'STATE 2 s 100 1354',
'STATE 1 o 100 68',
'STATE 6 u 68 1355',
'STATE 4 m 100 1226',
'STATE 6 g 68 1356',
'STATE 3 i 42 1357',
'STATE 3 t 42 1358',
'STATE 3 u 1360 1359',
'STATE 3 v 29 1361',
'STATE 5 k 82 29',
'STATE 4 n 1363 1362',
'STATE 6 a 68 1364',
'STATE 4 n 100 68',
'STATE 3 r 100 29',
'STATE 5 t 100 1365',
'STATE 6 m 562 1366',
'STATE 6 e 29 1367',
'STATE 3 h 100 29',
'STATE 5 l 100 82',
'STATE 4 o 1369 1368',
'STATE 3 v 1371 1370',
'STATE 6 e 1373 1372',
'STATE 5 l 29 1374',
'STATE 5 t 28 1375',
'STATE 4 k 68 1376',
'STATE 4 x 100 1377',
'STATE 4 h 29 68',
'STATE 3 l 230 1378',
'STATE 3 l 42 100',
'STATE 4 k 1380 1379',
'STATE 3 m 100 1381',
'STATE 3 f 42 1382',
'STATE 4 p 68 1383',
'STATE 5 u 1385 1384',
'STATE 5 k 82 1386',
'STATE 3 s 1388 1387',
'STATE 6 e 1389 82',
'STATE 3 b 230 29',
'STATE 6 o 100 1390',
'STATE 6 r 100 1391',
'STATE 3 c 68 1392',
'STATE 5 r 29 1393',
'STATE 6 s 1395 1394',
'STATE 2 q 29 1396',
'STATE 6 m 1398 1397',
'STATE 4 n 100 1399',
'STATE 4 l 1401 1400',
'STATE 4 l 1403 1402',
'STATE 4 t 42 1404',
'STATE 3 n 42 68',
'STATE 4 l 1405 42',
'STATE 4 c 42 100',
'STATE 1 o 42 100',
'STATE 4 m 1407 1406',
'STATE 3 m 1409 1408',
'STATE 3 x 100 1410',
'STATE 1 t 42 1411',
'STATE 3 r 42 1412',
'STATE 4 m 1414 1413',
'STATE 2 n 100 42',
'STATE 6 l 230 1415',
'STATE 6 r 100 1416',
'STATE 3 i 68 1417',
'STATE 6 a 562 1418',
'STATE 4 m 68 42',
'STATE 2 t 42 1419',
'STATE 2 t 100 42',
'STATE 6 n 100 42',
'STATE 4 t 42 1420',
'STATE 6 y 1422 1421',
'STATE 4 m 100 1423',
'STATE 4 n 68 100',
'STATE 3 m 1425 1424',
'STATE 3 p 100 68',
'STATE 4 d 42 1426',
'STATE 1 r 68 42',
'STATE 4 k 42 1427',
'STATE 3 g 29 1428',
'STATE 3 l 29 1429',
'STATE 6 h 82 1430',
'STATE 5 s 82 63',
'STATE 3 p 82 63',
'STATE 4 z 230 1431',
'STATE 3 h 671 1432',
'STATE 1 t 230 1433',
'STATE 3 y 68 1434',
'STATE 2 g 68 1435',
'STATE 2 e 68 1436',
'STATE 6 s 1438 1437',
'STATE 3 g 28 1439',
'STATE 3 c 29 1440',
'STATE 1 m 29 1441',
'STATE 5 # 28 29',
'STATE 2 l 28 1442',
'STATE 5 # 29 28',
'STATE 1 t 29 1443',
'STATE 1 a 28 1444',
'STATE 6 e 1445 29',
'STATE 5 t 29 1446',
'STATE 3 k 29 1447',
'STATE 3 c 230 29',
'STATE 3 c 230 1251',
'STATE 3 k 29 1448',
'STATE 3 b 1450 1449',
'STATE 3 p 28 1451',
'STATE 3 m 28 26',
'STATE 3 h 28 1452',
'STATE 3 b 1453 29',
'STATE 3 b 1455 1454',
'STATE 4 t 1457 1456',
'STATE 5 d 1459 1458',
'STATE 5 d 68 1460',
'STATE 5 d 1461 68',
'STATE 6 # 29 82',
'STATE 1 r 68 1462',
'STATE 5 a 1464 1463',
'STATE 5 d 29 82',
'STATE 5 d 1466 1465',
'STATE 6 i 1468 1467',
'STATE 3 h 100 1469',
'STATE 3 m 68 1470',
'STATE 3 l 1472 1471',
'STATE 3 t 100 1473',
'STATE 6 u 100 1474',
'STATE 2 t 42 72',
'STATE 5 a 1476 1475',
'STATE 5 a 68 29',
'STATE 6 i 1478 1477',
'STATE 6 r 100 1479',
'STATE 6 z 100 1480',
'STATE 5 g 1482 1481',
'STATE 6 i 1484 1483',
'STATE 4 c 68 1485',
'STATE 3 t 562 1486',
'STATE 3 c 82 1487',
'STATE 1 y 68 29',
'STATE 3 d 68 1488',
'STATE 3 r 82 1489',
'STATE 3 r 1491 1490',
'STATE 6 r 42 230',
'STATE 2 c 28 68',
'STATE 6 l 1493 1492',
'STATE 6 m 68 1070',
'STATE 2 o 1495 1494',
'STATE 1 t 1496 42',
'STATE 2 u 1498 1497',
'STATE 6 r 230 1499',
'STATE 5 o 331 1500',
'STATE 2 v 68 1501',
'STATE 5 c 230 29',
'STATE 4 c 68 1502',
'STATE 6 e 42 100',
'STATE 6 p 562 1503',
'STATE 6 a 100 1504',
'STATE 6 e 1506 1505',
'STATE 6 i 1507 230',
'STATE 3 i 68 1508',
'STATE 5 d 100 1509',
'STATE 6 i 1511 1510',
'STATE 3 t 100 1512',
'STATE 5 r 29 1513',
'STATE 3 b 28 1514',
'STATE 3 c 1516 1515',
'STATE 3 l 1518 1517',
'STATE 4 p 230 1519',
'STATE 6 l 1521 1520',
'STATE 3 n 230 1522',
'STATE 3 c 68 1523',
'STATE 3 c 100 1524',
'STATE 3 b 42 1525',
'STATE 3 m 1527 1526',
'STATE 3 v 562 1528',
'STATE 3 b 1530 1529',
'STATE 6 e 100 1531',
'STATE 6 a 100 1532',
'STATE 3 b 230 82',
'STATE 6 i 82 100',
'STATE 3 m 100 1533',
'STATE 3 k 100 1534',
'STATE 4 h 29 1535',
'STATE 4 b 1537 1536',
'STATE 4 l 68 1538',
'STATE 3 t 1540 1539',
'STATE 6 f 100 1541',
'STATE 3 m 100 1542',
'STATE 4 l 100 1543',
'STATE 4 c 100 1544',
'STATE 1 0 68 1545',
'STATE 3 r 100 1546',
'STATE 1 0 68 100',
'STATE 4 m 42 1547',
'STATE 2 a 29 42',
'STATE 3 r 1549 1548',
'STATE 1 o 100 1550',
'STATE 3 j 68 1551',
'STATE 4 c 100 1552',
'STATE 2 c 1554 1553',
'STATE 6 h 42 1555',
'STATE 6 e 28 42',
'STATE 6 r 1557 1556',
'STATE 6 n 68 1558',
'STATE 6 x 68 1559',
'STATE 6 l 100 68',
'STATE 6 t 100 1560',
'STATE 2 a 68 29',
'STATE 2 c 42 1561',
'STATE 4 m 42 1562',
'STATE 4 p 42 1563',
'STATE 3 r 100 42',
'STATE 4 c 100 68',
'STATE 3 p 68 1564',
'STATE 4 d 100 68',
'STATE 1 # 42 1565',
'STATE 3 c 42 1566',
'STATE 3 v 42 1567',
'STATE 1 d 68 1568',
'STATE 5 t 1570 1569',
'STATE 4 x 1572 1571',
'STATE 3 r 100 1573',
'STATE 1 b 68 1574',
'STATE 3 a 29 1575',
'STATE 2 a 1576 68',
'STATE 3 y 68 100',
'STATE 6 z 28 1577',
'STATE 3 y 29 1578',
'STATE 2 s 1580 1579',
'STATE 5 z 230 1581',
'STATE 3 c 28 1582',
'STATE 5 d 29 1583',
'STATE 1 c 29 1584',
'STATE 3 p 26 1585',
'STATE 5 m 1587 1586',
'STATE 5 p 230 1588',
'STATE 3 g 29 1589',
'STATE 3 p 29 1590',
'STATE 3 c 28 26',
'STATE 6 n 100 28',
'STATE 6 o 230 26',
'STATE 3 m 28 1591',
'STATE 6 a 100 29',
'STATE 4 e 1593 1592',
'STATE 5 h 1595 1594',
'STATE 2 a 1597 1596',
'STATE 6 # 68 1598',
'STATE 5 y 68 1599',
'STATE 2 e 68 1600',
'STATE 5 t 82 1601',
'STATE 1 e 1603 1602',
'STATE 2 d 82 1604',
'STATE 5 s 1606 1605',
'STATE 3 m 100 1607',
'STATE 3 b 100 1608',
'STATE 1 r 100 1609',
'STATE 2 r 29 1610',
'STATE 1 f 100 68',
'STATE 1 f 100 1611',
'STATE 5 y 1613 1612',
'STATE 3 h 100 1614',
'STATE 2 l 68 1615',
'STATE 3 i 100 1616',
'STATE 6 o 100 29',
'STATE 5 u 1618 1617',
'STATE 6 l 230 1619',
'STATE 6 e 1621 1620',
'STATE 4 d 230 100',
'STATE 5 m 100 1622',
'STATE 6 l 68 1623',
'STATE 6 r 100 1624',
'STATE 6 e 100 1625',
'STATE 5 k 100 1626',
'STATE 5 b 230 1627',
'STATE 4 d 100 1628',
'STATE 6 i 29 68',
'STATE 1 p 68 1629',
'STATE 2 o 68 1630',
'STATE 3 w 68 82',
'STATE 4 n 1631 68',
'STATE 2 t 68 1632',
'STATE 4 v 100 1633',
'STATE 4 p 68 100',
'STATE 3 r 1634 1120',
'STATE 3 r 68 1289',
'STATE 3 g 42 68',
'STATE 5 a 1636 1635',
'STATE 3 n 68 100',
'STATE 4 d 29 1637',
'STATE 6 o 100 1638',
'STATE 4 s 100 1101',
'STATE 5 n 68 29',
'STATE 6 f 562 1639',
'STATE 6 s 29 1640',
'STATE 5 y 1642 1641',
'STATE 5 l 1644 1643',
'STATE 5 l 230 72',
'STATE 5 t 1646 1645',
'STATE 6 l 100 1647',
'STATE 6 a 1511 100',
'STATE 3 m 230 100',
'STATE 3 l 42 1648',
'STATE 6 i 29 1649',
'STATE 6 e 28 1650',
'STATE 3 i 29 1651',
'STATE 4 n 68 1493',
'STATE 4 n 100 1652',
'STATE 4 m 230 1653',
'STATE 3 c 68 529',
'STATE 6 r 1655 1654',
'STATE 3 m 100 1656',
'STATE 6 r 68 230',
'STATE 3 f 68 1657',
'STATE 3 n 230 1511',
'STATE 3 l 230 1658',
'STATE 5 t 1660 1659',
'STATE 6 i 100 1661',
'STATE 6 t 68 100',
'STATE 5 l 1663 1662',
'STATE 5 l 100 42',
'STATE 3 g 100 1185',
'STATE 6 i 100 230',
'STATE 6 n 68 100',
'STATE 6 d 100 1664',
'STATE 5 l 29 1665',
'STATE 2 q 29 1666',
'STATE 2 s 42 68',
'STATE 3 s 100 1667',
'STATE 6 k 29 1668',
'STATE 4 b 42 1669',
'STATE 3 w 230 1670',
'STATE 2 # 230 100',
'STATE 3 n 29 1671',
'STATE 2 a 68 1672',
'STATE 2 c 68 100',
'STATE 1 d 100 1673',
'STATE 3 m 100 1674',
'STATE 2 o 1676 1675',
'STATE 2 g 42 1677',
'STATE 1 e 100 68',
'STATE 4 n 42 1678',
'STATE 4 l 100 230',
'STATE 2 g 68 1679',
'STATE 4 v 42 100',
'STATE 2 c 42 1680',
'STATE 2 s 42 1681',
'STATE 4 t 273 1682',
'STATE 6 r 68 1683',
'STATE 4 v 1685 1684',
'STATE 3 n 100 1686',
'STATE 4 d 68 1687',
'STATE 2 t 1688 42',
'STATE 3 h 1690 1689',
'STATE 3 c 68 1691',
'STATE 1 e 42 1692',
'STATE 2 o 42 1693',
'STATE 2 e 42 1694',
'STATE 3 d 247 1695',
'STATE 3 t 63 1696',
'STATE 6 z 82 63',
'STATE 4 v 230 1697',
'STATE 3 n 562 1698',
'STATE 2 t 68 1699',
'STATE 2 r 68 1700',
'STATE 3 u 230 1701',
'STATE 1 r 562 68',
'STATE 2 a 1703 1702',
'STATE 3 z 28 1704',
'STATE 3 a 29 1705',
'STATE 3 s 28 29',
'STATE 3 a 29 1706',
'STATE 2 a 28 230',
'STATE 1 m 28 29',
'STATE 3 t 29 1707',
'STATE 2 s 26 1708',
'STATE 3 f 29 1709',
'STATE 3 p 29 1710',
'STATE 3 s 29 1711',
'STATE 3 t 29 1712',
'STATE 5 l 29 1713',
'STATE 6 n 28 1714',
'STATE 2 a 1716 1715',
'STATE 6 # 42 28',
'STATE 5 k 100 1717',
'STATE 4 c 1719 1718',
'STATE 4 c 1721 1720',
'STATE 1 h 68 100',
'STATE 2 a 29 1722',
'STATE 5 t 68 1723',
'STATE 3 n 29 1724',
'STATE 5 k 82 100',
'STATE 2 e 154 68',
'STATE 2 n 82 154',
'STATE 2 a 1726 1725',
'STATE 6 l 1728 1727',
'STATE 6 k 100 1729',
'STATE 6 r 230 1730',
'STATE 5 n 68 1731',
'STATE 2 s 100 1732',
'STATE 3 i 29 1733',
'STATE 2 d 1735 1734',
'STATE 3 i 68 1736',
'STATE 2 l 42 68',
'STATE 3 r 1738 1737',
'STATE 1 g 68 1739',
'STATE 1 i 29 100',
'STATE 5 h 1741 1740',
'STATE 4 b 68 1742',
'STATE 4 g 100 1743',
'STATE 6 a 68 1744',
'STATE 4 g 68 29',
'STATE 5 b 1745 100',
'STATE 6 s 68 1746',
'STATE 5 a 100 1747',
'STATE 6 o 562 100',
'STATE 6 e 1749 1748',
'STATE 5 v 230 100',
'STATE 4 t 100 1750',
'STATE 6 o 1752 1751',
'STATE 2 r 68 1753',
'STATE 6 v 100 1754',
'STATE 6 n 68 29',
'STATE 4 d 68 1755',
'STATE 2 e 42 68',
'STATE 5 o 1757 1756',
'STATE 6 # 608 1758',
'STATE 5 t 29 1759',
'STATE 4 p 100 1760',
'STATE 6 g 562 1761',
'STATE 6 i 100 68',
'STATE 5 u 1763 1762',
'STATE 6 # 42 1764',
'STATE 3 c 1766 1765',
'STATE 4 c 68 1767',
'STATE 5 u 1769 1768',
'STATE 3 s 1770 100',
'STATE 6 i 100 1771',
'STATE 3 d 42 625',
'STATE 5 u 100 1772',
'STATE 3 k 28 1773',
'STATE 3 z 68 1774',
'STATE 4 g 230 1775',
'STATE 4 f 100 230',
'STATE 3 c 1777 1776',
'STATE 4 d 42 1778',
'STATE 4 m 68 1779',
'STATE 3 p 100 1780',
'STATE 4 t 42 1781',
'STATE 5 k 1783 1782',
'STATE 3 s 82 1784',
'STATE 6 r 562 1785',
'STATE 3 f 82 1786',
'STATE 3 c 82 1787',
'STATE 6 m 100 1788',
'STATE 5 d 29 1789',
'STATE 6 m 1791 1790',
'STATE 4 k 29 1792',
'STATE 6 l 1794 1793',
'STATE 4 t 68 100',
'STATE 3 d 1796 1795',
'STATE 4 t 100 1797',
'STATE 3 h 100 1798',
'STATE 1 0 100 1799',
'STATE 4 p 42 100',
'STATE 4 d 512 1800',
'STATE 3 m 230 68',
'STATE 1 p 42 1801',
'STATE 3 r 1803 1802',
'STATE 2 h 68 1804',
'STATE 5 g 1806 1805',
'STATE 6 k 1808 1807',
'STATE 4 p 42 1809',
'STATE 2 a 68 1810',
'STATE 6 t 68 1811',
'STATE 6 n 230 100',
'STATE 3 c 68 1812',
'STATE 2 d 68 1813',
'STATE 4 v 100 42',
'STATE 6 e 100 1814',
'STATE 4 b 100 1815',
'STATE 3 g 68 1816',
'STATE 4 m 42 1817',
'STATE 1 o 42 1818',
'STATE 3 c 42 29',
'STATE 2 a 247 1819',
'STATE 3 h 773 1820',
'STATE 3 a 29 1821',
'STATE 3 r 562 100',
'STATE 3 d 68 1822',
'STATE 2 s 68 1823',
'STATE 2 t 1825 1824',
'STATE 6 l 28 1826',
'STATE 6 a 29 1827',
'STATE 1 r 29 28',
'STATE 3 n 1829 1828',
'STATE 5 d 1831 1830',
'STATE 2 l 29 1832',
'STATE 2 e 28 1833',
'STATE 3 l 29 1834',
'STATE 2 # 1314 230',
'STATE 3 d 29 1835',
'STATE 3 p 29 1836',
'STATE 3 v 230 1837',
'STATE 3 g 28 1838',
'STATE 5 y 1840 1839',
'STATE 4 o 28 1841',
'STATE 4 b 29 1842',
'STATE 6 # 68 29',
'STATE 1 e 1844 1843',
'STATE 6 e 100 1845',
'STATE 2 m 1846 100',
'STATE 6 a 29 100',
'STATE 5 v 29 1847',
'STATE 6 i 29 1059',
'STATE 2 i 1849 1848',
'STATE 6 n 1851 1850',
'STATE 2 c 1853 1852',
'STATE 5 t 1854 100',
'STATE 2 x 100 1855',
'STATE 6 n 100 1856',
'STATE 1 a 100 29',
'STATE 1 e 100 1857',
'STATE 1 n 100 1858',
'STATE 1 n 68 1859',
'STATE 3 v 100 68',
'STATE 5 t 1861 1860',
'STATE 3 i 68 1862',
'STATE 1 e 562 1863',
'STATE 1 c 68 1864',
'STATE 4 s 1866 1865',
'STATE 4 s 100 1867',
'STATE 6 l 68 1868',
'STATE 6 i 68 1869',
'STATE 6 u 230 68',
'STATE 6 i 562 1205',
'STATE 6 r 100 1870',
'STATE 5 c 1871 100',
'STATE 6 a 1873 1872',
'STATE 5 v 230 1874',
'STATE 4 p 68 1875',
'STATE 6 u 68 1876',
'STATE 2 e 29 1877',
'STATE 3 h 1879 1878',
'STATE 1 r 230 68',
'STATE 4 b 68 1880',
'STATE 3 a 29 1881',
'STATE 6 # 29 1882',
'STATE 4 h 28 1883',
'STATE 2 q 100 1884',
'STATE 4 c 100 1885',
'STATE 6 i 562 100',
'STATE 6 a 1887 1886',
'STATE 6 # 29 1888',
'STATE 4 t 29 1889',
'STATE 5 u 1891 1890',
'STATE 5 t 230 1892',
'STATE 4 b 42 1893',
'STATE 5 y 100 1894',
'STATE 6 s 42 1895',
'STATE 6 o 230 1185',
'STATE 5 n 562 1896',
'STATE 3 m 100 1897',
'STATE 6 # 28 42',
'STATE 6 b 100 1898',
'STATE 4 t 68 1899',
'STATE 4 j 68 1900',
'STATE 4 p 68 1901',
'STATE 3 c 230 1902',
'STATE 3 c 1904 1903',
'STATE 3 h 100 1905',
'STATE 3 c 42 1906',
'STATE 5 l 1908 1907',
'STATE 6 o 100 1909',
'STATE 6 o 29 1910',
'STATE 6 u 562 100',
'STATE 3 s 42 100',
'STATE 3 v 100 1911',
'STATE 3 m 68 1685',
'STATE 5 a 29 1912',
'STATE 6 l 1914 1913',
'STATE 2 a 68 28',
'STATE 2 r 68 1915',
'STATE 2 d 68 1916',
'STATE 3 r 1917 68',
'STATE 3 t 100 1918',
'STATE 6 d 42 68',
'STATE 3 l 100 1554',
'STATE 2 o 230 1919',
'STATE 4 v 100 29',
'STATE 4 l 68 1920',
'STATE 4 f 230 1921',
'STATE 3 k 1923 1922',
'STATE 4 b 68 42',
'STATE 3 r 42 1924',
'STATE 6 e 42 1925',
'STATE 3 d 42 28',
'STATE 6 l 1927 1926',
'STATE 4 c 68 1928',
'STATE 2 a 68 1929',
'STATE 3 h 68 100',
'STATE 4 l 68 1930',
'STATE 4 b 68 1931',
'STATE 2 b 100 29',
'STATE 4 c 1047 1932',
'STATE 6 r 100 1281',
'STATE 3 r 100 1933',
'STATE 4 s 68 42',
'STATE 2 p 42 1934',
'STATE 1 r 247 1935',
'STATE 3 b 63 1936',
'STATE 3 c 100 1937',
'STATE 2 l 68 1938',
'STATE 3 l 68 1939',
'STATE 3 p 100 1940',
'STATE 3 r 100 68',
'STATE 6 t 1942 1941',
'STATE 6 i 28 29',
'STATE 2 l 1944 1943',
'STATE 1 o 29 28',
'STATE 5 s 28 29',
'STATE 3 i 28 1945',
'STATE 6 e 29 1946',
'STATE 3 h 28 1947',
'STATE 3 t 29 1948',
'STATE 3 j 29 1949',
'STATE 2 # 1950 29',
'STATE 3 c 29 1951',
'STATE 3 l 100 230',
'STATE 3 w 1953 1952',
'STATE 4 c 68 1954',
'STATE 6 i 1956 1955',
'STATE 4 g 100 1957',
'STATE 2 r 230 1958',
'STATE 2 n 230 1959',
'STATE 6 a 1961 1960',
'STATE 6 # 562 100',
'STATE 1 d 100 1962',
'STATE 6 g 100 1963',
'STATE 3 y 230 68',
'STATE 6 k 230 1964',
'STATE 3 t 230 68',
'STATE 1 r 100 1965',
'STATE 1 r 68 100',
'STATE 1 i 100 68',
'STATE 3 m 68 1966',
'STATE 6 h 100 68',
'STATE 1 o 100 1967',
'STATE 3 r 29 1968',
'STATE 1 r 68 1969',
'STATE 5 s 68 100',
'STATE 2 p 100 1970',
'STATE 2 e 100 1971',
'STATE 1 s 68 1972',
'STATE 2 o 68 1973',
'STATE 6 r 1975 1974',
'STATE 5 s 68 1976',
'STATE 6 i 68 1977',
'STATE 6 n 68 1978',
'STATE 4 b 68 1979',
'STATE 6 d 230 100',
'STATE 6 h 100 1980',
'STATE 5 g 562 100',
'STATE 5 v 100 1981',
'STATE 5 g 100 1982',
'STATE 4 s 68 1983',
'STATE 6 a 1985 1984',
'STATE 1 0 100 1986',
'STATE 3 g 68 1987',
'STATE 2 s 68 1988',
'STATE 4 m 68 1989',
'STATE 5 y 1991 1990',
'STATE 2 o 68 1992',
'STATE 3 p 230 1993',
'STATE 2 g 29 1994',
'STATE 4 s 1996 1995',
'STATE 5 r 1998 1997',
'STATE 4 j 2000 1999',
'STATE 3 m 2002 2001',
'STATE 3 b 42 2003',
'STATE 5 h 2005 2004',
'STATE 4 g 42 100',
'STATE 4 p 230 100',
'STATE 3 l 42 1674',
'STATE 3 h 100 2006',
'STATE 6 e 230 100',
'STATE 5 v 562 2007',
'STATE 6 # 100 29',
'STATE 4 n 2009 2008',
'STATE 4 m 68 2010',
'STATE 6 t 2012 2011',
'STATE 4 s 1870 68',
'STATE 3 h 100 2013',
'STATE 4 b 230 2014',
'STATE 4 v 100 230',
'STATE 3 k 100 2015',
'STATE 3 h 42 2016',
'STATE 5 s 2018 2017',
'STATE 6 a 100 2019',
'STATE 3 t 82 2020',
'STATE 6 h 100 2021',
'STATE 3 g 100 2022',
'STATE 4 f 29 2023',
'STATE 2 a 68 2024',
'STATE 3 f 100 68',
'STATE 4 t 68 2025',
'STATE 6 r 68 2026',
'STATE 4 z 68 100',
'STATE 4 s 2028 2027',
'STATE 3 d 100 2029',
'STATE 1 o 68 2030',
'STATE 2 a 230 68',
'STATE 4 s 42 2031',
'STATE 4 l 68 100',
'STATE 2 s 42 2032',
'STATE 2 # 2034 2033',
'STATE 4 d 68 2035',
'STATE 4 n 2037 2036',
'STATE 4 n 68 29',
'STATE 3 s 42 2038',
'STATE 4 c 68 2039',
'STATE 2 c 68 2040',
'STATE 4 x 100 2041',
'STATE 3 s 68 2042',
'STATE 3 s 42 2043',
'STATE 1 a 2045 2044',
'STATE 5 b 63 2046',
'STATE 3 t 2048 2047',
'STATE 3 n 68 2049',
'STATE 1 p 68 2050',
'STATE 3 b 68 2051',
'STATE 2 c 29 2052',
'STATE 3 h 2053 29',
'STATE 2 h 28 2054',
'STATE 1 a 230 28',
'STATE 3 k 28 2055',
'STATE 3 b 29 2056',
'STATE 6 n 28 2057',
'STATE 3 k 29 2058',
'STATE 3 t 29 2059',
'STATE 3 c 29 2060',
'STATE 5 b 29 2061',
'STATE 5 u 2063 2062',
'STATE 2 o 68 2064',
'STATE 6 # 2065 68',
'STATE 4 s 2067 2066',
'STATE 1 p 42 2068',
'STATE 2 m 100 2069',
'STATE 1 i 29 2070',
'STATE 2 r 29 230',
'STATE 3 c 100 2071',
'STATE 1 d 68 100',
'STATE 6 a 2073 2072',
'STATE 4 f 230 2074',
'STATE 3 k 230 2075',
'STATE 5 d 2077 2076',
'STATE 2 t 100 68',
'STATE 3 l 68 100',
'STATE 3 l 2078 100',
'STATE 3 d 68 2079',
'STATE 2 u 68 2080',
'STATE 1 o 68 1986',
'STATE 2 b 100 68',
'STATE 1 s 100 1854',
'STATE 4 h 29 2081',
'STATE 4 g 68 2082',
'STATE 5 y 42 2083',
'STATE 4 c 100 2084',
'STATE 4 c 68 2085',
'STATE 6 t 100 2086',
'STATE 6 e 100 230',
'STATE 5 b 100 2087',
'STATE 5 b 100 562',
'STATE 4 f 68 1285',
'STATE 6 e 2089 2088',
'STATE 1 a 100 1403',
'STATE 2 i 68 100',
'STATE 3 w 82 2090',
'STATE 2 c 68 82',
'STATE 4 n 68 2091',
'STATE 6 e 2093 2092',
'STATE 6 # 42 100',
'STATE 4 v 2095 2094',
'STATE 3 m 68 2096',
'STATE 6 # 29 230',
'STATE 3 r 68 2097',
'STATE 3 n 230 100',
'STATE 3 m 2099 2098',
'STATE 4 t 2101 2100',
'STATE 3 m 2103 2102',
'PHONE ay1',
'STATE 4 k 68 2104',
'STATE 4 t 68 1917',
'STATE 4 d 42 100',
'STATE 5 r 1786 2105',
'STATE 3 f 29 2106',
'STATE 6 o 2108 2107',
'STATE 5 c 100 2109',
'STATE 3 n 2028 2110',
'STATE 3 j 68 100',
'STATE 4 p 230 2111',
'STATE 4 c 2113 2112',
'STATE 4 b 29 1838',
'STATE 4 h 29 2114',
'STATE 4 s 68 230',
'STATE 3 b 68 100',
'STATE 3 m 68 2115',
'STATE 5 z 2117 2116',
'STATE 3 f 82 2020',
'STATE 6 u 2119 2118',
'STATE 3 b 82 100',
'STATE 3 b 100 82',
'STATE 3 t 82 100',
'STATE 5 h 29 2120',
'STATE 4 v 230 2121',
'STATE 3 t 1285 2122',
'STATE 2 s 230 100',
'STATE 3 f 68 2123',
'STATE 6 l 230 68',
'STATE 2 # 2125 2124',
'STATE 2 a 68 2126',
'STATE 3 s 2128 2127',
'STATE 2 b 42 2129',
'STATE 1 # 42 2130',
'STATE 6 l 42 2131',
'STATE 6 m 42 2132',
'STATE 2 n 68 2133',
'STATE 2 m 100 230',
'STATE 4 v 230 2134',
'STATE 6 r 29 68',
'STATE 2 a 2136 2135',
'STATE 3 c 2138 2137',
'STATE 3 n 42 2139',
'STATE 3 r 42 2140',
'STATE 2 i 247 68',
'STATE 2 n 247 2141',
'STATE 6 c 63 2142',
'STATE 2 a 2144 2143',
'STATE 4 d 68 2145',
'STATE 2 i 68 2146',
'STATE 1 h 68 2147',
'STATE 1 r 68 2148',
'STATE 3 n 2150 2149',
'STATE 1 e 230 2151',
'STATE 3 y 29 2152',
'STATE 1 r 2154 2153',
'STATE 3 h 2156 2155',
'STATE 3 t 28 29',
'STATE 3 m 2157 29',
'STATE 3 f 29 2158',
'STATE 5 g 230 29',
'STATE 2 # 29 2159',
'STATE 1 s 2161 2160',
'STATE 6 l 2163 2162',
'STATE 5 h 29 2164',
'STATE 4 d 42 68',
'STATE 6 e 68 2165',
'STATE 6 # 2167 2166',
'STATE 4 s 29 2168',
'STATE 4 s 68 100',
'STATE 2 h 29 2169',
'STATE 2 c 100 2170',
'STATE 5 u 1735 2171',
'STATE 5 c 230 100',
'STATE 1 s 29 2172',
'STATE 6 s 29 68',
'STATE 2 i 100 2173',
'STATE 3 l 2175 2174',
'STATE 6 h 68 29',
'STATE 1 m 2176 68',
'STATE 3 n 68 2177',
'STATE 4 p 2179 2178',
'STATE 4 b 68 2180',
'STATE 6 h 100 2181',
'STATE 6 a 2183 2182',
'STATE 6 a 29 2184',
'STATE 6 p 68 2185',
'STATE 5 c 100 562',
'STATE 6 i 100 2186',
'STATE 1 0 100 2187',
'STATE 3 n 68 2188',
'STATE 4 l 68 1493',
'STATE 5 r 2190 2189',
'STATE 2 i 68 2191',
'STATE 6 s 42 2192',
'STATE 2 f 42 68',
'STATE 2 g 2194 2193',
'STATE 4 n 2195 68',
'STATE 6 u 2197 2196',
'STATE 4 c 2199 2198',
'STATE 4 v 100 2200',
'STATE 3 m 42 2201',
'STATE 3 c 2203 2202',
'STATE 4 c 2205 2204',
'STATE 3 y 29 2206',
'STATE 4 s 2208 2207',
'STATE 4 c 2210 2209',
'STATE 3 m 2212 2211',
'STATE 5 k 100 2213',
'STATE 5 m 562 2214',
'STATE 6 t 100 2215',
'STATE 3 m 42 2216',
'STATE 3 y 29 2217',
'STATE 3 m 68 230',
'STATE 4 z 2219 2218',
'STATE 4 g 42 230',
'STATE 5 h 562 100',
'STATE 3 s 82 230',
'STATE 3 b 2221 2220',
'STATE 3 h 68 2222',
'STATE 4 m 29 2223',
'STATE 2 o 68 2224',
'STATE 1 e 68 2225',
'STATE 3 m 68 2226',
'STATE 3 c 100 2227',
'STATE 4 n 100 2228',
'STATE 4 n 100 2229',
'STATE 4 b 100 2230',
'STATE 4 v 230 68',
'STATE 4 m 68 193',
'STATE 6 i 28 42',
'STATE 3 r 42 2231',
'STATE 6 g 100 2232',
'STATE 2 a 68 2233',
'STATE 1 r 29 2234',
'STATE 4 n 100 2235',
'STATE 3 m 29 68',
'STATE 3 t 2237 2236',
'STATE 6 g 100 2238',
'STATE 3 f 42 100',
'STATE 4 v 42 2239',
'STATE 2 c 247 2240',
'STATE 3 k 82 2241',
'STATE 1 a 2243 2242',
'STATE 3 b 230 1423',
'STATE 4 g 100 2244',
'STATE 1 i 68 2245',
'STATE 1 k 68 2246',
'STATE 2 u 68 2247',
'STATE 1 a 2249 2248',
'STATE 5 d 909 230',
'STATE 2 c 230 2250',
'STATE 3 f 230 2251',
'STATE 1 b 29 2252',
'STATE 2 e 29 28',
'STATE 2 c 29 230',
'STATE 1 o 230 2253',
'STATE 5 s 230 29',
'STATE 5 s 29 2254',
'STATE 5 n 230 29',
'STATE 6 # 2256 2255',
'STATE 3 i 247 2257',
'STATE 4 t 2259 2258',
'STATE 4 c 100 2260',
'STATE 4 t 29 154',
'STATE 4 g 2262 2261',
'STATE 6 e 100 2263',
'STATE 5 h 247 100',
'STATE 3 r 29 100',
'STATE 6 # 905 29',
'STATE 6 i 100 2264',
'STATE 2 n 100 2265',
'STATE 4 d 2267 2266',
'STATE 2 o 2269 2268',
'STATE 2 g 562 2270',
'STATE 2 e 68 2271',
'STATE 2 b 68 100',
'STATE 2 i 68 782',
'STATE 5 t 2273 2272',
'STATE 5 p 2274 100',
'STATE 5 c 68 2275',
'STATE 6 o 68 2276',
'STATE 4 d 68 2277',
'STATE 4 t 100 68',
'STATE 4 q 100 1532',
'STATE 6 d 100 2278',
'STATE 6 g 100 82',
'STATE 3 v 68 2279',
'STATE 1 a 68 2280',
'STATE 3 h 2282 2281',
'STATE 4 g 42 2283',
'STATE 5 l 2285 2284',
'STATE 4 t 2287 2286',
'STATE 4 n 2289 2288',
'STATE 4 n 230 100',
'STATE 5 d 68 29',
'STATE 6 o 2291 2290',
'STATE 5 q 2293 2292',
'STATE 5 h 100 2294',
'STATE 5 h 2296 2295',
'STATE 3 l 230 2297',
'STATE 3 p 1204 100',
'STATE 5 k 2299 2298',
'STATE 4 m 230 2300',
'STATE 4 s 100 2301',
'STATE 5 c 100 2302',
'STATE 3 k 29 2303',
'STATE 3 m 2304 100',
'STATE 5 s 100 2305',
'STATE 4 t 2306 100',
'STATE 3 b 29 100',
'STATE 3 l 100 2307',
'STATE 5 c 2308 100',
'STATE 3 p 230 100',
'STATE 6 a 100 2309',
'STATE 6 d 230 2310',
'STATE 4 s 100 68',
'STATE 6 g 100 2311',
'STATE 3 s 2313 2312',
'STATE 3 n 230 68',
'STATE 6 s 82 2314',
'STATE 6 o 68 2315',
'STATE 3 g 230 100',
'STATE 6 o 82 2316',
'STATE 6 r 100 2317',
'STATE 2 u 68 2318',
'STATE 4 m 2320 2319',
'STATE 4 g 100 2321',
'STATE 3 c 100 2322',
'STATE 4 c 68 596',
'STATE 4 l 100 2323',
'STATE 5 t 42 2324',
'STATE 2 c 100 2325',
'STATE 2 o 68 2326',
'STATE 2 t 68 2327',
'STATE 3 l 2287 29',
'STATE 3 l 2329 2328',
'STATE 6 r 2330 100',
'STATE 4 m 100 2331',
'STATE 3 t 42 2332',
'STATE 6 # 247 68',
'STATE 3 l 2334 2333',
'STATE 4 f 68 2335',
'STATE 4 d 29 2336',
'STATE 4 t 100 562',
'STATE 2 s 562 2337',
'STATE 1 r 68 2338',
'STATE 3 d 68 2339',
'STATE 6 h 29 2340',
'STATE 2 n 28 29',
'STATE 1 r 230 29',
'STATE 3 b 29 2341',
'STATE 1 h 28 2342',
'STATE 2 n 29 2343',
'STATE 3 m 29 2344',
'STATE 4 p 2346 2345',
'STATE 4 h 68 2347',
'STATE 2 q 29 2348',
'STATE 6 a 29 2349',
'STATE 2 n 100 2350',
'STATE 1 n 100 230',
'STATE 4 z 29 2351',
'STATE 1 p 68 2352',
'STATE 6 o 29 1722',
'STATE 2 s 2354 2353',
'STATE 3 v 68 2355',
'STATE 1 m 2357 2356',
'STATE 3 r 68 230',
'STATE 6 r 68 2358',
'STATE 1 i 29 2359',
'STATE 6 t 68 2360',
'STATE 6 i 100 2361',
'STATE 6 e 2363 2362',
'STATE 4 t 2364 100',
'STATE 6 o 68 2365',
'STATE 4 p 68 2366',
'STATE 5 c 2365 2367',
'STATE 6 e 100 2368',
'STATE 4 p 68 2369',
'STATE 2 c 100 82',
'STATE 3 t 68 82',
'STATE 3 y 2371 2370',
'STATE 5 u 29 2372',
'STATE 4 h 29 100',
'STATE 3 h 2374 2373',
'STATE 4 b 42 2375',
'STATE 3 r 2377 2376',
'STATE 2 p 68 100',
'STATE 4 c 42 2378',
'STATE 2 b 100 2379',
'STATE 6 i 2381 2380',
'STATE 5 k 2299 2382',
'STATE 5 s 100 2383',
'STATE 3 p 230 2384',
'STATE 4 z 230 2385',
'STATE 5 k 100 68',
'STATE 6 i 247 68',
'STATE 3 g 230 2386',
'STATE 5 h 2388 2387',
'STATE 4 c 100 29',
'STATE 5 c 562 2389',
'STATE 4 m 29 2390',
'STATE 5 h 100 68',
'STATE 3 n 100 2391',
'STATE 4 c 68 2392',
'STATE 3 h 42 2393',
'STATE 3 m 100 2394',
'STATE 3 c 2396 2395',
'STATE 6 i 230 100',
'STATE 6 e 562 2397',
'STATE 4 v 230 2398',
'STATE 6 d 100 2399',
'STATE 3 m 68 2400',
'STATE 4 m 100 230',
'STATE 6 m 82 2401',
'STATE 6 i 100 82',
'STATE 6 e 82 29',
'STATE 1 m 68 100',
'STATE 4 m 29 2402',
'STATE 4 l 2404 2403',
'STATE 3 c 68 2405',
'STATE 2 g 100 2406',
'STATE 4 v 100 273',
'STATE 3 l 2408 2407',
'STATE 6 i 42 2409',
'STATE 6 a 2411 2410',
'STATE 4 b 230 68',
'STATE 2 e 68 2412',
'STATE 4 f 42 2413',
'STATE 6 r 2330 2414',
'STATE 4 v 230 42',
'STATE 6 b 42 2415',
'STATE 1 h 42 2416',
'STATE 5 s 82 2417',
'STATE 5 d 82 63',
'STATE 4 b 100 2418',
'STATE 4 t 562 2419',
'STATE 1 a 562 68',
'STATE 2 o 562 68',
'STATE 1 l 68 2420',
'STATE 3 i 29 2421',
'STATE 3 m 2423 2422',
'STATE 2 r 2425 2424',
'STATE 1 i 230 2426',
'STATE 3 b 2427 29',
'STATE 5 r 2429 2428',
'STATE 6 i 100 2430',
'STATE 5 z 1669 2431',
'STATE 3 r 100 2432',
'STATE 6 # 29 558',
'STATE 3 r 68 2433',
'STATE 1 p 68 2434',
'STATE 6 a 29 230',
'STATE 2 d 100 2435',
'STATE 3 t 562 100',
'STATE 6 u 100 2436',
'STATE 4 z 100 68',
'STATE 2 c 100 896',
'STATE 3 l 2438 2437',
'STATE 6 o 29 2439',
'STATE 1 a 100 2440',
'STATE 6 e 1854 29',
'STATE 4 c 2442 2441',
'STATE 5 c 562 2443',
'STATE 6 i 100 2444',
'STATE 6 e 68 100',
'STATE 4 t 68 2445',
'STATE 6 a 100 2446',
'STATE 6 l 562 100',
'STATE 4 h 68 2447',
'STATE 2 o 1825 2448',
'STATE 5 t 68 100',
'STATE 2 b 29 2449',
'STATE 5 c 2451 2450',
'STATE 5 g 42 2452',
'STATE 3 h 100 2453',
'STATE 3 l 100 2454',
'STATE 6 n 100 2455',
'STATE 6 n 42 2456',
'STATE 2 s 100 273',
'STATE 6 r 2458 2457',
'STATE 5 t 2460 2459',
'STATE 5 h 100 2461',
'STATE 3 t 230 2462',
'STATE 4 c 100 562',
'STATE 6 r 562 2463',
'STATE 4 p 100 2464',
'STATE 5 r 2466 2465',
'STATE 4 s 100 2467',
'STATE 5 h 100 2468',
'STATE 4 t 100 2469',
'STATE 6 n 68 2470',
'STATE 4 g 100 2471',
'STATE 3 t 42 100',
'STATE 3 g 100 756',
'STATE 6 a 100 2472',
'STATE 5 c 1980 100',
'STATE 6 o 2473 100',
'STATE 6 v 230 2474',
'STATE 4 p 68 2475',
'STATE 3 b 68 2476',
'STATE 3 h 2477 100',
'STATE 4 n 2478 1425',
'STATE 6 g 100 2479',
'STATE 6 g 68 2480',
'STATE 2 # 68 2481',
'STATE 4 n 100 256',
'STATE 3 f 42 2482',
'STATE 4 m 100 68',
'STATE 6 o 42 28',
'STATE 6 y 2484 2483',
'STATE 3 r 42 68',
'STATE 2 s 68 2485',
'STATE 6 n 2487 2486',
'STATE 4 t 42 68',
'STATE 4 v 42 2488',
'STATE 1 c 42 2489',
'STATE 3 m 82 2490',
'STATE 2 i 562 2491',
'STATE 3 i 100 2492',
'STATE 2 e 68 2493',
'STATE 1 r 29 2494',
'STATE 1 l 28 2495',
'STATE 1 a 29 2496',
'STATE 1 o 28 2497',
'STATE 3 g 28 29',
'STATE 2 r 230 29',
'STATE 5 b 230 29',
'STATE 5 h 2499 2498',
'STATE 3 p 42 2500',
'STATE 5 s 100 2501',
'STATE 4 s 2503 2502',
'STATE 3 h 100 2504',
'STATE 3 l 42 68',
'STATE 4 k 562 2505',
'STATE 1 e 100 2506',
'STATE 6 i 100 2507',
'STATE 5 n 1207 2508',
'STATE 6 e 2509 100',
'STATE 5 n 100 29',
'STATE 3 s 29 2510',
'STATE 4 z 230 2511',
'STATE 5 k 2513 2512',
'STATE 5 v 100 2514',
'STATE 6 e 68 2515',
'STATE 4 d 68 100',
'STATE 6 u 68 2516',
'STATE 4 d 100 2517',
'STATE 4 h 2519 2518',
'STATE 4 t 100 2520',
'STATE 2 o 68 2521',
'STATE 2 f 230 100',
'STATE 5 b 42 2069',
'STATE 2 b 100 2522',
'STATE 2 s 100 2523',
'STATE 2 g 42 29',
'STATE 6 s 29 2524',
'STATE 5 z 2526 2525',
'STATE 5 t 100 2527',
'STATE 5 h 100 2528',
'STATE 4 s 100 2529',
'STATE 4 b 68 2530',
'STATE 3 h 100 2213',
'STATE 6 u 2532 2531',
'STATE 3 f 100 2533',
'STATE 4 b 100 2534',
'STATE 4 g 42 2535',
'STATE 4 t 100 2536',
'STATE 5 t 2538 2537',
'STATE 5 n 100 2539',
'STATE 4 b 1416 2540',
'STATE 5 z 230 100',
'STATE 3 b 100 2541',
'STATE 5 h 100 562',
'STATE 4 g 230 2542',
'STATE 3 j 68 2543',
'STATE 4 v 2545 2544',
'STATE 6 o 100 2315',
'STATE 2 a 68 2546',
'STATE 4 p 100 2547',
'STATE 6 l 68 2548',
'STATE 6 r 100 68',
'STATE 4 v 100 2549',
'STATE 4 n 68 2550',
'STATE 3 l 68 42',
'STATE 3 h 42 2551',
'STATE 4 b 42 2552',
'STATE 3 g 42 2553',
'STATE 4 s 42 2554',
'STATE 2 l 68 2555',
'STATE 5 p 82 63',
'STATE 3 u 562 2556',
'STATE 4 c 562 100',
'STATE 3 k 68 2557',
'STATE 1 b 230 2558',
'STATE 1 u 29 2559',
'STATE 2 a 29 2560',
'STATE 3 u 29 2561',
'STATE 6 e 2563 2562',
'STATE 3 t 100 2564',
'STATE 6 e 2566 2565',
'STATE 6 s 100 2567',
'STATE 5 p 2569 2568',
'STATE 5 s 2570 100',
'STATE 4 s 100 29',
'STATE 4 d 29 2571',
'STATE 2 t 100 2572',
'STATE 3 c 29 2573',
'STATE 3 s 29 2574',
'STATE 2 p 100 29',
'STATE 1 d 100 2575',
'STATE 5 j 68 2576',
'STATE 6 i 100 2577',
'STATE 6 n 562 100',
'STATE 4 f 68 2578',
'STATE 6 a 68 100',
'STATE 6 i 2579 100',
'STATE 6 n 230 2580',
'STATE 2 i 2582 2581',
'STATE 5 l 29 100',
'STATE 5 p 1625 2583',
'STATE 5 g 2585 2584',
'STATE 2 s 1674 2586',
'STATE 4 p 100 2587',
'STATE 4 v 68 100',
'STATE 5 h 2588 100',
'STATE 4 c 68 100',
'STATE 5 b 100 2589',
'STATE 5 s 2591 2590',
'STATE 4 t 2592 100',
'STATE 4 s 100 2593',
'STATE 6 o 2073 100',
'STATE 5 s 230 100',
'STATE 4 c 100 2594',
'STATE 3 h 100 2595',
'STATE 3 l 230 100',
'STATE 4 p 562 100',
'STATE 5 s 100 2596',
'STATE 4 s 230 100',
'STATE 4 g 100 230',
'STATE 3 r 230 2597',
'STATE 6 u 100 2598',
'STATE 4 f 29 2599',
'STATE 3 r 29 2600',
'STATE 4 b 230 2601',
'STATE 3 n 100 230',
'STATE 2 i 68 29',
'STATE 4 c 1416 2602',
'STATE 6 p 100 2603',
'STATE 4 m 42 2604',
'STATE 6 n 2605 68',
'STATE 1 a 68 42',
'STATE 6 c 100 2606',
'STATE 4 d 42 2607',
'STATE 6 n 100 1353',
'STATE 2 r 68 2608',
'STATE 3 h 100 2609',
'STATE 2 h 68 2610',
'STATE 2 n 230 2611',
'STATE 1 k 28 2612',
'STATE 1 d 29 230',
'STATE 3 t 28 2613',
'STATE 6 o 2615 2614',
'STATE 4 g 2617 2616',
'STATE 3 f 29 2618',
'STATE 6 i 2620 2619',
'STATE 2 i 68 2621',
'STATE 5 h 68 2622',
'STATE 4 p 100 2623',
'STATE 3 k 2624 100',
'STATE 2 g 100 2625',
'STATE 5 u 68 2626',
'STATE 3 r 68 2627',
'STATE 6 o 2317 68',
'STATE 1 u 68 2628',
'STATE 1 m 100 2629',
'STATE 4 t 100 2630',
'STATE 6 o 68 2631',
'STATE 5 n 100 2632',
'STATE 5 p 100 68',
'STATE 6 r 100 2216',
'STATE 6 i 2634 2633',
'STATE 5 c 100 2635',
'STATE 2 s 100 2636',
'STATE 5 u 1891 100',
'STATE 4 g 100 2637',
'STATE 2 c 42 100',
'STATE 3 h 100 68',
'STATE 4 c 2638 100',
'STATE 4 t 100 2639',
'STATE 5 l 100 2640',
'STATE 4 s 100 562',
'STATE 3 b 230 100',
'STATE 3 k 29 2641',
'STATE 4 m 100 2642',
'STATE 5 z 230 2643',
'STATE 5 r 230 100',
'STATE 3 l 230 2644',
'STATE 6 i 1996 100',
'STATE 3 l 100 2645',
'STATE 4 g 100 2646',
'STATE 3 t 100 230',
'STATE 3 p 68 2647',
'STATE 3 v 100 2648',
'STATE 4 p 230 42',
'STATE 4 t 100 2649',
'STATE 3 p 2651 2650',
'STATE 3 p 100 1825',
'STATE 1 e 42 2652',
'STATE 2 t 100 2653',
'STATE 1 e 68 2654',
'STATE 5 s 29 2655',
'STATE 3 t 28 2656',
'STATE 1 a 28 2657',
'STATE 6 h 100 2658',
'STATE 5 n 230 2659',
'STATE 3 m 68 2660',
'STATE 1 r 100 42',
'STATE 4 t 2662 2661',
'STATE 3 l 29 2663',
'STATE 3 i 68 100',
'STATE 3 s 68 42',
'STATE 3 s 68 100',
'STATE 3 v 562 2664',
'STATE 2 n 562 100',
'STATE 1 a 68 100',
'STATE 5 h 68 2665',
'STATE 1 o 100 2666',
'STATE 6 e 2668 2667',
'STATE 6 r 2670 2669',
'STATE 5 f 2672 2671',
'STATE 6 u 68 100',
'STATE 4 d 2673 100',
'STATE 6 o 2675 2674',
'STATE 3 r 2676 100',
'STATE 3 n 1423 2677',
'STATE 5 t 2678 100',
'STATE 3 r 42 100',
'STATE 3 b 29 2679',
'STATE 4 f 100 2680',
'STATE 3 c 2073 2681',
'STATE 5 b 2683 2682',
'STATE 6 i 100 2684',
'STATE 5 l 100 2685',
'STATE 4 c 100 2686',
'STATE 6 m 68 2687',
'STATE 6 y 2689 2688',
'STATE 4 t 100 2690',
'STATE 6 b 100 230',
'STATE 2 t 68 2691',
'STATE 3 n 2693 2692',
'STATE 6 r 68 2694',
'STATE 2 n 68 42',
'STATE 1 d 68 2695',
'STATE 1 m 100 2696',
'STATE 6 o 29 2697',
'STATE 1 o 29 2698',
'STATE 1 i 28 2699',
'STATE 5 k 2701 2700',
'STATE 5 z 29 2702',
'STATE 3 s 68 2703',
'STATE 2 h 100 2704',
'STATE 2 m 68 2705',
'STATE 3 r 28 68',
'STATE 2 t 100 2706',
'STATE 6 # 68 2707',
'STATE 6 # 100 68',
'STATE 5 t 2709 2708',
'STATE 5 t 29 100',
'STATE 3 h 100 2710',
'STATE 3 x 100 29',
'STATE 5 s 2712 2711',
'STATE 6 o 68 2713',
'STATE 5 d 68 100',
'STATE 6 a 2715 2714',
'STATE 3 l 2717 2716',
'STATE 4 n 2719 2718',
'STATE 4 n 29 230',
'STATE 4 n 100 562',
'STATE 6 t 29 100',
'STATE 4 m 100 2299',
'STATE 3 z 230 2720',
'STATE 3 c 100 2721',
'STATE 3 r 68 100',
'STATE 3 m 100 2722',
'STATE 4 m 100 2723',
'STATE 6 l 230 2724',
'STATE 6 u 68 2725',
'STATE 3 t 100 2726',
'STATE 3 m 29 100',
'STATE 3 c 230 2727',
'STATE 3 v 68 2728',
'STATE 4 t 42 2729',
'STATE 6 r 42 68',
'STATE 4 l 42 230',
'STATE 3 v 68 2730',
'STATE 3 c 68 2731',
'STATE 3 c 29 2732',
'STATE 1 a 29 2733',
'STATE 3 r 29 2734',
'STATE 3 l 100 2735',
'STATE 6 s 100 2736',
'STATE 4 s 29 1860',
'STATE 3 n 562 2737',
'STATE 6 i 2739 2738',
'STATE 3 n 68 2740',
'STATE 5 h 2742 2741',
'STATE 6 o 68 1722',
'STATE 5 z 29 2743',
'STATE 1 n 68 2744',
'STATE 6 i 100 2745',
'STATE 6 u 562 2746',
'STATE 4 b 2747 100',
'STATE 6 i 68 2748',
'STATE 3 v 68 2749',
'STATE 5 c 2194 2750',
'STATE 5 k 100 2751',
'STATE 5 b 562 100',
'STATE 2 g 100 2752',
'STATE 5 c 562 100',
'STATE 3 v 100 2753',
'STATE 3 t 2754 100',
'STATE 6 o 68 29',
'STATE 5 m 100 2755',
'STATE 4 t 100 2756',
'STATE 4 s 100 2757',
'STATE 6 h 29 2758',
'STATE 4 k 68 2759',
'STATE 4 l 68 2760',
'STATE 4 s 42 2761',
'STATE 2 r 2763 2762',
'STATE 3 s 68 2764',
'STATE 2 e 230 29',
'STATE 3 i 28 2765',
'STATE 2 t 28 2766',
'STATE 4 c 29 2767',
'STATE 2 e 100 2768',
'STATE 2 o 2216 2769',
'STATE 4 c 2771 2770',
'STATE 3 h 29 68',
'STATE 2 o 100 2772',
'STATE 2 l 2774 2773',
'STATE 4 t 1287 68',
'STATE 5 j 29 2295',
'STATE 1 o 230 2775',
'STATE 1 s 100 2776',
'STATE 5 d 2778 2777',
'STATE 6 t 68 1204',
'STATE 6 l 68 100',
'STATE 5 u 2779 100',
'STATE 4 g 100 2780',
'STATE 5 n 230 2781',
'STATE 5 h 42 100',
'STATE 5 c 2782 100',
'STATE 5 p 100 562',
'STATE 3 z 230 2783',
'STATE 4 m 100 2784',
'STATE 6 w 68 2785',
'STATE 4 v 29 2786',
'STATE 2 # 2788 2787',
'STATE 4 c 42 2789',
'STATE 4 v 42 2790',
'STATE 2 u 562 2791',
'STATE 1 e 100 1425',
'STATE 3 t 68 2792',
'STATE 1 m 28 2793',
'STATE 2 i 28 2794',
'STATE 1 i 100 2795',
'STATE 2 u 29 2796',
'STATE 3 h 2798 2797',
'STATE 6 e 100 68',
'STATE 2 e 29 2799',
'STATE 2 e 100 68',
'STATE 5 k 2801 2800',
'STATE 4 m 68 2802',
'STATE 2 r 100 2803',
'STATE 6 o 100 2804',
'STATE 6 a 2806 2805',
'STATE 4 b 100 2807',
'STATE 2 s 2601 100',
'STATE 4 m 100 2808',
'STATE 2 f 100 2809',
'STATE 3 f 100 230',
'STATE 3 p 2811 2810',
'STATE 3 c 100 2812',
'STATE 4 d 100 2813',
'STATE 6 k 29 2814',
'STATE 4 v 230 2815',
'STATE 6 r 68 2816',
'STATE 4 v 68 230',
'STATE 3 d 42 2817',
'STATE 2 c 100 2818',
'STATE 2 a 68 2819',
'STATE 2 o 29 2820',
'STATE 3 b 28 2821',
'STATE 5 p 100 2822',
'STATE 4 s 29 2823',
'STATE 4 s 2824 100',
'STATE 5 m 100 68',
'STATE 1 t 29 68',
'STATE 1 o 100 2825',
'STATE 1 o 68 2826',
'STATE 5 s 562 68',
'STATE 2 n 100 2827',
'STATE 1 l 100 2828',
'STATE 5 k 562 2829',
'STATE 5 v 68 100',
'STATE 6 i 68 100',
'STATE 4 n 100 2830',
'STATE 5 h 29 100',
'STATE 5 t 2832 2831',
'STATE 5 s 230 2538',
'STATE 3 p 100 230',
'STATE 3 s 100 2748',
'STATE 4 z 68 2833',
'STATE 4 b 68 2834',
'STATE 4 n 68 1799',
'STATE 6 a 42 2835',
'STATE 3 b 100 2836',
'STATE 1 a 68 2837',
'STATE 2 a 29 2838',
'STATE 3 n 28 2839',
'STATE 2 s 100 2840',
'STATE 1 a 100 2841',
'STATE 3 p 100 2625',
'STATE 2 s 100 2842',
'STATE 3 s 68 2843',
'STATE 6 a 100 2844',
'STATE 3 m 2770 100',
'STATE 6 i 562 2845',
'STATE 2 f 100 2846',
'STATE 3 k 100 2847',
'STATE 4 t 230 100',
'STATE 3 l 68 2848',
'STATE 4 g 68 100',
'STATE 6 r 2850 2849',
'STATE 3 p 100 2851',
'STATE 2 o 2852 68',
'STATE 2 i 29 28',
'STATE 2 s 28 2853',
'STATE 1 m 100 2854',
'STATE 2 c 100 29',
'STATE 3 c 100 2855',
'STATE 1 a 68 1853',
'STATE 2 s 100 2856',
'STATE 5 v 100 2857',
'STATE 5 u 100 2858',
'STATE 5 g 100 2859',
'STATE 4 h 68 2860',
'STATE 4 n 100 1552',
'STATE 4 m 42 2861',
'STATE 2 g 100 2862',
'STATE 1 d 29 68',
'STATE 3 g 28 2863',
'STATE 5 m 2865 2864',
'STATE 2 g 68 2866',
'STATE 3 r 100 2867',
'STATE 5 n 100 2868',
'STATE 3 l 100 1227',
'STATE 3 r 100 2869',
'STATE 6 m 230 100',
'STATE 4 d 100 2870',
'STATE 2 e 2183 2871',
'STATE 2 c 28 240',
'STATE 5 b 100 2872',
'STATE 6 a 100 562',
'STATE 4 m 68 2873',
'STATE 2 a 100 2874',
'STATE 4 b 100 2875',
'STATE 5 c 2876 100',
'STATE 3 g 100 42',
'STATE 4 p 100 2877',
'STATE 2 l 2879 2878',
'STATE 3 r 100 2880',
'STATE 6 i 100 29',
'STATE 5 m 562 68',
'STATE 4 c 100 230',
'STATE 3 i 100 2881',
'STATE 5 s 2883 2882',
'STATE 1 a 230 68',
'STATE 5 s 100 68',
'STATE 1 c 68 2884',
'STATE 3 p 230 2885',
'STATE 1 a 68 2886',
'STATE 3 r 2183 2887',
'STATE 4 g 100 2888',
'STATE 4 s 2889 29',
'STATE 4 d 562 2890',
'STATE 4 d 100 2891',
'STATE 2 o 29 100',
'STATE 4 t 100 2892',
'STATE 5 c 100 68',
'STATE 3 m 562 2893',
'STATE 2 s 562 100',
'INDEX 2894 b',
'STATE 4 b 2896 2895',
'STATE 3 m 2898 2897',
'STATE 1 c 2900 2899',
'STATE 4 t 2902 2901',
'STATE 4 # 2899 2903',
'PHONE epsilon',
'STATE 2 r 2904 2899',
'PHONE b',
'STATE 1 d 2899 2905',
'STATE 4 s 2899 2906',
'STATE 3 a 2899 2901',
'STATE 2 d 2899 2901',
'STATE 2 o 2908 2907',
'STATE 1 l 2910 2909',
'STATE 4 a 2901 2911',
'STATE 2 u 2912 2901',
'STATE 2 i 2913 2901',
'STATE 1 b 2899 2914',
'STATE 1 d 2899 2901',
'STATE 4 e 2899 2901',
'STATE 1 c 2913 2901',
'INDEX 2915 c',
'STATE 4 k 2917 2916',
'STATE 4 h 2919 2918',
'STATE 5 i 2921 2920',
'STATE 4 e 2923 2922',
'STATE 3 s 2925 2924',
'PHONE epsilon',
'STATE 6 # 2926 2920',
'STATE 4 i 2928 2927',
'STATE 3 s 2920 2929',
'STATE 3 t 2931 2930',
'STATE 2 t 2931 2932',
'STATE 1 # 2920 2933',
'STATE 4 c 2935 2934',
'STATE 3 s 2937 2936',
'STATE 3 m 2939 2938',
'STATE 2 0 2941 2940',
'PHONE ch',
'STATE 5 o 2943 2942',
'STATE 1 o 2945 2944',
'STATE 4 y 2947 2946',
'STATE 5 e 2949 2948',
'STATE 5 a 2951 2950',
'STATE 5 a 2953 2952',
'STATE 3 x 2920 2954',
'PHONE k',
'STATE 3 n 2956 2955',
'STATE 5 r 2939 2957',
'STATE 5 i 2959 2958',
'STATE 6 o 2939 2920',
'STATE 1 a 2961 2960',
'PHONE t-s',
'STATE 4 z 2963 2962',
'STATE 5 r 2939 2964',
'STATE 5 i 2965 2920',
'STATE 3 a 2939 2966',
'STATE 3 c 2968 2967',
'STATE 6 l 2970 2969',
'STATE 1 p 2931 2920',
'STATE 1 0 2920 2931',
'STATE 5 k 2972 2971',
'STATE 2 v 2931 2973',
'STATE 5 o 2975 2974',
'STATE 5 l 2939 2976',
'STATE 6 d 2978 2977',
'STATE 1 0 2920 2939',
'STATE 3 i 2945 2979',
'STATE 2 l 2920 2945',
'STATE 4 g 2920 2980',
'STATE 2 s 2920 2931',
'PHONE s',
'STATE 6 # 2920 2981',
'STATE 2 s 2939 2920',
'STATE 6 u 2983 2982',
'STATE 5 # 2931 2984',
'STATE 3 i 2970 2985',
'PHONE sh',
'STATE 6 n 2987 2986',
'STATE 3 i 2931 2988',
'STATE 2 e 2990 2989',
'STATE 6 l 2992 2991',
'STATE 6 r 2939 2993',
'STATE 5 a 2995 2994',
'STATE 1 0 2997 2996',
'STATE 5 a 2920 2939',
'STATE 1 r 2945 2998',
'STATE 4 q 2920 2999',
'STATE 6 d 2939 3000',
'STATE 3 x 2920 3001',
'STATE 5 o 2970 2964',
'STATE 5 o 2931 3002',
'STATE 6 t 3004 3003',
'STATE 2 0 3006 3005',
'STATE 5 a 2970 2964',
'STATE 1 # 2931 3007',
'STATE 5 e 3009 3008',
'STATE 3 i 2939 3010',
'STATE 5 e 2931 3011',
'STATE 2 i 2931 2970',
'STATE 6 # 2931 2939',
'STATE 6 v 2931 3012',
'STATE 6 r 2931 3013',
'STATE 5 a 3014 2920',
'STATE 6 m 3015 2920',
'STATE 2 r 2945 3016',
'STATE 3 k 2920 3017',
'STATE 6 a 2920 3018',
'STATE 6 n 3020 3019',
'STATE 1 # 2964 3021',
'STATE 3 c 2931 3022',
'STATE 1 p 2970 2964',
'STATE 5 o 2970 3023',
'STATE 5 n 2964 3024',
'STATE 1 o 2931 3025',
'STATE 3 e 3027 3026',
'STATE 6 r 3029 3028',
'STATE 3 c 2939 3030',
'STATE 1 s 2939 3031',
'STATE 6 r 3033 3032',
'STATE 6 u 2970 2931',
'STATE 6 r 3034 2920',
'STATE 5 e 2939 2920',
'STATE 3 a 2945 3035',
'STATE 3 n 3037 3036',
'STATE 3 a 3038 2920',
'STATE 3 m 2939 3039',
'STATE 2 f 2970 3040',
'STATE 1 v 2964 2931',
'STATE 1 0 2931 3041',
'STATE 6 c 3043 3042',
'STATE 6 s 2964 3044',
'STATE 1 a 2931 3045',
'STATE 2 b 3047 3046',
'STATE 2 i 3049 3048',
'STATE 6 n 3051 3050',
'STATE 3 a 2939 3052',
'STATE 3 u 2939 3053',
'STATE 5 # 2931 3054',
'STATE 6 a 3056 3055',
'STATE 5 o 2939 2931',
'STATE 1 d 2931 2939',
'STATE 3 o 2945 2920',
'STATE 2 u 3058 3057',
'STATE 1 r 3059 2939',
'STATE 1 # 2939 2920',
'STATE 5 e 3061 3060',
'STATE 5 n 2964 3062',
'STATE 3 n 2931 3063',
'STATE 3 n 3065 3064',
'STATE 2 a 2931 2964',
'STATE 5 m 2964 3066',
'STATE 3 a 2964 2931',
'STATE 3 c 2939 3067',
'STATE 5 # 2939 3068',
'STATE 5 a 3070 3069',
'STATE 5 # 2931 2939',
'STATE 6 l 3072 3071',
'STATE 3 r 2931 2939',
'STATE 1 r 2931 3073',
'STATE 3 r 3074 2931',
'STATE 6 s 2931 3075',
'STATE 6 m 3076 2931',
'STATE 5 i 2939 2931',
'STATE 4 # 2939 3077',
'STATE 4 l 2920 2939',
'STATE 5 i 2964 2939',
'STATE 5 # 3079 3078',
'STATE 6 # 2939 3080',
'STATE 3 n 2931 2964',
'STATE 6 n 2970 3081',
'STATE 5 l 3083 3082',
'STATE 5 n 3084 2964',
'STATE 6 u 2931 3085',
'STATE 2 o 3087 3086',
'STATE 1 # 3088 2931',
'STATE 5 i 3090 3089',
'STATE 2 m 2939 2931',
'STATE 6 t 3092 3091',
'STATE 2 r 2970 3093',
'STATE 3 e 2939 3094',
'STATE 5 a 2931 3095',
'STATE 1 r 2931 3096',
'STATE 5 e 2939 2931',
'STATE 1 n 3097 2939',
'STATE 6 g 2964 3098',
'STATE 3 i 2931 3099',
'STATE 3 n 2964 3100',
'STATE 3 r 2964 3101',
'STATE 1 a 3103 3102',
'STATE 6 e 2964 3104',
'STATE 1 v 2931 2964',
'STATE 5 p 2964 3105',
'STATE 2 u 3107 3106',
'STATE 3 r 3108 2931',
'STATE 6 e 2939 3109',
'STATE 1 c 3110 2939',
'STATE 6 n 2931 2939',
'STATE 6 m 3112 3111',
'STATE 2 a 2939 3113',
'STATE 3 a 2931 2939',
'STATE 1 # 2931 3114',
'STATE 1 k 2931 3115',
'STATE 6 n 2931 3116',
'STATE 4 t 3117 2939',
'STATE 5 n 3119 3118',
'STATE 3 a 2931 2964',
'STATE 3 r 2939 3120',
'STATE 3 a 2931 2970',
'STATE 5 s 3122 3121',
'STATE 3 i 2964 3099',
'STATE 3 a 2964 3123',
'STATE 6 t 2964 3124',
'STATE 5 i 3126 3125',
'STATE 5 a 3127 2931',
'STATE 5 a 2931 3056',
'STATE 6 n 2939 3128',
'STATE 2 h 2931 2939',
'STATE 2 s 2939 3129',
'STATE 3 o 2939 3130',
'STATE 1 # 2970 3131',
'STATE 3 r 3133 3132',
'STATE 5 e 2931 2939',
'STATE 2 i 2931 3134',
'STATE 3 i 3135 2939',
'STATE 3 i 2964 3136',
'STATE 2 m 2939 3137',
'STATE 2 0 2931 3138',
'STATE 6 # 2964 3139',
'STATE 6 t 2920 2964',
'STATE 6 y 2964 3140',
'STATE 5 r 3141 2964',
'STATE 5 a 3143 3142',
'STATE 3 a 3145 3144',
'STATE 1 p 2931 2970',
'STATE 6 a 2939 3146',
'STATE 6 d 2931 3147',
'STATE 1 # 2931 2939',
'STATE 3 o 2970 2931',
'STATE 2 o 2931 2939',
'STATE 2 a 2931 2939',
'STATE 5 a 3148 2931',
'STATE 2 d 2920 2939',
'STATE 5 c 3150 3149',
'STATE 6 s 2931 3151',
'STATE 6 s 2964 3152',
'STATE 6 o 2964 3153',
'STATE 1 m 3155 3154',
'STATE 6 e 2964 3156',
'STATE 6 w 3158 3157',
'STATE 6 e 2939 3159',
'STATE 3 r 2939 3160',
'STATE 6 e 2931 3161',
'STATE 3 u 2939 2931',
'STATE 6 v 2931 3162',
'STATE 6 r 2931 2939',
'STATE 5 o 3164 3163',
'STATE 1 0 2964 2931',
'STATE 1 m 2931 3165',
'STATE 3 a 2970 2964',
'STATE 3 i 2964 3166',
'STATE 2 a 2964 3167',
'STATE 6 l 2964 2931',
'STATE 6 a 2964 3168',
'STATE 3 o 3170 3169',
'STATE 3 a 2920 2931',
'STATE 1 0 2939 3171',
'STATE 2 s 2939 3172',
'STATE 2 m 2970 3173',
'STATE 1 l 2931 3174',
'STATE 5 u 2964 3175',
'STATE 3 o 2964 3176',
'STATE 6 o 2931 3177',
'STATE 2 e 2964 3178',
'STATE 6 l 3179 2964',
'STATE 6 v 2964 2931',
'STATE 2 r 3181 3180',
'STATE 5 u 2931 2939',
'STATE 3 r 3183 3182',
'STATE 2 a 2931 3184',
'STATE 1 s 2970 2993',
'STATE 6 c 2931 3185',
'STATE 5 k 2931 3186',
'STATE 6 # 3187 2931',
'STATE 3 l 2931 3188',
'STATE 2 d 2964 3189',
'STATE 3 i 2964 3190',
'STATE 2 l 3192 3191',
'STATE 1 # 2931 3193',
'STATE 6 u 2970 3194',
'STATE 1 # 2970 2939',
'STATE 2 m 2931 3195',
'STATE 3 u 3197 3196',
'STATE 5 m 3199 3198',
'STATE 3 a 2964 3200',
'STATE 6 a 3201 2964',
'STATE 5 r 3203 3202',
'STATE 1 p 2964 2931',
'STATE 2 y 2920 3204',
'STATE 5 # 2939 3205',
'STATE 3 a 3049 2939',
'STATE 3 u 3207 3206',
'STATE 3 o 3208 2931',
'STATE 2 o 3210 3209',
'STATE 6 # 2970 2931',
'STATE 3 e 2964 3211',
'STATE 1 0 2931 2964',
'STATE 1 c 2931 2964',
'STATE 1 l 2964 2931',
'STATE 3 e 2964 3212',
'STATE 2 r 2964 3213',
'STATE 5 # 3215 3214',
'STATE 5 l 2939 3216',
'STATE 3 a 3218 3217',
'STATE 6 r 2939 2931',
'STATE 2 r 2939 2931',
'STATE 1 c 2939 3219',
'STATE 1 # 2939 2931',
'STATE 1 # 3220 2964',
'STATE 2 l 2964 3221',
'STATE 1 # 3045 2964',
'STATE 3 y 2939 3222',
'STATE 1 # 2931 3223',
'STATE 6 e 2939 3224',
'STATE 3 i 2931 3225',
'STATE 1 # 3207 2931',
'STATE 2 r 3227 3226',
'STATE 6 a 2931 2964',
'STATE 1 s 2964 3228',
'STATE 6 l 2939 3229',
'STATE 1 t 2931 3230',
'STATE 5 t 2931 2939',
'STATE 3 o 2939 2931',
'STATE 1 a 2931 3231',
'STATE 3 i 2931 3232',
'STATE 1 f 2964 3233',
'STATE 5 u 2931 3234',
'STATE 1 a 2920 3235',
'STATE 2 a 2931 3236',
'STATE 3 o 2931 2939',
'STATE 6 e 2964 3237',
'STATE 5 o 3239 3238',
'STATE 1 o 2939 3240',
'STATE 1 # 2931 3197',
'STATE 1 t 2964 3241',
'STATE 6 i 3051 3242',
'STATE 6 # 2931 3243',
'STATE 1 u 2939 3244',
'STATE 3 a 3245 2964',
'STATE 2 n 2939 3246',
'STATE 1 0 2939 2931',
'STATE 3 a 2939 3247',
'STATE 2 f 2964 3248',
'STATE 1 # 3250 3249',
'STATE 1 r 2939 3251',
'STATE 5 t 2964 3252',
'STATE 5 m 2931 2939',
'STATE 5 y 2931 3253',
'STATE 3 i 2931 3254',
'STATE 1 # 2964 3255',
'STATE 2 m 2931 3256',
'STATE 2 a 2931 3257',
'STATE 1 g 2964 3258',
'STATE 6 a 2931 2939',
'STATE 2 i 2931 2939',
'STATE 1 r 2964 3259',
'STATE 5 # 2964 2931',
'INDEX 3260 d',
'STATE 4 # 3262 3261',
'STATE 4 d 3264 3263',
'STATE 3 e 3266 3265',
'STATE 4 g 3268 3267',
'STATE 2 g 3270 3269',
'PHONE d',
'STATE 2 k 3272 3271',
'STATE 4 t 3274 3273',
'STATE 5 e 3276 3275',
'STATE 3 o 3276 3277',
'STATE 3 o 3265 3276',
'STATE 2 h 3279 3278',
'PHONE t',
'STATE 4 j 3276 3280',
'STATE 5 # 3282 3281',
'STATE 5 r 3265 3283',
'PHONE epsilon',
'STATE 2 b 3276 3284',
'STATE 2 p 3272 3285',
'STATE 1 t 3265 3286',
'STATE 3 d 3288 3287',
'STATE 1 # 3265 3289',
'STATE 3 u 3265 3270',
'STATE 5 a 3265 3290',
'STATE 3 e 3292 3291',
'STATE 2 c 3272 3293',
'STATE 1 g 3265 3272',
'STATE 4 u 3295 3294',
'STATE 2 e 3297 3296',
'STATE 5 h 3265 3298',
'STATE 5 o 3265 3276',
'STATE 5 y 3276 3299',
'STATE 5 y 3265 3300',
'STATE 2 s 3302 3301',
'STATE 4 z 3303 3265',
'STATE 2 0 3265 3304',
'STATE 4 e 3306 3305',
'STATE 4 y 3276 3307',
'STATE 1 o 3265 3308',
'STATE 5 i 3276 3309',
'STATE 6 r 3276 3310',
'STATE 2 f 3272 3311',
'STATE 1 s 3272 3312',
'STATE 6 # 3265 3313',
'STATE 5 a 3315 3314',
'STATE 1 # 3265 3316',
'STATE 1 b 3265 3317',
'STATE 6 # 3265 3318',
'STATE 5 k 3265 3276',
'STATE 2 m 3276 3319',
'STATE 2 p 3265 3276',
'STATE 2 x 3272 3265',
'STATE 1 r 3272 3320',
'STATE 6 k 3265 3321',
'STATE 5 l 3323 3322',
'STATE 1 g 3321 3324',
'STATE 1 w 3265 3325',
'STATE 1 l 3265 3326',
'STATE 1 p 3276 3327',
'STATE 6 d 3276 3328',
'STATE 1 a 3272 3329',
'PHONE jh',
'STATE 3 e 3330 3265',
'STATE 3 o 3321 3331',
'STATE 3 i 3321 3265',
'STATE 6 d 3265 3332',
'STATE 5 d 3265 3333',
'STATE 5 r 3265 3334',
'STATE 2 w 3265 3335',
'STATE 1 n 3272 3336',
'STATE 1 # 3265 3337',
'STATE 2 h 3321 3338',
'STATE 2 a 3340 3339',
'STATE 1 m 3265 3341',
'STATE 4 i 3265 3342',
'STATE 1 s 3344 3343',
'STATE 1 i 3265 3345',
'STATE 1 0 3321 3346',
'STATE 6 t 3265 3347',
'STATE 1 r 3348 3265',
'STATE 6 # 3265 3349',
'STATE 1 s 3265 3350',
'STATE 5 # 3276 3265',
'STATE 2 p 3276 3351',
'STATE 2 h 3265 3276',
'STATE 1 o 3265 3352',
'STATE 5 c 3265 3321',
'STATE 2 i 3265 3353',
'STATE 2 i 3276 3265',
'STATE 1 h 3276 3265',
'STATE 6 # 3265 3354',
'STATE 1 c 3276 3355',
'STATE 1 u 3265 3272',
'STATE 3 n 3321 3265',
'STATE 2 a 3276 3356',
'STATE 2 l 3276 3357',
'STATE 5 r 3276 3265',
'STATE 2 f 3276 3358',
'STATE 3 i 3360 3359',
'STATE 2 r 3276 3361',
'STATE 2 r 3265 3276',
'STATE 5 e 3362 3276',
'STATE 1 # 3276 3265',
'INDEX 3363 e',
'STATE 6 0 3365 3364',
'STATE 4 r 3367 3366',
'STATE 4 # 3369 3368',
'STATE 4 a 3371 3370',
'STATE 5 r 3373 3372',
'STATE 4 r 3375 3374',
'STATE 3 e 3377 3376',
'STATE 3 e 3379 3378',
'STATE 5 r 3381 3380',
'STATE 5 i 3383 3382',
'STATE 3 b 3385 3384',
'STATE 4 n 3387 3386',
'STATE 3 e 3389 3388',
'STATE 3 n 3391 3390',
'STATE 2 r 3393 3392',
'STATE 4 e 3395 3394',
'STATE 2 r 3397 3396',
'STATE 5 u 3399 3398',
'STATE 3 w 3385 3400',
'STATE 3 e 3389 3401',
'STATE 6 n 3403 3402',
'STATE 1 0 3405 3404',
'PHONE eh1',
'STATE 3 e 3407 3406',
'STATE 3 e 3393 3408',
'STATE 2 e 3409 3399',
'PHONE ih1',
'STATE 3 r 3411 3410',
'STATE 2 o 3413 3412',
'STATE 2 p 3393 3414',
'PHONE iy1',
'STATE 4 i 3416 3415',
'STATE 3 r 3417 3399',
'STATE 2 f 3418 3393',
'STATE 1 # 3420 3419',
'STATE 5 d 3422 3421',
'PHONE epsilon',
'STATE 3 b 3424 3423',
'STATE 5 o 3426 3425',
'STATE 6 a 3428 3427',
'STATE 3 e 3389 3399',
'STATE 3 h 3385 3429',
'STATE 3 p 3399 3430',
'STATE 4 l 3432 3431',
'STATE 1 # 3393 3433',
'STATE 3 m 3435 3434',
'STATE 3 w 3437 3436',
'STATE 3 k 3439 3438',
'STATE 2 d 3441 3440',
'STATE 2 i 3399 3442',
'STATE 1 i 3444 3443',
'STATE 2 n 3393 3445',
'STATE 1 0 3447 3446',
'STATE 5 r 3449 3448',
'STATE 1 0 3451 3450',
'STATE 1 # 3393 3452',
'STATE 1 p 3453 3393',
'STATE 5 a 3455 3454',
'STATE 6 h 3457 3456',
'STATE 3 h 3385 3458',
'STATE 1 u 3444 3459',
'STATE 6 d 3399 3385',
'STATE 5 e 3461 3460',
'STATE 1 0 3463 3462',
'STATE 6 o 3465 3464',
'STATE 3 l 3399 3466',
'STATE 2 o 3399 3467',
'STATE 6 a 3468 3385',
'STATE 4 k 3470 3469',
'STATE 3 i 3472 3471',
'STATE 2 r 3393 3473',
'STATE 2 g 3475 3474',
'STATE 1 a 3455 3476',
'STATE 3 y 3477 3399',
'PHONE y-uw1',
'STATE 2 n 3479 3478',
'STATE 2 t 3444 3480',
'STATE 2 b 3399 3481',
'STATE 1 n 3399 3455',
'STATE 2 a 3399 3482',
'STATE 1 t 3399 3483',
'PHONE iy',
'STATE 1 d 3393 3484',
'STATE 3 i 3486 3485',
'STATE 3 r 3488 3487',
'STATE 5 g 3490 3489',
'STATE 6 a 3385 3491',
'STATE 2 p 3492 3399',
'STATE 6 a 3444 3493',
'STATE 4 d 3444 3393',
'STATE 4 m 3385 3494',
'STATE 4 n 3389 3495',
'PHONE ah',
'STATE 1 0 3497 3496',
'STATE 5 t 3498 3393',
'STATE 3 t 3500 3499',
'STATE 6 r 3393 3399',
'STATE 5 a 3502 3501',
'STATE 6 d 3399 3503',
'STATE 6 # 3505 3504',
'STATE 3 a 3385 3506',
'STATE 6 e 3508 3507',
'STATE 3 t 3389 3509',
'STATE 2 a 3389 3510',
'STATE 6 y 3385 3511',
'STATE 3 s 3385 3512',
'STATE 3 t 3514 3513',
'STATE 1 # 3385 3515',
'STATE 3 t 3517 3516',
'STATE 1 # 3399 3518',
'STATE 4 d 3393 3519',
'STATE 3 i 3521 3520',
'STATE 3 r 3522 3455',
'STATE 2 l 3522 3523',
'STATE 1 m 3399 3524',
'STATE 3 h 3399 3525',
'STATE 3 t 3526 3399',
'STATE 2 z 3444 3527',
'STATE 1 i 3529 3528',
'STATE 2 e 3399 3530',
'STATE 1 h 3399 3531',
'STATE 2 s 3533 3532',
'STATE 5 t 3535 3534',
'STATE 5 t 3537 3536',
'STATE 4 w 3539 3538',
'STATE 4 v 3541 3540',
'STATE 3 r 3543 3542',
'STATE 6 h 3545 3544',
'STATE 6 o 3385 3546',
'STATE 5 m 3444 3399',
'STATE 6 t 3444 3399',
'PHONE ih',
'STATE 6 # 3393 3547',
'STATE 5 s 3549 3548',
'STATE 3 r 3551 3550',
'STATE 2 # 3385 3552',
'STATE 3 d 3385 3553',
'STATE 1 # 3385 3554',
'STATE 5 u 3556 3555',
'STATE 6 # 3558 3557',
'STATE 1 0 3560 3559',
'STATE 1 # 3546 3399',
'STATE 3 i 3399 3385',
'STATE 6 u 3399 3561',
'STATE 3 d 3563 3562',
'STATE 1 0 3385 3564',
'STATE 1 i 3385 3565',
'STATE 2 i 3389 3566',
'STATE 1 m 3385 3567',
'STATE 3 t 3399 3568',
'STATE 4 t 3570 3569',
'STATE 4 d 3455 3571',
'STATE 3 t 3573 3572',
'STATE 3 a 3399 3574',
'STATE 2 s 3455 3575',
'STATE 1 a 3576 3399',
'STATE 1 s 3393 3577',
'STATE 1 # 3578 3455',
'STATE 2 t 3399 3579',
'PHONE eh',
'STATE 1 o 3455 3580',
'PHONE ey1',
'STATE 2 e 3582 3581',
'STATE 1 a 3444 3583',
'STATE 2 d 3444 3584',
'STATE 1 d 3399 3585',
'STATE 2 o 3444 3399',
'STATE 2 y 3399 3586',
'STATE 1 b 3399 3587',
'STATE 1 e 3444 3588',
'STATE 1 s 3444 3393',
'STATE 5 s 3590 3589',
'STATE 6 # 3592 3591',
'STATE 4 n 3594 3593',
'STATE 4 s 3596 3595',
'STATE 4 u 3598 3597',
'STATE 3 n 3600 3599',
'STATE 4 u 3602 3601',
'STATE 5 i 3604 3603',
'STATE 3 v 3606 3605',
'STATE 5 n 3608 3607',
'STATE 6 n 3609 3399',
'STATE 3 l 3399 3610',
'STATE 3 h 3385 3399',
'STATE 5 e 3611 3393',
'STATE 5 b 3613 3612',
'STATE 6 u 3385 3614',
'STATE 3 h 3616 3615',
'STATE 5 g 3618 3617',
'STATE 3 h 3393 3385',
'STATE 3 r 3620 3619',
'STATE 1 m 3385 3621',
'STATE 2 e 3623 3622',
'STATE 1 0 3624 3399',
'STATE 1 0 3626 3625',
'STATE 3 i 3399 3627',
'STATE 6 # 3629 3628',
'STATE 6 g 3631 3630',
'STATE 3 p 3399 3632',
'STATE 6 z 3399 3633',
'STATE 1 0 3634 3399',
'STATE 2 x 3389 3399',
'STATE 3 p 3389 3385',
'STATE 2 m 3389 3635',
'STATE 6 o 3637 3636',
'STATE 3 f 3399 3385',
'STATE 4 w 3639 3638',
'STATE 3 k 3455 3640',
'STATE 4 s 3642 3641',
'STATE 3 c 3644 3643',
'STATE 2 a 3522 3645',
'STATE 3 u 3647 3646',
'STATE 2 t 3455 3648',
'STATE 2 n 3455 3399',
'STATE 2 s 3393 3649',
'STATE 3 o 3399 3650',
'STATE 2 r 3455 3399',
'STATE 2 r 3522 3651',
'STATE 3 b 3399 3652',
'STATE 3 s 3399 3653',
'STATE 1 o 3444 3654',
'STATE 2 m 3444 3399',
'STATE 2 u 3399 3655',
'STATE 1 e 3399 3656',
'STATE 1 d 3399 3657',
'STATE 1 u 3444 3658',
'STATE 4 n 3660 3659',
'STATE 6 # 3662 3661',
'STATE 4 n 3664 3663',
'STATE 4 n 3666 3665',
'STATE 4 t 3668 3667',
'STATE 5 c 3670 3669',
'STATE 1 o 3672 3671',
'STATE 6 # 3455 3399',
'STATE 3 d 3674 3673',
'STATE 3 d 3676 3675',
'STATE 5 e 3678 3677',
'PHONE uw1',
'STATE 4 n 3680 3679',
'STATE 6 i 3444 3681',
'STATE 5 a 3444 3682',
'STATE 6 e 3444 3683',
'STATE 2 t 3493 3684',
'STATE 5 t 3399 3685',
'STATE 5 m 3686 3399',
'STATE 1 0 3687 3399',
'STATE 2 # 3524 3399',
'STATE 3 h 3399 3688',
'STATE 4 l 3455 3393',
'STATE 2 b 3690 3689',
'STATE 2 a 3399 3691',
'STATE 6 a 3385 3692',
'STATE 5 n 3694 3693',
'STATE 6 t 3385 3695',
'STATE 5 c 3444 3696',
'STATE 6 a 3399 3393',
'STATE 1 0 3697 3393',
'STATE 1 0 3699 3698',
'STATE 6 # 3385 3399',
'STATE 6 # 3399 3700',
'STATE 3 w 3600 3701',
'STATE 6 p 3494 3702',
'STATE 3 h 3703 3399',
'STATE 2 # 3705 3704',
'STATE 3 h 3399 3706',
'STATE 3 h 3708 3707',
'STATE 3 i 3710 3709',
'STATE 6 c 3494 3711',
'STATE 3 d 3444 3399',
'STATE 3 s 3522 3712',
'STATE 3 i 3399 3713',
'STATE 6 v 3399 3714',
'STATE 1 0 3385 3389',
'STATE 1 a 3399 3715',
'STATE 2 n 3385 3399',
'STATE 4 s 3717 3716',
'STATE 2 v 3437 3718',
'STATE 3 u 3720 3719',
'STATE 4 e 3399 3721',
'STATE 2 n 3722 3399',
'STATE 3 z 3522 3723',
'STATE 2 i 3522 3724',
'STATE 1 o 3522 3725',
'STATE 1 e 3455 3726',
'STATE 1 # 3399 3455',
'STATE 2 r 3728 3727',
'STATE 2 l 3393 3729',
'STATE 2 o 3455 3730',
'STATE 1 e 3522 3731',
'STATE 2 b 3399 3732',
'STATE 3 w 3600 3399',
'STATE 1 e 3444 3399',
'STATE 1 t 3399 3733',
'STATE 1 y 3399 3734',
'STATE 1 e 3399 3735',
'STATE 2 f 3444 3736',
'STATE 4 l 3738 3737',
'STATE 5 e 3740 3739',
'STATE 6 i 3385 3741',
'STATE 4 y 3399 3742',
'STATE 4 s 3744 3743',
'STATE 6 s 3746 3745',
'STATE 4 t 3748 3747',
'STATE 1 # 3385 3749',
'STATE 5 l 3751 3750',
'STATE 1 # 3753 3752',
'STATE 1 f 3385 3754',
'STATE 1 e 3455 3755',
'STATE 4 n 3757 3756',
'STATE 6 a 3455 3385',
'STATE 4 x 3759 3758',
'STATE 4 m 3761 3760',
'STATE 3 t 3762 3399',
'STATE 5 t 3762 3399',
'STATE 3 b 3455 3763',
'STATE 6 l 3764 3399',
'STATE 4 y 3524 3765',
'STATE 6 w 3455 3766',
'STATE 5 s 3399 3762',
'STATE 6 l 3385 3767',
'STATE 6 v 3494 3444',
'STATE 3 d 3399 3768',
'STATE 6 l 3399 3524',
'STATE 6 b 3393 3399',
'STATE 6 t 3444 3769',
'STATE 2 0 3524 3770',
'STATE 5 m 3393 3771',
'STATE 3 r 3399 3393',
'STATE 3 g 3399 3772',
'STATE 2 b 3385 3773',
'STATE 5 t 3393 3774',
'STATE 6 d 3444 3393',
'STATE 5 v 3385 3393',
'STATE 5 l 3776 3775',
'STATE 3 b 3393 3777',
'STATE 2 b 3385 3778',
'STATE 6 i 3385 3393',
'STATE 3 z 3780 3779',
'STATE 3 u 3762 3399',
'STATE 3 p 3399 3385',
'STATE 6 p 3385 3781',
'STATE 6 s 3494 3522',
'STATE 3 d 3494 3782',
'STATE 2 e 3399 3385',
'STATE 6 o 3385 3783',
'STATE 1 # 3785 3784',
'STATE 2 w 3385 3786',
'STATE 2 r 3399 3522',
'STATE 3 p 3399 3787',
'STATE 3 v 3399 3788',
'STATE 1 a 3790 3789',
'STATE 6 s 3399 3385',
'STATE 1 # 3792 3791',
'STATE 3 d 3794 3793',
'STATE 3 s 3455 3795',
'STATE 1 # 3600 3796',
'STATE 3 l 3455 3797',
'STATE 2 q 3524 3399',
'STATE 4 y 3399 3798',
'STATE 1 e 3522 3799',
'STATE 3 s 3522 3800',
'STATE 2 e 3522 3801',
'STATE 2 i 3522 3385',
'STATE 1 i 3455 3802',
'STATE 2 h 3455 3385',
'STATE 1 e 3455 3385',
'STATE 4 s 3803 3393',
'STATE 3 r 3385 3455',
'STATE 2 s 3522 3804',
'STATE 3 j 3399 3805',
'STATE 1 s 3806 3399',
'STATE 2 u 3399 3807',
'STATE 1 m 3399 3808',
'STATE 1 n 3444 3809',
'STATE 4 w 3811 3810',
'STATE 5 y 3813 3812',
'STATE 5 d 3815 3814',
'STATE 6 # 3817 3816',
'STATE 1 # 3819 3818',
'STATE 4 w 3600 3820',
'STATE 4 u 3822 3821',
'STATE 6 o 3824 3823',
'STATE 6 l 3455 3825',
'STATE 3 m 3455 3826',
'STATE 4 s 3828 3827',
'STATE 3 u 3399 3829',
'STATE 3 m 3455 3830',
'STATE 4 w 3832 3831',
'STATE 6 o 3385 3833',
'STATE 2 p 3399 3834',
'STATE 2 d 3835 3399',
'STATE 5 n 3385 3836',
'STATE 6 e 3455 3399',
'STATE 4 t 3837 3399',
'STATE 6 i 3455 3838',
'STATE 4 y 3840 3839',
'STATE 2 # 3385 3841',
'STATE 4 l 3843 3842',
'STATE 6 g 3385 3844',
'PHONE oy1',
'STATE 3 d 3600 3845',
'STATE 3 j 3600 3385',
'STATE 5 a 3847 3846',
'STATE 5 a 3455 3848',
'STATE 5 e 3494 3849',
'STATE 5 j 3524 3850',
'STATE 6 v 3393 3851',
'STATE 3 r 3852 3524',
'STATE 3 w 3854 3853',
'STATE 3 c 3399 3855',
'STATE 6 # 3856 3393',
'STATE 6 u 3858 3857',
'STATE 6 a 3444 3393',
'STATE 6 i 3393 3859',
'STATE 6 o 3385 3860',
'STATE 2 t 3385 3861',
'STATE 3 a 3385 3862',
'STATE 1 0 3389 3399',
'STATE 1 # 3385 3399',
'STATE 6 r 3399 3863',
'STATE 3 r 3393 3864',
'STATE 2 t 3399 3389',
'STATE 2 t 3385 3522',
'STATE 1 l 3399 3389',
'STATE 6 # 3389 3865',
'STATE 3 z 3389 3866',
'STATE 6 d 3399 3867',
'STATE 2 r 3385 3399',
'STATE 2 n 3399 3868',
'STATE 2 s 3385 3399',
'STATE 4 d 3870 3869',
'STATE 4 d 3455 3871',
'STATE 3 c 3455 3872',
'STATE 3 h 3874 3873',
'STATE 3 i 3876 3875',
'STATE 4 m 3455 3877',
'STATE 1 a 3399 3522',
'STATE 3 l 3879 3878',
'STATE 2 a 3522 3880',
'STATE 2 p 3455 3881',
'STATE 2 n 3393 3882',
'STATE 2 h 3522 3883',
'STATE 3 i 3399 3884',
'STATE 2 a 3444 3399',
'STATE 2 r 3399 3885',
'STATE 1 o 3399 3886',
'STATE 1 a 3444 3887',
'STATE 4 o 3889 3888',
'STATE 1 # 3891 3890',
'STATE 5 l 3893 3892',
'STATE 6 # 3399 3455',
'STATE 5 b 3455 3894',
'STATE 6 o 3896 3895',
'STATE 6 s 3399 3897',
'STATE 2 y 3393 3898',
'STATE 4 w 3900 3899',
'STATE 4 s 3902 3901',
'STATE 1 # 3904 3903',
'STATE 4 o 3444 3905',
'STATE 3 r 3762 3399',
'STATE 3 n 3455 3906',
'STATE 2 i 3399 3907',
'STATE 6 h 3730 3908',
'STATE 1 r 3385 3909',
'STATE 4 c 3385 3910',
'STATE 1 # 3385 3911',
'STATE 1 # 3385 3912',
'STATE 3 s 3914 3913',
'STATE 1 a 3576 3915',
'STATE 5 s 3917 3916',
'STATE 4 l 3790 3399',
'STATE 1 o 3455 3918',
'STATE 5 z 3399 3919',
'STATE 1 a 3920 3399',
'STATE 6 # 3399 3385',
'STATE 1 e 3455 3921',
'STATE 2 # 3923 3922',
'STATE 5 e 3399 3924',
'STATE 5 a 3494 3925',
'STATE 4 v 3927 3926',
'STATE 5 i 3929 3928',
'STATE 5 i 3931 3930',
'STATE 3 l 3933 3932',
'STATE 4 j 3494 3934',
'STATE 6 l 3936 3935',
'STATE 5 e 3393 3937',
'STATE 5 o 3494 3385',
'STATE 6 o 3399 3938',
'STATE 6 f 3393 3939',
'STATE 2 f 3524 3399',
'STATE 6 i 3941 3940',
'STATE 5 t 3385 3393',
'STATE 6 l 3393 3399',
'STATE 1 # 3393 3444',
'STATE 6 o 3943 3942',
'STATE 5 s 3385 3393',
'STATE 6 l 3444 3393',
'STATE 3 l 3944 3393',
'STATE 1 s 3385 3945',
'STATE 1 l 3947 3946',
'STATE 3 p 3399 3948',
'STATE 1 # 3399 3949',
'STATE 3 j 3385 3950',
'STATE 2 # 3568 3494',
'STATE 6 s 3952 3951',
'STATE 1 d 3399 3953',
'STATE 4 y 3955 3954',
'STATE 3 w 3957 3956',
'STATE 4 z 3522 3958',
'STATE 3 g 3455 3959',
'STATE 3 r 3961 3960',
'PHONE y-uw',
'STATE 2 o 3963 3962',
'STATE 2 l 3399 3455',
'STATE 2 t 3399 3964',
'STATE 1 z 3522 3965',
'STATE 2 a 3522 3966',
'STATE 2 u 3522 3385',
'STATE 3 p 3968 3967',
'STATE 2 t 3393 3444',
'STATE 1 w 3522 3969',
'STATE 2 i 3399 3970',
'STATE 2 n 3399 3971',
'STATE 1 r 3399 3972',
'STATE 2 b 3533 3973',
'STATE 6 # 3975 3974',
'STATE 3 g 3399 3976',
'STATE 6 # 3600 3977',
'STATE 5 e 3979 3978',
'STATE 5 d 3981 3980',
'STATE 6 # 3983 3982',
'STATE 6 # 3985 3984',
'STATE 3 t 3385 3986',
'STATE 3 u 3385 3987',
'STATE 6 d 3455 3988',
'STATE 2 l 3393 3989',
'STATE 4 s 3991 3990',
'STATE 2 s 3385 3992',
'STATE 3 o 3399 3993',
'STATE 3 r 3385 3994',
'STATE 3 n 3455 3995',
'STATE 4 n 3455 3996',
'STATE 3 o 3399 3997',
'STATE 2 n 3385 3998',
'STATE 3 l 3399 3999',
'STATE 1 # 3385 4000',
'STATE 3 c 3455 4001',
'STATE 1 # 3385 4002',
'STATE 3 u 3385 4003',
'STATE 3 g 4005 4004',
'STATE 3 v 3385 4006',
'STATE 1 r 3385 3455',
'STATE 5 c 3385 3399',
'STATE 2 v 4007 3399',
'STATE 2 n 3385 3437',
'STATE 2 t 3455 4008',
'STATE 5 e 3399 3455',
'STATE 5 a 3455 3399',
'STATE 2 t 3399 4009',
'STATE 4 n 4011 4010',
'STATE 4 o 4013 4012',
'STATE 3 k 4015 4014',
'STATE 5 i 4017 4016',
'STATE 4 c 4019 4018',
'STATE 6 a 3393 4020',
'STATE 5 u 4022 4021',
'STATE 6 c 3385 4023',
'STATE 6 r 4025 4024',
'STATE 6 l 3444 3385',
'STATE 3 s 3600 4026',
'STATE 5 a 4027 3600',
'STATE 5 e 4029 4028',
'STATE 6 i 3455 4030',
'STATE 4 c 3494 4031',
'STATE 6 i 3522 4032',
'STATE 6 u 3399 4033',
'STATE 6 s 3393 4034',
'STATE 6 t 4036 4035',
'STATE 2 c 3444 4037',
'STATE 5 f 4039 4038',
'STATE 5 l 3385 3393',
'STATE 6 e 3393 3385',
'STATE 2 d 3385 4040',
'STATE 5 y 4042 4041',
'STATE 5 t 4043 3399',
'STATE 6 l 4045 4044',
'STATE 6 r 3399 4046',
'STATE 6 a 3399 4047',
'STATE 2 p 3385 4048',
'STATE 1 0 3385 3399',
'STATE 3 f 3399 4049',
'STATE 4 e 3399 4050',
'STATE 3 k 4052 4051',
'STATE 1 # 3399 4053',
'STATE 2 e 3600 3399',
'STATE 4 a 3444 4054',
'STATE 3 h 4056 4055',
'STATE 1 e 3600 4027',
'STATE 2 b 4027 3600',
'STATE 2 c 4058 4057',
'STATE 3 n 3522 3455',
'STATE 2 s 4060 4059',
'STATE 1 p 3494 4061',
'STATE 2 o 3522 3494',
'STATE 3 g 3455 4062',
'STATE 2 a 3455 4063',
'STATE 1 r 3455 4064',
'STATE 1 a 3399 4065',
'STATE 1 o 3399 4066',
'STATE 1 c 3444 4067',
'STATE 1 i 3444 4068',
'STATE 1 # 4070 4069',
'STATE 5 e 4072 4071',
'STATE 1 # 4074 4073',
'STATE 2 c 3600 4075',
'STATE 3 r 3600 4076',
'STATE 6 l 3600 3399',
'STATE 6 # 4078 4077',
'STATE 3 f 4080 4079',
'STATE 3 o 3399 4081',
'STATE 3 w 4083 4082',
'STATE 1 # 4085 4084',
'STATE 5 y 3455 4086',
'STATE 2 l 4088 4087',
'STATE 3 l 3385 3455',
'STATE 3 g 4090 4089',
'STATE 2 i 3393 4091',
'STATE 6 k 3385 4092',
'STATE 6 l 4094 4093',
'STATE 3 l 3385 4095',
'STATE 4 u 3399 4096',
'STATE 6 a 3522 4097',
'STATE 4 n 3455 4098',
'STATE 3 r 3385 4099',
'STATE 3 u 4101 4100',
'STATE 1 # 4103 4102',
'STATE 2 o 3399 4104',
'STATE 2 i 3385 4105',
'STATE 1 i 3385 3455',
'STATE 4 d 3522 4106',
'STATE 1 d 3385 4107',
'STATE 3 k 4109 4108',
'STATE 2 d 3455 4110',
'STATE 3 r 3455 4111',
'STATE 5 e 3399 3437',
'STATE 1 q 3455 4112',
'STATE 2 c 4113 3596',
'STATE 6 c 4115 4114',
'STATE 5 g 4117 4116',
'STATE 5 t 4119 4118',
'STATE 5 r 3399 4120',
'STATE 5 r 3385 3524',
'STATE 6 e 3524 3393',
'STATE 6 c 3385 4121',
'STATE 6 s 3494 3385',
'STATE 4 g 4123 4122',
'STATE 5 e 3455 4124',
'STATE 6 r 3385 4125',
'STATE 6 o 4127 4126',
'STATE 6 c 3522 3455',
'STATE 6 s 3393 3455',
'STATE 5 e 3389 4128',
'STATE 5 e 3444 4129',
'STATE 3 j 3600 3437',
'PHONE uw',
'STATE 4 c 4131 4130',
'STATE 6 r 4133 4132',
'STATE 6 r 4135 4134',
'STATE 4 g 3494 3455',
'STATE 6 u 3389 3385',
'STATE 3 s 4136 3399',
'STATE 6 c 3444 3399',
'STATE 1 t 3385 4137',
'STATE 3 r 3444 4138',
'STATE 3 d 3393 4139',
'STATE 3 l 3393 4140',
'STATE 3 l 3393 3385',
'STATE 1 t 3385 3393',
'STATE 1 0 4142 4141',
'STATE 6 l 3385 3399',
'STATE 6 y 3399 4143',
'STATE 6 t 3385 4144',
'STATE 3 g 3522 3385',
'STATE 2 r 3389 3399',
'STATE 6 s 4146 4145',
'STATE 6 # 3385 4147',
'STATE 6 e 3399 3385',
'STATE 4 a 4149 4148',
'STATE 3 v 4151 4150',
'STATE 2 c 3399 4152',
'STATE 3 m 3399 4153',
'STATE 4 o 3444 4154',
'STATE 3 z 3455 4155',
'STATE 2 t 3399 3455',
'STATE 3 p 3455 4156',
'STATE 1 o 3524 3455',
'STATE 2 a 3385 4157',
'STATE 4 p 3385 3522',
'STATE 3 r 4159 4158',
'STATE 3 h 3455 4160',
'STATE 1 a 3455 3385',
'STATE 1 i 3522 3455',
'STATE 3 a 3399 4161',
'STATE 2 g 3399 3444',
'STATE 1 z 3444 4162',
'STATE 1 r 3882 4163',
'STATE 5 i 4165 4164',
'STATE 3 o 3399 4166',
'STATE 4 u 4168 4167',
'STATE 4 k 3494 4169',
'STATE 6 l 3393 4170',
'STATE 3 d 3444 4171',
'STATE 6 c 3399 4172',
'STATE 2 s 3600 4173',
'STATE 2 n 4175 4174',
'STATE 3 a 3399 4176',
'STATE 3 h 3385 4177',
'STATE 6 t 3522 4178',
'STATE 3 u 4049 4179',
'STATE 1 # 3385 4180',
'STATE 2 o 3522 4181',
'STATE 5 c 4183 4182',
'STATE 3 u 4185 4184',
'STATE 5 a 4187 4186',
'STATE 1 l 3455 4188',
'STATE 1 a 3385 3522',
'STATE 1 # 4190 4189',
'STATE 6 r 3385 3455',
'STATE 3 c 3393 4191',
'STATE 6 e 4193 4192',
'STATE 3 n 3455 4194',
'STATE 3 l 3455 3399',
'STATE 3 j 3385 4195',
'STATE 3 u 3399 4196',
'STATE 6 n 3399 3385',
'STATE 3 l 3455 4197',
'STATE 2 s 3385 4198',
'STATE 4 l 4200 4199',
'STATE 2 q 3385 4201',
'STATE 6 a 4203 4202',
'STATE 2 p 3385 4204',
'STATE 3 r 3385 4205',
'STATE 1 d 3385 4206',
'STATE 1 o 3522 4207',
'STATE 3 w 3385 4208',
'STATE 3 v 3455 4209',
'STATE 1 o 3455 3522',
'STATE 2 g 3522 3455',
'STATE 3 g 3455 4210',
'STATE 6 r 3455 4211',
'STATE 1 s 3455 3399',
'STATE 4 m 4213 4212',
'STATE 4 l 3455 4214',
'STATE 6 e 4216 4215',
'STATE 6 l 3389 4217',
'STATE 6 # 4219 4218',
'STATE 3 o 3399 4220',
'STATE 3 l 4222 4221',
'STATE 6 m 3494 4223',
'STATE 5 p 4225 4224',
'STATE 6 o 3385 3494',
'STATE 5 i 4227 4226',
'STATE 6 n 3385 4228',
'STATE 6 y 3455 4229',
'STATE 5 m 3522 3385',
'STATE 5 a 3389 4230',
'STATE 5 a 3385 3389',
'STATE 4 g 4232 4231',
'STATE 5 u 3494 4233',
'STATE 4 s 4235 4234',
'STATE 4 f 3385 4236',
'STATE 4 m 3393 4237',
'STATE 4 m 3444 3455',
'STATE 5 n 3524 3399',
'STATE 1 l 4239 4238',
'STATE 5 n 3399 3385',
'STATE 3 p 3393 4240',
'STATE 6 a 3393 4241',
'STATE 5 t 4243 4242',
'STATE 5 d 4245 4244',
'STATE 6 i 3399 3385',
'STATE 3 s 3399 4246',
'STATE 3 d 3385 4247',
'STATE 3 t 3399 3385',
'STATE 3 t 3792 4248',
'STATE 4 o 3444 4249',
'STATE 3 y 3399 4250',
'STATE 1 # 4251 3399',
'STATE 1 u 3524 3399',
'STATE 1 a 4252 3399',
'STATE 3 y 3399 4253',
'STATE 4 e 3399 4254',
'STATE 3 x 3455 4255',
'STATE 3 g 3455 4256',
'STATE 4 c 3385 4257',
'STATE 1 b 3522 4258',
'STATE 2 o 3494 3522',
'STATE 1 u 3455 4259',
'STATE 3 l 4260 3399',
'STATE 1 s 3444 4261',
'STATE 1 t 3393 4262',
'STATE 4 y 3399 4263',
'STATE 6 a 4265 4264',
'STATE 2 p 4267 4266',
'STATE 4 c 4269 4268',
'STATE 5 m 3393 4270',
'STATE 3 o 3399 4271',
'STATE 3 k 3399 4272',
'STATE 5 r 3393 4273',
'STATE 6 l 4274 3399',
'STATE 3 l 3600 3399',
'STATE 6 s 4276 4275',
'STATE 6 a 3455 4277',
'STATE 3 u 3399 4278',
'STATE 6 # 3522 4279',
'STATE 1 r 3522 3385',
'STATE 2 n 4281 4280',
'STATE 3 b 4283 4282',
'STATE 2 e 3522 3385',
'STATE 3 o 4285 4284',
'STATE 6 e 4287 4286',
'STATE 3 o 3399 4288',
'STATE 2 q 3385 3399',
'STATE 5 o 3385 4289',
'STATE 2 e 3385 4290',
'STATE 1 b 3522 4291',
'STATE 3 m 3385 4292',
'STATE 6 l 3385 4293',
'STATE 1 o 3393 4294',
'STATE 4 n 4296 4295',
'STATE 4 n 4298 4297',
'STATE 6 n 3455 4299',
'STATE 3 z 3385 3600',
'STATE 2 s 3385 4300',
'STATE 4 s 4302 4301',
'STATE 4 s 3385 3455',
'STATE 6 i 3385 4303',
'STATE 3 f 3522 4304',
'STATE 2 h 3399 4305',
'STATE 1 d 3385 4306',
'STATE 2 o 3399 4307',
'STATE 2 c 3385 4308',
'STATE 1 a 3385 3399',
'STATE 6 r 4310 4309',
'STATE 4 l 4311 3385',
'STATE 3 v 3455 4312',
'STATE 3 m 3389 4313',
'STATE 2 r 3385 4314',
'STATE 5 a 3399 3579',
'STATE 4 q 4316 4315',
'STATE 5 b 4318 4317',
'STATE 4 v 3494 4319',
'STATE 5 e 3385 4320',
'STATE 5 t 3385 4321',
'STATE 6 r 3455 4322',
'STATE 5 u 4324 4323',
'STATE 5 e 3393 4325',
'STATE 6 a 4327 4326',
'STATE 5 l 3444 4328',
'STATE 6 e 3522 4329',
'STATE 6 l 3494 4330',
'STATE 4 p 4332 4331',
'STATE 6 e 3385 3389',
'STATE 6 m 3393 4333',
'STATE 6 m 3385 3455',
'STATE 5 e 3494 4334',
'STATE 6 t 3455 4335',
'STATE 5 o 4336 3385',
'STATE 4 q 4338 4337',
'STATE 5 r 3494 4339',
'STATE 5 i 3455 4340',
'STATE 4 c 3455 4341',
'STATE 6 n 3455 4342',
'STATE 4 s 3385 4343',
'STATE 4 l 4345 4344',
'STATE 3 c 4347 4346',
'STATE 3 n 3444 3393',
'STATE 2 t 3393 4348',
'STATE 6 t 3943 3393',
'STATE 2 a 4349 3399',
'STATE 3 b 4350 3399',
'STATE 3 p 3399 4351',
'STATE 6 a 3385 3399',
'STATE 3 c 3399 4352',
'STATE 3 s 3385 4353',
'STATE 6 l 4355 4354',
'STATE 3 i 3399 4356',
'STATE 1 a 3444 4357',
'STATE 3 r 3524 3399',
'STATE 2 n 3393 3399',
'STATE 3 f 3399 4358',
'STATE 4 y 3399 4359',
'STATE 3 i 3399 4360',
'STATE 3 c 3455 4361',
'STATE 4 x 3385 4362',
'STATE 3 p 3494 4363',
'STATE 1 a 4365 4364',
'STATE 2 a 4366 3399',
'STATE 1 n 3444 4367',
'STATE 1 l 3444 4368',
'STATE 6 n 4370 4369',
'STATE 6 c 4372 4371',
'STATE 2 s 3385 4373',
'STATE 3 u 4375 4374',
'STATE 4 u 3399 4376',
'STATE 5 h 4378 4377',
'STATE 5 k 4379 3385',
'STATE 5 x 4380 3399',
'STATE 4 s 4382 4381',
'STATE 5 l 3444 4383',
'STATE 5 d 3393 4384',
'STATE 3 n 3455 3399',
'STATE 5 i 4386 4385',
'STATE 5 e 3399 4387',
'STATE 3 g 4389 4388',
'STATE 5 e 4391 4390',
'STATE 6 e 3385 3455',
'STATE 6 e 4393 4392',
'STATE 6 e 3455 4394',
'STATE 2 r 4396 4395',
'STATE 1 a 3522 3385',
'STATE 5 z 4398 4397',
'STATE 1 b 3393 3399',
'STATE 6 y 3455 4399',
'STATE 1 o 3385 3455',
'STATE 2 e 3455 4400',
'STATE 1 # 3385 4401',
'STATE 3 l 3524 4402',
'STATE 2 e 3385 4403',
'STATE 1 e 3455 4404',
'STATE 3 h 3522 3459',
'STATE 1 a 3393 4405',
'STATE 4 l 3455 4406',
'STATE 1 i 4408 4407',
'STATE 4 l 3455 3385',
'STATE 1 l 3455 4409',
'STATE 1 n 3455 4410',
'STATE 4 t 3385 4411',
'STATE 4 u 3444 4412',
'STATE 3 s 3385 4413',
'STATE 2 d 3385 4414',
'STATE 6 i 3455 3385',
'STATE 6 e 3385 3399',
'STATE 2 i 3399 4415',
'STATE 2 i 3522 4359',
'STATE 2 q 3385 4416',
'STATE 2 n 4418 4417',
'STATE 3 c 4419 3455',
'STATE 3 f 3385 3522',
'STATE 3 r 4421 4420',
'STATE 2 b 3522 4422',
'STATE 2 n 4424 4423',
'STATE 4 v 4426 4425',
'STATE 6 a 3393 3494',
'STATE 5 a 4428 4427',
'STATE 6 l 3385 3522',
'STATE 4 d 3385 4429',
'STATE 5 u 3455 4430',
'STATE 5 d 3522 4431',
'STATE 6 a 3522 3385',
'STATE 5 i 4433 4432',
'STATE 4 g 4435 4434',
'STATE 5 a 4437 4436',
'STATE 3 b 3385 4438',
'STATE 3 t 3385 4439',
'STATE 6 a 3385 3393',
'STATE 6 o 3393 4440',
'STATE 5 p 4442 4441',
'STATE 4 f 3455 4443',
'STATE 5 r 4445 4444',
'STATE 5 h 3385 4446',
'STATE 6 l 4448 4447',
'STATE 6 r 4450 4449',
'STATE 6 n 3385 3389',
'STATE 4 f 4452 4451',
'STATE 6 i 3385 3494',
'STATE 6 o 3393 3385',
'STATE 6 n 3444 4453',
'STATE 6 a 4455 4454',
'STATE 6 m 3455 3444',
'STATE 4 p 3385 3444',
'STATE 6 # 3393 4456',
'STATE 6 t 3385 3455',
'STATE 3 h 3393 4457',
'STATE 1 # 3399 3393',
'STATE 5 l 3393 4458',
'STATE 1 c 3399 4459',
'STATE 6 a 3385 4460',
'STATE 6 a 4461 3399',
'STATE 3 g 3399 4097',
'STATE 3 c 3385 4462',
'STATE 3 p 4464 4463',
'STATE 3 p 3385 3399',
'STATE 4 i 3524 4465',
'STATE 2 d 3444 4466',
'STATE 3 b 4464 4467',
'STATE 2 a 3385 3455',
'STATE 2 e 3653 4468',
'STATE 1 b 3455 4469',
'STATE 4 z 3522 3385',
'STATE 1 h 3494 4470',
'STATE 1 # 4359 4471',
'STATE 3 c 3385 3455',
'STATE 1 d 3399 4472',
'STATE 1 p 3444 3399',
'STATE 1 y 3444 4473',
'STATE 5 k 4475 4474',
'STATE 4 m 4477 4476',
'STATE 6 o 4479 4478',
'STATE 4 t 3385 4480',
'STATE 2 e 4481 3393',
'STATE 4 u 3399 4482',
'STATE 2 q 4483 3399',
'STATE 4 v 4485 4484',
'STATE 5 y 4487 4486',
'STATE 4 s 3385 4488',
'STATE 3 b 4490 4489',
'PHONE ow1',
'STATE 4 t 4492 4491',
'STATE 2 a 4494 4493',
'STATE 5 w 3399 4495',
'STATE 2 c 3393 3882',
'STATE 6 n 4497 4496',
'STATE 6 a 4499 4498',
'STATE 3 h 3385 4500',
'STATE 5 e 3455 4501',
'STATE 6 c 3385 4502',
'STATE 5 a 4503 3385',
'STATE 2 e 3455 4504',
'STATE 2 s 4506 4505',
'STATE 3 c 3455 4507',
'STATE 6 y 3455 4508',
'STATE 2 a 4510 4509',
'STATE 3 d 3385 4511',
'STATE 5 i 4513 4512',
'STATE 6 o 3385 4514',
'STATE 2 e 3455 4515',
'STATE 3 c 3455 4516',
'STATE 5 z 3522 3385',
'STATE 3 r 3385 4517',
'STATE 3 s 3455 4518',
'STATE 1 a 3455 4519',
'STATE 2 a 3393 4520',
'STATE 6 o 3455 3399',
'STATE 6 u 3385 3455',
'STATE 2 s 3385 3455',
'STATE 2 n 3385 4521',
'STATE 2 t 4523 4522',
'STATE 3 r 3385 4297',
'STATE 3 k 3455 4524',
'STATE 3 c 3385 4525',
'STATE 1 v 4527 4526',
'STATE 3 v 4529 4528',
'STATE 3 r 3385 3399',
'STATE 2 t 3385 4530',
'STATE 6 o 3455 3385',
'STATE 1 o 3455 3385',
'STATE 3 f 3385 3455',
'STATE 1 e 3389 4531',
'STATE 3 r 3522 4532',
'STATE 1 a 3455 4533',
'STATE 3 t 3385 3455',
'STATE 4 c 4535 4534',
'STATE 6 r 3385 4536',
'STATE 6 l 4538 4537',
'STATE 6 n 3385 3393',
'STATE 4 p 3385 3494',
'STATE 5 i 3385 4539',
'STATE 5 v 3522 3385',
'STATE 5 a 4541 4540',
'STATE 6 o 3393 4542',
'STATE 4 c 4544 4543',
'STATE 3 b 3494 4545',
'STATE 5 o 4546 3385',
'STATE 4 n 3393 4547',
'STATE 6 u 4548 3385',
'STATE 3 p 3385 4549',
'STATE 5 n 4322 3385',
'STATE 5 h 4551 4550',
'STATE 6 a 3494 4552',
'STATE 6 r 4554 4553',
'STATE 5 a 3455 4555',
'STATE 6 e 3455 4556',
'STATE 5 k 3385 4557',
'STATE 5 a 3385 3494',
'STATE 5 a 3494 3385',
'STATE 5 g 3522 4558',
'STATE 5 o 3455 3522',
'STATE 5 u 4560 4559',
'STATE 5 r 3455 4561',
'STATE 6 a 3444 4562',
'STATE 4 b 3455 4563',
'STATE 4 p 3455 3444',
'STATE 6 b 3393 4564',
'STATE 5 k 4566 4565',
'STATE 1 # 3393 4567',
'STATE 3 l 3399 4568',
'STATE 6 o 4569 3399',
'STATE 5 s 3399 4570',
'STATE 6 t 3385 4571',
'STATE 1 0 3385 4572',
'STATE 1 e 3385 3399',
'STATE 4 z 4574 4573',
'STATE 1 c 3399 4575',
'STATE 2 s 3399 4576',
'STATE 3 j 3455 4577',
'STATE 3 r 4579 4578',
'STATE 2 a 3494 4580',
'STATE 3 k 3455 4581',
'STATE 1 n 3444 4582',
'STATE 2 h 4584 4583',
'STATE 2 e 4586 4585',
'STATE 6 e 4587 3385',
'STATE 5 e 4589 4588',
'STATE 2 p 3455 4590',
'STATE 4 d 4592 4591',
'STATE 2 i 3444 4593',
'STATE 4 v 3494 4594',
'STATE 4 d 3393 3455',
'STATE 4 y 4596 4595',
'STATE 4 b 3455 4597',
'STATE 6 m 3455 4598',
'STATE 5 i 3393 3494',
'STATE 3 o 3399 4599',
'STATE 3 l 3399 4600',
'STATE 1 # 3393 4601',
'STATE 2 l 3494 4602',
'STATE 2 e 3522 4603',
'STATE 4 y 3399 4604',
'STATE 3 l 3393 4605',
'STATE 1 a 3524 4606',
'STATE 3 n 3524 3393',
'STATE 3 c 3399 4607',
'STATE 3 o 4609 4608',
'STATE 2 i 3399 4610',
'STATE 2 i 4612 4611',
'STATE 2 o 3385 3393',
'STATE 1 # 3399 4613',
'STATE 5 a 3455 4614',
'STATE 5 o 3522 4615',
'STATE 2 r 3385 4616',
'STATE 2 a 3455 4001',
'STATE 6 s 3385 4617',
'STATE 1 # 3385 4618',
'STATE 3 b 3455 4619',
'STATE 3 c 3455 3385',
'STATE 1 i 3455 4620',
'STATE 3 v 3455 3385',
'STATE 3 r 4622 4621',
'STATE 5 n 4624 4623',
'STATE 6 n 3455 4625',
'STATE 1 l 3522 4626',
'STATE 3 r 3385 4627',
'STATE 2 o 3455 4628',
'STATE 3 h 3455 3393',
'STATE 2 r 3385 4629',
'STATE 6 r 4631 4630',
'STATE 1 e 3393 4632',
'STATE 3 p 3385 4420',
'STATE 3 c 4178 4633',
'STATE 1 s 3385 3455',
'STATE 4 l 4635 4634',
'STATE 3 r 4636 3455',
'STATE 2 s 4638 4637',
'STATE 4 t 3385 3494',
'STATE 1 f 3455 4639',
'STATE 2 l 3385 3455',
'STATE 1 s 3455 4640',
'STATE 2 e 3455 4641',
'STATE 2 l 3522 4642',
'STATE 1 r 4643 3455',
'STATE 4 g 4645 4644',
'STATE 5 o 3494 4646',
'STATE 5 e 4648 4647',
'STATE 5 e 3385 4649',
'STATE 5 p 3522 4650',
'STATE 5 c 4652 4651',
'STATE 5 e 4654 4653',
'STATE 3 m 4656 4655',
'STATE 6 a 4658 4657',
'STATE 4 q 4660 4659',
'STATE 6 r 3494 3385',
'PHONE ey',
'STATE 4 n 3524 3385',
'STATE 3 l 3393 4661',
'STATE 4 n 4662 3385',
'STATE 3 c 3522 4663',
'STATE 6 a 3385 4664',
'STATE 6 i 3494 4665',
'STATE 6 r 3494 4338',
'STATE 5 t 4667 4666',
'STATE 4 t 3455 4668',
'STATE 5 o 3455 4669',
'STATE 6 i 3455 3444',
'STATE 6 d 3494 4670',
'STATE 5 a 3385 4671',
'STATE 5 o 4673 4672',
'STATE 6 s 3393 4674',
'STATE 6 s 3455 4675',
'STATE 5 y 3444 4676',
'STATE 4 p 3455 4677',
'STATE 6 p 3393 4678',
'STATE 5 v 4680 4679',
'STATE 3 p 3393 4681',
'STATE 5 t 3444 3393',
'STATE 3 v 4245 3399',
'STATE 2 m 3399 3385',
'STATE 5 v 3399 4682',
'STATE 6 n 4683 3385',
'STATE 3 m 3385 4684',
'STATE 4 m 4686 4685',
'STATE 1 # 3385 4687',
'STATE 2 a 3393 4688',
'STATE 3 r 4689 3399',
'STATE 3 r 4691 4690',
'STATE 2 r 4693 4692',
'STATE 2 r 3455 3385',
'STATE 1 o 3494 4694',
'STATE 1 k 3455 4695',
'STATE 1 i 3444 3399',
'STATE 1 o 3444 4696',
'STATE 1 s 3444 4697',
'STATE 2 n 4699 4698',
'STATE 3 l 4701 4700',
'STATE 3 n 4703 4702',
'STATE 4 c 4705 4704',
'STATE 2 p 3455 4706',
'STATE 2 c 4708 4707',
'STATE 2 i 3399 4709',
'STATE 6 t 3728 4710',
'STATE 1 s 3385 3393',
'STATE 3 n 3455 4711',
'STATE 3 y 3399 4712',
'STATE 5 e 3399 3524',
'STATE 4 s 4545 3399',
'STATE 5 i 4714 4713',
'STATE 3 u 4716 4715',
'STATE 1 s 3399 3455',
'STATE 2 a 3455 3522',
'STATE 1 # 3385 4717',
'STATE 2 r 3522 3385',
'STATE 3 u 3399 3393',
'STATE 2 c 3393 4718',
'STATE 1 u 3524 3393',
'STATE 2 c 4720 4719',
'STATE 6 p 3385 4721',
'STATE 5 e 3455 3399',
'STATE 3 v 3399 4722',
'STATE 6 o 3393 4723',
'STATE 1 l 3399 4724',
'STATE 3 n 3455 3385',
'STATE 6 e 3455 4725',
'STATE 6 s 3455 4726',
'STATE 2 a 3385 4727',
'STATE 6 y 3455 3385',
'STATE 6 i 3385 4728',
'STATE 1 # 3385 4729',
'STATE 1 k 3455 4730',
'STATE 3 t 3524 3455',
'STATE 1 u 3455 4731',
'STATE 5 k 4733 4732',
'STATE 6 e 3475 3385',
'STATE 6 c 3385 4734',
'STATE 6 i 3385 4735',
'STATE 1 e 3455 4736',
'STATE 5 o 3455 4737',
'STATE 2 h 3522 4738',
'STATE 3 o 3399 4739',
'STATE 1 i 3455 3444',
'STATE 3 l 3393 4740',
'STATE 3 r 3385 4741',
'STATE 4 m 3455 4742',
'STATE 3 t 3455 4743',
'STATE 2 t 3455 4744',
'STATE 6 s 4746 4745',
'STATE 3 t 4747 3385',
'STATE 1 h 3399 4748',
'STATE 3 v 3385 4749',
'STATE 2 o 3455 3385',
'STATE 1 o 3522 4750',
'STATE 3 d 3455 3385',
'STATE 5 a 4297 4751',
'STATE 5 g 3385 4752',
'STATE 5 l 3494 4753',
'STATE 5 i 4755 4754',
'STATE 6 n 3393 3385',
'STATE 5 o 3389 4756',
'STATE 5 u 3385 4757',
'STATE 5 t 4759 4758',
'STATE 6 y 3455 3522',
'STATE 5 o 4761 4760',
'STATE 6 r 4763 4762',
'STATE 4 l 4765 4764',
'STATE 6 r 3455 4766',
'STATE 6 u 3393 4767',
'STATE 4 d 3393 4768',
'STATE 6 c 3455 4769',
'STATE 3 s 3393 4435',
'STATE 4 d 3524 4770',
'STATE 3 v 3522 3385',
'STATE 4 s 3385 4771',
'STATE 6 o 4773 4772',
'STATE 6 a 3494 3522',
'STATE 4 s 4775 4774',
'STATE 6 a 3444 3385',
'STATE 4 s 3455 4776',
'STATE 5 u 3385 3455',
'STATE 5 l 3494 4777',
'STATE 5 l 3385 4778',
'STATE 5 r 4780 4779',
'STATE 6 s 3393 4781',
'STATE 6 b 3444 4782',
'STATE 5 i 4784 4783',
'STATE 6 u 4786 4785',
'STATE 6 e 3455 4787',
'STATE 4 p 4789 4788',
'STATE 2 c 4791 4790',
'STATE 1 e 3385 3393',
'STATE 3 r 3393 4792',
'STATE 3 v 3399 4793',
'STATE 3 b 3385 3389',
'STATE 3 h 3385 4794',
'STATE 4 u 3399 4795',
'STATE 1 # 3385 3455',
'STATE 1 i 3522 4796',
'STATE 1 # 3393 4797',
'STATE 2 f 3455 4798',
'STATE 2 l 3399 4799',
'STATE 2 a 3399 4800',
'STATE 1 e 3455 4801',
'STATE 3 n 3385 3522',
'STATE 2 i 3494 4802',
'STATE 2 u 4803 3455',
'STATE 1 s 4804 3393',
'STATE 1 c 3444 3393',
'STATE 4 t 4806 4805',
'STATE 5 r 3455 4807',
'STATE 5 e 4809 4808',
'STATE 6 i 3385 3455',
'STATE 3 d 3494 3385',
'STATE 1 e 3494 3522',
'STATE 4 t 4811 4810',
'STATE 2 o 3385 4812',
'STATE 4 s 3444 3455',
'STATE 2 e 4813 3399',
'STATE 3 r 3455 3399',
'STATE 2 a 4815 4814',
'STATE 1 n 3399 4816',
'STATE 4 m 3385 4817',
'STATE 4 x 4819 4818',
'STATE 4 c 4821 4820',
'STATE 6 e 3522 4822',
'STATE 5 z 4824 4823',
'STATE 5 a 3385 3399',
'STATE 1 e 3385 4825',
'STATE 3 r 3444 3393',
'STATE 6 t 3399 4826',
'STATE 1 n 3399 3444',
'STATE 2 s 4686 4827',
'STATE 1 # 3385 4828',
'STATE 1 f 3399 4829',
'STATE 6 n 3399 4830',
'STATE 6 n 3455 4831',
'STATE 5 i 3522 4832',
'STATE 2 n 3385 3455',
'STATE 1 a 4833 3385',
'STATE 3 v 4803 3385',
'STATE 2 o 3455 4834',
'STATE 1 o 3455 4835',
'STATE 5 g 4837 4836',
'STATE 1 o 3455 4838',
'STATE 6 e 3393 4839',
'STATE 3 l 3522 3385',
'STATE 1 n 3455 4840',
'STATE 2 a 4701 4841',
'STATE 2 a 4842 3385',
'STATE 1 o 3455 4843',
'STATE 3 r 3393 3444',
'STATE 3 s 3385 4844',
'STATE 4 t 4846 4845',
'STATE 3 p 3385 3455',
'STATE 2 p 3385 4847',
'STATE 1 t 3455 3385',
'STATE 4 t 3455 3385',
'STATE 6 e 3522 3385',
'STATE 6 r 4849 4848',
'STATE 1 a 4851 4850',
'STATE 2 p 3522 4852',
'STATE 4 s 4854 4853',
'STATE 5 l 3385 4855',
'STATE 5 c 3494 3385',
'STATE 6 n 3385 4856',
'STATE 6 l 3393 3385',
'STATE 6 o 3389 4857',
'STATE 5 i 3522 3385',
'STATE 5 d 4859 4858',
'STATE 6 a 3522 4860',
'STATE 5 r 4862 4861',
'STATE 4 g 4274 4863',
'STATE 3 t 4865 4864',
'STATE 3 g 3385 4866',
'STATE 3 p 3385 4867',
'STATE 6 n 3385 4868',
'STATE 4 g 3385 4869',
'STATE 3 b 4871 4870',
'STATE 4 n 3393 3385',
'STATE 3 s 3385 4872',
'STATE 3 m 3385 4873',
'STATE 4 t 3385 3522',
'STATE 6 r 4773 4874',
'STATE 5 t 3494 3385',
'STATE 5 u 4876 4875',
'STATE 5 e 3522 4877',
'STATE 5 a 3455 3385',
'STATE 5 r 3494 4878',
'STATE 5 o 3385 4879',
'STATE 4 d 4881 4880',
'STATE 6 o 4883 4882',
'STATE 4 s 4885 4884',
'STATE 4 d 3455 4886',
'STATE 5 l 3455 4887',
'STATE 6 n 3455 3444',
'STATE 6 v 3494 4888',
'STATE 5 o 3494 3455',
'STATE 6 m 3455 4889',
'STATE 6 c 3455 4890',
'STATE 6 c 3393 3444',
'STATE 2 r 4892 4891',
'STATE 5 t 3444 4893',
'STATE 3 n 3393 4894',
'STATE 3 h 3399 4895',
'STATE 1 # 3385 4896',
'STATE 3 o 3399 4897',
'STATE 3 u 3385 3522',
'STATE 3 n 3444 4898',
'STATE 2 d 3455 3399',
'STATE 1 i 3399 4899',
'STATE 2 d 3524 3399',
'STATE 1 i 3385 4900',
'STATE 2 u 3494 4901',
'STATE 1 r 3455 3385',
'STATE 2 l 3393 3444',
'STATE 4 d 4903 4902',
'STATE 5 e 4905 4904',
'STATE 3 t 4907 4906',
'STATE 4 u 3399 4908',
'STATE 4 v 3494 4909',
'STATE 3 t 4911 4910',
'STATE 5 a 3522 3399',
'STATE 5 o 4913 4912',
'STATE 5 a 3399 3455',
'STATE 6 l 4915 4914',
'STATE 3 t 3455 3399',
'STATE 2 m 3385 4916',
'STATE 3 m 3385 4917',
'STATE 5 e 4919 4918',
'STATE 3 n 3494 4776',
'STATE 3 r 4920 3385',
'STATE 5 e 3455 4921',
'STATE 6 c 3455 4922',
'STATE 4 d 4924 4923',
'STATE 1 # 3385 3522',
'STATE 2 h 3385 4925',
'STATE 5 n 3444 4926',
'STATE 6 h 3385 4927',
'STATE 5 a 4928 3455',
'STATE 6 c 4930 4929',
'STATE 3 d 3385 3399',
'STATE 1 i 3385 4931',
'STATE 1 e 3522 3455',
'STATE 6 a 3385 3455',
'STATE 2 e 3455 4932',
'STATE 1 e 3455 3524',
'STATE 5 u 4934 4933',
'STATE 6 t 3385 4935',
'STATE 6 e 3385 4936',
'STATE 6 a 3393 4937',
'STATE 2 i 3455 4938',
'STATE 5 a 3455 4939',
'STATE 3 m 3385 4686',
'STATE 3 v 3455 3399',
'STATE 3 l 3385 4420',
'STATE 4 d 4930 4343',
'STATE 3 s 3385 3455',
'STATE 1 n 3455 4940',
'STATE 1 c 3522 4941',
'STATE 1 e 3385 4942',
'STATE 1 l 4944 4943',
'STATE 2 c 3385 4945',
'STATE 1 e 3522 4946',
'STATE 4 l 4948 4947',
'STATE 6 a 4950 4949',
'STATE 6 e 3385 4951',
'STATE 5 a 3494 4952',
'STATE 6 s 3385 4953',
'STATE 5 o 3455 4954',
'STATE 6 a 3522 4955',
'STATE 6 h 3522 4956',
'STATE 3 o 3399 4957',
'STATE 4 t 4959 4958',
'STATE 4 c 4961 4960',
'STATE 4 v 4963 4962',
'STATE 4 l 3385 4964',
'STATE 3 p 4966 4965',
'STATE 4 c 3494 4967',
'STATE 3 v 3522 4968',
'STATE 6 n 3385 4969',
'STATE 4 v 3385 4970',
'STATE 6 e 3455 4971',
'STATE 3 l 3522 4972',
'STATE 4 t 3385 3524',
'STATE 5 t 3494 4973',
'STATE 5 a 4975 4974',
'STATE 4 b 3385 3455',
'STATE 6 e 3455 4976',
'STATE 5 a 3494 4977',
'STATE 5 e 3385 4978',
'STATE 4 m 4881 4979',
'STATE 5 i 4980 3385',
'STATE 4 p 4981 3444',
'STATE 4 t 3385 4982',
'STATE 4 b 3444 4983',
'STATE 6 u 3444 4984',
'STATE 6 m 3455 4985',
'STATE 6 r 3455 4986',
'STATE 6 r 3455 4987',
'STATE 4 l 4989 4988',
'STATE 4 c 3444 4990',
'STATE 2 l 3399 4991',
'STATE 5 l 3393 3444',
'STATE 1 a 3399 4992',
'STATE 6 # 3399 3393',
'STATE 3 g 3399 4993',
'STATE 6 c 3399 3385',
'STATE 3 u 3399 4994',
'STATE 2 r 3393 4995',
'STATE 2 n 3399 4996',
'STATE 2 m 3455 4997',
'STATE 1 r 3494 4998',
'STATE 5 c 3385 4999',
'STATE 5 g 5001 5000',
'STATE 6 r 3455 5002',
'STATE 3 m 3455 5003',
'STATE 4 b 4274 5004',
'STATE 5 p 3385 5005',
'STATE 3 n 5007 5006',
'STATE 6 r 3444 5008',
'STATE 2 e 3455 5009',
'STATE 5 a 3522 3455',
'STATE 5 h 3455 3399',
'STATE 1 c 3385 3455',
'STATE 4 f 5011 5010',
'STATE 2 e 3385 4274',
'STATE 3 p 3393 5012',
'STATE 3 d 3385 5013',
'STATE 2 a 5015 5014',
'STATE 4 s 3399 5016',
'STATE 6 r 5018 5017',
'STATE 6 n 3393 5019',
'STATE 4 s 3455 5020',
'STATE 4 j 3524 5021',
'STATE 5 i 3385 5022',
'STATE 3 n 3385 5023',
'STATE 1 g 3399 3444',
'STATE 6 d 3455 5024',
'STATE 2 o 3399 3455',
'STATE 1 # 5026 5025',
'STATE 3 r 3455 3385',
'STATE 1 e 3385 5027',
'STATE 1 r 3455 5028',
'STATE 5 o 3455 5029',
'STATE 3 t 3385 4727',
'STATE 1 e 3494 5030',
'STATE 2 o 3385 5027',
'STATE 2 u 3455 5031',
'STATE 1 i 3455 3385',
'STATE 2 u 3522 5032',
'STATE 2 g 3385 5033',
'STATE 2 l 3399 5034',
'STATE 2 c 3455 5035',
'STATE 2 m 3522 5036',
'STATE 3 m 3385 3522',
'STATE 6 i 4579 5037',
'STATE 3 h 3522 5038',
'STATE 5 f 5037 5039',
'STATE 5 i 5041 5040',
'STATE 5 c 5043 5042',
'STATE 5 t 3455 5044',
'STATE 5 e 3385 3393',
'STATE 6 l 3494 3385',
'STATE 6 g 3385 5045',
'STATE 5 a 3522 5046',
'STATE 6 o 3522 3385',
'STATE 6 i 3522 5047',
'STATE 6 a 5049 5048',
'STATE 4 h 5051 5050',
'STATE 3 b 3455 5052',
'STATE 3 h 5054 5053',
'STATE 6 m 3494 3385',
'STATE 4 g 5056 5055',
'STATE 6 n 3385 5057',
'STATE 4 n 3385 3455',
'STATE 4 d 3385 5058',
'STATE 4 t 3393 3385',
'STATE 6 l 5060 5059',
'STATE 6 g 3455 5061',
'STATE 6 m 3385 5062',
'STATE 4 t 5064 5063',
'STATE 6 n 3385 5065',
'STATE 6 s 3455 5066',
'STATE 6 h 3494 5067',
'STATE 5 e 5069 5068',
'STATE 6 t 3455 5070',
'STATE 5 i 5071 4776',
'STATE 6 n 3444 3385',
'STATE 5 b 3522 3385',
'STATE 5 i 5073 5072',
'STATE 6 s 3444 3385',
'STATE 6 e 3385 3444',
'STATE 4 p 3444 3385',
'STATE 4 p 3455 5074',
'STATE 6 l 3444 3455',
'STATE 6 i 3444 5075',
'STATE 5 u 3455 3385',
'STATE 6 i 5076 3385',
'STATE 4 m 3385 5077',
'STATE 6 n 3455 3385',
'STATE 6 t 3393 3444',
'STATE 3 n 3399 5078',
'STATE 6 s 3385 3393',
'STATE 3 b 3399 5079',
'STATE 4 c 5081 5080',
'STATE 1 n 3444 5082',
'STATE 2 a 5083 3399',
'STATE 2 a 3385 5084',
'STATE 3 b 3494 3522',
'STATE 6 t 5086 5085',
'STATE 6 y 3455 5087',
'STATE 1 o 3494 3385',
'STATE 3 k 3455 5088',
'STATE 3 k 3455 5089',
'STATE 3 d 5091 5090',
'STATE 1 o 3522 3455',
'STATE 1 r 5093 5092',
'STATE 6 t 3494 5094',
'STATE 6 d 3393 3455',
'STATE 4 s 5096 5095',
'STATE 3 s 3385 5097',
'STATE 2 e 3455 5098',
'STATE 3 c 3393 3455',
'STATE 3 l 3455 3393',
'STATE 2 i 5100 5099',
'STATE 5 o 3399 5101',
'STATE 6 s 3393 5102',
'STATE 6 n 5104 5103',
'STATE 4 p 3444 5105',
'STATE 6 u 3494 3444',
'STATE 4 c 3455 5106',
'STATE 5 a 5108 5107',
'STATE 5 o 3524 5109',
'STATE 2 c 3385 3494',
'STATE 5 e 5111 5110',
'STATE 6 n 5113 5112',
'STATE 3 m 3522 5114',
'STATE 6 o 3385 3455',
'STATE 3 s 3455 5115',
'STATE 3 u 3399 5116',
'STATE 6 e 3455 5117',
'STATE 2 l 3455 5118',
'STATE 5 h 3455 3385',
'STATE 2 d 3385 3455',
'STATE 2 q 3385 5119',
'STATE 2 e 3455 3399',
'STATE 2 a 5121 5120',
'STATE 6 e 3455 3385',
'STATE 1 u 3455 5122',
'STATE 6 l 3385 5123',
'STATE 5 u 3455 5124',
'STATE 6 a 3455 5125',
'STATE 6 o 3385 5126',
'STATE 6 h 3385 5127',
'STATE 5 c 3385 5128',
'STATE 5 m 3385 5129',
'STATE 6 o 5131 5130',
'STATE 6 r 3522 4955',
'STATE 4 n 5133 5132',
'STATE 3 s 5134 3385',
'STATE 4 d 5136 5135',
'STATE 6 a 3524 3385',
'STATE 6 o 3385 5137',
'STATE 6 s 5139 5138',
'STATE 6 r 3385 5140',
'STATE 6 o 3393 5141',
'STATE 3 b 3494 3385',
'STATE 6 l 3385 5142',
'STATE 3 f 3393 5143',
'STATE 4 p 3385 5144',
'STATE 4 g 3393 5145',
'STATE 3 b 3455 4045',
'STATE 6 c 3385 5146',
'STATE 4 g 5064 5147',
'STATE 6 t 3455 3385',
'STATE 6 s 3385 5148',
'STATE 6 d 3455 3385',
'STATE 5 c 3494 5149',
'STATE 5 o 5151 5150',
'STATE 4 t 3455 5152',
'STATE 4 t 3455 5153',
'STATE 6 g 3455 3385',
'STATE 4 s 5155 5154',
'STATE 4 s 5157 5156',
'STATE 4 m 3455 5158',
'STATE 4 p 5160 5159',
'STATE 5 t 3385 3494',
'STATE 6 p 3393 5161',
'STATE 1 r 3393 5162',
'STATE 3 f 3399 5163',
'STATE 2 r 3385 5164',
'STATE 2 a 3494 4824',
'STATE 2 o 3444 5165',
'STATE 3 l 5166 3399',
'STATE 2 i 3963 5167',
'STATE 4 g 5169 5168',
'STATE 5 h 5171 5170',
'STATE 1 s 3385 5172',
'STATE 6 e 5174 5173',
'STATE 2 p 5176 5175',
'STATE 1 u 5178 5177',
'STATE 1 a 3455 4701',
'STATE 3 g 3455 5179',
'STATE 4 m 3385 5180',
'STATE 5 r 3455 4776',
'STATE 4 b 3399 5181',
'STATE 3 l 3399 3455',
'STATE 3 r 5183 5182',
'STATE 6 n 3399 5096',
'STATE 4 q 5185 5184',
'STATE 3 n 5186 5113',
'STATE 3 r 3522 5187',
'STATE 6 r 5189 5188',
'STATE 4 p 5191 5190',
'STATE 4 s 3385 3444',
'STATE 4 f 3385 5192',
'STATE 4 d 3393 4992',
'STATE 5 o 5194 5193',
'STATE 4 m 5196 5195',
'STATE 3 r 3385 5197',
'STATE 5 o 3455 5198',
'STATE 3 c 3385 5199',
'STATE 2 a 3455 3579',
'STATE 3 c 3399 3455',
'STATE 3 r 3455 5200',
'STATE 2 n 3455 5201',
'STATE 5 h 3455 5202',
'STATE 3 s 3455 5203',
'STATE 6 t 3385 5204',
'STATE 3 t 3385 5205',
'STATE 6 a 5207 5206',
'STATE 6 i 5209 5208',
'STATE 1 r 3455 3522',
'STATE 5 h 3385 5210',
'STATE 5 o 3455 5211',
'STATE 6 m 3455 5212',
'STATE 5 s 3385 5213',
'STATE 6 o 3385 3522',
'STATE 5 p 3522 3385',
'STATE 5 i 5215 5214',
'STATE 5 l 5217 5216',
'STATE 5 f 3522 5218',
'STATE 6 u 5219 3385',
'STATE 3 m 5221 5220',
'STATE 5 s 3522 3385',
'STATE 4 n 3385 5222',
'STATE 3 p 4545 4701',
'STATE 6 u 3522 3385',
'STATE 6 l 3385 5223',
'STATE 4 l 3522 3393',
'STATE 6 t 3385 3393',
'STATE 3 b 5225 5224',
'STATE 3 l 3385 3494',
'STATE 4 v 3385 5226',
'STATE 6 v 5228 5227',
'STATE 4 f 3455 5229',
'STATE 6 p 3385 5230',
'STATE 3 v 3385 5231',
'STATE 6 t 3455 5232',
'STATE 6 n 3494 3385',
'STATE 4 n 3385 5233',
'STATE 4 n 3455 5234',
'STATE 4 n 3389 4876',
'STATE 4 b 3455 3385',
'STATE 4 o 3444 5235',
'STATE 6 o 3455 5236',
'STATE 4 w 3444 5237',
'STATE 6 s 3455 5238',
'STATE 4 d 3455 3444',
'STATE 4 s 4090 3455',
'STATE 6 t 3385 3444',
'STATE 6 s 3393 5239',
'STATE 2 i 3399 5240',
'STATE 5 n 3385 3399',
'STATE 2 p 3385 5241',
'STATE 3 h 3393 3444',
'STATE 1 r 3522 3399',
'STATE 3 d 3385 5242',
'STATE 4 v 5244 5243',
'STATE 5 a 5246 5245',
'STATE 3 s 5248 5247',
'STATE 2 b 3494 5249',
'STATE 6 w 3399 5250',
'STATE 1 e 5252 5251',
'STATE 5 h 3385 5253',
'STATE 6 r 5255 5254',
'STATE 3 l 3393 3455',
'STATE 4 f 3399 5256',
'STATE 6 r 3455 5257',
'STATE 1 v 3494 5258',
'STATE 5 o 3385 3455',
'STATE 4 h 3399 5259',
'STATE 6 n 5261 5260',
'STATE 2 t 3385 4727',
'STATE 5 a 5263 5262',
'STATE 2 f 3393 3494',
'STATE 4 f 3455 3385',
'STATE 3 l 4545 5264',
'STATE 4 v 5266 5265',
'STATE 2 f 3385 5267',
'STATE 6 d 5269 5268',
'STATE 5 a 3444 3385',
'STATE 4 s 3455 3444',
'STATE 5 i 3385 5270',
'STATE 3 r 3385 5271',
'STATE 4 b 3393 5272',
'STATE 3 n 3455 5273',
'STATE 2 a 3524 5271',
'STATE 5 k 3385 5274',
'STATE 2 r 3385 5275',
'STATE 6 n 5276 3399',
'STATE 2 p 3455 5277',
'STATE 2 o 3455 5278',
'STATE 6 a 3524 3455',
'STATE 6 s 3385 3455',
'STATE 3 d 3455 5279',
'STATE 2 o 5280 3385',
'STATE 3 t 3455 5281',
'STATE 3 m 3385 5282',
'STATE 1 v 3455 3522',
'STATE 4 d 3385 5283',
'STATE 5 l 3385 5284',
'STATE 6 z 3389 5285',
'STATE 5 t 3385 5286',
'STATE 6 t 3385 5287',
'STATE 6 n 3385 3522',
'STATE 5 r 3522 5288',
'STATE 6 a 3455 3522',
'STATE 5 j 3522 5289',
'STATE 3 s 3494 3385',
'STATE 3 z 3385 5290',
'STATE 6 e 3385 5291',
'STATE 3 b 3455 5292',
'STATE 4 m 5294 5293',
'STATE 4 h 3393 5295',
'STATE 4 n 3385 5296',
'STATE 4 m 3385 5297',
'STATE 4 m 5299 5298',
'STATE 4 h 3455 4545',
'STATE 4 v 4545 3455',
'STATE 4 t 5301 5300',
'STATE 6 l 3522 5302',
'STATE 4 n 3455 3385',
'STATE 4 d 3385 5303',
'STATE 6 n 5304 4746',
'STATE 5 l 5306 5305',
'STATE 6 i 5308 5307',
'STATE 4 t 5310 5309',
'STATE 6 g 3385 3455',
'STATE 6 n 5311 3444',
'STATE 1 o 3399 5312',
'STATE 1 n 5314 5313',
'STATE 1 a 3455 5315',
'STATE 4 m 5317 5316',
'STATE 5 a 4545 5318',
'STATE 3 r 5320 5319',
'STATE 6 l 3393 3494',
'STATE 2 g 3455 5321',
'STATE 1 e 3455 3494',
'STATE 2 k 3494 3385',
'STATE 6 s 3393 5322',
'STATE 5 c 3385 5323',
'STATE 5 r 3455 3385',
'STATE 3 t 3522 3399',
'STATE 6 d 3455 3399',
'STATE 2 a 3455 3399',
'STATE 5 u 3455 5324',
'STATE 4 c 3385 3444',
'STATE 4 g 5326 5325',
'STATE 2 c 3455 5327',
'STATE 4 s 5329 5328',
'STATE 4 t 3455 5330',
'STATE 2 o 5332 5331',
'STATE 3 a 3399 5333',
'STATE 3 n 3455 5334',
'STATE 4 d 4648 3385',
'STATE 6 n 5335 3393',
'STATE 4 v 3385 5336',
'STATE 5 e 3393 5337',
'STATE 4 j 3385 3444',
'STATE 5 r 3385 5338',
'STATE 1 # 3393 3524',
'STATE 1 a 3385 5339',
'STATE 3 d 3385 3393',
'STATE 6 a 3455 5340',
'STATE 2 c 3455 5341',
'STATE 2 e 3455 3385',
'STATE 1 t 3455 5342',
'STATE 1 h 3455 5343',
'STATE 2 e 4745 3385',
'STATE 1 p 3385 5344',
'STATE 2 u 3385 5345',
'STATE 1 p 3455 3385',
'STATE 5 i 5347 5346',
'STATE 5 e 3385 5348',
'STATE 6 s 3455 3385',
'STATE 6 i 5128 3385',
'STATE 6 h 3385 5349',
'STATE 5 h 3522 5350',
'STATE 5 r 3522 3385',
'STATE 5 d 4662 3385',
'STATE 5 s 3385 5351',
'STATE 4 l 3385 5352',
'STATE 4 l 5354 5353',
'STATE 6 n 3385 5334',
'STATE 6 d 4545 5355',
'STATE 6 a 3455 5356',
'STATE 4 t 5357 3385',
'STATE 4 d 5359 5358',
'STATE 6 n 3393 5360',
'STATE 6 l 3385 5232',
'STATE 6 l 3385 3455',
'STATE 3 s 3385 5361',
'STATE 6 a 3455 5362',
'STATE 4 t 3385 3455',
'STATE 5 y 3444 3385',
'STATE 6 i 3385 3444',
'STATE 5 p 3455 5363',
'STATE 5 c 3455 3385',
'STATE 4 l 3455 3444',
'STATE 6 r 3455 3385',
'STATE 4 g 3444 3385',
'STATE 1 # 5365 5364',
'STATE 1 # 5367 5366',
'STATE 4 x 3385 3455',
'STATE 1 o 4727 3385',
'STATE 4 x 3385 5368',
'STATE 5 a 5370 5369',
'STATE 3 s 3455 5371',
'STATE 5 o 5373 5372',
'STATE 2 g 3522 3385',
'STATE 1 t 3399 5374',
'STATE 5 r 5376 5375',
'STATE 5 r 5378 5377',
'STATE 3 n 3455 5379',
'STATE 4 s 3385 5380',
'STATE 1 d 3385 3455',
'STATE 4 d 3455 5381',
'STATE 2 l 3399 5382',
'STATE 1 a 3393 3455',
'STATE 3 h 3455 5383',
'STATE 5 u 5385 5384',
'STATE 6 n 3455 5386',
'STATE 2 e 3455 5387',
'STATE 3 m 3385 3455',
'STATE 3 l 3385 3393',
'STATE 3 a 3385 5388',
'STATE 6 a 3385 5389',
'STATE 1 # 3385 5390',
'STATE 4 t 5392 5391',
'STATE 5 a 4686 5393',
'STATE 3 t 3399 5394',
'STATE 3 m 3455 5395',
'STATE 1 c 3455 5396',
'STATE 6 i 3522 3385',
'STATE 3 s 3455 3385',
'STATE 4 t 3385 5397',
'STATE 6 t 3385 5398',
'STATE 5 y 3385 5399',
'STATE 6 e 3385 5128',
'STATE 6 u 3522 5400',
'STATE 6 i 3385 5401',
'STATE 4 c 3944 5402',
'STATE 6 n 4964 5403',
'STATE 3 b 3455 5404',
'STATE 4 l 5406 5405',
'STATE 4 d 3455 3385',
'STATE 3 h 3385 5407',
'STATE 4 b 5345 5408',
'STATE 3 s 3455 3393',
'STATE 3 l 3455 3385',
'STATE 3 h 3385 5409',
'STATE 6 e 3385 5410',
'STATE 6 r 3444 5411',
'STATE 2 u 3444 5412',
'STATE 3 l 5414 5413',
'STATE 2 s 3494 5415',
'STATE 3 r 3385 5416',
'STATE 4 q 5418 5417',
'STATE 5 e 5420 5419',
'STATE 6 k 3399 5421',
'STATE 3 r 5423 5422',
'STATE 3 l 5425 5424',
'STATE 6 r 3455 5426',
'STATE 2 o 3399 5427',
'STATE 3 c 3393 5428',
'STATE 2 a 3393 3385',
'STATE 2 o 3399 5429',
'STATE 6 i 5334 5430',
'STATE 6 e 3399 5431',
'STATE 1 l 3524 5432',
'STATE 4 p 3399 5433',
'STATE 1 o 3385 5434',
'STATE 4 s 3522 5435',
'STATE 5 i 5437 5436',
'STATE 4 c 5276 4416',
'STATE 5 i 3393 3524',
'STATE 3 r 5439 5438',
'STATE 4 g 3393 5440',
'STATE 6 e 3385 5441',
'STATE 1 c 3385 5442',
'STATE 3 r 3393 5443',
'STATE 1 # 3393 3385',
'STATE 3 c 3455 5444',
'STATE 3 d 3455 5445',
'STATE 3 h 3455 5446',
'STATE 3 d 3455 5447',
'STATE 5 o 3385 5448',
'STATE 6 s 3389 3385',
'STATE 5 v 3385 5449',
'STATE 5 v 3522 5450',
'STATE 5 d 3522 3385',
'STATE 6 e 3385 5451',
'STATE 3 g 3385 5452',
'STATE 6 d 3385 5453',
'STATE 6 z 3385 5454',
'STATE 6 c 3455 5455',
'STATE 3 v 3385 3393',
'STATE 6 s 3393 5456',
'STATE 4 l 5458 5457',
'STATE 4 b 5460 5459',
'STATE 6 a 3444 5461',
'STATE 5 t 4697 5462',
'STATE 2 g 3399 3393',
'STATE 6 o 3399 3393',
'STATE 3 w 3385 5463',
'STATE 2 a 3522 3385',
'STATE 1 i 5465 5464',
'STATE 1 a 3494 5466',
'STATE 5 b 5468 5467',
'STATE 3 r 3393 5469',
'STATE 1 a 3455 5470',
'STATE 6 r 3385 4042',
'STATE 1 i 3385 3522',
'STATE 3 u 3399 5471',
'STATE 5 r 3522 5472',
'STATE 2 a 3399 3455',
'STATE 2 t 5474 5473',
'STATE 3 p 3393 5475',
'STATE 1 r 3455 5476',
'STATE 6 y 3455 3399',
'STATE 1 o 3385 5477',
'STATE 3 s 3455 5478',
'STATE 2 o 3494 3455',
'STATE 4 x 3385 5479',
'STATE 2 n 3494 3385',
'STATE 5 o 5481 5480',
'STATE 6 e 5483 5482',
'STATE 4 h 3385 5484',
'STATE 2 c 3393 3385',
'STATE 3 r 3393 3399',
'STATE 4 s 3385 5485',
'STATE 1 s 3385 3522',
'STATE 2 a 3385 4499',
'STATE 3 k 3455 5486',
'STATE 6 r 3455 3647',
'STATE 3 z 3455 5487',
'STATE 3 h 3455 5488',
'STATE 5 l 3385 5489',
'STATE 6 r 5491 5490',
'STATE 6 i 3385 5134',
'STATE 3 n 3393 3385',
'STATE 6 p 3385 5492',
'STATE 6 n 4311 3385',
'STATE 3 w 3385 5493',
'STATE 3 m 3455 5494',
'STATE 6 r 5496 5495',
'STATE 6 e 3393 5497',
'STATE 3 f 3455 5498',
'STATE 4 t 3385 3444',
'STATE 5 i 3455 3385',
'STATE 6 h 3444 3385',
'STATE 3 l 3393 5499',
'STATE 1 a 5501 5500',
'STATE 4 j 3399 5502',
'STATE 3 r 5504 5503',
'STATE 6 e 3393 3455',
'STATE 5 u 3455 5505',
'STATE 2 s 3385 4833',
'STATE 3 h 3393 5506',
'STATE 6 r 5426 3455',
'STATE 6 e 3494 5507',
'STATE 2 l 3455 3385',
'STATE 4 m 3455 5508',
'STATE 3 h 3455 3385',
'STATE 5 n 3455 5509',
'STATE 6 a 3455 5510',
'STATE 1 e 3385 5511',
'STATE 4 c 3385 5512',
'STATE 2 p 3455 5513',
'STATE 2 u 3455 5514',
'STATE 3 r 3385 5515',
'STATE 3 h 5516 3385',
'STATE 2 c 3385 3393',
'STATE 3 l 3385 5517',
'STATE 5 a 3452 3385',
'STATE 5 v 3385 5518',
'STATE 1 u 3455 5519',
'STATE 3 p 3385 5520',
'STATE 4 h 3385 5521',
'STATE 6 o 3385 5522',
'STATE 5 d 3385 3522',
'STATE 6 y 3385 5523',
'STATE 6 s 5525 5524',
'STATE 6 b 3385 5526',
'STATE 3 l 3385 5527',
'STATE 4 g 3522 3385',
'STATE 3 m 3385 5528',
'STATE 6 n 3455 5529',
'STATE 6 # 5530 3393',
'STATE 2 t 3385 5531',
'STATE 4 v 3522 3385',
'STATE 1 e 5533 5532',
'STATE 4 b 3455 5534',
'STATE 4 p 5535 3455',
'STATE 3 m 3385 5536',
'STATE 6 r 3399 3455',
'STATE 5 r 3399 5537',
'STATE 4 g 3455 3399',
'STATE 5 a 3455 5538',
'STATE 5 o 3399 5539',
'STATE 3 c 5540 3385',
'STATE 1 h 3399 5304',
'STATE 3 l 5035 5541',
'STATE 6 a 3385 5542',
'STATE 4 m 3455 3385',
'STATE 4 m 3385 3393',
'STATE 4 f 3385 5543',
'STATE 6 i 3385 5544',
'STATE 3 n 4913 5545',
'STATE 5 f 3455 5546',
'STATE 5 p 3385 5547',
'STATE 5 g 3522 3385',
'STATE 4 s 3385 5548',
'STATE 6 a 3455 5549',
'STATE 4 c 3455 5356',
'STATE 3 c 3522 4989',
'STATE 6 d 3455 5550',
'STATE 4 p 3522 5551',
'STATE 3 m 3522 3385',
'STATE 3 r 3444 5552',
'STATE 4 x 5554 5553',
'STATE 5 q 3385 5555',
'STATE 2 r 4279 5556',
'STATE 2 d 3399 5557',
'STATE 5 r 3385 3455',
'STATE 5 o 3399 3385',
'STATE 5 u 3399 5558',
'STATE 2 a 3399 5559',
'STATE 2 i 3399 5560',
'STATE 6 o 3385 3399',
'STATE 2 s 3455 5561',
'STATE 4 s 5562 3385',
'STATE 3 h 3385 5563',
'STATE 1 i 3455 5564',
'STATE 2 t 3385 5565',
'STATE 6 n 3455 5566',
'STATE 4 b 3385 5567',
'STATE 4 d 5310 5568',
'STATE 4 b 3385 5569',
'STATE 6 c 3455 5570',
'STATE 3 g 3385 5571',
'STATE 1 a 3444 3393',
'STATE 4 v 4359 3455',
'STATE 2 i 3522 5572',
'STATE 2 h 5574 5573',
'STATE 2 f 3385 5575',
'STATE 4 h 3455 5576',
'STATE 6 r 3399 3385',
'STATE 3 l 3455 5577',
'STATE 5 h 3399 3385',
'STATE 2 g 3455 5578',
'STATE 2 c 5579 3385',
'STATE 4 p 3455 3385',
'STATE 2 e 3455 5580',
'STATE 3 r 3455 5581',
'STATE 3 k 3455 5582',
'STATE 5 s 3385 5583',
'STATE 3 l 3385 4424',
'STATE 3 g 5064 5584',
'STATE 4 g 3385 5585',
'STATE 4 d 3385 5586',
'STATE 2 u 3455 5587',
'STATE 3 h 5589 5588',
'STATE 3 o 3399 5590',
'STATE 2 m 3385 3399',
'STATE 6 s 3399 3455',
'STATE 5 e 4090 3455',
'STATE 2 e 3455 5591',
'STATE 5 c 3522 3385',
'STATE 2 o 3385 3455',
'STATE 1 o 3455 5592',
'STATE 2 r 3455 5593',
'STATE 5 e 3393 3385',
'STATE 4 f 3455 5594',
'STATE 4 t 3385 5595',
'STATE 3 f 3385 5596',
'STATE 2 a 3385 5597',
'STATE 4 c 5599 5598',
'STATE 4 u 3399 4523',
'STATE 3 a 3399 3385',
'STATE 2 n 3455 3385',
'STATE 1 e 3455 5600',
'STATE 2 u 3455 4701',
'STATE 3 c 3455 5601',
'STATE 3 t 3385 5602',
'STATE 6 n 5603 3385',
'STATE 2 o 3522 5276',
'STATE 5 h 5605 5604',
'STATE 6 l 3455 5606',
'STATE 3 k 3455 3385',
'STATE 4 m 3385 5037',
'STATE 3 s 3385 5607',
'STATE 4 n 3987 3393',
'STATE 3 d 5609 5608',
'STATE 1 j 3455 5610',
'STATE 5 e 3494 5611',
'STATE 4 v 3385 5612',
'STATE 4 h 3399 5613',
'STATE 2 i 3399 5614',
'STATE 3 r 3399 5615',
'STATE 6 e 5616 4912',
'STATE 4 n 3385 5617',
'STATE 6 s 3399 5618',
'STATE 1 r 3455 5619',
'STATE 6 o 3399 5620',
'STATE 5 h 3385 3494',
'STATE 3 b 3385 3522',
'STATE 5 n 3399 5621',
'STATE 4 b 3399 3455',
'STATE 2 a 3385 5622',
'STATE 5 u 3399 5623',
'STATE 6 i 3399 3494',
'STATE 1 f 3399 5624',
'STATE 3 r 5626 5625',
'STATE 2 i 5628 5627',
'STATE 2 t 3455 5629',
'STATE 4 p 5631 5630',
'STATE 5 o 3399 5632',
'STATE 2 r 3455 5633',
'STATE 3 g 3455 5634',
'STATE 5 p 3385 3399',
'STATE 6 r 3399 5635',
'STATE 6 r 3455 3399',
'STATE 3 a 3399 5636',
'STATE 5 e 3455 5637',
'STATE 1 a 5639 5638',
'STATE 3 n 5640 3399',
'STATE 6 a 3399 5641',
'STATE 4 b 3455 3399',
'STATE 4 s 3399 3455',
'STATE 4 f 3399 5642',
'STATE 3 l 3399 5643',
'STATE 1 n 3399 5644',
'STATE 5 e 5645 3399',
'STATE 6 r 3399 5646',
'STATE 4 k 3399 3455',
'INDEX 5647 f',
'STATE 4 f 5649 5648',
'PHONE f',
'PHONE epsilon',
'INDEX 5650 g',
'STATE 3 n 5652 5651',
'STATE 4 h 5654 5653',
'STATE 4 # 5656 5655',
'STATE 4 g 5658 5657',
'STATE 5 t 5656 5659',
'STATE 4 s 5656 5660',
'PHONE epsilon',
'STATE 4 e 5662 5661',
'STATE 2 s 5664 5663',
'STATE 3 u 5666 5665',
'STATE 4 e 5668 5667',
'STATE 4 i 5670 5669',
'STATE 5 r 5672 5671',
'STATE 1 # 5656 5673',
'STATE 6 s 5674 5656',
'STATE 3 i 5676 5675',
'STATE 5 # 5656 5677',
'STATE 4 i 5679 5678',
'STATE 6 # 5681 5680',
'STATE 4 y 5683 5682',
'STATE 2 l 5685 5684',
'STATE 3 d 5687 5686',
'STATE 6 # 5689 5688',
'STATE 5 l 5691 5690',
'PHONE g',
'STATE 1 0 5674 5692',
'STATE 5 a 5674 5693',
'STATE 1 t 5695 5694',
'STATE 4 t 5697 5696',
'STATE 6 g 5699 5698',
'STATE 5 # 5687 5700',
'STATE 5 l 5674 5701',
'STATE 4 n 5703 5702',
'STATE 3 g 5674 5704',
'STATE 5 a 5687 5705',
'STATE 5 n 5706 5687',
'STATE 3 g 5708 5707',
'PHONE jh',
'STATE 6 a 5687 5709',
'STATE 3 d 5687 5710',
'STATE 2 b 5674 5656',
'STATE 1 t 5674 5656',
'STATE 1 b 5674 5711',
'STATE 5 e 5674 5656',
'STATE 1 l 5713 5712',
'PHONE f',
'STATE 4 y 5687 5714',
'STATE 2 e 5715 5656',
'STATE 5 l 5674 5716',
'STATE 2 i 5656 5717',
'STATE 5 r 5719 5718',
'STATE 5 s 5687 5720',
'STATE 3 d 5722 5721',
'STATE 5 # 5656 5723',
'STATE 2 l 5687 5724',
'STATE 2 0 5726 5725',
'STATE 6 g 5687 5674',
'STATE 5 # 5687 5727',
'STATE 1 s 5687 5674',
'STATE 3 g 5674 5728',
'STATE 1 c 5687 5729',
'STATE 3 e 5674 5730',
'STATE 2 o 5732 5731',
'STATE 2 a 5733 5656',
'STATE 5 y 5735 5734',
'STATE 6 e 5656 5736',
'STATE 6 e 5687 5737',
'STATE 2 o 5656 5687',
'STATE 5 l 5739 5738',
'STATE 1 f 5674 5740',
'STATE 1 s 5742 5741',
'STATE 3 g 5744 5743',
'STATE 4 r 5674 5745',
'STATE 2 0 5656 5746',
'STATE 1 # 5674 5747',
'STATE 3 g 5749 5748',
'STATE 5 l 5674 5750',
'STATE 5 l 5752 5751',
'STATE 3 d 5687 5753',
'STATE 3 a 5755 5754',
'STATE 2 a 5674 5756',
'STATE 2 a 5656 5757',
'STATE 1 c 5695 5656',
'STATE 5 l 5736 5695',
'STATE 4 h 5759 5758',
'STATE 4 l 5656 5674',
'PHONE k',
'STATE 6 l 5687 5760',
'STATE 6 b 5656 5761',
'STATE 2 a 5762 5674',
'STATE 1 d 5687 5763',
'STATE 2 i 5765 5764',
'STATE 2 i 5687 5656',
'STATE 4 t 5766 5674',
'STATE 1 r 5735 5674',
'STATE 6 n 5687 5767',
'STATE 6 d 5656 5768',
'STATE 6 e 5674 5687',
'STATE 3 c 5674 5769',
'STATE 5 o 5687 5770',
'STATE 5 o 5687 5771',
'STATE 5 i 5674 5772',
'STATE 6 l 5774 5773',
'STATE 6 t 5674 5775',
'STATE 1 m 5687 5674',
'STATE 2 r 5674 5776',
'STATE 5 # 5656 5777',
'STATE 5 e 5656 5674',
'STATE 4 m 5656 5778',
'STATE 5 i 5674 5656',
'STATE 1 # 5687 5779',
'STATE 1 l 5674 5780',
'STATE 6 o 5674 5781',
'STATE 6 s 5783 5782',
'STATE 1 w 5656 5784',
'STATE 1 h 5687 5656',
'STATE 3 a 5674 5785',
'STATE 5 e 5687 5786',
'STATE 6 t 5674 5787',
'STATE 5 v 5674 5788',
'STATE 5 # 5687 5789',
'STATE 5 u 5687 5790',
'STATE 5 t 5792 5791',
'STATE 2 0 5793 5674',
'STATE 3 a 5687 5674',
'STATE 6 s 5795 5794',
'STATE 1 s 5674 5796',
'STATE 1 o 5656 5674',
'STATE 4 b 5656 5797',
'STATE 1 r 5687 5798',
'STATE 6 t 5687 5799',
'STATE 1 v 5687 5800',
'STATE 1 l 5674 5801',
'STATE 2 i 5656 5802',
'STATE 2 o 5656 5803',
'STATE 1 # 5674 5656',
'STATE 4 a 5674 5804',
'STATE 3 i 5806 5805',
'STATE 3 o 5674 5807',
'STATE 5 n 5674 5808',
'STATE 5 n 5810 5809',
'STATE 2 h 5812 5811',
'STATE 1 0 5674 5813',
'STATE 6 a 5687 5674',
'STATE 2 e 5674 5814',
'STATE 3 a 5815 5674',
'STATE 1 h 5674 5816',
'STATE 4 d 5656 5817',
'STATE 5 n 5674 5818',
'STATE 2 o 5687 5819',
'STATE 1 # 5820 5674',
'STATE 1 # 5674 5821',
'STATE 2 e 5687 5656',
'STATE 5 d 5687 5822',
'STATE 4 o 5674 5687',
'STATE 6 # 5757 5674',
'STATE 5 m 5656 5823',
'STATE 6 # 5825 5824',
'STATE 1 r 5687 5674',
'STATE 5 v 5674 5826',
'STATE 6 n 5687 5827',
'STATE 6 s 5829 5828',
'STATE 1 n 5674 5830',
'STATE 2 v 5687 5831',
'STATE 6 g 5674 5832',
'STATE 1 # 5674 5687',
'STATE 1 # 5674 5833',
'STATE 4 f 5656 5834',
'STATE 2 i 5674 5835',
'STATE 6 i 5674 5836',
'STATE 6 i 5674 5687',
'STATE 6 t 5674 5837',
'STATE 2 e 5687 5838',
'STATE 5 s 5656 5839',
'STATE 6 l 5841 5840',
'STATE 2 r 5687 5842',
'STATE 5 f 5674 5843',
'STATE 6 t 5687 5844',
'STATE 6 h 5674 5845',
'STATE 1 j 5674 5846',
'STATE 5 m 5674 5847',
'STATE 6 t 5848 5674',
'STATE 6 l 5674 5849',
'STATE 2 e 5674 5687',
'STATE 4 w 5656 5850',
'STATE 5 e 5656 5687',
'STATE 6 u 5687 5851',
'STATE 2 i 5687 5674',
'STATE 1 r 5687 5852',
'STATE 1 0 5674 5853',
'STATE 2 b 5674 5854',
'STATE 1 c 5674 5855',
'STATE 2 o 5855 5856',
'STATE 6 d 5674 5857',
'STATE 6 g 5674 5687',
'STATE 5 u 5859 5858',
'STATE 1 # 5674 5860',
'STATE 5 n 5674 5687',
'STATE 3 r 5674 5687',
'STATE 6 b 5674 5861',
'STATE 4 p 5656 5862',
'STATE 2 a 5687 5863',
'STATE 1 l 5656 5864',
'STATE 5 a 5674 5865',
'STATE 2 h 5674 5866',
'STATE 5 e 5674 5687',
'STATE 1 # 5687 5867',
'STATE 6 s 5674 5868',
'STATE 1 b 5848 5869',
'PHONE zh',
'STATE 5 m 5687 5870',
'STATE 6 y 5687 5871',
'STATE 5 u 5873 5872',
'STATE 1 # 5674 5874',
'STATE 5 r 5875 5687',
'STATE 6 f 5674 5876',
'STATE 2 s 5674 5687',
'STATE 5 s 5674 5877',
'STATE 5 s 5687 5878',
'STATE 2 b 5674 5879',
'STATE 5 n 5880 5674',
'STATE 2 n 5687 5881',
'STATE 4 o 5674 5882',
'STATE 2 a 5656 5883',
'STATE 2 i 5674 5687',
'STATE 2 a 5656 5674',
'STATE 2 m 5674 5884',
'STATE 1 r 5674 5885',
'STATE 5 r 5674 5886',
'STATE 6 r 5888 5887',
'STATE 1 0 5687 5674',
'STATE 2 0 5890 5889',
'STATE 4 a 5892 5891',
'STATE 6 i 5656 5674',
'STATE 6 n 5894 5893',
'STATE 2 e 5674 5895',
'STATE 6 g 5674 5896',
'STATE 3 a 5898 5897',
'STATE 5 o 5687 5899',
'STATE 3 i 5687 5900',
'STATE 6 m 5687 5901',
'STATE 4 r 5674 5902',
'STATE 1 h 5656 5674',
'STATE 6 r 5656 5903',
'STATE 5 i 5656 5674',
'STATE 3 a 5674 5687',
'STATE 6 m 5674 5904',
'STATE 6 t 5687 5905',
'STATE 5 n 5815 5687',
'STATE 5 a 5674 5906',
'STATE 6 i 5687 5674',
'STATE 6 r 5687 5907',
'STATE 4 l 5909 5908',
'STATE 6 # 5656 5674',
'STATE 5 d 5674 5910',
'STATE 5 o 5687 5911',
'STATE 5 e 5674 5912',
'STATE 6 i 5687 5913',
'STATE 5 e 5656 5914',
'STATE 2 e 5757 5915',
'STATE 5 b 5917 5916',
'STATE 5 n 5919 5918',
'STATE 5 h 5674 5687',
'STATE 6 o 5687 5674',
'STATE 4 u 5674 5656',
'STATE 5 e 5921 5920',
'STATE 6 l 5687 5922',
'STATE 6 b 5674 5687',
'STATE 6 # 5687 5923',
'STATE 6 # 5924 5874',
'STATE 6 s 5674 5925',
'STATE 1 l 5656 5674',
'STATE 5 e 5674 5926',
'STATE 5 a 5687 5927',
'STATE 3 o 5687 5928',
'STATE 6 n 5674 5929',
'STATE 6 a 5674 5930',
'STATE 6 i 5687 5931',
'STATE 3 r 5674 5932',
'STATE 6 m 5674 5933',
'STATE 6 t 5674 5687',
'STATE 3 l 5674 5934',
'STATE 1 # 5674 5935',
'STATE 5 a 5656 5894',
'STATE 6 a 5674 5936',
'STATE 3 i 5687 5674',
'STATE 5 m 5687 5937',
'STATE 1 0 5938 5674',
'STATE 5 b 5687 5674',
'INDEX 5939 h',
'STATE 3 # 5941 5940',
'STATE 3 c 5943 5942',
'STATE 4 a 5945 5944',
'STATE 3 s 5947 5946',
'STATE 4 o 5948 5947',
'STATE 4 o 5945 5949',
'PHONE hh',
'STATE 3 t 5951 5950',
'PHONE epsilon',
'STATE 1 i 5945 5947',
'STATE 4 i 5945 5952',
'STATE 3 p 5954 5953',
'STATE 4 o 5955 5947',
'STATE 4 u 5945 5956',
'STATE 3 g 5958 5957',
'STATE 1 # 5947 5959',
'STATE 1 0 5947 5960',
'STATE 4 y 5945 5961',
'STATE 1 0 5963 5962',
'STATE 1 i 5965 5964',
'STATE 1 h 5966 5947',
'STATE 1 g 5945 5947',
'STATE 4 e 5945 5967',
'STATE 4 l 5947 5968',
'STATE 4 o 5970 5969',
'STATE 4 o 5972 5971',
'STATE 4 o 5945 5973',
'STATE 4 e 5947 5945',
'STATE 4 r 5945 5974',
'STATE 4 # 5947 5975',
'STATE 3 o 5977 5976',
'STATE 3 r 5947 5978',
'STATE 4 a 5980 5979',
'STATE 1 0 5947 5945',
'STATE 4 a 5945 5947',
'STATE 4 l 5945 5947',
'STATE 4 n 5947 5981',
'STATE 3 a 5973 5947',
'STATE 4 a 5945 5982',
'STATE 3 w 5945 5947',
'STATE 4 u 5945 5947',
'STATE 1 0 5947 5983',
'STATE 4 r 5947 5984',
'STATE 4 l 5947 5985',
'STATE 1 n 5945 5947',
'STATE 4 m 5947 5986',
'STATE 4 m 5947 5945',
'STATE 4 s 5947 5987',
'STATE 3 w 5983 5988',
'STATE 3 x 5990 5989',
'STATE 4 t 5947 5991',
'STATE 4 i 5947 5992',
'STATE 4 d 5947 5993',
'STATE 4 a 5947 5945',
'STATE 4 o 5995 5994',
'STATE 3 n 5945 5996',
'STATE 1 s 5945 5997',
'STATE 4 y 5999 5998',
'STATE 1 c 5945 6000',
'STATE 1 h 5992 6001',
'STATE 3 e 5945 6002',
'STATE 3 e 5945 6003',
'STATE 3 z 6005 6004',
'STATE 3 a 5945 5947',
'STATE 3 d 5945 6006',
'STATE 3 d 6008 6007',
'STATE 4 a 5945 6009',
'STATE 3 n 5945 6010',
'STATE 1 u 5945 6011',
'STATE 4 e 5945 6012',
'STATE 4 e 5945 5947',
'STATE 1 o 6013 5945',
'STATE 1 e 5945 6014',
'STATE 4 u 5945 6015',
'STATE 3 r 5947 5945',
'STATE 4 a 6017 6016',
'STATE 1 e 5945 5947',
'STATE 1 # 6019 6018',
'STATE 1 # 5945 6020',
'STATE 1 k 5947 6021',
'STATE 4 i 5945 6022',
'STATE 1 b 5945 6023',
'STATE 3 o 5945 6024',
'STATE 4 e 5945 5979',
'STATE 1 v 5945 6025',
'STATE 1 p 5945 6026',
'STATE 1 m 5947 6027',
'STATE 1 t 5945 6028',
'STATE 3 i 5945 6029',
'STATE 1 i 5945 6030',
'STATE 1 f 5945 6031',
'STATE 1 l 5945 6032',
'STATE 1 d 5945 6033',
'STATE 1 o 5945 6034',
'STATE 3 o 5945 6035',
'STATE 1 g 5945 6036',
'STATE 3 a 5945 6037',
'STATE 3 i 6039 6038',
'STATE 3 m 5945 6040',
'STATE 1 c 5945 6041',
'STATE 1 n 5947 5945',
'STATE 1 r 6042 5945',
'STATE 1 n 5945 6043',
'STATE 3 u 5947 5945',
'STATE 3 e 5945 6044',
'STATE 1 w 5945 6045',
'STATE 1 r 5945 6046',
'STATE 1 a 5945 6047',
'STATE 3 r 5945 6048',
'STATE 1 s 5945 6049',
'STATE 1 m 5945 6002',
'INDEX 6050 i',
'STATE 5 g 6052 6051',
'STATE 4 # 6054 6053',
'STATE 6 # 6056 6055',
'STATE 4 o 6058 6057',
'STATE 3 a 6060 6059',
'STATE 2 # 6062 6061',
'STATE 4 n 6064 6063',
'STATE 4 e 6066 6065',
'STATE 3 t 6068 6067',
'STATE 3 e 6070 6069',
'STATE 2 h 6072 6071',
'STATE 4 n 6074 6073',
'STATE 4 e 6076 6075',
'STATE 4 e 6076 6077',
'STATE 2 # 6077 6078',
'STATE 4 a 6080 6079',
'STATE 2 # 6082 6081',
'STATE 3 s 6084 6083',
'STATE 5 n 6086 6085',
'PHONE iy',
'STATE 2 m 6072 6086',
'STATE 2 k 6072 6087',
'PHONE ay1',
'STATE 4 e 6076 6088',
'STATE 3 s 6090 6089',
'STATE 4 r 6086 6091',
'PHONE iy1',
'PHONE ih1',
'STATE 3 r 6093 6092',
'STATE 3 a 6095 6094',
'STATE 3 c 6097 6096',
'STATE 5 r 6099 6098',
'STATE 5 r 6101 6100',
'STATE 2 # 6103 6102',
'STATE 5 n 6086 6069',
'STATE 5 u 6086 6069',
'PHONE epsilon',
'STATE 2 d 6086 6072',
'STATE 6 e 6105 6104',
'STATE 2 0 6077 6106',
'STATE 6 e 6108 6107',
'STATE 4 a 6110 6109',
'STATE 3 w 6111 6107',
'STATE 2 d 6077 6112',
'STATE 5 e 6114 6113',
'STATE 4 c 6116 6115',
'STATE 3 t 6118 6117',
'STATE 5 t 6069 6119',
'STATE 5 # 6069 6120',
'STATE 3 e 6122 6121',
'STATE 5 w 6086 6123',
'STATE 3 h 6072 6124',
'STATE 5 n 6126 6125',
'STATE 3 g 6086 6127',
'STATE 4 o 6129 6128',
'STATE 2 r 6107 6130',
'STATE 3 e 6072 6131',
'PHONE ih',
'PHONE ah',
'STATE 4 o 6132 6077',
'STATE 3 d 6072 6069',
'STATE 2 o 6107 6133',
'STATE 2 e 6107 6134',
'STATE 4 c 6136 6135',
'STATE 4 v 6138 6137',
'STATE 2 z 6077 6139',
'STATE 5 # 6107 6086',
'STATE 2 # 6141 6140',
'STATE 5 t 6069 6142',
'STATE 6 o 6069 6143',
'STATE 5 s 6145 6144',
'STATE 6 # 6147 6146',
'STATE 2 m 6132 6072',
'STATE 3 d 6149 6148',
'STATE 3 p 6077 6150',
'STATE 5 u 6152 6151',
'STATE 2 l 6154 6153',
'STATE 3 f 6069 6155',
'STATE 4 a 6069 6156',
'STATE 2 o 6132 6069',
'STATE 4 d 6158 6157',
'STATE 2 s 6160 6159',
'PHONE ay',
'STATE 2 a 6107 6161',
'STATE 2 a 6107 6162',
'STATE 4 r 6164 6163',
'STATE 2 # 6166 6165',
'STATE 3 o 6168 6167',
'STATE 3 t 6107 6169',
'STATE 5 a 6171 6170',
'STATE 3 s 6173 6172',
'STATE 3 g 6086 6174',
'STATE 6 # 6086 6175',
'STATE 5 l 6086 6176',
'STATE 5 d 6178 6177',
'STATE 3 f 6072 6179',
'STATE 6 s 6181 6180',
'STATE 3 a 6132 6182',
'STATE 6 e 6076 6183',
'STATE 5 t 6185 6184',
'STATE 3 s 6069 6186',
'STATE 5 r 6188 6187',
'STATE 3 c 6086 6189',
'STATE 3 n 6154 6190',
'PHONE y',
'STATE 5 l 6192 6191',
'STATE 6 r 6086 6077',
'STATE 4 g 6077 6072',
'STATE 3 r 6193 6107',
'STATE 3 r 6195 6194',
'STATE 3 w 6077 6196',
'STATE 2 e 6107 6077',
'STATE 2 u 6107 6197',
'STATE 3 e 6199 6198',
'STATE 6 n 6201 6200',
'STATE 5 # 6107 6202',
'STATE 5 r 6072 6203',
'STATE 6 # 6205 6204',
'STATE 4 r 6206 6086',
'STATE 3 s 6107 6207',
'STATE 5 o 6209 6208',
'STATE 4 n 6086 6210',
'STATE 3 l 6212 6211',
'STATE 5 k 6069 6213',
'STATE 3 d 6072 6214',
'STATE 2 s 6216 6215',
'STATE 5 n 6086 6217',
'STATE 5 w 6219 6218',
'STATE 3 f 6072 6220',
'STATE 6 # 6222 6221',
'STATE 6 i 6077 6223',
'STATE 2 i 6072 6224',
'STATE 3 f 6072 6225',
'STATE 5 s 6184 6226',
'STATE 6 # 6072 6076',
'STATE 6 z 6076 6227',
'STATE 6 a 6076 6228',
'STATE 2 0 6072 6229',
'STATE 3 r 6231 6230',
'STATE 3 g 6086 6069',
'STATE 2 0 6132 6232',
'STATE 3 b 6072 6233',
'STATE 6 e 6072 6234',
'STATE 2 b 6077 6235',
'STATE 6 s 6107 6236',
'STATE 6 t 6107 6237',
'STATE 6 u 6077 6238',
'STATE 2 o 6107 6239',
'STATE 3 o 6241 6240',
'STATE 4 g 6243 6242',
'STATE 3 o 6245 6244',
'STATE 5 a 6107 6246',
'STATE 5 a 6248 6247',
'STATE 5 k 6077 6249',
'STATE 2 # 6251 6250',
'STATE 4 n 6253 6252',
'PHONE aa1',
'STATE 3 e 6076 6254',
'STATE 4 v 6086 6255',
'STATE 4 n 6086 6256',
'STATE 2 t 6072 6086',
'STATE 3 g 6258 6257',
'STATE 6 e 6260 6259',
'STATE 6 i 6069 6261',
'STATE 5 n 6263 6262',
'STATE 2 n 6086 6264',
'STATE 5 # 6069 6265',
'STATE 6 # 6069 6086',
'STATE 5 n 6267 6266',
'STATE 3 v 6086 6268',
'STATE 6 # 6270 6269',
'STATE 3 r 6076 6271',
'STATE 3 l 6273 6272',
'STATE 6 e 6275 6274',
'STATE 3 l 6154 6276',
'STATE 3 s 6069 6277',
'STATE 3 b 6279 6278',
'STATE 6 e 6076 6072',
'STATE 6 n 6077 6280',
'STATE 5 # 6282 6281',
'STATE 2 a 6154 6283',
'STATE 2 p 6132 6069',
'STATE 3 l 6285 6284',
'STATE 6 t 6069 6286',
'STATE 6 i 6132 6287',
'STATE 2 t 6077 6288',
'STATE 2 k 6077 6289',
'STATE 2 e 6107 6290',
'STATE 6 i 6077 6291',
'STATE 2 r 6107 6292',
'STATE 2 # 6294 6293',
'STATE 4 s 6296 6295',
'STATE 5 # 6298 6297',
'STATE 5 h 6300 6299',
'STATE 5 a 6302 6301',
'STATE 5 # 6206 6086',
'STATE 2 # 6304 6303',
'STATE 6 # 6306 6305',
'STATE 6 t 6308 6307',
'STATE 3 e 6072 6309',
'STATE 3 e 6311 6310',
'STATE 4 r 6313 6312',
'STATE 4 c 6315 6314',
'STATE 3 l 6317 6316',
'STATE 3 d 6319 6318',
'STATE 4 s 6320 6086',
'STATE 6 r 6086 6321',
'STATE 3 o 6154 6322',
'STATE 2 r 6086 6323',
'STATE 2 g 6069 6324',
'STATE 5 m 6086 6069',
'STATE 5 s 6069 6325',
'STATE 3 h 6072 6326',
'STATE 6 # 6076 6069',
'STATE 6 s 6086 6327',
'STATE 6 i 6086 6069',
'STATE 5 t 6329 6328',
'STATE 2 f 6086 6330',
'STATE 6 i 6108 6069',
'STATE 2 f 6076 6069',
'STATE 2 p 6072 6331',
'STATE 6 t 6069 6332',
'STATE 2 i 6069 6333',
'STATE 2 l 6069 6072',
'STATE 2 n 6069 6077',
'STATE 2 e 6077 6334',
'STATE 2 o 6069 6335',
'STATE 2 r 6069 6336',
'STATE 5 n 6338 6337',
'STATE 5 n 6108 6076',
'STATE 3 w 6077 6339',
'STATE 3 a 6072 6340',
'STATE 3 h 6341 6069',
'STATE 3 n 6154 6342',
'STATE 3 r 6069 6343',
'STATE 2 g 6069 6154',
'STATE 5 n 6072 6344',
'STATE 3 b 6132 6072',
'STATE 2 d 6107 6345',
'STATE 6 u 6077 6346',
'STATE 2 a 6107 6347',
'STATE 3 l 6077 6348',
'STATE 2 i 6107 6345',
'STATE 2 0 6350 6349',
'STATE 4 g 6352 6351',
'STATE 5 c 6108 6086',
'STATE 5 # 6206 6353',
'STATE 2 r 6355 6354',
'STATE 2 h 6357 6356',
'STATE 5 n 6359 6358',
'STATE 6 # 6086 6360',
'STATE 5 o 6362 6361',
'STATE 3 e 6086 6363',
'STATE 2 0 6072 6364',
'STATE 5 o 6107 6086',
'STATE 3 e 6072 6365',
'STATE 5 o 6367 6366',
'STATE 6 l 6369 6368',
'STATE 3 r 6107 6370',
'STATE 5 h 6372 6371',
'STATE 4 z 6374 6373',
'STATE 6 d 6086 6375',
'STATE 6 s 6377 6376',
'STATE 3 d 6086 6378',
'STATE 4 l 6380 6379',
'STATE 2 # 6072 6381',
'STATE 3 w 6072 6382',
'STATE 2 o 6076 6383',
'STATE 2 o 6385 6384',
'STATE 2 # 6386 6072',
'STATE 6 # 6387 6086',
'STATE 6 n 6086 6388',
'STATE 3 n 6390 6389',
'STATE 6 # 6069 6391',
'STATE 2 p 6072 6392',
'STATE 6 # 6086 6393',
'STATE 3 v 6072 6394',
'STATE 5 # 6086 6395',
'STATE 6 l 6069 6396',
'STATE 3 u 6072 6397',
'STATE 3 c 6399 6398',
'STATE 2 r 6069 6400',
'STATE 6 c 6069 6401',
'STATE 2 c 6072 6069',
'STATE 2 i 6069 6077',
'STATE 3 r 6069 6077',
'STATE 3 r 6069 6402',
'STATE 3 l 6076 6403',
'STATE 3 v 6069 6076',
'STATE 3 b 6077 6404',
'STATE 5 t 6069 6405',
'STATE 2 c 6069 6072',
'STATE 6 a 6154 6069',
'STATE 3 p 6069 6406',
'STATE 5 c 6072 6407',
'STATE 2 h 6107 6077',
'STATE 6 a 6107 6408',
'STATE 2 r 6107 6345',
'STATE 6 l 6077 6409',
'STATE 5 a 6411 6410',
'STATE 4 n 6077 6412',
'STATE 5 a 6414 6413',
'STATE 5 h 6072 6415',
'STATE 2 b 6086 6416',
'STATE 6 # 6418 6417',
'STATE 4 n 6420 6419',
'STATE 2 t 6422 6421',
'STATE 4 s 6132 6423',
'STATE 2 w 6425 6424',
'STATE 6 i 6107 6426',
'STATE 2 h 6072 6086',
'STATE 5 r 6428 6427',
'STATE 3 e 6086 6429',
'STATE 3 p 6431 6430',
'STATE 2 n 6072 6432',
'STATE 5 i 6434 6433',
'STATE 3 e 6436 6435',
'STATE 3 r 6076 6437',
'STATE 6 # 6107 6438',
'STATE 3 g 6107 6439',
'STATE 2 e 6107 6440',
'STATE 3 b 6072 6441',
'STATE 3 m 6442 6077',
'STATE 6 s 6444 6443',
'STATE 6 n 6108 6445',
'STATE 4 t 6446 6072',
'STATE 3 e 6072 6447',
'STATE 4 g 6132 6072',
'STATE 6 l 6107 6072',
'STATE 4 r 6072 6448',
'STATE 2 # 6072 6449',
'STATE 3 r 6451 6450',
'STATE 2 # 6072 6452',
'STATE 2 a 6076 6072',
'STATE 3 n 6454 6453',
'STATE 6 r 6069 6107',
'STATE 6 s 6132 6455',
'STATE 5 e 6086 6077',
'STATE 4 d 6072 6086',
'STATE 3 a 6154 6456',
'STATE 6 u 6069 6457',
'STATE 5 n 6069 6458',
'STATE 2 e 6460 6459',
'STATE 5 # 6462 6461',
'STATE 6 # 6072 6463',
'STATE 2 i 6086 6069',
'STATE 5 u 6465 6464',
'STATE 2 p 6072 6466',
'STATE 3 t 6108 6467',
'STATE 2 i 6108 6468',
'STATE 2 a 6069 6469',
'STATE 6 o 6069 6076',
'STATE 3 z 6069 6470',
'STATE 5 t 6472 6471',
'STATE 3 g 6077 6473',
'STATE 2 i 6475 6474',
'STATE 2 s 6086 6476',
'STATE 5 t 6072 6477',
'STATE 6 o 6077 6478',
'STATE 3 t 6479 6107',
'STATE 5 y 6481 6480',
'STATE 6 # 6483 6482',
'STATE 4 m 6077 6484',
'STATE 5 o 6486 6485',
'STATE 6 # 6076 6487',
'STATE 5 r 6489 6488',
'STATE 2 a 6077 6086',
'STATE 4 n 6491 6490',
'STATE 4 s 6493 6492',
'STATE 6 u 6108 6494',
'STATE 6 # 6076 6495',
'STATE 4 n 6497 6496',
'STATE 4 n 6132 6072',
'STATE 4 t 6132 6072',
'STATE 5 # 6076 6072',
'STATE 5 # 6132 6072',
'STATE 2 r 6108 6086',
'STATE 5 i 6499 6498',
'STATE 2 0 6501 6500',
'STATE 6 # 6077 6502',
'STATE 6 # 6077 6503',
'STATE 2 # 6072 6504',
'STATE 5 o 6086 6072',
'STATE 5 k 6506 6505',
'STATE 6 s 6108 6507',
'STATE 5 i 6076 6508',
'STATE 5 h 6509 6076',
'STATE 3 n 6076 6510',
'STATE 2 n 6069 6511',
'STATE 2 s 6107 6512',
'STATE 3 d 6513 6108',
'STATE 5 t 6515 6514',
'STATE 6 e 6107 6077',
'STATE 2 0 6517 6516',
'STATE 4 n 6519 6518',
'STATE 6 d 6072 6520',
'STATE 6 r 6521 6072',
'STATE 4 b 6523 6522',
'STATE 3 e 6525 6524',
'STATE 3 t 6108 6526',
'STATE 2 e 6108 6527',
'STATE 2 o 6077 6072',
'STATE 2 a 6076 6528',
'STATE 2 l 6107 6529',
'STATE 2 u 6107 6072',
'STATE 6 r 6132 6072',
'STATE 5 h 6072 6530',
'STATE 2 e 6531 6069',
'STATE 2 e 6069 6086',
'STATE 5 r 6154 6532',
'STATE 5 # 6069 6533',
'STATE 6 s 6086 6069',
'STATE 2 o 6069 6086',
'STATE 3 w 6072 6534',
'STATE 2 c 6536 6535',
'STATE 6 # 6086 6069',
'STATE 6 y 6072 6537',
'STATE 3 n 6154 6538',
'STATE 2 s 6072 6069',
'STATE 2 o 6069 6539',
'STATE 2 l 6069 6540',
'STATE 3 s 6076 6541',
'STATE 6 z 6076 6542',
'STATE 3 v 6077 6543',
'STATE 3 c 6462 6544',
'STATE 6 a 6086 6069',
'STATE 3 g 6086 6545',
'STATE 3 r 6069 6546',
'STATE 6 t 6107 6547',
'STATE 6 s 6107 6077',
'STATE 5 h 6549 6548',
'STATE 4 n 6550 6108',
'STATE 6 t 6552 6551',
'STATE 4 k 6107 6553',
'STATE 5 o 6072 6554',
'STATE 4 u 6189 6555',
'STATE 6 # 6076 6556',
'STATE 4 s 6077 6557',
'STATE 6 # 6559 6558',
'STATE 6 e 6132 6072',
'STATE 5 t 6122 6560',
'STATE 6 t 6108 6072',
'STATE 2 h 6072 6561',
'STATE 5 t 6108 6562',
'STATE 6 # 6563 6072',
'STATE 5 f 6077 6564',
'STATE 2 f 6072 6565',
'STATE 2 r 6086 6566',
'STATE 5 # 6568 6567',
'STATE 3 p 6077 6569',
'STATE 3 m 6077 6086',
'STATE 6 i 6077 6107',
'STATE 6 l 6107 6570',
'STATE 2 d 6086 6571',
'STATE 6 t 6086 6072',
'STATE 5 t 6573 6572',
'STATE 2 e 6107 6574',
'STATE 6 z 6108 6575',
'STATE 5 s 6107 6576',
'STATE 2 r 6132 6072',
'STATE 3 t 6107 6076',
'STATE 3 r 6578 6577',
'STATE 3 d 6580 6579',
'STATE 2 n 6108 6581',
'STATE 6 # 6076 6582',
'STATE 6 o 6107 6077',
'STATE 4 g 6584 6583',
'STATE 4 n 6077 6585',
'STATE 4 g 6107 6586',
'STATE 3 s 6588 6587',
'STATE 6 s 6072 6589',
'STATE 2 r 6077 6072',
'STATE 3 t 6072 6590',
'STATE 3 f 6072 6591',
'STATE 3 u 6593 6592',
'STATE 4 d 6072 6076',
'STATE 2 a 6108 6594',
'STATE 2 s 6596 6595',
'STATE 3 t 6076 6597',
'STATE 6 s 6599 6598',
'STATE 5 s 6601 6600',
'STATE 6 # 6602 6069',
'STATE 6 s 6154 6603',
'STATE 6 # 6069 6072',
'STATE 5 l 6069 6604',
'STATE 2 a 6606 6605',
'STATE 6 # 6108 6076',
'STATE 3 t 6069 6607',
'STATE 2 b 6072 6608',
'STATE 2 l 6069 6609',
'STATE 2 a 6611 6610',
'STATE 6 h 6613 6612',
'STATE 3 v 6069 6614',
'STATE 3 f 6077 6076',
'STATE 3 v 6072 6069',
'STATE 3 z 6069 6615',
'STATE 6 i 6072 6110',
'STATE 3 h 6077 6616',
'STATE 5 o 6618 6617',
'STATE 4 g 6072 6619',
'STATE 6 # 6072 6077',
'STATE 4 g 6621 6620',
'STATE 4 v 6623 6622',
'STATE 4 l 6624 6076',
'STATE 5 a 6626 6625',
'STATE 5 i 6628 6627',
'STATE 4 k 6107 6629',
'STATE 4 y 6076 6630',
'STATE 5 u 6632 6631',
'STATE 5 s 6077 6076',
'STATE 2 c 6076 6633',
'STATE 4 n 6076 6634',
'STATE 5 s 6072 6077',
'STATE 4 s 6072 6076',
'STATE 5 i 6072 6635',
'STATE 2 b 6132 6636',
'STATE 2 b 6132 6072',
'STATE 5 u 6638 6637',
'STATE 3 e 6077 6639',
'STATE 2 0 6072 6640',
'STATE 2 # 6641 6072',
'STATE 2 # 6643 6642',
'STATE 6 i 6645 6644',
'STATE 2 n 6077 6646',
'STATE 2 r 6107 6647',
'STATE 6 d 6108 6648',
'STATE 5 t 6077 6649',
'STATE 3 h 6107 6650',
'STATE 2 f 6107 6108',
'STATE 2 c 6652 6651',
'STATE 2 a 6108 6107',
'STATE 2 u 6107 6108',
'STATE 5 c 6654 6653',
'STATE 6 n 6656 6655',
'STATE 6 n 6658 6657',
'STATE 4 d 6660 6659',
'STATE 4 l 6662 6661',
'STATE 3 m 6108 6663',
'STATE 2 u 6086 6069',
'STATE 6 r 6072 6077',
'STATE 6 r 6665 6664',
'STATE 6 r 6077 6666',
'STATE 4 t 6668 6667',
'STATE 4 s 6086 6072',
'STATE 3 s 6108 6669',
'STATE 2 n 6108 6670',
'STATE 3 t 6108 6072',
'STATE 2 s 6072 6671',
'STATE 6 # 6072 6672',
'STATE 3 l 6077 6072',
'STATE 3 f 6674 6673',
'STATE 6 # 6675 6072',
'STATE 5 n 6069 6154',
'STATE 6 i 6069 6676',
'STATE 3 l 6072 6069',
'STATE 6 # 6678 6677',
'STATE 3 n 6154 6679',
'STATE 6 t 6069 6680',
'STATE 3 l 6069 6681',
'STATE 2 n 6069 6682',
'STATE 2 t 6069 6683',
'STATE 3 n 6069 6684',
'STATE 6 b 6069 6076',
'STATE 3 p 6069 6076',
'STATE 6 r 6076 6685',
'STATE 3 c 6687 6686',
'STATE 6 i 6077 6688',
'STATE 4 u 6690 6689',
'STATE 6 # 6076 6691',
'STATE 4 s 6693 6692',
'STATE 4 v 6695 6694',
'STATE 6 n 6107 6696',
'STATE 2 c 6697 6108',
'STATE 3 r 6072 6698',
'STATE 3 u 6076 6699',
'STATE 5 l 6701 6700',
'STATE 6 l 6108 6702',
'STATE 5 d 6704 6703',
'STATE 6 n 6706 6705',
'STATE 4 v 6107 6707',
'STATE 6 t 6709 6708',
'STATE 6 e 6077 6710',
'STATE 6 r 6077 6069',
'STATE 4 s 6072 6711',
'STATE 5 y 6108 6712',
'STATE 5 v 6077 6713',
'STATE 4 l 6076 6714',
'STATE 3 e 6716 6715',
'STATE 6 s 6072 6077',
'STATE 3 m 6077 6717',
'STATE 6 c 6072 6718',
'STATE 3 h 6077 6107',
'STATE 2 e 6072 6719',
'STATE 6 d 6132 6720',
'STATE 5 o 6722 6721',
'STATE 5 h 6076 6107',
'STATE 6 s 6723 6077',
'STATE 6 s 6725 6724',
'STATE 6 n 6727 6726',
'STATE 2 s 6729 6728',
'STATE 2 a 6107 6730',
'STATE 3 m 6731 6107',
'STATE 3 t 6108 6107',
'STATE 3 n 6077 6732',
'STATE 6 i 6069 6077',
'STATE 6 d 6734 6733',
'STATE 2 e 6108 6735',
'STATE 2 s 6737 6736',
'STATE 3 l 6108 6738',
'STATE 4 r 6107 6739',
'STATE 6 o 6072 6132',
'STATE 4 c 6596 6740',
'STATE 2 o 6076 6072',
'STATE 3 g 6108 6741',
'STATE 3 l 6743 6742',
'STATE 3 n 6132 6744',
'STATE 6 l 6072 6077',
'STATE 4 s 6746 6745',
'STATE 2 i 6108 6747',
'STATE 3 r 6108 6748',
'STATE 3 v 6108 6749',
'STATE 2 o 6076 6750',
'STATE 2 0 6072 6751',
'STATE 2 t 6753 6752',
'STATE 2 i 6072 6069',
'STATE 3 r 6076 6069',
'STATE 2 l 6754 6069',
'STATE 5 v 6076 6755',
'STATE 5 f 6076 6756',
'STATE 6 # 6069 6076',
'STATE 6 # 6069 6757',
'STATE 6 t 6069 6758',
'STATE 2 e 6069 6759',
'STATE 3 v 6069 6760',
'STATE 3 v 6154 6069',
'STATE 3 p 6072 6076',
'STATE 3 x 6086 6069',
'STATE 6 a 6069 6086',
'STATE 2 m 6107 6761',
'STATE 6 n 6763 6762',
'STATE 6 # 6069 6764',
'STATE 4 k 6107 6765',
'STATE 2 s 6077 6766',
'STATE 3 f 6077 6767',
'STATE 6 s 6769 6768',
'STATE 3 v 6072 6770',
'STATE 3 r 6108 6580',
'STATE 4 n 6108 6072',
'STATE 2 o 6108 6771',
'STATE 2 a 6077 6076',
'STATE 4 g 6773 6772',
'STATE 4 l 6077 6774',
'STATE 6 n 6776 6775',
'STATE 5 u 6778 6777',
'STATE 4 d 6077 6779',
'STATE 6 # 6076 6780',
'STATE 4 s 6077 6781',
'STATE 4 s 6077 6782',
'STATE 6 r 6784 6783',
'STATE 4 l 6132 6077',
'STATE 5 a 6786 6785',
'STATE 2 f 6108 6787',
'STATE 4 t 6076 6788',
'STATE 6 e 6790 6789',
'STATE 2 r 6076 6563',
'STATE 5 y 6072 6086',
'STATE 2 w 6077 6086',
'STATE 2 a 6086 6791',
'STATE 6 l 6107 6792',
'STATE 3 h 6107 6793',
'STATE 3 g 6086 6794',
'STATE 6 l 6796 6795',
'STATE 2 0 6072 6797',
'STATE 3 d 6107 6077',
'STATE 2 i 6107 6798',
'STATE 2 d 6107 6799',
'STATE 2 e 6801 6800',
'STATE 3 d 6108 6072',
'STATE 3 w 6803 6802',
'STATE 3 t 6077 6107',
'STATE 6 b 6077 6804',
'STATE 2 e 6108 6107',
'STATE 5 i 6077 6805',
'STATE 2 w 6072 6806',
'STATE 4 t 6808 6807',
'STATE 2 w 6072 6809',
'STATE 3 r 6077 6107',
'STATE 6 r 6072 6107',
'STATE 2 e 6107 6108',
'STATE 4 k 6072 6810',
'STATE 4 f 6108 6811',
'STATE 3 l 6072 6812',
'STATE 4 p 6072 6813',
'STATE 6 a 6077 6814',
'STATE 4 t 6077 6815',
'STATE 4 g 6107 6072',
'STATE 2 a 6108 6816',
'STATE 2 e 6072 6817',
'STATE 2 o 6108 6509',
'STATE 2 r 6077 6818',
'STATE 3 v 6072 6819',
'STATE 6 a 6107 6820',
'STATE 3 e 6086 6821',
'STATE 5 # 6069 6822',
'STATE 6 # 6824 6823',
'STATE 6 a 6076 6825',
'STATE 2 t 6076 6826',
'STATE 3 p 6076 6827',
'STATE 6 c 6069 6828',
'STATE 2 f 6069 6829',
'STATE 2 p 6069 6830',
'STATE 3 d 6107 6831',
'STATE 4 k 6833 6832',
'STATE 4 z 6072 6834',
'STATE 6 p 6072 6265',
'STATE 6 s 6836 6835',
'STATE 6 o 6108 6837',
'STATE 2 s 6077 6838',
'STATE 4 k 6840 6839',
'STATE 2 o 6108 6076',
'STATE 3 r 6072 6841',
'STATE 2 c 6108 6107',
'STATE 4 s 6842 6077',
'STATE 6 o 6077 6107',
'STATE 6 e 6072 6843',
'STATE 4 s 6077 6844',
'STATE 4 v 6072 6107',
'STATE 3 v 6846 6845',
'STATE 4 l 6108 6847',
'STATE 4 l 6849 6848',
'STATE 4 v 6723 6850',
'STATE 4 v 6723 6851',
'STATE 3 s 6853 6852',
'STATE 3 l 6077 6854',
'STATE 3 b 6132 6855',
'STATE 5 n 6857 6856',
'STATE 3 g 6077 6858',
'STATE 2 v 6086 6859',
'STATE 2 n 6076 6860',
'STATE 5 c 6077 6861',
'STATE 5 t 6077 6086',
'STATE 3 h 6086 6077',
'STATE 2 # 6077 6862',
'STATE 2 0 6107 6072',
'STATE 3 m 6864 6863',
'STATE 5 h 6866 6865',
'STATE 2 r 6077 6867',
'STATE 3 t 6069 6868',
'STATE 3 r 6077 6869',
'STATE 2 n 6107 6077',
'STATE 6 a 6077 6870',
'STATE 3 n 6108 6077',
'STATE 2 l 6107 6871',
'STATE 5 k 6872 6107',
'STATE 2 l 6107 6873',
'STATE 3 v 6077 6874',
'STATE 6 r 6876 6875',
'STATE 4 s 6072 6877',
'STATE 2 i 6108 6878',
'STATE 3 r 6880 6879',
'STATE 6 n 6077 6881',
'STATE 4 s 6072 6882',
'STATE 3 b 6072 6883',
'STATE 4 l 6885 6884',
'STATE 4 c 6072 6886',
'STATE 3 m 6077 6853',
'STATE 3 m 6072 6887',
'STATE 3 s 6072 6509',
'STATE 2 i 6077 6108',
'STATE 3 b 6072 6888',
'STATE 6 t 6077 6889',
'STATE 3 h 6069 6890',
'STATE 5 n 6069 6891',
'STATE 6 t 6154 6069',
'STATE 5 m 6154 6069',
'STATE 5 b 6076 6892',
'STATE 2 s 6076 6675',
'STATE 2 o 6069 6076',
'STATE 6 n 6069 6679',
'STATE 3 r 6072 6069',
'STATE 3 d 6069 6893',
'STATE 3 n 6107 6894',
'STATE 4 g 6896 6895',
'STATE 5 i 6076 6107',
'STATE 4 m 6077 6897',
'STATE 4 g 6899 6898',
'STATE 4 t 6076 6900',
'STATE 6 e 6902 6901',
'STATE 6 # 6904 6903',
'STATE 6 l 6906 6905',
'STATE 6 w 6069 6907',
'STATE 3 n 6107 6908',
'STATE 6 i 6909 6077',
'STATE 6 a 6077 6072',
'STATE 6 r 6077 6072',
'STATE 5 r 6911 6910',
'STATE 4 b 6072 6912',
'STATE 6 s 6914 6913',
'STATE 3 f 6072 6915',
'STATE 3 w 6072 6077',
'STATE 4 p 6069 6077',
'STATE 4 m 6916 6072',
'STATE 6 r 6918 6917',
'STATE 4 m 6077 6072',
'STATE 3 d 6920 6919',
'STATE 4 l 6108 6077',
'STATE 3 d 6922 6921',
'STATE 3 s 6924 6923',
'STATE 3 l 6077 6925',
'STATE 6 h 6086 6926',
'STATE 5 a 6076 6927',
'STATE 5 s 6077 6928',
'STATE 6 # 6077 6929',
'STATE 3 v 6077 6107',
'STATE 6 b 6107 6077',
'STATE 6 e 6931 6930',
'STATE 2 c 6933 6932',
'STATE 3 t 6077 6934',
'STATE 3 n 6925 6935',
'STATE 3 t 6077 6936',
'STATE 3 l 6077 6937',
'STATE 2 r 6107 6938',
'STATE 2 d 6107 6939',
'STATE 6 n 6940 6731',
'STATE 5 a 6942 6941',
'STATE 4 r 6944 6943',
'STATE 4 k 6107 6945',
'STATE 2 r 6108 6946',
'STATE 2 e 6108 6072',
'STATE 4 d 6948 6947',
'STATE 2 b 6077 6072',
'STATE 4 c 6072 6949',
'STATE 2 i 6950 6072',
'STATE 3 f 6072 6951',
'STATE 3 w 6072 6952',
'STATE 3 s 6072 6953',
'STATE 4 f 6072 6954',
'STATE 3 v 6072 6955',
'STATE 3 d 6957 6956',
'STATE 2 d 6072 6958',
'STATE 5 # 6069 6959',
'STATE 6 # 6072 6960',
'STATE 5 f 6076 6961',
'STATE 2 e 6069 6962',
'STATE 6 l 6107 6963',
'STATE 5 d 6965 6964',
'STATE 5 # 6967 6966',
'STATE 4 g 6077 6968',
'STATE 4 v 6970 6969',
'STATE 2 n 6077 6971',
'STATE 3 h 6108 6972',
'STATE 3 r 6077 6973',
'STATE 3 r 6077 6108',
'STATE 3 r 6975 6974',
'STATE 3 k 6107 6976',
'STATE 6 b 6978 6977',
'STATE 3 r 6108 6979',
'STATE 3 r 6108 6107',
'STATE 6 r 6069 6980',
'STATE 5 h 6107 6077',
'STATE 5 l 6982 6981',
'STATE 4 s 6077 6983',
'STATE 6 a 6985 6984',
'STATE 3 s 6077 6986',
'STATE 4 s 6077 6072',
'STATE 3 m 6988 6987',
'STATE 3 d 6108 6077',
'STATE 3 b 6108 6989',
'STATE 4 m 6132 6990',
'STATE 3 m 6992 6991',
'STATE 4 m 6077 6108',
'STATE 5 l 6107 6077',
'STATE 6 t 6077 6107',
'STATE 6 i 6077 6993',
'STATE 6 a 6077 6994',
'STATE 6 l 6069 6107',
'STATE 2 h 6072 6995',
'STATE 4 l 6072 6086',
'STATE 5 t 6077 6072',
'STATE 2 a 6086 6077',
'STATE 5 y 6108 6996',
'STATE 3 t 6108 6997',
'STATE 6 o 6108 6998',
'STATE 6 e 6069 6077',
'STATE 3 d 6077 6108',
'STATE 2 p 6108 6999',
'STATE 2 t 6077 7000',
'STATE 3 f 6077 7001',
'STATE 2 h 6909 6107',
'STATE 2 t 6077 6107',
'STATE 3 f 6107 7002',
'STATE 6 n 6077 7003',
'STATE 3 r 6107 7004',
'STATE 6 k 7006 7005',
'STATE 3 d 6086 7007',
'STATE 4 t 7009 7008',
'STATE 3 t 6108 7010',
'STATE 2 l 6107 6108',
'STATE 2 i 6132 6108',
'STATE 4 t 6072 6589',
'STATE 3 c 6072 6108',
'STATE 2 r 6076 7011',
'STATE 3 s 7013 7012',
'STATE 6 y 6072 7014',
'STATE 4 k 6072 6988',
'STATE 3 w 6072 7015',
'STATE 2 l 6072 7016',
'STATE 2 n 6072 6076',
'STATE 6 r 7018 7017',
'STATE 2 b 6069 7019',
'STATE 6 s 6072 6069',
'STATE 2 y 6076 7020',
'STATE 2 o 6069 7021',
'STATE 2 n 6077 7022',
'STATE 5 i 7024 7023',
'STATE 6 a 7026 7025',
'STATE 5 n 7028 7027',
'STATE 2 e 6107 7029',
'STATE 5 i 7031 7030',
'STATE 6 r 7033 7032',
'STATE 2 r 6072 6077',
'STATE 2 g 6107 7034',
'STATE 4 n 6076 6108',
'STATE 2 e 6108 6077',
'STATE 6 m 6107 7035',
'STATE 6 e 6107 7036',
'STATE 2 a 6107 7037',
'STATE 6 n 7039 7038',
'STATE 2 s 6086 7040',
'STATE 2 s 6108 7041',
'STATE 2 l 6107 6077',
'STATE 4 k 6442 7042',
'STATE 4 l 6077 7043',
'STATE 3 c 6077 7044',
'STATE 5 c 7045 6077',
'STATE 4 n 6077 7046',
'STATE 6 l 6107 7047',
'STATE 6 o 6077 7048',
'STATE 4 n 6072 6077',
'STATE 3 d 6988 7049',
'STATE 3 m 6072 6108',
'STATE 6 l 7051 7050',
'STATE 6 s 6072 7052',
'STATE 3 m 6077 6069',
'STATE 6 i 6107 6072',
'STATE 5 z 6072 7053',
'STATE 3 m 6076 7054',
'STATE 2 o 6108 6107',
'STATE 3 m 6107 7055',
'STATE 6 n 7056 6107',
'STATE 2 q 6077 7057',
'STATE 6 p 6077 7058',
'STATE 2 e 6107 7059',
'STATE 6 r 6072 7060',
'STATE 6 r 6107 7061',
'STATE 6 z 6076 7062',
'STATE 4 c 6107 6077',
'STATE 6 m 6072 7063',
'STATE 2 a 6108 7064',
'STATE 3 l 7066 7065',
'STATE 2 a 6108 7067',
'STATE 3 d 6069 7068',
'STATE 4 s 6077 7069',
'STATE 4 d 6072 6077',
'STATE 3 f 6072 6916',
'STATE 2 e 6132 6072',
'STATE 3 f 6072 7070',
'STATE 6 n 7072 7071',
'STATE 2 # 6077 7073',
'STATE 2 0 7074 6069',
'STATE 5 c 6076 7075',
'STATE 2 i 6069 7076',
'STATE 2 a 6107 7077',
'STATE 4 x 6107 7078',
'STATE 6 # 6076 7079',
'STATE 2 s 6077 7080',
'STATE 2 r 6108 7081',
'STATE 5 r 6108 7082',
'STATE 6 o 7084 7083',
'STATE 2 n 6107 7085',
'STATE 5 u 6108 6077',
'STATE 3 u 7087 7086',
'STATE 4 s 7089 7088',
'STATE 4 s 6072 7090',
'STATE 6 t 6108 6907',
'STATE 3 d 6107 7091',
'STATE 6 m 6077 6107',
'STATE 2 o 6107 7092',
'STATE 2 l 7094 7093',
'STATE 2 a 7096 7095',
'STATE 4 t 6108 7097',
'STATE 2 a 6108 7098',
'STATE 3 d 7100 7099',
'STATE 6 e 7102 7101',
'STATE 3 m 6077 7103',
'STATE 6 e 6077 6069',
'STATE 5 l 6069 6077',
'STATE 4 q 6501 7104',
'STATE 6 # 6072 7105',
'STATE 3 p 6072 7106',
'STATE 3 f 7108 7107',
'STATE 3 v 6072 7109',
'STATE 4 h 6108 7110',
'STATE 4 d 6072 7111',
'STATE 3 r 6107 6773',
'STATE 2 e 6107 7112',
'STATE 2 i 6108 6107',
'STATE 3 l 6077 7113',
'STATE 6 o 6077 7114',
'STATE 3 l 6107 6108',
'STATE 3 d 6107 7115',
'STATE 3 p 6107 6069',
'STATE 6 m 7117 7116',
'STATE 2 e 6072 6107',
'STATE 3 r 6072 7118',
'STATE 3 u 6086 6132',
'STATE 2 l 6077 6076',
'STATE 4 d 6072 7119',
'STATE 3 h 6069 7120',
'STATE 6 l 7122 7121',
'STATE 2 e 6076 7123',
'STATE 2 # 6072 7124',
'STATE 3 g 6077 7125',
'STATE 2 e 6077 7126',
'STATE 5 n 6069 7127',
'STATE 3 p 6076 7128',
'STATE 2 n 6069 7129',
'STATE 3 t 6107 7130',
'STATE 4 n 7132 7131',
'STATE 6 e 7134 7133',
'STATE 3 u 6077 7135',
'STATE 3 l 6076 6077',
'STATE 5 s 7137 7136',
'STATE 6 a 6161 7138',
'STATE 3 s 6069 6077',
'STATE 2 r 6107 7139',
'STATE 4 v 7141 7140',
'STATE 2 g 6072 7142',
'STATE 6 u 6108 7143',
'STATE 2 p 6077 6108',
'STATE 4 m 6076 6108',
'STATE 6 e 6107 7144',
'STATE 2 i 6107 7145',
'STATE 4 y 6108 7146',
'STATE 3 l 6108 6069',
'STATE 3 r 6108 7147',
'STATE 4 t 6108 6069',
'STATE 3 m 6108 6072',
'STATE 3 m 6108 7148',
'STATE 4 z 7150 7149',
'STATE 4 f 7151 6077',
'STATE 3 d 7152 6077',
'STATE 4 n 6077 7153',
'STATE 6 i 7155 7154',
'STATE 4 s 6077 7156',
'STATE 6 l 6077 7157',
'STATE 3 k 7159 7158',
'STATE 3 c 6077 7160',
'STATE 6 n 6108 6077',
'STATE 4 v 6072 7161',
'STATE 4 l 6069 6077',
'STATE 5 i 6076 7162',
'STATE 6 s 6107 7163',
'STATE 6 i 6077 7164',
'STATE 6 t 6077 6072',
'STATE 3 p 6107 6077',
'STATE 6 e 6108 7165',
'STATE 4 d 6108 7166',
'STATE 4 s 6072 7167',
'STATE 2 p 6072 7168',
'STATE 2 a 6069 7169',
'STATE 3 v 6077 7170',
'STATE 3 f 6108 6077',
'STATE 3 m 6108 7171',
'STATE 6 d 6072 6077',
'STATE 3 r 6077 6072',
'STATE 3 r 6072 6077',
'STATE 6 o 6069 6072',
'STATE 2 n 6076 7172',
'STATE 2 s 7173 6069',
'STATE 2 l 6107 7174',
'STATE 3 u 7176 7175',
'STATE 5 k 6077 7177',
'STATE 6 z 6108 7178',
'STATE 4 v 6107 7179',
'STATE 4 d 6077 7180',
'STATE 5 m 6077 7181',
'STATE 6 # 6077 6107',
'STATE 2 n 6077 7182',
'STATE 2 i 6107 7183',
'STATE 2 c 6072 7184',
'STATE 3 g 6077 6072',
'STATE 4 s 6086 6108',
'STATE 4 m 7186 7185',
'STATE 6 i 6107 7187',
'STATE 3 n 6077 7188',
'STATE 2 c 7190 7189',
'STATE 2 n 6108 7191',
'STATE 3 g 6108 7192',
'STATE 5 h 7194 7193',
'STATE 3 p 6069 6077',
'STATE 6 u 6108 6077',
'STATE 4 s 6077 6108',
'STATE 4 s 6077 7195',
'STATE 6 a 6132 7196',
'STATE 4 b 6072 6077',
'STATE 6 r 6077 7197',
'STATE 6 a 6077 7198',
'STATE 6 n 6077 7199',
'STATE 4 l 6077 6108',
'STATE 4 t 7201 7200',
'STATE 3 f 6072 6077',
'STATE 5 o 6108 7202',
'STATE 2 o 6107 6077',
'STATE 2 k 6077 7203',
'STATE 2 a 6108 7204',
'STATE 4 c 6108 6072',
'STATE 2 s 6072 7205',
'STATE 4 n 6072 7206',
'STATE 3 p 6069 7207',
'STATE 3 p 6077 7208',
'STATE 3 u 6072 7209',
'STATE 2 m 6076 7210',
'STATE 3 h 6069 6072',
'STATE 3 v 6107 7211',
'STATE 5 m 7213 7212',
'STATE 2 q 7215 7214',
'STATE 6 k 6077 7216',
'STATE 6 o 7218 7217',
'STATE 4 f 6108 7219',
'STATE 2 a 6077 7220',
'STATE 6 b 6108 7221',
'STATE 3 s 6072 7222',
'STATE 2 l 6107 7223',
'STATE 4 f 6069 7224',
'STATE 3 u 7226 7225',
'STATE 6 t 6069 6108',
'STATE 3 l 6077 6107',
'STATE 3 t 6077 7227',
'STATE 3 l 6108 7228',
'STATE 3 l 6077 6108',
'STATE 2 e 6108 7229',
'STATE 3 n 6108 7230',
'STATE 5 y 6550 7231',
'STATE 3 n 6069 7232',
'STATE 3 t 6072 7233',
'STATE 4 t 6072 7234',
'STATE 6 c 6108 6077',
'STATE 3 k 6077 7235',
'STATE 6 t 6077 7236',
'STATE 4 j 6072 7237',
'STATE 3 t 6072 6069',
'STATE 6 n 6072 7238',
'STATE 2 c 6077 7239',
'STATE 4 n 7241 7240',
'STATE 3 w 6072 7242',
'STATE 3 f 6072 7243',
'STATE 3 r 6076 7201',
'STATE 4 m 6077 7244',
'STATE 2 c 6076 7245',
'STATE 3 h 6076 7246',
'STATE 2 r 6107 7247',
'STATE 3 h 7249 7248',
'STATE 6 a 7250 6077',
'STATE 4 t 7252 7251',
'STATE 5 t 6077 7253',
'STATE 2 u 7255 7254',
'STATE 6 t 7257 7256',
'STATE 4 t 6077 7258',
'STATE 4 t 6108 7259',
'STATE 3 w 6077 7260',
'STATE 6 o 6077 7261',
'STATE 3 l 6072 6077',
'STATE 2 h 6107 7262',
'STATE 2 w 6072 7263',
'STATE 3 h 7265 7264',
'STATE 4 n 6108 6086',
'STATE 2 e 6077 7266',
'STATE 4 s 6077 7267',
'STATE 4 d 6108 7268',
'STATE 4 p 6108 7269',
'STATE 6 a 6077 7270',
'STATE 4 s 6077 7271',
'STATE 3 r 6072 7272',
'STATE 4 b 6108 6077',
'STATE 3 h 6077 7273',
'STATE 3 w 6077 7274',
'STATE 3 w 6072 7275',
'STATE 5 a 6072 7276',
'STATE 2 s 6077 6442',
'STATE 2 i 7096 7277',
'STATE 6 l 7279 7278',
'STATE 4 c 6108 7280',
'STATE 3 h 6108 7166',
'STATE 3 c 6077 7281',
'STATE 2 r 6076 7282',
'STATE 2 h 6076 7283',
'STATE 2 p 6107 7284',
'STATE 4 q 7286 7285',
'STATE 5 u 6108 7287',
'STATE 2 a 6108 6077',
'STATE 2 o 6069 7288',
'STATE 2 c 6108 6086',
'STATE 4 p 6077 7289',
'STATE 3 u 7291 7290',
'STATE 3 n 6077 7292',
'STATE 6 a 7294 7293',
'STATE 3 b 6077 7295',
'STATE 4 s 6077 7296',
'STATE 3 c 6077 7297',
'STATE 6 # 6072 7298',
'STATE 3 f 6077 7299',
'STATE 3 s 6107 7300',
'STATE 4 s 6072 7301',
'STATE 2 t 6072 7302',
'STATE 4 z 6072 6077',
'STATE 3 r 7303 6107',
'STATE 3 m 6108 7304',
'STATE 2 p 6108 7305',
'STATE 2 i 6072 7306',
'STATE 6 o 6077 7307',
'STATE 3 s 6072 7308',
'STATE 3 s 6072 7155',
'STATE 6 b 6077 7309',
'STATE 4 n 6069 7310',
'STATE 3 s 6072 7311',
'STATE 6 a 6072 7312',
'STATE 3 u 7314 7313',
'STATE 6 t 6108 7315',
'STATE 3 t 6108 6069',
'STATE 3 u 6072 7316',
'STATE 4 n 7318 7317',
'STATE 3 s 6076 7319',
'STATE 6 d 7321 7320',
'STATE 3 f 6077 6107',
'STATE 3 g 7323 7322',
'STATE 6 i 6077 6076',
'STATE 4 d 6108 7324',
'STATE 5 # 6108 7325',
'STATE 5 l 6077 7326',
'STATE 5 c 7328 7327',
'STATE 2 q 6077 7329',
'STATE 5 # 7330 6108',
'STATE 4 v 7332 7331',
'STATE 4 f 6108 7333',
'STATE 3 t 6077 7334',
'STATE 2 n 6069 7335',
'STATE 3 t 6108 6855',
'STATE 6 s 6072 7336',
'STATE 5 u 6076 6077',
'STATE 3 t 6107 7337',
'STATE 3 f 6072 7338',
'STATE 2 o 7340 7339',
'STATE 2 u 6107 6077',
'STATE 3 n 6108 7341',
'STATE 2 u 6108 7342',
'STATE 4 t 6072 6108',
'STATE 5 v 6077 7343',
'STATE 6 d 6108 6077',
'STATE 3 l 6077 7344',
'STATE 3 l 6077 7345',
'STATE 6 n 6108 7346',
'STATE 4 f 6072 7347',
'STATE 2 p 6072 7348',
'STATE 2 g 6072 6069',
'STATE 2 r 6108 6077',
'STATE 4 b 7350 7349',
'STATE 3 h 6072 7351',
'STATE 6 t 7353 7352',
'STATE 2 i 6108 7354',
'STATE 3 r 6076 7355',
'STATE 2 l 6076 7356',
'STATE 6 i 7358 7357',
'STATE 2 c 6077 7359',
'STATE 2 w 6077 7360',
'STATE 2 g 6077 7361',
'STATE 5 # 6077 7362',
'STATE 2 a 7364 7363',
'STATE 2 i 6108 7365',
'STATE 5 s 6108 7366',
'STATE 3 b 6077 7367',
'STATE 4 b 6108 7368',
'STATE 3 t 6107 7369',
'STATE 3 b 6076 7370',
'STATE 2 a 6077 7371',
'STATE 2 s 6077 7372',
'STATE 3 m 6072 7373',
'STATE 2 d 6107 7374',
'STATE 2 a 6108 7375',
'STATE 4 b 6108 7376',
'STATE 4 l 6072 6108',
'STATE 3 r 7378 7377',
'STATE 2 i 6108 7379',
'STATE 3 m 7380 6077',
'STATE 3 v 6077 7381',
'STATE 6 f 6077 7382',
'STATE 3 r 6072 6108',
'STATE 4 t 7384 7383',
'STATE 3 m 6069 7385',
'STATE 3 h 6077 7386',
'STATE 2 e 6077 6108',
'STATE 4 d 7388 7387',
'STATE 3 m 6072 7161',
'STATE 3 n 6072 6077',
'STATE 3 p 6072 7389',
'STATE 6 s 6076 6069',
'STATE 2 d 6076 7390',
'STATE 2 i 7392 7391',
'STATE 4 z 6076 7393',
'STATE 6 i 6077 7394',
'STATE 4 s 7395 6077',
'STATE 5 s 6108 6790',
'STATE 4 t 6108 6077',
'STATE 2 p 6077 7396',
'STATE 3 t 6108 7397',
'STATE 2 e 6077 7398',
'STATE 5 # 6108 6077',
'STATE 3 l 6077 7399',
'STATE 4 f 7401 7400',
'STATE 6 l 6077 7402',
'STATE 3 u 6076 7403',
'STATE 4 v 6077 7404',
'STATE 2 o 6077 7405',
'STATE 2 e 6077 7406',
'STATE 3 w 6077 6107',
'STATE 2 i 6108 7407',
'STATE 4 p 6077 7408',
'STATE 3 t 6108 7409',
'STATE 6 r 6108 7410',
'STATE 3 t 6108 7411',
'STATE 4 t 7412 6077',
'STATE 6 i 6072 6077',
'STATE 6 s 6108 6077',
'STATE 4 l 6072 6076',
'STATE 5 h 6076 6072',
'STATE 4 k 6072 7413',
'STATE 4 f 7415 7414',
'STATE 4 c 7416 6077',
'STATE 3 r 6108 6077',
'STATE 3 e 6076 7417',
'STATE 2 g 6076 7418',
'STATE 2 a 7420 7419',
'STATE 6 a 7422 7421',
'STATE 5 t 6077 7423',
'STATE 2 r 7424 6108',
'STATE 2 t 6077 7425',
'STATE 3 x 6108 7426',
'STATE 6 o 6108 7427',
'STATE 6 i 6077 7428',
'STATE 3 p 7429 6077',
'STATE 6 v 7431 7430',
'STATE 2 n 6077 7432',
'STATE 3 d 6107 6108',
'STATE 2 i 6077 7433',
'STATE 2 q 6108 7434',
'STATE 2 e 6076 7435',
'STATE 6 i 6072 7436',
'STATE 2 l 6108 7437',
'STATE 6 l 6108 7438',
'STATE 2 u 6069 7439',
'STATE 6 c 6077 6108',
'STATE 4 n 6108 7440',
'STATE 6 u 6069 6077',
'STATE 2 n 6108 7441',
'STATE 2 n 6077 7442',
'STATE 2 o 6077 6108',
'STATE 3 d 6077 6072',
'STATE 2 t 6072 7443',
'STATE 2 t 6076 7444',
'STATE 6 e 7446 7445',
'STATE 5 t 7448 7447',
'STATE 5 c 6077 7449',
'STATE 4 t 6107 7450',
'STATE 3 c 7452 7451',
'STATE 5 l 6077 6108',
'STATE 2 c 6077 7089',
'STATE 6 o 7454 7453',
'STATE 3 r 6077 7455',
'STATE 6 h 6077 7456',
'PHONE ae1',
'STATE 6 s 7458 7457',
'STATE 4 t 6108 6072',
'STATE 6 c 7459 6108',
'STATE 3 d 6076 6077',
'STATE 3 m 6077 7460',
'STATE 4 l 6077 6076',
'STATE 3 l 7462 7461',
'STATE 3 d 6108 7463',
'STATE 4 n 7465 7464',
'STATE 6 v 6108 7466',
'STATE 3 n 6108 7467',
'STATE 4 t 7469 7468',
'STATE 4 m 6077 7470',
'STATE 2 p 6076 7471',
'STATE 2 f 6069 6076',
'STATE 5 z 7473 7472',
'STATE 4 b 7475 7474',
'STATE 4 s 7477 7476',
'STATE 3 t 6077 7478',
'STATE 5 t 7480 7479',
'STATE 4 d 6077 7159',
'STATE 2 l 7452 7481',
'STATE 4 p 6108 6077',
'STATE 2 g 6077 7482',
'STATE 2 e 6108 7483',
'STATE 3 m 6077 7484',
'STATE 6 t 6077 7485',
'STATE 4 t 7487 7486',
'STATE 4 t 7489 7488',
'STATE 3 c 7491 7490',
'STATE 4 m 6077 7492',
'STATE 2 g 6072 7493',
'STATE 2 b 6072 6077',
'STATE 2 r 6108 7494',
'STATE 6 m 6077 7495',
'STATE 6 i 6108 7496',
'STATE 6 d 6077 7497',
'STATE 3 l 6108 7096',
'STATE 6 a 6108 7498',
'STATE 6 c 6108 7499',
'STATE 4 p 6108 7500',
'STATE 2 n 6076 6072',
'STATE 5 u 7502 7501',
'STATE 6 o 6076 6077',
'STATE 3 t 7504 7503',
'STATE 5 l 6108 6077',
'STATE 5 # 7506 7505',
'STATE 5 # 7508 7507',
'STATE 6 s 6108 7509',
'STATE 4 s 7511 7510',
'STATE 3 n 6108 7512',
'STATE 4 t 7514 7513',
'STATE 2 e 7516 7515',
'STATE 5 s 7190 6077',
'STATE 3 b 6077 6916',
'STATE 3 r 6077 7517',
'STATE 4 h 6069 7518',
'STATE 2 e 6077 7410',
'STATE 4 n 7520 7519',
'STATE 2 e 6076 6072',
'STATE 2 g 6077 6108',
'STATE 2 a 6077 6108',
'STATE 4 p 6077 7521',
'STATE 3 r 6077 7522',
'STATE 4 k 6072 7523',
'STATE 2 a 6108 7524',
'STATE 6 v 6108 7250',
'STATE 3 v 6077 7525',
'STATE 2 o 6076 7526',
'STATE 2 s 6072 6108',
'STATE 2 r 6072 7527',
'STATE 2 o 7529 7528',
'STATE 4 t 6108 7530',
'STATE 3 v 6077 7531',
'STATE 2 s 6077 7532',
'STATE 4 b 6108 7533',
'STATE 4 d 6108 7534',
'STATE 3 r 7536 7535',
'STATE 3 x 6108 6077',
'STATE 3 v 6077 7537',
'STATE 6 e 6108 7538',
'STATE 3 n 6069 6108',
'STATE 3 v 6077 6108',
'STATE 3 m 6077 7539',
'STATE 5 r 6076 6077',
'STATE 3 l 6077 7540',
'STATE 3 m 6077 7541',
'STATE 2 n 6077 6108',
'STATE 3 r 6077 7542',
'STATE 4 l 6108 7543',
'STATE 2 d 6077 7544',
'STATE 3 l 6108 7545',
'STATE 2 n 6077 7546',
'STATE 3 l 6072 7547',
'STATE 3 p 6108 7548',
'STATE 2 r 6108 7549',
'STATE 4 s 6077 7550',
'STATE 2 l 6108 7551',
'STATE 6 h 7553 7552',
'STATE 5 t 7555 7554',
'STATE 4 f 6108 7556',
'STATE 5 l 7558 7557',
'STATE 4 t 6072 7559',
'STATE 4 d 6108 7560',
'STATE 4 l 6108 7561',
'STATE 3 t 6108 7562',
'STATE 5 s 6077 6108',
'STATE 3 r 7563 6108',
'STATE 4 b 6108 7564',
'STATE 4 s 7565 6077',
'STATE 3 k 7567 7566',
'STATE 6 u 6077 7568',
'STATE 4 d 6077 7569',
'STATE 4 m 6108 6069',
'STATE 3 f 6077 6818',
'STATE 2 e 7122 6077',
'STATE 6 r 6077 7570',
'STATE 2 o 6108 7571',
'STATE 6 n 6108 7572',
'STATE 4 n 6077 7573',
'STATE 2 s 6077 7574',
'STATE 3 l 6072 7575',
'STATE 5 r 7577 7576',
'STATE 5 c 6077 7536',
'STATE 3 s 6108 7578',
'STATE 4 s 6108 6077',
'STATE 6 s 6108 7579',
'STATE 5 r 6108 7580',
'STATE 4 l 6077 7581',
'STATE 4 l 6077 7582',
'STATE 6 d 6108 7583',
'STATE 4 t 6108 6076',
'STATE 6 a 6077 6107',
'STATE 6 o 6077 6108',
'STATE 5 s 6108 7584',
'STATE 2 c 6077 7585',
'STATE 5 # 7587 7586',
'STATE 2 c 7366 6077',
'STATE 3 d 6077 7588',
'STATE 6 l 7590 7589',
'STATE 6 e 6077 6072',
'STATE 3 n 6072 7591',
'STATE 3 t 6069 7592',
'STATE 2 s 6108 7593',
'STATE 3 r 7595 7594',
'STATE 4 n 6077 6072',
'STATE 2 e 7597 7596',
'STATE 6 o 7598 6108',
'STATE 4 d 6108 7599',
'STATE 2 t 6077 7600',
'STATE 2 l 6108 7601',
'STATE 3 r 7013 7602',
'STATE 5 l 6108 6069',
'STATE 3 c 6108 7603',
'STATE 6 # 6077 7604',
'STATE 5 k 6077 6902',
'STATE 5 f 6108 7605',
'STATE 3 t 7607 7606',
'STATE 3 n 6077 7608',
'STATE 6 b 6077 7609',
'STATE 3 s 6077 6069',
'STATE 4 l 6072 7610',
'STATE 3 r 6108 7611',
'STATE 3 h 6077 6108',
'STATE 2 l 6108 7612',
'STATE 4 c 6108 7613',
'STATE 4 d 7615 7614',
'STATE 3 l 7617 7616',
'STATE 4 p 6077 6108',
'STATE 5 c 6108 7618',
'STATE 2 s 6077 6108',
'STATE 2 u 6108 7619',
'STATE 4 p 6108 6132',
'STATE 4 t 7621 7620',
'STATE 5 p 6077 6108',
'STATE 6 e 6077 7622',
'STATE 3 d 6077 7623',
'STATE 2 t 6077 7624',
'STATE 3 l 6077 7625',
'STATE 3 h 6077 7626',
'STATE 3 c 6072 7627',
'STATE 6 w 6077 6069',
'STATE 3 h 6108 7628',
'STATE 6 t 6108 6077',
'STATE 4 s 7630 7629',
'STATE 5 t 6077 7631',
'STATE 6 r 6108 7632',
'STATE 4 s 7633 6077',
'STATE 3 f 6077 7634',
'STATE 4 m 6077 7635',
'STATE 3 x 6108 7636',
'STATE 5 c 6077 7637',
'STATE 5 s 6077 7638',
'STATE 3 p 6077 7639',
'STATE 2 s 6077 7517',
'STATE 6 e 6108 6077',
'STATE 4 l 7410 7640',
'STATE 3 r 6072 7641',
'STATE 2 e 6108 7166',
'STATE 3 s 7643 7642',
'STATE 3 r 7645 7644',
'STATE 3 b 6077 7646',
'STATE 5 # 7648 7647',
'STATE 6 # 6108 7649',
'STATE 3 t 6077 7650',
'STATE 2 o 7652 7651',
'STATE 6 # 7475 7653',
'STATE 5 u 6077 7654',
'STATE 5 n 6077 7655',
'STATE 2 i 6902 7656',
'STATE 2 n 6077 7657',
'STATE 4 d 6108 6072',
'STATE 2 r 7659 7658',
'STATE 2 r 6077 6108',
'STATE 5 # 7661 7660',
'STATE 2 h 6077 7662',
'STATE 2 r 6108 7663',
'STATE 3 p 6077 7664',
'STATE 4 l 6108 7665',
'STATE 5 # 6077 6108',
'STATE 3 l 7555 7666',
'STATE 2 r 7388 7667',
'STATE 5 t 6077 6108',
'STATE 3 m 6077 7668',
'STATE 5 z 6077 6108',
'STATE 3 s 6077 7669',
'STATE 2 y 6108 7670',
'STATE 3 l 6077 7671',
'STATE 2 c 6077 7672',
'STATE 3 r 7652 7673',
'STATE 3 t 7675 7674',
'STATE 3 b 6077 7676',
'STATE 5 c 6076 6077',
'STATE 2 u 6108 7677',
'STATE 3 d 7563 7678',
'STATE 3 s 6108 7152',
'STATE 3 d 6077 7679',
'STATE 3 n 7555 6077',
'STATE 6 l 6077 7159',
'STATE 3 c 6077 7680',
'STATE 2 r 6077 7681',
'STATE 6 c 6077 7682',
'STATE 2 u 7684 7683',
'STATE 3 t 6076 7685',
'STATE 3 n 6108 7686',
'STATE 6 # 6108 7687',
'STATE 2 l 6077 7688',
'STATE 2 g 6077 7600',
'STATE 3 n 6108 7689',
'STATE 3 m 6108 7690',
'STATE 2 n 6077 7691',
'STATE 2 l 6077 7692',
'STATE 3 m 6077 6108',
'STATE 2 l 7452 7693',
'STATE 5 # 7695 7694',
'STATE 3 n 6108 7696',
'STATE 6 o 7698 7697',
'STATE 6 s 6108 6069',
'STATE 2 y 6108 7699',
'STATE 5 t 7701 7700',
'STATE 4 t 6077 7702',
'STATE 6 a 6108 6077',
'STATE 3 b 7704 7703',
'STATE 4 l 7706 7705',
'STATE 6 # 6108 6077',
'STATE 4 t 6077 6108',
'STATE 4 t 7707 6077',
'STATE 3 w 6077 7708',
'STATE 5 c 6077 6108',
'STATE 2 r 6077 7709',
'STATE 3 r 7424 7710',
'STATE 3 t 6108 7711',
'STATE 3 b 6108 6077',
'STATE 3 n 6077 7712',
'STATE 2 o 6108 7713',
'STATE 3 t 7714 6077',
'STATE 3 c 7716 7715',
'STATE 3 m 6108 6077',
'STATE 3 s 6077 7717',
'STATE 3 d 6077 7718',
'STATE 6 a 6108 7719',
'STATE 3 s 6077 7720',
'STATE 2 n 7721 6077',
'STATE 2 b 6108 6077',
'STATE 2 n 6108 6077',
'STATE 3 k 6077 7722',
'STATE 2 s 6108 7424',
'STATE 3 k 6077 7723',
'STATE 3 t 7725 7724',
'STATE 3 v 6108 6077',
'STATE 3 x 6077 7726',
'STATE 3 g 6077 6108',
'STATE 2 b 6108 7727',
'STATE 3 p 6077 7728',
'STATE 2 u 6077 7729',
'STATE 2 n 6077 7730',
'STATE 4 s 6902 6077',
'STATE 5 l 7732 7731',
'STATE 6 s 6108 7733',
'STATE 3 n 6077 7734',
'STATE 2 t 6077 6108',
'STATE 3 t 6077 7735',
'STATE 3 b 6077 7736',
'STATE 3 l 6077 7737',
'STATE 3 s 6077 7190',
'STATE 5 t 6108 6077',
'STATE 2 s 7738 6077',
'STATE 3 f 6108 7739',
'STATE 3 t 7691 6077',
'STATE 2 n 7740 6934',
'STATE 6 r 6108 6077',
'INDEX 7741 j',
'STATE 3 # 7743 7742',
'STATE 4 a 7745 7744',
'PHONE jh',
'STATE 3 n 7743 7746',
'STATE 3 o 7748 7747',
'STATE 3 d 7743 7749',
'STATE 3 a 7743 7750',
'PHONE y',
'STATE 4 i 7743 7751',
'STATE 3 e 7748 7752',
'STATE 4 o 7754 7753',
'STATE 3 u 7748 7743',
'STATE 4 e 7743 7755',
'STATE 3 s 7757 7756',
'STATE 4 u 7743 7758',
'STATE 3 b 7748 7743',
'PHONE epsilon',
'STATE 3 o 7757 7759',
'STATE 4 k 7757 7760',
'STATE 4 d 7757 7761',
'STATE 3 e 7757 7743',
'INDEX 7762 k',
'STATE 4 n 7764 7763',
'STATE 4 k 7766 7765',
'STATE 1 0 7766 7767',
'PHONE k',
'PHONE epsilon',
'STATE 1 n 7766 7765',
'INDEX 7768 l',
'STATE 4 l 7770 7769',
'STATE 4 e 7772 7771',
'STATE 5 # 7774 7773',
'STATE 6 g 7776 7775',
'STATE 3 b 7778 7777',
'STATE 6 # 7774 7779',
'PHONE epsilon',
'STATE 4 k 7781 7780',
'STATE 4 i 7783 7782',
'STATE 5 # 7785 7784',
'STATE 5 # 7787 7786',
'STATE 2 t 7774 7788',
'STATE 3 l 7790 7789',
'STATE 3 a 7792 7791',
'PHONE l',
'STATE 3 l 7782 7793',
'STATE 3 t 7795 7794',
'STATE 3 l 7782 7796',
'STATE 2 # 7782 7797',
'PHONE ah-l',
'STATE 6 k 7774 7798',
'STATE 4 m 7800 7799',
'STATE 6 0 7782 7801',
'STATE 3 o 7802 7782',
'STATE 2 w 7774 7803',
'STATE 3 b 7787 7804',
'STATE 6 # 7806 7805',
'STATE 5 y 7782 7807',
'STATE 3 a 7782 7808',
'STATE 5 s 7787 7809',
'STATE 3 a 7774 7810',
'STATE 4 # 7812 7811',
'STATE 3 a 7814 7813',
'STATE 4 u 7815 7782',
'STATE 2 f 7774 7816',
'STATE 2 t 7774 7817',
'STATE 3 g 7787 7818',
'STATE 3 d 7820 7819',
'STATE 5 y 7782 7821',
'STATE 6 s 7782 7822',
'STATE 3 i 7782 7823',
'STATE 5 d 7787 7824',
'STATE 6 l 7825 7774',
'STATE 3 u 7827 7826',
'STATE 3 d 7787 7828',
'STATE 3 o 7829 7782',
'STATE 5 # 7774 7830',
'STATE 2 e 7831 7782',
'STATE 5 # 7774 7782',
'STATE 5 # 7774 7832',
'STATE 3 t 7834 7833',
'STATE 3 g 7836 7835',
'STATE 6 s 7782 7837',
'STATE 3 l 7782 7838',
'STATE 5 r 7840 7839',
'STATE 3 o 7782 7841',
'STATE 5 y 7782 7842',
'STATE 2 c 7782 7774',
'STATE 4 f 7844 7843',
'STATE 5 # 7845 7782',
'STATE 3 t 7787 7846',
'STATE 2 c 7774 7782',
'STATE 5 a 7782 7847',
'STATE 5 m 7782 7848',
'STATE 5 a 7782 7849',
'STATE 2 z 7787 7850',
'STATE 2 r 7782 7851',
'STATE 3 p 7853 7852',
'STATE 2 # 7782 7854',
'STATE 2 d 7787 7855',
'STATE 3 i 7782 7856',
'STATE 6 g 7782 7857',
'STATE 2 i 7787 7858',
'STATE 3 e 7782 7859',
'STATE 2 a 7787 7860',
'STATE 4 v 7862 7861',
'STATE 2 h 7863 7782',
'STATE 4 t 7864 7782',
'STATE 3 g 7787 7865',
'STATE 2 c 7774 7866',
'STATE 5 l 7867 7782',
'STATE 5 o 7782 7868',
'STATE 3 p 7787 7869',
'STATE 2 s 7782 7787',
'STATE 3 k 7871 7870',
'STATE 2 p 7873 7872',
'STATE 5 c 7782 7874',
'STATE 6 a 7787 7875',
'STATE 3 a 7782 7876',
'STATE 5 t 7782 7877',
'STATE 2 s 7782 7878',
'STATE 3 y 7782 7879',
'STATE 2 u 7787 7880',
'STATE 4 n 7829 7782',
'STATE 3 a 7881 7782',
'STATE 3 a 7774 7782',
'STATE 2 a 7774 7782',
'STATE 3 a 7782 7882',
'STATE 2 b 7774 7881',
'PHONE y',
'STATE 2 f 7774 7883',
'STATE 3 d 7885 7884',
'STATE 3 z 7787 7782',
'STATE 2 # 7782 7886',
'STATE 5 c 7787 7782',
'STATE 5 m 7782 7787',
'STATE 6 s 7782 7887',
'STATE 2 n 7787 7782',
'STATE 3 e 7782 7888',
'STATE 2 n 7787 7889',
'STATE 2 u 7787 7782',
'STATE 3 u 7782 7890',
'STATE 6 s 7782 7891',
'STATE 2 h 7774 7782',
'STATE 3 e 7782 7892',
'STATE 2 h 7774 7893',
'STATE 3 f 7787 7894',
'STATE 2 d 7787 7782',
'STATE 6 s 7782 7895',
'STATE 6 o 7787 7896',
'STATE 3 o 7782 7897',
'STATE 5 s 7787 7898',
'STATE 3 r 7900 7899',
'STATE 5 t 7782 7901',
'STATE 3 i 7782 7902',
'STATE 2 b 7774 7782',
'STATE 3 s 7782 7903',
'STATE 5 b 7787 7782',
'STATE 6 a 7787 7904',
'STATE 5 s 7906 7905',
'STATE 5 d 7787 7907',
'STATE 3 w 7782 7908',
'STATE 2 a 7782 7787',
'STATE 2 m 7782 7909',
'STATE 2 c 7911 7910',
'STATE 3 c 7912 7782',
'STATE 6 e 7787 7913',
'STATE 5 d 7915 7914',
'STATE 3 y 7782 7916',
'STATE 5 m 7787 7917',
'STATE 3 s 7918 7787',
'STATE 5 m 7782 7919',
'STATE 3 u 7782 7920',
'STATE 3 h 7787 7782',
'STATE 2 # 7782 7787',
'STATE 2 n 7782 7787',
'STATE 5 r 7921 7782',
'STATE 3 u 7782 7922',
'STATE 3 u 7782 7923',
'STATE 5 b 7787 7924',
'STATE 2 i 7782 7787',
'STATE 2 b 7782 7925',
'STATE 3 o 7782 7926',
'STATE 3 s 7851 7927',
'STATE 3 w 7782 7928',
'STATE 3 r 7782 7929',
'STATE 6 e 7787 7930',
'STATE 5 r 7787 7782',
'STATE 3 h 7782 7931',
'STATE 3 g 7933 7932',
'STATE 3 r 7782 7934',
'STATE 3 w 7782 7787',
'STATE 2 t 7787 7782',
'STATE 3 r 7782 7935',
'STATE 3 d 7937 7936',
'STATE 2 a 7782 7938',
'STATE 2 n 7787 7939',
'STATE 3 y 7782 7929',
'STATE 2 c 7911 7940',
'STATE 2 n 7782 7941',
'STATE 2 e 7782 7942',
'STATE 3 d 7787 7943',
'STATE 3 f 7945 7944',
'STATE 2 d 7782 7787',
'STATE 2 n 7787 7946',
'STATE 3 k 7787 7947',
'STATE 3 p 7948 7782',
'STATE 2 f 7782 7787',
'STATE 2 i 7787 7782',
'STATE 3 g 7787 7949',
'STATE 2 p 7782 7787',
'STATE 2 f 7787 7950',
'STATE 2 z 7787 7951',
'STATE 3 p 7787 7952',
'STATE 3 c 7787 7782',
'INDEX 7953 m',
'STATE 4 m 7955 7954',
'STATE 4 c 7957 7956',
'PHONE epsilon',
'STATE 3 s 7959 7958',
'STATE 2 0 7961 7960',
'STATE 4 l 7960 7962',
'STATE 4 # 7964 7963',
'PHONE m',
'STATE 5 e 7966 7965',
'STATE 3 h 7967 7960',
'STATE 4 s 7964 7968',
'PHONE ah-m',
'STATE 5 i 7970 7969',
'STATE 6 l 7970 7971',
'STATE 2 t 7972 7960',
'STATE 5 r 7973 7960',
'PHONE m-ah',
'PHONE m-ae1',
'STATE 6 n 7970 7969',
'STATE 6 0 7964 7960',
'STATE 4 e 7974 7960',
'STATE 2 e 7960 7964',
'INDEX 7975 n',
'STATE 4 g 7977 7976',
'STATE 4 n 7979 7978',
'STATE 5 # 7981 7980',
'STATE 4 k 7983 7982',
'STATE 2 m 7985 7984',
'STATE 5 e 7987 7986',
'PHONE ng',
'STATE 4 c 7989 7988',
'STATE 6 m 7991 7990',
'STATE 6 s 7985 7992',
'PHONE epsilon',
'STATE 5 i 7994 7993',
'STATE 6 r 7996 7995',
'STATE 4 q 7998 7997',
'STATE 5 t 7981 7999',
'STATE 5 n 8001 8000',
'PHONE n',
'STATE 5 i 7985 8002',
'STATE 5 r 8004 8003',
'STATE 2 # 7991 8005',
'STATE 6 # 7991 8006',
'STATE 2 s 7991 8007',
'STATE 4 x 7981 7991',
'STATE 2 # 7991 8008',
'STATE 5 k 7981 8009',
'STATE 6 y 7981 8010',
'STATE 2 # 7991 7981',
'STATE 2 y 7985 8011',
'STATE 6 g 7991 8012',
'STATE 6 a 7991 8013',
'STATE 6 b 7991 8014',
'STATE 6 s 7991 8015',
'STATE 2 r 7981 8016',
'STATE 6 e 7981 7991',
'STATE 5 e 7991 8017',
'STATE 5 i 7981 8018',
'STATE 2 # 7985 8019',
'STATE 5 y 7991 7981',
'STATE 6 o 7991 7981',
'STATE 6 a 7991 8020',
'STATE 2 l 8022 8021',
'STATE 2 h 7981 8023',
'STATE 5 # 7981 8024',
'STATE 6 p 7991 7981',
'STATE 2 i 7985 8025',
'STATE 2 m 7981 8026',
'STATE 6 l 8028 8027',
'STATE 6 n 7981 8029',
'STATE 2 n 7981 8030',
'STATE 5 i 7991 8031',
'STATE 2 b 8032 7985',
'STATE 2 l 7981 8033',
'STATE 6 o 7991 8034',
'STATE 2 v 7991 7981',
'STATE 6 l 7981 7991',
'STATE 2 f 7981 8035',
'STATE 5 y 7991 8036',
'STATE 6 # 8037 7985',
'STATE 2 b 7981 8038',
'STATE 6 a 7991 8039',
'STATE 2 w 7981 8040',
'STATE 5 h 8042 8041',
'STATE 5 e 7991 7985',
'STATE 2 v 7981 8043',
'STATE 2 t 7991 8044',
'STATE 2 g 7991 7981',
'STATE 6 # 8046 8045',
'STATE 6 e 7991 8047',
'STATE 6 n 8048 7991',
'STATE 2 r 7991 8049',
'STATE 6 l 8051 8050',
'STATE 5 a 7981 8052',
'STATE 2 s 7981 7991',
'STATE 2 r 7981 7991',
'STATE 6 m 7981 8053',
'STATE 2 d 7981 8054',
'STATE 5 a 7991 7981',
'STATE 2 i 7991 8055',
'STATE 6 d 7991 8056',
'STATE 6 s 7991 8057',
'STATE 2 r 7991 7981',
'STATE 2 # 7991 8058',
'STATE 2 r 8059 7991',
'STATE 6 n 7981 7991',
'STATE 6 i 7991 8060',
'STATE 5 o 7981 7991',
'INDEX 8061 o',
'STATE 4 r 8063 8062',
'STATE 4 # 8065 8064',
'STATE 1 0 8067 8066',
'STATE 3 o 8069 8068',
'STATE 3 o 8071 8070',
'STATE 1 # 8073 8072',
'STATE 3 w 8075 8074',
'STATE 4 o 8077 8076',
'STATE 4 d 8079 8078',
'STATE 3 a 8081 8080',
'PHONE uw1',
'STATE 5 # 8083 8082',
'STATE 3 o 8085 8084',
'STATE 3 c 8087 8086',
'PHONE epsilon',
'STATE 4 u 8089 8088',
'STATE 3 c 8090 8075',
'STATE 4 k 8092 8091',
'STATE 2 l 8094 8093',
'STATE 3 g 8096 8095',
'PHONE aw1',
'STATE 3 w 8098 8097',
'STATE 3 c 8100 8099',
'STATE 2 s 8100 8101',
'STATE 2 d 8100 8102',
'STATE 5 r 8104 8103',
'STATE 5 r 8105 8100',
'STATE 4 n 8107 8106',
'STATE 5 s 8109 8108',
'STATE 5 r 8096 8075',
'STATE 2 f 8111 8110',
'STATE 1 s 8113 8112',
'STATE 2 f 8071 8114',
'PHONE ah1',
'STATE 3 d 8096 8115',
'PHONE ow',
'STATE 5 s 8117 8116',
'STATE 2 a 8075 8118',
'STATE 3 o 8120 8119',
'PHONE ao1',
'STATE 2 f 8122 8121',
'STATE 2 c 8100 8120',
'STATE 5 e 8124 8123',
'STATE 6 o 8126 8125',
'STATE 6 i 8100 8127',
'STATE 4 w 8129 8128',
'STATE 5 # 8131 8130',
'STATE 5 r 8133 8132',
'STATE 6 e 8135 8134',
'STATE 2 w 8137 8136',
'STATE 4 t 8120 8071',
'STATE 1 b 8138 8120',
'STATE 5 # 8120 8071',
'STATE 2 w 8120 8139',
'STATE 3 n 8096 8140',
'STATE 5 e 8142 8141',
'STATE 6 # 8075 8143',
'STATE 2 s 8144 8075',
'STATE 3 t 8075 8145',
'PHONE uh1',
'STATE 3 m 8075 8146',
'STATE 3 i 8147 8100',
'STATE 5 a 8149 8148',
'STATE 3 n 8100 8150',
'STATE 6 y 8100 8151',
'STATE 3 b 8152 8100',
'STATE 6 o 8075 8153',
'STATE 4 i 8155 8154',
'STATE 6 k 8100 8156',
'STATE 3 i 8158 8157',
'STATE 3 i 8160 8159',
'STATE 5 g 8162 8161',
'STATE 3 h 8164 8163',
'STATE 1 0 8166 8165',
'STATE 3 h 8081 8167',
'STATE 2 c 8071 8168',
'STATE 4 l 8120 8071',
'STATE 6 # 8169 8120',
'STATE 2 g 8120 8170',
'STATE 2 l 8096 8171',
'STATE 5 f 8173 8172',
'STATE 3 m 8175 8174',
'STATE 6 h 8075 8176',
'STATE 5 t 8075 8100',
'STATE 2 a 8177 8075',
'STATE 2 p 8100 8178',
'PHONE ao',
'STATE 5 o 8180 8179',
'STATE 6 i 8075 8181',
'STATE 6 # 8100 8182',
'STATE 6 e 8183 8100',
'PHONE aa1',
'STATE 6 a 8075 8184',
'STATE 4 y 8186 8185',
'STATE 5 s 8188 8187',
'STATE 5 # 8190 8189',
'STATE 5 e 8192 8191',
'STATE 2 t 8160 8193',
'STATE 3 s 8195 8194',
'PHONE ah',
'STATE 5 t 8197 8196',
'STATE 2 o 8096 8198',
'STATE 3 t 8120 8199',
'STATE 1 0 8081 8200',
'STATE 1 # 8201 8160',
'STATE 6 s 8075 8202',
'STATE 1 # 8081 8203',
'STATE 1 # 8071 8204',
'PHONE uh',
'STATE 2 h 8120 8113',
'STATE 3 t 8205 8096',
'STATE 5 t 8207 8206',
'STATE 3 d 8147 8075',
'STATE 6 d 8209 8208',
'STATE 6 # 8211 8210',
'STATE 6 t 8212 8100',
'STATE 3 d 8100 8075',
'STATE 5 o 8075 8213',
'STATE 6 g 8215 8214',
'STATE 3 b 8075 8216',
'STATE 3 m 8218 8217',
'STATE 6 a 8100 8219',
'STATE 3 f 8100 8220',
'STATE 6 u 8075 8100',
'STATE 5 e 8222 8221',
'STATE 5 o 8224 8223',
'STATE 6 g 8226 8225',
'STATE 2 # 8228 8227',
'STATE 5 n 8230 8229',
'STATE 1 # 8232 8231',
'STATE 5 g 8234 8233',
'STATE 6 # 8236 8235',
'STATE 5 e 8238 8237',
'STATE 3 t 8160 8239',
'STATE 1 a 8240 8160',
'STATE 5 n 8242 8241',
'STATE 2 0 8081 8243',
'STATE 2 # 8245 8244',
'STATE 6 t 8247 8246',
'PHONE aw',
'STATE 2 t 8081 8075',
'STATE 3 c 8075 8248',
'STATE 1 0 8081 8249',
'STATE 5 h 8250 8071',
'STATE 1 r 8096 8251',
'STATE 5 m 8253 8252',
'STATE 3 f 8255 8254',
'STATE 6 t 8075 8256',
'STATE 2 a 8075 8257',
'STATE 6 d 8075 8147',
'STATE 1 r 8147 8258',
'STATE 2 n 8100 8147',
'STATE 3 h 8100 8259',
'STATE 6 o 8261 8260',
'STATE 2 # 8100 8075',
'STATE 3 d 8100 8262',
'STATE 3 d 8147 8263',
'STATE 6 n 8147 8264',
'STATE 6 h 8100 8265',
'STATE 3 t 8100 8266',
'STATE 2 # 8268 8267',
'STATE 4 v 8270 8269',
'STATE 6 m 8096 8271',
'STATE 3 t 8096 8272',
'STATE 5 r 8274 8273',
'STATE 3 d 8071 8275',
'STATE 6 # 8277 8276',
'STATE 3 l 8278 8272',
'STATE 2 # 8280 8279',
'STATE 3 d 8081 8281',
'STATE 3 k 8283 8282',
'STATE 3 l 8275 8284',
'STATE 3 c 8286 8285',
'STATE 3 c 8288 8287',
'STATE 1 0 8290 8289',
'STATE 3 g 8100 8291',
'STATE 6 c 8152 8292',
'STATE 6 # 8275 8293',
'STATE 2 g 8160 8294',
'STATE 2 i 8295 8160',
'STATE 5 l 8297 8296',
'STATE 3 y 8075 8298',
'STATE 6 # 8081 8299',
'STATE 1 # 8301 8300',
'STATE 3 d 8303 8302',
'STATE 6 # 8305 8304',
'STATE 3 c 8100 8147',
'STATE 3 h 8081 8306',
'STATE 3 r 8081 8075',
'STATE 4 t 8071 8075',
'STATE 1 h 8275 8096',
'STATE 3 f 8308 8307',
'STATE 6 a 8309 8100',
'STATE 6 u 8075 8310',
'STATE 6 # 8075 8311',
'STATE 6 l 8147 8312',
'STATE 2 o 8075 8313',
'STATE 2 r 8100 8147',
'STATE 5 g 8100 8314',
'STATE 5 t 8316 8315',
'STATE 3 f 8318 8317',
'STATE 6 n 8075 8319',
'STATE 6 # 8100 8320',
'STATE 6 l 8100 8075',
'STATE 6 y 8100 8321',
'STATE 3 b 8147 8100',
'STATE 5 f 8323 8322',
'STATE 4 m 8325 8324',
'STATE 6 # 8327 8326',
'STATE 2 0 8329 8328',
'STATE 1 0 8272 8330',
'PHONE oy1',
'STATE 5 a 8332 8331',
'STATE 1 0 8272 8277',
'PHONE ow1',
'STATE 3 l 8272 8333',
'PHONE w',
'PHONE oy',
'STATE 1 # 8335 8334',
'STATE 6 l 8337 8336',
'STATE 3 t 8081 8338',
'STATE 3 n 8096 8339',
'STATE 1 a 8096 8200',
'STATE 3 r 8275 8081',
'STATE 1 0 8341 8340',
'STATE 6 # 8343 8342',
'STATE 1 0 8345 8344',
'STATE 6 e 8160 8346',
'STATE 1 # 8348 8347',
'STATE 6 y 8350 8349',
'STATE 3 d 8351 8275',
'STATE 1 # 8160 8352',
'STATE 6 t 8096 8160',
'STATE 2 n 8354 8353',
'PHONE aa',
'STATE 5 d 8356 8355',
'STATE 2 o 8160 8357',
'STATE 1 l 8075 8358',
'STATE 3 m 8360 8359',
'STATE 2 r 8362 8361',
'STATE 2 t 8100 8363',
'STATE 3 c 8100 8364',
'STATE 6 h 8275 8075',
'STATE 3 j 8075 8365',
'STATE 2 e 8169 8366',
'STATE 6 t 8081 8075',
'STATE 5 a 8368 8367',
'STATE 6 # 8075 8369',
'STATE 1 a 8100 8370',
'STATE 1 r 8100 8371',
'STATE 2 m 8075 8100',
'STATE 2 l 8100 8372',
'STATE 3 l 8100 8075',
'STATE 3 l 8100 8373',
'STATE 3 f 8375 8374',
'STATE 6 r 8147 8376',
'STATE 3 t 8147 8100',
'STATE 5 g 8147 8100',
'STATE 3 m 8075 8100',
'STATE 2 # 8378 8377',
'STATE 3 s 8100 8379',
'STATE 4 a 8381 8380',
'STATE 4 f 8383 8382',
'STATE 4 e 8385 8384',
'STATE 3 c 8387 8386',
'STATE 1 0 8389 8388',
'STATE 4 m 8390 8275',
'STATE 3 r 8392 8391',
'STATE 6 r 8275 8094',
'STATE 3 u 8272 8393',
'STATE 5 c 8395 8394',
'STATE 6 # 8275 8096',
'STATE 3 a 8081 8396',
'STATE 6 t 8160 8397',
'STATE 2 s 8275 8398',
'STATE 3 h 8081 8399',
'STATE 5 a 8200 8400',
'STATE 1 # 8402 8401',
'STATE 3 h 8404 8403',
'STATE 6 c 8406 8405',
'STATE 3 n 8408 8407',
'STATE 5 a 8152 8409',
'STATE 5 i 8275 8152',
'STATE 1 # 8411 8410',
'STATE 6 o 8413 8412',
'STATE 6 r 8152 8160',
'STATE 6 s 8415 8414',
'STATE 2 l 8075 8416',
'STATE 2 # 8418 8417',
'STATE 3 h 8094 8419',
'STATE 2 r 8275 8094',
'STATE 2 s 8160 8420',
'STATE 3 m 8160 8421',
'STATE 3 d 8160 8422',
'STATE 5 c 8424 8423',
'STATE 3 b 8075 8425',
'STATE 6 d 8275 8426',
'STATE 6 # 8075 8427',
'STATE 6 s 8081 8428',
'STATE 1 0 8081 8160',
'STATE 2 t 8100 8429',
'STATE 1 u 8096 8200',
'STATE 3 r 8081 8430',
'STATE 3 r 8075 8431',
'STATE 6 a 8075 8432',
'STATE 1 0 8081 8433',
'STATE 6 z 8075 8434',
'STATE 6 # 8100 8435',
'STATE 5 c 8100 8436',
'STATE 2 r 8100 8437',
'STATE 2 p 8100 8438',
'STATE 3 f 8100 8439',
'STATE 5 t 8100 8440',
'STATE 6 z 8075 8441',
'STATE 5 g 8443 8442',
'STATE 6 e 8444 8100',
'STATE 6 t 8100 8445',
'STATE 3 l 8100 8446',
'STATE 3 k 8100 8447',
'STATE 5 # 8449 8448',
'STATE 5 r 8100 8450',
'STATE 3 k 8147 8451',
'STATE 6 # 8453 8452',
'STATE 4 a 8455 8454',
'STATE 5 r 8100 8456',
'STATE 5 a 8458 8457',
'STATE 5 f 8094 8459',
'STATE 4 m 8461 8460',
'STATE 4 m 8463 8462',
'STATE 3 s 8160 8464',
'STATE 3 m 8071 8465',
'STATE 2 p 8467 8466',
'STATE 2 e 8469 8468',
'STATE 6 c 8275 8470',
'STATE 6 e 8272 8471',
'STATE 1 o 8160 8472',
'STATE 6 c 8160 8473',
'STATE 3 n 8275 8474',
'STATE 3 c 8081 8475',
'STATE 5 e 8152 8081',
'STATE 6 e 8275 8476',
'STATE 3 r 8081 8275',
'STATE 3 d 8096 8477',
'STATE 2 c 8096 8275',
'STATE 5 i 8479 8478',
'STATE 5 i 8152 8096',
'STATE 5 t 8481 8480',
'STATE 5 t 8295 8482',
'STATE 1 0 8484 8483',
'STATE 6 # 8486 8485',
'STATE 2 s 8094 8100',
'STATE 6 a 8152 8487',
'STATE 3 m 8152 8295',
'STATE 6 l 8096 8488',
'STATE 1 i 8096 8275',
'STATE 2 e 8152 8275',
'PHONE w-ah1',
'STATE 3 n 8152 8489',
'STATE 3 m 8094 8275',
'STATE 6 # 8490 8160',
'STATE 1 # 8152 8491',
'STATE 1 i 8160 8492',
'STATE 6 t 8494 8493',
'STATE 3 t 8075 8495',
'STATE 3 r 8081 8496',
'STATE 6 t 8275 8497',
'STATE 2 # 8081 8498',
'STATE 1 # 8081 8499',
'STATE 3 l 8200 8500',
'STATE 2 s 8075 8081',
'STATE 3 t 8075 8501',
'STATE 6 i 8075 8502',
'STATE 2 a 8100 8075',
'STATE 3 u 8120 8503',
'STATE 1 a 8505 8504',
'STATE 6 a 8100 8506',
'STATE 3 f 8075 8100',
'STATE 3 t 8100 8507',
'STATE 3 c 8100 8508',
'STATE 5 n 8100 8509',
'STATE 6 n 8100 8510',
'STATE 5 b 8443 8100',
'STATE 6 i 8075 8100',
'STATE 2 # 8100 8147',
'STATE 6 n 8147 8100',
'STATE 3 f 8100 8511',
'STATE 6 t 8147 8512',
'STATE 5 a 8514 8513',
'STATE 4 s 8516 8515',
'STATE 2 b 8518 8517',
'STATE 3 w 8169 8519',
'STATE 6 s 8100 8520',
'STATE 3 l 8147 8521',
'STATE 5 a 8523 8522',
'STATE 5 r 8100 8524',
'STATE 6 r 8100 8525',
'STATE 5 o 8527 8526',
'STATE 3 w 8120 8528',
'STATE 5 p 8530 8529',
'STATE 4 k 8275 8531',
'STATE 3 w 8533 8532',
'STATE 4 s 8535 8534',
'STATE 3 h 8275 8536',
'STATE 3 c 8094 8275',
'STATE 3 n 8538 8537',
'STATE 1 # 8275 8539',
'STATE 1 # 8540 8071',
'STATE 5 # 8541 8272',
'STATE 5 # 8542 8278',
'STATE 1 h 8096 8543',
'STATE 6 h 8096 8275',
'STATE 6 e 8277 8096',
'STATE 2 k 8545 8544',
'STATE 2 p 8081 8546',
'STATE 3 d 8081 8547',
'STATE 3 r 8275 8548',
'STATE 2 g 8275 8549',
'STATE 2 f 8551 8550',
'STATE 6 a 8275 8552',
'STATE 5 a 8554 8553',
'STATE 3 m 8556 8555',
'STATE 5 a 8152 8557',
'STATE 2 e 8559 8558',
'STATE 6 e 8561 8560',
'STATE 3 l 8100 8562',
'STATE 3 r 8100 8563',
'STATE 6 i 8096 8564',
'STATE 3 p 8275 8565',
'STATE 3 d 8152 8566',
'STATE 5 s 8160 8275',
'STATE 2 r 8568 8567',
'STATE 1 o 8160 8569',
'STATE 5 f 8571 8570',
'STATE 5 e 8075 8081',
'STATE 6 h 8081 8572',
'STATE 3 l 8081 8573',
'STATE 3 f 8081 8574',
'STATE 3 r 8081 8575',
'STATE 6 e 8573 8576',
'STATE 2 b 8200 8577',
'STATE 6 h 8579 8578',
'STATE 3 b 8581 8580',
'STATE 5 o 8583 8582',
'STATE 6 t 8075 8584',
'STATE 3 t 8096 8100',
'STATE 5 g 8075 8585',
'STATE 1 e 8586 8100',
'STATE 2 n 8075 8587',
'STATE 6 # 8100 8588',
'STATE 3 k 8100 8589',
'STATE 3 b 8100 8590',
'STATE 3 m 8592 8591',
'STATE 4 e 8594 8593',
'STATE 6 # 8596 8595',
'STATE 4 e 8598 8597',
'STATE 1 o 8600 8599',
'STATE 3 r 8602 8601',
'STATE 5 d 8100 8275',
'STATE 4 l 8604 8603',
'STATE 1 # 8606 8605',
'STATE 1 # 8100 8607',
'STATE 4 l 8609 8608',
'STATE 6 # 8275 8610',
'STATE 6 u 8096 8275',
'STATE 5 w 8152 8275',
'STATE 5 i 8152 8611',
'STATE 6 l 8160 8612',
'STATE 6 l 8160 8613',
'STATE 5 m 8615 8614',
'STATE 6 a 8160 8616',
'STATE 4 x 8152 8617',
'STATE 6 t 8619 8618',
'PHONE ih1',
'STATE 6 r 8621 8620',
'STATE 3 l 8152 8622',
'STATE 3 s 8094 8623',
'STATE 3 p 8152 8624',
'STATE 6 l 8152 8625',
'STATE 2 g 8275 8160',
'STATE 6 n 8275 8071',
'STATE 1 r 8278 8626',
'STATE 3 r 8278 8272',
'STATE 5 e 8277 8627',
'STATE 3 p 8081 8628',
'STATE 1 c 8152 8275',
'STATE 5 d 8081 8629',
'STATE 3 p 8081 8630',
'STATE 1 0 8081 8275',
'STATE 2 d 8632 8631',
'STATE 1 # 8634 8633',
'STATE 5 t 8635 8152',
'STATE 6 # 8275 8636',
'STATE 5 i 8638 8637',
'STATE 6 # 8275 8639',
'STATE 6 i 8295 8152',
'STATE 6 e 8152 8640',
'STATE 5 v 8295 8641',
'STATE 5 i 8275 8642',
'STATE 1 # 8152 8160',
'STATE 5 n 8644 8643',
'STATE 5 c 8160 8645',
'STATE 3 r 8100 8152',
'STATE 1 a 8100 8646',
'STATE 3 l 8100 8647',
'STATE 6 y 8649 8648',
'STATE 3 m 8152 8275',
'STATE 2 a 8651 8650',
'STATE 1 a 8652 8160',
'STATE 1 a 8160 8653',
'STATE 1 0 8654 8075',
'STATE 6 f 8275 8160',
'STATE 6 e 8075 8275',
'STATE 1 0 8081 8075',
'STATE 3 c 8081 8655',
'STATE 1 e 8081 8656',
'STATE 3 s 8081 8657',
'STATE 1 t 8075 8658',
'STATE 6 e 8081 8075',
'STATE 3 l 8081 8659',
'STATE 1 # 8075 8660',
'STATE 6 n 8662 8661',
'STATE 6 a 8664 8663',
'STATE 6 u 8075 8665',
'STATE 3 m 8666 8075',
'STATE 6 s 8075 8100',
'STATE 2 x 8100 8667',
'STATE 6 # 8100 8668',
'STATE 2 a 8670 8669',
'STATE 6 a 8317 8671',
'STATE 6 n 8147 8672',
'STATE 6 n 8674 8673',
'STATE 6 l 8075 8147',
'STATE 4 s 8676 8675',
'STATE 3 h 8678 8677',
'STATE 6 t 8680 8679',
'STATE 3 e 8152 8681',
'STATE 4 m 8683 8682',
'STATE 3 l 8275 8684',
'STATE 1 # 8096 8685',
'STATE 3 l 8160 8096',
'STATE 5 d 8275 8686',
'STATE 6 h 8275 8687',
'STATE 3 h 8275 8152',
'STATE 6 i 8275 8096',
'STATE 1 0 8689 8688',
'STATE 2 r 8100 8690',
'STATE 3 h 8692 8691',
'STATE 5 i 8694 8693',
'STATE 5 l 8696 8695',
'STATE 3 k 8698 8697',
'STATE 5 b 8699 8152',
'STATE 3 k 8096 8700',
'STATE 3 h 8275 8701',
'STATE 5 b 8703 8702',
'STATE 6 o 8152 8160',
'STATE 6 i 8160 8704',
'STATE 6 d 8706 8705',
'STATE 6 s 8464 8707',
'STATE 1 # 8708 8152',
'STATE 4 x 8152 8709',
'STATE 2 # 8710 8152',
'STATE 6 n 8275 8711',
'STATE 3 c 8713 8712',
'STATE 3 s 8275 8714',
'STATE 6 r 8275 8096',
'STATE 2 n 8278 8715',
'STATE 6 e 8272 8716',
'STATE 2 r 8718 8717',
'STATE 3 l 8720 8719',
'STATE 5 r 8100 8721',
'STATE 2 f 8275 8722',
'STATE 3 l 8275 8096',
'STATE 5 a 8724 8723',
'STATE 5 o 8726 8725',
'STATE 6 e 8094 8727',
'STATE 6 z 8729 8728',
'STATE 5 y 8275 8730',
'STATE 6 n 8732 8731',
'STATE 3 m 8152 8733',
'STATE 6 a 8096 8152',
'STATE 5 r 8295 8734',
'STATE 2 b 8152 8735',
'STATE 5 r 8152 8736',
'STATE 6 i 8160 8152',
'STATE 5 v 8160 8737',
'STATE 2 e 8100 8738',
'STATE 6 u 8094 8739',
'STATE 1 a 8293 8160',
'STATE 1 m 8275 8160',
'STATE 1 d 8160 8740',
'STATE 1 e 8160 8741',
'STATE 3 d 8100 8160',
'STATE 3 n 8160 8295',
'STATE 5 e 8152 8742',
'STATE 3 s 8075 8743',
'STATE 1 a 8081 8744',
'STATE 3 b 8075 8745',
'STATE 3 d 8075 8081',
'STATE 3 b 8081 8100',
'STATE 1 r 8147 8746',
'STATE 1 0 8747 8100',
'STATE 1 0 8100 8120',
'STATE 5 p 8749 8748',
'STATE 5 i 8100 8750',
'STATE 3 b 8075 8751',
'STATE 1 m 8075 8752',
'STATE 3 p 8100 8147',
'STATE 2 s 8100 8753',
'STATE 3 n 8100 8754',
'STATE 5 e 8100 8075',
'STATE 3 m 8756 8755',
'STATE 3 h 8147 8100',
'STATE 6 c 8147 8757',
'STATE 3 l 8147 8100',
'STATE 4 l 8759 8758',
'STATE 5 i 8761 8760',
'STATE 1 # 8763 8762',
'STATE 2 s 8071 8764',
'STATE 3 w 8120 8765',
'STATE 1 h 8075 8766',
'STATE 3 s 8275 8767',
'STATE 1 # 8769 8768',
'STATE 3 c 8770 8559',
'STATE 1 i 8275 8771',
'STATE 1 i 8096 8772',
'STATE 1 # 8275 8773',
'STATE 1 e 8096 8404',
'STATE 1 i 8160 8100',
'STATE 6 e 8160 8644',
'STATE 2 s 8152 8774',
'STATE 2 c 8100 8775',
'STATE 2 t 8100 8776',
'STATE 5 o 8778 8777',
'STATE 4 v 8780 8779',
'STATE 5 o 8782 8781',
'STATE 3 c 8784 8783',
'STATE 3 l 8786 8785',
'STATE 6 k 8275 8787',
'STATE 6 a 8789 8788',
'STATE 6 g 8096 8275',
'STATE 6 # 8275 8790',
'STATE 6 n 8160 8791',
'STATE 6 e 8275 8160',
'STATE 6 r 8152 8792',
'STATE 6 s 8794 8793',
'STATE 4 p 8160 8795',
'STATE 3 r 8797 8796',
'STATE 2 g 8160 8152',
'STATE 4 d 8799 8798',
'STATE 3 m 8801 8800',
'STATE 6 t 8160 8275',
'STATE 3 p 8152 8802',
'STATE 6 d 8160 8094',
'STATE 3 c 8804 8803',
'STATE 1 e 8272 8805',
'STATE 5 d 8806 8272',
'STATE 2 l 8808 8807',
'STATE 3 r 8096 8275',
'STATE 2 b 8081 8809',
'STATE 6 r 8081 8275',
'STATE 3 n 8081 8810',
'STATE 2 k 8200 8811',
'STATE 5 t 8813 8812',
'STATE 6 # 8275 8814',
'STATE 2 l 8075 8815',
'STATE 2 p 8160 8816',
'STATE 6 a 8160 8094',
'STATE 6 o 8275 8817',
'STATE 3 r 8075 8160',
'STATE 3 w 8819 8818',
'STATE 6 e 8275 8820',
'STATE 3 b 8096 8275',
'STATE 6 g 8152 8821',
'STATE 5 b 8152 8822',
'STATE 5 t 8824 8823',
'STATE 5 d 8826 8825',
'STATE 5 t 8160 8827',
'STATE 3 s 8100 8147',
'STATE 3 m 8094 8100',
'STATE 3 p 8152 8828',
'STATE 3 n 8160 8829',
'STATE 3 b 8075 8830',
'STATE 6 s 8081 8075',
'STATE 1 # 8081 8831',
'STATE 3 c 8075 8832',
'STATE 6 e 8075 8100',
'STATE 6 g 8169 8075',
'STATE 5 d 8834 8833',
'STATE 2 t 8147 8835',
'STATE 5 g 8100 8836',
'STATE 6 # 8100 8837',
'STATE 2 e 8100 8075',
'STATE 2 a 8100 8313',
'STATE 2 d 8100 8075',
'STATE 6 e 8839 8838',
'STATE 5 i 8840 8100',
'STATE 3 f 8100 8841',
'STATE 1 # 8843 8842',
'STATE 6 g 8845 8844',
'STATE 5 k 8847 8846',
'STATE 6 t 8849 8848',
'STATE 1 0 8275 8850',
'STATE 5 r 8100 8851',
'STATE 1 s 8275 8852',
'STATE 1 # 8854 8853',
'STATE 3 n 8160 8855',
'STATE 4 l 8856 8275',
'STATE 4 v 8858 8857',
'STATE 4 l 8160 8152',
'STATE 1 n 8152 8859',
'STATE 3 h 8275 8096',
'STATE 3 i 8861 8860',
'STATE 6 s 8275 8862',
'STATE 3 r 8152 8160',
'STATE 3 t 8147 8863',
'STATE 1 e 8100 8147',
'STATE 4 h 8865 8864',
'STATE 6 # 8275 8866',
'STATE 4 x 8152 8867',
'STATE 3 m 8071 8868',
'STATE 5 i 8870 8869',
'STATE 6 r 8094 8871',
'STATE 3 r 8873 8872',
'STATE 6 a 8160 8874',
'STATE 3 b 8876 8875',
'STATE 4 c 8275 8877',
'STATE 6 l 8160 8878',
'STATE 3 d 8160 8879',
'STATE 3 b 8295 8152',
'STATE 3 t 8881 8880',
'STATE 6 t 8275 8152',
'STATE 6 o 8160 8882',
'STATE 6 r 8884 8883',
'STATE 4 c 8152 8885',
'STATE 2 i 8160 8886',
'STATE 2 g 8152 8887',
'STATE 1 # 8275 8096',
'STATE 6 n 8889 8888',
'STATE 6 l 8891 8890',
'STATE 3 t 8152 8892',
'STATE 4 d 8152 8275',
'STATE 3 d 8893 8275',
'STATE 1 0 8895 8894',
'STATE 6 r 8094 8896',
'STATE 2 l 8897 8272',
'STATE 3 v 8272 8898',
'STATE 3 d 8900 8899',
'STATE 3 l 8901 8275',
'STATE 3 r 8902 8081',
'STATE 5 a 8904 8903',
'STATE 2 t 8906 8905',
'STATE 3 p 8152 8907',
'STATE 6 e 8566 8908',
'STATE 2 c 8152 8909',
'STATE 2 i 8075 8910',
'STATE 3 r 8275 8160',
'STATE 6 u 8275 8911',
'STATE 6 p 8160 8912',
'STATE 6 e 8094 8152',
'STATE 3 m 8152 8913',
'STATE 3 b 8152 8914',
'STATE 6 u 8295 8915',
'STATE 2 c 8152 8916',
'STATE 6 e 8160 8917',
'STATE 5 q 8152 8918',
'STATE 6 u 8160 8919',
'STATE 5 f 8160 8920',
'STATE 2 t 8922 8921',
'STATE 3 r 8160 8923',
'STATE 5 k 8081 8924',
'STATE 6 c 8081 8925',
'STATE 3 r 8075 8926',
'STATE 3 t 8928 8927',
'STATE 6 e 8100 8929',
'STATE 3 c 8100 8930',
'STATE 1 r 8100 8837',
'STATE 2 o 8075 8100',
'STATE 6 l 8931 8100',
'STATE 5 d 8100 8932',
'STATE 6 s 8100 8147',
'STATE 6 l 8147 8100',
'STATE 6 # 8934 8933',
'STATE 5 o 8936 8935',
'STATE 5 d 8938 8937',
'STATE 1 0 8152 8939',
'STATE 1 0 8941 8940',
'STATE 6 i 8081 8942',
'STATE 6 s 8275 8943',
'STATE 3 p 8944 8152',
'STATE 2 h 8275 8945',
'STATE 5 b 8275 8946',
'STATE 5 n 8160 8096',
'STATE 1 0 8948 8947',
'STATE 4 p 8950 8949',
'STATE 1 a 8160 8951',
'STATE 1 r 8275 8952',
'STATE 4 l 8954 8953',
'STATE 2 o 8152 8295',
'STATE 1 r 8152 8955',
'STATE 3 g 8096 8956',
'STATE 2 r 8096 8275',
'STATE 5 k 8275 8957',
'STATE 1 o 8147 8958',
'STATE 4 s 8960 8959',
'STATE 5 r 8100 8961',
'STATE 4 x 8152 8962',
'STATE 6 t 8152 8963',
'STATE 6 t 8160 8964',
'STATE 5 y 8966 8965',
'STATE 6 n 8968 8967',
'STATE 3 c 8893 8969',
'STATE 6 u 8160 8970',
'STATE 6 e 8275 8971',
'STATE 6 e 8160 8972',
'STATE 4 s 8974 8973',
'STATE 4 l 8275 8975',
'STATE 6 t 8096 8976',
'STATE 4 l 8160 8977',
'STATE 3 t 8071 8152',
'STATE 6 i 8096 8978',
'STATE 6 s 8096 8152',
'STATE 6 e 8160 8979',
'STATE 1 # 8981 8980',
'STATE 2 e 8160 8982',
'STATE 4 f 8160 8983',
'STATE 3 r 8160 8275',
'STATE 1 h 8152 8984',
'STATE 4 b 8986 8985',
'STATE 4 z 8100 8987',
'STATE 6 s 8566 8988',
'STATE 2 # 8152 8096',
'STATE 4 p 8160 8989',
'STATE 6 n 8152 8160',
'STATE 6 r 8991 8990',
'STATE 3 b 8275 8992',
'STATE 6 n 8094 8275',
'STATE 3 r 8272 8278',
'STATE 2 e 8272 8993',
'STATE 1 t 8275 8994',
'STATE 5 s 8096 8995',
'STATE 1 a 8996 8096',
'STATE 5 l 8081 8997',
'STATE 3 l 8275 8998',
'STATE 6 r 8275 8081',
'STATE 2 o 8096 8999',
'STATE 3 l 8096 8275',
'STATE 5 s 9001 9000',
'STATE 1 r 9003 9002',
'STATE 3 s 8160 9004',
'STATE 5 y 8275 9005',
'STATE 6 n 9007 9006',
'STATE 2 # 9009 9008',
'STATE 6 c 8152 9010',
'STATE 6 s 8275 9011',
'STATE 6 i 8295 9012',
'STATE 5 v 8160 9013',
'STATE 1 u 8160 9014',
'STATE 5 j 8152 9015',
'STATE 6 r 8152 8644',
'STATE 5 s 8160 9016',
'STATE 2 e 9018 9017',
'STATE 3 r 9019 8160',
'STATE 1 m 8160 9020',
'STATE 5 p 8075 9021',
'STATE 2 n 8081 9022',
'STATE 6 h 8075 8081',
'STATE 6 c 8100 9023',
'STATE 2 a 8100 9024',
'STATE 3 c 9025 8100',
'STATE 3 m 8100 8075',
'STATE 5 i 8075 8100',
'STATE 5 g 8100 9026',
'STATE 5 t 9028 9027',
'STATE 5 o 8275 9029',
'STATE 2 s 9031 9030',
'STATE 4 t 8275 9032',
'STATE 6 r 8094 9033',
'STATE 3 n 9035 9034',
'STATE 2 p 8152 9036',
'STATE 5 s 9038 9037',
'STATE 6 r 8152 9039',
'STATE 6 e 8152 9040',
'STATE 6 # 8275 9041',
'STATE 2 e 8152 9042',
'STATE 1 o 8275 9043',
'STATE 3 r 8275 9044',
'STATE 4 v 9046 9045',
'STATE 4 h 8295 9047',
'STATE 6 n 9049 9048',
'STATE 2 p 8152 8075',
'STATE 2 e 9051 9050',
'STATE 2 n 9052 8275',
'STATE 4 x 9054 9053',
'STATE 2 t 8295 9055',
'STATE 2 i 8295 9056',
'STATE 2 t 8096 9057',
'STATE 6 # 8275 9058',
'STATE 2 t 8147 9059',
'STATE 4 f 9061 9060',
'STATE 5 s 9063 9062',
'STATE 3 j 8152 9064',
'STATE 3 m 8275 9065',
'STATE 4 t 8275 9066',
'STATE 3 l 8094 9067',
'STATE 3 w 9069 9068',
'STATE 3 p 8152 8275',
'STATE 6 c 9071 9070',
'STATE 3 m 8096 8275',
'STATE 3 m 8160 9072',
'STATE 3 t 9074 9073',
'STATE 6 i 8152 8275',
'STATE 6 o 8160 9075',
'STATE 3 c 9077 9076',
'STATE 6 l 8275 8096',
'STATE 4 h 8152 9078',
'STATE 4 v 8094 8096',
'STATE 4 v 8160 8275',
'STATE 3 r 8096 9079',
'STATE 6 u 8160 9080',
'STATE 3 m 9082 9081',
'STATE 4 s 8152 9083',
'STATE 2 n 8152 9084',
'STATE 2 a 8160 9085',
'STATE 3 t 8160 9086',
'STATE 6 y 8275 9087',
'STATE 2 # 8275 8096',
'STATE 4 t 8275 9088',
'STATE 3 r 9090 9089',
'STATE 3 r 8152 8275',
'STATE 6 n 8275 9091',
'STATE 2 n 8094 9092',
'STATE 3 l 8094 9093',
'STATE 2 a 8272 9094',
'STATE 2 n 9096 9095',
'STATE 2 a 8096 8081',
'STATE 5 e 8096 9097',
'STATE 2 g 8275 9098',
'STATE 3 r 8275 9099',
'STATE 3 s 8096 9100',
'STATE 3 m 9102 9101',
'STATE 6 # 9104 9103',
'STATE 6 o 8160 8152',
'STATE 2 e 8295 8152',
'STATE 2 i 8096 9105',
'STATE 5 a 9107 9106',
'STATE 6 t 8160 9108',
'STATE 3 s 8160 9109',
'STATE 6 o 8295 9110',
'STATE 3 h 8152 9111',
'STATE 6 g 8152 9112',
'STATE 6 l 8152 9113',
'STATE 5 p 9115 9114',
'STATE 6 c 8152 9116',
'STATE 2 s 8160 8152',
'STATE 5 l 8152 9117',
'STATE 5 n 8160 8152',
'STATE 2 u 9119 9118',
'STATE 1 r 8295 9120',
'STATE 1 e 8295 9056',
'STATE 1 r 8152 9121',
'STATE 6 # 8075 9122',
'STATE 3 m 8081 9123',
'STATE 6 i 8100 9124',
'STATE 2 c 8075 9125',
'STATE 2 c 8100 9126',
'STATE 5 s 8100 9127',
'STATE 4 m 9129 9128',
'STATE 1 0 9131 9130',
'STATE 5 i 8275 9132',
'STATE 5 k 8152 9133',
'STATE 5 i 8275 9134',
'STATE 4 p 9136 9135',
'STATE 6 # 9138 9137',
'STATE 3 r 8160 9139',
'STATE 6 # 8096 8160',
'STATE 3 e 9141 9140',
'STATE 1 # 9143 9142',
'STATE 2 c 8100 9144',
'STATE 5 h 8152 9145',
'STATE 1 # 8100 8275',
'STATE 6 a 8275 9146',
'STATE 2 m 8152 8160',
'STATE 5 s 8096 9147',
'STATE 3 l 8275 9148',
'STATE 6 u 8160 9149',
'STATE 6 l 8071 8096',
'STATE 4 c 8096 9150',
'STATE 2 t 8152 9151',
'STATE 3 i 8096 8275',
'STATE 2 h 8096 9152',
'STATE 4 c 8275 8152',
'STATE 1 e 8275 8096',
'STATE 4 h 8096 9153',
'STATE 3 b 8152 8295',
'STATE 1 e 8295 9154',
'STATE 1 a 8160 8295',
'STATE 2 m 8275 8096',
'STATE 2 e 8096 9155',
'STATE 3 r 8147 9156',
'STATE 4 j 8272 9157',
'STATE 3 s 8100 9158',
'STATE 3 k 9160 9159',
'STATE 3 p 9162 9161',
'STATE 5 n 9163 8275',
'STATE 3 l 8275 9164',
'STATE 6 c 9166 9165',
'STATE 6 n 8096 9167',
'STATE 5 u 9169 9168',
'STATE 5 f 8120 8275',
'STATE 6 t 9171 9170',
'STATE 3 s 8160 8152',
'STATE 3 k 8160 9172',
'STATE 6 s 8275 8152',
'STATE 6 e 8152 8275',
'STATE 6 u 8160 8152',
'STATE 3 h 8275 9173',
'STATE 6 b 8096 8275',
'STATE 6 r 8152 9174',
'STATE 3 k 8096 9175',
'STATE 6 l 8160 8152',
'STATE 4 g 8160 9176',
'STATE 4 d 8152 9177',
'STATE 6 c 9179 9178',
'STATE 4 g 8100 9180',
'STATE 1 # 9182 9181',
'STATE 1 # 8096 9183',
'STATE 6 t 9185 9184',
'STATE 4 p 8275 9186',
'STATE 2 # 9187 8152',
'STATE 6 n 8275 8152',
'STATE 6 s 8275 9188',
'STATE 1 # 8094 8275',
'STATE 6 r 8094 9189',
'STATE 3 l 8272 8278',
'STATE 6 a 8081 9190',
'STATE 6 r 8096 8275',
'STATE 5 a 9191 8096',
'STATE 2 c 8275 8081',
'STATE 3 b 9193 9192',
'STATE 2 u 8096 9194',
'STATE 5 y 8160 9195',
'STATE 5 y 9196 8160',
'STATE 3 m 8160 8152',
'STATE 3 r 8160 9197',
'STATE 1 a 9198 8160',
'STATE 2 b 8152 9199',
'STATE 3 r 8275 8152',
'STATE 2 a 8160 9200',
'STATE 1 # 8275 9201',
'STATE 5 o 8096 8152',
'STATE 5 n 9203 9202',
'STATE 6 # 8275 9187',
'STATE 6 t 9204 8152',
'STATE 5 s 9206 9205',
'STATE 6 r 8152 8295',
'STATE 5 d 9075 9207',
'STATE 6 c 8152 9208',
'STATE 3 c 9210 9209',
'STATE 3 l 8160 8295',
'STATE 3 l 8160 9211',
'STATE 3 g 8160 9212',
'STATE 3 l 8075 9213',
'STATE 2 o 8081 9214',
'STATE 3 e 8075 9215',
'STATE 1 m 8075 9216',
'STATE 1 r 8100 8147',
'STATE 5 k 8100 9217',
'STATE 4 x 8152 9218',
'STATE 3 c 9220 9219',
'STATE 6 e 9222 9221',
'STATE 4 b 8160 9223',
'STATE 5 y 9225 9224',
'STATE 5 p 8152 9226',
'STATE 5 h 9227 8152',
'STATE 6 # 8275 9228',
'STATE 6 l 8096 9229',
'STATE 5 v 8152 9230',
'STATE 3 a 8081 9231',
'STATE 1 a 8275 9232',
'STATE 2 a 8152 9233',
'STATE 2 h 8160 9234',
'STATE 6 # 9236 9235',
'STATE 2 f 8100 9237',
'STATE 2 g 9239 9238',
'STATE 5 c 9240 8152',
'STATE 1 m 8096 9241',
'STATE 3 r 8096 9242',
'STATE 2 s 8275 8096',
'STATE 6 l 9244 9243',
'STATE 4 k 8096 9245',
'STATE 6 b 8152 9246',
'STATE 2 s 8096 9247',
'STATE 4 z 8096 9248',
'STATE 1 t 8152 9249',
'STATE 5 t 8275 9250',
'STATE 3 n 8147 9251',
'STATE 5 u 9253 9252',
'STATE 5 f 9255 9254',
'STATE 3 y 8275 9256',
'STATE 6 i 8152 9257',
'STATE 6 a 9259 9258',
'STATE 6 e 8160 8152',
'STATE 6 e 8275 9260',
'STATE 6 m 8275 9261',
'STATE 3 l 8160 9262',
'STATE 3 m 8096 8152',
'STATE 6 c 8152 8275',
'STATE 5 v 8152 9263',
'STATE 6 n 8152 9264',
'STATE 3 p 8096 9265',
'STATE 3 p 8160 9266',
'STATE 6 g 8152 9090',
'STATE 6 c 8152 9267',
'STATE 6 n 8152 8275',
'STATE 3 d 8096 8275',
'STATE 3 r 9269 9268',
'STATE 6 n 8152 8096',
'STATE 6 l 8160 9270',
'STATE 2 b 8096 8160',
'STATE 3 c 8160 9271',
'STATE 3 s 8160 8275',
'STATE 4 l 8275 9272',
'STATE 2 e 8160 9273',
'STATE 4 t 9275 9274',
'STATE 4 l 8096 8160',
'STATE 2 # 9276 8152',
'STATE 3 b 8152 8275',
'STATE 2 e 8094 9277',
'STATE 3 d 8094 8275',
'STATE 2 f 8081 9278',
'STATE 6 n 8081 8096',
'STATE 3 s 8275 9279',
'STATE 6 r 8081 9280',
'STATE 2 r 8096 9281',
'STATE 6 # 9283 9282',
'STATE 2 i 8275 8160',
'STATE 3 m 8160 9284',
'STATE 3 r 8096 8160',
'STATE 2 s 8152 9285',
'STATE 2 e 8160 9286',
'STATE 3 t 8275 8160',
'STATE 5 k 9227 9287',
'STATE 3 t 8094 8152',
'STATE 3 d 8096 8152',
'STATE 6 e 8295 8152',
'STATE 6 t 8295 8152',
'STATE 1 # 8152 9288',
'STATE 6 r 9290 9289',
'STATE 2 l 8160 9291',
'STATE 2 i 8152 8160',
'STATE 3 d 8160 9292',
'STATE 3 l 8152 8160',
'STATE 6 l 8075 9293',
'STATE 3 b 8081 9294',
'STATE 5 y 9296 9295',
'STATE 2 r 8100 9297',
'STATE 5 l 8100 9298',
'STATE 2 p 9300 9299',
'STATE 5 o 8160 9301',
'STATE 2 c 9303 9302',
'STATE 4 c 8152 9304',
'STATE 1 a 8160 9305',
'STATE 4 t 8152 9306',
'STATE 4 c 9308 9307',
'STATE 3 b 8152 9309',
'STATE 3 e 9311 9310',
'STATE 3 m 8094 8152',
'STATE 3 h 8275 9312',
'STATE 2 p 8160 8152',
'STATE 6 t 9314 9313',
'STATE 5 s 8160 9315',
'STATE 2 m 8275 9316',
'STATE 3 m 8152 9317',
'STATE 1 i 8160 8152',
'STATE 2 g 8152 9318',
'STATE 5 h 9320 9319',
'STATE 2 p 9322 9321',
'STATE 1 # 9324 9323',
'STATE 3 l 8100 8275',
'STATE 6 i 8152 8100',
'STATE 3 p 8275 9325',
'STATE 1 i 8275 8096',
'STATE 6 s 9327 9326',
'STATE 4 s 8275 9328',
'STATE 4 s 8096 9329',
'STATE 3 n 8152 9330',
'STATE 1 0 8096 9331',
'STATE 4 g 9333 9332',
'STATE 3 n 8147 9334',
'STATE 5 # 8275 9335',
'STATE 2 a 8100 9336',
'STATE 5 h 9338 9337',
'STATE 6 l 8152 9339',
'STATE 3 h 8152 9340',
'STATE 6 # 8100 9341',
'STATE 3 p 9343 9342',
'STATE 6 a 8275 9344',
'STATE 3 f 8152 9345',
'STATE 3 c 8152 8160',
'STATE 6 # 8152 8275',
'STATE 3 n 9347 9346',
'STATE 6 # 8275 9348',
'STATE 5 c 9350 9349',
'STATE 6 m 8152 8160',
'STATE 6 d 8152 9351',
'STATE 3 s 8152 8096',
'STATE 6 s 9353 9352',
'STATE 6 c 8096 9354',
'STATE 2 p 8160 9355',
'STATE 3 i 8293 9356',
'STATE 4 p 9358 9357',
'STATE 3 l 8275 9359',
'STATE 3 n 8160 9360',
'STATE 4 h 8096 9361',
'STATE 6 l 8096 8275',
'STATE 3 c 8275 9362',
'STATE 3 h 8094 9363',
'STATE 6 n 9365 9364',
'STATE 3 t 8720 9366',
'STATE 5 s 8081 8275',
'STATE 2 s 8906 8096',
'STATE 2 c 8152 9367',
'STATE 5 o 8275 8152',
'STATE 2 r 8160 9368',
'STATE 3 r 8152 9369',
'STATE 6 e 8160 9370',
'STATE 5 d 9372 9371',
'STATE 5 s 9373 8160',
'STATE 6 p 8160 9374',
'STATE 5 t 8152 8160',
'STATE 2 d 8160 9375',
'STATE 3 r 8160 9376',
'STATE 5 v 8075 8578',
'STATE 2 m 8081 9377',
'STATE 6 h 8075 9378',
'STATE 1 c 8100 8075',
'STATE 1 a 8147 9379',
'STATE 5 n 8100 9380',
'STATE 6 c 9382 9381',
'STATE 3 e 8075 9383',
'STATE 5 b 9385 9384',
'STATE 6 n 8094 9386',
'STATE 6 a 8094 8152',
'STATE 2 h 8152 9387',
'STATE 4 t 9388 8152',
'STATE 6 e 8152 9389',
'STATE 3 r 9391 9390',
'STATE 3 d 8160 9392',
'STATE 3 l 8160 9393',
'STATE 5 i 9395 9394',
'STATE 5 l 8096 8160',
'STATE 6 t 8160 9396',
'STATE 5 t 8275 9397',
'STATE 5 s 8275 9398',
'STATE 3 h 9400 9399',
'STATE 3 p 8096 9401',
'STATE 2 i 8152 9402',
'STATE 6 o 9404 9403',
'STATE 5 o 8275 9405',
'STATE 2 n 8152 8094',
'STATE 3 r 8152 9406',
'STATE 5 c 8096 8152',
'STATE 6 e 8160 9407',
'STATE 6 # 8100 9408',
'STATE 6 o 8275 9409',
'STATE 1 m 9411 9410',
'STATE 4 l 8160 9412',
'STATE 2 i 8160 9413',
'STATE 4 p 8096 9414',
'STATE 3 t 8275 9415',
'STATE 4 b 8096 9416',
'STATE 4 f 9418 9417',
'STATE 3 d 8100 9419',
'STATE 1 r 8147 9420',
'STATE 3 c 8275 8096',
'STATE 2 i 8100 9421',
'STATE 5 r 9423 9422',
'STATE 4 t 9425 9424',
'STATE 3 d 8152 9426',
'STATE 3 l 8152 8275',
'STATE 3 h 8100 9427',
'STATE 6 h 8100 9428',
'STATE 6 u 8152 9429',
'STATE 5 t 8152 9002',
'STATE 6 e 8152 9430',
'STATE 6 n 8275 9431',
'STATE 4 v 8152 8275',
'STATE 6 e 9433 9432',
'STATE 5 f 9434 8275',
'STATE 6 a 8295 8275',
'STATE 6 a 8275 9435',
'STATE 6 l 9437 9436',
'STATE 3 p 8160 8275',
'STATE 4 s 8160 9438',
'STATE 2 t 8275 9439',
'STATE 4 g 8160 9440',
'STATE 3 h 9442 9441',
'STATE 2 p 8152 8275',
'STATE 4 d 8096 8275',
'STATE 6 d 8160 8096',
'STATE 6 e 8152 9443',
'STATE 4 g 8152 9444',
'STATE 3 l 8094 8275',
'STATE 5 l 8081 9445',
'STATE 2 c 8081 8275',
'STATE 3 m 8275 8081',
'STATE 6 s 8275 9446',
'STATE 2 l 8160 9447',
'STATE 3 l 8152 9448',
'STATE 6 s 9449 8152',
'STATE 3 s 8100 8152',
'STATE 6 l 8152 9450',
'STATE 1 i 8152 8160',
'STATE 6 t 8152 9451',
'STATE 2 h 8160 9452',
'STATE 3 n 8152 8295',
'STATE 1 r 8081 9453',
'STATE 1 e 9455 9454',
'STATE 1 h 8075 9456',
'STATE 3 s 8100 9457',
'STATE 5 i 9459 9458',
'STATE 4 g 8152 9460',
'STATE 5 r 9462 9461',
'STATE 1 0 9464 9463',
'STATE 1 c 8094 9465',
'STATE 1 e 9467 9466',
'STATE 6 o 8152 9468',
'STATE 3 l 8152 8100',
'STATE 6 o 8295 8152',
'STATE 4 t 9470 9469',
'STATE 5 h 8147 9471',
'STATE 2 l 9259 9472',
'STATE 4 m 8160 9473',
'STATE 5 u 9475 9474',
'STATE 6 s 9477 9476',
'STATE 3 r 9479 9478',
'STATE 6 a 9481 9480',
'STATE 3 p 9482 8160',
'STATE 5 l 8816 9483',
'STATE 2 c 8152 9484',
'STATE 6 t 8096 9485',
'STATE 3 t 8152 9486',
'STATE 5 o 9212 9487',
'STATE 5 c 8160 9488',
'STATE 5 t 9490 9489',
'STATE 5 t 8603 9491',
'STATE 2 o 8152 9492',
'STATE 2 b 8152 8100',
'STATE 1 # 8275 9493',
'STATE 1 s 9495 9494',
'STATE 2 o 8160 8152',
'STATE 3 t 8096 8275',
'STATE 1 i 8160 8275',
'STATE 6 l 8152 9496',
'STATE 3 l 8275 9497',
'STATE 4 p 9499 9498',
'STATE 3 t 8152 9500',
'STATE 3 h 8160 8147',
'STATE 2 a 8147 9501',
'STATE 3 h 8147 9259',
'STATE 1 a 8100 8147',
'STATE 4 g 9503 9502',
'STATE 3 r 8295 9504',
'STATE 6 i 9506 9505',
'STATE 3 r 8100 9507',
'STATE 6 n 8096 9508',
'STATE 6 e 8152 9509',
'STATE 3 c 9511 9510',
'STATE 6 i 8100 8275',
'STATE 3 r 9513 9512',
'STATE 6 t 8816 9514',
'STATE 3 r 9516 9515',
'STATE 4 c 8275 9517',
'STATE 3 g 8152 8275',
'STATE 6 v 8152 9518',
'STATE 3 r 9520 9519',
'STATE 4 t 8275 9521',
'STATE 2 c 8275 9522',
'STATE 6 n 8160 8096',
'STATE 6 e 8096 9523',
'STATE 4 d 8152 9524',
'STATE 4 b 8275 8152',
'STATE 4 c 9526 9525',
'STATE 3 h 8152 8275',
'STATE 1 r 8081 9527',
'STATE 2 e 8152 9528',
'STATE 3 h 8152 9212',
'STATE 5 d 8160 8152',
'STATE 1 a 8152 8774',
'STATE 6 r 8152 9529',
'STATE 6 h 8152 9530',
'STATE 1 e 9531 8160',
'STATE 1 i 8081 8200',
'STATE 6 o 8100 9532',
'STATE 5 i 9534 9533',
'STATE 1 n 8075 8100',
'STATE 5 i 8100 9535',
'STATE 5 h 9537 9536',
'STATE 4 g 9539 9538',
'STATE 4 t 8152 9540',
'STATE 4 v 8295 9541',
'STATE 1 p 8275 9542',
'STATE 6 c 8152 9543',
'STATE 5 i 8096 8152',
'STATE 2 a 8100 8152',
'STATE 5 b 8160 9544',
'STATE 6 u 8160 8094',
'STATE 2 a 8152 8275',
'STATE 4 m 9546 9545',
'STATE 2 c 8100 9547',
'STATE 4 f 8100 9548',
'STATE 3 n 8160 9549',
'STATE 4 d 8160 9550',
'STATE 5 h 9552 9551',
'STATE 6 l 8152 9553',
'STATE 4 h 8096 9554',
'STATE 4 m 8152 8160',
'STATE 3 l 8160 9555',
'STATE 2 p 9556 8275',
'STATE 6 c 9558 9557',
'STATE 5 l 9107 8275',
'STATE 2 o 8152 9559',
'STATE 5 t 8275 9560',
'STATE 5 m 8275 9561',
'STATE 6 # 9562 8275',
'STATE 1 o 8152 9563',
'STATE 6 h 8160 9564',
'STATE 2 c 8160 9565',
'PHONE ih',
'STATE 2 n 8275 9566',
'STATE 5 o 8096 9567',
'STATE 3 l 8100 9568',
'STATE 3 l 8275 9569',
'STATE 4 t 9571 9570',
'STATE 4 t 8160 8152',
'STATE 6 h 8152 9572',
'STATE 4 c 8152 9573',
'STATE 1 # 9574 8160',
'STATE 1 y 8160 8096',
'STATE 2 s 9576 9575',
'STATE 3 r 8160 9577',
'STATE 5 y 9579 9578',
'STATE 3 d 9581 9580',
'STATE 3 c 8275 9582',
'STATE 3 k 8152 9583',
'STATE 4 p 8160 8152',
'STATE 3 m 9585 9584',
'STATE 4 b 9587 9586',
'STATE 3 g 8152 9588',
'STATE 5 q 8152 9589',
'STATE 6 a 8100 9590',
'STATE 6 # 8100 9591',
'STATE 6 i 8100 8152',
'STATE 3 p 9593 9592',
'STATE 6 f 9595 9594',
'STATE 4 b 8152 9596',
'STATE 3 r 8275 9187',
'STATE 3 s 8275 9597',
'STATE 6 t 8096 9598',
'STATE 4 b 8152 8275',
'STATE 4 c 8275 8160',
'STATE 4 b 8096 9599',
'STATE 6 n 9601 9600',
'STATE 1 # 9602 8275',
'STATE 6 m 9604 9603',
'STATE 6 a 8275 8100',
'STATE 6 r 8632 9605',
'STATE 5 o 9607 9606',
'STATE 3 r 8295 8152',
'STATE 6 a 9609 9608',
'STATE 3 n 8152 8160',
'STATE 1 h 8075 9610',
'STATE 6 # 8075 8100',
'STATE 3 r 8075 8100',
'STATE 5 m 8100 8317',
'STATE 5 r 9612 9611',
'STATE 4 t 9614 9613',
'STATE 6 a 8275 9615',
'STATE 3 l 8160 8275',
'STATE 4 p 8152 9616',
'STATE 4 d 8160 9617',
'STATE 1 e 8275 8160',
'STATE 2 e 8152 9618',
'STATE 2 n 9620 9619',
'STATE 4 k 8275 9621',
'STATE 5 s 8160 9622',
'STATE 3 c 9624 9623',
'STATE 4 p 8152 9625',
'STATE 2 r 8160 9626',
'STATE 4 p 8160 8275',
'STATE 5 r 9628 9627',
'STATE 4 t 9630 9629',
'STATE 6 c 8160 9631',
'STATE 4 x 8152 9632',
'STATE 2 s 8096 9633',
'STATE 4 v 8160 8096',
'STATE 1 0 9635 9634',
'STATE 3 t 8275 8152',
'STATE 2 a 8096 8160',
'STATE 3 p 9636 8275',
'STATE 1 e 8096 9637',
'STATE 3 f 8275 9638',
'STATE 2 b 8160 9639',
'STATE 3 r 9641 9640',
'STATE 5 t 8100 8152',
'STATE 3 m 8275 9642',
'STATE 5 y 8096 8100',
'STATE 6 # 9643 8971',
'STATE 6 n 8160 8816',
'STATE 6 b 8160 9644',
'STATE 1 i 8096 8152',
'STATE 4 l 8152 8096',
'STATE 6 s 8275 9645',
'STATE 4 l 8160 8096',
'STATE 3 p 8152 9646',
'STATE 3 h 8152 9647',
'STATE 2 r 8295 8152',
'STATE 5 l 9649 9648',
'STATE 4 p 8152 9650',
'STATE 5 l 9651 8152',
'STATE 6 i 8100 9652',
'STATE 6 e 8152 9653',
'STATE 4 c 9655 9654',
'STATE 3 n 8094 9656',
'STATE 6 e 8094 8100',
'STATE 6 s 8275 9657',
'STATE 3 r 8152 8096',
'STATE 3 m 8152 8100',
'STATE 6 o 9659 9658',
'STATE 5 t 9661 9660',
'STATE 3 b 8100 9662',
'STATE 3 k 8160 9663',
'STATE 4 p 8152 8160',
'STATE 6 l 9665 9664',
'STATE 3 c 8275 8152',
'STATE 4 s 8152 8096',
'STATE 6 e 8275 9444',
'STATE 4 d 9667 9666',
'STATE 2 r 8096 9668',
'STATE 3 l 8275 9669',
'STATE 2 r 8275 9107',
'STATE 3 r 8275 9670',
'STATE 3 m 8160 9671',
'STATE 4 l 8160 8275',
'STATE 3 r 8081 9672',
'STATE 6 a 9674 9673',
'STATE 6 m 8152 8346',
'STATE 6 o 9676 9675',
'STATE 5 t 8160 8295',
'STATE 2 a 8075 9677',
'STATE 4 h 9679 9678',
'STATE 6 a 9681 9680',
'STATE 1 0 8152 9682',
'STATE 6 e 9684 9683',
'STATE 4 t 9686 9685',
'STATE 1 e 8152 9687',
'STATE 5 o 8160 9688',
'STATE 5 i 9690 9689',
'STATE 6 a 8152 8160',
'STATE 1 o 8160 9691',
'STATE 4 h 9693 9692',
'STATE 5 b 8160 8152',
'STATE 5 s 9694 8160',
'STATE 1 a 8152 9695',
'STATE 5 s 8160 8152',
'STATE 2 b 8160 9696',
'STATE 4 h 8275 9697',
'STATE 4 t 8096 9698',
'STATE 3 i 8096 9699',
'STATE 3 r 9585 9700',
'STATE 6 s 8275 9701',
'STATE 3 i 8160 9702',
'STATE 4 d 8275 8160',
'STATE 6 d 8152 9703',
'STATE 5 l 8152 9704',
'STATE 5 i 8160 8275',
'STATE 1 c 8096 8275',
'STATE 3 h 8275 9705',
'STATE 1 e 8152 9706',
'STATE 3 g 8096 9707',
'STATE 2 e 8096 9708',
'STATE 3 p 8275 8100',
'STATE 3 r 8160 8152',
'STATE 4 s 8160 9709',
'STATE 6 r 8096 9710',
'STATE 2 a 8160 9711',
'STATE 4 t 8152 8160',
'STATE 5 c 9713 9712',
'STATE 4 b 9651 8152',
'STATE 4 b 9714 8275',
'STATE 6 e 8275 8152',
'STATE 5 g 8100 8152',
'STATE 6 i 8152 9715',
'STATE 3 s 8152 9716',
'STATE 6 e 8152 9717',
'STATE 6 e 9718 8152',
'STATE 4 g 8275 9719',
'STATE 5 u 8275 9720',
'STATE 3 r 8152 9721',
'STATE 5 m 9722 8152',
'STATE 6 u 8295 9723',
'STATE 3 g 8152 9724',
'STATE 6 o 8160 9725',
'STATE 3 k 9727 9726',
'STATE 3 m 8275 8152',
'STATE 4 k 8160 9728',
'STATE 6 r 8096 8160',
'STATE 2 e 8160 9729',
'STATE 3 r 8275 8771',
'STATE 2 s 8275 8160',
'STATE 2 # 9731 9730',
'STATE 6 # 8275 9732',
'STATE 5 m 8160 9733',
'STATE 3 d 8152 8160',
'STATE 5 f 8160 9734',
'STATE 5 f 8160 9735',
'STATE 6 s 8931 9736',
'STATE 5 o 9738 9737',
'STATE 5 o 8160 8275',
'STATE 1 h 9489 9739',
'STATE 2 c 8096 9740',
'STATE 4 c 9742 9741',
'STATE 6 a 8160 8152',
'STATE 2 y 8152 9743',
'STATE 6 t 9745 9744',
'STATE 3 m 8275 9746',
'STATE 4 b 9747 8160',
'STATE 4 t 8152 9748',
'STATE 3 r 8152 9162',
'STATE 3 t 8160 9749',
'STATE 6 e 8152 9234',
'STATE 2 a 8295 9750',
'STATE 3 s 8160 8096',
'STATE 3 i 8160 9751',
'STATE 2 s 8160 9752',
'STATE 2 s 8152 9753',
'STATE 2 p 9755 9754',
'STATE 2 b 8152 9756',
'STATE 2 e 8160 9757',
'STATE 2 c 8275 8152',
'STATE 4 q 8160 8096',
'STATE 3 r 9759 9758',
'STATE 5 l 9761 9760',
'STATE 5 i 9763 9762',
'STATE 2 e 8275 8415',
'STATE 2 u 8152 9764',
'STATE 6 r 8275 9765',
'STATE 2 u 8096 9766',
'STATE 1 l 8275 9767',
'STATE 3 r 8275 8096',
'STATE 1 b 8295 9768',
'STATE 4 z 8152 9769',
'STATE 4 c 9770 8152',
'STATE 6 # 8275 8160',
'STATE 6 a 9071 8160',
'STATE 4 p 8275 8152',
'STATE 6 a 8275 8152',
'STATE 3 b 8152 8094',
'STATE 4 c 8096 9771',
'STATE 3 t 8096 9772',
'STATE 3 m 8152 8126',
'STATE 6 o 8100 8295',
'STATE 6 e 8100 9773',
'STATE 3 m 8100 9513',
'STATE 3 c 8275 9774',
'STATE 4 d 9776 9775',
'STATE 6 n 8160 8275',
'STATE 6 r 8275 9777',
'STATE 1 o 8160 9778',
'STATE 6 a 8152 9779',
'STATE 3 t 8160 8275',
'STATE 5 e 8275 8096',
'STATE 3 s 8160 9780',
'STATE 6 i 8160 9781',
'STATE 5 s 8160 9782',
'STATE 3 i 8100 9783',
'STATE 5 y 9785 9784',
'STATE 4 p 9787 9786',
'STATE 1 a 8160 9788',
'STATE 2 l 8152 9789',
'STATE 1 p 8096 9790',
'STATE 1 u 8096 9791',
'STATE 2 d 8094 9792',
'STATE 6 e 9794 9793',
'STATE 4 v 8160 9795',
'STATE 3 v 8275 8160',
'STATE 1 0 8160 8275',
'STATE 6 t 8152 8275',
'STATE 2 o 8160 9796',
'STATE 3 l 8160 9797',
'STATE 3 g 8160 8152',
'STATE 2 i 8295 8152',
'STATE 1 s 8152 9798',
'STATE 3 i 8275 9799',
'STATE 5 l 9800 8152',
'STATE 4 p 8160 9801',
'STATE 2 p 8152 9802',
'STATE 2 a 8152 9167',
'STATE 6 c 8152 9803',
'STATE 6 k 8275 9804',
'STATE 3 r 8275 9805',
'STATE 5 y 8096 8275',
'STATE 6 v 8096 8152',
'STATE 1 r 8152 9411',
'STATE 6 s 8275 9806',
'STATE 2 t 8160 8275',
'STATE 4 h 8160 9807',
'STATE 1 c 8152 9808',
'STATE 6 o 8152 9809',
'STATE 6 i 8275 9810',
'STATE 4 q 8096 8275',
'STATE 5 c 8096 9811',
'STATE 6 l 8100 8152',
'STATE 4 b 8275 9812',
'STATE 4 p 8275 9813',
'STATE 6 n 8096 8160',
'STATE 4 l 9815 9814',
'STATE 2 s 8160 9816',
'STATE 6 s 8152 8275',
'STATE 5 h 8160 9817',
'STATE 5 c 8160 9818',
'STATE 5 t 8160 8152',
'STATE 1 d 8100 9819',
'STATE 5 l 9821 9820',
'STATE 4 d 8096 9822',
'STATE 1 0 9824 9823',
'STATE 6 u 8152 9825',
'STATE 6 o 9827 9826',
'STATE 1 o 8152 9828',
'STATE 3 r 8160 9829',
'STATE 3 r 9830 8703',
'STATE 1 0 8094 8160',
'STATE 4 v 8096 9831',
'STATE 1 t 8152 9832',
'STATE 4 c 8152 9833',
'STATE 2 p 8160 9834',
'STATE 1 e 8160 8152',
'STATE 1 n 8152 9835',
'STATE 5 y 8100 9836',
'STATE 4 c 8096 8152',
'STATE 6 e 8160 9837',
'STATE 6 e 8152 9838',
'STATE 2 p 9839 8275',
'STATE 5 p 8275 9840',
'STATE 1 m 8152 9841',
'STATE 1 e 8160 9842',
'STATE 2 s 8160 9843',
'STATE 3 i 8160 9844',
'STATE 5 z 9651 8152',
'STATE 6 a 8152 8275',
'STATE 3 m 9846 9845',
'STATE 4 k 9848 9847',
'STATE 4 c 8275 9849',
'STATE 6 n 8275 9850',
'STATE 6 n 8096 9851',
'STATE 4 t 9439 9852',
'STATE 2 r 8160 9853',
'STATE 6 l 8152 8160',
'STATE 1 o 9855 9854',
'STATE 4 b 9857 9856',
'STATE 3 r 9859 9858',
'STATE 4 t 8160 9860',
'STATE 1 o 8152 9861',
'STATE 4 d 9863 9862',
'STATE 3 n 8152 9864',
'STATE 1 0 8152 9865',
'STATE 1 i 8096 9866',
'STATE 3 n 9868 9867',
'STATE 2 s 8152 8160',
'STATE 6 e 9869 8275',
'STATE 3 m 9871 9870',
'STATE 4 d 8152 9872',
'STATE 4 d 8152 8096',
'STATE 3 d 8160 8096',
'STATE 3 l 8152 9873',
'STATE 4 m 9389 9874',
'STATE 4 g 8275 8160',
'STATE 2 b 8152 9875',
'STATE 4 f 8152 9876',
'STATE 2 o 8160 9877',
'STATE 3 c 8160 9878',
'STATE 2 i 8096 9879',
'STATE 3 c 8160 9880',
'STATE 2 d 8152 9881',
'STATE 6 i 9882 8152',
'STATE 5 t 8152 9651',
'STATE 6 s 8275 9883',
'STATE 3 s 8152 8275',
'STATE 3 s 8096 9884',
'STATE 6 b 8275 9885',
'STATE 6 k 8275 8152',
'STATE 1 i 8160 9886',
'STATE 3 t 8160 8152',
'STATE 5 n 9888 9887',
'STATE 6 # 8100 8075',
'STATE 5 u 9890 9889',
'STATE 6 e 8160 9891',
'STATE 6 e 9893 9892',
'STATE 4 p 8160 8096',
'STATE 4 g 8160 9894',
'STATE 1 r 8160 9895',
'STATE 6 n 8096 8275',
'STATE 6 r 8275 8152',
'STATE 2 h 8160 9896',
'STATE 1 e 8096 8160',
'STATE 1 u 8096 8160',
'STATE 1 a 8152 9897',
'STATE 2 a 8152 8160',
'STATE 1 e 8160 8096',
'STATE 4 k 8275 9898',
'STATE 2 o 8096 8275',
'STATE 1 0 8275 8096',
'STATE 2 y 8152 9899',
'STATE 5 l 9162 8152',
'STATE 4 c 8152 8275',
'STATE 6 n 8152 9900',
'STATE 6 s 9902 9901',
'STATE 1 o 8160 9903',
'STATE 1 i 8096 9904',
'STATE 1 c 9906 9905',
'STATE 3 s 8152 9907',
'STATE 5 h 8275 8152',
'STATE 6 l 8718 9908',
'STATE 3 t 8160 9909',
'STATE 3 m 8096 9910',
'STATE 4 c 8096 9911',
'STATE 6 # 8100 9912',
'STATE 2 t 8075 9913',
'STATE 1 0 9915 9914',
'STATE 4 g 9917 9916',
'STATE 5 s 9918 8152',
'STATE 1 0 8644 9919',
'STATE 4 g 8275 9920',
'STATE 4 c 8160 8096',
'STATE 1 l 8275 9921',
'STATE 6 l 9797 8160',
'STATE 3 l 8160 9922',
'STATE 2 e 8275 9923',
'STATE 1 e 8152 9259',
'STATE 4 v 8160 8152',
'STATE 3 t 8096 9924',
'STATE 2 m 8160 9925',
'STATE 2 s 8152 9444',
'STATE 6 a 8100 9926',
'STATE 6 c 8096 9927',
'STATE 2 t 8096 8275',
'STATE 3 b 8295 9928',
'STATE 6 r 8275 8774',
'STATE 3 j 8096 8275',
'STATE 6 m 8096 8275',
'STATE 2 i 8160 8293',
'STATE 2 r 8075 9929',
'STATE 1 n 8100 9930',
'STATE 2 e 9932 9931',
'STATE 6 r 8160 9933',
'STATE 1 0 8096 9934',
'STATE 3 l 8100 8152',
'STATE 6 t 8160 8152',
'STATE 6 i 8275 8160',
'STATE 3 n 8275 8160',
'STATE 4 c 8096 9935',
'STATE 3 m 9937 9936',
'STATE 1 i 8096 9938',
'STATE 5 o 8160 9939',
'STATE 2 a 9941 9940',
'STATE 2 o 8152 9942',
'STATE 3 r 9943 8096',
'STATE 2 g 8160 9944',
'STATE 2 b 8100 9945',
'STATE 2 n 8100 9946',
'STATE 6 o 9521 9947',
'STATE 1 r 8160 8152',
'STATE 5 c 9683 8152',
'STATE 3 p 8152 9948',
'STATE 6 s 8096 9949',
'STATE 3 t 9951 9950',
'STATE 4 c 8160 8152',
'STATE 6 o 9953 9952',
'STATE 6 z 8160 9954',
'STATE 2 e 8152 8160',
'STATE 3 b 8152 8160',
'STATE 3 c 8152 8275',
'STATE 2 t 8096 9955',
'STATE 2 e 8160 9956',
'STATE 2 t 8100 9957',
'STATE 1 l 8100 9958',
'STATE 4 f 8100 9959',
'STATE 4 c 9918 9198',
'STATE 6 r 8160 9960',
'STATE 4 g 8160 9643',
'STATE 4 c 8160 9961',
'STATE 2 t 8160 9962',
'STATE 4 b 8160 8275',
'STATE 1 c 8160 9963',
'STATE 6 n 9964 8096',
'STATE 2 h 8160 9965',
'STATE 6 n 8100 9966',
'STATE 1 i 8075 9967',
'STATE 6 s 8152 9968',
'STATE 1 m 8160 9969',
'STATE 1 m 8152 8160',
'STATE 3 t 8096 9970',
'STATE 3 v 8152 9971',
'STATE 2 c 8096 8160',
'STATE 2 r 8160 9972',
'STATE 1 m 8100 8075',
'STATE 2 y 8075 9973',
'STATE 1 a 9975 9974',
'STATE 2 e 8160 9976',
'STATE 1 e 8160 9977',
'STATE 6 n 9979 9978',
'STATE 4 d 8152 9980',
'STATE 1 a 8075 9981',
'STATE 3 n 8152 9982',
'STATE 2 l 8152 9983',
'STATE 4 b 8096 9984',
'STATE 1 0 8096 9985',
'STATE 2 n 8160 9986',
'STATE 3 r 8275 9987',
'STATE 2 l 8160 9988',
'STATE 3 h 8100 8075',
'STATE 2 o 9989 8152',
'STATE 6 i 8275 8152',
'STATE 4 d 9198 9990',
'STATE 6 n 8160 9991',
'STATE 2 p 8096 8275',
'STATE 3 i 8160 9992',
'STATE 1 p 8160 9993',
'STATE 5 n 8275 8152',
'STATE 3 r 8160 9994',
'STATE 2 h 8096 8160',
'STATE 1 # 8160 8096',
'STATE 3 r 8160 9995',
'STATE 3 t 8096 8160',
'STATE 1 g 8160 9996',
'STATE 3 l 8152 9997',
'STATE 3 n 8295 8160',
'INDEX 9998 p',
'STATE 4 p 10000 9999',
'STATE 4 h 10002 10001',
'PHONE epsilon',
'STATE 4 f 10004 10003',
'STATE 2 # 10006 10005',
'STATE 4 s 10008 10007',
'STATE 2 0 10000 10009',
'STATE 2 h 10011 10010',
'STATE 3 u 10009 10010',
'STATE 3 p 10009 10012',
'STATE 2 0 10000 10013',
'PHONE p',
'PHONE f',
'STATE 3 e 10009 10010',
'STATE 4 t 10004 10014',
'STATE 2 o 10015 10009',
'STATE 4 b 10017 10016',
'STATE 3 r 10000 10009',
'STATE 4 n 10004 10009',
'STATE 2 a 10000 10009',
'INDEX 10018 q',
'PHONE k',
'INDEX 10019 r',
'STATE 3 e 10021 10020',
'STATE 4 r 10023 10022',
'STATE 1 # 10025 10024',
'STATE 1 0 10027 10026',
'STATE 2 c 10029 10028',
'STATE 4 # 10031 10030',
'STATE 4 r 10033 10032',
'STATE 3 u 10035 10034',
'STATE 3 u 10037 10036',
'STATE 1 0 10029 10038',
'PHONE epsilon',
'STATE 4 r 10040 10039',
'STATE 2 e 10042 10041',
'STATE 4 i 10044 10043',
'STATE 2 p 10046 10045',
'STATE 3 o 10048 10047',
'STATE 1 # 10050 10049',
'STATE 3 i 10052 10051',
'STATE 4 i 10029 10053',
'STATE 2 b 10029 10054',
'STATE 4 i 10056 10055',
'STATE 2 v 10058 10057',
'STATE 2 i 10058 10059',
'PHONE r',
'STATE 4 e 10061 10060',
'STATE 2 p 10063 10062',
'STATE 2 t 10029 10064',
'STATE 5 i 10058 10065',
'STATE 3 i 10067 10066',
'STATE 2 w 10069 10068',
'STATE 2 o 10071 10070',
'STATE 4 i 10073 10072',
'STATE 3 a 10075 10074',
'STATE 4 o 10058 10076',
'STATE 4 a 10042 10077',
'STATE 3 a 10079 10078',
'STATE 2 i 10081 10080',
'STATE 5 n 10083 10082',
'STATE 1 n 10085 10084',
'PHONE er',
'STATE 2 u 10058 10086',
'STATE 4 o 10088 10087',
'STATE 2 p 10058 10089',
'STATE 5 v 10058 10090',
'STATE 5 o 10042 10091',
'STATE 2 g 10042 10092',
'STATE 5 e 10058 10093',
'STATE 3 r 10095 10094',
'STATE 2 a 10042 10096',
'STATE 1 # 10098 10097',
'STATE 1 # 10093 10099',
'STATE 2 a 10101 10100',
'STATE 1 j 10093 10102',
'STATE 4 o 10042 10103',
'STATE 2 k 10058 10042',
'STATE 4 z 10105 10104',
'STATE 4 o 10107 10106',
'STATE 5 i 10093 10108',
'STATE 4 b 10058 10109',
'STATE 2 w 10029 10110',
'STATE 2 g 10029 10111',
'STATE 5 # 10113 10112',
'STATE 4 s 10114 10042',
'STATE 5 z 10058 10115',
'STATE 2 e 10042 10116',
'STATE 2 h 10117 10029',
'STATE 5 e 10058 10029',
'STATE 2 a 10042 10058',
'STATE 4 a 10119 10118',
'STATE 2 p 10121 10120',
'STATE 2 t 10058 10122',
'STATE 5 s 10124 10123',
'STATE 5 s 10042 10058',
'STATE 2 m 10029 10125',
'PHONE er1',
'STATE 3 a 10127 10126',
'STATE 2 u 10129 10128',
'STATE 4 e 10131 10130',
'STATE 4 # 10133 10132',
'STATE 4 o 10135 10134',
'STATE 4 k 10093 10136',
'STATE 4 e 10138 10137',
'STATE 1 t 10058 10042',
'STATE 5 s 10140 10139',
'STATE 4 a 10042 10141',
'STATE 3 o 10142 10042',
'STATE 3 g 10093 10143',
'STATE 5 s 10144 10042',
'STATE 5 u 10058 10042',
'STATE 4 a 10042 10145',
'STATE 4 e 10029 10146',
'STATE 2 d 10148 10147',
'STATE 1 # 10150 10149',
'STATE 1 0 10152 10151',
'STATE 4 a 10154 10153',
'STATE 5 # 10058 10042',
'STATE 5 e 10156 10155',
'STATE 1 t 10058 10157',
'STATE 1 s 10042 10029',
'STATE 2 p 10159 10158',
'STATE 5 # 10042 10160',
'STATE 5 u 10058 10161',
'STATE 5 n 10042 10058',
'STATE 5 s 10042 10162',
'STATE 2 d 10042 10163',
'STATE 2 d 10058 10042',
'STATE 2 h 10029 10164',
'STATE 5 # 10166 10165',
'STATE 2 e 10168 10167',
'STATE 1 c 10170 10169',
'STATE 1 s 10058 10171',
'STATE 4 a 10173 10172',
'STATE 2 m 10042 10174',
'STATE 4 s 10176 10175',
'STATE 2 c 10042 10177',
'STATE 4 a 10179 10178',
'STATE 2 b 10180 10042',
'STATE 4 t 10182 10181',
'STATE 4 a 10184 10183',
'STATE 2 t 10058 10185',
'STATE 1 c 10187 10186',
'STATE 1 n 10093 10042',
'STATE 4 e 10042 10188',
'STATE 5 g 10144 10042',
'STATE 5 y 10058 10042',
'STATE 4 i 10058 10042',
'STATE 4 i 10042 10189',
'STATE 5 u 10058 10093',
'STATE 3 i 10190 10029',
'STATE 5 a 10042 10029',
'STATE 5 a 10029 10191',
'STATE 2 f 10029 10192',
'STATE 5 i 10194 10193',
'STATE 4 a 10042 10195',
'STATE 4 o 10042 10196',
'STATE 2 h 10058 10042',
'STATE 5 # 10042 10197',
'STATE 2 p 10042 10058',
'STATE 1 n 10058 10198',
'STATE 4 u 10042 10199',
'STATE 4 u 10058 10200',
'STATE 2 d 10042 10201',
'STATE 2 f 10058 10042',
'STATE 2 j 10042 10202',
'STATE 5 d 10058 10042',
'STATE 2 c 10029 10203',
'STATE 4 z 10058 10204',
'STATE 4 e 10205 10042',
'STATE 1 # 10207 10206',
'STATE 4 n 10209 10208',
'STATE 1 # 10211 10210',
'STATE 2 a 10042 10212',
'STATE 5 c 10058 10213',
'STATE 4 o 10215 10214',
'STATE 5 # 10042 10216',
'STATE 5 c 10058 10217',
'STATE 4 d 10219 10218',
'STATE 5 # 10221 10220',
'STATE 2 o 10042 10222',
'STATE 2 c 10224 10223',
'STATE 5 i 10058 10042',
'STATE 5 w 10058 10093',
'STATE 1 s 10042 10225',
'STATE 1 s 10058 10226',
'STATE 4 g 10228 10227',
'STATE 5 # 10042 10229',
'STATE 2 s 10231 10230',
'STATE 1 f 10042 10232',
'STATE 5 g 10093 10233',
'STATE 2 s 10235 10234',
'STATE 4 e 10042 10093',
'STATE 5 e 10029 10236',
'STATE 2 m 10029 10237',
'STATE 2 t 10029 10238',
'STATE 2 e 10042 10239',
'STATE 4 s 10241 10240',
'STATE 4 o 10042 10242',
'STATE 4 e 10042 10243',
'STATE 5 o 10042 10244',
'STATE 2 f 10058 10245',
'STATE 4 y 10042 10246',
'STATE 4 l 10093 10247',
'STATE 5 s 10042 10248',
'STATE 2 d 10042 10249',
'STATE 2 j 10029 10250',
'STATE 3 y 10252 10251',
'STATE 3 y 10042 10253',
'STATE 4 # 10255 10254',
'STATE 4 o 10257 10256',
'STATE 5 h 10093 10258',
'STATE 5 # 10259 10093',
'STATE 2 a 10261 10260',
'STATE 2 a 10262 10042',
'STATE 4 i 10042 10263',
'STATE 1 d 10029 10264',
'STATE 4 i 10266 10265',
'STATE 5 n 10267 10042',
'STATE 1 d 10058 10268',
'STATE 2 o 10042 10269',
'STATE 4 a 10271 10270',
'STATE 2 f 10272 10042',
'STATE 5 h 10058 10042',
'STATE 2 o 10042 10058',
'STATE 2 t 10058 10273',
'STATE 4 t 10042 10274',
'STATE 4 s 10275 10042',
'STATE 1 r 10093 10276',
'STATE 1 t 10093 10277',
'STATE 4 i 10279 10278',
'STATE 2 b 10058 10093',
'STATE 5 l 10058 10280',
'STATE 1 i 10029 10281',
'STATE 1 n 10042 10282',
'STATE 5 e 10042 10283',
'STATE 5 e 10284 10042',
'STATE 4 y 10042 10285',
'STATE 4 v 10058 10286',
'STATE 1 # 10042 10029',
'STATE 1 c 10029 10287',
'STATE 5 # 10042 10288',
'STATE 2 d 10058 10289',
'STATE 2 s 10093 10290',
'STATE 1 o 10058 10093',
'STATE 4 u 10042 10291',
'STATE 2 e 10042 10292',
'STATE 5 a 10294 10293',
'STATE 2 h 10058 10295',
'STATE 5 a 10297 10296',
'STATE 4 v 10058 10298',
'STATE 2 p 10058 10299',
'STATE 2 b 10121 10042',
'STATE 2 k 10029 10300',
'STATE 4 o 10042 10301',
'STATE 4 n 10093 10302',
'STATE 3 c 10058 10303',
'STATE 4 d 10305 10304',
'STATE 2 l 10058 10306',
'STATE 4 a 10308 10307',
'STATE 5 # 10042 10309',
'STATE 4 l 10093 10310',
'STATE 1 h 10058 10093',
'STATE 1 f 10312 10311',
'STATE 1 b 10042 10313',
'STATE 4 o 10042 10314',
'STATE 5 # 10042 10315',
'STATE 5 l 10042 10316',
'STATE 4 # 10042 10317',
'STATE 2 p 10042 10318',
'STATE 2 v 10042 10319',
'STATE 5 t 10319 10320',
'STATE 5 d 10058 10321',
'STATE 5 z 10058 10322',
'STATE 5 # 10154 10323',
'STATE 5 # 10058 10324',
'STATE 1 a 10325 10058',
'STATE 5 r 10042 10326',
'STATE 5 e 10058 10042',
'STATE 5 # 10327 10093',
'STATE 1 e 10093 10328',
'STATE 4 y 10330 10329',
'STATE 1 i 10029 10331',
'STATE 5 t 10333 10332',
'STATE 2 e 10093 10334',
'STATE 1 s 10042 10058',
'STATE 5 o 10042 10335',
'STATE 4 s 10042 10093',
'STATE 4 u 10042 10336',
'STATE 5 e 10093 10337',
'STATE 2 h 10029 10338',
'STATE 2 j 10029 10339',
'STATE 5 e 10341 10340',
'STATE 4 m 10343 10342',
'STATE 5 c 10042 10093',
'STATE 4 s 10058 10344',
'STATE 1 0 10042 10345',
'STATE 2 l 10058 10042',
'STATE 2 i 10042 10058',
'STATE 5 o 10347 10346',
'STATE 4 d 10042 10348',
'STATE 4 f 10058 10349',
'STATE 5 l 10042 10350',
'STATE 5 e 10352 10351',
'STATE 4 a 10354 10353',
'STATE 4 t 10093 10355',
'STATE 1 f 10058 10356',
'STATE 5 t 10358 10357',
'STATE 5 # 10360 10359',
'STATE 2 g 10058 10361',
'STATE 4 i 10363 10362',
'STATE 2 h 10324 10364',
'STATE 2 p 10366 10365',
'STATE 1 l 10368 10367',
'STATE 1 t 10370 10369',
'STATE 5 d 10093 10371',
'STATE 1 e 10058 10372',
'STATE 5 v 10058 10373',
'STATE 5 c 10058 10374',
'STATE 5 t 10093 10375',
'STATE 2 e 10042 10376',
'STATE 5 # 10042 10377',
'STATE 1 # 10042 10058',
'STATE 2 h 10042 10378',
'STATE 2 f 10380 10379',
'STATE 4 o 10382 10381',
'STATE 5 t 10384 10383',
'STATE 5 s 10058 10042',
'STATE 2 d 10042 10058',
'STATE 4 n 10042 10385',
'STATE 4 d 10093 10058',
'STATE 1 l 10058 10093',
'STATE 4 o 10387 10386',
'STATE 2 b 10042 10058',
'STATE 2 c 10042 10388',
'STATE 2 c 10029 10389',
'STATE 2 t 10058 10029',
'STATE 2 j 10058 10390',
'STATE 1 p 10042 10391',
'STATE 5 u 10393 10392',
'STATE 4 m 10058 10394',
'STATE 5 e 10029 10395',
'STATE 5 i 10029 10396',
'STATE 2 h 10398 10397',
'STATE 2 o 10042 10399',
'STATE 4 e 10042 10400',
'STATE 1 e 10093 10401',
'STATE 2 b 10058 10402',
'STATE 2 d 10058 10403',
'STATE 5 u 10405 10404',
'STATE 2 v 10058 10406',
'STATE 2 d 10093 10407',
'STATE 4 n 10058 10408',
'STATE 5 t 10042 10409',
'STATE 2 d 10042 10410',
'STATE 2 f 10042 10029',
'STATE 5 c 10042 10411',
'STATE 3 h 10412 10042',
'STATE 4 o 10042 10413',
'STATE 3 t 10058 10414',
'STATE 4 s 10416 10415',
'STATE 4 i 10418 10417',
'STATE 2 w 10420 10419',
'STATE 2 o 10042 10421',
'STATE 2 n 10058 10422',
'STATE 4 e 10275 10042',
'STATE 5 t 10042 10423',
'STATE 5 d 10425 10424',
'STATE 2 m 10058 10426',
'STATE 5 l 10058 10042',
'STATE 4 s 10428 10427',
'STATE 4 # 10058 10144',
'STATE 1 w 10430 10429',
'STATE 2 o 10042 10431',
'STATE 5 r 10058 10432',
'STATE 1 g 10042 10433',
'STATE 4 i 10042 10058',
'STATE 4 e 10435 10434',
'STATE 4 e 10093 10436',
'STATE 4 u 10042 10437',
'STATE 1 a 10058 10438',
'STATE 5 b 10042 10439',
'STATE 5 s 10282 10440',
'STATE 5 f 10042 10058',
'STATE 1 s 10442 10441',
'STATE 5 u 10444 10443',
'STATE 1 o 10058 10445',
'STATE 1 r 10058 10446',
'STATE 4 g 10448 10447',
'STATE 4 # 10450 10449',
'STATE 2 e 10042 10451',
'STATE 5 a 10042 10452',
'STATE 1 a 10058 10042',
'STATE 1 r 10029 10453',
'STATE 1 s 10058 10454',
'STATE 5 i 10093 10455',
'STATE 2 p 10058 10093',
'STATE 4 p 10058 10093',
'STATE 1 s 10042 10456',
'STATE 5 y 10029 10457',
'STATE 4 v 10459 10458',
'STATE 4 m 10093 10460',
'STATE 2 b 10058 10461',
'STATE 2 d 10058 10462',
'STATE 1 x 10093 10463',
'STATE 4 y 10058 10464',
'STATE 5 s 10466 10465',
'STATE 5 i 10468 10467',
'STATE 4 m 10058 10469',
'STATE 2 b 10470 10093',
'STATE 2 c 10093 10471',
'STATE 4 c 10065 10472',
'STATE 2 g 10058 10473',
'STATE 5 i 10029 10474',
'STATE 4 # 10042 10475',
'STATE 2 a 10058 10042',
'STATE 2 m 10042 10476',
'STATE 1 a 10058 10477',
'STATE 5 z 10479 10478',
'STATE 5 # 10480 10042',
'STATE 1 s 10042 10481',
'STATE 2 l 10042 10482',
'STATE 5 s 10484 10483',
'STATE 5 l 10058 10485',
'STATE 2 w 10058 10486',
'STATE 2 a 10042 10487',
'STATE 2 p 10042 10488',
'STATE 5 # 10042 10489',
'STATE 2 p 10058 10042',
'STATE 5 u 10058 10249',
'STATE 4 # 10042 10490',
'STATE 5 # 10042 10491',
'STATE 1 u 10493 10492',
'STATE 4 i 10093 10042',
'STATE 2 i 10093 10494',
'STATE 4 o 10042 10495',
'STATE 5 s 10042 10496',
'STATE 5 b 10058 10497',
'STATE 5 s 10042 10498',
'STATE 4 o 10500 10499',
'STATE 4 y 10042 10501',
'STATE 1 q 10058 10502',
'STATE 5 l 10042 10503',
'STATE 5 t 10058 10504',
'STATE 2 b 10506 10505',
'STATE 4 t 10042 10507',
'STATE 2 b 10058 10508',
'STATE 1 t 10093 10058',
'STATE 5 b 10058 10509',
'STATE 1 c 10058 10510',
'STATE 5 z 10058 10511',
'STATE 2 f 10179 10042',
'STATE 4 u 10042 10512',
'STATE 1 a 10058 10513',
'STATE 5 # 10042 10058',
'STATE 5 z 10058 10514',
'STATE 1 e 10515 10042',
'STATE 1 l 10058 10516',
'STATE 4 v 10093 10517',
'STATE 2 v 10042 10029',
'STATE 2 d 10029 10518',
'STATE 4 n 10520 10519',
'STATE 5 a 10521 10058',
'STATE 1 t 10523 10522',
'STATE 2 t 10525 10524',
'STATE 4 c 10527 10526',
'STATE 2 t 10058 10528',
'STATE 4 m 10093 10529',
'STATE 1 l 10058 10530',
'STATE 2 v 10042 10058',
'STATE 5 e 10531 10093',
'STATE 4 l 10228 10532',
'STATE 2 m 10058 10093',
'STATE 4 t 10058 10093',
'STATE 2 f 10058 10533',
'STATE 4 k 10093 10534',
'STATE 5 r 10058 10535',
'STATE 2 s 10042 10029',
'STATE 3 d 10537 10536',
'STATE 2 s 10538 10042',
'STATE 3 d 10042 10539',
'STATE 5 n 10541 10540',
'STATE 4 i 10058 10542',
'STATE 1 s 10042 10543',
'STATE 1 i 10058 10544',
'STATE 2 m 10042 10545',
'STATE 5 l 10058 10546',
'STATE 1 b 10042 10547',
'STATE 1 k 10058 10548',
'STATE 2 c 10042 10549',
'STATE 1 l 10551 10550',
'STATE 5 e 10552 10042',
'STATE 5 m 10042 10553',
'STATE 5 n 10042 10554',
'STATE 5 e 10093 10555',
'STATE 4 h 10058 10556',
'STATE 5 # 10042 10557',
'STATE 4 u 10058 10558',
'STATE 4 e 10042 10559',
'STATE 1 f 10042 10560',
'STATE 5 p 10058 10561',
'STATE 5 l 10042 10058',
'STATE 4 # 10093 10562',
'STATE 5 w 10093 10042',
'STATE 2 o 10042 10563',
'STATE 2 c 10058 10042',
'STATE 2 t 10042 10564',
'STATE 5 r 10058 10565',
'STATE 5 d 10567 10566',
'STATE 4 t 10042 10568',
'STATE 4 e 10042 10569',
'STATE 1 o 10058 10042',
'STATE 2 h 10042 10570',
'STATE 1 i 10058 10571',
'STATE 4 e 10042 10572',
'STATE 5 t 10058 10573',
'STATE 2 e 10575 10574',
'STATE 2 t 10577 10576',
'STATE 2 c 10042 10029',
'STATE 4 a 10042 10578',
'STATE 5 l 10093 10579',
'STATE 2 p 10029 10580',
'STATE 2 r 10042 10581',
'STATE 1 o 10058 10582',
'STATE 2 s 10583 10058',
'STATE 4 e 10042 10584',
'STATE 5 p 10042 10585',
'STATE 1 o 10058 10586',
'STATE 1 n 10058 10587',
'STATE 4 t 10589 10588',
'STATE 2 x 10058 10093',
'STATE 2 d 10093 10058',
'STATE 4 k 10093 10590',
'STATE 2 m 10592 10591',
'STATE 4 m 10594 10593',
'STATE 4 d 10093 10595',
'STATE 2 g 10058 10596',
'STATE 5 i 10598 10597',
'STATE 5 f 10058 10599',
'STATE 1 # 10042 10600',
'STATE 5 n 10601 10042',
'STATE 5 a 10042 10058',
'STATE 2 a 10058 10602',
'STATE 5 v 10058 10603',
'STATE 2 m 10058 10604',
'STATE 4 c 10058 10042',
'STATE 1 l 10058 10605',
'STATE 1 p 10058 10606',
'STATE 2 g 10058 10042',
'STATE 5 i 10607 10042',
'STATE 2 u 10042 10608',
'STATE 5 e 10058 10324',
'STATE 2 a 10042 10609',
'STATE 2 s 10611 10610',
'STATE 2 i 10058 10612',
'STATE 2 v 10058 10042',
'STATE 2 g 10042 10613',
'STATE 1 y 10042 10614',
'STATE 1 h 10093 10042',
'STATE 1 g 10616 10615',
'STATE 4 i 10058 10029',
'STATE 5 n 10617 10042',
'STATE 5 l 10093 10618',
'STATE 1 i 10058 10619',
'STATE 4 a 10058 10620',
'STATE 5 e 10093 10621',
'STATE 1 # 10623 10622',
'STATE 2 v 10042 10624',
'STATE 2 t 10114 10042',
'STATE 4 y 10626 10625',
'STATE 4 e 10058 10042',
'STATE 5 n 10058 10627',
'STATE 2 t 10042 10628',
'STATE 5 s 10042 10629',
'STATE 2 p 10058 10630',
'STATE 2 b 10042 10631',
'STATE 2 b 10633 10632',
'STATE 1 s 10093 10634',
'STATE 1 t 10042 10635',
'STATE 5 n 10636 10042',
'STATE 5 n 10058 10324',
'STATE 4 # 10042 10637',
'STATE 2 t 10093 10638',
'STATE 2 h 10042 10639',
'STATE 4 t 10641 10640',
'STATE 2 b 10058 10642',
'STATE 1 e 10058 10093',
'STATE 5 y 10058 10643',
'STATE 4 t 10093 10644',
'STATE 1 t 10058 10645',
'STATE 1 e 10093 10058',
'STATE 4 n 10647 10646',
'STATE 2 b 10058 10648',
'STATE 2 v 10058 10649',
'STATE 1 s 10042 10650',
'STATE 1 a 10042 10651',
'STATE 4 g 10652 10093',
'STATE 2 f 10058 10093',
'STATE 2 t 10093 10653',
'STATE 4 m 10093 10654',
'STATE 4 m 10093 10655',
'STATE 4 m 10058 10093',
'STATE 2 c 10058 10656',
'STATE 5 s 10657 10042',
'STATE 4 e 10658 10042',
'STATE 2 e 10042 10659',
'STATE 1 s 10661 10660',
'STATE 4 o 10058 10662',
'STATE 1 u 10058 10663',
'STATE 1 e 10058 10664',
'STATE 2 n 10042 10665',
'STATE 2 y 10042 10058',
'STATE 2 y 10042 10666',
'STATE 1 m 10058 10667',
'STATE 1 s 10058 10042',
'STATE 2 m 10058 10042',
'STATE 5 n 10668 10042',
'STATE 5 o 10670 10669',
'STATE 1 p 10042 10671',
'STATE 2 e 10029 10042',
'STATE 4 a 10058 10093',
'STATE 5 n 10672 10042',
'STATE 5 w 10029 10673',
'STATE 4 o 10058 10042',
'STATE 4 y 10093 10674',
'STATE 5 a 10058 10675',
'STATE 2 v 10676 10093',
'STATE 1 a 10042 10656',
'STATE 4 n 10678 10677',
'STATE 1 a 10042 10679',
'STATE 5 e 10042 10680',
'STATE 2 c 10042 10681',
'STATE 2 p 10058 10682',
'STATE 2 c 10058 10683',
'STATE 4 b 10179 10042',
'STATE 5 a 10685 10684',
'STATE 1 l 10058 10686',
'STATE 2 c 10093 10058',
'STATE 1 s 10058 10093',
'STATE 2 s 10042 10058',
'STATE 4 s 10042 10687',
'STATE 5 o 10689 10688',
'STATE 5 e 10029 10690',
'STATE 5 s 10692 10691',
'STATE 2 b 10694 10693',
'STATE 1 a 10696 10695',
'STATE 4 t 10093 10697',
'STATE 4 e 10163 10058',
'STATE 2 p 10699 10698',
'STATE 1 s 10700 10058',
'STATE 1 o 10058 10701',
'STATE 1 e 10093 10702',
'STATE 4 t 10058 10703',
'STATE 1 x 10042 10704',
'STATE 5 c 10058 10042',
'STATE 2 s 10042 10093',
'STATE 2 v 10093 10705',
'STATE 2 m 10058 10706',
'STATE 4 p 10058 10707',
'STATE 5 n 10058 10042',
'STATE 1 s 10058 10708',
'STATE 2 n 10058 10042',
'STATE 3 b 10058 10042',
'STATE 5 b 10058 10709',
'STATE 5 c 10042 10710',
'STATE 1 g 10042 10711',
'STATE 1 i 10042 10058',
'STATE 1 c 10058 10389',
'STATE 1 e 10042 10712',
'STATE 2 k 10058 10713',
'STATE 2 f 10042 10714',
'STATE 2 b 10058 10042',
'STATE 4 d 10555 10715',
'STATE 1 d 10093 10042',
'STATE 2 i 10029 10716',
'STATE 4 a 10042 10093',
'STATE 4 y 10042 10717',
'STATE 5 # 10042 10430',
'STATE 2 k 10689 10093',
'STATE 5 i 10058 10093',
'STATE 5 # 10719 10718',
'STATE 5 # 10720 10042',
'STATE 1 c 10058 10721',
'STATE 4 g 10042 10722',
'STATE 4 f 10042 10723',
'STATE 1 c 10058 10724',
'STATE 1 o 10058 10725',
'STATE 1 s 10093 10726',
'STATE 4 b 10058 10093',
'STATE 4 s 10093 10727',
'STATE 1 m 10042 10567',
'STATE 4 g 10093 10728',
'STATE 4 k 10058 10093',
'STATE 2 w 10042 10729',
'STATE 2 o 10042 10730',
'STATE 1 i 10042 10731',
'STATE 2 u 10042 10732',
'STATE 5 s 10058 10733',
'STATE 2 t 10735 10734',
'STATE 5 a 10093 10058',
'STATE 4 a 10058 10736',
'STATE 2 g 10058 10737',
'STATE 1 s 10738 10058',
'STATE 4 o 10058 10739',
'STATE 2 t 10740 10093',
'STATE 1 d 10058 10741',
'STATE 2 t 10058 10742',
'STATE 2 h 10042 10743',
'STATE 2 c 10744 10093',
'STATE 2 b 10093 10745',
'STATE 5 u 10746 10470',
'STATE 3 p 10042 10747',
'STATE 5 y 10749 10748',
'STATE 2 t 10042 10750',
'STATE 4 a 10154 10751',
'STATE 2 c 10042 10752',
'STATE 2 u 10042 10753',
'STATE 1 s 10755 10754',
'STATE 4 i 10042 10756',
'STATE 5 # 10042 10757',
'STATE 5 n 10759 10758',
'STATE 1 o 10761 10760',
'STATE 2 f 10762 10042',
'STATE 1 g 10042 10763',
'STATE 2 t 10042 10764',
'STATE 5 # 10765 10058',
'STATE 5 # 10042 10766',
'STATE 2 n 10058 10767',
'STATE 1 a 10058 10612',
'STATE 2 e 10093 10768',
'STATE 5 a 10093 10769',
'STATE 5 a 10470 10093',
'STATE 2 m 10042 10770',
'STATE 4 a 10772 10771',
'STATE 4 u 10058 10773',
'STATE 5 s 10775 10774',
'STATE 5 y 10058 10776',
'STATE 5 a 10058 10777',
'STATE 1 s 10093 10058',
'STATE 4 o 10042 10778',
'STATE 4 l 10058 10779',
'STATE 4 s 10093 10058',
'STATE 4 l 10093 10058',
'STATE 1 a 10093 10058',
'STATE 2 v 10093 10058',
'STATE 4 d 10058 10780',
'STATE 1 n 10058 10781',
'STATE 4 t 10093 10058',
'STATE 2 h 10093 10782',
'STATE 4 s 10058 10093',
'STATE 4 u 10042 10783',
'STATE 4 y 10785 10784',
'STATE 1 u 10058 10786',
'STATE 2 c 10042 10787',
'STATE 4 t 10042 10788',
'STATE 2 u 10042 10789',
'STATE 1 p 10058 10790',
'STATE 2 t 10058 10791',
'STATE 2 t 10042 10425',
'STATE 1 h 10042 10792',
'STATE 4 a 10794 10793',
'STATE 5 c 10042 10795',
'STATE 1 m 10042 10796',
'STATE 1 a 10798 10797',
'STATE 4 t 10042 10799',
'STATE 4 t 10058 10042',
'STATE 2 h 10058 10800',
'STATE 2 s 10058 10801',
'STATE 1 l 10058 10802',
'STATE 5 e 10042 10373',
'STATE 5 n 10804 10803',
'STATE 5 o 10093 10805',
'STATE 1 y 10058 10806',
'STATE 2 n 10042 10029',
'STATE 4 e 10808 10807',
'STATE 1 m 10042 10809',
'STATE 4 a 10042 10810',
'STATE 2 c 10058 10811',
'STATE 2 s 10093 10058',
'STATE 1 l 10093 10042',
'STATE 5 o 10058 10093',
'STATE 4 n 10093 10812',
'STATE 4 e 10058 10813',
'STATE 4 n 10058 10093',
'STATE 2 v 10058 10814',
'STATE 4 b 10058 10815',
'STATE 3 g 10042 10816',
'STATE 5 # 10818 10817',
'STATE 2 n 10042 10819',
'STATE 4 t 10042 10058',
'STATE 5 e 10042 10820',
'STATE 1 s 10042 10821',
'STATE 2 o 10042 10822',
'STATE 1 y 10058 10823',
'STATE 1 u 10058 10824',
'STATE 4 e 10042 10825',
'STATE 5 r 10042 10826',
'STATE 1 s 10029 10042',
'STATE 1 j 10042 10827',
'STATE 4 e 10042 10828',
'STATE 2 r 10058 10829',
'STATE 2 t 10042 10830',
'STATE 4 c 10058 10831',
'STATE 1 a 10042 10124',
'STATE 1 e 10058 10042',
'STATE 1 a 10058 10832',
'STATE 5 l 10833 10042',
'STATE 1 a 10042 10058',
'STATE 5 i 10093 10594',
'STATE 1 n 10093 10834',
'STATE 4 o 10836 10835',
'STATE 5 o 10042 10837',
'STATE 2 v 10838 10058',
'STATE 4 e 10552 10058',
'STATE 2 w 10093 10058',
'STATE 1 s 10093 10839',
'STATE 1 m 10058 10840',
'STATE 5 d 10058 10841',
'STATE 2 s 10093 10741',
'STATE 2 e 10042 10842',
'STATE 4 o 10091 10843',
'STATE 1 g 10545 10042',
'STATE 1 e 10042 10844',
'STATE 5 # 10042 10845',
'STATE 2 l 10042 10846',
'STATE 2 i 10042 10668',
'STATE 1 e 10848 10847',
'STATE 1 g 10042 10849',
'STATE 4 y 10042 10850',
'STATE 1 m 10042 10851',
'STATE 4 i 10853 10852',
'STATE 1 w 10029 10042',
'STATE 4 i 10855 10854',
'STATE 2 v 10058 10856',
'STATE 2 n 10058 10857',
'STATE 1 n 10042 10058',
'STATE 1 e 10042 10858',
'STATE 5 e 10093 10859',
'STATE 4 y 10861 10860',
'STATE 2 t 10058 10862',
'STATE 5 d 10058 10863',
'STATE 1 o 10058 10864',
'STATE 1 p 10058 10042',
'STATE 2 m 10093 10865',
'STATE 2 t 10058 10866',
'STATE 1 a 10042 10867',
'STATE 5 s 10869 10868',
'STATE 2 r 10042 10870',
'STATE 5 s 10042 10871',
'STATE 1 t 10042 10872',
'STATE 2 h 10832 10873',
'STATE 2 r 10042 10658',
'STATE 1 a 10042 10874',
'STATE 4 a 10042 10875',
'STATE 2 e 10876 10042',
'STATE 1 t 10042 10877',
'STATE 1 m 10042 10878',
'STATE 5 t 10058 10879',
'STATE 5 a 10042 10880',
'STATE 5 h 10042 10881',
'STATE 2 t 10058 10294',
'STATE 2 m 10042 10058',
'STATE 1 r 10058 10635',
'STATE 2 u 10883 10882',
'STATE 1 e 10042 10058',
'STATE 5 u 10058 10884',
'STATE 5 r 10058 10885',
'STATE 5 g 10042 10058',
'STATE 4 d 10042 10886',
'STATE 5 c 10058 10366',
'STATE 2 s 10042 10887',
'STATE 4 e 10889 10888',
'STATE 4 i 10890 10042',
'STATE 2 u 10042 10891',
'STATE 5 l 10042 10892',
'STATE 2 p 10042 10893',
'STATE 1 n 10058 10894',
'STATE 1 i 10042 10895',
'STATE 4 m 10042 10896',
'STATE 4 # 10042 10897',
'STATE 1 n 10042 10898',
'STATE 5 e 10042 10029',
'STATE 5 u 10839 10899',
'STATE 5 o 10042 10900',
'STATE 2 m 10058 10901',
'STATE 2 y 10903 10902',
'STATE 1 e 10058 10904',
'STATE 1 e 10058 10905',
'STATE 1 n 10042 10906',
'STATE 2 v 10908 10907',
'STATE 2 o 10042 10909',
'STATE 4 a 10911 10910',
'STATE 1 q 10042 10912',
'STATE 2 t 10058 10913',
'STATE 1 a 10058 10914',
'STATE 2 w 10042 10915',
'STATE 2 h 10058 10916',
'STATE 2 i 10042 10917',
'STATE 2 c 10042 10918',
'STATE 4 h 10042 10919',
'STATE 1 v 10042 10920',
'STATE 1 p 10042 10921',
'STATE 2 f 10923 10922',
'STATE 1 c 10058 10924',
'STATE 5 s 10042 10925',
'STATE 1 a 10058 10926',
'STATE 4 l 10058 10042',
'STATE 4 s 10042 10927',
'STATE 2 p 10058 10928',
'STATE 1 o 10058 10929',
'STATE 4 v 10093 10930',
'STATE 4 t 10093 10931',
'STATE 4 i 10042 10932',
'STATE 4 i 10934 10933',
'STATE 1 i 10058 10935',
'STATE 2 p 10042 10936',
'STATE 1 c 10042 10937',
'STATE 1 i 10042 10938',
'STATE 4 k 10042 10939',
'STATE 1 n 10058 10042',
'STATE 2 r 10042 10940',
'STATE 1 n 10042 10941',
'STATE 1 # 10042 10093',
'STATE 4 o 10042 10942',
'STATE 4 a 10944 10943',
'STATE 4 f 10832 10042',
'STATE 1 m 10058 10945',
'STATE 5 s 10058 10946',
'STATE 2 f 10042 10567',
'STATE 4 m 10058 10947',
'STATE 5 a 10058 10042',
'STATE 1 i 10058 10121',
'STATE 1 e 10058 10948',
'STATE 1 s 10093 10949',
'STATE 4 g 10093 10950',
'STATE 2 t 10042 10412',
'STATE 1 l 10951 10042',
'STATE 2 t 10042 10952',
'STATE 5 c 10042 10953',
'STATE 1 e 10058 10954',
'STATE 2 l 10042 10058',
'STATE 1 c 10042 10955',
'STATE 4 l 10042 10956',
'STATE 2 b 10058 10957',
'STATE 2 d 10058 10958',
'STATE 4 y 10029 10959',
'STATE 5 # 10029 10960',
'STATE 1 s 10058 10961',
'STATE 4 c 10042 10962',
'STATE 1 g 10042 10963',
'STATE 2 p 10965 10964',
'STATE 1 f 10058 10121',
'STATE 1 c 10093 10966',
'STATE 4 s 10968 10967',
'STATE 2 m 10042 10294',
'STATE 2 h 10058 10969',
'STATE 5 m 10058 10042',
'STATE 1 c 10058 10970',
'STATE 1 u 10042 10971',
'STATE 5 d 10042 10972',
'STATE 2 n 10973 10058',
'STATE 1 h 10058 10974',
'STATE 1 d 10976 10975',
'STATE 4 e 10978 10977',
'STATE 1 h 10029 10042',
'STATE 1 n 10979 10042',
'STATE 1 t 10042 10980',
'STATE 5 r 10982 10981',
'STATE 4 s 10983 10058',
'STATE 4 n 10093 10984',
'STATE 4 b 10093 10058',
'STATE 1 n 10058 10093',
'STATE 5 e 10985 10042',
'STATE 5 l 10042 10986',
'STATE 2 t 10058 10987',
'STATE 5 a 10042 10988',
'STATE 1 i 10058 10042',
'STATE 1 k 10058 10989',
'STATE 5 t 10029 10042',
'STATE 4 e 10042 10029',
'STATE 1 h 10029 10990',
'STATE 1 h 10042 10991',
'STATE 5 s 10042 10992',
'STATE 2 i 10042 10993',
'STATE 2 w 10327 10994',
'STATE 1 n 10995 10058',
'STATE 5 t 10058 10996',
'STATE 1 e 10058 10744',
'STATE 2 n 10042 10997',
'STATE 5 k 10042 10937',
'STATE 1 o 10042 10998',
'STATE 2 h 10999 10042',
'STATE 2 b 10042 11000',
'STATE 1 m 10042 10029',
'STATE 5 l 10042 10029',
'STATE 4 m 10927 10058',
'STATE 1 h 10042 11001',
'STATE 1 c 11003 11002',
'STATE 2 g 10058 10093',
'STATE 1 m 10093 10777',
'STATE 2 u 10042 11004',
'STATE 2 d 10042 11005',
'STATE 4 e 10042 10058',
'STATE 2 m 10042 11006',
'STATE 5 n 10937 11007',
'STATE 2 t 10058 11008',
'STATE 2 k 10058 10093',
'STATE 2 i 10042 10937',
'STATE 2 i 10042 11009',
'STATE 1 e 10058 11010',
'STATE 1 i 10042 11011',
'STATE 2 b 10058 11012',
'STATE 1 l 10042 10058',
'STATE 2 v 10042 11013',
'STATE 2 t 10801 11014',
'STATE 5 a 11015 10058',
'STATE 1 o 10058 11016',
'STATE 5 c 10042 10058',
'STATE 4 s 11017 10058',
'STATE 2 i 10058 10042',
'STATE 1 i 10093 10058',
'INDEX 11018 s',
'STATE 4 # 11020 11019',
'STATE 4 h 11022 11021',
'STATE 3 t 11024 11023',
'STATE 4 s 11026 11025',
'STATE 3 t 11028 11027',
'STATE 3 s 11030 11029',
'PHONE s',
'STATE 5 h 11032 11031',
'STATE 3 e 11034 11033',
'STATE 1 # 11036 11035',
'PHONE epsilon',
'STATE 3 u 11038 11037',
'STATE 1 n 11024 11039',
'STATE 2 0 11041 11040',
'STATE 3 t 11028 11042',
'STATE 5 p 11044 11043',
'STATE 6 o 11028 11045',
'PHONE sh',
'STATE 3 i 11046 11035',
'STATE 3 i 11048 11047',
'STATE 2 a 11049 11024',
'STATE 2 e 11050 11024',
'STATE 4 t 11052 11051',
'STATE 4 z 11035 11053',
'STATE 4 c 11054 11024',
'STATE 1 0 11028 11055',
'STATE 3 i 11024 11028',
'STATE 2 n 11057 11056',
'STATE 6 n 11024 11035',
'STATE 2 t 11059 11058',
'STATE 2 a 11028 11060',
'STATE 1 h 11024 11061',
'STATE 1 i 11024 11062',
'STATE 3 s 11064 11063',
'STATE 6 w 11065 11024',
'STATE 4 j 11035 11066',
'STATE 6 o 11068 11067',
'STATE 1 # 11070 11069',
'STATE 2 m 11028 11071',
'STATE 1 # 11024 11028',
'STATE 3 k 11024 11072',
'STATE 3 e 11024 11073',
'STATE 2 o 11028 11074',
'PHONE z',
'STATE 1 l 11024 11075',
'STATE 4 k 11024 11076',
'STATE 5 o 11078 11077',
'STATE 1 # 11024 11079',
'STATE 4 r 11081 11080',
'STATE 6 i 11083 11082',
'STATE 2 0 11035 11024',
'STATE 5 o 11085 11084',
'STATE 2 f 11087 11086',
'STATE 1 0 11028 11088',
'STATE 3 p 11024 11089',
'STATE 3 h 11024 11090',
'STATE 2 e 11061 11091',
'STATE 1 u 11024 11092',
'STATE 6 n 11094 11093',
'STATE 4 u 11096 11095',
'STATE 6 n 11035 11024',
'STATE 2 r 11024 11061',
'STATE 6 a 11024 11097',
'STATE 5 i 11024 11035',
'STATE 3 z 11028 11098',
'STATE 1 0 11035 11024',
'STATE 6 a 11100 11099',
'STATE 1 s 11061 11101',
'STATE 5 t 11024 11102',
'STATE 3 o 11024 11103',
'STATE 2 f 11028 11104',
'STATE 3 c 11024 11105',
'STATE 1 i 11024 11106',
'STATE 2 u 11061 11107',
'STATE 1 t 11028 11024',
'STATE 4 z 11109 11108',
'STATE 4 i 11111 11110',
'STATE 2 e 11113 11112',
'STATE 5 r 11035 11114',
'STATE 5 r 11115 11024',
'STATE 1 # 11116 11035',
'STATE 6 o 11028 11117',
'STATE 3 u 11028 11118',
'STATE 3 u 11024 11119',
'STATE 2 b 11121 11120',
'STATE 3 a 11024 11028',
'STATE 2 i 11028 11122',
'STATE 2 k 11124 11123',
'STATE 1 n 11126 11125',
'STATE 1 o 11024 11127',
'STATE 4 m 11129 11128',
'STATE 6 o 11024 11035',
'STATE 4 z 11035 11130',
'STATE 5 o 11132 11131',
'STATE 5 a 11134 11133',
'STATE 1 m 11024 11135',
'STATE 2 i 11136 11024',
'STATE 4 u 11137 11024',
'STATE 6 a 11024 11138',
'STATE 1 w 11140 11139',
'STATE 5 m 11119 11028',
'STATE 2 l 11024 11028',
'STATE 2 g 11103 11141',
'STATE 3 u 11028 11142',
'STATE 1 p 11144 11143',
'STATE 3 f 11024 11145',
'STATE 3 e 11024 11146',
'STATE 1 o 11061 11147',
'STATE 3 a 11024 11061',
'STATE 2 c 11024 11148',
'STATE 4 e 11150 11149',
'STATE 5 # 11061 11151',
'STATE 4 c 11024 11152',
'STATE 5 g 11154 11153',
'STATE 3 n 11035 11155',
'STATE 6 v 11061 11156',
'STATE 4 i 11035 11157',
'STATE 1 # 11024 11158',
'STATE 1 # 11035 11024',
'STATE 6 e 11035 11024',
'STATE 6 e 11159 11035',
'STATE 3 i 11161 11160',
'STATE 5 # 11028 11024',
'STATE 2 d 11162 11028',
'STATE 3 i 11028 11163',
'STATE 1 # 11165 11164',
'STATE 5 u 11028 11166',
'STATE 3 a 11168 11167',
'STATE 1 i 11024 11061',
'STATE 1 t 11061 11169',
'STATE 1 i 11171 11170',
'STATE 4 u 11173 11172',
'STATE 3 r 11024 11174',
'STATE 5 s 11061 11175',
'STATE 4 p 11024 11176',
'PHONE zh',
'STATE 3 e 11061 11024',
'STATE 3 l 11035 11153',
'STATE 6 s 11178 11177',
'STATE 1 l 11028 11024',
'STATE 1 d 11024 11179',
'STATE 3 u 11035 11180',
'STATE 1 e 11028 11181',
'STATE 5 a 11182 11028',
'STATE 3 i 11028 11183',
'STATE 6 # 11024 11184',
'STATE 1 r 11186 11185',
'STATE 2 b 11028 11187',
'STATE 5 l 11028 11188',
'STATE 2 p 11190 11189',
'STATE 2 z 11061 11191',
'STATE 1 l 11061 11192',
'STATE 1 a 11024 11193',
'STATE 2 t 11024 11061',
'STATE 4 c 11195 11194',
'STATE 5 r 11197 11196',
'STATE 3 n 11199 11198',
'STATE 3 r 11024 11200',
'STATE 3 d 11061 11201',
'STATE 1 # 11024 11202',
'STATE 1 p 11061 11024',
'STATE 1 b 11024 11203',
'STATE 2 r 11024 11204',
'STATE 6 c 11028 11205',
'STATE 2 r 11024 11028',
'STATE 3 o 11028 11024',
'STATE 5 i 11028 11103',
'STATE 2 r 11207 11206',
'STATE 2 g 11028 11208',
'STATE 5 o 11024 11209',
'STATE 6 # 11028 11210',
'STATE 3 o 11212 11211',
'STATE 3 o 11061 11024',
'STATE 2 y 11024 11213',
'STATE 1 s 11061 11214',
'STATE 2 k 11061 11024',
'STATE 4 i 11216 11215',
'STATE 5 i 11218 11217',
'STATE 6 l 11153 11219',
'STATE 3 n 11221 11220',
'STATE 2 o 11223 11222',
'STATE 5 y 11061 11224',
'STATE 5 i 11226 11225',
'STATE 3 t 11024 11227',
'STATE 2 i 11024 11228',
'STATE 6 d 11028 11229',
'STATE 3 o 11024 11035',
'STATE 1 l 11028 11230',
'STATE 2 h 11028 11231',
'STATE 5 l 11028 11232',
'STATE 5 # 11233 11024',
'STATE 2 r 11028 11234',
'STATE 5 e 11024 11235',
'STATE 3 h 11237 11236',
'STATE 2 o 11061 11238',
'STATE 1 u 11061 11239',
'STATE 1 a 11061 11190',
'STATE 3 x 11028 11240',
'STATE 5 a 11242 11241',
'STATE 2 e 11243 11024',
'STATE 2 o 11035 11024',
'STATE 3 e 11244 11024',
'STATE 6 e 11153 11245',
'STATE 6 e 11035 11246',
'STATE 5 # 11248 11247',
'STATE 5 r 11250 11249',
'STATE 1 e 11061 11024',
'STATE 6 l 11061 11251',
'STATE 6 c 11061 11024',
'STATE 3 w 11061 11252',
'STATE 1 c 11024 11253',
'STATE 1 f 11024 11254',
'STATE 1 t 11028 11255',
'STATE 1 l 11024 11256',
'STATE 6 r 11028 11257',
'STATE 2 l 11028 11024',
'STATE 2 h 11024 11258',
'STATE 6 n 11260 11259',
'STATE 3 e 11261 11061',
'STATE 2 c 11024 11262',
'STATE 1 u 11264 11263',
'STATE 2 l 11266 11265',
'STATE 4 p 11268 11267',
'STATE 2 p 11270 11269',
'STATE 6 # 11272 11271',
'STATE 5 o 11024 11061',
'STATE 5 m 11061 11273',
'STATE 2 e 11153 11024',
'STATE 6 g 11024 11274',
'STATE 5 d 11276 11275',
'STATE 3 p 11024 11277',
'STATE 3 i 11061 11278',
'STATE 1 # 11061 11279',
'STATE 2 c 11061 11280',
'STATE 1 0 11282 11281',
'STATE 4 o 11284 11283',
'STATE 1 h 11028 11285',
'STATE 6 i 11287 11286',
'STATE 1 b 11028 11288',
'STATE 6 v 11028 11289',
'STATE 2 l 11291 11290',
'STATE 2 r 11140 11024',
'STATE 5 i 11024 11028',
'STATE 1 q 11024 11292',
'STATE 1 i 11061 11293',
'STATE 2 l 11061 11294',
'STATE 2 l 11024 11061',
'STATE 2 c 11024 11295',
'STATE 1 l 11061 11296',
'STATE 4 o 11298 11297',
'STATE 3 w 11061 11024',
'STATE 3 u 11300 11299',
'STATE 6 i 11061 11301',
'STATE 6 k 11024 11302',
'STATE 2 n 11153 11303',
'STATE 5 l 11061 11024',
'STATE 2 i 11035 11024',
'STATE 5 r 11305 11304',
'STATE 3 a 11024 11306',
'STATE 3 a 11308 11307',
'STATE 5 d 11061 11024',
'STATE 1 r 11061 11309',
'STATE 3 d 11061 11310',
'STATE 3 r 11024 11311',
'STATE 3 i 11028 11312',
'STATE 1 g 11314 11313',
'STATE 1 l 11028 11315',
'STATE 1 i 11024 11316',
'STATE 5 u 11028 11317',
'STATE 5 f 11024 11028',
'STATE 1 o 11028 11318',
'STATE 1 b 11028 11319',
'STATE 2 w 11024 11320',
'STATE 6 n 11028 11024',
'STATE 2 f 11024 11321',
'STATE 2 a 11061 11322',
'STATE 2 g 11061 11323',
'STATE 1 a 11061 11324',
'STATE 1 a 11061 11024',
'STATE 3 g 11326 11325',
'STATE 5 r 11328 11327',
'STATE 3 i 11330 11329',
'STATE 5 v 11024 11331',
'STATE 1 e 11061 11332',
'STATE 1 t 11061 11333',
'STATE 3 o 11024 11334',
'STATE 2 r 11336 11335',
'STATE 2 e 11338 11337',
'STATE 3 p 11024 11339',
'STATE 3 l 11024 11340',
'STATE 2 r 11061 11341',
'STATE 3 u 11024 11061',
'STATE 6 s 11061 11342',
'STATE 2 u 11024 11343',
'STATE 4 m 11061 11024',
'STATE 5 i 11345 11344',
'STATE 2 a 11028 11024',
'STATE 1 h 11024 11346',
'STATE 1 c 11348 11347',
'STATE 2 c 11028 11349',
'STATE 2 l 11028 11350',
'STATE 5 e 11352 11351',
'STATE 6 l 11028 11353',
'STATE 1 e 11264 11061',
'STATE 2 g 11061 11024',
'STATE 2 d 11061 11354',
'STATE 2 e 11356 11355',
'STATE 5 e 11358 11357',
'STATE 4 b 11061 11359',
'STATE 3 a 11361 11360',
'STATE 2 v 11061 11362',
'STATE 3 e 11364 11363',
'STATE 5 t 11061 11365',
'STATE 5 # 11024 11366',
'STATE 6 e 11061 11367',
'STATE 3 a 11024 11035',
'STATE 3 a 11153 11024',
'STATE 3 i 11369 11368',
'STATE 5 n 11371 11370',
'STATE 3 i 11061 11372',
'STATE 3 y 11061 11373',
'STATE 1 o 11024 11061',
'STATE 2 w 11061 11374',
'STATE 2 b 11024 11375',
'STATE 1 u 11024 11376',
'STATE 4 o 11024 11377',
'STATE 1 f 11379 11378',
'STATE 2 o 11028 11024',
'STATE 2 u 11140 11024',
'STATE 1 v 11024 11380',
'STATE 5 r 11381 11024',
'STATE 6 f 11028 11382',
'STATE 5 i 11028 11383',
'STATE 1 d 11024 11384',
'STATE 1 d 11028 11385',
'STATE 2 j 11024 11386',
'STATE 1 a 11388 11387',
'STATE 1 r 11390 11389',
'STATE 1 n 11024 11061',
'STATE 2 d 11392 11391',
'STATE 6 # 11394 11393',
'STATE 1 i 11061 11395',
'STATE 1 # 11397 11396',
'STATE 2 e 11398 11024',
'STATE 3 b 11061 11399',
'STATE 2 h 11401 11400',
'STATE 2 r 11403 11402',
'STATE 2 d 11024 11404',
'STATE 6 e 11061 11405',
'STATE 6 g 11061 11406',
'STATE 3 u 11408 11407',
'STATE 2 w 11061 11409',
'STATE 1 # 11411 11410',
'STATE 6 t 11061 11412',
'STATE 2 i 11024 11413',
'STATE 3 l 11024 11414',
'STATE 2 h 11061 11415',
'STATE 1 c 11024 11416',
'STATE 6 t 11418 11417',
'STATE 3 i 11024 11419',
'STATE 1 b 11421 11420',
'STATE 2 u 11024 11422',
'STATE 4 y 11024 11423',
'STATE 6 # 11024 11424',
'STATE 2 l 11426 11425',
'STATE 2 u 11028 11427',
'STATE 5 # 11028 11428',
'STATE 6 s 11024 11028',
'STATE 5 e 11028 11429',
'STATE 2 m 11061 11430',
'STATE 2 r 11061 11395',
'STATE 2 r 11432 11431',
'STATE 2 g 11024 11061',
'STATE 4 l 11434 11433',
'STATE 4 r 11435 11024',
'STATE 1 0 11437 11436',
'STATE 3 i 11028 11438',
'STATE 2 n 11061 11024',
'STATE 3 i 11178 11439',
'STATE 2 r 11441 11440',
'STATE 6 # 11442 11061',
'STATE 2 r 11061 11024',
'STATE 5 e 11024 11443',
'STATE 3 y 11061 11024',
'STATE 6 a 11061 11444',
'STATE 1 # 11061 11445',
'STATE 2 v 11061 11446',
'STATE 6 g 11448 11447',
'STATE 5 t 11061 11024',
'STATE 3 o 11450 11449',
'STATE 2 a 11061 11451',
'STATE 1 r 11061 11452',
'STATE 5 s 11453 11024',
'STATE 3 o 11061 11454',
'STATE 3 o 11061 11455',
'STATE 3 e 11061 11456',
'STATE 1 h 11061 11024',
'STATE 1 b 11061 11457',
'STATE 1 r 11024 11458',
'STATE 6 y 11024 11459',
'STATE 5 a 11024 11061',
'STATE 3 k 11024 11460',
'STATE 1 l 11462 11461',
'STATE 2 u 11024 11463',
'STATE 4 i 11024 11028',
'STATE 1 j 11465 11464',
'STATE 6 i 11028 11024',
'STATE 1 g 11028 11466',
'STATE 6 s 11028 11467',
'STATE 2 c 11028 11468',
'STATE 5 i 11028 11024',
'STATE 2 t 11024 11028',
'STATE 1 l 11024 11469',
'STATE 1 t 11061 11470',
'STATE 1 t 11061 11224',
'STATE 3 p 11024 11471',
'STATE 2 o 11024 11472',
'STATE 3 e 11028 11024',
'STATE 3 u 11024 11473',
'STATE 3 i 11028 11024',
'STATE 4 n 11028 11024',
'STATE 3 y 11474 11024',
'STATE 2 m 11061 11024',
'STATE 6 a 11061 11273',
'STATE 1 r 11024 11061',
'STATE 6 g 11190 11475',
'STATE 5 r 11061 11024',
'STATE 6 e 11061 11024',
'STATE 1 p 11061 11476',
'STATE 5 b 11061 11477',
'STATE 1 # 11024 11061',
'STATE 3 e 11479 11478',
'STATE 6 # 11481 11480',
'STATE 2 m 11061 11482',
'STATE 2 h 11061 11483',
'STATE 3 i 11061 11024',
'STATE 5 m 11061 11024',
'STATE 6 d 11024 11154',
'STATE 1 h 11061 11484',
'STATE 2 e 11486 11485',
'STATE 2 c 11024 11487',
'STATE 5 a 11489 11488',
'STATE 2 r 11491 11490',
'STATE 5 e 11024 11492',
'STATE 5 f 11024 11493',
'STATE 5 # 11028 11494',
'STATE 4 l 11496 11495',
'STATE 6 # 11028 11024',
'STATE 1 o 11028 11497',
'STATE 5 b 11028 11498',
'STATE 2 s 11028 11499',
'STATE 2 n 11501 11500',
'STATE 1 m 11061 11502',
'STATE 4 q 11024 11503',
'STATE 1 r 11061 11024',
'STATE 6 y 11505 11504',
'STATE 2 a 11061 11024',
'STATE 3 a 11507 11506',
'STATE 2 a 11061 11508',
'STATE 5 c 11061 11024',
'STATE 5 y 11510 11509',
'STATE 1 h 11061 11511',
'STATE 2 j 11024 11512',
'STATE 2 p 11061 11513',
'STATE 2 f 11061 11024',
'STATE 6 h 11061 11514',
'STATE 6 # 11516 11515',
'STATE 1 i 11024 11517',
'STATE 3 e 11442 11024',
'STATE 1 l 11024 11061',
'STATE 2 d 11024 11518',
'STATE 2 a 11024 11519',
'STATE 2 c 11024 11520',
'STATE 1 # 11061 11024',
'STATE 6 a 11024 11521',
'STATE 5 s 11024 11522',
'STATE 5 d 11024 11523',
'STATE 1 r 11525 11524',
'STATE 1 r 11024 11526',
'STATE 5 a 11028 11527',
'STATE 3 a 11528 11028',
'STATE 2 t 11028 11024',
'STATE 1 d 11079 11529',
'STATE 1 i 11061 11024',
'STATE 1 p 11024 11530',
'STATE 4 a 11532 11531',
'STATE 3 i 11024 11533',
'STATE 3 i 11061 11507',
'STATE 1 r 11474 11534',
'STATE 2 e 11061 11024',
'STATE 5 # 11024 11535',
'STATE 3 a 11536 11024',
'STATE 3 t 11024 11537',
'STATE 5 t 11024 11538',
'STATE 6 u 11024 11539',
'STATE 2 l 11061 11491',
'STATE 5 s 11061 11540',
'STATE 3 a 11024 11541',
'STATE 1 # 11061 11542',
'STATE 2 t 11024 11543',
'STATE 5 e 11154 11024',
'STATE 3 i 11061 11544',
'STATE 3 o 11024 11545',
'STATE 6 g 11024 11546',
'STATE 2 a 11547 11024',
'STATE 4 i 11024 11314',
'STATE 5 a 11024 11548',
'STATE 6 g 11028 11549',
'STATE 6 r 11028 11024',
'STATE 2 a 11028 11550',
'STATE 1 c 11028 11551',
'STATE 1 n 11024 11552',
'STATE 1 e 11061 11553',
'STATE 3 t 11024 11554',
'STATE 3 r 11024 11555',
'STATE 2 e 11557 11556',
'STATE 2 r 11491 11024',
'STATE 2 o 11061 11558',
'STATE 2 e 11273 11024',
'STATE 1 # 11024 11559',
'STATE 1 g 11024 11560',
'STATE 1 # 11273 11024',
'STATE 6 # 11024 11561',
'STATE 6 s 11061 11024',
'STATE 2 r 11061 11562',
'STATE 2 c 11564 11563',
'STATE 6 r 11024 11061',
'STATE 1 k 11061 11565',
'STATE 1 o 11024 11566',
'STATE 5 c 11028 11024',
'STATE 4 o 11028 11567',
'STATE 4 m 11028 11568',
'STATE 2 t 11028 11569',
'STATE 5 # 11028 11570',
'STATE 2 h 11024 11061',
'STATE 1 i 11061 11571',
'STATE 3 i 11573 11572',
'STATE 5 n 11575 11574',
'STATE 3 d 11061 11576',
'STATE 1 r 11024 11577',
'STATE 2 u 11061 11578',
'STATE 3 l 11024 11061',
'STATE 2 h 11024 11579',
'STATE 1 w 11024 11580',
'STATE 1 s 11024 11581',
'STATE 1 e 11583 11582',
'STATE 3 u 11061 11024',
'STATE 1 l 11061 11584',
'STATE 1 w 11024 11585',
'STATE 5 n 11024 11586',
'STATE 5 r 11024 11587',
'STATE 6 m 11028 11588',
'STATE 1 g 11024 11028',
'STATE 2 d 11061 11589',
'STATE 3 w 11061 11590',
'STATE 4 r 11061 11024',
'STATE 2 v 11061 11591',
'STATE 2 e 11061 11592',
'STATE 3 a 11024 11593',
'STATE 4 b 11061 11594',
'STATE 6 e 11024 11595',
'STATE 6 s 11061 11596',
'STATE 2 e 11597 11024',
'STATE 3 u 11024 11474',
'STATE 1 a 11154 11598',
'STATE 2 r 11061 11453',
'STATE 1 i 11061 11599',
'STATE 6 l 11600 11024',
'STATE 5 s 11024 11601',
'STATE 6 t 11024 11602',
'STATE 1 r 11604 11603',
'STATE 2 s 11024 11061',
'STATE 5 s 11024 11605',
'STATE 5 l 11607 11606',
'STATE 6 # 11061 11541',
'STATE 1 c 11024 11608',
'STATE 1 n 11061 11609',
'STATE 2 r 11061 11610',
'STATE 5 n 11611 11024',
'STATE 5 n 11061 11024',
'STATE 3 i 11061 11612',
'STATE 2 l 11061 11613',
'STATE 4 a 11028 11024',
'STATE 1 n 11615 11614',
'STATE 5 v 11024 11616',
'STATE 6 e 11028 11617',
'STATE 2 e 11028 11182',
'STATE 3 k 11024 11618',
'STATE 3 a 11024 11619',
'STATE 6 e 11024 11620',
'STATE 6 l 11622 11621',
'STATE 3 n 11024 11061',
'STATE 1 # 11024 11623',
'STATE 6 # 11061 11024',
'STATE 1 r 11625 11624',
'STATE 3 a 11312 11626',
'STATE 6 # 11628 11627',
'STATE 5 e 11024 11028',
'STATE 5 # 11024 11629',
'STATE 6 s 11028 11630',
'STATE 3 a 11507 11631',
'STATE 2 e 11024 11632',
'STATE 3 o 11061 11633',
'STATE 4 f 11024 11634',
'STATE 4 n 11024 11061',
'STATE 2 e 11024 11339',
'STATE 2 p 11061 11635',
'STATE 2 i 11061 11024',
'STATE 2 t 11024 11636',
'STATE 6 r 11024 11637',
'STATE 5 d 11024 11028',
'STATE 4 e 11638 11028',
'STATE 2 m 11028 11639',
'STATE 4 f 11024 11640',
'STATE 6 l 11061 11641',
'STATE 1 # 11024 11609',
'STATE 2 o 11024 11642',
'STATE 1 # 11061 11643',
'STATE 4 b 11061 11644',
'STATE 4 e 11024 11645',
'STATE 5 s 11028 11646',
'STATE 6 d 11028 11647',
'STATE 4 n 11024 11648',
'STATE 6 c 11190 11649',
'STATE 2 c 11024 11650',
'STATE 1 l 11061 11651',
'STATE 2 i 11061 11652',
'STATE 1 s 11024 11653',
'STATE 5 d 11028 11024',
'STATE 6 # 11028 11654',
'STATE 2 l 11061 11655',
'STATE 6 i 11564 11656',
'STATE 4 w 11024 11657',
'STATE 2 i 11024 11061',
'STATE 1 h 11024 11658',
'STATE 1 l 11024 11028',
'STATE 1 a 11028 11659',
'STATE 1 f 11024 11660',
'STATE 5 b 11448 11661',
'STATE 1 g 11024 11662',
'STATE 2 e 11024 11663',
'STATE 1 b 11028 11664',
'STATE 1 c 11061 11665',
'STATE 6 e 11024 11666',
'STATE 4 l 11024 11667',
'STATE 4 m 11024 11564',
'STATE 1 m 11028 11668',
'STATE 3 u 11024 11669',
'STATE 2 a 11671 11670',
'STATE 6 r 11672 11061',
'STATE 1 s 11028 11673',
'STATE 3 o 11675 11674',
'STATE 6 s 11024 11676',
'STATE 5 # 11024 11472',
'STATE 2 a 11024 11677',
'STATE 3 a 11140 11028',
'STATE 4 d 11679 11678',
'STATE 5 # 11061 11024',
'STATE 3 u 11680 11534',
'STATE 1 # 11024 11681',
'STATE 3 e 11395 11682',
'STATE 1 d 11061 11683',
'STATE 6 # 11024 11684',
'STATE 3 n 11061 11024',
'STATE 1 h 11024 11685',
'STATE 2 u 11061 11686',
'STATE 5 # 11024 11061',
'STATE 5 r 11061 11687',
'STATE 2 a 11024 11061',
'STATE 3 m 11061 11688',
'STATE 3 r 11024 11689',
'STATE 6 c 11061 11690',
'STATE 2 u 11024 11691',
'STATE 4 v 11061 11692',
'STATE 6 r 11693 11474',
'STATE 2 e 11061 11694',
'STATE 4 b 11061 11686',
'INDEX 11695 t',
'STATE 4 h 11697 11696',
'STATE 5 o 11699 11698',
'STATE 5 e 11701 11700',
'STATE 4 t 11703 11702',
'STATE 4 i 11705 11704',
'STATE 5 # 11707 11706',
'STATE 6 r 11709 11708',
'STATE 4 c 11711 11710',
'STATE 3 e 11713 11712',
'STATE 4 t 11715 11714',
'STATE 3 s 11717 11716',
'STATE 3 s 11719 11718',
'PHONE th',
'STATE 6 # 11721 11720',
'STATE 3 # 11707 11722',
'STATE 4 u 11724 11723',
'STATE 5 h 11726 11725',
'STATE 5 s 11728 11727',
'STATE 5 s 11726 11729',
'STATE 4 u 11731 11730',
'STATE 3 e 11726 11732',
'STATE 3 n 11734 11733',
'PHONE ch',
'STATE 5 o 11736 11735',
'STATE 6 a 11707 11725',
'STATE 6 a 11738 11737',
'STATE 3 n 11707 11739',
'STATE 3 a 11739 11721',
'STATE 3 t 11741 11740',
'STATE 3 # 11725 11742',
'PHONE t',
'PHONE epsilon',
'STATE 6 d 11726 11743',
'STATE 6 # 11745 11744',
'STATE 5 l 11746 11726',
'STATE 3 t 11748 11747',
'STATE 6 u 11717 11725',
'STATE 6 m 11726 11749',
'STATE 6 n 11734 11750',
'PHONE sh',
'STATE 6 # 11752 11751',
'STATE 6 r 11707 11753',
'STATE 6 d 11755 11754',
'STATE 3 # 11707 11756',
'PHONE dh',
'STATE 5 a 11758 11757',
'STATE 4 s 11726 11759',
'STATE 5 r 11761 11760',
'STATE 5 r 11726 11762',
'STATE 3 i 11725 11726',
'STATE 3 o 11725 11763',
'STATE 6 e 11726 11725',
'STATE 4 a 11764 11725',
'STATE 4 r 11725 11765',
'STATE 6 # 11767 11766',
'STATE 6 u 11734 11768',
'STATE 5 a 11770 11769',
'STATE 3 r 11772 11771',
'STATE 3 l 11725 11773',
'STATE 6 i 11707 11774',
'STATE 3 a 11739 11707',
'STATE 3 r 11707 11725',
'STATE 6 h 11776 11775',
'STATE 4 i 11778 11777',
'STATE 6 0 11725 11779',
'STATE 5 a 11717 11780',
'STATE 6 e 11717 11781',
'STATE 6 s 11726 11782',
'STATE 3 a 11726 11725',
'PHONE d',
'STATE 4 o 11725 11726',
'STATE 3 o 11784 11783',
'STATE 3 o 11725 11726',
'STATE 3 a 11734 11725',
'STATE 6 n 11786 11785',
'STATE 6 i 11725 11707',
'STATE 5 y 11707 11787',
'STATE 5 y 11739 11707',
'STATE 3 o 11725 11788',
'STATE 6 y 11739 11789',
'STATE 4 l 11791 11790',
'STATE 4 s 11726 11725',
'STATE 4 g 11793 11792',
'STATE 3 s 11795 11794',
'STATE 5 d 11725 11796',
'STATE 6 a 11798 11797',
'STATE 6 a 11717 11799',
'STATE 6 n 11726 11800',
'STATE 3 u 11725 11801',
'STATE 6 n 11726 11725',
'STATE 6 l 11803 11802',
'STATE 3 r 11739 11755',
'STATE 5 s 11707 11804',
'STATE 6 d 11707 11805',
'STATE 6 s 11807 11806',
'STATE 5 h 11809 11808',
'STATE 3 s 11810 11725',
'STATE 4 r 11725 11811',
'STATE 3 r 11726 11725',
'STATE 3 n 11813 11812',
'STATE 6 # 11725 11717',
'STATE 4 r 11725 11814',
'STATE 5 e 11717 11815',
'STATE 5 l 11717 11816',
'STATE 6 i 11817 11725',
'STATE 5 # 11726 11818',
'STATE 6 n 11725 11819',
'STATE 3 y 11821 11820',
'STATE 5 i 11725 11707',
'STATE 3 n 11707 11822',
'STATE 6 l 11707 11823',
'STATE 3 # 11707 11824',
'STATE 3 o 11739 11755',
'STATE 4 # 11725 11825',
'STATE 4 s 11826 11725',
'STATE 5 e 11726 11725',
'STATE 3 # 11827 11725',
'STATE 3 # 11725 11734',
'STATE 6 l 11717 11828',
'STATE 5 a 11725 11829',
'STATE 3 s 11725 11830',
'STATE 3 r 11717 11725',
'STATE 3 n 11725 11717',
'STATE 6 a 11726 11831',
'STATE 3 a 11832 11726',
'STATE 6 s 11833 11707',
'STATE 5 m 11739 11707',
'STATE 5 a 11707 11739',
'STATE 6 n 11707 11834',
'STATE 3 o 11835 11707',
'STATE 5 n 11837 11836',
'STATE 6 a 11717 11838',
'STATE 4 e 11725 11839',
'STATE 6 t 11734 11840',
'STATE 6 t 11725 11841',
'STATE 6 # 11725 11842',
'STATE 3 a 11844 11843',
'STATE 6 o 11726 11725',
'STATE 3 # 11739 11707',
'STATE 6 g 11707 11845',
'STATE 6 n 11739 11707',
'STATE 6 n 11847 11846',
'STATE 4 e 11848 11725',
'STATE 6 o 11725 11717',
'STATE 4 o 11725 11849',
'STATE 6 # 11734 11725',
'STATE 4 o 11851 11850',
'STATE 3 i 11725 11852',
'STATE 6 # 11726 11853',
'STATE 5 n 11725 11854',
'STATE 3 # 11707 11855',
'STATE 3 d 11857 11856',
'STATE 4 i 11858 11725',
'STATE 3 s 11860 11859',
'STATE 4 w 11725 11861',
'STATE 5 s 11725 11862',
'STATE 5 m 11725 11863',
'STATE 6 e 11864 11725',
'STATE 5 k 11726 11865',
'STATE 5 y 11726 11866',
'STATE 6 u 11725 11867',
'STATE 5 u 11868 11725',
'STATE 4 k 11726 11725',
'STATE 5 e 11768 11725',
'STATE 3 f 11726 11725',
'STATE 6 i 11726 11746',
'STATE 4 s 11725 11726',
'STATE 5 n 11725 11869',
'STATE 5 n 11870 11726',
'STATE 3 r 11717 11871',
'STATE 6 i 11726 11872',
'STATE 6 t 11725 11726',
'STATE 3 a 11707 11873',
'STATE 4 e 11874 11725',
'STATE 5 w 11726 11875',
'STATE 6 # 11726 11725',
'STATE 3 a 11717 11725',
'STATE 3 r 11725 11876',
'STATE 3 r 11707 11877',
'STATE 6 r 11878 11725',
'STATE 5 g 11725 11879',
'STATE 6 k 11725 11880',
'STATE 3 e 11707 11725',
'STATE 3 s 11717 11725',
'STATE 6 k 11725 11881',
'STATE 3 u 11883 11882',
'STATE 5 m 11725 11884',
'STATE 6 g 11726 11885',
'STATE 6 e 11726 11810',
'STATE 6 f 11725 11886',
'STATE 5 i 11746 11887',
'STATE 6 n 11725 11888',
'STATE 6 m 11726 11889',
'STATE 6 d 11726 11890',
'STATE 5 a 11744 11891',
'STATE 6 o 11726 11892',
'STATE 5 l 11767 11893',
'STATE 6 e 11895 11894',
'STATE 5 e 11896 11726',
'STATE 6 l 11898 11897',
'STATE 5 r 11726 11725',
'STATE 6 r 11726 11899',
'STATE 6 y 11726 11900',
'STATE 4 e 11726 11725',
'STATE 6 l 11726 11725',
'STATE 4 n 11725 11901',
'STATE 6 a 11898 11902',
'STATE 4 l 11904 11903',
'STATE 6 b 11726 11905',
'STATE 6 s 11726 11725',
'STATE 5 l 11907 11906',
'STATE 6 s 11909 11908',
'STATE 6 # 11910 11904',
'STATE 4 k 11725 11911',
'STATE 4 e 11725 11726',
'STATE 4 a 11725 11726',
'STATE 6 i 11725 11912',
'STATE 6 m 11725 11913',
'STATE 6 # 11725 11914',
'STATE 4 i 11725 11915',
'STATE 6 r 11726 11725',
'INDEX 11916 u',
'STATE 4 r 11918 11917',
'STATE 3 a 11920 11919',
'STATE 5 y 11922 11921',
'STATE 3 o 11924 11923',
'PHONE epsilon',
'STATE 5 i 11926 11925',
'STATE 3 b 11927 11920',
'STATE 3 q 11929 11928',
'STATE 4 p 11931 11930',
'STATE 5 o 11933 11932',
'STATE 3 # 11935 11934',
'PHONE eh1',
'STATE 5 # 11937 11936',
'STATE 4 e 11939 11938',
'STATE 4 i 11941 11940',
'STATE 5 l 11943 11942',
'STATE 5 a 11945 11944',
'STATE 3 e 11947 11946',
'STATE 3 p 11949 11948',
'STATE 6 n 11951 11950',
'STATE 5 e 11953 11952',
'STATE 4 e 11955 11954',
'STATE 5 a 11957 11956',
'STATE 5 # 11920 11958',
'STATE 4 s 11960 11959',
'STATE 5 s 11961 11957',
'PHONE uw1',
'PHONE ah1',
'STATE 5 e 11963 11962',
'STATE 6 # 11965 11964',
'STATE 3 a 11920 11966',
'STATE 6 p 11949 11967',
'STATE 3 c 11949 11968',
'PHONE y-uh1',
'PHONE y-er',
'PHONE y-er1',
'STATE 5 i 11970 11969',
'STATE 4 s 11972 11971',
'STATE 4 a 11974 11973',
'STATE 3 g 11920 11975',
'STATE 6 # 11977 11976',
'PHONE w',
'STATE 6 # 11979 11978',
'STATE 4 n 11981 11980',
'STATE 5 s 11942 11982',
'PHONE uw',
'STATE 5 r 11984 11983',
'STATE 3 t 11920 11985',
'STATE 3 t 11920 11986',
'PHONE uh1',
'STATE 6 # 11965 11987',
'STATE 6 l 11989 11988',
'STATE 3 f 11949 11990',
'STATE 5 a 11992 11991',
'STATE 3 # 11994 11993',
'STATE 3 # 11996 11995',
'STATE 6 s 11998 11997',
'STATE 4 s 12000 11999',
'STATE 3 g 11957 12001',
'STATE 3 r 11942 12002',
'STATE 4 a 11957 12003',
'STATE 5 l 11957 12004',
'STATE 5 t 11920 12005',
'STATE 5 z 11957 11920',
'STATE 4 t 12007 12006',
'STATE 5 g 12009 12008',
'STATE 5 # 11920 12010',
'STATE 5 u 12011 11920',
'STATE 3 d 12012 11920',
'STATE 3 s 12014 12013',
'STATE 3 c 12016 12015',
'STATE 6 n 11942 11920',
'STATE 6 s 11965 12017',
'PHONE uh',
'STATE 3 b 11927 12018',
'STATE 4 e 12020 12019',
'STATE 4 l 12022 12021',
'STATE 3 m 12024 12023',
'STATE 6 n 11943 12025',
'STATE 3 r 12027 12026',
'STATE 4 n 12029 12028',
'STATE 3 e 12031 12030',
'STATE 3 r 12000 12032',
'STATE 4 m 12000 12033',
'PHONE ah',
'STATE 3 h 11961 11942',
'STATE 3 s 11961 12034',
'STATE 4 i 11957 12035',
'STATE 5 d 11957 12036',
'STATE 5 u 11920 12037',
'STATE 5 h 12039 12038',
'STATE 6 e 12041 12040',
'STATE 6 r 11943 11920',
'STATE 6 e 11920 11943',
'STATE 5 t 12042 11920',
'STATE 3 a 11920 11965',
'PHONE ao1',
'STATE 3 a 11920 12043',
'STATE 6 # 11920 12044',
'STATE 3 g 11950 12045',
'STATE 6 t 11949 11950',
'PHONE y-uw1',
'STATE 3 g 11949 12046',
'STATE 4 a 12048 12047',
'STATE 3 g 11920 12049',
'STATE 3 # 12051 12050',
'STATE 6 t 12053 12052',
'STATE 3 c 12055 12054',
'STATE 4 n 12057 12056',
'STATE 6 m 11943 12058',
'STATE 3 s 12060 12059',
'STATE 4 m 12062 12061',
'STATE 4 t 12017 12000',
'STATE 6 a 12000 12063',
'STATE 3 m 12017 12064',
'STATE 6 r 11920 12017',
'STATE 3 b 11943 12000',
'STATE 3 f 12000 12065',
'STATE 3 d 11942 12066',
'STATE 4 o 11957 11942',
'STATE 5 t 11957 12067',
'STATE 5 r 11920 12068',
'STATE 5 l 12070 12069',
'STATE 4 g 11920 12071',
'STATE 5 e 12073 12072',
'STATE 5 h 11943 11920',
'STATE 6 # 11920 12074',
'STATE 3 g 11950 12075',
'STATE 6 r 11965 12076',
'STATE 3 o 11920 12077',
'STATE 3 m 11949 12078',
'STATE 4 i 12080 12079',
'STATE 3 g 12082 12081',
'STATE 3 r 12084 12083',
'STATE 6 # 11942 12085',
'STATE 4 n 12086 12017',
'STATE 6 r 12088 12087',
'STATE 3 t 12000 12089',
'STATE 3 b 12091 12090',
'STATE 4 s 12093 12092',
'STATE 6 o 11942 12017',
'STATE 6 c 12017 12094',
'STATE 4 n 12017 12095',
'STATE 3 l 12097 12096',
'STATE 4 l 12000 11942',
'STATE 6 t 11961 12098',
'STATE 6 n 12000 11942',
'STATE 6 x 11943 12099',
'STATE 3 f 12017 12100',
'STATE 3 e 12102 12101',
'STATE 3 n 12104 12103',
'STATE 5 n 11957 12105',
'STATE 6 y 11920 11957',
'STATE 4 x 11942 12106',
'STATE 4 b 11943 12107',
'STATE 6 a 11943 12108',
'STATE 5 a 11961 11920',
'STATE 6 d 11920 12109',
'STATE 6 i 11942 11920',
'STATE 3 o 11920 12110',
'STATE 6 s 11920 12111',
'STATE 3 m 11920 12112',
'STATE 3 d 11965 12113',
'STATE 3 # 12115 12114',
'STATE 3 g 12117 12116',
'STATE 5 t 12119 12118',
'STATE 5 r 11920 12120',
'STATE 6 # 12122 12121',
'STATE 5 n 11965 11942',
'STATE 6 t 12124 12123',
'STATE 6 b 12017 12125',
'STATE 3 t 11942 12126',
'STATE 3 c 12128 12127',
'STATE 3 s 12000 12129',
'STATE 3 l 11942 12130',
'STATE 4 s 12132 12131',
'STATE 6 e 12128 12133',
'STATE 6 n 12017 11942',
'STATE 6 z 12128 12134',
'STATE 4 t 12017 11961',
'STATE 3 t 12136 12135',
'STATE 6 n 12137 11942',
'STATE 6 l 11942 12138',
'STATE 6 m 11943 12000',
'STATE 3 b 12017 12139',
'STATE 4 i 11942 12140',
'STATE 4 x 11920 12141',
'STATE 3 l 11942 12142',
'PHONE y-uw',
'STATE 4 i 11957 11920',
'STATE 4 e 12144 12143',
'STATE 4 e 11961 11920',
'STATE 6 e 11920 12145',
'STATE 6 r 11920 11942',
'STATE 3 b 12147 12146',
'STATE 6 d 11965 11920',
'STATE 3 # 11949 12148',
'STATE 3 k 11920 12149',
'STATE 5 o 12151 12150',
'STATE 4 n 12153 12152',
'STATE 3 b 11920 12154',
'STATE 6 h 11957 12155',
'STATE 5 l 12157 12156',
'STATE 3 t 11961 12158',
'STATE 6 a 11957 12159',
'STATE 3 l 12161 12160',
'STATE 3 s 11942 12162',
'STATE 3 h 12164 12163',
'STATE 4 t 12166 12165',
'STATE 6 n 11943 12167',
'STATE 3 c 12128 12168',
'STATE 3 g 12128 12169',
'PHONE y-ah',
'STATE 3 d 12000 12128',
'STATE 3 p 12171 12170',
'STATE 6 o 12017 12172',
'PHONE ih1',
'STATE 6 v 12128 12173',
'STATE 6 s 12128 12017',
'STATE 3 d 12175 12174',
'STATE 4 d 11942 12176',
'STATE 4 m 11943 11942',
'STATE 6 n 12177 11942',
'STATE 3 # 12017 12178',
'STATE 4 y 11920 12179',
'STATE 4 p 11943 11961',
'STATE 3 c 12104 12017',
'STATE 5 t 11920 12180',
'STATE 6 t 11961 11942',
'STATE 6 i 11920 12181',
'STATE 3 c 12183 12182',
'STATE 6 a 11949 11927',
'STATE 6 s 11965 12184',
'STATE 3 a 11920 12185',
'STATE 4 # 12187 12186',
'STATE 6 # 12189 12188',
'STATE 4 p 12191 12190',
'STATE 5 d 12193 12192',
'STATE 3 c 12195 12194',
'STATE 5 t 11920 12196',
'STATE 3 t 12198 12197',
'STATE 3 n 12104 12199',
'STATE 3 d 12201 12200',
'STATE 5 n 11957 12202',
'STATE 3 b 12204 12203',
'STATE 5 n 11961 12205',
'STATE 3 n 12207 12206',
'STATE 3 s 12209 12208',
'STATE 4 m 12017 11942',
'STATE 3 c 12128 12210',
'STATE 3 p 12128 12104',
'STATE 6 l 12000 11943',
'STATE 3 m 12128 12211',
'STATE 3 p 12128 12000',
'STATE 3 f 12213 12212',
'STATE 6 s 11943 12017',
'STATE 4 t 12104 12093',
'STATE 6 n 12128 12017',
'STATE 3 e 12215 12214',
'STATE 4 l 11961 11942',
'STATE 4 t 11942 12216',
'STATE 4 d 11942 12217',
'STATE 3 c 12017 12218',
'STATE 4 z 11961 12219',
'STATE 4 # 11942 12220',
'STATE 6 # 11920 11943',
'STATE 3 p 11949 12221',
'STATE 6 # 11950 11949',
'STATE 3 a 11920 12222',
'STATE 3 o 11920 12223',
'STATE 4 o 12225 12224',
'STATE 3 c 12104 12226',
'STATE 6 u 12228 12227',
'STATE 3 c 12017 11942',
'STATE 5 u 12017 12229',
'STATE 5 h 12000 12230',
'STATE 5 o 11943 12231',
'STATE 6 o 12000 12232',
'STATE 5 n 12234 12233',
'STATE 5 s 11957 11920',
'STATE 6 g 11920 12235',
'STATE 3 n 11942 12236',
'STATE 6 y 11961 12237',
'STATE 3 d 11961 12238',
'STATE 3 l 12104 12239',
'PHONE ah-w',
'STATE 6 # 11920 11957',
'STATE 3 m 12241 12240',
'STATE 5 n 11957 12017',
'STATE 6 e 11965 11942',
'STATE 3 l 12243 12242',
'STATE 5 l 11989 12104',
'STATE 3 g 12245 12244',
'STATE 6 r 11965 12246',
'STATE 4 m 11942 12247',
'STATE 6 # 11942 12248',
'STATE 3 h 12250 12249',
'STATE 4 j 11942 12017',
'STATE 4 y 11920 12251',
'STATE 4 g 12104 12252',
'STATE 4 n 12253 11942',
'STATE 4 b 11942 12000',
'STATE 6 n 11942 12254',
'STATE 4 l 12000 12255',
'STATE 4 v 12257 12256',
'STATE 3 # 11951 12258',
'STATE 6 l 11920 12259',
'STATE 3 e 11920 12260',
'STATE 3 e 12262 12261',
'STATE 5 u 12264 12263',
'STATE 3 e 11942 12265',
'STATE 3 c 12267 12266',
'STATE 4 l 12128 11943',
'STATE 4 h 12269 12268',
'STATE 5 d 12000 12270',
'STATE 6 o 12272 12271',
'STATE 6 e 11943 12273',
'STATE 3 m 11942 12274',
'STATE 3 r 11942 12275',
'STATE 6 d 11920 12276',
'STATE 5 n 12278 12277',
'STATE 6 i 11961 11942',
'STATE 3 t 12280 12279',
'STATE 3 n 12104 12128',
'STATE 3 f 12282 12281',
'STATE 5 l 12104 12017',
'STATE 3 d 11942 12283',
'STATE 5 d 12104 11942',
'STATE 3 n 12285 12284',
'STATE 6 n 11920 12000',
'STATE 6 n 11961 11942',
'STATE 3 d 12000 12286',
'STATE 3 d 12000 11942',
'STATE 3 k 12288 12287',
'STATE 4 m 12104 12289',
'STATE 6 n 12291 12290',
'STATE 6 r 12293 12292',
'STATE 6 # 11942 12000',
'STATE 3 r 11942 12294',
'STATE 4 h 11961 12295',
'STATE 5 a 12297 12296',
'STATE 5 i 11961 11942',
'STATE 6 k 11965 12298',
'STATE 6 n 12300 12299',
'STATE 6 n 12302 12301',
'STATE 5 u 12304 12303',
'STATE 4 p 11943 12305',
'STATE 5 r 11920 12306',
'STATE 3 n 12104 12307',
'STATE 3 g 11961 12308',
'STATE 3 b 12310 12309',
'STATE 4 t 12128 11942',
'STATE 4 m 11943 12311',
'STATE 6 i 11965 11942',
'STATE 5 p 11943 12312',
'STATE 5 u 12000 12313',
'STATE 5 c 11943 12000',
'STATE 6 i 11943 12000',
'STATE 3 s 11942 12314',
'STATE 6 g 11942 12128',
'STATE 6 e 11920 12315',
'STATE 3 s 11957 12316',
'STATE 3 h 11957 12317',
'STATE 3 s 12201 12318',
'STATE 6 i 12201 11961',
'STATE 5 r 12320 12319',
'STATE 5 l 12017 11957',
'STATE 5 r 11920 12321',
'STATE 3 c 12173 12322',
'STATE 4 f 12128 11942',
'STATE 4 g 12000 12323',
'STATE 3 g 11961 12324',
'STATE 6 c 12017 12325',
'STATE 6 a 11942 12326',
'STATE 3 n 12328 12327',
'STATE 4 m 12128 12329',
'STATE 6 # 11943 12330',
'STATE 4 v 11942 12331',
'STATE 6 # 12017 11942',
'STATE 4 k 12000 12332',
'STATE 4 a 11961 12333',
'STATE 4 g 11942 12334',
'STATE 3 l 11965 12335',
'STATE 3 d 11965 11920',
'STATE 3 d 11920 12336',
'STATE 6 z 11920 12337',
'STATE 3 t 11920 12338',
'STATE 3 s 12340 12339',
'STATE 3 c 12342 12341',
'STATE 5 r 11942 12343',
'STATE 6 # 11920 12344',
'STATE 3 c 12104 12345',
'STATE 3 n 11961 12346',
'STATE 3 m 12104 12347',
'STATE 4 t 12128 12017',
'STATE 5 t 11943 12348',
'STATE 6 i 11943 12349',
'STATE 5 w 12000 12350',
'STATE 6 # 12352 12351',
'STATE 5 l 11920 12353',
'STATE 5 d 11957 12354',
'STATE 3 j 11957 11961',
'STATE 3 x 12201 11961',
'STATE 6 a 11957 12355',
'STATE 3 e 11920 12356',
'STATE 3 c 12017 12357',
'STATE 4 t 12359 12358',
'STATE 3 t 12000 12360',
'STATE 6 e 12362 12361',
'STATE 4 l 12104 12062',
'STATE 4 l 12017 11942',
'STATE 3 j 11942 12363',
'STATE 4 t 12000 11942',
'STATE 4 l 12128 12364',
'STATE 6 n 11920 11942',
'STATE 4 t 11942 12365',
'STATE 3 n 11943 12366',
'STATE 6 u 11920 12367',
'STATE 6 # 11942 12175',
'STATE 6 t 11920 12368',
'STATE 3 s 11965 12017',
'STATE 3 j 11965 12369',
'STATE 3 s 11965 11920',
'STATE 4 l 12371 12370',
'STATE 5 r 12373 12372',
'STATE 4 t 12375 12374',
'STATE 4 m 12017 12128',
'STATE 6 a 12104 12376',
'STATE 5 y 11920 12377',
'STATE 3 t 12000 11961',
'STATE 3 l 11961 12378',
'STATE 4 b 12380 12379',
'STATE 5 o 12104 12381',
'STATE 6 a 11943 12382',
'STATE 6 a 12000 12383',
'STATE 5 d 11961 12384',
'STATE 3 r 11942 11961',
'STATE 6 t 11957 12385',
'STATE 5 r 11957 11942',
'STATE 3 k 11965 12386',
'STATE 3 h 11920 11965',
'STATE 5 l 11942 12017',
'STATE 6 m 11942 12387',
'STATE 3 r 11942 12388',
'STATE 4 n 11961 11942',
'STATE 3 e 12390 12389',
'STATE 4 l 11942 12391',
'STATE 3 h 12393 12392',
'STATE 3 j 11942 12017',
'STATE 4 b 11920 11942',
'STATE 4 g 11943 12394',
'STATE 6 r 11920 12395',
'STATE 3 j 11920 12396',
'STATE 6 s 11920 12397',
'STATE 5 h 12399 12398',
'STATE 3 f 12401 12400',
'STATE 4 b 12403 12402',
'STATE 6 e 11961 12404',
'STATE 6 # 11942 12405',
'STATE 3 m 12017 12406',
'STATE 6 c 11920 12407',
'STATE 3 b 11957 12408',
'STATE 3 r 11961 12409',
'STATE 4 d 11942 12410',
'STATE 3 s 12000 12411',
'STATE 4 z 11961 11943',
'STATE 5 t 11943 12412',
'STATE 5 f 12000 12413',
'STATE 3 h 11920 12414',
'STATE 6 i 11920 12415',
'STATE 3 h 12417 12416',
'STATE 3 e 12419 12418',
'STATE 3 l 11961 12420',
'STATE 3 n 11942 12421',
'STATE 6 c 12017 11942',
'STATE 3 r 11942 11943',
'STATE 4 t 12423 12422',
'STATE 4 l 11942 12424',
'STATE 4 p 12426 12425',
'STATE 6 t 11961 12427',
'STATE 3 e 11920 12428',
'STATE 3 t 11965 12429',
'STATE 6 # 12431 12430',
'STATE 4 s 12433 12432',
'STATE 3 b 12435 12434',
'STATE 6 y 12000 12436',
'STATE 5 p 12438 12437',
'STATE 6 c 12000 12439',
'STATE 6 a 11942 11943',
'STATE 4 k 11961 12440',
'STATE 6 r 12017 11942',
'STATE 6 i 11942 12441',
'STATE 5 m 11957 12442',
'STATE 3 k 11942 12443',
'STATE 3 h 12164 12444',
'STATE 3 d 12000 11943',
'STATE 6 r 12000 12445',
'STATE 5 l 12000 12446',
'STATE 3 d 11961 11942',
'STATE 6 n 11920 12447',
'STATE 3 # 11965 12448',
'STATE 5 t 11942 12449',
'STATE 6 s 12451 12450',
'STATE 6 l 12017 11942',
'STATE 3 b 12128 12452',
'STATE 6 o 11942 12453',
'STATE 3 m 12455 12454',
'STATE 3 b 12104 12017',
'STATE 4 t 11942 12456',
'STATE 3 m 12000 12457',
'STATE 3 r 12000 12458',
'STATE 5 i 12460 12459',
'STATE 3 n 11950 12461',
'STATE 6 a 11965 12462',
'STATE 4 y 11920 12463',
'STATE 5 y 12465 12464',
'STATE 4 t 12467 12466',
'STATE 3 b 11965 12468',
'STATE 3 p 12470 12469',
'STATE 5 l 11965 12471',
'STATE 5 n 12000 12472',
'STATE 5 c 12474 12473',
'STATE 4 m 11943 12475',
'STATE 6 l 11943 12476',
'STATE 6 l 11942 12477',
'STATE 6 # 12478 11920',
'STATE 6 o 11957 12479',
'STATE 3 m 11942 11961',
'STATE 3 e 12481 12480',
'STATE 6 e 12000 11943',
'STATE 5 h 12000 12482',
'STATE 6 o 11920 12483',
'STATE 6 d 11942 12484',
'STATE 5 l 11942 11965',
'STATE 3 k 11961 12485',
'STATE 3 l 11942 12486',
'STATE 3 p 12128 12017',
'STATE 6 # 11942 12487',
'STATE 4 p 11942 12488',
'STATE 4 n 12489 12017',
'STATE 6 # 12017 12164',
'STATE 3 b 12000 12490',
'STATE 3 d 11943 12491',
'STATE 5 f 11920 12492',
'STATE 6 n 12494 12493',
'STATE 6 # 11965 12495',
'STATE 3 l 11965 11920',
'STATE 5 c 12497 12496',
'STATE 5 d 12499 12498',
'STATE 4 d 11942 12500',
'STATE 4 g 12502 12501',
'STATE 6 # 12504 12503',
'STATE 3 p 11965 12505',
'STATE 5 l 12507 12506',
'STATE 5 l 11965 12508',
'STATE 6 a 12000 11943',
'STATE 5 f 11989 12509',
'STATE 4 g 12000 12510',
'STATE 6 e 12000 12511',
'STATE 6 h 11943 12512',
'STATE 6 a 11943 12513',
'STATE 6 s 11942 12514',
'STATE 5 z 11920 11942',
'STATE 5 n 11961 11942',
'STATE 6 w 12000 12515',
'STATE 6 g 12017 11920',
'STATE 5 v 12000 12516',
'STATE 5 n 11920 12517',
'STATE 3 c 11957 12518',
'STATE 3 f 11961 12519',
'STATE 4 d 11943 11942',
'STATE 4 c 11942 12520',
'STATE 3 z 11942 12521',
'STATE 6 # 12017 12104',
'STATE 3 r 12523 12522',
'STATE 3 s 12000 12524',
'STATE 5 # 12526 12525',
'STATE 4 l 11942 11920',
'STATE 4 l 11961 11920',
'STATE 3 d 11965 11949',
'STATE 5 l 12528 12527',
'STATE 4 c 12530 12529',
'STATE 5 r 11920 12531',
'STATE 4 n 12532 11943',
'STATE 3 l 11942 12533',
'STATE 6 i 11942 12534',
'STATE 6 e 12017 11943',
'STATE 3 r 12535 11943',
'STATE 3 m 11961 12536',
'STATE 3 c 11965 11943',
'STATE 5 y 11942 12537',
'STATE 6 o 11942 11943',
'STATE 6 o 11965 12538',
'STATE 6 i 11965 12539',
'STATE 6 a 12541 12540',
'STATE 4 c 12000 11943',
'STATE 4 s 12000 12542',
'STATE 5 m 12000 12543',
'STATE 6 e 12545 12544',
'STATE 3 d 11961 12546',
'STATE 5 t 12000 12547',
'STATE 6 a 11920 11957',
'STATE 3 t 11961 12548',
'STATE 3 b 11961 12549',
'STATE 6 g 11943 12550',
'STATE 6 l 11942 12551',
'STATE 3 p 11943 12552',
'STATE 4 n 11943 12553',
'STATE 3 h 12000 11943',
'STATE 6 a 11942 12554',
'STATE 4 d 11920 11942',
'STATE 5 r 12556 12555',
'STATE 4 h 11942 12557',
'STATE 3 b 12558 11943',
'STATE 6 i 12560 12559',
'STATE 3 i 12000 12561',
'STATE 3 f 11943 12562',
'STATE 4 b 11942 12128',
'STATE 3 b 12564 12563',
'STATE 6 e 11943 11942',
'STATE 3 l 11942 12565',
'STATE 3 h 11943 12566',
'STATE 6 i 11943 12567',
'STATE 6 o 11965 12568',
'STATE 5 h 11943 12569',
'STATE 4 s 12000 12570',
'STATE 6 o 12000 12571',
'STATE 6 o 12000 12572',
'STATE 4 s 12017 12573',
'STATE 4 g 12017 12000',
'STATE 6 t 11961 12574',
'STATE 5 b 12575 12000',
'STATE 3 d 11942 12576',
'STATE 3 m 11961 12577',
'STATE 4 m 12579 12578',
'STATE 6 r 12017 12580',
'STATE 3 h 11943 12581',
'STATE 4 t 12000 11943',
'STATE 5 e 12493 12582',
'STATE 4 z 12584 12583',
'STATE 4 h 11965 12585',
'STATE 4 c 11942 12586',
'STATE 4 n 11943 12587',
'STATE 6 o 11942 11961',
'STATE 3 b 11961 11942',
'STATE 3 p 12589 12588',
'STATE 3 l 12000 12590',
'STATE 3 d 11943 12591',
'STATE 6 a 12104 11943',
'STATE 3 r 11961 11942',
'STATE 5 f 12593 12592',
'STATE 5 t 12000 11943',
'STATE 5 l 11965 12594',
'STATE 4 f 12596 12595',
'STATE 4 m 12000 11943',
'STATE 6 r 12000 12167',
'STATE 5 v 12000 12597',
'STATE 6 a 11942 12598',
'STATE 3 r 11942 12599',
'STATE 6 e 11943 12000',
'STATE 5 l 11961 12600',
'STATE 4 k 11961 12601',
'STATE 3 s 11961 12602',
'STATE 6 n 11942 11961',
'STATE 4 l 12604 12603',
'STATE 3 c 11943 12605',
'STATE 4 l 11920 12606',
'STATE 4 s 12608 12607',
'STATE 6 l 11943 12609',
'STATE 3 n 11961 12610',
'STATE 4 p 12612 12611',
'STATE 4 s 11943 11965',
'STATE 5 l 11943 12613',
'STATE 5 s 11965 11943',
'STATE 3 m 12000 11943',
'STATE 3 r 11943 12614',
'STATE 6 a 12567 12615',
'STATE 3 g 11943 12000',
'STATE 6 # 11965 11943',
'STATE 5 d 11943 12616',
'STATE 6 i 12000 11943',
'STATE 5 l 12000 12617',
'STATE 4 b 12000 12618',
'STATE 4 s 12000 12619',
'STATE 3 s 11957 12620',
'STATE 4 n 12622 12621',
'STATE 6 l 12624 12623',
'STATE 6 # 12017 12625',
'STATE 3 c 12017 12626',
'STATE 3 l 12628 12627',
'STATE 6 e 11942 11920',
'STATE 4 h 12630 12629',
'STATE 5 s 12632 12631',
'STATE 6 e 12634 12633',
'STATE 3 l 11942 12635',
'STATE 4 g 12637 12636',
'STATE 3 d 11942 12391',
'STATE 5 z 12524 12638',
'STATE 3 h 11943 12639',
'STATE 6 # 11943 12640',
'STATE 5 s 12642 12641',
'STATE 6 r 12000 12643',
'STATE 3 d 12000 12644',
'STATE 6 n 12646 12645',
'STATE 3 p 11957 11942',
'STATE 4 s 11961 12647',
'STATE 3 d 11943 11942',
'STATE 4 l 12649 12648',
'STATE 4 b 11942 12017',
'STATE 4 g 12017 12650',
'STATE 3 b 12017 12104',
'STATE 3 g 12652 12651',
'STATE 4 b 11943 12000',
'STATE 6 o 11943 12653',
'STATE 6 e 11942 11943',
'STATE 5 t 12654 11943',
'STATE 3 r 12507 11943',
'STATE 5 z 12655 11943',
'STATE 3 b 11943 11961',
'STATE 6 i 11943 12656',
'STATE 6 e 12658 12657',
'STATE 3 g 11961 11943',
'STATE 5 m 11943 12659',
'STATE 6 # 12000 11943',
'STATE 6 y 12000 12660',
'STATE 4 l 12661 11943',
'STATE 4 s 11943 12652',
'STATE 5 t 11943 12662',
'STATE 6 r 12000 11943',
'STATE 4 l 12000 12663',
'STATE 3 l 11961 11942',
'STATE 4 v 11961 12664',
'STATE 3 j 11942 12665',
'STATE 3 j 11942 12666',
'STATE 6 s 12017 12667',
'STATE 3 t 11943 12000',
'STATE 4 n 11943 12000',
'STATE 3 c 12669 12668',
'STATE 6 r 12671 12670',
'STATE 6 i 11942 12507',
'STATE 3 d 12628 11943',
'STATE 6 a 12672 11943',
'STATE 4 b 11942 11943',
'STATE 4 m 12674 12673',
'STATE 5 c 11943 12675',
'STATE 6 o 12000 11943',
'STATE 5 j 12000 12676',
'STATE 6 s 11942 12677',
'STATE 6 y 11961 12678',
'STATE 4 s 11942 12679',
'STATE 3 d 11942 12680',
'STATE 4 n 12017 12681',
'STATE 3 p 11943 12682',
'STATE 4 m 12683 11943',
'STATE 6 a 12684 11943',
'STATE 3 l 12000 11943',
'STATE 4 n 11943 11942',
'STATE 4 t 12686 12685',
'STATE 5 p 11943 12687',
'STATE 5 t 11943 12688',
'STATE 5 s 12596 11943',
'STATE 3 l 11942 12360',
'STATE 3 r 12690 12689',
'STATE 3 d 11942 12691',
'STATE 3 t 11961 11942',
'STATE 6 d 12017 11942',
'STATE 5 z 12693 12692',
'STATE 5 s 12000 12694',
'STATE 3 g 11943 12695',
'STATE 3 j 11943 12696',
'STATE 5 s 11943 12697',
'STATE 5 b 11943 12000',
'STATE 3 c 11943 12698',
'STATE 3 t 11942 12699',
'STATE 6 l 11961 11942',
'STATE 4 d 11942 12700',
'STATE 3 i 12000 12701',
'STATE 6 i 12702 11943',
'STATE 5 v 12000 11943',
'STATE 3 b 11943 12703',
'STATE 5 n 11943 12704',
'STATE 3 c 12000 11943',
'STATE 3 v 11943 12705',
'STATE 6 r 12707 12706',
'STATE 6 s 11942 12708',
'STATE 4 k 12000 12709',
'STATE 4 d 11943 12710',
'STATE 3 m 11943 12000',
'STATE 3 b 11943 12711',
'STATE 3 g 11943 12712',
'STATE 4 d 11942 12713',
'STATE 3 l 11942 11961',
'STATE 6 c 11942 12714',
'STATE 3 l 12716 12715',
'STATE 3 n 11961 11943',
'STATE 3 g 11943 12717',
'STATE 5 g 11943 12718',
'STATE 6 l 11942 12719',
'STATE 3 t 11942 12720',
'STATE 4 m 11943 12721',
'STATE 5 n 12000 12722',
'STATE 4 g 11943 12723',
'STATE 5 s 11943 12724',
'STATE 4 b 11942 12725',
'STATE 4 b 11942 12726',
'STATE 3 r 11943 12727',
'STATE 6 a 12729 12728',
'STATE 3 d 11943 12730',
'STATE 5 k 11943 12731',
'STATE 3 d 12000 12246',
'STATE 6 n 11942 12732',
'STATE 6 a 12734 12733',
'STATE 5 w 11943 12735',
'STATE 4 n 12000 11943',
'STATE 5 g 12737 12736',
'STATE 6 o 11943 12703',
'STATE 6 a 11942 11961',
'STATE 6 s 12590 11943',
'STATE 5 t 11943 12738',
'STATE 5 t 12739 11943',
'STATE 3 f 11943 12740',
'STATE 3 t 12000 11943',
'STATE 3 n 12000 11943',
'STATE 4 t 11943 12445',
'STATE 4 p 12741 11943',
'STATE 5 p 11943 12742',
'STATE 3 r 12000 11943',
'INDEX 12743 v',
'STATE 4 v 12745 12744',
'PHONE v',
'PHONE epsilon',
'INDEX 12746 w',
'STATE 3 o 12748 12747',
'STATE 3 e 12750 12749',
'STATE 5 k 12752 12751',
'STATE 3 a 12754 12753',
'STATE 5 k 12756 12755',
'STATE 6 z 12758 12757',
'STATE 6 i 12756 12759',
'STATE 4 r 12759 12760',
'STATE 4 a 12762 12761',
'STATE 6 z 12764 12763',
'PHONE f',
'STATE 4 a 12766 12765',
'STATE 5 c 12764 12767',
'PHONE epsilon',
'STATE 5 o 12769 12768',
'STATE 5 k 12756 12770',
'STATE 5 l 12759 12767',
'STATE 4 o 12762 12771',
'PHONE v',
'STATE 6 l 12773 12772',
'STATE 5 y 12767 12774',
'PHONE w',
'STATE 3 u 12776 12775',
'STATE 4 h 12777 12767',
'STATE 4 o 12767 12778',
'STATE 4 a 12780 12779',
'STATE 4 o 12767 12759',
'STATE 5 l 12767 12759',
'STATE 1 c 12767 12759',
'STATE 5 r 12782 12781',
'STATE 1 # 12767 12783',
'STATE 6 l 12759 12784',
'STATE 4 h 12767 12785',
'STATE 4 i 12787 12786',
'STATE 5 y 12767 12788',
'STATE 4 e 12767 12789',
'STATE 3 s 12790 12767',
'STATE 4 e 12767 12759',
'STATE 6 o 12767 12759',
'STATE 4 i 12792 12791',
'STATE 4 e 12794 12793',
'STATE 6 d 12767 12795',
'STATE 1 # 12759 12796',
'STATE 5 s 12798 12797',
'STATE 6 t 12767 12799',
'STATE 4 e 12801 12800',
'STATE 6 g 12759 12802',
'STATE 4 h 12802 12759',
'STATE 6 l 12802 12803',
'STATE 6 e 12767 12804',
'STATE 6 e 12767 12805',
'STATE 3 i 12806 12767',
'STATE 6 i 12764 12767',
'STATE 1 a 12759 12807',
'STATE 5 o 12808 12759',
'STATE 1 # 12809 12759',
'STATE 1 # 12759 12767',
'STATE 5 d 12759 12810',
'STATE 1 e 12767 12811',
'STATE 6 k 12767 12812',
'STATE 1 s 12764 12767',
'STATE 6 d 12759 12767',
'STATE 1 # 12813 12759',
'STATE 6 # 12759 12764',
'STATE 5 l 12759 12814',
'STATE 5 s 12759 12815',
'STATE 6 # 12759 12816',
'STATE 6 n 12759 12764',
'STATE 5 r 12759 12817',
'STATE 5 n 12759 12818',
'STATE 1 s 12759 12819',
'STATE 5 s 12759 12820',
'STATE 6 t 12759 12821',
'STATE 5 r 12767 12773',
'STATE 5 y 12759 12822',
'STATE 6 # 12759 12767',
'STATE 6 t 12759 12823',
'STATE 5 n 12759 12824',
'STATE 5 # 12759 12767',
'INDEX 12825 x',
'STATE 3 u 12827 12826',
'STATE 2 0 12829 12828',
'STATE 4 # 12831 12830',
'STATE 3 e 12832 12830',
'PHONE z',
'PHONE k-s',
'STATE 2 l 12830 12833',
'STATE 4 a 12835 12834',
'PHONE epsilon',
'STATE 4 u 12837 12836',
'STATE 2 # 12839 12838',
'STATE 4 h 12839 12840',
'STATE 2 s 12841 12839',
'STATE 2 l 12839 12830',
'PHONE g-z',
'STATE 4 e 12843 12842',
'PHONE k-sh',
'STATE 4 i 12845 12844',
'STATE 2 # 12839 12830',
'STATE 4 o 12839 12830',
'STATE 2 l 12830 12846',
'STATE 2 m 12830 12843',
'INDEX 12847 y',
'STATE 4 # 12849 12848',
'STATE 2 0 12851 12850',
'STATE 3 a 12853 12852',
'STATE 3 a 12855 12854',
'STATE 5 a 12857 12856',
'STATE 3 o 12853 12858',
'PHONE epsilon',
'STATE 3 o 12860 12859',
'STATE 4 a 12862 12861',
'PHONE y',
'STATE 4 e 12856 12863',
'STATE 3 f 12865 12864',
'STATE 3 e 12867 12866',
'STATE 4 o 12869 12868',
'STATE 4 u 12853 12870',
'STATE 5 m 12856 12871',
'PHONE iy',
'STATE 3 e 12873 12872',
'STATE 2 i 12875 12874',
'STATE 1 0 12877 12876',
'STATE 4 e 12879 12878',
'STATE 5 m 12856 12853',
'STATE 2 t 12856 12853',
'STATE 4 o 12853 12880',
'STATE 2 b 12853 12881',
'STATE 3 u 12875 12882',
'STATE 2 l 12863 12883',
'STATE 2 f 12863 12875',
'PHONE ay1',
'STATE 4 a 12885 12884',
'STATE 3 s 12887 12886',
'STATE 1 # 12853 12888',
'STATE 2 m 12890 12889',
'STATE 5 v 12875 12853',
'STATE 2 r 12853 12891',
'STATE 2 f 12892 12863',
'STATE 2 n 12863 12893',
'STATE 1 # 12895 12894',
'STATE 1 # 12897 12896',
'STATE 5 e 12875 12898',
'STATE 5 o 12900 12899',
'STATE 2 n 12863 12901',
'STATE 5 r 12903 12902',
'STATE 1 # 12875 12904',
'STATE 2 k 12875 12905',
'STATE 3 l 12875 12863',
'STATE 2 s 12863 12906',
'STATE 5 e 12908 12907',
'STATE 2 a 12910 12909',
'STATE 3 i 12912 12911',
'STATE 3 i 12856 12875',
'STATE 4 o 12914 12913',
'STATE 4 r 12916 12915',
'STATE 4 n 12917 12916',
'STATE 5 # 12863 12918',
'STATE 5 d 12853 12875',
'STATE 2 b 12875 12853',
'PHONE ay',
'STATE 5 n 12853 12919',
'STATE 2 v 12920 12863',
'STATE 4 n 12922 12921',
'STATE 3 r 12863 12923',
'STATE 2 o 12925 12924',
'STATE 3 n 12863 12916',
'STATE 5 n 12926 12856',
'STATE 5 # 12853 12856',
'STATE 4 u 12856 12927',
'STATE 3 k 12856 12928',
'STATE 5 e 12875 12916',
'PHONE ih1',
'PHONE ah',
'STATE 2 l 12863 12853',
'STATE 2 p 12853 12875',
'STATE 1 a 12863 12929',
'STATE 5 n 12931 12930',
'STATE 5 a 12904 12932',
'STATE 1 p 12934 12933',
'STATE 2 e 12936 12935',
'STATE 4 m 12916 12917',
'STATE 2 e 12856 12937',
'STATE 4 a 12939 12938',
'STATE 5 n 12875 12940',
'STATE 1 o 12863 12941',
'STATE 4 k 12943 12942',
'STATE 4 i 12944 12937',
'STATE 2 a 12946 12945',
'STATE 2 g 12916 12947',
'STATE 4 m 12917 12863',
'STATE 3 s 12875 12948',
'STATE 3 g 12917 12916',
'STATE 3 n 12856 12863',
'STATE 4 e 12875 12949',
'STATE 5 n 12904 12875',
'STATE 3 m 12875 12856',
'STATE 1 l 12863 12853',
'STATE 4 l 12951 12950',
'STATE 5 # 12952 12916',
'STATE 3 f 12875 12953',
'STATE 2 e 12917 12954',
'STATE 3 r 12952 12916',
'STATE 4 l 12956 12955',
'STATE 5 e 12875 12957',
'STATE 4 r 12959 12958',
'STATE 4 e 12961 12960',
'STATE 5 # 12917 12962',
'PHONE ih',
'STATE 3 l 12964 12963',
'STATE 5 s 12916 12965',
'STATE 3 d 12875 12966',
'STATE 2 s 12875 12917',
'STATE 4 e 12875 12967',
'STATE 3 h 12969 12968',
'STATE 5 o 12875 12970',
'STATE 4 o 12972 12971',
'STATE 3 u 12853 12973',
'STATE 3 r 12975 12974',
'STATE 2 r 12863 12976',
'STATE 2 l 12863 12875',
'STATE 1 r 12917 12977',
'STATE 4 n 12875 12978',
'STATE 3 k 12875 12979',
'STATE 4 n 12981 12980',
'STATE 5 n 12916 12982',
'STATE 5 a 12875 12983',
'STATE 4 u 12856 12984',
'STATE 5 # 12856 12863',
'STATE 5 # 12875 12985',
'STATE 2 a 12917 12986',
'STATE 1 m 12917 12863',
'STATE 3 r 12875 12863',
'STATE 5 i 12916 12987',
'STATE 4 p 12875 12988',
'STATE 4 o 12990 12989',
'STATE 5 o 12992 12991',
'STATE 3 d 12875 12916',
'STATE 5 t 12916 12875',
'STATE 3 l 12916 12993',
'STATE 4 r 12995 12994',
'STATE 3 m 12863 12996',
'STATE 3 b 12916 12917',
'STATE 3 w 12916 12997',
'STATE 1 e 12999 12998',
'STATE 3 u 12875 13000',
'STATE 3 r 12875 12853',
'STATE 3 c 13002 13001',
'STATE 4 c 12904 12875',
'STATE 3 m 12853 13003',
'STATE 5 t 13005 13004',
'STATE 2 o 12863 12853',
'STATE 3 l 13006 12856',
'STATE 3 s 12916 13007',
'STATE 2 a 12875 13008',
'STATE 2 n 12875 12863',
'STATE 4 n 12916 13009',
'STATE 5 a 13011 13010',
'STATE 4 c 12875 13012',
'STATE 5 i 12875 12916',
'STATE 4 c 13014 13013',
'STATE 3 l 12917 12916',
'STATE 5 a 12856 12863',
'STATE 2 r 12916 13015',
'STATE 1 c 12863 13016',
'STATE 5 n 12875 13017',
'STATE 3 m 12916 13018',
'STATE 3 l 12875 13019',
'STATE 4 p 12875 12916',
'STATE 4 i 12972 13020',
'STATE 3 c 13022 13021',
'STATE 1 e 12917 12916',
'STATE 3 l 12863 13023',
'STATE 4 l 12875 13024',
'STATE 4 m 12916 13025',
'STATE 3 b 12875 13026',
'STATE 3 l 13028 13027',
'STATE 3 z 12916 13029',
'STATE 2 i 12952 12875',
'STATE 2 o 12875 13030',
'STATE 5 o 12875 13031',
'STATE 3 r 12916 13032',
'STATE 4 l 12916 13033',
'STATE 3 z 13035 13034',
'STATE 2 l 13037 13036',
'STATE 2 o 13038 12916',
'STATE 4 r 12875 13039',
'STATE 2 f 12875 13040',
'STATE 4 i 12875 13041',
'STATE 4 b 12916 12875',
'STATE 4 d 13043 13042',
'STATE 4 b 12917 12875',
'STATE 4 t 13045 13044',
'STATE 4 s 12917 12863',
'STATE 1 p 12952 12863',
'STATE 3 h 12875 12904',
'STATE 2 s 13047 13046',
'STATE 5 u 12916 13048',
'STATE 1 o 12916 13049',
'STATE 3 h 12875 12863',
'STATE 5 i 12917 13050',
'STATE 2 a 12916 12917',
'STATE 2 p 12916 13051',
'STATE 3 z 12916 12875',
'STATE 3 z 12916 13052',
'STATE 1 r 12916 13053',
'STATE 1 p 13054 12916',
'STATE 4 p 12916 13055',
'STATE 5 h 12875 13056',
'STATE 4 p 12916 13057',
'STATE 4 g 12916 13058',
'STATE 5 h 12916 13059',
'STATE 3 d 12916 13060',
'STATE 3 s 12917 13061',
'STATE 5 a 12917 12863',
'STATE 3 h 12875 13062',
'STATE 5 s 12916 13063',
'STATE 3 n 13064 12863',
'STATE 2 c 12916 13065',
'STATE 3 b 12875 13066',
'STATE 2 o 12917 12863',
'STATE 3 r 12916 12875',
'STATE 4 d 12916 13067',
'STATE 5 i 12875 13068',
'STATE 3 l 12875 13069',
'STATE 3 w 12875 12916',
'INDEX 13070 z',
'STATE 3 t 13072 13071',
'STATE 4 z 13074 13073',
'STATE 4 # 13076 13075',
'STATE 3 c 13074 13077',
'PHONE epsilon',
'STATE 4 e 13079 13078',
'PHONE s',
'STATE 3 s 13074 13080',
'STATE 4 s 13074 13081',
'PHONE z',
'STATE 3 z 13083 13082',
'STATE 4 i 13079 13084',
'STATE 3 d 13086 13085',
'STATE 4 l 13079 13087',
'STATE 4 o 13079 13076',
'STATE 4 s 13074 13088',
'STATE 4 i 13074 13089',
'STATE 4 # 13079 13090',
'STATE 4 h 13092 13091',
'STATE 4 e 13079 13074',
'STATE 4 y 13079 13093',
'STATE 3 r 13079 13094',
'STATE 3 # 13095 13079',
'STATE 4 o 13079 13096',
'STATE 4 # 13079 13097',
'PHONE zh',
'STATE 4 e 13079 13098',
'STATE 3 l 13099 13079',
'PHONE t-s',
'STATE 4 b 13098 13079'
];


/*jshint -W069 */

RiTa.lexicon = RiLexicon(); // create the lexicon

// add RiLexicon member functions to RiTa object
var funs = okeys(RiTa.lexicon);
for (var i = 0; i < funs.length; i++) {
  if (!startsWith(funs[i], '_')) {
    var f = RiTa.lexicon[funs[i]];
    is(f,F) && (RiTa[funs[i]] = f.bind(RiTa.lexicon));
  }
}

if (window) { // for browser

  window['RiTa'] = RiTa;
  window['RiString'] = RiString;
  window['RiGrammar'] = RiGrammar;
  window['RiMarkov'] = RiMarkov;
  window['RiWordNet'] = RiWordNet;
  window['RiLexicon'] = RiLexicon;
  window['RiTaEvent'] = RiTaEvent;

  var rlfuns = okeys();

} else if (typeof module !== 'undefined') { // for node

  module.exports['RiTa'] = RiTa;
  module.exports['RiString'] = RiString;
  module.exports['RiGrammar'] = RiGrammar;
  module.exports['RiMarkov'] = RiMarkov;
  module.exports['RiWordNet'] = RiWordNet;
  module.exports['RiLexicon'] = RiLexicon;
  module.exports['RiTaEvent'] = RiTaEvent;

  // add RiTa.* functions directly to exported object
  var funs = okeys(RiTa);
  for (var i = 0; i < funs.length; i++) {
    if (!startsWith(funs[i], '_')) {
      module.exports[funs[i]] = RiTa[funs[i]];
    }
  }
}

/*jshint +W069 */

})(typeof window !== 'undefined' ? window : null);

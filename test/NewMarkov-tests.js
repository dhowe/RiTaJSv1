
var sample = "One reason people lie is to achieve personal power. Achieving personal power is helpful for one who pretends to be more confident than he really is. For example, one of my friends threw a party at his house last month. He asked me to come to his party and bring a date. However, I did not have a girlfriend. One of my other friends, who had a date to go to the party with, asked me about my date. I did not want to be embarrassed, so I claimed that I had a lot of work to do. I said I could easily find a date even better than his if I wanted to. I also told him that his date was ugly. I achieved power to help me feel confident; however, I embarrassed my friend and his date. Although this lie helped me at the time, since then it has made me look down on myself.";

var sample2 = "One reason people lie is to achieve personal power. Achieving personal power is helpful for one who pretends to be more confident than he really is. For example, one of my nodesfriends threw a party at his house last month. He asked me to " + "come to his party and bring a date. However, I did not have a " + "girlfriend. One of my other friends, who had a date to go to the " + "party with, asked me about my date. I did not want to be embarrassed, " + "so I claimed that I had a lot of work to do. I said I could easily find" + " a date even better than his if I wanted to. I also told him that his " + "date was ugly. I achieved power to help me feel confident; however, I " + "embarrassed my friend and his date. Although this lie helped me at the " + "time, since then it has made me look down on myself. After all, I did " + "occasionally want to be embarrassed.";

var sample3 = "One reason people lie is to achieve personal' power. Achieving personal power' is helpful for one who pretends to be more confident' than he really is. For example, one of my " + "friends' threw a party at his house last month. He asked me to " + "come to his party and bring a date. However, I did not have a " + "girlfriend. One of my other friends, who had a date to go to the " + "party with, asked me about my date. I did not want to be embarrassed, " + "so I claimed that I had a lot of work to do. I said I could easily find" + " a date even better than his' if I wanted to. I also told him that his " + "date was ugly. I achieved power to help me feel confident; however, I " + "embarrassed my friend and his date. Although this lie helped me at the " + "time, since then it has made me look down on myself. After all, I did " + "occasionally want to be embarrassed.";

var sample4 = "One reason people lie is to achieve personal power. One reason people run is to achieve flight. Achieving personal power is helpful for one who pretends to be more confident than he really is. For example, one of my friends threw a party at his house last month. He asked me to come to his party and bring a date. However, I did not have a girlfriend. One of my other friends, who had a date to go to the party with, asked me about my date. I did not want to be embarrassed, so I claimed that I had a lot of work to do. I said I could easily find a date even better than his if I wanted to. I also told him that his date was ugly. I achieved power to help me feel confident; however, I embarrassed my friend and his date. Although this lie helped me at the time, since then it has made me look down on myself.";

var samples = [sample, sample2, sample3, sample4];
if (0) {

  test("testMaxMatchingSequence", function () {

    var rm = new RiMarkov(4);
    rm.maxLengthMatchingSequence = 5;
    rm.loadTokens(RiTa.tokenize(sample));

    for (var i = 0; i < 1; i++) {

      var toks = rm.generateTokens(7);
      if (!toks || !toks.length) {
        ok("failed!");
        return;
      }
      var win = toks.length - rm.N + 1;
      //console.log(i+') '+RiTa.untokenize(toks));
      // console.log('');

      // All sequences of 4 must be in text
      for (var j = 0; j < win; j++) {
        var part = toks.slice(j, j + rm.N);
        //console.log(i+'.'+j+') ',part);
        var res = RiTa.untokenize(part);
        //console.log(i+'.'+j+') '+res);
        ok(sample.indexOf(res) > -1);
      }

      if (0) {
        // No sequences of 5 can be in text
        var win = rm.maxLengthMatchingSequence - rm.N + 1;
        //console.log(win);
        for (var j = 0; j < win; j++) {
          var part = toks.slice(j, j + rm.maxLengthMatchingSequence);
          equal(part.length, rm.maxLengthMatchingSequence);
          var res = RiTa.untokenize(part);
          //console.log(j+':', res, sample.indexOf(res));
          ok(sample.indexOf(res) < 0);
          //return;
        }
      }
    }
  });
}

test("testConstructor", function () {

  ok(RiMarkov(4));
  ok(new RiMarkov(3));
});

test("testGetSentenceStart", function () {

  // WORKING HERE
  var rm = new RiMarkov(4);
  var sents = RiTa.splitSentences(sample)
  rm.loadSentences(sents);
  var start = rm._getSentenceStart();
  //console.log(start);
  ok(rm.starts.children[start.token]);
  ok(rm._isSentenceStart(start));
});



test("testLoadSentences", function () {

  // WORKING HERE
  var rm = new RiMarkov(4);
  var sents = RiTa.splitSentences(sample)
  rm.loadSentences(sents);
  ok(1);

  var s = rm.generateSentence();
  console.log(s);
  ok(s);
});



test("testGenerateTokens", function () {

  var toks, res, rm = new RiMarkov(4);
  rm.loadTokens(RiTa.tokenize(sample));
  for (var i = 0; i < 10; i++) {
    toks = rm.generateTokens(4);
    res = RiTa.untokenize(toks);
    equal(toks.length, 4);
    ok(sample.indexOf(res) > -1);
  }

  var rm = new RiMarkov(4);
  rm.loadTokens(RiTa.tokenize(sample));
  for (var i = 0; i < 10; i++) {
    toks = rm.generateTokens(20);
    res = RiTa.untokenize(toks);
    equal(toks.length, 20);
    //console.log(i, res);
  }
});

test("testGenerateUntil", function () {

  var rm = new RiMarkov(3);
  rm.loadTokens(RiTa.tokenize(sample));

  for (var i = 0; i < 10; i++) {
    var arr = rm.generateUntil('[\.\?!]', 4, 20);
    var res = RiTa.untokenize(arr);

    ok(arr.length >= 4 && arr.length <= 20, res +
      '  (length=' + arr.length + ")");

    var n = rm.N;
    for (var j = 0; j < arr.length - n; j++) {
      var partial = arr.slice(j, j + n);
      //console.log(partial);
      partial = RiTa.untokenize(partial);
      ok(sample.indexOf(partial) > -1, partial)
    }
  }
});

test("testGetCompletionsA", function () { //TODO:

  var rm = new RiMarkov(4);
  rm.loadTokens(RiTa.tokenize(sample));

  var res = rm.getCompletions("people lie is".split(' '));
  deepEqual(res, ["to"]);

  var res = rm.getCompletions("One reason people lie is".split(' '));
  deepEqual(res, ["to"]);

  var res = rm.getCompletions("personal power".split(' '));
  deepEqual(res, ['.', 'is']);

  var res = rm.getCompletions(['to', 'be', 'more']);
  deepEqual(res, ['confident']);

  var res = rm.getCompletions("I"); // testing the sort
  var expec = ["did", "claimed", "had", "said", "could",
    "wanted", "also", "achieved", "embarrassed"
  ];
  deepEqual(res, expec);

  var res = rm.getCompletions("XXX");
  deepEqual(res, []);
});

test("testGetCompletionsB", function () { //TODO:

  var rm = new RiMarkov(4);
  rm.loadTokens(RiTa.tokenize(sample2));

  var res = rm.getCompletions(['I'], ['not']);
  deepEqual(res, ["did"]);

  var res = rm.getCompletions(['achieve'], ['power']);
  deepEqual(res, ["personal"]);

  var res = rm.getCompletions(['to', 'achieve'], ['power']);
  deepEqual(res, ["personal"]);

  var res = rm.getCompletions(['achieve'], ['power']);
  deepEqual(res, ["personal"]);

  var res = rm.getCompletions(['I', 'did']);
  deepEqual(res, ["not", "occasionally"]); // sort

  var res = rm.getCompletions(['I', 'did'], ['want']);
  deepEqual(res, ["not", "occasionally"]);
});

test("testGetProbabilities[single]", function () {

  var rm = new RiMarkov(3);
  rm.loadTokens(RiTa.tokenize(sample));

  var checks = ["reason", "people", "personal", "the", "is", "XXX"];
  var expected = [{
    people: 1.0
  }, {
    lie: 1
  }, {
    power: 1.0
  }, {
    time: 0.5,
    party: 0.5
  }, {
    to: 0.3333333333333333,
    '.': 0.3333333333333333,
    helpful: 0.3333333333333333
  }, {}];

  for (var i = 0; i < checks.length; i++) {

    var res = rm.getProbabilities(checks[i]);
    //console.log(checks[i] + ":", res, expected[i]);
    deepEqual(res, expected[i]);
  }

});

test("testGetProbabilities[array]", function () {

  var rm = new RiMarkov(4);
  rm.loadTokens(RiTa.tokenize(sample2));

  var res = rm.getProbabilities("the".split(" "));
  var expec = {
    time: 0.5,
    party: 0.5
  };
  deepEqual(res, expec);

  var res = rm.getProbabilities("people lie is".split(" "));
  var expec = {
    to: 1.0
  };
  deepEqual(res, expec);

  var res = rm.getProbabilities("is");
  var expec = {
    to: 0.3333333333333333,
    '.': 0.3333333333333333,
    helpful: 0.3333333333333333
  };
  deepEqual(res, expec);

  var res = rm.getProbabilities("personal power".split(' '));
  var expec = {
    '.': 0.5,
    is: 0.5
  };
  deepEqual(res, expec);

  var res = rm.getProbabilities(['to', 'be', 'more']);
  var expec = {
    confident: 1.0
  };
  deepEqual(res, expec);

  var res = rm.getProbabilities("XXX");
  var expec = {};
  deepEqual(res, expec);

  var res = rm.getProbabilities(["personal", "XXX"]);
  var expec = {};
  deepEqual(res, expec);

  var res = rm.getProbabilities(['I', 'did']);
  var expec = {
    "not": 0.6666666666666666,
    "occasionally": 0.3333333333333333
  };
  deepEqual(res, expec);

});

test("testGetProbability[single]", function () {

  var tokens = RiTa.tokenize('the dog ate the boy the');
  var rm = new RiMarkov(3);
  rm.loadTokens(tokens);
  //rm.print();

  equal(rm.getProbability("the"), .5);
  equal(rm.getProbability("dog"), 1 / 6);
  equal(rm.getProbability("cat"), 0);

  var tokens = RiTa.tokenize('the dog ate the boy that the dog found.');
  var rm = new RiMarkov(3);
  rm.loadTokens(tokens);
  //rm.print();

  equal(rm.getProbability("the"), .3);
  equal(rm.getProbability("dog"), .2);
  equal(rm.getProbability("cat"), 0);

  var rm = new RiMarkov(3);
  rm.loadTokens(RiTa.tokenize(sample));
  equal(rm.getProbability("power"), 0.017045454545454544);
});

test("testGetProbability[array]", function () {

  var rm = new RiMarkov(3);
  rm.loadTokens(RiTa.tokenize(sample));

  var check = 'personal power is'.split(' ');
  equal(rm.getProbability(check), 1 / 3);

  check = 'personal powXer is'.split(' ');
  equal(rm.getProbability(check), 0);

  check = 'someone who pretends'.split(' ');
  equal(rm.getProbability(check), 1 / 2);

  equal(rm.getProbability([]), 0);
});

test("testLoadTokens", function () { //TODO: revise tests

  var words = 'The dog ate the cat'.split(' ');

  var rm = new RiMarkov(3);
  rm.loadTokens(words);
  equal(rm.getProbability("The"), 0.2);

  var rm = new RiMarkov(3);
  rm.loadTokens(words);
  equal(rm.getProbability("dog"), 0.2);

  var rm = new RiMarkov(3);
  rm.loadTokens(words);
  equal(rm.getProbability("Dhe"), 0);

  var rm = new RiMarkov(3);
  rm.loadTokens(words);
  equal(rm.getProbability("Dog"), 0);

  var rm = new RiMarkov(3);
  rm.loadTokens(words);
  equal(rm.getProbability(""), 0);

  var rm = new RiMarkov(3);
  rm.loadTokens(words);
  equal(rm.getProbability(" "), 0);

  var rm2 = new RiMarkov(3);
  rm2.loadTokens(RiTa.tokenize(sample));
  notEqual(rm2.getProbability("One"), rm.getProbability("one"));
});

test("testSearch", function () {

  var res, rm = new RiMarkov(4);
  rm.loadTokens('The dog ate the cat'.split(' '));
  rm.loadTokens('The dog ate the rat'.split(' '));

  ok(rm._search().token === 'ROOT');
  ok(rm._search([]).token === 'ROOT');

  res = rm._search('The'.split(' '));
  ok(res && res.token === 'The' && res.childNodes().length === 1);

  res = rm._search('The dog'.split(' '));
  ok(res && res.token === 'dog' && res.childNodes().length === 1);

  res = rm._search('The dog ate'.split(' '));
  ok(res && res.token === 'ate' && res.childNodes().length === 1);

  res = rm._search('The dog ate the'.split(' '));
  ok(res && res.token === 'the' && res.childNodes().length === 2);

  var tokens = 'The dog ate the cat'.split(' ');
  res = rm._search(tokens);
  ok(res && res.token === 'cat' && res.childNodes().length === 0);

  deepEqual(tokens, 'The dog ate the cat'.split(' '));

  // ---------------------------------------------------------------------

  rm = new RiMarkov(4);
  rm.loadTokens(RiTa.tokenize(sample));

  res = rm._search('I did not'.split(' '));
  ok(res && res.token === 'not');
  var tokens = [],
    kids = res.childNodes();
  for (var i = 0; i < kids.length; i++) {
    tokens.push(kids[i].token);
  }
  deepEqual(tokens, ['have', 'want']);

  res = rm._search('power is helpful'.split(' '));
  ok(res && res.token === 'helpful' && res.childNodes().length === 1);

  // ---------------------------------------------------------------------

  rm = new RiMarkov(4);
  rm.loadTokens(RiTa.tokenize(sample));

  //rm.print();
  // console.log(rm.root.children['I'].token);
  // console.log(rm.root.children['I'].children['did'].token);
  // console.log(rm.root.children['I'].children['did'].children['not'].token);
  var orig = [rm.root.children['I'], rm.root.children['I'].children['did'],
    rm.root.children['I'].children['did'].children['not']
  ];
  var path = orig.slice(0);
  for (var i = 0; i < path.length; i++) {
    ok(path[i]);
  }
  res = rm._search(path);

  deepEqual(orig, path);

  ok(res && res.token === 'not');
  var tokens = [],
    kids = res.childNodes();
  for (var i = 0; i < kids.length; i++) {
    tokens.push(kids[i].token);
  }
  deepEqual(tokens, ['have', 'want']);

  res = rm._search('power is helpful'.split(' '));
  ok(res && res.token === 'helpful' && res.childNodes().length === 1);
});

// ----------- Node tests -----------------

test("Node.probability", function () {

  var root = RiMarkov(3).root;
  var i = root.addChild("I");
  var i2 = root.addChild("I");
  var j = root.addChild("J");
  equal(i.probability(), 2 / 3);
  equal(i2.probability(), 2 / 3);
  equal(j.probability(), 1 / 3);
});

test("Node.find", function () {
  var root = RiMarkov(3).root;
  var i = root.addChild("I");
  var j = root.addChild("J");
  equal(root.find("J"), root.find(j));
  equal(root.find("I"), root.find(i));
});

test("Node.select", function () {

  var res, rm = new RiMarkov(4);
  rm.loadTokens(RiTa.tokenize(sample));

  // 'myself' -> '.'
  equal(rm.root.children['myself'].select().token, '.');
  equal(rm.root.children['myself'].select([]).token, '.');
  equal(rm.root.children['myself'].select(['test']).token, '.');
  equal(rm.root.children['myself'].select(['.']), undefined);

  // 'that' -> 'his' || 'I'
  equal(rm.root.children['that'].select(['I']).token, 'his');
  equal(rm.root.children['that'].select(['his']).token, 'I');
  equal(rm.root.children['that'].select(['his', 'I']), undefined);
  res = rm.root.children['that'].select().token;
  ok(res === 'I' || res === 'his');
  res = rm.root.children['that'].select(['test']).token;
  ok(res === 'I' || res === 'his');

});

// ----------- Misc tests -----------------

test("testIsSubArray", function () {
  equal(isSubArray([], sample.split(' ')), false);
  equal(isSubArray('wanted to. I'.split(' '), sample.split(' ')), true);
  equal(isSubArray('One reason lie'.split(' '), sample.split(' ')), false);
  equal(isSubArray('One reason people'.split(' '), sample.split(' ')), true);
  equal(isSubArray('Achieving personal power'.split(' '), sample.split(' ')), true);
  equal(isSubArray('personal power. Achieving'.split(' '), sample.split(' ')), true);
  equal(isSubArray(sample.split(' '), sample.split(' ')), true);
});

//if (typeof exports != 'undefined') runtests(); //exports.unwrap = runtests;

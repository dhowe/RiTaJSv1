var testResults = [{

  testName: 'testRhymes',
  testClass: 'RiLexicon',
  testMethod: 'rhymes',
  assertion: 'deepEqual',
  tests: [{
    input: '',
    output: []
  }, {
    input: 'apple.',
    output: []
  }, {
    input: 'goxgle',
    output: []
  }, {
    input: 'happens in here',
    output: []
  }, {
    input: 'apple',
    output: ['chapel', 'grapple', 'pineapple']
  }, {
    input: 'bible.',
    output: ['libel', 'tribal']
  }, ]
}];

var runtests = function() {

  QUnit.module("RiLexViaRiTa", {
    setup: function() {},
    teardown: function() {}
  });

  /*test("testSize", function() {

    ok(RiTa.size() > 27000);
  });

  test("testContainsWord", function() {

    ok(RiTa.containsWord("cat"));
    ok(!RiTa.containsWord("cated"));
    ok(RiTa.containsWord("funny"));
    ok(RiTa.containsWord("shit"));
    ok(!RiTa.containsWord("123"));
    ok(!RiTa.containsWord("hellx"));
    ok(RiTa.containsWord("hello"));
    ok(RiTa.containsWord("HeLLo"));
    ok(RiTa.containsWord("HELLO"));

    var tmp = RiTa.lexicon.data['hello'];
    RiTa.lexicon.data['hello'] = undefined;
    ok(!RiTa.containsWord("hello"));
    RiTa.lexicon.data['hello'] = tmp; // restore data

    // TODO: add plurals...
  });

  test("testAlliterations", function() {
    console.log(typeof  RiTa.alliterations);
    var result = RiTa.alliterations("cat");
    ok(result.length > 2000);
    for(var i = 0; i < result.length; i++) {
      ok(RiTa.isAlliteration(result[i],"cat"));
    }

    var result = RiTa.alliterations("dog");
    ok(result.length > 1000);
    for(var i = 0; i < result.length; i++) {
      ok(RiTa.isAlliteration(result[i],"dog"));
    }

    var result = RiTa.alliterations("umbrella");
    ok(result.length < 1);

    // var result = RiTa.alliterations("URL");
    // ok(result.length < 1);
    //The phonemes from LTS is er1-l, not very accurate

    var result = RiTa.alliterations("no stress");
    ok(result.length < 1);

    var result = RiTa.alliterations("#$%^&*");
    ok(result.length < 1);

    var result = RiTa.alliterations("");
    ok(result.length < 1);

  });

  test("testAlliterations(int)", function() {

    var result = RiTa.alliterations("dog", 15);
    ok(result.length < 5);
    for(var i = 0; i < result.length; i++) {
      ok(RiTa.isAlliteration(result[i],"dog"));
    }

    var result = RiTa.alliterations("cat", 16);
    ok(result.length < 15);
    for(var i = 0; i < result.length; i++) {
       ok(RiTa.isAlliteration(result[i],"cat"));
    }

  });

  // TESTS: randomWord(), randomWord(targetLength),
  // randomWord(pos), randomWord(pos, targetLength)

  test("testRandomWord(1)", function() {

    var result = RiTa.randomWord();
    ok(result.length > 0, "randomWord: " + result);

    result = RiTa.randomWord("nn");
    ok(result.length > 0, "randomWord nn: " + result);

    result = RiTa.randomWord("nns");
    ok(result.length > 0, "randomWord nns: " + result);

    //wordNet Tag
    result = RiTa.randomWord("n");
    ok(result.length > 0, "randomWord n: " + result);

    result = RiTa.randomWord("v");
    ok(result.length > 0, "randomWord v: " + result);

    // no result
    result = RiTa.randomWord("fw");
    ok(result.length < 1);

    result = RiTa.randomWord("rp");
    ok(result.length < 1, "randomWord rp: " + result);

    result = RiTa.randomWord("pdt");
    ok(result.length < 1, "randomWord pdt: " + result);

    //int
    result = RiTa.randomWord(3);
    ok(result.length > 0, "3 syllableCount: " + result);

    result = RiTa.randomWord(5);
    ok(result.length > 0, "5 syllableCount: " + result);

    //tag, int
    result = RiTa.randomWord("nns", 5);
    ok(result.length > 0, "randomWord nns: " + result);

  });

  test("testRandomWord(2)", function() {

    var pos = ["nn", "jj", "jjr", "wp"];
    for (var j = 0; j < pos.length; j++) {
      for (var i = 0; i < 5; i++) {
        var result = RiTa.randomWord(pos[j]);
        var best = RiTa.lexicon._getBestPos(result);
        //console.log(result+": "+pos[j]+" ?= "+best);
        equal(pos[j], best, result);
      }
    }
  });


  test("testRandomWord(3)", function() {

    for (var i = 0; i < 10; i++) {
      var result = RiTa.randomWord(3);
      var syllables = RiTa.getSyllables(result);
      var num = syllables.split(RiTa.SYLLABLE_BOUNDARY).length;
      ok(result.length > 0);
      ok(num == 3, result + ": " + syllables); // "3 syllableCount: "
    }
  });

  test("testRandomWord(4)", function() {

    for (var i = 0; i < 10; i++) {
      var result = RiTa.randomWord(5);
      var syllables = RiTa.getSyllables(result);
      var num = syllables.split(RiTa.SYLLABLE_BOUNDARY).length;
      ok(result.length > 0); // "3 syllableCount: "
      ok(num == 5); // "3 syllableCount: "
    }

    // TODO: more tests with both count and pos
  });

  test("testWords", function() {

    var result = RiTa.words();
    ok(result.length > 1000);

    var result2 = RiTa.words(false);
    var result1 = RiTa.words(true);
    ok(result1.length > 1000);
    ok(result2.length > 1000);
    notDeepEqual(result1, result2);

    var result = RiTa.words("colou*r");
    ok(result.length > 5);

    var result = RiTa.words("[^A-M]in");
    ok(result.length > 5);

    var result1 = RiTa.words("colou*r", false);
    ok(result1.length > 5);

    var result2 = RiTa.words(false, "colou*r");
    ok(result2.length > 5);

    // make sure they are
    deepEqual(result1, result2);

    var result1 = RiTa.words("colou*r", true);
    ok(result1.length > 5);

    var result2 = RiTa.words(true, "colou*r");
    ok(result2.length > 5);

    // make sure they are
    notDeepEqual(result1, result2);
  });

  test("testIsAdverb", function() {

    ok(!RiTa.isAdverb("swim"));
    ok(!RiTa.isAdverb("walk"));
    ok(!RiTa.isAdverb("walker"));
    ok(!RiTa.isAdverb("beautiful"));
    ok(!RiTa.isAdverb("dance"));
    ok(!RiTa.isAdverb("dancing"));
    ok(!RiTa.isAdverb("dancer"));

    //verb
    ok(!RiTa.isAdverb("wash"));
    ok(!RiTa.isAdverb("walk"));
    ok(!RiTa.isAdverb("play"));
    ok(!RiTa.isAdverb("throw"));
    ok(!RiTa.isAdverb("drink"));
    ok(!RiTa.isAdverb("eat"));
    ok(!RiTa.isAdverb("chew"));

    //adj
    ok(!RiTa.isAdverb("wet"));
    ok(!RiTa.isAdverb("dry"));
    ok(!RiTa.isAdverb("furry"));
    ok(!RiTa.isAdverb("sad"));
    ok(!RiTa.isAdverb("happy"));

    //n
    ok(!RiTa.isAdverb("dogs"));
    ok(!RiTa.isAdverb("wind"));
    ok(!RiTa.isAdverb("dolls"));
    ok(!RiTa.isAdverb("frogs"));
    ok(!RiTa.isAdverb("ducks"));
    ok(!RiTa.isAdverb("flowers"));
    ok(!RiTa.isAdverb("fish"));

    //adv
    ok(RiTa.isAdverb("truthfully"));
    ok(RiTa.isAdverb("kindly"));
    ok(RiTa.isAdverb("bravely"));
    ok(RiTa.isAdverb("doggedly"));
    ok(RiTa.isAdverb("sleepily"));
    ok(RiTa.isAdverb("excitedly"));
    ok(RiTa.isAdverb("energetically"));
    ok(RiTa.isAdverb("hard")); // +adj

    ok(!RiTa.isAdverb(""));

    throws(function() {
      RiTa.SILENT = 1;
      try {
        RiTa.isAdverb("banana split");
        ok(!"failed");
      } catch (e) {
        throw e;
      }
      RiTa.SILENT = 0;
    });
  });

  test("testIsNoun", function() {

    ok(RiTa.isNoun("swim"));
    ok(RiTa.isNoun("walk"));
    ok(RiTa.isNoun("walker"));
    ok(RiTa.isNoun("dance"));
    ok(RiTa.isNoun("dancing"));
    ok(RiTa.isNoun("dancer"));

    //verb
    ok(RiTa.isNoun("wash")); //"TODO:also false in processing -> nn" shoulbe be both Verb and Noun
    ok(RiTa.isNoun("walk"));
    ok(RiTa.isNoun("play"));
    ok(RiTa.isNoun("throw"));
    ok(RiTa.isNoun("drink")); //TODO:"also false in processing -> nn" shoulbe be both Verb and Noun
    ok(!RiTa.isNoun("eat"));
    ok(!RiTa.isNoun("chew"));

    //adj
    ok(!RiTa.isNoun("hard"));
    ok(!RiTa.isNoun("dry"));
    ok(!RiTa.isNoun("furry"));
    ok(!RiTa.isNoun("sad"));
    ok(!RiTa.isNoun("happy"));
    ok(!RiTa.isNoun("beautiful"));

    //n
    ok(RiTa.isNoun("dogs"));
    ok(RiTa.isNoun("wind"));
    ok(RiTa.isNoun("dolls"));
    ok(RiTa.isNoun("frogs"));
    ok(RiTa.isNoun("ducks"));
    ok(RiTa.isNoun("flower"));
    ok(RiTa.isNoun("fish"));
    ok(RiTa.isNoun("wet")); //+v/adj

    //adv
    ok(!RiTa.isNoun("truthfully"));
    ok(!RiTa.isNoun("kindly"));
    ok(!RiTa.isNoun("bravely"));
    ok(!RiTa.isNoun("scarily"));
    ok(!RiTa.isNoun("sleepily"));
    ok(!RiTa.isNoun("excitedly"));
    ok(!RiTa.isNoun("energetically"));

    ok(!RiTa.isNoun(""));

    throws(function() {
      RiTa.SILENT = 1;
      try {
        RiTa.isNoun("banana split");

      } catch (e) {
        throw e;
      }
      RiTa.SILENT = 0;
    });
  });

  test("testIsVerb", function() {

    ok(RiTa.isVerb("dance"));
    ok(RiTa.isVerb("swim"));
    ok(RiTa.isVerb("walk"));
    ok(!RiTa.isVerb("walker"));
    ok(!RiTa.isVerb("beautiful"));

    ok(RiTa.isVerb("dancing"));
    ok(!RiTa.isVerb("dancer"));

    //verb
    ok(RiTa.isVerb("eat"));
    ok(RiTa.isVerb("chew"));

    ok(RiTa.isVerb("throw")); // +n
    ok(RiTa.isVerb("walk")); // +n
    ok(RiTa.isVerb("wash")); // +n
    ok(RiTa.isVerb("drink")); // +n

    // ok(RiTa.isVerb("ducks")); // +n -> Known Issues
    ok(RiTa.isVerb("fish")); // +n
    // ok(RiTa.isVerb("dogs")); // +n -> Known Issues

    ok(RiTa.isVerb("wind")); // +n
    ok(RiTa.isVerb("wet")); // +adj
    ok(RiTa.isVerb("dry")); // +adj

    //adj
    ok(!RiTa.isVerb("hard"));
    ok(!RiTa.isVerb("furry"));
    ok(!RiTa.isVerb("sad"));
    ok(!RiTa.isVerb("happy"));

    //n
    ok(!RiTa.isVerb("dolls"));
    ok(!RiTa.isVerb("frogs"));
    ok(!RiTa.isVerb("flowers"));

    //adv
    ok(!RiTa.isVerb("truthfully"));
    ok(!RiTa.isVerb("kindly"));
    ok(!RiTa.isVerb("bravely"));
    ok(!RiTa.isVerb("scarily"));
    ok(!RiTa.isVerb("sleepily"));
    ok(!RiTa.isVerb("excitedly"));
    ok(!RiTa.isVerb("energetically"));

    throws(function() {
      RiTa.SILENT = 1;
      try {
        RiTa.isVerb("banana split");
      } catch (e) {
        throw e;
      }
      RiTa.SILENT = 0;

    });
  });


  test("testIsAdjective", function() {

    ok(!RiTa.isAdjective("swim"));
    ok(!RiTa.isAdjective("walk"));
    ok(!RiTa.isAdjective("walker"));
    ok(RiTa.isAdjective("beautiful"));
    ok(!RiTa.isAdjective("dance"));
    ok(!RiTa.isAdjective("dancing"));
    ok(!RiTa.isAdjective("dancer"));

    //verb
    ok(!RiTa.isAdjective("wash"));
    ok(!RiTa.isAdjective("walk"));
    ok(!RiTa.isAdjective("play"));
    ok(!RiTa.isAdjective("throw"));
    ok(!RiTa.isAdjective("drink"));
    ok(!RiTa.isAdjective("eat"));
    ok(!RiTa.isAdjective("chew"));

    //adj
    ok(RiTa.isAdjective("hard"));
    ok(RiTa.isAdjective("wet"));
    ok(RiTa.isAdjective("dry"));
    ok(RiTa.isAdjective("furry"));
    ok(RiTa.isAdjective("sad"));
    ok(RiTa.isAdjective("happy"));
    ok(RiTa.isAdjective("kindly")); //+adv

    //n
    ok(!RiTa.isAdjective("dogs"));
    ok(!RiTa.isAdjective("wind"));
    ok(!RiTa.isAdjective("dolls"));
    ok(!RiTa.isAdjective("frogs"));
    ok(!RiTa.isAdjective("ducks"));
    ok(!RiTa.isAdjective("flowers"));
    ok(!RiTa.isAdjective("fish"));

    //adv
    ok(!RiTa.isAdjective("truthfully"));
    ok(!RiTa.isAdjective("bravely"));
    ok(!RiTa.isAdjective("scarily"));
    ok(!RiTa.isAdjective("sleepily"));
    ok(!RiTa.isAdjective("excitedly"));
    ok(!RiTa.isAdjective("energetically"));


    throws(function() {
      RiTa.SILENT = 1;

      try {
        RiTa.isAdjective("banana split");

      } catch (e) {
        throw e;
      }
      RiTa.SILENT = 0;

    });
  });

  test("testIsAlliteration", function() {

    ok(RiTa.isAlliteration("sally", "silly"));
    ok(RiTa.isAlliteration("sea", "seven"));
    ok(RiTa.isAlliteration("silly", "seven"));
    ok(RiTa.isAlliteration("sea", "sally"));

    ok(RiTa.isAlliteration("big", "bad"));
    ok(RiTa.isAlliteration("bad", "big")); // swap position

    ok(RiTa.isAlliteration("BIG", "bad")); // CAPITAL LETTERS
    ok(RiTa.isAlliteration("big", "BAD")); // CAPITAL LETTERS
    ok(RiTa.isAlliteration("BIG", "BAD")); // CAPITAL LETTERS
    ok(RiTa.isAlliteration("this", "these"));

    // False
    ok(!RiTa.isAlliteration("wind", "withdraw"));
    ok(!RiTa.isAlliteration("solo", "tomorrow"));
    ok(!RiTa.isAlliteration("solo", "yoyo"));
    ok(!RiTa.isAlliteration("yoyo", "jojo"));
    ok(!RiTa.isAlliteration("cat", "access"));
    ok(!RiTa.isAlliteration("", ""));

    ok(RiTa.isAlliteration("unsung", "sine"));
    ok(RiTa.isAlliteration("job", "gene"));
    ok(RiTa.isAlliteration("jeans", "gentle"));

    ok(RiTa.isAlliteration("knife", "gnat"));
    ok(RiTa.isAlliteration("knife", "naughty"));

    ok(RiTa.isAlliteration("abet", "better"));
    ok(RiTa.isAlliteration("psychology", "cholera"));
    ok(RiTa.isAlliteration("consult", "sultan"));
    ok(RiTa.isAlliteration("never", "knight"));
    ok(RiTa.isAlliteration("knight", "navel"));
    ok(RiTa.isAlliteration("monsoon", "super"));
    ok(RiTa.isAlliteration("cat", "kitchen"));

    // not counting assonance
    ok(!RiTa.isAlliteration("octopus", "oblong"));
    ok(!RiTa.isAlliteration("omen", "open"));
    ok(!RiTa.isAlliteration("amicable", "atmosphere"));
  });


  test("testIsRhymeStringString", function() {

    ok(!RiTa.isRhyme("apple", "polo"));
    ok(!RiTa.isRhyme("this", "these"));

    ok(RiTa.isRhyme("cat", "hat"));
    ok(RiTa.isRhyme("yellow", "mellow"));
    ok(RiTa.isRhyme("toy", "boy"));
    ok(RiTa.isRhyme("sieve", "give"));

    ok(RiTa.isRhyme("solo", "tomorrow"));
    ok(RiTa.isRhyme("tense", "sense"));
    ok(RiTa.isRhyme("crab", "drab"));
    ok(RiTa.isRhyme("shore", "more"));
    ok(RiTa.isRhyme("mouse", "house"));
    //why??
    ok(!RiTa.isRhyme("hose", "house"));

    ok(!RiTa.isRhyme("sieve", "mellow"));

    // ok(!RiTa.isRhyme("solo   ", "tomorrow")); // Word with tab space
    // ok(!RiTa.isRhyme("solo", "yoyo"));
    // ok(!RiTa.isRhyme("yoyo", "jojo")); -> Known Issues

    ok(RiTa.isRhyme("yo", "bro"));
    ok(!RiTa.isRhyme("swag", "grab"));
    ok(!RiTa.isRhyme("", ""));
  });

  test("testIsRhyme", function() {


    var rhymes = [
    "candle", "handle",
    "fat", "cat",
    "apple", "grapple",
    "apple", "chapel",
    "libel", "tribal",
    "bugle", "frugal",
    "arrested", "contested"
    ];

    for (var i = 0; i < rhymes.length; i += 2) {
      //System.out.println(rhymes[i] + " + "+rhymes[i+1]+" -> "+RiTa.isRhyme(rhymes[i], rhymes[i+1]));
      ok(RiTa.isRhyme(rhymes[i], rhymes[i+1]), rhymes[i]+"/"+rhymes[i+1]);
      ok(RiTa.isRhyme(rhymes[i+1], rhymes[i]), rhymes[i+1]+"/"+rhymes[i]);
    }

    var rhymeSet1 = [
    "insincere", "persevere", "interfere",  // each should rhyme with the others
    "career",  "year", "reappear", "brigadier", "pioneer", "rear", "near",
    "beer", "fear", "sneer", "adhere", "veer", "volunteer", "pamphleteer",
    "sear", "sincere", "smear", "gear", "deer", "here", "queer",
    "financier", "cavalier", "rainier", "mutineer", "unclear", "racketeer",
    "disappear", "austere", "veneer", "overhear", "auctioneer", "spear",
    "pier", "sphere", "cashier", "ear", "steer",
     "souvenir", "frontier", "chandelier", "shear", "clear",  "mere",
    "premier", "rehear", "engineer", "cheer", "appear", "severe",
    ];

    for (var i = 0; i < rhymeSet1.length-1; i++) {
      for (var j = 0; j < rhymeSet1.length; j++) {

    if (i != j){
      //System.out.println(rhymeSet1[i] + " + "+rhymeSet1[j]+" -> "+RiTa.isRhyme(rhymeSet1[i], rhymeSet1[j]));
      ok(RiTa.isRhyme(rhymeSet1[i], rhymeSet1[j]));
    }
    else
      ok(!RiTa.isRhyme(rhymeSet1[i], rhymeSet1[j]));
      }
    }

    var notRhymes = [
    "not", "rhyme",
    "deer", "dear",
    "candle", "candle" ,
    "hear","here",
    "premiere","premier",
    "peer","pear",
    "sheer","shear"
    ];

    for (var i = 0; i < notRhymes.length; i += 2) {
      ok(!RiTa.isRhyme(notRhymes[i], notRhymes[i+1]));
      ok(!RiTa.isRhyme(notRhymes[i+1], notRhymes[i]));  // either way should be the same
    }

  });

  test("testSimilarByLetter", function() {
    var result;

    result = RiTa.similarByLetter("banana", true);
    deepEqual(result, ["cabana"]);

    result = RiTa.similarByLetter("banana", false);
    deepEqual(result, ["banal", "bonanza", "cabana", "lantana", "manna", "wanna"]);

    //delete the word 'lice', not exists anymore in dict.
    result = RiTa.similarByLetter("banana");
    deepEqual(result, ["banal", "bonanza", "cabana", "lantana", "manna", "wanna"]);

    result = RiTa.similarByLetter("banana", 1, true);
    deepEqual(result, ["cabana"]);

    result = RiTa.similarByLetter("banana", 1, false);
    deepEqual(result, ["banal", "bonanza", "cabana", "lantana", "manna", "wanna"]);

    result = RiTa.similarByLetter("tornado");
    deepEqual(result, ["torpedo"]);

    result = RiTa.similarByLetter("ice");
    deepEqual(result, ["ace", "dice", "iced", "icy", "ire", "nice", "rice", "vice"]);

    result = RiTa.similarByLetter("ice", 1);
    deepEqual(result, ["ace", "dice", "iced", "icy", "ire", "nice", "rice", "vice"]);

    result = RiTa.similarByLetter("ice", 2, true);
    ok(result.length > 10);

    result = RiTa.similarByLetter("ice", 0, true); // defaults to 1
    deepEqual(result, ["ace", "icy", "ire"]);

    result = RiTa.similarByLetter("ice", 1, true);
    deepEqual(result, ["ace", "icy", "ire"]);

    result = RiTa.similarByLetter("worngword");
    deepEqual(result, ["foreword", "wormwood"]);

    result = RiTa.similarByLetter("123");
    ok(result.length > 400);

    result = RiTa.similarByLetter("");
    deepEqual(result, []);
  });

  test("testSimilarBySound", function() {

    var result = RiTa.similarBySound("tornado");
    deepEqual(result, ["torpedo"]);

    result = RiTa.similarBySound("try");
    var answer = ["cry", "dry", "fry", "pry", "rye", "tie", "tray", "tree", "tribe", "tried", "tripe", "trite", "true", "wry"];
    deepEqual(result, answer);

    result = RiTa.similarBySound("try", 2);
    ok(result.length > answer.length); // more

    result = RiTa.similarBySound("happy");
    answer = ["happier", "hippie"];
    deepEqual(result, answer);

    result = RiTa.similarBySound("happy", 2);
    ok(result.length > answer.length); // more

    result = RiTa.similarBySound("cat");
    answer = ["at", "bat", "cab", "cache", "calf", "calve", "can", "cant", "cap", "capped", "cash", "cashed", "cast", "caste", "catch", "catty", "caught", "chat", "coat", "cot", "curt", "cut", "fat", "hat", "kit", "kite", "mat", "matt", "matte", "pat", "rat", "sat", "tat", "that", "vat"];
    deepEqual(result, answer);

    result = RiTa.similarBySound("cat", 2);
    ok(result.length > answer.length);

    var result = RiTa.similarBySound("worngword");
    deepEqual(result, ["watchword", "wayward", "wormwood"]);
  });

  test("testSimilarBySoundAndLetter", function() {

    var result = RiTa.similarBySoundAndLetter("try");
    deepEqual(result, ["cry", "dry", "fry", "pry", "tray", "wry"]);

    result = RiTa.similarBySoundAndLetter("daddy");
    deepEqual(result, ["dandy", "paddy"]);

    result = RiTa.similarBySoundAndLetter("banana");
    deepEqual(result, ["bonanza"]);

    result = RiTa.similarBySoundAndLetter("worngword");
    deepEqual(result, ["wormwood"]);

    result = RiTa.similarBySoundAndLetter("");
    deepEqual(result, []);
  });

  test("testSubstrings", function() {

    var result = RiTa.substrings("thousand");
    var answer = ["sand", "thou"];
    deepEqual(result, answer);

    var result = RiTa.substrings("thousand", 2);
    var answer = [ 'an', 'and', 'sand', 'thou', 'us' ];
    deepEqual(result, answer);

    var result = RiTa.substrings("banana", 1);
    var answer = ["a", "an", "b", "ban", "n", "na"];
    deepEqual(result, answer);

    var result = RiTa.substrings("thousand", 3);
    var answer = ["and", "sand", "thou"];
    deepEqual(result, answer);

    var result = RiTa.substrings("thousand"); // min-length=4
    var answer = ["sand", "thou"];
    deepEqual(result, answer);

    var result = RiTa.substrings("");
    var answer = [];
    deepEqual(result, answer);

  });

  test("testSuperstrings", function() {

    var result = RiTa.superstrings("superm");
    var answer = ["supermarket"];
    deepEqual(result, answer);

    var result = RiTa.superstrings("puni");
    var answer = ["impunity", "punish", "punishable", "punished", "punishes", "punishing", "punishment", "punitive", "unpunished"];
    deepEqual(result, answer);

    var result = RiTa.superstrings("");
    var answer = [""];
    ok(result.length > 1000);

  });

  test("testGetPosData", function() {

    var result = RiTa.lexicon._getPosData("box");
    deepEqual(result, "nn vb");

    var result = RiTa.lexicon._getPosData("there");
    deepEqual(result, "ex rb uh");

    var result = RiTa.lexicon._getPosData("a");
    deepEqual(result, "dt");

    var result = RiTa.lexicon._getPosData("beautiful");
    deepEqual(result, "jj");

    //Empty String
    var result = RiTa.lexicon._getPosData(".");
    deepEqual(result, "");

    var result = RiTa.lexicon._getPosData("beautiful guy");
    deepEqual(result, "");
  });

  test("testIsVowel", function() {

    ok(RiTa.lexicon._isVowel("a"));
    ok(RiTa.lexicon._isVowel("e"));
    ok(RiTa.lexicon._isVowel("i"));
    ok(RiTa.lexicon._isVowel("o"));
    ok(RiTa.lexicon._isVowel("u"));

    ok(!RiTa.lexicon._isVowel("y"));
    ok(!RiTa.lexicon._isVowel("v"));
    ok(!RiTa.lexicon._isVowel("3"));
    ok(!RiTa.lexicon._isVowel(""));
  });

  test("testIsConsonant", function() {

    ok(!RiTa.lexicon._isConsonant("vv"));
    ok(!RiTa.lexicon._isConsonant(""));

    ok(RiTa.lexicon._isConsonant("v"));
    ok(RiTa.lexicon._isConsonant("b"));
    ok(RiTa.lexicon._isConsonant("d"));
    ok(RiTa.lexicon._isConsonant("q"));


    ok(!RiTa.lexicon._isConsonant("a"));
    ok(!RiTa.lexicon._isConsonant("e"));
    ok(!RiTa.lexicon._isConsonant("i"));
    ok(!RiTa.lexicon._isConsonant("o"));
    ok(!RiTa.lexicon._isConsonant("uu"));

    ok(!RiTa.lexicon._isConsonant("3"));

  });

  test("testLookupRaw", function() {

    var result = RiTa.lexicon._lookupRaw("banana");
    deepEqual(result, ["b-ah n-ae1 n-ah", "nn"]);

    var result = RiTa.lexicon._lookupRaw("sand");
    deepEqual(result, ["s-ae1-n-d", "nn vb"]);

    var result = RiTa.lexicon._lookupRaw("hex");
    deepEqual(result, undefined);

    var result = RiTa.lexicon._lookupRaw("there is");
    deepEqual(result, undefined);

    var result = RiTa.lexicon._lookupRaw("ajj");
    deepEqual(result, undefined);
  });

  //For RiTa.getPhonemes() NOT IN RiTa-Java

  test("testGetPhonemes", function() {


    var result = RiTa.lexicon._getPhonemes("The");
    var answer = "dh-ah";
    equal(result, answer);

    var result = RiTa.lexicon._getPhonemes("The.");
    var answer = "dh-ah";
    equal(result, answer);

    var result = RiTa.lexicon._getPhonemes("The boy jumped over the wild dog.");
    var answer = "dh-ah b-oy jh-ah-m-p-t ow-v-er dh-ah w-ay-l-d d-ao-g";
    equal(result, answer);

    var result = RiTa.lexicon._getPhonemes("The boy ran to the store.");
    var answer = "dh-ah b-oy r-ae-n t-uw dh-ah s-t-ao-r";
    equal(result, answer);

    var result = RiTa.lexicon._getPhonemes("");
    var answer = "";
    equal(result, answer);

  });

  //For RiTa.getStresses() NOT IN RiTa-Java

  test("testGetStresses", function() {

    var result = RiTa.lexicon._getStresses("The emperor had no clothes on");
    var answer = "0 1/0/0 1 1 1 1";
    equal(result, answer);

    var result = RiTa.lexicon._getStresses("The emperor had no clothes on.");
    var answer = "0 1/0/0 1 1 1 1";
    equal(result, answer);

    var result = RiTa.lexicon._getStresses("The emperor had no clothes on. The King is fat.");
    var answer = "0 1/0/0 1 1 1 1 0 1 1 1";
    equal(result, answer);

    var result = RiTa.lexicon._getStresses("to preSENT, to exPORT, to deCIDE, to beGIN");
    var answer = "1 1/0 1 1/0 1 0/1 1 0/1";
    equal(result, answer);

    var result = RiTa.lexicon._getStresses("to present, to export, to decide, to begin");
    var answer = "1 1/0 1 1/0 1 0/1 1 0/1";
    equal(result, answer);

    var result = RiTa.lexicon._getStresses("");
    var answer = "";
    equal(result, answer);
  });

  //For RiTa.getSyllables() NOT IN RiTa-Java

  test("testGetSyllables", function() {

    var result = RiTa.lexicon._getSyllables("The emperor had no clothes on.");
    var answer = "dh-ah eh-m/p-er/er hh-ae-d n-ow k-l-ow-dh-z aa-n";
    equal(result, answer);

    var result = RiTa.lexicon._getSyllables("@#$%*()");
    var answer = "";
    equal(result, answer);

    var result = RiTa.lexicon._getSyllables("");
    var answer = "";
    equal(result, answer);
  });

  test("RiLexicon-lookups", function() {

    ok(typeof RiTa.lexicon.data != 'undefined');

    ok(RiTa.lexicon._getPhonemes('gonna'));
    ok(RiTa.lexicon._getPhonemes('gotta'));

    ok(RiTa.isRhyme("cat", "hat"));
    ok(!RiTa.isRhyme("cat", "dog"));
    ok(RiTa.isAlliteration("cat", "kill"));
    ok(!RiTa.isAlliteration("cat", "dog"));
  });

  test("RiLexicon-gets", function() {

    var word = "aberration";
    var output1 = RiTa.lexicon._getSyllables(word);
    var output2 = RiTa.lexicon._getPhonemes(word);
    var output3 = RiTa.lexicon._getStresses(word);

    var expected1 = "ae/b-er/ey/sh-ah-n";
    equal(output1, expected1);

    var expected2 = "ae-b-er-ey-sh-ah-n";
    equal(output2, expected2);

    var expected3 = "0/0/1/0";
    equal(output3, expected3);

  });*/

  // below modify the lexicon.data field ================================

  test("testAddWord", function() {

    var result = RiTa.addWord("bananana", "b-ax-n ae1-n ax ax", "nn");
    ok(RiTa.containsWord("bananana"));

    RiTa.addWord("hehehe", "hh-ee1 hh-ee1 hh-ee1", "uh");
    ok(RiTa.containsWord("hehehe"));

    equal(RiTa.lexicon._getPhonemes("hehehe"), "hh-ee-hh-ee-hh-ee");

    RiTa.addWord("HAHAHA", "hh-aa1 hh-aa1 hh-aa1", "uh");
    ok(RiTa.containsWord("HAHAHA"));

    RiTa.addWord("HAHAHA", "hh-aa1 hh-aa1 hh-aa1", "uh");
    equal(RiTa.lexicon._getPhonemes("HAHAHA"), "hh-aa-hh-aa-hh-aa");

    RiTa.lexicon.reload(); // restore global
  });

  test("testClear", function() {

    ok(RiTa.containsWord("banana"));
    removeWord("banana");

    ok(!RiTa.containsWord("banana"));

    var obj = {};
    obj["wonderfullyy"] = ["w-ah1-n-d er-f ax-l iy", "rb"];
    RiTa.lexicalData(obj);
    var result = RiTa.lexicalData();
    deepEqual(result, obj)

    RiTa.clear();
    ok(RiTa.size() < 1);

    RiTa.lexicon.reload(); // restore global

  });

  function removeWord(word) {
    delete RiTa.lexicon.data[word.toLowerCase()];
    RiTa.lexicon.keys = Object.keys(RiTa.lexicon.data);
  }

  test("testReload", function() {
    //RiTa.lexicon = new RiLexicon();
    var originalSize = RiTa.size();
    ok(RiTa.containsWord("are"));
    removeWord("are");
    ok(!RiTa.containsWord("are"));
    var removeOneWordSize = RiTa.size();
    ok(RiTa.size()===originalSize-1);

    RiTa.reload();
    ok(RiTa.size() === originalSize);

    ok(RiTa.containsWord("cat"));
    removeWord("cat");
    ok(!RiTa.containsWord("cat"));
    ok(RiTa.size()===originalSize-1);

    ok(RiTa.containsWord("are"));
    removeWord("are");
    ok(!RiTa.containsWord("are"));
    ok(RiTa.size()===originalSize-2);

    RiTa.reload();
    ok(RiTa.size() === originalSize);
    ok(RiTa.containsWord("are"));
    ok(RiTa.containsWord("cat"));

    RiTa.lexicon.reload(); // restore global
  });

  test("testLexicalData", function() {

    var result = RiTa.lexicalData();
    ok(Object.keys(result).length > 1000);

    var re = RiTa.lexicalData();
    result = re.a;
    var answer = ["ey1", "dt"];

    deepEqual(result, answer);

    re = RiTa.lexicalData();
    result = re.the;
    answer = ["dh-ah", "dt"];

    deepEqual(result, answer);

    var obj = {};
    obj["wonderfully"] = ["w-ah1-n-d er-f ax-l iy", "rb"];
    result = RiTa.lexicalData(obj);
    deepEqual(result.lexicalData(), obj);

    obj = {};
    obj["wonderfullyy"] = ["w-ah1-n-d er-f ax-l iy-y", "rb"];
    result = RiTa.lexicalData(obj);
    deepEqual(result.lexicalData().wonderfullyy, ["w-ah1-n-d er-f ax-l iy-y", "rb"]);
  });
}

if (typeof exports != 'undefined') runtests();

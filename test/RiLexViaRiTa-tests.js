// a few tests to make sure that we can call lexicon functions from RiTa object
var runtests = function() {

  QUnit.module("RiLexViaRiTa", {
    setup: function() {},
    teardown: function() {}
  });

  test("testSize", function() {

    ok(RiTa.size() > 27000);
  });

  test("testContainsWord", function() {

    ok(RiTa.containsWord("cat"));
  });

  test("testAlliterations", function() {
    console.log(typeof  RiTa.alliterations);
    var result = RiTa.alliterations("cat");
    ok(result.length > 2000);
    for(var i = 0; i < result.length; i++) {
      ok(RiTa.isAlliteration(result[i],"cat"));
    }
  });

  test("testAlliterations(int)", function() {

    var result = RiTa.alliterations("dog", 15);
    ok(result.length < 5);
    for(var i = 0; i < result.length; i++) {
      ok(RiTa.isAlliteration(result[i],"dog"));
    }
  });

  test("testRandomWord(1)", function() {

    var result = RiTa.randomWord();
    ok(result.length > 0, "randomWord: " + result);
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
  });

  test("testWords", function() {

    var result = RiTa.words();
    ok(result.length > 1000);
  });

  test("testIsAdverb", function() {

    ok(!RiTa.isAdverb("swim"));
  });

  test("testIsNoun", function() {

    ok(RiTa.isNoun("swim"));
  });

  test("testIsVerb", function() {

    ok(RiTa.isVerb("dance"));
  });


  test("testIsAdjective", function() {

    ok(!RiTa.isAdjective("swim"));
    ok(!RiTa.isAdjective("walk"));
  });

  test("testIsAlliteration", function() {

    ok(RiTa.isAlliteration("sally", "silly"));
    ok(RiTa.isAlliteration("sea", "seven"));
  });


  test("testIsRhymeStringString", function() {

    ok(!RiTa.isRhyme("apple", "polo"));
    ok(!RiTa.isRhyme("this", "these"));
  });

  test("testSimilarByLetter", function() {
    var result = RiTa.similarByLetter("banana", true);
    deepEqual(result, ["cabana"]);
  });

  test("testSimilarBySound", function() {

    var result = RiTa.similarBySound("tornado");
    deepEqual(result, ["torpedo"]);

  });

  test("testSimilarBySoundAndLetter", function() {

    var result = RiTa.similarBySoundAndLetter("try");
    deepEqual(result, ["cry", "dry", "fry", "pry", "tray", "wry"]);
  });

  test("testSubstrings", function() {

    var result = RiTa.substrings("thousand");
    var answer = ["sand"];
    deepEqual(result, answer);

  });

  test("testSuperstrings", function() {

    var result = RiTa.superstrings("superm");
    var answer = ["supermarket"];
    deepEqual(result, answer);

  });

  test("testGetPosData", function() {

    var result = RiTa.lexicon._getPosData("box");
    deepEqual(result, "nn vb");
  });

  test("testIsVowel", function() {

    ok(RiTa.lexicon._isVowel("a"));
  });

  test("testIsConsonant", function() {

    ok(!RiTa.lexicon._isConsonant("vv"));
  });

  test("testLookupRaw", function() {

    var result = RiTa.lexicon._lookupRaw("banana");
    deepEqual(result, ["b-ah n-ae1 n-ah", "nn"]);
  });

  test("testGetPhonemes", function() {
    var result = RiTa.lexicon._getPhonemes("The");
    var answer = "dh-ah";
    equal(result, answer);
  });

  test("testGetStresses", function() {

    var result = RiTa.lexicon._getStresses("The emperor had no clothes on");
    var answer = "0 1/0/0 1 1 1 1";
    equal(result, answer);
  });

  test("testGetSyllables", function() {

    var result = RiTa.lexicon._getSyllables("The emperor had no clothes on.");
    var answer = "dh-ah eh-m/p-er/er hh-ae-d n-ow k-l-ow-dh-z aa-n";
    equal(result, answer);
  });

  test("RiLexicon-lookups", function() {

    ok(typeof RiTa.lexicon.data != 'undefined');
    ok(RiTa.lexicon._getPhonemes('gonna'));
  });

  test("testAddWord", function() {

    var result = RiTa.addWord("bananana", "b-ax-n ae1-n ax ax", "nn");
    ok(RiTa.containsWord("bananana"));

    RiTa.lexicon.reload(); // restore global
  });

  test("testClear", function() {

    RiTa.clear();
    ok(RiTa.size() < 1);
    RiTa.lexicon.reload(); // restore global

  });

  function removeWord(word) {
    delete RiTa.lexicon.data[word.toLowerCase()];
    RiTa.lexicon.keys = Object.keys(RiTa.lexicon.data);
  }

  test("testLexicalData", function() {

    var result = RiTa.lexicalData();
    ok(Object.keys(result).length > 1000);

    var re = RiTa.lexicalData();
    result = re.a;
    var answer = ["ey1", "dt"];
  });
}

if (typeof exports != 'undefined') runtests();

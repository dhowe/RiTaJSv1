var runtests = function () {

    RiTa.SILENT = 1;
    lex = RiLexicon();

    test("testUntokenize", function () {

      var input = "The boy screamed, 'Where is my apple?'";
      var expected = ["The", "boy", "screamed", ",", "'", "Where", "is", "my", "apple", "?", "'"];
      var output = RiTa.tokenize(input);
      deepEqual(output, expected);
    });

    test("testUntokenize", function () {
      var expected = "We should consider the students' learning.";
      var input = ["We", "should", "consider", "the", "students", "'", "learning" ];
      var output = RiTa.untokenize(input);
      deepEqual(output, expected);

      var expected = "We should consider the students\u2019 learning.";
      var input = ["We", "should", "consider", "the", "students", "\u2019", "learning" ];
      var output = RiTa.untokenize(input);
      deepEqual(output, expected);
    });

    test("testTokenizeAndBack", function () {
      var testStrings = [
        "We should consider the students' learning.",
        "We should consider the students\u2019 learning.",
      ];
      for (var i = 0; i < testStrings.length; i++) {
        var tokens = RiTa.tokenize(testStrings[i]);
        // console.log(tokens);
        var output = RiTa.untokenize(tokens);
        equal(output, testStrings[i]);
      }
    });

    test("testSingularize", function () {
      equal("ooze", RiTa.singularize("oozes"));
      equal("enterprise", RiTa.singularize("enterprises"));
      equal("treatise", RiTa.singularize("treatises")); //->Known Issues
    });

    test("testIsRhymeStringString", function() {

        ok(!lex.isRhyme("solo   ", "tomorrow")); // Word with tab space
        ok(!lex.isRhyme("solo", "yoyo"));
        ok(!lex.isRhyme("yoyo", "jojo"));
    });


    test("testIsVerb", function() {

      ok(lex.isVerb("ducks")); // +n
      ok(lex.isVerb("dogs")); // +n
    });

    test("RiString.stripPunctuation(unicode)", function () {

        var res = RiTa.stripPunctuation("����������`',;:!?)He,;:!?)([].#l\"\\!@$%&}<>|+$%&}<>|+=-_\\o}<>|+=-_\\/*{^");
        equal(res, "Hello");
    });

    test("RiString.replaceWordAt()", function () {

        var rs = new RiString("Who are you?");
        rs.replaceWordAt(2,"");    // nice! this too...
        //equal(rs.text(), "Who are?"); // strange case, not sure
        equal(rs.text(), "Who are ?");
    });

    test("RiText.replaceWordAt()", function () {

        var rs = new RiText("Who are you?");
        rs.replaceWordAt(2,"");    // nice! this too...
        //equal(rs.text(), "Who are?"); // strange case, not sure
        equal(rs.text(), "Who are ?");
    });

    test("RiGrammar.expandWith()", function () { //TODO: fix impl.

        equal("fix impl.");
    });

    test("RiLexicon.rhymes", function () {
        var lex = RiLexicon();
         // Problem: no result
        var result = lex.rhymes("savage");
        var answer = [ "average", "ravage", "cabbage" ];
        deepEqual(result, answer);
    });

    test("RiTa.conjugate", function () {

      equal(RiTa.conjugate("make", {
        tense: RiTa.PAST_TENSE,
        number: RiTa.SINGULAR,
        person: RiTa.FIRST_PERSON
      }), "made");
    });
}

if (typeof exports != 'undefined') runtests(); //exports.unwrap = runtests;

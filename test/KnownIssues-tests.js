var runtests = function () {

    RiTa.SILENT = 1;

    // TODO: Cyrus-next
    test("RiTa.testTokenizeAndBack", function () {

      // tokenizeAndBack (this is working in java)
      var testStrings = [
        'A simple sentence.', '(that\'s why this is our place).',
        'The boy, dressed in red, ate an apple.',
        'Dr. Chan is talking slowly with Mr. Cheng, and the\'re friends.',
        'The boy screamed, "Where is my apple?"',
        'The boy screamed, \'Where is my apple?\'',
      ];

      for (var i = 0; i < testStrings.length; i++) {
        var tokens = RiTa.tokenize(testStrings[i]);
        var output = RiTa.untokenize(tokens);
        //console.log(expected,'\n',output);
        equal(output, testStrings[i]);
      }
    });

    test("RiTa.testUntokenize", function () {

      // untokenize (this is broken in both java/js)
      var input = ['"', 'Oh', 'God', ',', '"', 'he', 'thought', '.'];
      var expected = '"Oh God," he thought.';
      var output = RiTa.untokenize(input);
      //console.log(expected,'\n',output);
      deepEqual(output, expected);

      var input = ['She', 'screamed', ':', '"', 'Oh', 'God', '!', '"'];
      var expected = 'She screamed: "Oh God!"';
      var output = RiTa.untokenize(input);
      deepEqual(output, expected);
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

    test("RiLexicon.getSyllables", function () {
         var lex = RiLexicon();

 		// Problem: All punct is stripped except the &
        var result = lex._getSyllables("@#$%&*()");
        var answer = "";
        equal(result, answer);

   		// Problem: All punct is stripped except the &
        var result = lex._getPhonemes("@#$%&*()"); // ?
        var answer = "";
        equal(result, answer);

   		// Problem: All punct is stripped except the &
        var result = lex._getStresses("@#$%&*()");  // ?
        var answer = "";
        equal(result, answer);
    });

    test("RiLexicon.rhymes", function () {

        var lex = RiLexicon();

         // Problem: no result
        var result = lex.rhymes("savage");
        var answer = [ "average", "ravage", "cabbage" ];
        deepEqual(result, answer);
    });
    
    test("RiTa.singularize", function () { // TODO: Cyrus

        equal(RiTa.singularize("menus"),"menu");
        equal(RiTa.singularize("gurus"),"guru");
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

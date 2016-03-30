var runtests = function () {

    RiTa.SILENT = 1;

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

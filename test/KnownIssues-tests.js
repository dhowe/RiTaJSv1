var runtests = function () {

    RiTa.SILENT = 1;

    test("RiTa.getPosTags()", function () {

      deepEqual(RiTa.getPosTags("flunks"), [ "vbz" ]);
      deepEqual(RiTa.getPosTags("outnumbers"),  [ "vbz" ]);
      deepEqual(RiTa.getPosTags("I outnumber you"), [ "prp", "vbp", "prp" ]);

      deepEqual(RiTa.getPosTags("biped"), [ "nn" ]);

      //console.log(RiTa.getPosTags("He flunks the test"));


      var resultArr = RiTa.getPosTags("Dave dances");
      var answerArr = [ "nnp", "vbz" ];
      deepEqual(answerArr, resultArr);

      resultArr = RiTa.getPosTags("Elephants dance");
      answerArr =  [ "nns", "vbz" ];
      deepEqual(answerArr, resultArr);


      deepEqual(RiTa.getPosTags("He outnumbers us"),  [ "prp", "vbn",  "prp"]);
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

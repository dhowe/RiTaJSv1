
var runtests = function() {

  QUnit.module("arpaToIPA", {
    setup: function() {},
    teardown: function() {}
  });

  test("testArpaToIPA", function() {
     // 20 different examples without using LTS 
    var words = [ "become", "parsley", "garlic", "fall", "frost", "you", "going", "should", "say", "how", "now", "coat", "ratio", "trade", "treat", "begin", "end", "encounter", "range", "step"];
    var results = [ "bɪˈkʌm", "ˈpɑːɹs li", "ˈgɑːɹ lɪk", "fɔːl", "fɹɔːst", "juː", "ˈgəʊ ɪŋ", "ʃʊd", "seɪ", "haʊ", "naʊ", "kəʊt", "ˈɹeɪ ʃi əʊ", "tɹeɪd", "tɹiːt", "bɪˈgɪn", "ɛnd", "ɪnˈkaʊn tə", "ɹeɪndʒ", "stɛp"];

    var lex = RiTa.lexicon;

    for (var i = 0; i < words.length; i++) {
       var data = lex._getPhonemes(words[i], true);
       ok(results[i], arpaToIPA(data));
    }
  });

}

if (typeof exports != 'undefined') runtests();

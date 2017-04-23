
/*********** Test cases for different sizes ************/

// Note: you should run for '$ gulp make-sizes' before running these tests

console.warn = function(){}  // removes warnings from console output

var lex, result, word, words, expected;

/*********** rita-tiny ************/
RiTa = require('../dist/rita-full.js');
var obj = RiTa;
console.log(Object.keys(obj));
obj.prototype&&console.log(Object.keys(obj.prototype));
return;

word = new RiTa.RiString("autumn");
if (!word) throw Error("Fail: word undefined");

result = word.analyze().get("phonemes");
if (result) throw Error("Fail: phonemes defined");
//console.log("res: "+result);

// in word analyzing, only posTag works in tiny
result = RiTa.getPosTags("age");
expected =  ["nn"];
if (!arrayEquals(result, expected))
  throw Error("Fail " + result + ", " + expected);

// [Fail] dt is wrong
// result = RiTa.getPosTags("The dog ate the cat"),
//     expected =  ["dt","nn","vbd","dt","nn"];
// if (!arrayEquals(result, expected))
//   throw Error("Fail " + result + ", " + expected);

console.log('Tests passed for rita-tiny.js');

/*********** rita-small ************/
RiTa = require('../dist/rita-small.js'); // no LTS, lex1000

// if word doesn't exist in lex 1000, the word itself is returned?
result = RiTa.getPhonemes("autumn");
expected = "autumn";
if (!arrayEquals(result, expected))
  throw Error("Fail " + result + ", " + expected);

result = RiTa.RiString("autumn").analyze().get("phonemes");
if (!arrayEquals(result, expected))
  throw Error("Fail " + result + ", " + expected);

console.log('Tests passed for rita-small.js');


/***********         rita-medium            ************/
RiTa = require('../dist/rita-medium.js'); // LTS + lex1000

// word doesn't exist in lex 1000 -> LTS
result = RiTa.getPhonemes("autumn");
expected =  "ao-t-ah-m-n"; // "ao1 t-ah-m" in rita_dict.js
if (!arrayEquals(result, expected))
  throw Error("Fail " + result + ", " + expected);

result = RiTa.RiString("autumn").analyze().get("phonemes");
if (!arrayEquals(result, expected))
  throw Error("Fail " + result + ", " + expected);

// [Fail] vbd is wrong
// result = RiTa.getPosTags("The dog ate the cat"),
//     expected =  ["dt","nn","vbd","dt","nn"];
// if (!arrayEquals(result, expected))
//   throw Error("Fail " + result + ", " + expected);


// RiLexicon tests ------------------------------------
lex = new RiTa.RiLexicon();

// word in lex 1000
result = lex.similarBySound("cat");
expected = [ 'at', 'bat', 'can', 'catch', 'coat', 'cut', 'fat', 'hat', 'that' ];
if (!arrayEquals(result, expected))
  throw Error("Fail " + result + ", " + expected);

result = lex.similarByLetter("cat");
expected = [ 'at', 'bat', 'can', 'car', 'coat', 'cut', 'eat', 'fat', 'hat' ];
if (!arrayEquals(result, expected))
  throw Error("Fail " + result + ", " + expected);

result = lex.rhymes("cat");
expected = [ 'at', 'bat', 'fat', 'flat', 'hat', 'that' ];
if (!arrayEquals(result, expected))
  throw Error("Fail " + result + ", " + expected);

// word not in lex 1000
result = lex.similarBySound("umbrella");
expected = [ 'bell', 'bread', 'smell' ];
if (!arrayEquals(result, expected))
  throw Error("Fail " + result + ", " + expected);

result = lex.similarByLetter("umbrella");
expected = [ 'bell', 'smell' ];
if (!arrayEquals(result, expected))
  throw Error("Fail " + result + ", " + expected);

result = lex.isRhyme("bat", "mat");
expected = true;
if (!arrayEquals(result, expected))
  throw Error("Fail " + result + ", " + expected);

result = lex.rhymes("mat");
expected = [ 'at', 'bat', 'cat', 'fat', 'flat', 'hat', 'that' ];
if (!arrayEquals(result, expected))
  throw Error("Fail " + result + ", " + expected);

// no POS Tag returned
result = lex.isNoun("umbrella");
expected = false;
if (result != expected )
  throw Error("Fail " + result + ", " + expected);

result = lex.isAdjective("beautiful");
expected = false;
if (result != expected )
  throw Error("Fail " + result + ", " + expected);

console.log('Tests passed for rita-medium.js');


/*********** Syntax ************/

RiTa = require('../dist/rita-full.js');
expected = [ 'The', 'dog', 'ate', 'the', 'cat', '.' ]

words = RiTa.tokenize("The dog ate the cat.");
if (!arrayEquals(words, expected))
  throw Error("Fail1");

words = RiTa.RiTa.tokenize("The dog ate the cat.");
if (!arrayEquals(words, expected))
  throw Error("Fail2");

words = new RiTa.RiString("The dog ate the cat.");
if (!arrayEquals(words.get('tokens').split(' '), expected))
  throw Error("Fail3");

words = RiTa.RiString("The dog ate the cat.");
if (!arrayEquals(words.get('tokens').split(' '), expected))
  throw Error("Fail4");

console.log('Tests passed for syntax');


/*********** helpers ************/

function arrayEquals(a1,a2) {
  if (!a1 || !a2 || a1.length !== a2.length)
    return false;
  for (var i = 0; i < a1.length; i++) {
    if (a1[i] !== a2[i])
      return false;
  }
  return true;
}

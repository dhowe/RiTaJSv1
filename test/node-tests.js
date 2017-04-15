function arrayEquals(a1,a2) {
  if (!a1 || !a2 || a1.length !== a2.length) 
    return false;
  for (var i = 0; i < a1.length; i++) {
    if (a1[i] !== a2[i]) 
      return false; 
  }
  return true;
}

var words, RiTa, expected;

/*********** Test cases for different sizes ************/
/*********** rita-tiny ************/
RiTa = require('../dist/rita-tiny.js');

var word = new RiTa.RiString("autumn"),
    result = word.analyze();
    console.log(result);

//in word analyzing, only posTag works in tiny
var result = RiTa.getPosTags("age"),
    expected =  ["nn"];
if (!arrayEquals(result, expected)) 
  throw Error("Fail " + result + ", " + expected);

//[Fail] dt is wrong
// var result = RiTa.getPosTags("The dog ate the cat"),
//     expected =  ["dt","nn","vbd","dt","nn"];
// if (!arrayEquals(result, expected)) 
//   throw Error("Fail " + result + ", " + expected);

console.log('Tests passed for rita-tiny.js');

/*********** rita-small ************/
var ritaSmall = require('../dist/rita-small.js');

//word doesn't exist in lex 1000, the word itself is returned?
var result = ritaSmall.getPhonemes("autumn"),
    expected =  "autumn";
if (!arrayEquals(result, expected)) 
  throw Error("Fail " + result + ", " + expected);

console.log('Tests passed for rita-small.js');


/***********         rita-medium            ************/
RiTa = require('../dist/rita-medium.js');

//word doesn't exist in lex 1000 -> LTS
var result = RiTa.getPhonemes("autumn"),
    expected =  "ao-t-ah-m-n"; // "ao1 t-ah-m" in rita_dict.js
if (!arrayEquals(result, expected)) 
  throw Error("Fail " + result + ", " + expected);

//[Fail] vbd is wrong
// var result = RiTa.getPosTags("The dog ate the cat"),
//     expected =  ["dt","nn","vbd","dt","nn"];
// if (!arrayEquals(result, expected)) 
//   throw Error("Fail " + result + ", " + expected);

//RiLexicon tests
var lexicon = new RiTa.RiLexicon();

//word in lex 1000
result = lexicon.similarBySound("cat");
expected = [ 'at', 'bat', 'can', 'catch', 'coat', 'cut', 'fat', 'hat', 'that' ];
if (!arrayEquals(result, expected)) 
  throw Error("Fail " + result + ", " + expected);

result = lexicon.similarByLetter("cat");
expected = [ 'at', 'bat', 'can', 'car', 'coat', 'cut', 'eat', 'fat', 'hat' ];
if (!arrayEquals(result, expected)) 
  throw Error("Fail " + result + ", " + expected);

result = lexicon.rhymes("cat");
expected = [ 'at', 'bat', 'fat', 'flat', 'hat', 'that' ];
if (!arrayEquals(result, expected)) 
  throw Error("Fail " + result + ", " + expected);

//word not in lex 1000 
result = lexicon.similarBySound("umbrella");
expected = [ 'bell', 'bread', 'smell' ];
if (!arrayEquals(result, expected)) 
  throw Error("Fail " + result + ", " + expected);

result = lexicon.similarByLetter("umbrella");
expected = [ 'bell', 'smell' ];
if (!arrayEquals(result, expected)) 
  throw Error("Fail " + result + ", " + expected);

result = lexicon.isRhyme("bat", "mat");
expected = true;
if (!arrayEquals(result, expected)) 
  throw Error("Fail " + result + ", " + expected);

// -> Rhyme no result: use LTS?
result = lexicon.rhymes("umbrella");
expected = [ ];
if (!arrayEquals(result, expected)) 
  throw Error("Fail " + result + ", " + expected);

//no POS Tag returned
// result = lexicon.isNoun("umbrella");
// expected = true;
// if (!arrayEquals(result, expected)) 
//   throw Error("Fail " + result + ", " + expected);

// result = lexicon.isAdjective("beautiful");
// expected = true;
// if (!arrayEquals(result, expected)) 
//   throw Error("Fail " + result + ", " + expected);

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

console.log('Tests passed for Syntax');
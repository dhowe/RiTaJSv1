function arrayEquals(a1,a2) {
  if (!a1 || !a2 || a1.length !== a2.length) 
    return false;
  for (var i = 0; i < a1.length; i++) {
    if (a1[i] !== a2[i]) 
      return false; 
  }
  return true;
}

var words, RiTa, expected = [ 'The', 'dog', 'ate', 'the', 'cat', '.' ]

RiTa = require('../dist/rita-full.js');

words = RiTa.tokenize("The dog ate the cat.");
if (!arrayEquals(words, expected)) 
  throw Error("Fail1");

words = RiTa.RiTa.tokenize("The dog ate the cat.");
if (!arrayEquals(words, expected)) 
  throw Error("Fail2");

words = new RiTa.RiString("The dog ate the cat.");
if (!arrayEquals(words.get('tokens').split(' '), expected)) 
  throw Error("Fail3");

console.log('Tests passed');

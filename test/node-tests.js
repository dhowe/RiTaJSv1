var RiTa = require('../dist/rita-full.js');
var words = RiTa.tokenize("The dog ate the cat.");
console.log(words);

words = new RiTa.RiString("The dog ate the cat.");
words.analyze();
console.log(words);



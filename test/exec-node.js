var rita = require('./dist/rita');
var rg = rita.RiGrammar();

rg.addRule("<start>", "<first> | <second>");
rg.addRule("<first>", "the <pet> <action> were `temp()`");
rg.addRule("<second>", "the <action> of the `temp()` <pet>");
rg.addRule("<pet>", "<bird> | <mammal>");
rg.addRule("<bird>", "hawk | crow");
rg.addRule("<mammal>", "dog");
rg.addRule("<action>", "cries | screams | falls");

var temp = exports.temp = function() {
  return "hot";
}

function temp() {
  return "hot";
}

// The "this" value passed to eval must be the global object from which eval originated ?

var res = rg.expand();
//console.log(res);
if (res && !res.match("`") && res.match(/(hot|cold)/))
  console.log("ok");
else
  console.log("fail");

//console.log(rita);

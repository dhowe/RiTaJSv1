
var res, failed = 0, mod = require('./mod'), str = "RiTa.tokenize(\"The dog\")";

// test 1
mod.expand("1+1") === "2" || fail(1);

// test 2
mod.expand("RiTa.pluralize('dog')") === 'dogs' || fail(2);

// test 3
mod.expand("temp()", temp) === 'Hot' || fail(3);

// test 4
mod.expand("temp()", {temp: function(){ return 'Cold'; }}) === 'Cold' || fail(4);

// test 5
mod.expand("RiTa.tokenize('The dog')") || fail(5);

function temp() {
  return "Hot";
}

// helpers ----------------------------------------------------------

console.log(failed ? '' : 'Tests passed');

function fail(i, out) {
  failed++;
  console.error("Test #"+i+" failed"+(out ? ": "+out : "")+"\n");
}

function arrayEquals(a1, a2) {
  if (!a1 || !a2 || a1.length !== a2.length)
    return false;
  for (var i = 0; i < a1.length; i++) {
    if (a1[i] !== a2[i])
      return false;
  }
  return true;
}

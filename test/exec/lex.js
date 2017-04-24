// Scope class
//   aScope.eval(str) -- eval a string within the scope
//   aScope.newNames(name...) - adds vars to the scope
function Scope() {
  "use strict";
  this.names = [];
  this.eval = function(s) {
    return eval(s);
  };
}

Scope.prototype.put = function(name, val) {
  "use strict";
  var code = "(function() {\n";
  code += 'var ' + name + ' = '+val+';\n';
  code += 'return function(str) {return eval(str)};\n})()';
  this.eval = this.eval(code);
  this.names.push(name);
}

Scope.prototype.newNames = function() {

  "use strict";
  var names = [].slice.call(arguments);
  var newNames = names.filter((x)=> !this.names.includes(x));
  var newVals =  [10];

  if (newNames.length) {
    var i, len;
    var totalNames = newNames.concat(this.names);
    var code = "(function() {\n";
    for (i = 0, len = newNames.length; i < len; i++) {
      code += 'var ' + newNames[i] + ' = '+newVals[i]+';\n';
    }
    code += 'return function(str) {return eval(str)};\n})()';
    this.eval = this.eval(code);
    this.names = totalNames;
  }
}

function eight() {
  return 8;
}
// EXAMPLE RUN
var x = 10;
var scope = new Scope();
scope.put('x', 10);
scope.put('eight', eight);
console.log(scope.eval('eight()+x'));
/*console.log("Evaluating a var statement doesn't change the scope but newNames does (should return undefined)", scope.eval, 'var x = 4')
console.log("X in the scope object should raise 'x not defined' error", scope.eval, 'x');
console.log("X in the global scope should raise 'x not defined' error", eval, 'x');
console.log("Adding X and Y to the scope object");
scope.newNames('x', 'y');
console.log("Assigning x and y", scope.eval, 'x = 3; y = 4');
console.log("X in the global scope should still raise 'x not defined' error", eval, 'x');
console.log("X + Y in the scope object should be 7", scope.eval, 'x + y');
console.log("X + Y in the global scope should raise 'x not defined' error", eval, 'x + y');
*/

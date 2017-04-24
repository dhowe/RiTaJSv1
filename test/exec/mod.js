var RiTa = require('../dist/rita.js');

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

exports.expand = function (exec, context) {

  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  var res;
  try {

    res = eval(exec);
    return res ? res + '' : null;

  } catch (e) {

    //console.log("\nFailed mode1: "+e+ '\n\nTrying mode2');

    if (context) {

      var cxt = {};

      if (typeof context === 'function') {
        cxt[context.name] = context;
      }
      else if (typeof context === 'object') {
        Object.keys(context).forEach(function (f) {
          if (typeof context[f] === 'function')
              cxt[f] = context[f];
        });
      }

      var scope = new Scope();
      Object.keys(cxt).forEach(function (f) {
        scope.put(f, cxt[f]);
      });

      //console.log(scope);
      res = scope.eval(exec);
      //console.log("GOT: "+(res+''));
      return res ? res + '' : null;
    }

    return res ? res + '' : 'ERROR';
  }
}

//console.log(exports.expand('hello()',{}));
//console.log(exports.expand("1+1"));

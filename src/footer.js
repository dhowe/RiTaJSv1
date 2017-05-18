
/*jshint -W069 */

RiTa.lexicon = RiLexicon(); // create the lexicon

// add RiLexicon member functions to RiTa object
var funs = okeys(RiTa.lexicon);
for (var i = 0; i < funs.length; i++) {
  if (!startsWith(funs[i], '_')) {
    var f = RiTa.lexicon[funs[i]];
    if (is(f,F)) {
      RiTa[funs[i]] = f.bind(RiTa.lexicon);
      //console.log('RiTa.'+funs[i], typeof RiTa[funs[i]]);
    }
  }
}

if (window) { // for browser

  window['RiTa'] = RiTa;
  window['RiString'] = RiString;
  window['RiGrammar'] = RiGrammar;
  window['RiMarkov'] = RiMarkov;
  window['RiWordNet'] = RiWordNet;
  window['RiLexicon'] = RiLexicon;
  window['RiTaEvent'] = RiTaEvent;

  var rlfuns = okeys();

} else if (typeof module !== 'undefined') { // for node

  module.exports['RiTa'] = RiTa;
  module.exports['RiString'] = RiString;
  module.exports['RiGrammar'] = RiGrammar;
  module.exports['RiMarkov'] = RiMarkov;
  module.exports['RiWordNet'] = RiWordNet;
  module.exports['RiLexicon'] = RiLexicon;
  module.exports['RiTaEvent'] = RiTaEvent;

  // add RiTa.* functions directly to exported object
  var funs = okeys(RiTa);
  for (var i = 0; i < funs.length; i++) {
    if (!startsWith(funs[i], '_')) {
      module.exports[funs[i]] = RiTa[funs[i]];
    }
  }
}

/*jshint +W069 */

})(typeof window !== 'undefined' ? window : null);

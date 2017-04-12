
/*jshint -W069 */

if (window) { // for browser

  window['RiTa'] = RiTa;
  window['RiString'] = RiString;
  window['RiGrammar'] = RiGrammar;
  window['RiMarkov'] = RiMarkov;
  window['RiWordNet'] = RiWordNet;
  window['RiLexicon'] = RiLexicon;
  window['RiTaEvent'] = RiTaEvent;

} else if (typeof module !== 'undefined') { // for node

  module.exports['RiTa'] = RiTa;
  module.exports['RiString'] = RiString;
  module.exports['RiGrammar'] = RiGrammar;
  module.exports['RiMarkov'] = RiMarkov;
  module.exports['RiWordNet'] = RiWordNet;
  module.exports['RiLexicon'] = RiLexicon;
  module.exports['RiTaEvent'] = RiTaEvent;

  // add RiTa.* functions to returned object // ADDED: 4/11/17
  var funs = Object.keys(RiTa);
  for (var i = 0; i < funs.length; i++) {
    module.exports[funs[i]] = RiTa[funs[i]];
  }
}

/*jshint +W069 */

})(typeof window !== 'undefined' ? window : null);

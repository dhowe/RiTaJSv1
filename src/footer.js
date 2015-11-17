
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
}

// if (typeof p5 !== 'undefined') {
//   p5.prototype.registerPreloadMethod('loadFrom', RiGrammar.prototype);
//   p5.prototype.registerPreloadMethod('loadFrom', RiMarkov.prototype);
// }

/*jshint +W069 */

})(typeof window !== 'undefined' ? window : null);

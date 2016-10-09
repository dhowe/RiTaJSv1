$(document).ready(function () {

  var word, lexicon = new RiLexicon();
  var sy, ph, ss, hues = colorGradient();

  selectWord();
  setInterval(selectWord, 4000); // every 4 sec

  function selectWord() {

    // random word with <= 12 letters
    do {
      word = lexicon.randomWord();
    } while (word.length > 12);

    // get various features
    sy = RiTa.getSyllables(word);
    ph = RiTa.getPhonemes(word);
    ss = RiTa.getStresses(word);

    // get WordNet-style pos-tags
    var tags = RiTa.getPosTags(word, true);
    var pos = tagName(tags[0]);

    $('#word').text(word);
    $('#pos').text(pos);

    refreshBubble(ph.split('-'));
    addSyllables(sy);
    setTimeout(drop, 2000);
  }

  function refreshBubble(phs) {

    $('.bubbles').children().each(function (i, val) {

      // reset the bubbles
      $(this).css({
        'border-radius': '20px',
        'width': '40px',
        'height': '40px',
        'line-height': '40px',
        'margin-left': ' 5px',
        'margin-top': ' 5px'
      });

      if (i < phs.length) { // change the phones and color

        $(this).text(phs[i]);
        $(this).css("background-color", "hsla(" + phonemeColor(phs[i]) + ", 90%, 45%, 0.6)");
        addStress(ss, sy);

      } else { // clear the old bubbles

        $(this).text("");
        $(this).css("background-color", "transparent");
      }

    });
  }

  function drop() {
    $('.bubbles').children().each(function (index) {
      (function (that, i) {
        var t = setTimeout(function () {
          $(that).animate({
            'margin-top': 150,
          }, "slow");
        }, 40 * i);
      })(this, index);
    });
  }

  function addSyllables(syllables) {
    var syllable = syllables.split("/");
    for (var i = 0, past = 0; i < syllable.length; i++) {
      var phs = syllable[i].split("-");
      for (var j = 1; j < phs.length; j++) {
        (function (j) {
          $('.bubbles').children().eq(j + past).css("margin-left", "-15px");
        })(j);
      }
      past += phs.length;
    }
  }

  function addStress(stresses, syllables, bubbles) {

    // Split stresses and syllables
    var stress = stresses.split('/'), syllable = syllables.split('/');

    for (var i = 0, past = 0; i < stress.length; i++) {

      var phs = syllable[i].split('-');

      // if the syllable is stressed, grow its bubbles
      if (parseInt(stress[i]) == 1) {
        for (var j = 0; j < phs.length; j++) {
          (function (j) {
            $('.bubbles').children().eq(j + past).css({
              'border-radius': '25px',
              'width': '50px',
              'height': '50px',
              'line-height': '50px',
              'margin-top': '0px'
            });
          })(j);
        }
      }
      past += phs.length;
    }
  }

  function tagName(tag) {
    if (tagsDict == null) {
      var tagsDict = {
        'n': 'Noun',
        'v': 'Verb',
        'r': 'Adverb',
        'a': 'Adjective'
      };
    }
    return tag != null ? tagsDict[tag] : null;
  }

  function phonemeColor(phoneme) {
    var idx = RiTa.ALL_PHONES.indexOf(phoneme);
    return idx > -1 ? hues[idx] : 0;
  }

  function colorGradient() {
    var tmp = [];
    for (var i = 0; i < RiTa.ALL_PHONES.length; i++) {
      var h = Math.floor(map(i, 0, RiTa.ALL_PHONES.length, .2 * 360, .8 * 360));
      tmp[i] = h;
    }
    return tmp;
  }

  function map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
  }

}); //jquery wrapper

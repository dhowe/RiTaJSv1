var IPA_STRESS = "ˈ",
    IPA_2NDSTRESS = "ˌ";

var amap = {
    "aa": "ɑ", // ɑ or ɒ
    "ae": "æ", // ɑː or æ 
    "ah": "ə", // ə for 'sofa': 'alone'; ʌ for 'but': 'sun'
    "ao": "ɔ",
    "aw": "aʊ",
    "ay": "aɪ",
    "b": "b",
    "ch": "tʃ",
    "d": "d",
    "dh": "ð",
    "eh": "ɛ",
    "er": "ə", // ə or ɚ 
    "ey": "eɪ",
    "f": "f",
    "g": "g", // g or ɡ (view the difference in notepad)
    "hh": "h",
    "ih": "ɪ",
    "iy": "i",
    "jh": "dʒ",
    "k": "k",
    "l": "l",
    "m": "m",
    "ng": "ŋ",
    "n": "n",
    "ow": "əʊ", // əʊ for NAmE; or oʊ in BrE
    "oy": "ɔɪ",
    "p": "p",
    "r": "ɹ", // r or ɹ
    "sh": "ʃ",
    "s": "s",
    "th": "θ",
    "t": "t",
    "uh": "ʊ",
    "uw": "u",
    "v": "v",
    "w": "w",
    "y": "j",
    "z": "z",
    "zh": "ʒ"
};

function arpaToIPA(phones) {

    //console.log("arpaToIPA("+phones+")");

    var syllables = phones.trim().split(RiTa.WORD_BOUNDARY),
        ipaPhones ="";

    var needStress = true;

    if (syllables.length == 1) {
        // one-syllable words dont get stresses 
        needStress = false;
    }

    for (var i = 0; i < syllables.length; i++) {
        ipaPhones = syllableToIPA(syllables[i], needStress)
    }

    return ipaPhones;
}

function syllableToIPA(arpaSyl, needStress) {

    var primarystressed = false,
        secondarydStressed = false;

    // handle stressed vowel syllables see https://github.com/dhowe/RiTa/issues/296
    var isAAStressed = false,
        isERStressed = false,
        isIYStressed = false,
        isAOStressed = false,
        isUWStressed = false;

    var isAHStressed = false,
        isAEStressed = false;

    var ipaSyl = "", arpaPhones = arpaSyl.trim().split(RiTa.PHONEME_BOUNDARY);

    for (var i = 0; i < arpaPhones.length; i++) {
        var arpaPhone = arpaPhones[i];
        //System.out.println(arpaPhone);

        var stress = arpaPhone.charAt(arpaPhone.length - 1);

        if (stress == RiTa.UNSTRESSED) // no stress
            arpaPhone = arpaPhone.substring(0, arpaPhone.length() - 1);
        else if (stress == RiTa.STRESSED) { // primary stress
            arpaPhone = arpaPhone.substring(0, arpaPhone.length() - 1);
            primarystressed = true;

            if (arpaPhone.equals("aa")) isAAStressed = true;
            else if (arpaPhone.equals("er")) isUWStressed = true;
            else if (arpaPhone.equals("iy")) isIYStressed = true;
            else if (arpaPhone.equals("ao")) isUWStressed = true;
            else if (arpaPhone.equals("uw")) isUWStressed = true;

            else if (arpaPhone.equals("ah")) isAHStressed = true;
            else if (arpaPhone.equals("ae") && arpaPhones.length > 2 // 'at'
                && !arpaPhones[i > 0 ? i - 1 : i].equals("th") // e.g. for 'thank', 'ae1' is always 'æ'
                && !arpaPhones[i > 0 ? i - 1 : i].equals("dh") // 'that'
                && !arpaPhones[i > 0 ? i - 1 : i].equals("m") // 'man'
                && !arpaPhones[i > 0 ? i - 1 : i].equals("k")) // 'catnip'
                isAEStressed = true;
        } else if (stress == '2') { // secondary stress
            arpaPhone = arpaPhone.substring(0, arpaPhone.length() - 1);
            secondarydStressed = true;

            if (arpaPhone.equals("ah")) isAHStressed = true;
        }

        var IPASyl = phoneToIPA(arpaPhone);

        if (isAAStressed || isERStressed || isIYStressed || isAOStressed || isUWStressed) IPASyl += "ː";
        else if (isAHStressed) IPASyl = "ʌ";
        else if (isAEStressed) IPASyl = "ɑː";

        isAAStressed = false;
        isERStressed = false;
        isIYStressed = false;
        isAOStressed = false;
        isUWStressed = false;

        isAHStressed = false;
        isAEStressed = false;
        
        ipaSyl += IPASyl;
    }

    if (needStress && primarystressed) ipaSyl.insert(0, IPA_STRESS);
    else if (needStress && secondarydStressed) ipaSyl.insert(0, IPA_2NDSTRESS);

    return ipaSyl;
}

function phoneToIPA(arpaPhone) {
    ipaPhoneme = amap[arpaPhone];
    if (ipaPhoneme == null) {
        console.error("Unexpected Phoneme: " + arpaPhone);
    }
    return ipaPhoneme;
}
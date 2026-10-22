/* =========================================================================
 * js/translit.js
 * Text sanitization, Cantonese/Pinyin romanization, and URL query parser.
 * ========================================================================= */

var pinyinVowelMap = {
    "ā": ["a", "1"], "á": ["a", "2"], "ǎ": ["a", "3"], "à": ["a", "4"],
    "ē": ["e", "1"], "é": ["e", "2"], "ě": ["e", "3"], "è": ["e", "4"],
    "ī": ["i", "1"], "í": ["i", "2"], "ǐ": ["i", "3"], "ì": ["i", "4"],
    "ō": ["o", "1"], "ó": ["o", "2"], "ǒ": ["o", "3"], "ò": ["o", "4"],
    "ū": ["u", "1"], "ú": ["u", "2"], "ǔ": ["u", "3"], "ù": ["u", "4"],
    "ǖ": ["v", "1"], "ǘ": ["v", "2"], "ǚ": ["v", "3"], "ǜ": ["v", "4"],
    "ü": ["v", ""]
};

function pinyinToNumbered(s) {
    if (!s) return "";
    var str = s.toLowerCase();
    var sylRegex = /(zh|ch|sh|[bpmfdtnlgkhzcsryw]?)([aeiouüv\u00c0-\u024f]+)(ng|n|r)?/gi;
    return str.replace(sylRegex, function(match, init, vow, fin) {
        var tone = "";
        var cleanVow = "";
        for (var i = 0; i < vow.length; i++) {
            var ch = vow[i];
            if (pinyinVowelMap[ch]) {
                cleanVow += pinyinVowelMap[ch][0];
                if (pinyinVowelMap[ch][1]) tone = pinyinVowelMap[ch][1];
            } else {
                cleanVow += ch;
            }
        }
        return (init || "") + cleanVow + (fin || "") + tone;
    });
}

function clean(s)
{
    if (s === undefined || s === null) return "";
    var str = String(s);

    // Remove parenthesized annotations such as (masc.), (fem.), (sb), (not young), etc.
    var res = str.replace(/\([^)]*\)/g, "");

    // Forgive Hebrew Niqqud, vowel points, dagesh, and cantillation marks (U+0591 to U+05C7)
    res = res.replace(/[\u0591-\u05C7]/g, "");

    // Forgive any errors in punctuation (commas, periods, question marks, exclamation points, colons, quotes, etc.)
    try {
        res = res.replace(/[\p{P}\p{S}]/gu, "");
    } catch (e) {
        res = res.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'״׳„“”‘’«»¿¡\u05BE\u05C0\u05C3\u05F3\u05F4，。！？；：、]/g, "");
    }

    if (typeof forgiveTones !== "undefined" && forgiveTones)
    {
        return res.normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/ü/gi, "u")
                .replace(/v/gi, "u")
                .replace(/[ 1-9\s]/g, "")
                .toLowerCase();
    }

    var cat = (typeof getLessonCategory === "function") ? getLessonCategory() : "";
    var isMandarin = (typeof activeSessionLanguage !== "undefined" && activeSessionLanguage === "mandarin") || (cat.indexOf("mandarin") !== -1);
    if (isMandarin || /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǜ]/i.test(res))
    {
        res = pinyinToNumbered(res);
    }

    return res.replace(/\s+/g, "")
            .replace(/ü/gi, "v")
            .replace(/7/g, "1")
            .replace(/8/g, "3")
            .replace(/9/g, "6")
            .toLowerCase();
}

function getQueryText(s)
{
    return Ytping2Jyutping(clean(s.split("/")[0]))
        .replace(/([1-6])/g, "$1+")
        .replace(/\+$/, "");
}

function Jyutping2Ytping(s)
{
    return s.replace(/jyu/g, "y")
        .replace(/yu/g, "y")
        .replace(/([^a])ai/g, "$1aei")
        .replace(/eoi/g, "oey")
        .replace(/eon/g, "oen")
        .replace(/(^|[^d])z/g, "$1dz")
        .replace(/c/g, "ts")
        .replace(/([ptk])1/g, "$17")
        .replace(/([ptk])3/g, "$18")
        .replace(/([ptk])6/g, "$19");
}

function Ytping2Jyutping(s)
{
    return s.replace(/ts/g, "c")
        .replace(/dz/g, "z")
        .replace(/oey/g, "eoi")
        .replace(/oen([^g])/g, "eon$1")
        .replace(/aei/g, "ai")
        .replace(/y([^u])/g, "yu$1")
        .replace(/(^|\d|\s)y/g, "$1jy");
}

function replaceJyutpingTones(text) {
    if (typeof text !== "string") return text;
    return text.replace(/7/g, "1")
               .replace(/8/g, "3")
               .replace(/9/g, "6");
}

function transliterate(s)
{
    if (typeof presentYtping !== "undefined" && presentYtping == true)
    {
        s = Jyutping2Ytping(s);
    }
    return s;
}

function escapeHtmlAttr(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter
var QueryString = function () {
    var query_string = {};
    if (typeof window === "undefined" || !window.location || !window.location.search) {
        return query_string;
    }
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0; i<vars.length; i++) {
        var pair = vars[i].split("=");
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = pair[1];
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [ query_string[pair[0]], pair[1] ];
            query_string[pair[0]] = arr;
        } else {
            query_string[pair[0]].push(pair[1]);
        }
    } 
    return query_string;
} ();

function isDebugMode() {
    try {
        if (typeof window !== "undefined" && window.location) {
            if (/(?:[?&])debug=1(?:&|$)/.test(window.location.search || window.location.href)) {
                return true;
            }
        }
    } catch (e) {}
    return (typeof QueryString !== "undefined" && QueryString && QueryString.debug === "1");
}

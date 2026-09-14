var lines = new Array();
var index=GetRandomIndex();
var lastIndex=index;
var presentYtping = false;
var linkToDictionary;
var forgiveTones=false;
var autoLoop=false;

var appSettings = {
    romanization: "jyutping",
    speakQuestions: false,
    speakAnswers: false,
    passiveMode: false,
    questionTimeoutSec: 3.5,
    decayTimeoutSec: 2.5,
    completedLessons: ["lessons/CP.1.txt"], // default to CP.1.txt if none selected
    aiSentenceCount: 25
};

var passiveQuestionTimer = null;
var passiveDecayTimer = null;

function loadSettings() {
    try {
        if (typeof localStorage !== "undefined") {
            var rom = localStorage.getItem("flashtype_romanization");
            if (rom === "yale" || rom === "jyutping") {
                appSettings.romanization = rom;
            }
            if (localStorage.getItem("flashtype_speak_questions") !== null) {
                appSettings.speakQuestions = localStorage.getItem("flashtype_speak_questions") === "true";
            }
            if (localStorage.getItem("flashtype_speak_answers") !== null) {
                appSettings.speakAnswers = localStorage.getItem("flashtype_speak_answers") === "true";
            }
            if (localStorage.getItem("flashtype_passive_mode") !== null) {
                appSettings.passiveMode = localStorage.getItem("flashtype_passive_mode") === "true";
            }
            var qTimeout = parseFloat(localStorage.getItem("flashtype_q_timeout"));
            if (!isNaN(qTimeout) && qTimeout >= 1) {
                appSettings.questionTimeoutSec = qTimeout;
            }
            var dTimeout = parseFloat(localStorage.getItem("flashtype_d_timeout"));
            if (!isNaN(dTimeout) && dTimeout >= 0.5) {
                appSettings.decayTimeoutSec = dTimeout;
            }
            var completed = localStorage.getItem("flashtype_completed_lessons");
            if (completed) {
                try {
                    var parsed = JSON.parse(completed);
                    if (Array.isArray(parsed)) {
                        appSettings.completedLessons = parsed;
                    }
                } catch (pe) {}
            }
            var aiCnt = parseInt(localStorage.getItem("flashtype_ai_sentence_count"), 10);
            if (!isNaN(aiCnt) && aiCnt >= 1 && aiCnt <= 50) {
                appSettings.aiSentenceCount = aiCnt;
            }
        }
    } catch (e) {
        console.warn("Could not load settings from localStorage", e);
    }
    presentYtping = (appSettings.romanization === "yale");
}

function saveSettings() {
    try {
        if (typeof localStorage !== "undefined") {
            localStorage.setItem("flashtype_romanization", appSettings.romanization);
            localStorage.setItem("flashtype_speak_questions", appSettings.speakQuestions);
            localStorage.setItem("flashtype_speak_answers", appSettings.speakAnswers);
            localStorage.setItem("flashtype_passive_mode", appSettings.passiveMode);
            localStorage.setItem("flashtype_q_timeout", appSettings.questionTimeoutSec);
            localStorage.setItem("flashtype_d_timeout", appSettings.decayTimeoutSec);
            localStorage.setItem("flashtype_completed_lessons", JSON.stringify(appSettings.completedLessons));
            localStorage.setItem("flashtype_ai_sentence_count", appSettings.aiSentenceCount || 25);
        }
    } catch (e) {
        console.warn("Could not save settings to localStorage", e);
    }
}

function clearPassiveTimers() {
    if (passiveQuestionTimer) {
        clearTimeout(passiveQuestionTimer);
        passiveQuestionTimer = null;
    }
    if (passiveDecayTimer) {
        clearTimeout(passiveDecayTimer);
        passiveDecayTimer = null;
    }
}

function updatePassiveModeUI() {
    if (typeof $ === "undefined") return;
    if (appSettings.passiveMode) {
        $("#interactive_controls").hide();
        $("#passive_indicator").show();
    } else {
        $("#passive_indicator").hide();
        $("#interactive_controls").show();
    }
}

function startPassiveQuestionTimer() {
    clearPassiveTimers();
    if (!appSettings.passiveMode) return;
    if (typeof lines === "undefined" || !lines || lines.length === 0) return;
    if (typeof $ !== "undefined") {
        $("#passive_status").text("Thinking... (revealing answer soon)");
    }
    var qMs = Math.max(1000, (appSettings.questionTimeoutSec || 3.5) * 1000);
    passiveQuestionTimer = setTimeout(function() {
        handlePassiveAnswerReveal();
    }, qMs);
}

function handlePassiveAnswerReveal() {
    if (!appSettings.passiveMode || typeof lines === "undefined" || !lines || !lines[index]) return;
    var correctAnswers = transliterate(lines[index]).split(":")[1].split("/");
    var primaryAnswer = correctAnswers[0].trim();
    if (typeof $ !== "undefined") {
        $("#feedback")[0].innerHTML = "Answer: <span class=\"correct\">" + correctAnswers.join(" / ") + "</span>";
        $("#answer").val(primaryAnswer);
        $("#passive_status").text("Next question coming up...");
    }
    if (appSettings.speakAnswers) {
        speakAnswer(primaryAnswer);
    }
    var decayMs = Math.max(500, (appSettings.decayTimeoutSec || 2.5) * 1000);
    passiveDecayTimer = setTimeout(function() {
        if (appSettings.passiveMode) {
            showNext();
        }
    }, decayMs);
}

function applySettings() {
    presentYtping = (appSettings.romanization === "yale");
    if (typeof lines !== "undefined" && lines && lines.length > 0) {
        updateList(lines);
    }
    updatePassiveModeUI();
    if (appSettings.passiveMode) {
        if (typeof $ !== "undefined" && $("#stage").is(":visible") && typeof index !== "undefined" && lines && lines[index]) {
            startPassiveQuestionTimer();
        }
    } else {
        clearPassiveTimers();
    }
}

function renderLessonChecklist() {
    if (typeof $ === "undefined" || typeof lessonFiles === "undefined") return;
    var container = $("#settings_lessons_list");
    if (container.length === 0) return;

    var html = "";
    var currentGroup = "";

    for (var i = 1; i < lessonFiles.length; i++) { // skip 0 (Test)
        var l = lessonFiles[i];
        var isChecked = (appSettings.completedLessons && appSettings.completedLessons.indexOf(l.file) !== -1);
        html += '<label class="lesson-check-item">' +
            '<input type="checkbox" class="lesson-chk" data-file="' + l.file + '" ' + (isChecked ? 'checked' : '') + ' onchange="onLessonCheckChange()">' +
            '<span>' + l.name + '</span>' +
            '<span class="lesson-check-category">' + l.category + '</span>' +
            '</label>';
    }
    container.html(html);
}

function onLessonCheckChange() {
    var checked = [];
    $(".lesson-chk:checked").each(function() {
        var f = $(this).attr("data-file");
        if (f) checked.push(f);
    });
    appSettings.completedLessons = checked;
    saveSettings();
    updateAiGenStatusText();
}

function selectAllLessons(select) {
    $(".lesson-chk").prop("checked", !!select);
    onLessonCheckChange();
}

function selectCantoneseLessons() {
    $(".lesson-chk").each(function() {
        var cat = $(this).siblings(".lesson-check-category").text();
        if (cat && cat.toLowerCase().indexOf("cantonese") !== -1) {
            $(this).prop("checked", true);
        } else {
            $(this).prop("checked", false);
        }
    });
    onLessonCheckChange();
}

function updateAiGenStatusText() {
    var count = (appSettings.completedLessons || []).length;
    var countText = count + " lesson" + (count === 1 ? "" : "s") + " selected";
    $("#ai_selected_count").text(countText);
    if ($("#ai_sentence_count").length) {
        $("#ai_sentence_count").val(appSettings.aiSentenceCount || 25);
    }
}

function onAiSentenceCountChange() {
    var val = parseInt($("#ai_sentence_count").val(), 10) || 25;
    appSettings.aiSentenceCount = val;
    saveSettings();
}

function syncSettingsUI() {
    if (typeof $ === "undefined") return;
    if (appSettings.romanization === "yale") {
        $("#rom_yale").prop("checked", true);
    } else {
        $("#rom_jyutping").prop("checked", true);
    }
    $("#setting_speak_questions").prop("checked", appSettings.speakQuestions);
    $("#setting_speak_answers").prop("checked", appSettings.speakAnswers);
    $("#setting_passive_mode").prop("checked", appSettings.passiveMode);
    $("#setting_q_timeout").val(appSettings.questionTimeoutSec);
    $("#setting_d_timeout").val(appSettings.decayTimeoutSec);

    if (appSettings.passiveMode) {
        $("#passive_time_options").show();
    } else {
        $("#passive_time_options").hide();
    }

    renderLessonChecklist();
}

function onSettingChange() {
    if (typeof $ === "undefined") return;
    var romVal = $("input[name='romanization_pref']:checked").val() || "jyutping";
    appSettings.romanization = romVal;
    appSettings.speakQuestions = $("#setting_speak_questions").is(":checked");
    appSettings.speakAnswers = $("#setting_speak_answers").is(":checked");
    appSettings.passiveMode = $("#setting_passive_mode").is(":checked");

    var qVal = parseFloat($("#setting_q_timeout").val());
    if (!isNaN(qVal) && qVal >= 1) {
        appSettings.questionTimeoutSec = qVal;
    }
    var dVal = parseFloat($("#setting_d_timeout").val());
    if (!isNaN(dVal) && dVal >= 0.5) {
        appSettings.decayTimeoutSec = dVal;
    }

    if (appSettings.passiveMode) {
        $("#passive_time_options").slideDown(150);
    } else {
        $("#passive_time_options").slideUp(150);
    }

    saveSettings();
    applySettings();
}

function openSettingsModal() {
    syncSettingsUI();
    if (typeof $ !== "undefined") {
        $("#settings_modal").fadeIn(150);
    }
}

function closeSettingsModal() {
    if (typeof $ !== "undefined") {
        $("#settings_modal").fadeOut(150);
    }
}

loadSettings();

function set(n)
{
    this.data = new Array();
    for (var i=0; i<n; i++)
    {
       this.data[i] = false;
    }
    this.add = add;
    this.contains = contains;
    this.size = size;
    this.max = n;

    function add(k) { this.data[k] = true; }
    function contains(k) { return !!this.data[k]; }
    function size() { return this.data.reduce(function(a,b) { return a+(b?1:0); }, 0); }
}
var seen = new set(2);


function checkPress(e)
{
    var charCode = (typeof e.which === "number") ? e.which : e.keyCode;
    if (charCode == 13 && e.ctrlKey)
    {
        showNextUnseen();
    }
    else if (charCode == 13)
    {
        checkAnswer();
    }
}

function clean(s)
{
    if (forgiveTones)
    {
        return s.replace(/\([\w .]*\)/g, "")
                .replace(/[ 1-9]/g, "")
                .toLowerCase();
    }
    return s.replace(/\([\w .]*\)/g, "")
            .replace(/ /g, "")
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

function playAnswer(s)
{
    return playAudio("aud_question", s);
}

function playAudio(e, s)
{
    s = s.replace(/ /g, "_")
         .replace(/\?/g, "")
         .replace(/^_/g, "")
         .replace(/_$/g, "");
    var audioEl = document.getElementById(e);
    if (!audioEl) return 0;
    var sourceEl = audioEl.querySelector("source");
    if (sourceEl) {
        sourceEl.src = "audio/" + s + ".wav";
    }
    try {
        audioEl.load();
        var playPromise = audioEl.play();
        if (playPromise !== undefined) {
            playPromise.catch(function() {
                // Audio file might not exist or autoplay policy blocked it
            });
        }
        return audioEl.duration || 0;
    } catch (err) {
        return 0;
    }
}

// Speech Synthesis Helpers
function replaceJyutpingTones(text) {
    if (typeof text !== "string") return text;
    return text.replace(/7/g, "1")
               .replace(/8/g, "3")
               .replace(/9/g, "6");
}

var activeSessionLanguage = ""; // Track language when sentences are dynamically generated or loaded
var sessionCharactersMap = {}; // Maps jyutping answer to Cantonese characters if available

function isJyutpingOrYale(text) {
    if (typeof text !== "string") return false;
    var trimmed = text.trim();
    // Check if text has Jyutping tones (1-6) or Yale tone markers
    if (/[a-z]{1,6}[1-6]/i.test(trimmed)) return true;
    // Common Cantonese syllable patterns
    var commonSyllables = /\b(ngo5|nei5|keoi5|hai2|dou6|sik6|je5|m4|hou2|jiu3|soeng2|ge3|laa1|aa3|maa3|zou6|dim2|sin1|heoi3|lai4)\b/i;
    return commonSyllables.test(trimmed);
}

function speakText(text, lang, speakSourceText) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
    }
    try {
        window.speechSynthesis.cancel();
        var targetText = speakSourceText || text;
        var cleanText = targetText.replace(/[\(\)]/g, "");
        if (!speakSourceText) {
            cleanText = replaceJyutpingTones(cleanText).trim();
        } else {
            cleanText = cleanText.trim();
        }
        if (!cleanText) return;

        var utterance = new SpeechSynthesisUtterance(cleanText);
        if (lang) {
            utterance.lang = lang;
        }

        // Voice selection: find matching Cantonese or target language voice
        var voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0 && lang) {
            var targetLangLower = lang.toLowerCase();
            var targetLangPrefix = targetLangLower.split("-")[0];
            var matchedVoice = null;

            // Prioritize Cantonese voice (zh-HK, Cantonese, or Yue)
            if (targetLangLower === "zh-hk" || targetLangLower.indexOf("cantonese") !== -1) {
                for (var v = 0; v < voices.length; v++) {
                    var vName = (voices[v].name || "").toLowerCase();
                    var vLang = (voices[v].lang || "").replace(/_/g, "-").toLowerCase();
                    if (vLang === "zh-hk" || vName.indexOf("cantonese") !== -1 || vName.indexOf("hong kong") !== -1 || vLang.indexOf("yue") !== -1) {
                        matchedVoice = voices[v];
                        break;
                    }
                }
            }

            // Exact language match (e.g. es-ES, pl-PL)
            if (!matchedVoice) {
                for (var i = 0; i < voices.length; i++) {
                    var vLangExact = (voices[i].lang || "").replace(/_/g, "-").toLowerCase();
                    if (vLangExact === targetLangLower) {
                        matchedVoice = voices[i];
                        break;
                    }
                }
            }

            // Prefix match (e.g. zh, es, pl)
            if (!matchedVoice && targetLangPrefix) {
                for (var k = 0; k < voices.length; k++) {
                    var vLangPrefix = (voices[k].lang || "").replace(/_/g, "-").toLowerCase();
                    if (vLangPrefix.indexOf(targetLangPrefix) === 0) {
                        matchedVoice = voices[k];
                        break;
                    }
                }
            }

            if (matchedVoice) {
                utterance.voice = matchedVoice;
            }
        }

        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.error("Speech synthesis error:", e);
    }
}

function getLessonCategory() {
    if (activeSessionLanguage) {
        return activeSessionLanguage.toLowerCase();
    }
    if (typeof lessonFiles === "undefined") return "";
    var selectEl = document.getElementById("lesson");
    if (!selectEl) return "";
    var idx = selectEl.value;
    if (idx && lessonFiles[idx]) {
        return (lessonFiles[idx].category || "").toLowerCase();
    }
    return "";
}

function getQuestionLanguage(text) {
    if (typeof text === "string") {
        if (/[\u0370-\u03FF]/.test(text)) return "el-GR";
        if (/[\u0590-\u05FF]/.test(text)) return "he-IL";
        if (/[\u4E00-\u9FFF]/.test(text)) return "zh-HK";
    }
    return "en-US";
}

function getAnswerLanguage(text) {
    if (typeof text === "string") {
        if (/[\u0370-\u03FF]/.test(text)) return "el-GR";
        if (/[\u0590-\u05FF]/.test(text)) return "he-IL";
        if (/[\u4E00-\u9FFF]/.test(text)) return "zh-HK";
    }
    var cat = getLessonCategory();
    if (cat.indexOf("polish") !== -1) return "pl-PL";
    if (cat.indexOf("spanish") !== -1) return "es-ES";
    if (cat.indexOf("greek") !== -1) return "el-GR";
    if (cat.indexOf("hebrew") !== -1) return "he-IL";
    if (cat.indexOf("mandarin") !== -1) return "zh-CN";
    if (cat.indexOf("cantonese") !== -1) return "zh-HK";

    // If text contains Romanized Cantonese (Jyutping / Yale tone digits)
    if (isJyutpingOrYale(text)) {
        return "zh-HK";
    }

    return "en-US";
}

var lastQuestionSpeechTime = 0;
function readQuestion(e) {
    if (e && e.stopPropagation) {
        e.stopPropagation();
    }
    var now = Date.now();
    if (now - lastQuestionSpeechTime < 200) {
        return;
    }
    lastQuestionSpeechTime = now;
    if (typeof lines === "undefined" || typeof index === "undefined" || !lines || !lines[index]) {
        return;
    }
    var question = lines[index].split(":")[0];
    if (!question) return;
    var textToSpeak = question.replace(/\//g, ", ").trim();
    speakText(textToSpeak, getQuestionLanguage(question));
}

function speakAnswer(answerText) {
    if (!answerText) return;
    // Only read aloud one variant if there is more than one
    var singleAns = answerText.split("/")[0].trim();
    var lang = getAnswerLanguage(singleAns);

    // If we have standard Cantonese characters mapped for this generated sentence,
    // feeding the Hanzi directly into the Web Speech API (with lang: zh-HK) produces
    // natural, native Cantonese speech rather than spelling out romanized letters.
    var speakSrc = "";
    var rawKey = clean(singleAns);
    if (sessionCharactersMap && sessionCharactersMap[rawKey]) {
        speakSrc = sessionCharactersMap[rawKey];
        lang = "zh-HK";
    }

    speakText(singleAns, lang, speakSrc);
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

var lastVocabSpeechTime = 0;
function readVocabAnswer(e, el) {
    if (e && e.stopPropagation) {
        e.stopPropagation();
    }
    if (e && e.preventDefault) {
        e.preventDefault();
    }
    var now = Date.now();
    if (now - lastVocabSpeechTime < 200) {
        return;
    }
    lastVocabSpeechTime = now;
    var answerText = "";
    if (typeof el === "string") {
        answerText = el;
    } else if (el && el.getAttribute) {
        answerText = el.getAttribute("data-answer") || "";
    }
    if (!answerText && el && el.parentElement) {
        answerText = $(el.parentElement).clone().children(".speaker-btn").remove().end().text().trim();
    }
    if (answerText) {
        speakAnswer(answerText);
    }
}

if (typeof $ !== "undefined") {
    $(document).on("click", "#speaker_question", function(e) {
        readQuestion(e);
    });
    $(document).on("keydown", "#speaker_question", function(e) {
        if (e.which === 13 || e.which === 32) {
            e.preventDefault();
            readQuestion(e);
        }
    });
    $(document).on("click", ".speaker-vocab", function(e) {
        readVocabAnswer(e, this);
    });
    $(document).on("keydown", ".speaker-vocab", function(e) {
        if (e.which === 13 || e.which === 32) {
            e.preventDefault();
            readVocabAnswer(e, this);
        }
    });
    $(document).on("keydown", function(e) {
        if (e.which === 27) { // Escape
            if ($("#settings_modal").is(":visible")) {
                closeSettingsModal();
            }
        }
    });
    $(document).on("click", "#settings_modal", function(e) {
        if ($(e.target).is("#settings_modal")) {
            closeSettingsModal();
        }
    });
}

function checkAnswer()
{
    var answer=$("#answer")[0].value;
    var correctAnswers= transliterate(lines[index]).split(":")[1].split("/");
    var answerIdx = Math.floor(Math.random() * correctAnswers.length);
    playAnswer(correctAnswers[answerIdx]);
    var gotAnswer=false;
    for (var i=0;i<correctAnswers.length;i++)
    {
        if (clean(answer)==clean(correctAnswers[i])) gotAnswer=true;
    }
    if (gotAnswer)
    {
        if (forgiveTones && correctAnswers.length==1)
            SetFeedback("Correct! It's: <span class=\"correct\">"+correctAnswers.join("/")+"</span>", correctAnswers[0]);
        else if (correctAnswers.length==1)
            SetFeedback("<span class=\"correct-fb\">Correct!</span>", correctAnswers[0]);
        else
            SetFeedback("<span class=\"correct-fb\">Correct!</span> Other options: "+correctAnswers.join("/"), correctAnswers[0]);
        showNext();
    }
    else
    {
        SetFeedback("<span class=\"incorrect-fb\">Wrong!</span> Not \"" + answer + "\", it's: <span class=\"correct\">"+correctAnswers.join("/")+"</span>. Try again!", correctAnswers[0]);
    }
    $("#answer")[0].value = "";
}

function skip()
{
    clearPassiveTimers();
    showNext();
    $("#answer")[0].value = "";
    SetFeedback("");
}

function transliterate(s)
{
    if (presentYtping == true)
    {
        s = Jyutping2Ytping(s);
    }
    return s;
}

function updateList(lines)
{
    tableData="";
    for (var i=0;i<lines.length;i++)
    {
        var rawAnswer = lines[i].split(":")[1] || "";
        var value=transliterate(rawAnswer);
        if (linkToDictionary == true) {
            value = "<a href=\"http://www.cantonese.sheik.co.uk/dictionary/search/?searchtype=3&text="+getQueryText(lines[i].split(":")[1])+"\">"
                    +value
                    +"</a>";
        }
        var speakerBtn = " <span class=\"speaker-btn speaker-vocab\" role=\"button\" tabindex=\"0\" title=\"Read answer out loud\" aria-label=\"Read answer out loud\" data-answer=\"" + escapeHtmlAttr(rawAnswer) + "\" onclick=\"readVocabAnswer(event, this)\">🔊</span>";
        tableData = tableData.concat("<tr><td>"+lines[i].split(":")[0]+"</td><td>"
                    + value
                    + speakerBtn
                    +"</td></tr>"
        );
    }
    $("#vocabTable")[0].innerHTML = tableData;
    $("#vocabTable tr").css("color", "");
}

function setQuestion(index)
{
    var questionText = lines[index].split(":")[0];
    $("#question_txt")[0].innerHTML = "<span class=\"lesser-text\">["+index+"/"+seen.size()+"/"+lines.length+"]</span> " + questionText + " <span id=\"speaker_question\" class=\"speaker-btn\" role=\"button\" tabindex=\"0\" title=\"Read question out loud\" aria-label=\"Read question out loud\" onclick=\"readQuestion(event)\">🔊</span>";
    playAudio("aud_question", questionText.split("/")[0]);
    
    if (appSettings.speakQuestions) {
        readQuestion();
    }

    if (appSettings.passiveMode) {
        $("#feedback")[0].innerHTML = "";
        $("#answer").val("");
        startPassiveQuestionTimer();
    } else if (autoLoop) {
        setTimeout(tellAnswerAndSkip, 4200);
    }
}

function tellAnswerAndSkip()
{
    var correctAnswers= transliterate(lines[index]).split(":")[1].split("/");
    var answerIdx = Math.floor(Math.random() * correctAnswers.length);
    var durationSec = playAnswer(correctAnswers[answerIdx]);
    $("#answer")[0].value = correctAnswers[answerIdx];
    //setTimeout(showNext, 3000 + Math.floor(1000*$("#aud_question")[0].duration));
    setTimeout(showNext, 3500);
}

function showNext()
{
    clearPassiveTimers();
    if (lines.length <= 1) {
        SetFeedback("<span class=\"incorrect-fb\">Notice: Lesson has 1 or fewer items.</span>");
    }
    index=GetRandomIndex();
    setQuestion(index);
}

function showNextUnseen()
{
    clearPassiveTimers();
    SetFeedback("Skipping...");
    for (var localIndex=0; localIndex<lines.length; localIndex++)
    {
        if (!seen.contains(localIndex))
        {
            index=localIndex;
            lastIndex=index;
            markSeen(index);
            setQuestion(index);
            return;
        }
    }
    showNext(); 
}

function GetRandomIndex()
{
    if (lines.length <= 1) {
        lastIndex = 0;
        if (typeof seen != "undefined") markSeen(0);
        return 0;
    }
    var newIndex=lastIndex;
    while (newIndex==lastIndex)
        newIndex=Math.floor(Math.random() * lines.length);
    lastIndex=newIndex;
    if (typeof seen != "undefined") markSeen(newIndex);
    return newIndex;
}

function markSeen(n)
{
    seen.add(n);
    $("#vocabTable tr").eq(n).css("color", "green");
}

function SetFeedback(s, answerToSpeak)
{
    $("#feedback")[0].innerHTML = s;
    if (!appSettings.speakAnswers) {
        return;
    }
    if (answerToSpeak) {
        speakAnswer(answerToSpeak);
        return;
    }
    if (!s) return;
    var correctSpan = $("#feedback .correct");
    if (correctSpan.length > 0) {
        var answerText = correctSpan.text().trim();
        if (answerText) {
            speakAnswer(answerText);
        }
    } else {
        var optMatch = s.match(/Other options:\s*([^<]+)/i);
        if (optMatch && optMatch[1]) {
            speakAnswer(optMatch[1].trim());
        }
    }
}

function toggleTable()
{
    var ret=$("#vocabTable").toggle();
    $("#toggleTable")[0].innerHTML = ((ret[0].style["display"]=="none") ? "Show": "Hide") + " List";
}

// http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter
var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();

// ==========================================
// AI Sentence Synthesis Engine (Gemini API)
// ==========================================
var isGeneratingSentences = false;

function generateSentencesFromCompletedLessons() {
    if (isGeneratingSentences) return;

    var selectedFiles = appSettings.completedLessons || [];
    if (selectedFiles.length === 0) {
        $("#ai_gen_status").html('<span class="ai-gen-error">Please select at least 1 completed lesson in Settings (⚙).</span>');
        return;
    }

    isGeneratingSentences = true;
    $("#ai_gen_btn").prop("disabled", true).text("Generating...");
    $("#ai_gen_status").html('<span class="ai-gen-status">Fetching vocabulary from selected lesson(s)...</span>');

    // Fetch and aggregate all vocabulary lines from the selected lesson files
    var fetchPromises = selectedFiles.map(function(filePath) {
        return $.ajax({
            url: filePath,
            dataType: "text"
        }).then(function(content) {
            return content;
        }, function() {
            console.warn("Could not load lesson file: " + filePath);
            return "";
        });
    });

    $.when.apply($, fetchPromises).done(function() {
        var allContents = Array.prototype.slice.call(arguments);
        // Handle single vs multiple arguments from $.when
        if (selectedFiles.length === 1) {
            allContents = [allContents[0]];
        } else {
            allContents = allContents.map(function(item) {
                return Array.isArray(item) ? item[0] : item;
            });
        }

        var combinedVocab = [];
        var vocabSet = {};

        allContents.forEach(function(content) {
            if (!content || typeof content !== "string") return;
            var fileLines = content.split(/\r?\n/);
            fileLines.forEach(function(line) {
                var trimmed = line.trim();
                if (trimmed.length > 0 && trimmed.indexOf(":") !== -1 && !vocabSet[trimmed]) {
                    vocabSet[trimmed] = true;
                    combinedVocab.push(trimmed);
                }
            });
        });

        if (combinedVocab.length === 0) {
            isGeneratingSentences = false;
            $("#ai_gen_btn").prop("disabled", false).text("Generate Sentences ✨");
            $("#ai_gen_status").html('<span class="ai-gen-error">No vocabulary found in the selected lessons.</span>');
            return;
        }

        var requestedCount = appSettings.aiSentenceCount || 25;
        if ($("#ai_sentence_count").length) {
            var val = parseInt($("#ai_sentence_count").val(), 10);
            if (!isNaN(val) && val > 0) requestedCount = val;
        }

        $("#ai_gen_status").html('<span class="ai-gen-status">Composing ' + requestedCount + ' sentences strictly from ' + combinedVocab.length + ' vocabulary items...</span>');

        // Call our server-side Gemini route
        $.ajax({
            url: "/api/generate-sentences",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                vocabList: combinedVocab,
                count: requestedCount,
                lessonTitle: "AI Synthesized Practice"
            }),
            success: function(data) {
                isGeneratingSentences = false;
                $("#ai_gen_btn").prop("disabled", false).text("Generate Sentences ✨");

                if (!data || !data.sentences || data.sentences.length === 0) {
                    $("#ai_gen_status").html('<span class="ai-gen-error">No sentences generated. Try again or check API configuration.</span>');
                    return;
                }

                // Format generated sentences into FlashType line syntax:
                // "English prompt:primary_jyutping/alternative1/alternative2"
                var generatedLines = data.sentences.map(function(item) {
                    var ansList = [item.jyutping.trim()];
                    if (Array.isArray(item.alternatives)) {
                        item.alternatives.forEach(function(alt) {
                            var a = alt.trim();
                            if (a && ansList.indexOf(a) === -1) {
                                ansList.push(a);
                            }
                        });
                    }
                    return item.english.trim() + ":" + ansList.join("/");
                });

                // Load into FlashType flashcard session
                sessionCharactersMap = {};
                data.sentences.forEach(function(item) {
                    if (item.characters && item.jyutping) {
                        var cKey = clean(item.jyutping.trim());
                        sessionCharactersMap[cKey] = item.characters.trim();
                        // Also map transliterated Yale version
                        var yKey = clean(transliterate(item.jyutping.trim()));
                        sessionCharactersMap[yKey] = item.characters.trim();
                    }
                });

                activeSessionLanguage = "cantonese";
                lines = generatedLines;
                seen = new set(lines.length);
                presentYtping = (appSettings.romanization === "yale");
                clearPassiveTimers();

                $("#stage").show();
                updatePassiveModeUI();
                showNext();
                updateList(lines);

                $("#ai_gen_status").html('<span class="ai-gen-status">✨ Loaded ' + generatedLines.length + ' practice sentences!</span>');
            },
            error: function(xhr, status, error) {
                isGeneratingSentences = false;
                $("#ai_gen_btn").prop("disabled", false).text("Generate Sentences ✨");
                var errMsg = "Error connecting to sentence generator.";
                try {
                    var parsed = JSON.parse(xhr.responseText);
                    if (parsed && parsed.error) errMsg = parsed.error;
                } catch (e) {}
                $("#ai_gen_status").html('<span class="ai-gen-error">Failed: ' + errMsg + '</span>');
            }
        });
    });
}


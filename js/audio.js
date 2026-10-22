/* =========================================================================
 * js/audio.js
 * Web Speech API speech synthesis, voice detection, and audio playback.
 * ========================================================================= */

var activeSessionLanguage = ""; // Track language when sentences are dynamically generated or loaded
var sessionCharactersMap = {};  // Maps jyutping answer to Cantonese characters if available
var lastQuestionSpeechTime = 0;
var lastVocabSpeechTime = 0;

function isJyutpingOrYale(text) {
    if (typeof text !== "string") return false;
    var trimmed = text.trim();
    // Check if text has Jyutping tones (1-6) or Yale tone markers
    if (/[a-z]{1,6}[1-6]/i.test(trimmed)) return true;
    // Common Cantonese syllable patterns
    var commonSyllables = /\b(ngo5|nei5|keoi5|hai2|dou6|sik6|je5|m4|hou2|jiu3|soeng2|ge3|laa1|aa3|maa3|zou6|dim2|sin1|heoi3|lai4)\b/i;
    return commonSyllables.test(trimmed);
}

function getSpeechRate() {
    var speed = (typeof appSettings !== "undefined" && appSettings && appSettings.speechSpeed) || "normal";
    if (speed === "slow") return 0.4;
    if (speed === "fast") return 1.0;
    return 0.8; // normal (default)
}

function speakText(text, lang, speakSourceText, rate) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
    }
    try {
        window.speechSynthesis.cancel();
        var targetText = speakSourceText || text;
        var cleanText = targetText.replace(/[\(\)]/g, "");
        if (!speakSourceText) {
            cleanText = (typeof replaceJyutpingTones === "function") ? replaceJyutpingTones(cleanText).trim() : cleanText.trim();
        } else {
            cleanText = cleanText.trim();
        }
        if (!cleanText) return;

        var utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = (typeof rate === "number" && !isNaN(rate)) ? rate : getSpeechRate();
        if (lang) {
            utterance.lang = lang;
        }

        // Voice selection: find matching Cantonese or target language voice
        var voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0 && lang) {
            var targetLangLower = lang.toLowerCase();
            var targetLangPrefix = targetLangLower.split("-")[0];
            var matchedVoice = null;

            // Check user-selected debug voice preferences first
            if (typeof appSettings !== "undefined") {
                if (targetLangPrefix === "en" && appSettings.preferredEnglishVoiceURI) {
                    for (var ev = 0; ev < voices.length; ev++) {
                        if (voices[ev].voiceURI === appSettings.preferredEnglishVoiceURI) {
                            matchedVoice = voices[ev];
                            break;
                        }
                    }
                } else if (targetLangPrefix !== "en" && appSettings.preferredTargetVoices) {
                    var curLangId = (typeof getCurrentActiveLanguageId === "function") ? getCurrentActiveLanguageId() : (activeSessionLanguage || getLessonCategory());
                    var preferredURI = curLangId ? appSettings.preferredTargetVoices[curLangId] : "";
                    if (preferredURI) {
                        for (var tv = 0; tv < voices.length; tv++) {
                            if (voices[tv].voiceURI === preferredURI) {
                                matchedVoice = voices[tv];
                                break;
                            }
                        }
                    }
                }
            }

            // Prioritize Cantonese voice (zh-HK, Cantonese, or Yue)
            if (!matchedVoice && (targetLangLower === "zh-hk" || targetLangLower.indexOf("cantonese") !== -1)) {
                for (var v = 0; v < voices.length; v++) {
                    var vName = (voices[v].name || "").toLowerCase();
                    var vLang = (voices[v].lang || "").replace(/_/g, "-").toLowerCase();
                    if (vLang === "zh-hk" || vName.indexOf("cantonese") !== -1 || vName.indexOf("hong kong") !== -1 || vLang.indexOf("yue") !== -1) {
                        matchedVoice = voices[v];
                        break;
                    }
                }
            }

            // Prioritize Mandarin voice (zh-CN, Mandarin, or Putonghua)
            if (!matchedVoice && (targetLangLower === "zh-cn" || targetLangLower.indexOf("mandarin") !== -1)) {
                for (var m = 0; m < voices.length; m++) {
                    var mName = (voices[m].name || "").toLowerCase();
                    var mLang = (voices[m].lang || "").replace(/_/g, "-").toLowerCase();
                    if (mLang === "zh-cn" || mName.indexOf("mandarin") !== -1 || mName.indexOf("putonghua") !== -1 || mName.indexOf("mainland") !== -1 || mLang === "zh-sg") {
                        matchedVoice = voices[m];
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
        if (/[\u0D00-\u0D7F]/.test(text)) return "ml-IN";
        if (/[\u0370-\u03FF]/.test(text)) return "el-GR";
        if (/[\u0590-\u05FF]/.test(text)) return "he-IL";
        if (/[\u4E00-\u9FFF]/.test(text)) return "zh-HK";
    }
    return "en-US";
}

function getAnswerLanguage(text) {
    if (typeof text === "string") {
        if (/[\u0D00-\u0D7F]/.test(text)) return "ml-IN";
        if (/[\u0370-\u03FF]/.test(text)) return "el-GR";
        if (/[\u0590-\u05FF]/.test(text)) return "he-IL";
        if (/[\u4E00-\u9FFF]/.test(text)) return "zh-HK";
    }
    var cat = getLessonCategory();
    if (cat.indexOf("malayalam") !== -1) return "ml-IN";
    if (cat.indexOf("polish") !== -1) return "pl-PL";
    if (cat.indexOf("spanish") !== -1) return "es-ES";
    if (cat.indexOf("italian") !== -1) return "it-IT";
    if (cat.indexOf("greek") !== -1) return "el-GR";
    if (cat.indexOf("hebrew") !== -1) return "he-IL";
    if (cat.indexOf("mandarin") !== -1) return "zh-CN";
    if (cat.indexOf("cantonese") !== -1 || cat === "sheik") return "zh-HK";

    // If text contains Romanized Cantonese (Jyutping / Yale tone digits)
    if (isJyutpingOrYale(text)) {
        return "zh-HK";
    }

    return "en-US";
}

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
    speakText(textToSpeak, getQuestionLanguage(question), null, 0.9); // Fixed rate for questions
}

function speakAnswer(answerText) {
    if (!answerText) return;
    // If there is more than one variant separated by slashes, pick one randomly
    var variants = answerText.split("/");
    var singleAns = variants[0].trim();
    if (variants.length > 1) {
        singleAns = variants[Math.floor(Math.random() * variants.length)].trim();
    }
    var lang = getAnswerLanguage(singleAns);

    // If we have standard Cantonese characters mapped for this generated sentence,
    // feeding the Hanzi directly into the Web Speech API (with lang: zh-HK) produces
    // natural, native Cantonese speech rather than spelling out romanized letters.
    var speakSrc = "";
    var rawKey = (typeof clean === "function") ? clean(singleAns) : singleAns;
    if (sessionCharactersMap && sessionCharactersMap[rawKey]) {
        speakSrc = sessionCharactersMap[rawKey];
        lang = "zh-HK";
    }

    speakText(singleAns, lang, speakSrc, getSpeechRate()); // Target language uses configured speed
}

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
    if (!answerText && el && el.parentElement && typeof $ !== "undefined") {
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
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = function() {
        if (typeof populateDebugVoiceSelectors === "function") {
            populateDebugVoiceSelectors();
        }
    };
}

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

var ttsUtteranceVault = (typeof window !== "undefined")
    ? (window.__FLASHTYPE_TTS_VAULT__ = window.__FLASHTYPE_TTS_VAULT__ || [])
    : [];
var cachedSpeechVoices = [];
var ttsKeepAliveTimer = null;
var ttsPendingSpeakTimer = null;
var ttsRequestSeq = 0;

var _ttsUA = (typeof navigator !== "undefined" && navigator.userAgent) ? navigator.userAgent : "";
var _ttsIsIOS = /iPad|iPhone|iPod/.test(_ttsUA) || (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
var _ttsIsAndroid = /Android/i.test(_ttsUA);
var _ttsIsChromium = /Chrome|Chromium|Edg|CriOS/i.test(_ttsUA) && !/Firefox|FxiOS/i.test(_ttsUA);
var _ttsIsDesktopChromium = _ttsIsChromium && !_ttsIsIOS && !_ttsIsAndroid;

function retainUtterance(utterance) {
    if (!utterance) return;
    if (ttsUtteranceVault.indexOf(utterance) === -1) {
        ttsUtteranceVault.push(utterance);
    }
}

function releaseUtterance(utterance) {
    if (!utterance) return;
    var idx = ttsUtteranceVault.indexOf(utterance);
    if (idx !== -1) {
        ttsUtteranceVault.splice(idx, 1);
    }
}

function clearTtsTimers() {
    if (ttsKeepAliveTimer) {
        clearInterval(ttsKeepAliveTimer);
        ttsKeepAliveTimer = null;
    }
    if (ttsPendingSpeakTimer) {
        clearTimeout(ttsPendingSpeakTimer);
        ttsPendingSpeakTimer = null;
    }
}

function getAvailableVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return [];
    }
    var fresh = [];
    try {
        fresh = window.speechSynthesis.getVoices() || [];
    } catch (e) {
        fresh = [];
    }
    if (fresh.length > 0) {
        cachedSpeechVoices = fresh;
        return fresh;
    }
    return cachedSpeechVoices;
}

function pickBestVoice(candidates) {
    if (!candidates || candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    var isOnline = (typeof navigator === "undefined" || typeof navigator.onLine !== "boolean") ? true : navigator.onLine;
    var bestVoice = candidates[0];
    var bestScore = -1;

    for (var i = 0; i < candidates.length; i++) {
        var v = candidates[i];
        var vName = (v.name || "").toLowerCase();
        var isLocal = (v.localService === true);
        var isEspeak = (vName.indexOf("espeak") !== -1);
        var score = 0;

        if (isLocal && !isEspeak) {
            // Native local voice (e.g. Chrome OS native voice, Apple local voice, Windows local voice)
            score = 40;
        } else if (isOnline && !isLocal && !isEspeak) {
            // Network voice when online (e.g. Google TTS) when no native local voice exists
            score = 30;
        } else if (isLocal) {
            // Local fallback (e.g. eSpeak) — prioritized over remote voices when offline
            score = isOnline ? 20 : 30;
        } else {
            score = 10;
        }

        if (v.default) {
            score += 2;
        }

        if (score > bestScore) {
            bestScore = score;
            bestVoice = v;
        }
    }

    return bestVoice;
}

function selectVoiceForLang(voices, lang) {
    if (!voices || voices.length === 0 || !lang) return null;

    var targetLangLower = lang.replace(/_/g, "-").toLowerCase();
    var targetLangPrefix = targetLangLower.split("-")[0];

    // 1. Check user-selected debug voice preferences first
    if (typeof appSettings !== "undefined") {
        if (targetLangPrefix === "en" && appSettings.preferredEnglishVoiceURI) {
            for (var ev = 0; ev < voices.length; ev++) {
                if (voices[ev].voiceURI === appSettings.preferredEnglishVoiceURI) {
                    return voices[ev];
                }
            }
        } else if (targetLangPrefix !== "en" && appSettings.preferredTargetVoices) {
            var curLangId = (typeof getCurrentActiveLanguageId === "function") ? getCurrentActiveLanguageId() : (activeSessionLanguage || getLessonCategory());
            var preferredURI = curLangId ? appSettings.preferredTargetVoices[curLangId] : "";
            if (preferredURI) {
                for (var tv = 0; tv < voices.length; tv++) {
                    if (voices[tv].voiceURI === preferredURI) {
                        return voices[tv];
                    }
                }
            }
        }
    }

    // 2. Prioritize Cantonese voices (zh-HK, Cantonese, or Yue)
    if (targetLangLower === "zh-hk" || targetLangLower.indexOf("cantonese") !== -1) {
        var cantoneseCandidates = [];
        for (var v = 0; v < voices.length; v++) {
            var vName = (voices[v].name || "").toLowerCase();
            var vLang = (voices[v].lang || "").replace(/_/g, "-").toLowerCase();
            if (vLang === "zh-hk" || vName.indexOf("cantonese") !== -1 || vName.indexOf("hong kong") !== -1 || vLang.indexOf("yue") !== -1) {
                cantoneseCandidates.push(voices[v]);
            }
        }
        if (cantoneseCandidates.length > 0) {
            return pickBestVoice(cantoneseCandidates);
        }
    }

    // 3. Prioritize Mandarin voices (zh-CN, Mandarin, or Putonghua)
    if (targetLangLower === "zh-cn" || targetLangLower.indexOf("mandarin") !== -1) {
        var mandarinCandidates = [];
        for (var m = 0; m < voices.length; m++) {
            var mName = (voices[m].name || "").toLowerCase();
            var mLang = (voices[m].lang || "").replace(/_/g, "-").toLowerCase();
            if (mLang === "zh-cn" || mName.indexOf("mandarin") !== -1 || mName.indexOf("putonghua") !== -1 || mName.indexOf("mainland") !== -1 || mLang === "zh-sg") {
                mandarinCandidates.push(voices[m]);
            }
        }
        if (mandarinCandidates.length > 0) {
            return pickBestVoice(mandarinCandidates);
        }
    }

    // 4. Exact language match (e.g. es-ES, pl-PL, fr-FR)
    var exactCandidates = [];
    for (var i = 0; i < voices.length; i++) {
        var vLangExact = (voices[i].lang || "").replace(/_/g, "-").toLowerCase();
        if (vLangExact === targetLangLower) {
            exactCandidates.push(voices[i]);
        }
    }
    if (exactCandidates.length > 0) {
        return pickBestVoice(exactCandidates);
    }

    // 5. Language prefix match (e.g. es, pl, fr)
    if (targetLangPrefix) {
        var prefixCandidates = [];
        for (var k = 0; k < voices.length; k++) {
            var vLangPrefix = (voices[k].lang || "").replace(/_/g, "-").toLowerCase();
            if (vLangPrefix === targetLangPrefix || vLangPrefix.indexOf(targetLangPrefix + "-") === 0) {
                prefixCandidates.push(voices[k]);
            }
        }
        if (prefixCandidates.length > 0) {
            return pickBestVoice(prefixCandidates);
        }
    }

    return null;
}

function speakText(text, lang, speakSourceText, rate) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
    }
    try {
        var synth = window.speechSynthesis;
        var targetText = speakSourceText || text;
        if (typeof targetText !== "string") return;

        var cleanText = targetText.replace(/[\(\)]/g, "");
        if (!speakSourceText) {
            cleanText = (typeof replaceJyutpingTones === "function") ? replaceJyutpingTones(cleanText).trim() : cleanText.trim();
        } else {
            cleanText = cleanText.trim();
        }
        if (!cleanText) return;

        var requestId = ++ttsRequestSeq;
        clearTtsTimers();

        var wasActive = Boolean(synth.speaking || synth.pending || synth.paused);
        if (wasActive) {
            ttsUtteranceVault.length = 0;
            synth.cancel();
        }

        var rawRate = (typeof rate === "number" && !isNaN(rate)) ? rate : getSpeechRate();
        var clampedRate = Math.max(0.2, Math.min(2.0, rawRate));

        var dispatchSpeak = function() {
            if (requestId !== ttsRequestSeq) return;
            try {
                if (synth.paused) {
                    synth.resume();
                }

                var utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.rate = clampedRate;
                if (lang) {
                    utterance.lang = lang;
                }

                var voices = getAvailableVoices();
                var matchedVoice = selectVoiceForLang(voices, lang);
                if (matchedVoice) {
                    utterance.voice = matchedVoice;
                }

                retainUtterance(utterance);

                utterance.onstart = function() {
                    if (requestId !== ttsRequestSeq) return;
                    // Work around desktop Chromium/ChromeOS ~15s TTS cutoff without affecting mobile engines
                    if (_ttsIsDesktopChromium) {
                        if (ttsKeepAliveTimer) {
                            clearInterval(ttsKeepAliveTimer);
                        }
                        ttsKeepAliveTimer = setInterval(function() {
                            if (requestId !== ttsRequestSeq || !synth.speaking) {
                                clearInterval(ttsKeepAliveTimer);
                                ttsKeepAliveTimer = null;
                                return;
                            }
                            if (!synth.paused) {
                                synth.pause();
                                synth.resume();
                            }
                        }, 10000);
                    }
                };

                utterance.onend = function() {
                    if (ttsKeepAliveTimer) {
                        clearInterval(ttsKeepAliveTimer);
                        ttsKeepAliveTimer = null;
                    }
                    releaseUtterance(utterance);
                };

                utterance.onerror = function(evt) {
                    if (ttsKeepAliveTimer) {
                        clearInterval(ttsKeepAliveTimer);
                        ttsKeepAliveTimer = null;
                    }
                    releaseUtterance(utterance);
                    var errCode = evt && evt.error ? evt.error : "";
                    if (errCode && errCode !== "interrupted" && errCode !== "canceled" && errCode !== "not-allowed") {
                        console.warn("Speech synthesis warning:", errCode);
                    }
                };

                synth.speak(utterance);
            } catch (innerErr) {
                console.error("Speech synthesis error:", innerErr);
            }
        };

        // On desktop Chromium/ChromeOS, allow a brief cooldown after cancel() so the OS TTS daemon
        // does not silently drop the next utterance. Stay synchronous when idle or on iOS Safari to
        // preserve user gesture activation.
        if (wasActive && _ttsIsDesktopChromium) {
            ttsPendingSpeakTimer = setTimeout(function() {
                ttsPendingSpeakTimer = null;
                dispatchSpeak();
            }, 60);
        } else {
            dispatchSpeak();
        }
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
    if (cat.indexOf("french") !== -1) return "fr-FR";
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
    // Prime async voice list loading (required on ChromeOS and desktop Chromium)
    getAvailableVoices();

    window.speechSynthesis.onvoiceschanged = function() {
        getAvailableVoices();
        if (typeof populateDebugVoiceSelectors === "function") {
            populateDebugVoiceSelectors();
        }
    };

    window.addEventListener("beforeunload", function() {
        try {
            ttsRequestSeq++;
            clearTtsTimers();
            ttsUtteranceVault.length = 0;
            if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                window.speechSynthesis.cancel();
            }
        } catch (e) {}
    });

    if (typeof document !== "undefined" && document.addEventListener) {
        document.addEventListener("visibilitychange", function() {
            try {
                var synth = window.speechSynthesis;
                if (document.hidden) {
                    ttsRequestSeq++;
                    clearTtsTimers();
                    ttsUtteranceVault.length = 0;
                    if (synth.speaking || synth.pending || synth.paused) {
                        synth.cancel();
                    }
                } else if (synth.paused) {
                    synth.resume();
                }
            } catch (e) {}
        });
    }
}

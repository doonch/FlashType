/* =========================================================================
 * js/settings.js
 * App settings state, localStorage persistence, and configuration modals.
 * ========================================================================= */

var appSettings = {
    selectedLanguage: "Cantonese",
    romanization: "jyutping",
    speakQuestions: true,
    speakAnswers: true,
    speechSpeed: "normal", // "slow" (0.4), "normal" (0.8), "fast" (1.0)
    passiveMode: false,
    questionTimeoutSec: 3.5,
    decayTimeoutSec: 2.5,
    completedLessons: ["lessons/CP.1.txt"], // default to CP.1.txt if none selected
    completedLessonsByLang: {},
    aiSentenceCount: 25,
    preferredEnglishVoiceURI: "",
    preferredTargetVoices: {}
};

function loadSettings() {
    try {
        if (typeof localStorage !== "undefined") {
            var savedLang = localStorage.getItem("flashtype_language");
            if (savedLang) {
                appSettings.selectedLanguage = savedLang;
            }
            var rom = localStorage.getItem("flashtype_romanization");
            if (rom === "yale" || rom === "jyutping") {
                appSettings.romanization = rom;
            }
            if (localStorage.getItem("flashtype_speech_default_v2") === null) {
                // Initialize default to true for speaking questions and answers
                appSettings.speakQuestions = true;
                appSettings.speakAnswers = true;
                localStorage.setItem("flashtype_speech_default_v2", "true");
                localStorage.setItem("flashtype_speak_questions", "true");
                localStorage.setItem("flashtype_speak_answers", "true");
            } else {
                if (localStorage.getItem("flashtype_speak_questions") !== null) {
                    appSettings.speakQuestions = localStorage.getItem("flashtype_speak_questions") === "true";
                }
                if (localStorage.getItem("flashtype_speak_answers") !== null) {
                    appSettings.speakAnswers = localStorage.getItem("flashtype_speak_answers") === "true";
                }
            }
            var savedSpeed = localStorage.getItem("flashtype_speech_speed");
            if (savedSpeed === "slow" || savedSpeed === "normal" || savedSpeed === "fast") {
                appSettings.speechSpeed = savedSpeed;
            } else {
                appSettings.speechSpeed = "normal";
            }
            if (localStorage.getItem("flashtype_passive_mode") !== null) {
                appSettings.passiveMode = localStorage.getItem("flashtype_passive_mode") === "true";
            }
            var qTimeout = parseFloat(localStorage.getItem("flashtype_q_timeout"));
            if (!isNaN(qTimeout) && qTimeout >= 1) {
                appSettings.questionTimeoutSec = Math.min(8, Math.max(1, qTimeout));
            }
            var dTimeout = parseFloat(localStorage.getItem("flashtype_d_timeout"));
            if (!isNaN(dTimeout) && dTimeout >= 1) {
                appSettings.decayTimeoutSec = Math.min(8, Math.max(1, dTimeout));
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
            var completedByLang = localStorage.getItem("flashtype_completed_lessons_by_lang");
            if (completedByLang) {
                try {
                    var parsedMap = JSON.parse(completedByLang);
                    if (parsedMap && typeof parsedMap === "object") {
                        appSettings.completedLessonsByLang = parsedMap;
                    }
                } catch (pe) {}
            }
            var aiCnt = parseInt(localStorage.getItem("flashtype_ai_sentence_count"), 10);
            if (!isNaN(aiCnt) && aiCnt >= 1 && aiCnt <= 50) {
                appSettings.aiSentenceCount = aiCnt;
            }
            var prefEn = localStorage.getItem("flashtype_voice_english");
            if (prefEn) {
                appSettings.preferredEnglishVoiceURI = prefEn;
            }
            var prefTarget = localStorage.getItem("flashtype_voices_target");
            if (prefTarget) {
                try {
                    var parsedTarget = JSON.parse(prefTarget);
                    if (parsedTarget && typeof parsedTarget === "object") {
                        appSettings.preferredTargetVoices = parsedTarget;
                    }
                } catch (pe) {}
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
            localStorage.setItem("flashtype_language", appSettings.selectedLanguage || "Cantonese");
            localStorage.setItem("flashtype_romanization", appSettings.romanization);
            localStorage.setItem("flashtype_speak_questions", appSettings.speakQuestions);
            localStorage.setItem("flashtype_speak_answers", appSettings.speakAnswers);
            localStorage.setItem("flashtype_speech_speed", appSettings.speechSpeed || "normal");
            localStorage.setItem("flashtype_passive_mode", appSettings.passiveMode);
            localStorage.setItem("flashtype_q_timeout", appSettings.questionTimeoutSec);
            localStorage.setItem("flashtype_d_timeout", appSettings.decayTimeoutSec);
            localStorage.setItem("flashtype_completed_lessons", JSON.stringify(appSettings.completedLessons));
            localStorage.setItem("flashtype_completed_lessons_by_lang", JSON.stringify(appSettings.completedLessonsByLang || {}));
            localStorage.setItem("flashtype_ai_sentence_count", appSettings.aiSentenceCount || 25);
            if (appSettings.preferredEnglishVoiceURI) {
                localStorage.setItem("flashtype_voice_english", appSettings.preferredEnglishVoiceURI);
            } else {
                localStorage.removeItem("flashtype_voice_english");
            }
            if (appSettings.preferredTargetVoices) {
                localStorage.setItem("flashtype_voices_target", JSON.stringify(appSettings.preferredTargetVoices));
            }
        }
    } catch (e) {
        console.warn("Could not save settings to localStorage", e);
    }
}

function applySettings() {
    presentYtping = (appSettings.romanization === "yale");
    if (typeof lines !== "undefined" && lines && lines.length > 0) {
        if (typeof updateList === "function") {
            updateList(lines);
        }
    }
    if (typeof updatePassiveModeUI === "function") {
        updatePassiveModeUI();
    }
    if (appSettings.passiveMode) {
        if (typeof $ !== "undefined" && $("#stage").is(":visible") && typeof index !== "undefined" && typeof lines !== "undefined" && lines && lines[index]) {
            if (typeof startPassiveQuestionTimer === "function") {
                startPassiveQuestionTimer();
            }
        }
    } else {
        if (typeof clearPassiveTimers === "function") {
            clearPassiveTimers();
        }
    }
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
    if (appSettings.speechSpeed === "slow") {
        $("#speech_speed_slow").prop("checked", true);
    } else if (appSettings.speechSpeed === "fast") {
        $("#speech_speed_fast").prop("checked", true);
    } else {
        $("#speech_speed_normal").prop("checked", true);
    }
    $("#setting_passive_mode").prop("checked", appSettings.passiveMode);

    var qSec = Math.max(1, Math.min(8, appSettings.questionTimeoutSec || 3.5));
    var dSec = Math.max(1, Math.min(8, appSettings.decayTimeoutSec || 2.5));
    appSettings.questionTimeoutSec = qSec;
    appSettings.decayTimeoutSec = dSec;

    $("#setting_q_timeout").val(qSec);
    $("#setting_q_timeout_val").text(qSec.toFixed(1) + " s");
    $("#popup_q_timeout").val(qSec);
    $("#popup_q_timeout_val").text(qSec.toFixed(1) + " s");

    $("#setting_d_timeout").val(dSec);
    $("#setting_d_timeout_val").text(dSec.toFixed(1) + " s");
    $("#popup_d_timeout").val(dSec);
    $("#popup_d_timeout_val").text(dSec.toFixed(1) + " s");

    if (appSettings.passiveMode) {
        $("#passive_time_options").show();
    } else {
        $("#passive_time_options").hide();
    }

    if (typeof renderLessonChecklist === "function") {
        renderLessonChecklist();
    }

    syncDebugVoiceUI();
}

function onTimerSliderChange(which, val) {
    var num = parseFloat(val);
    if (isNaN(num)) return;
    num = Math.max(1, Math.min(8, Math.round(num * 10) / 10));

    if (which === "q") {
        appSettings.questionTimeoutSec = num;
        if (typeof $ !== "undefined") {
            $("#setting_q_timeout").val(num);
            $("#setting_q_timeout_val").text(num.toFixed(1) + " s");
            $("#popup_q_timeout").val(num);
            $("#popup_q_timeout_val").text(num.toFixed(1) + " s");
        }
    } else if (which === "d") {
        appSettings.decayTimeoutSec = num;
        if (typeof $ !== "undefined") {
            $("#setting_d_timeout").val(num);
            $("#setting_d_timeout_val").text(num.toFixed(1) + " s");
            $("#popup_d_timeout").val(num);
            $("#popup_d_timeout_val").text(num.toFixed(1) + " s");
        }
    }

    saveSettings();
}

function openTimerRingModal(e) {
    if (e && typeof e.stopPropagation === "function") {
        e.stopPropagation();
    }
    syncSettingsUI();
    if (typeof $ !== "undefined") {
        $("#timer_ring_modal").fadeIn(150);
    }
}

function closeTimerRingModal(e) {
    if (e && e.target && e.currentTarget && e.target !== e.currentTarget && !$(e.target).hasClass("modal-close-btn") && !$(e.target).hasClass("modal-btn-primary")) {
        return;
    }
    if (typeof $ !== "undefined") {
        $("#timer_ring_modal").fadeOut(150);
    }
}

function onSettingChange() {
    if (typeof $ === "undefined") return;
    var romVal = $("input[name='romanization_pref']:checked").val() || "jyutping";
    appSettings.romanization = romVal;
    appSettings.speakQuestions = $("#setting_speak_questions").is(":checked");
    appSettings.speakAnswers = $("#setting_speak_answers").is(":checked");
    var speedVal = $("input[name='speech_speed_pref']:checked").val() || "normal";
    appSettings.speechSpeed = speedVal;
    appSettings.passiveMode = $("#setting_passive_mode").is(":checked");

    var qVal = parseFloat($("#setting_q_timeout").val());
    if (!isNaN(qVal)) {
        appSettings.questionTimeoutSec = Math.max(1, Math.min(8, qVal));
    }
    var dVal = parseFloat($("#setting_d_timeout").val());
    if (!isNaN(dVal)) {
        appSettings.decayTimeoutSec = Math.max(1, Math.min(8, dVal));
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

function openHelpModal() {
    if (typeof $ !== "undefined") {
        $("#help_modal").fadeIn(150);
    }
}

function closeHelpModal() {
    if (typeof $ !== "undefined") {
        $("#help_modal").fadeOut(150);
    }
}

function onVoiceSettingChange(which) {
    if (typeof $ === "undefined") return;
    if (which === "english") {
        var enVal = $("#setting_voice_english").val() || "";
        appSettings.preferredEnglishVoiceURI = enVal;
    } else if (which === "target") {
        var targetVal = $("#setting_voice_target").val() || "";
        var activeLangId = (typeof getCurrentActiveLanguageId === "function") ? getCurrentActiveLanguageId() : (typeof activeSessionLanguage !== "undefined" ? activeSessionLanguage : "");
        if (activeLangId) {
            if (!appSettings.preferredTargetVoices) {
                appSettings.preferredTargetVoices = {};
            }
            appSettings.preferredTargetVoices[activeLangId] = targetVal;
        }
    }
    saveSettings();
}

function filterVoicesForLanguage(voices, langId) {
    if (!voices || !voices.length || !langId) return [];
    var lid = langId.toLowerCase();

    if (lid === "cantonese") {
        return voices.filter(function(v) {
            var l = (v.lang || "").replace(/_/g, "-").toLowerCase();
            var n = (v.name || "").toLowerCase();
            return l === "zh-hk" || l.indexOf("yue") !== -1 || n.indexOf("cantonese") !== -1 || n.indexOf("hong kong") !== -1;
        });
    }
    if (lid === "mandarin") {
        return voices.filter(function(v) {
            var l = (v.lang || "").replace(/_/g, "-").toLowerCase();
            var n = (v.name || "").toLowerCase();
            return l === "zh-cn" || l === "zh-sg" || l.indexOf("cmn") !== -1 || n.indexOf("mandarin") !== -1 || n.indexOf("putonghua") !== -1 || n.indexOf("mainland") !== -1;
        });
    }
    if (lid === "hebrew") {
        return voices.filter(function(v) {
            var l = (v.lang || "").replace(/_/g, "-").toLowerCase();
            return l.startsWith("he") || l.startsWith("iw");
        });
    }
    if (lid === "greek") {
        return voices.filter(function(v) {
            var l = (v.lang || "").replace(/_/g, "-").toLowerCase();
            return l.startsWith("el");
        });
    }
    if (lid === "polish") {
        return voices.filter(function(v) {
            var l = (v.lang || "").replace(/_/g, "-").toLowerCase();
            return l.startsWith("pl");
        });
    }
    if (lid === "spanish") {
        return voices.filter(function(v) {
            var l = (v.lang || "").replace(/_/g, "-").toLowerCase();
            return l.startsWith("es");
        });
    }
    if (lid === "italian") {
        return voices.filter(function(v) {
            var l = (v.lang || "").replace(/_/g, "-").toLowerCase();
            return l.startsWith("it");
        });
    }
    if (lid === "malayalam") {
        return voices.filter(function(v) {
            var l = (v.lang || "").replace(/_/g, "-").toLowerCase();
            return l.startsWith("ml");
        });
    }
    var prefix = lid.substring(0, 2);
    return voices.filter(function(v) {
        var l = (v.lang || "").replace(/_/g, "-").toLowerCase();
        return l.startsWith(prefix);
    });
}

function populateDebugVoiceSelectors() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (typeof isDebugMode !== "function" || !isDebugMode()) return;

    var voices = window.speechSynthesis.getVoices() || [];

    // 1. Target Language Selector (visible only if there's an active lesson)
    var hasActive = (typeof hasCurrentActiveLesson === "function") ? hasCurrentActiveLesson() : false;
    var activeLangName = (typeof getActiveLessonLanguage === "function") ? getActiveLessonLanguage() : "";
    var activeLangId = (typeof getCurrentActiveLanguageId === "function") ? getCurrentActiveLanguageId() : (typeof activeSessionLanguage !== "undefined" ? activeSessionLanguage : "");

    var $targetGroup = $("#debug_target_voice_group");
    var $targetSelect = $("#setting_voice_target");
    var $targetLabel = $("#debug_target_voice_label");

    if (hasActive && activeLangId) {
        var displayName = activeLangName || (activeLangId.charAt(0).toUpperCase() + activeLangId.slice(1));
        $targetLabel.text(displayName + " Voice (Target)");

        var targetVoices = filterVoicesForLanguage(voices, activeLangId);
        targetVoices.sort(function(a, b) {
            if (b.localService !== a.localService) {
                return Number(b.localService) - Number(a.localService);
            }
            return (a.name || "").localeCompare(b.name || "");
        });

        var savedTargetURI = (appSettings.preferredTargetVoices && appSettings.preferredTargetVoices[activeLangId]) || "";
        var targetHtml = '<option value="">Default / Auto-detect</option>';
        for (var i = 0; i < targetVoices.length; i++) {
            var tv = targetVoices[i];
            var isSel = (tv.voiceURI === savedTargetURI) ? ' selected' : '';
            var prefix = tv.localService ? '🟢 [LOCAL] ' : '🟠 [NETWORK] ';
            targetHtml += '<option value="' + (typeof escapeHtmlAttr === "function" ? escapeHtmlAttr(tv.voiceURI) : tv.voiceURI) + '"' + isSel + '>' +
                          prefix + tv.name + ' (' + tv.lang + ')' +
                          '</option>';
        }
        $targetSelect.html(targetHtml);
        $targetGroup.show();
    } else {
        $targetGroup.hide();
    }

    // 2. English Voice Selector (always at the bottom of the voice selection section)
    var $englishSelect = $("#setting_voice_english");
    if ($englishSelect.length) {
        var enVoices = voices.filter(function(v) {
            return (v.lang || "").toLowerCase().replace(/_/g, "-").startsWith("en");
        });
        enVoices.sort(function(a, b) {
            if (b.localService !== a.localService) {
                return Number(b.localService) - Number(a.localService);
            }
            var aIsUs = (a.lang || "").toLowerCase().replace(/_/g, "-").startsWith("en-us");
            var bIsUs = (b.lang || "").toLowerCase().replace(/_/g, "-").startsWith("en-us");
            if (aIsUs !== bIsUs) {
                return Number(bIsUs) - Number(aIsUs);
            }
            return (a.name || "").localeCompare(b.name || "");
        });

        var savedEnURI = appSettings.preferredEnglishVoiceURI || "";
        var enHtml = '<option value="">Default / Auto-detect</option>';
        for (var j = 0; j < enVoices.length; j++) {
            var ev = enVoices[j];
            var isEnSel = (ev.voiceURI === savedEnURI) ? ' selected' : '';
            var enPrefix = ev.localService ? '🟢 [LOCAL] ' : '🟠 [NETWORK] ';
            enHtml += '<option value="' + (typeof escapeHtmlAttr === "function" ? escapeHtmlAttr(ev.voiceURI) : ev.voiceURI) + '"' + isEnSel + '>' +
                      enPrefix + ev.name + ' (' + ev.lang + ')' +
                      '</option>';
        }
        $englishSelect.html(enHtml);
    }
}

function syncDebugVoiceUI() {
    if (typeof $ === "undefined") return;
    var $debugSection = $("#debug_voice_section");
    if (!$debugSection.length) return;

    if (typeof isDebugMode !== "function" || !isDebugMode()) {
        $debugSection.hide();
        return;
    }

    $debugSection.show();
    populateDebugVoiceSelectors();
}

// Initial settings load
loadSettings();

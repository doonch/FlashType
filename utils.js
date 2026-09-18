var lines = new Array();
var index=GetRandomIndex();
var lastIndex=index;
var presentYtping = false;
var linkToDictionary;
var forgiveTones=false;
var autoLoop=false;
var currentLessonIndex = -1;

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
    aiSentenceCount: 25
};

var passiveQuestionTimer = null;
var passiveDecayTimer = null;
var passiveAnimFrameId = null;
var passiveAnimStartTime = 0;
var passiveAnimDuration = 0;
var passiveCircumference = 2 * Math.PI * 11; // ~69.115px (radius 11 in 28x28 viewBox)

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
    if (passiveAnimFrameId) {
        cancelAnimationFrame(passiveAnimFrameId);
        passiveAnimFrameId = null;
    }
}

function updatePassiveCircleVisual(elapsedFraction, remainingSec) {
    if (typeof $ === "undefined") return;
    var circle = document.getElementById("passive_timer_circle");
    var numEl = document.getElementById("passive_timer_number");
    if (!circle) return;

    var frac = Math.max(0, Math.min(1, elapsedFraction));
    // Negative offset advances the empty gap clockwise from 12 o'clock
    var offset = -passiveCircumference * frac;
    circle.style.strokeDasharray = passiveCircumference + "px " + passiveCircumference + "px";
    circle.style.strokeDashoffset = offset + "px";

    if (frac >= 0.99) {
        circle.style.strokeOpacity = "0";
    } else {
        circle.style.strokeOpacity = "1";
    }

    if (numEl) {
        numEl.textContent = (remainingSec > 0 ? remainingSec.toFixed(1) : "0.0") + "s";
    }
}

function resetPassiveCircle(phase) {
    if (passiveAnimFrameId) {
        cancelAnimationFrame(passiveAnimFrameId);
        passiveAnimFrameId = null;
    }
    if (typeof $ === "undefined") return;
    var circle = document.getElementById("passive_timer_circle");
    var numEl = document.getElementById("passive_timer_number");
    var phaseLabel = document.getElementById("passive_phase_label");
    if (!circle) return;

    circle.style.strokeDasharray = passiveCircumference + "px " + passiveCircumference + "px";
    circle.style.strokeDashoffset = "0px";
    circle.style.strokeOpacity = "1";

    if (phase === "question") {
        circle.classList.remove("phase-decay");
        circle.classList.add("phase-question");
        if (phaseLabel) phaseLabel.textContent = "Revealing answer soon";
    } else if (phase === "decay") {
        circle.classList.remove("phase-question");
        circle.classList.add("phase-decay");
        if (phaseLabel) phaseLabel.textContent = "Next question soon";
    } else {
        circle.classList.remove("phase-question", "phase-decay");
        if (phaseLabel) phaseLabel.textContent = "Paused";
        if (numEl) numEl.textContent = "";
    }
}

function startPassiveCountdown(durationMs, phase, onComplete) {
    if (passiveAnimFrameId) {
        cancelAnimationFrame(passiveAnimFrameId);
        passiveAnimFrameId = null;
    }
    if (!appSettings.passiveMode) return;

    resetPassiveCircle(phase);
    passiveAnimDuration = durationMs;
    passiveAnimStartTime = performance.now();

    var initialRemaining = durationMs / 1000;
    updatePassiveCircleVisual(0, initialRemaining);

    function step(now) {
        if (!appSettings.passiveMode) {
            clearPassiveTimers();
            return;
        }
        var elapsed = now - passiveAnimStartTime;
        var fraction = Math.min(1, elapsed / passiveAnimDuration);
        var remainingSec = Math.max(0, (passiveAnimDuration - elapsed) / 1000);

        updatePassiveCircleVisual(fraction, remainingSec);

        if (fraction < 1) {
            passiveAnimFrameId = requestAnimationFrame(step);
        } else {
            passiveAnimFrameId = null;
            updatePassiveCircleVisual(1, 0);
            if (onComplete) {
                onComplete();
            }
        }
    }

    passiveAnimFrameId = requestAnimationFrame(step);
}

function togglePassiveMode() {
    appSettings.passiveMode = !appSettings.passiveMode;
    saveSettings();
    updatePassiveModeUI();
    if (appSettings.passiveMode) {
        if (typeof $ !== "undefined" && $("#stage").is(":visible") && typeof lines !== "undefined" && lines && lines.length > 0 && typeof index !== "undefined" && lines[index]) {
            startPassiveQuestionTimer();
        }
    } else {
        clearPassiveTimers();
        resetPassiveCircle();
        if (typeof $ !== "undefined") {
            $("#passive_status").text("Paused — click ▶ to resume");
        }
    }
}

function updatePassiveModeUI() {
    if (typeof $ === "undefined") return;
    var btn = $("#passive_mode_btn");
    var icon = $("#passive_mode_icon");
    if (appSettings.passiveMode) {
        $("#interactive_controls").hide();
        $("#passive_indicator").show();
        btn.addClass("is-active")
           .attr("title", "Passive Mode: Active (Click to Pause)")
           .attr("aria-label", "Pause Passive Mode");
        if (icon.length) icon.text("⏸");
        else btn.html('<span id="passive_mode_icon">⏸</span>');
        if ($("#setting_passive_mode").length) {
            $("#setting_passive_mode").prop("checked", true);
        }
        $("#passive_time_options").show();
    } else {
        $("#passive_indicator").hide();
        $("#interactive_controls").show();
        btn.removeClass("is-active")
           .attr("title", "Passive Mode: Off (Click to Play)")
           .attr("aria-label", "Enable Passive Mode");
        if (icon.length) icon.text("▶");
        else btn.html('<span id="passive_mode_icon">▶</span>');
        if ($("#setting_passive_mode").length) {
            $("#setting_passive_mode").prop("checked", false);
        }
        $("#passive_time_options").hide();
    }
}

function startPassiveQuestionTimer() {
    clearPassiveTimers();
    if (!appSettings.passiveMode) return;
    if (typeof lines === "undefined" || !lines || lines.length === 0) return;
    if (typeof $ !== "undefined") {
        $("#passive_status").text("Try to say the answer aloud!");
    }
    var qMs = Math.max(1000, (appSettings.questionTimeoutSec || 3.5) * 1000);

    var completed = false;
    function finishQuestionPhase() {
        if (completed) return;
        completed = true;
        clearPassiveTimers();
        handlePassiveAnswerReveal();
    }

    startPassiveCountdown(qMs, "question", finishQuestionPhase);
    passiveQuestionTimer = setTimeout(finishQuestionPhase, qMs + 50);
}

function handlePassiveAnswerReveal() {
    if (!appSettings.passiveMode || typeof lines === "undefined" || !lines || !lines[index]) return;
    var correctAnswers = transliterate(lines[index]).split(":")[1].split("/");
    var primaryAnswer = correctAnswers[0].trim();
    if (typeof $ !== "undefined") {
        $("#feedback")[0].innerHTML = "Answer: <span class=\"correct\">" + correctAnswers.join(" / ") + "</span>";
        $("#answer").val(primaryAnswer);
        $("#passive_status").text("Review answer");
    }
    if (appSettings.speakAnswers) {
        speakAnswer(primaryAnswer);
    }
    var decayMs = Math.max(1000, (appSettings.decayTimeoutSec || 2.5) * 1000);

    var completed = false;
    function finishDecayPhase() {
        if (completed) return;
        completed = true;
        clearPassiveTimers();
        if (appSettings.passiveMode) {
            showNext();
        }
    }

    startPassiveCountdown(decayMs, "decay", finishDecayPhase);
    passiveDecayTimer = setTimeout(finishDecayPhase, decayMs + 50);
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

function getLanguageFromLesson(l) {
    if (!l) return "";
    var cat = (l.category || "").trim();
    var file = (l.file || "").trim();
    if (cat === "TestCategory" || file === "lessons/test.txt") return "";
    if (/^Cantonese/i.test(cat) || /cantonese/i.test(file) || /\/c[0-9p]/i.test(file) || /\/ca\./i.test(file)) return "Cantonese";
    if (/^Hebrew/i.test(cat) || /hebrew/i.test(file)) return "Hebrew";
    if (/^Greek/i.test(cat) || /greek/i.test(file)) return "Greek";
    if (/^Polish/i.test(cat) || /polish/i.test(file)) return "Polish";
    if (/^Spanish/i.test(cat) || /spanish/i.test(file)) return "Spanish";
    if (/^Italian/i.test(cat) || /italian/i.test(file)) return "Italian";
    if (/^Mandarin/i.test(cat) || /mandarin/i.test(file)) return "Mandarin";
    if (/^Civics/i.test(cat) || /civics/i.test(file)) return "Civics";
    if (cat) return cat.split(/[. -]/)[0];
    return "";
}

function getAvailableLanguages() {
    var langs = [];
    var preferredOrder = ["Cantonese", "Hebrew", "Greek", "Polish", "Spanish", "Italian", "Mandarin", "Civics"];
    if (typeof lessonFiles !== "undefined") {
        for (var i = 1; i < lessonFiles.length; i++) {
            var lang = getLanguageFromLesson(lessonFiles[i]);
            if (lang && langs.indexOf(lang) === -1) {
                langs.push(lang);
            }
        }
    }
    langs.sort(function(a, b) {
        var ia = preferredOrder.indexOf(a);
        var ib = preferredOrder.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
    });
    return langs;
}

function getActiveLessonLanguage() {
    var $banner = $("#active_lesson_banner");
    var isBannerVisible = $banner.length && $banner.is(":visible") && $banner.css("display") !== "none";
    var hasActiveLines = (typeof lines !== "undefined" && lines && lines.length > 0);
    var lessonVal = $("#lesson").length ? $("#lesson").val() : "";
    var hasValidLessonSelect = (lessonVal && lessonVal !== "0");

    if (!isBannerVisible && !hasActiveLines && !hasValidLessonSelect) {
        return "";
    }

    // 1. Check data-lang-id on the active lesson banner
    var bannerLangId = $banner.attr("data-lang-id");
    if (bannerLangId) {
        var cfgBanner = getLanguageFlagConfig(bannerLangId);
        if (cfgBanner && cfgBanner.name) {
            return cfgBanner.name;
        }
    }

    // 2. Check currentLessonIndex
    if (typeof currentLessonIndex !== "undefined" && currentLessonIndex > 0 && typeof lessonFiles !== "undefined" && lessonFiles[currentLessonIndex]) {
        var curL = lessonFiles[currentLessonIndex];
        var langFromL = (typeof getLanguageFromLesson === "function") ? getLanguageFromLesson(curL) : "";
        if (langFromL) return langFromL;
        var lid = getActiveLanguageId(curL);
        var cfgl = getLanguageFlagConfig(lid);
        if (cfgl && cfgl.name) return cfgl.name;
    }

    // 3. Check activeSessionLanguage
    if (typeof activeSessionLanguage !== "undefined" && activeSessionLanguage) {
        var langIdFromActive = getLanguageIdForCategory(activeSessionLanguage);
        var cfgFromActive = getLanguageFlagConfig(langIdFromActive);
        if (cfgFromActive && cfgFromActive.name) return cfgFromActive.name;
    }

    // 4. Check #lesson element value
    if (hasValidLessonSelect && typeof lessonFiles !== "undefined") {
        var lIdx = parseInt(lessonVal, 10);
        if (!isNaN(lIdx) && lessonFiles[lIdx]) {
            var selLang = (typeof getLanguageFromLesson === "function") ? getLanguageFromLesson(lessonFiles[lIdx]) : "";
            if (selLang) return selLang;
            var lId = getActiveLanguageId(lessonFiles[lIdx]);
            var cfgSel = getLanguageFlagConfig(lId);
            if (cfgSel && cfgSel.name) return cfgSel.name;
        }
    }

    return "";
}

function selectAiModalLanguage(newLang) {
    if (!newLang) return;
    var prevLang = appSettings.selectedLanguage;
    if (prevLang === newLang) {
        renderLessonChecklist();
        updateAiGenStatusText();
        return;
    }

    if (!appSettings.completedLessonsByLang) {
        appSettings.completedLessonsByLang = {};
    }
    if (prevLang && Array.isArray(appSettings.completedLessons)) {
        appSettings.completedLessonsByLang[prevLang] = appSettings.completedLessons.slice();
    }

    appSettings.selectedLanguage = newLang;

    // Restore cached selection for new language if present
    if (Array.isArray(appSettings.completedLessonsByLang[newLang]) && appSettings.completedLessonsByLang[newLang].length > 0) {
        appSettings.completedLessons = appSettings.completedLessonsByLang[newLang].slice();
    } else {
        appSettings.completedLessons = [];
    }

    saveSettings();
    renderLessonChecklist();
    updateAiGenStatusText();
}

function renderLessonChecklist() {
    if (typeof $ === "undefined" || typeof lessonFiles === "undefined") return;
    var container = $("#settings_lessons_list");
    if (container.length === 0) return;

    var availableLangs = getAvailableLanguages();
    if (!appSettings.selectedLanguage || availableLangs.indexOf(appSettings.selectedLanguage) === -1) {
        appSettings.selectedLanguage = availableLangs.indexOf("Cantonese") !== -1 ? "Cantonese" : (availableLangs[0] || "Cantonese");
    }

    // Populate flag buttons in AI modal (row of flag buttons, no text, just flags)
    var $flagsRow = $("#ai_language_flags");
    if ($flagsRow.length) {
        $flagsRow.empty();
        for (var f = 0; f < LANGUAGE_FLAGS.length; f++) {
            var fLang = LANGUAGE_FLAGS[f];
            var isSelected = (fLang.name.toLowerCase() === appSettings.selectedLanguage.toLowerCase());
            var $flagBtn = $('<button>', {
                type: "button",
                id: "ai_flag_btn_" + fLang.id,
                class: "ai-flag-btn" + (isSelected ? " is-active" : ""),
                "data-lang-name": fLang.name,
                "data-lang-id": fLang.id,
                title: fLang.name + " (" + fLang.country + ")",
                "aria-label": fLang.name + " (" + fLang.country + ")",
                role: "radio",
                "aria-checked": isSelected ? "true" : "false"
            });
            // Strictly flags only, no text
            $flagBtn.html(fLang.svg);
            (function(targetName) {
                $flagBtn.on("click", function(e) {
                    e.preventDefault();
                    selectAiModalLanguage(targetName);
                });
            })(fLang.name);
            $flagsRow.append($flagBtn);
        }
    }

    // Populate language selector in settings modal (if present)
    var langSelect = $("#setting_language_select");
    if (langSelect.length) {
        var langOptionsHtml = "";
        for (var lIdx = 0; lIdx < availableLangs.length; lIdx++) {
            var langName = availableLangs[lIdx];
            langOptionsHtml += '<option value="' + langName + '"' + (langName === appSettings.selectedLanguage ? ' selected' : '') + '>' + langName + '</option>';
        }
        langSelect.html(langOptionsHtml);
        langSelect.val(appSettings.selectedLanguage);
    }

    var currentLang = appSettings.selectedLanguage;
    var relevantLessons = [];
    for (var i = 1; i < lessonFiles.length; i++) {
        var item = lessonFiles[i];
        if (getLanguageFromLesson(item) === currentLang) {
            relevantLessons.push(item);
        }
    }

    if (!appSettings.completedLessonsByLang) {
        appSettings.completedLessonsByLang = {};
    }

    // Ensure active completedLessons only contains lessons from current language
    var validCurrentCompleted = [];
    if (Array.isArray(appSettings.completedLessons)) {
        for (var cIdx = 0; cIdx < appSettings.completedLessons.length; cIdx++) {
            var path = appSettings.completedLessons[cIdx];
            var isRelevant = relevantLessons.some(function(rl) { return rl.file === path; });
            if (isRelevant) {
                validCurrentCompleted.push(path);
            }
        }
    }

    // If none currently valid for this language, check cached selections or default to the first lesson
    if (validCurrentCompleted.length === 0) {
        var cached = appSettings.completedLessonsByLang[currentLang];
        if (Array.isArray(cached) && cached.length > 0) {
            validCurrentCompleted = cached.filter(function(cp) {
                return relevantLessons.some(function(rl) { return rl.file === cp; });
            });
        }
        if (validCurrentCompleted.length === 0 && relevantLessons.length > 0) {
            var activeFile = (typeof currentLessonIndex !== "undefined" && currentLessonIndex > 0 && lessonFiles[currentLessonIndex]) ? lessonFiles[currentLessonIndex].file : "";
            var activeInRelevant = relevantLessons.some(function(rl) { return rl.file === activeFile; });
            validCurrentCompleted = [activeInRelevant ? activeFile : relevantLessons[0].file];
        }
    }

    appSettings.completedLessons = validCurrentCompleted;
    appSettings.completedLessonsByLang[currentLang] = validCurrentCompleted.slice();

    var html = "";
    if (relevantLessons.length === 0) {
        html = '<div style="padding: 10px; font-size: 0.8rem; color: #94a3b8; text-align: center;">No lessons found for ' + currentLang + '</div>';
    } else {
        for (var j = 0; j < relevantLessons.length; j++) {
            var l = relevantLessons[j];
            var isChecked = (appSettings.completedLessons.indexOf(l.file) !== -1);
            html += '<label class="lesson-check-item">' +
                '<input type="checkbox" class="lesson-chk" data-file="' + l.file + '" ' + (isChecked ? 'checked' : '') + ' onchange="onLessonCheckChange()">' +
                '<span>' + l.name + '</span>' +
                '<span class="lesson-check-category">' + l.category + '</span>' +
                '</label>';
        }
    }
    container.html(html);

    $("#settings_lang_lesson_count").text(relevantLessons.length + " lesson" + (relevantLessons.length === 1 ? "" : "s"));

    // Romanization is only applicable to Cantonese
    if (currentLang === "Cantonese") {
        $("#romanization_setting_section").show();
    } else {
        $("#romanization_setting_section").hide();
    }
}

function onSettingLanguageChange() {
    if (typeof $ === "undefined") return;
    var newLang = $("#setting_language_select").val();
    if (newLang) {
        selectAiModalLanguage(newLang);
    }
}

function onLessonCheckChange() {
    var checked = [];
    $(".lesson-chk:checked").each(function() {
        var f = $(this).attr("data-file");
        if (f) checked.push(f);
    });
    appSettings.completedLessons = checked;
    if (!appSettings.completedLessonsByLang) {
        appSettings.completedLessonsByLang = {};
    }
    if (appSettings.selectedLanguage) {
        appSettings.completedLessonsByLang[appSettings.selectedLanguage] = checked.slice();
    }
    saveSettings();
    updateAiGenStatusText();
}

function selectAllLessons(select) {
    $(".lesson-chk").prop("checked", !!select);
    onLessonCheckChange();
}

function selectCantoneseLessons() {
    appSettings.selectedLanguage = "Cantonese";
    saveSettings();
    renderLessonChecklist();
    selectAllLessons(true);
}

function selectHebrewLessons() {
    appSettings.selectedLanguage = "Hebrew";
    saveSettings();
    renderLessonChecklist();
    selectAllLessons(true);
}

function updateAiGenStatusText() {
    var lang = appSettings.selectedLanguage || "Cantonese";
    var count = (appSettings.completedLessons || []).length;
    var countText = count + " " + lang + " lesson" + (count === 1 ? "" : "s") + " selected";
    $("#ai_selected_count").text(countText);
    $("#ai_modal_language_display").text(lang);
    if ($("#ai_sentence_count").length) {
        $("#ai_sentence_count").val(appSettings.aiSentenceCount || 25);
    }
}

function openAiModal() {
    var activeLang = getActiveLessonLanguage();
    if (activeLang) {
        selectAiModalLanguage(activeLang);
    } else {
        renderLessonChecklist();
        updateAiGenStatusText();
    }
    if (typeof $ !== "undefined") {
        $("#ai_modal").fadeIn(150);
    }
}

function closeAiModal() {
    if (typeof $ !== "undefined") {
        $("#ai_modal").fadeOut(150);
    }
}

function getSelectedLessonText(callback) {
    if (typeof lines !== "undefined" && lines && lines.length > 0) {
        if (callback) callback(lines.join("\n"));
        return lines.join("\n");
    }
    if (typeof $ !== "undefined" && $("#list").length) {
        var raw = $("#list").text().trim();
        if (raw) {
            var rawLines = raw.split(/\r?\n/).filter(function(s) {
                return s.trim().split(":").length >= 2;
            });
            if (rawLines.length > 0) {
                if (callback) callback(rawLines.join("\n"));
                return rawLines.join("\n");
            }
        }
    }
    if (typeof $ !== "undefined" && typeof lessonFiles !== "undefined" && $("#lesson").length) {
        var lessonIdx = $("#lesson").val();
        if (lessonIdx && lessonIdx !== "0" && lessonFiles[lessonIdx] && lessonFiles[lessonIdx].file) {
            $.get(lessonFiles[lessonIdx].file, function(data) {
                if (callback) callback((data || "").trim());
            }).fail(function() {
                if (callback) callback("");
            });
            return "";
        }
    }
    if (callback) callback("");
    return "";
}

function openDownloadModal() {
    if (typeof $ === "undefined") return;
    $("#download_status").text("");
    $("#download_textarea").val("Loading question:answer pairs...");
    $("#download_modal").fadeIn(150);

    getSelectedLessonText(function(text) {
        if (!text) {
            $("#download_textarea").val("# No question:answer pairs are currently loaded.\n# Please select a lesson from the dropdown or synthesize practice sentences first.");
            $("#download_count").text("0 pairs");
        } else {
            $("#download_textarea").val(text);
            var pairCount = text.split(/\r?\n/).filter(function(l) { return l.trim().split(":").length >= 2; }).length;
            $("#download_count").text(pairCount + " pair" + (pairCount === 1 ? "" : "s"));
            setTimeout(function() {
                var el = $("#download_textarea")[0];
                if (el) {
                    el.focus();
                    el.select();
                }
            }, 60);
        }
    });
}

function closeDownloadModal() {
    if (typeof $ !== "undefined") {
        $("#download_modal").fadeOut(150);
    }
}

function copyDownloadText() {
    if (typeof $ === "undefined") return;
    var el = $("#download_textarea")[0];
    if (!el) return;
    el.select();
    var text = el.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            $("#download_status").text("✓ Copied to clipboard!");
            setTimeout(function() { $("#download_status").text(""); }, 2500);
        }).catch(function() {
            document.execCommand("copy");
            $("#download_status").text("✓ Copied!");
            setTimeout(function() { $("#download_status").text(""); }, 2500);
        });
    } else {
        document.execCommand("copy");
        $("#download_status").text("✓ Copied!");
        setTimeout(function() { $("#download_status").text(""); }, 2500);
    }
}

function saveDownloadToFile() {
    if (typeof $ === "undefined") return;
    var text = $("#download_textarea").val() || "";
    if (!text.trim() || text.indexOf(":") === -1) {
        $("#download_status").text("⚠️ No valid pairs to save.");
        return;
    }
    var lessonName = "";
    if ($("#lesson").length) {
        lessonName = $("#lesson option:selected").text().trim();
    }
    if (!lessonName || lessonName === "Please select a lesson...") {
        lessonName = "lesson";
    }
    var safeName = lessonName.replace(/[^a-zA-Z0-9_\u0590-\u05FF\u4e00-\u9fa5\.-]/g, "_")
                             .replace(/_+/g, "_")
                             .replace(/^_+|_+$/g, "");
    if (!safeName) safeName = "lesson";
    if (!safeName.toLowerCase().endsWith(".txt")) safeName += ".txt";

    try {
        var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        $("#download_status").text("✓ Saved as " + safeName);
        setTimeout(function() { $("#download_status").text(""); }, 3000);
    } catch (err) {
        $("#download_status").text("Error saving file: " + err.message);
    }
}

var lastUploadedFileName = "";

function openUploadModal() {
    if (typeof $ === "undefined") return;
    lastUploadedFileName = "";
    $("#upload_status").text("");
    updateUploadStatusCount();
    $("#upload_modal").fadeIn(150);
    setTimeout(function() {
        var el = $("#upload_textarea")[0];
        if (el) el.focus();
    }, 60);
}

function closeUploadModal() {
    if (typeof $ !== "undefined") {
        $("#upload_modal").fadeOut(150);
    }
}

function triggerUploadFilePicker() {
    if (typeof $ === "undefined") return;
    var input = $("#upload_file_input");
    if (input.length) {
        input[0].click();
    }
}

function handleUploadFileSelected(input) {
    if (!input || !input.files || !input.files[0]) return;
    var file = input.files[0];
    readUploadFile(file);
    input.value = "";
}

function readUploadFile(file) {
    if (!file) return;
    lastUploadedFileName = file.name || "";
    var reader = new FileReader();
    reader.onload = function(e) {
        var content = e.target.result || "";
        if (typeof $ !== "undefined") {
            $("#upload_textarea").val(content);
            updateUploadStatusCount();
            $("#upload_status").text("✓ Loaded file: " + file.name);
        }
    };
    reader.onerror = function() {
        if (typeof $ !== "undefined") {
            $("#upload_status").text("⚠️ Error reading file.");
        }
    };
    reader.readAsText(file);
}

function updateUploadStatusCount() {
    if (typeof $ === "undefined") return;
    var text = $("#upload_textarea").val() || "";
    var valid = text.split(/\r?\n/).filter(function(s) {
        return s.trim().split(":").length >= 2;
    });
    if (valid.length > 0) {
        $("#upload_count_badge").text(valid.length + " valid pair" + (valid.length === 1 ? "" : "s") + " detected");
    } else {
        $("#upload_count_badge").text("");
    }
}

function applyUploadedLesson() {
    if (typeof $ === "undefined") return;
    var text = $("#upload_textarea").val() || "";
    var rawLines = text.split(/\r?\n/);
    var validLines = $.grep(rawLines, function(s) {
        return s.trim().split(":").length >= 2;
    });

    if (validLines.length === 0) {
        $("#upload_status").html("<span style='color: #dc2626;'>⚠️ Please paste or load at least one line in 'question:answer' format.</span>");
        return;
    }

    // Capture the active lesson language before resetting any state
    var activeLang = getActiveLessonLanguage(); // e.g. "Spanish", "Cantonese", "Hebrew", etc.
    var activeLangId = activeLang ? getLanguageIdForCategory(activeLang) : "";

    lines = validLines;
    seen = new set(lines.length);
    $("#list").text(lines.join("\n"));

    var combinedAnswers = lines.map(function(l) { return l.split(":")[1] || ""; }).join(" ");
    var detectedLangId = "";

    // 1. Script checks for unambiguous alphabets
    if (/[\u0590-\u05FF]/.test(combinedAnswers)) {
        detectedLangId = "hebrew";
    } else if (/[\u0370-\u03FF]/.test(combinedAnswers)) {
        detectedLangId = "greek";
    } else if (/[\u4e00-\u9fa5]/.test(combinedAnswers)) {
        if (activeLangId === "mandarin" || (lastUploadedFileName && /mandarin/i.test(lastUploadedFileName))) {
            detectedLangId = "mandarin";
        } else {
            detectedLangId = "cantonese";
        }
    } else if (activeLangId) {
        // 2. If there's an active lesson, assume the uploaded file is in that lesson's language!
        detectedLangId = activeLangId;
    } else if (lastUploadedFileName) {
        // 3. Inspect uploaded filename
        var fn = lastUploadedFileName.toLowerCase();
        if (fn.indexOf("spanish") !== -1) detectedLangId = "spanish";
        else if (fn.indexOf("italian") !== -1) detectedLangId = "italian";
        else if (fn.indexOf("polish") !== -1) detectedLangId = "polish";
        else if (fn.indexOf("greek") !== -1) detectedLangId = "greek";
        else if (fn.indexOf("hebrew") !== -1) detectedLangId = "hebrew";
        else if (fn.indexOf("mandarin") !== -1) detectedLangId = "mandarin";
        else if (fn.indexOf("cantonese") !== -1 || /\bca\b|\bcp\b|\bc\d/i.test(fn)) detectedLangId = "cantonese";
        else if (fn.indexOf("civics") !== -1) detectedLangId = "civics";
    }

    // 4. Content character markers if still undetermined
    if (!detectedLangId) {
        if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(combinedAnswers)) {
            detectedLangId = "polish";
        } else if (/[¿¡áéíóúüñÁÉÍÓÚÜÑ]/.test(combinedAnswers)) {
            detectedLangId = "spanish";
        } else if (isJyutpingOrYale(combinedAnswers)) {
            detectedLangId = "cantonese";
        }
    }

    // 5. Fallback to app settings or default
    if (!detectedLangId) {
        if (appSettings.selectedLanguage) {
            detectedLangId = getLanguageIdForCategory(appSettings.selectedLanguage) || "spanish";
        } else {
            detectedLangId = "spanish";
        }
    }

    activeSessionLanguage = detectedLangId;
    var flagCfg = getLanguageFlagConfig(detectedLangId);
    var langDisplayName = flagCfg ? flagCfg.name : (detectedLangId.charAt(0).toUpperCase() + detectedLangId.slice(1));
    appSettings.selectedLanguage = langDisplayName;
    saveSettings();

    currentLessonIndex = -1;
    presentYtping = (activeSessionLanguage === "cantonese" && appSettings.romanization === "yale");
    linkToDictionary = (activeSessionLanguage === "cantonese");

    var customVal = "custom_upload_" + Date.now();
    var customLabel = lastUploadedFileName ? ("Uploaded: " + lastUploadedFileName) : ("Uploaded Lesson (" + lines.length + " pairs)");
    if ($("#lesson").length) {
        $("#lesson").append($("<option>", { value: customVal, text: customLabel, selected: true }));
        $("#lesson").val(customVal);
    }

    $(".flag-btn").removeClass("is-active");
    if (detectedLangId) {
        $("#flag_btn_" + detectedLangId).addClass("is-active");
    }

    updateActiveLessonBanner({
        name: customLabel,
        category: langDisplayName
    }, detectedLangId);

    hideTable();

    $("#stage").show();
    updatePassiveModeUI();
    showNext();
    updateList(lines);

    closeUploadModal();
}

var LANGUAGE_FLAGS = [
    {
        id: "cantonese",
        name: "Cantonese",
        country: "Hong Kong",
        flagEmoji: "🇭🇰",
        categories: ["Cantonese.ca", "Cantonese.Dan", "Cantonese 1", "Cantonese 4", "Cantonese 5", "Cantonese 6"],
        svg: '<svg viewBox="0 0 30 20" class="flag-svg" aria-hidden="true"><rect width="30" height="20" fill="#DE2910"/><g fill="#fff" transform="translate(15,10) scale(0.65)"><path d="M0,-8 C2,-4 5,-4 5,-1 C5,2 2,3 0,4 C-2,3 -5,2 -5,-1 C-5,-4 -2,-4 0,-8" transform="rotate(0)"/><path d="M0,-8 C2,-4 5,-4 5,-1 C5,2 2,3 0,4 C-2,3 -5,2 -5,-1 C-5,-4 -2,-4 0,-8" transform="rotate(72)"/><path d="M0,-8 C2,-4 5,-4 5,-1 C5,2 2,3 0,4 C-2,3 -5,2 -5,-1 C-5,-4 -2,-4 0,-8" transform="rotate(144)"/><path d="M0,-8 C2,-4 5,-4 5,-1 C5,2 2,3 0,4 C-2,3 -5,2 -5,-1 C-5,-4 -2,-4 0,-8" transform="rotate(216)"/><path d="M0,-8 C2,-4 5,-4 5,-1 C5,2 2,3 0,4 C-2,3 -5,2 -5,-1 C-5,-4 -2,-4 0,-8" transform="rotate(288)"/><circle r="1.5" fill="#DE2910"/></g></svg>'
    },
    {
        id: "spanish",
        name: "Spanish",
        country: "Spain",
        flagEmoji: "🇪🇸",
        categories: ["Spanish"],
        svg: '<svg viewBox="0 0 30 20" class="flag-svg" aria-hidden="true"><rect width="30" height="5" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/><rect y="15" width="30" height="5" fill="#AA151B"/><g transform="translate(7, 7) scale(0.35)"><rect width="10" height="15" rx="3" fill="#AA151B"/><rect x="2" y="2" width="6" height="11" fill="#F1BF00"/><circle cx="5" cy="0" r="3" fill="#F1BF00"/></g></svg>'
    },
    {
        id: "italian",
        name: "Italian",
        country: "Italy",
        flagEmoji: "🇮🇹",
        categories: ["Italian"],
        svg: '<svg viewBox="0 0 30 20" class="flag-svg" aria-hidden="true"><rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#ffffff"/><rect x="20" width="10" height="20" fill="#ce2b37"/></svg>'
    },
    {
        id: "hebrew",
        name: "Hebrew",
        country: "Israel",
        flagEmoji: "🇮🇱",
        categories: ["Hebrew"],
        svg: '<svg viewBox="0 0 30 20" class="flag-svg" aria-hidden="true"><rect width="30" height="20" fill="#ffffff"/><rect y="2.5" width="30" height="3" fill="#0038b8"/><rect y="14.5" width="30" height="3" fill="#0038b8"/><g stroke="#0038b8" stroke-width="0.9" fill="none" transform="translate(15,10)"><polygon points="0,-4.8 4.2,2.4 -4.2,2.4"/><polygon points="0,4.8 4.2,-2.4 -4.2,-2.4"/></g></svg>'
    },
    {
        id: "polish",
        name: "Polish",
        country: "Poland",
        flagEmoji: "🇵🇱",
        categories: ["Polish"],
        svg: '<svg viewBox="0 0 30 20" class="flag-svg" aria-hidden="true"><rect width="30" height="10" fill="#ffffff"/><rect y="10" width="30" height="10" fill="#DC143C"/></svg>'
    },
    {
        id: "greek",
        name: "Greek",
        country: "Greece",
        flagEmoji: "🇬🇷",
        categories: ["Greek"],
        svg: '<svg viewBox="0 0 30 20" class="flag-svg" aria-hidden="true"><rect width="30" height="20" fill="#0D5EAF"/><rect y="2.22" width="30" height="2.22" fill="#fff"/><rect y="6.66" width="30" height="2.22" fill="#fff"/><rect y="11.1" width="30" height="2.22" fill="#fff"/><rect y="15.54" width="30" height="2.22" fill="#fff"/><rect width="11.1" height="11.1" fill="#0D5EAF"/><rect x="4.44" width="2.22" height="11.1" fill="#fff"/><rect y="4.44" width="11.1" height="2.22" fill="#fff"/></svg>'
    },
    {
        id: "mandarin",
        name: "Mandarin",
        country: "China",
        flagEmoji: "🇨🇳",
        categories: ["Mandarin"],
        svg: '<svg viewBox="0 0 30 20" class="flag-svg" aria-hidden="true"><rect width="30" height="20" fill="#DE2910"/><polygon points="5,3 5.9,5.8 8.8,5.8 6.5,7.5 7.4,10.2 5,8.6 2.6,10.2 3.5,7.5 1.2,5.8 4.1,5.8" fill="#FFDE00"/><circle cx="10" cy="2" r="0.9" fill="#FFDE00"/><circle cx="12" cy="4" r="0.9" fill="#FFDE00"/><circle cx="12" cy="7" r="0.9" fill="#FFDE00"/><circle cx="10" cy="9" r="0.9" fill="#FFDE00"/></svg>'
    },
    {
        id: "civics",
        name: "Civics",
        country: "USA",
        flagEmoji: "🇺🇸",
        categories: ["Civics"],
        svg: '<svg viewBox="0 0 30 20" class="flag-svg" aria-hidden="true"><rect width="30" height="20" fill="#fff"/><g fill="#B22234"><rect width="30" height="1.54"/><rect y="3.08" width="30" height="1.54"/><rect y="6.15" width="30" height="1.54"/><rect y="9.23" width="30" height="1.54"/><rect y="12.31" width="30" height="1.54"/><rect y="15.38" width="30" height="1.54"/><rect y="18.46" width="30" height="1.54"/></g><rect width="12" height="10.77" fill="#3C3B6E"/><g fill="#fff" transform="scale(0.8) translate(1.5,1.5)"><circle cx="2" cy="2" r="0.6"/><circle cx="6" cy="2" r="0.6"/><circle cx="10" cy="2" r="0.6"/><circle cx="4" cy="5" r="0.6"/><circle cx="8" cy="5" r="0.6"/><circle cx="2" cy="8" r="0.6"/><circle cx="6" cy="8" r="0.6"/><circle cx="10" cy="8" r="0.6"/></g></svg>'
    }
];

function getLanguageFlagConfig(langId) {
    if (!langId) return null;
    var target = langId.toLowerCase();
    for (var i = 0; i < LANGUAGE_FLAGS.length; i++) {
        var item = LANGUAGE_FLAGS[i];
        if (item.id === target || item.name.toLowerCase() === target) {
            return item;
        }
    }
    return null;
}

function getLanguageIdForCategory(category) {
    if (!category) return "";
    var c = category.toLowerCase();
    if (c.indexOf("cantonese") !== -1) return "cantonese";
    if (c.indexOf("hebrew") !== -1) return "hebrew";
    if (c.indexOf("mandarin") !== -1) return "mandarin";
    if (c.indexOf("greek") !== -1) return "greek";
    if (c.indexOf("polish") !== -1) return "polish";
    if (c.indexOf("spanish") !== -1) return "spanish";
    if (c.indexOf("italian") !== -1) return "italian";
    if (c.indexOf("civics") !== -1) return "civics";
    return "";
}

function renderFlagButtons() {
    if (typeof $ === "undefined") return;
    var $container = $("#flag_buttons_bar");
    if (!$container.length) return;
    $container.empty();

    for (var i = 0; i < LANGUAGE_FLAGS.length; i++) {
        var lang = LANGUAGE_FLAGS[i];
        var btn = $('<button>', {
            type: "button",
            id: "flag_btn_" + lang.id,
            class: "flag-btn",
            "data-lang-id": lang.id,
            title: lang.name + " (" + lang.country + ")",
            "aria-label": lang.name + " (" + lang.country + ") lessons"
        });
        btn.html(lang.svg + '<span>' + lang.name + '</span>');
        (function(languageId) {
            btn.on("click", function() {
                openLanguageLessonsModal(languageId);
            });
        })(lang.id);
        $container.append(btn);
    }
}

function openLanguageLessonsModal(langId) {
    if (typeof $ === "undefined") return;
    var lang = getLanguageFlagConfig(langId);
    if (!lang) return;

    $("#lang_modal_flag").html(lang.svg);
    $("#lang_modal_heading").text(lang.name + " Lessons (" + lang.country + ")");

    var $list = $("#lang_modal_list");
    $list.empty();

    var matchingLessons = [];
    if (typeof lessonFiles !== "undefined") {
        for (var j = 1; j < lessonFiles.length; j++) {
            var cur = lessonFiles[j];
            if (!cur || cur.category === "TestCategory") continue;
            var curLang = (typeof getLanguageFromLesson === "function") ? getLanguageFromLesson(cur) : "";
            if (curLang.toLowerCase() === lang.name.toLowerCase() || lang.categories.indexOf(cur.category) !== -1) {
                matchingLessons.push({ idx: j, lesson: cur });
            }
        }
    }

    if (matchingLessons.length === 0) {
        $list.html('<div style="padding: 12px; color: #64748b; font-size: 0.9rem;">No lessons found for ' + lang.name + '.</div>');
    } else {
        for (var k = 0; k < matchingLessons.length; k++) {
            var item = matchingLessons[k];
            var rowBtn = $('<button>', {
                type: "button",
                class: "lang-lesson-row-btn",
                id: "lesson_pick_" + item.idx,
                "data-lesson-idx": item.idx
            });
            rowBtn.html(
                '<span class="lang-lesson-name">' + item.lesson.name + '</span>' +
                '<span class="lang-lesson-cat">' + item.lesson.category + '</span>'
            );
            (function(idx) {
                rowBtn.on("click", function() {
                    selectAndStartLesson(idx);
                });
            })(item.idx);
            $list.append(rowBtn);
        }
    }

    $("#language_lessons_modal").fadeIn(150);
}

function closeLanguageLessonsModal() {
    if (typeof $ !== "undefined") {
        $("#language_lessons_modal").fadeOut(150);
    }
}

function getActiveLanguageId(curLesson, fallbackLangId) {
    if (fallbackLangId) {
        var fromFb = getLanguageIdForCategory(fallbackLangId);
        if (fromFb) return fromFb;
    }
    if (curLesson) {
        if (typeof getLanguageFromLesson === "function") {
            var lName = getLanguageFromLesson(curLesson);
            if (lName) {
                var fromName = getLanguageIdForCategory(lName);
                if (fromName) return fromName;
            }
        }
        if (curLesson.category) {
            var fromCat = getLanguageIdForCategory(curLesson.category);
            if (fromCat) return fromCat;
        }
    }
    if (typeof activeSessionLanguage !== "undefined" && activeSessionLanguage) {
        var fromActive = getLanguageIdForCategory(activeSessionLanguage);
        if (fromActive) return fromActive;
    }
    if (typeof appSettings !== "undefined" && appSettings.selectedLanguage) {
        var fromSettings = getLanguageIdForCategory(appSettings.selectedLanguage);
        if (fromSettings) return fromSettings;
    }
    return "cantonese";
}

function openActiveLanguageLessonsModal() {
    var $banner = $("#active_lesson_banner");
    var langId = $banner.attr("data-lang-id");
    if (!langId && typeof currentLessonIndex !== "undefined" && typeof lessonFiles !== "undefined" && lessonFiles[currentLessonIndex]) {
        langId = getActiveLanguageId(lessonFiles[currentLessonIndex]);
    }
    if (!langId && typeof activeSessionLanguage !== "undefined" && activeSessionLanguage) {
        langId = getLanguageIdForCategory(activeSessionLanguage);
    }
    if (!langId && typeof appSettings !== "undefined" && appSettings.selectedLanguage) {
        langId = getLanguageIdForCategory(appSettings.selectedLanguage);
    }
    if (!langId) {
        langId = "cantonese";
    }
    openLanguageLessonsModal(langId);
}

function updateActiveLessonBanner(curLesson, langId) {
    if (typeof $ === "undefined") return;
    var $banner = $("#active_lesson_banner");
    if (!curLesson) {
        currentLessonIndex = -1;
        if ($banner.length) $banner.hide().removeAttr("data-lang-id");
        $("#toggleTable").hide();
        $("#table_toggle_container").hide();
        $("#passive_mode_btn").hide();
        $("#vocabTable").hide();
        $("#vocabTableWrapper").hide();
        return;
    }
    var effectiveLangId = getActiveLanguageId(curLesson, langId);
    var flagObj = getLanguageFlagConfig(effectiveLangId) || (typeof appSettings !== "undefined" ? getLanguageFlagConfig(appSettings.selectedLanguage) : null);
    var flagHtml = flagObj ? flagObj.svg : "";
    if ($banner.length) {
        $banner.attr("data-lang-id", effectiveLangId);
        $banner.attr("role", "button");
        $banner.attr("tabindex", "0");
        $banner.attr("title", "Click to select a different lesson for " + (flagObj ? flagObj.name : "active language"));
        $banner.attr("aria-label", "Active lesson: " + curLesson.name + ". Click to choose lesson.");
        $banner.html(
            '<span class="active-badge-label" title="Click to choose a lesson">Active:</span> ' +
            (flagHtml ? '<span class="active-badge-flag">' + flagHtml + '</span> ' : '') +
            '<strong>' + curLesson.name + '</strong>' +
            (curLesson.category ? '<span style="color: #64748b; font-size: 0.8rem; margin-left: 4px;">(' + curLesson.category + ')</span>' : '') +
            ' <span class="active-badge-action" title="Click to choose lesson" aria-hidden="true">▾</span>'
        ).show();
    }
    if (!$("#vocabTableWrapper").is(":visible")) {
        $("#table_toggle_container").show();
        $("#toggleTable").show();
    }
    $("#passive_mode_btn").show();
}

$(document).on("click", "#active_lesson_banner, .active-badge-label", function(e) {
    e.preventDefault();
    openActiveLanguageLessonsModal();
});
$(document).on("keydown", "#active_lesson_banner", function(e) {
    if (e.which === 13 || e.which === 32) {
        e.preventDefault();
        openActiveLanguageLessonsModal();
    }
});

function selectAndStartLesson(lessonIdx) {
    closeLanguageLessonsModal();
    if (typeof lessonFiles === "undefined") return;
    var curLesson = lessonFiles[lessonIdx];
    if (!curLesson) return;

    currentLessonIndex = lessonIdx;
    activeSessionLanguage = "";
    sessionCharactersMap = {};
    clearPassiveTimers();

    if ($("#lesson").length) {
        $("#lesson").val(lessonIdx);
    }

    hideTable();

    var cat = (curLesson.category || "").toLowerCase();
    var isCantonese = (cat.indexOf("cantonese") !== -1);
    var langId = "";
    if (isCantonese) {
        activeSessionLanguage = "cantonese";
        langId = "cantonese";
    } else if (cat.indexOf("hebrew") !== -1) {
        activeSessionLanguage = "hebrew";
        langId = "hebrew";
    } else if (cat.indexOf("mandarin") !== -1) {
        activeSessionLanguage = "mandarin";
        langId = "mandarin";
    } else if (cat.indexOf("greek") !== -1) {
        activeSessionLanguage = "greek";
        langId = "greek";
    } else if (cat.indexOf("polish") !== -1) {
        activeSessionLanguage = "polish";
        langId = "polish";
    } else if (cat.indexOf("spanish") !== -1) {
        activeSessionLanguage = "spanish";
        langId = "spanish";
    } else if (cat.indexOf("italian") !== -1) {
        activeSessionLanguage = "italian";
        langId = "italian";
    } else if (cat.indexOf("civics") !== -1) {
        activeSessionLanguage = "civics";
        langId = "civics";
    } else {
        activeSessionLanguage = cat;
        langId = cat;
    }

    presentYtping = (activeSessionLanguage === "cantonese" && appSettings.romanization === "yale");
    linkToDictionary = isCantonese && !!curLesson.linkToDictionary;

    // Highlight active flag button
    $(".flag-btn").removeClass("is-active");
    if (langId) {
        $("#flag_btn_" + langId).addClass("is-active");
    }

    // Update active banner
    updateActiveLessonBanner(curLesson, langId);

    // Load file and start immediately
    $.get(curLesson.file, function(raw) {
        $("#list").text(raw);
        lines = raw.split(/\r?\n/);
        lines = $.grep(lines, function(s) { return s.trim().split(":").length >= 2; });
        seen = new set(lines.length);
        presentYtping = (appSettings.romanization === "yale");
        $("#stage").show();
        updatePassiveModeUI();
        showNext();
        updateList(lines);
    }).fail(function() {
        alert("Failed to load lesson file: " + curLesson.file);
        updateActiveLessonBanner(null);
    });
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

    renderLessonChecklist();
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

loadSettings();

function set(n)
{
    var len = n || 0;
    this.data = new Uint8Array(len);
    this.count = 0;
    this.max = len;

    this.add = function(k) {
        if (k >= 0 && k < this.max && !this.data[k]) {
            this.data[k] = 1;
            this.count++;
        }
    };
    this.contains = function(k) {
        return (k >= 0 && k < this.max) ? (this.data[k] === 1) : false;
    };
    this.size = function() {
        return this.count;
    };
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

    if (forgiveTones)
    {
        return res.normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/ü/gi, "u")
                .replace(/v/gi, "u")
                .replace(/[ 1-9\s]/g, "")
                .toLowerCase();
    }

    var cat = getLessonCategory();
    var isMandarin = (typeof activeSessionLanguage !== "undefined" && activeSessionLanguage === "mandarin") || (cat.indexOf("mandarin") !== -1);
    if (isMandarin || /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i.test(res))
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

function getSpeechRate() {
    var speed = (appSettings && appSettings.speechSpeed) || "normal";
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
            cleanText = replaceJyutpingTones(cleanText).trim();
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
    if (cat.indexOf("italian") !== -1) return "it-IT";
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
    speakText(textToSpeak, getQuestionLanguage(question), null, 0.9); // Fixed rate for questions
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

    speakText(singleAns, lang, speakSrc, getSpeechRate()); // Target language uses configured speed
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
            if ($("#timer_ring_modal").is(":visible")) {
                closeTimerRingModal();
            }
            if ($("#settings_modal").is(":visible")) {
                closeSettingsModal();
            }
            if ($("#ai_modal").is(":visible")) {
                closeAiModal();
            }
            if ($("#download_modal").is(":visible")) {
                closeDownloadModal();
            }
            if ($("#upload_modal").is(":visible")) {
                closeUploadModal();
            }
            if ($("#language_lessons_modal").is(":visible")) {
                closeLanguageLessonsModal();
            }
            if ($("#help_modal").is(":visible")) {
                closeHelpModal();
            }
        }
    });
    $(document).on("click", "#timer_ring_modal", function(e) {
        if ($(e.target).is("#timer_ring_modal")) {
            closeTimerRingModal();
        }
    });
    $(document).on("click", "#settings_modal", function(e) {
        if ($(e.target).is("#settings_modal")) {
            closeSettingsModal();
        }
    });
    $(document).on("click", "#ai_modal", function(e) {
        if ($(e.target).is("#ai_modal")) {
            closeAiModal();
        }
    });
    $(document).on("click", "#download_modal", function(e) {
        if ($(e.target).is("#download_modal")) {
            closeDownloadModal();
        }
    });
    $(document).on("click", "#upload_modal", function(e) {
        if ($(e.target).is("#upload_modal")) {
            closeUploadModal();
        }
    });
    $(document).on("click", "#language_lessons_modal", function(e) {
        if ($(e.target).is("#language_lessons_modal")) {
            closeLanguageLessonsModal();
        }
    });
    $(document).on("click", "#help_modal", function(e) {
        if ($(e.target).is("#help_modal")) {
            closeHelpModal();
        }
    });
    $(document).on("dragover", "#upload_textarea", function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).addClass("drag-over");
    });
    $(document).on("dragleave drop", "#upload_textarea", function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass("drag-over");
    });
    $(document).on("drop", "#upload_textarea", function(e) {
        var dt = e.originalEvent && e.originalEvent.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            readUploadFile(dt.files[0]);
        }
    });
    $(document).on("input", "#upload_textarea", function() {
        updateUploadStatusCount();
    });
}

function checkAnswer()
{
    var answer=$("#answer")[0].value;
    var correctAnswers= transliterate(lines[index]).split(":")[1].split("/");
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
    if (!lines || lines.length === 0) {
        tableData = "";
        $("#vocabTable").empty().hide();
        $("#vocabTableWrapper").hide();
        $("#toggleTable").hide();
        $("#table_toggle_container").hide();
        $("#passive_mode_btn").hide();
        return;
    }

    var cat = getLessonCategory();
    var isCantonese = (activeSessionLanguage === "cantonese") || (cat.indexOf("cantonese") !== -1);
    var rows = [];
    for (var i = 0; i < lines.length; i++)
    {
        var rawAnswer = lines[i].split(":")[1] || "";
        var value = transliterate(rawAnswer);
        // This dictionary is only for Cantonese. Other languages should not have links.
        if (linkToDictionary == true && isCantonese && !/[\u0590-\u05FF]/.test(rawAnswer)) {
            value = "<a href=\"http://www.cantonese.sheik.co.uk/dictionary/search/?searchtype=3&text=" + getQueryText(rawAnswer) + "\">"
                    + value
                    + "</a>";
        }
        var speakerBtn = " <span class=\"speaker-btn speaker-vocab\" role=\"button\" tabindex=\"0\" title=\"Read answer out loud\" aria-label=\"Read answer out loud\" data-answer=\"" + escapeHtmlAttr(rawAnswer) + "\" onclick=\"readVocabAnswer(event, this)\">🔊</span>";
        var isSeen = (typeof seen !== "undefined" && seen && typeof seen.contains === "function" && seen.contains(i));
        var rowClass = isSeen ? ' class="seen"' : '';
        var rowStyle = isSeen ? ' style="color: #16a34a;"' : ' style="color: #000000;"';
        rows.push("<tr" + rowClass + rowStyle + "><td>" + lines[i].split(":")[0] + "</td><td>"
                    + value
                    + speakerBtn
                    + "</td></tr>"
        );
    }
    tableData = rows.join("");
    var tableEl = document.getElementById("vocabTable");
    if (tableEl) {
        tableEl.innerHTML = tableData;
    }

    if (lines && lines.length > 0) {
        if ($("#vocabTableWrapper").is(":visible") || $("#vocabTable").is(":visible")) {
            $("#table_toggle_container").hide();
            $("#toggleTable").hide();
        } else {
            $("#table_toggle_container").show();
            $("#toggleTable").show();
        }
        $("#passive_mode_btn").show();
    } else {
        $("#table_toggle_container").hide();
        $("#toggleTable").hide();
        $("#passive_mode_btn").hide();
    }
}

function setQuestion(index)
{
    if (typeof markSeen === "function") {
        markSeen(index);
    }
    var questionText = lines[index].split(":")[0];
    $("#question_txt")[0].innerHTML = "<span class=\"lesser-text\">["+index+"/"+seen.size()+"/"+lines.length+"]</span> " + questionText + " <span id=\"speaker_question\" class=\"speaker-btn\" role=\"button\" tabindex=\"0\" title=\"Read question out loud\" aria-label=\"Read question out loud\" onclick=\"readQuestion(event)\">🔊</span>";
    
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
    if (appSettings.speakAnswers) {
        speakAnswer(correctAnswers[answerIdx]);
    }
    $("#answer")[0].value = correctAnswers[answerIdx];
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
    if (typeof seen !== "undefined" && seen && typeof seen.add === "function") {
        seen.add(n);
    }
    var tableEl = document.getElementById("vocabTable");
    if (tableEl && tableEl.rows && tableEl.rows[n]) {
        var row = tableEl.rows[n];
        row.className = "seen";
        row.style.color = "#16a34a";
        var cells = row.cells;
        if (cells) {
            for (var c = 0; c < cells.length; c++) {
                cells[c].style.color = "#16a34a";
            }
        }
    }
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

function showTable()
{
    $("#vocabTableWrapper").show();
    $("#vocabTable").show();
    $("#table_toggle_container").hide();
    $("#toggleTable").hide();
}

function hideTable()
{
    $("#vocabTableWrapper").hide();
    $("#vocabTable").hide();
    if (typeof lines !== "undefined" && lines && lines.length > 0) {
        $("#table_toggle_container").show();
        $("#toggleTable").show();
    } else {
        $("#table_toggle_container").hide();
        $("#toggleTable").hide();
    }
}

function toggleTable()
{
    if ($("#vocabTableWrapper").is(":visible") || $("#vocabTable").is(":visible")) {
        hideTable();
    } else {
        showTable();
    }
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
        $("#ai_gen_status").html('<span class="ai-gen-error">Please select at least 1 completed lesson above.</span>');
        return;
    }

    // Identify source lesson names, categories, and language from selected files
    var sourceLessonNames = [];
    var sourceCategory = "";
    var sourceLanguage = "";

    if (typeof lessonFiles !== "undefined") {
        for (var sIdx = 0; sIdx < selectedFiles.length; sIdx++) {
            var sFile = selectedFiles[sIdx];
            for (var lfIdx = 1; lfIdx < lessonFiles.length; lfIdx++) {
                var lf = lessonFiles[lfIdx];
                if (lf && lf.file === sFile) {
                    if (sourceLessonNames.indexOf(lf.name) === -1) {
                        sourceLessonNames.push(lf.name);
                    }
                    if (!sourceCategory && lf.category) {
                        sourceCategory = lf.category;
                    }
                    if (!sourceLanguage && typeof getLanguageFromLesson === "function") {
                        sourceLanguage = getLanguageFromLesson(lf);
                    }
                    break;
                }
            }
        }
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

        // Determine target language from source lessons or chosen appSettings.selectedLanguage
        var targetLanguage = (sourceLanguage || appSettings.selectedLanguage || "cantonese").toLowerCase();

        // Check if vocabulary content has Hebrew characters or Greek characters
        var hasHebrewChars = combinedVocab.some(function(line) {
            return /[\u0590-\u05FF]/.test(line);
        });
        if (hasHebrewChars) {
            targetLanguage = "hebrew";
        }
        var hasGreekChars = combinedVocab.some(function(line) {
            return /[\u0370-\u03FF]/.test(line);
        });
        if (hasGreekChars) {
            targetLanguage = "greek";
        }

        var displayLang = targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1);
        $("#ai_gen_status").html('<span class="ai-gen-status">Composing ' + requestedCount + ' ' + displayLang + ' sentences strictly from ' + combinedVocab.length + ' vocabulary items...</span>');

        // Call our server-side Gemini route
        $.ajax({
            url: "/api/generate-sentences",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                vocabList: combinedVocab,
                count: requestedCount,
                language: targetLanguage,
                lessonTitle: "AI Synthesized Practice (" + displayLang + ")"
            }),
            success: function(data) {
                isGeneratingSentences = false;
                $("#ai_gen_btn").prop("disabled", false).text("Generate Sentences ✨");

                if (!data || !data.sentences || data.sentences.length === 0) {
                    $("#ai_gen_status").html('<span class="ai-gen-error">No sentences generated. Try again or check API configuration.</span>');
                    return;
                }

                // Format generated sentences into FlashType line syntax:
                // "English prompt:primary_target/alternative1/alternative2"
                var generatedLines = data.sentences.map(function(item) {
                    var mainAns = (item.target || item.jyutping || item.hebrew || "").trim();
                    var ansList = [mainAns];
                    if (Array.isArray(item.alternatives)) {
                        item.alternatives.forEach(function(alt) {
                            var a = (typeof alt === "string" ? alt : "").trim();
                            if (a && ansList.indexOf(a) === -1) {
                                ansList.push(a);
                            }
                        });
                    }
                    return item.english.trim() + ":" + ansList.join("/");
                });

                // Load characters map if Cantonese
                sessionCharactersMap = {};
                data.sentences.forEach(function(item) {
                    var targetText = (item.target || item.jyutping || "").trim();
                    if (item.characters && targetText) {
                        var cKey = clean(targetText);
                        sessionCharactersMap[cKey] = item.characters.trim();
                        // Also map transliterated Yale version
                        var yKey = clean(transliterate(targetText));
                        sessionCharactersMap[yKey] = item.characters.trim();
                    }
                });

                var finalLang = data.language || sourceLanguage || targetLanguage || "cantonese";
                var finalLangId = getLanguageIdForCategory(finalLang) || finalLang.toLowerCase();

                activeSessionLanguage = finalLangId;
                linkToDictionary = (activeSessionLanguage === "cantonese");
                lines = generatedLines;
                seen = new set(lines.length);
                presentYtping = (activeSessionLanguage === "cantonese" && appSettings.romanization === "yale");
                clearPassiveTimers();

                // Format descriptive lesson name for AI generated practice
                var aiLessonTitle = "";
                if (sourceLessonNames.length === 1) {
                    aiLessonTitle = "AI: " + sourceLessonNames[0];
                } else if (sourceLessonNames.length === 2) {
                    aiLessonTitle = "AI: " + sourceLessonNames[0] + ", " + sourceLessonNames[1];
                } else if (sourceLessonNames.length > 2) {
                    aiLessonTitle = "AI: " + sourceLessonNames[0] + " +" + (sourceLessonNames.length - 1) + " more";
                } else {
                    var capLang = finalLangId.charAt(0).toUpperCase() + finalLangId.slice(1);
                    aiLessonTitle = "AI Practice (" + capLang + ")";
                }

                var aiCategoryLabel = "AI Generated · " + generatedLines.length + " sentences";

                var aiLessonObj = {
                    name: aiLessonTitle,
                    category: aiCategoryLabel
                };

                // Update active indicator banner with correct flag and lesson name
                updateActiveLessonBanner(aiLessonObj, finalLangId);

                // Highlight the corresponding language flag button in the top navigation
                $(".flag-btn").removeClass("is-active");
                if (finalLangId) {
                    $("#flag_btn_" + finalLangId).addClass("is-active");
                }

                // Update hidden #lesson selector if present
                var aiLessonValue = "ai_gen_" + Date.now();
                if ($("#lesson").length) {
                    $("#lesson").append($("<option>", { value: aiLessonValue, text: aiLessonTitle, selected: true }));
                    $("#lesson").val(aiLessonValue);
                }

                hideTable();

                $("#stage").show();
                updatePassiveModeUI();
                showNext();
                updateList(lines);

                $("#ai_gen_status").html('<span class="ai-gen-status">✨ Loaded ' + generatedLines.length + ' practice sentences!</span>');
                setTimeout(function() {
                    closeAiModal();
                }, 1000);
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


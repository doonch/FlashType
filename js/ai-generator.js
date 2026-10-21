/* =========================================================================
 * js/ai-generator.js
 * AI Practice Sentence Synthesis Engine (Gemini API) and Lesson Checklist Modal.
 * ========================================================================= */

var isGeneratingSentences = false;

function onAiSentenceCountChange() {
    var val = parseInt($("#ai_sentence_count").val(), 10) || 25;
    if (typeof appSettings !== "undefined") {
        appSettings.aiSentenceCount = val;
        if (typeof saveSettings === "function") {
            saveSettings();
        }
    }
}

function selectAiModalLanguage(newLang) {
    if (!newLang || typeof appSettings === "undefined") return;
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

    if (typeof saveSettings === "function") {
        saveSettings();
    }
    renderLessonChecklist();
    updateAiGenStatusText();
}

function renderLessonChecklist() {
    if (typeof $ === "undefined" || typeof lessonFiles === "undefined" || typeof appSettings === "undefined") return;
    var container = $("#settings_lessons_list");
    if (container.length === 0) return;

    var availableLangs = (typeof getAvailableLanguages === "function") ? getAvailableLanguages() : [];
    if (!appSettings.selectedLanguage || availableLangs.indexOf(appSettings.selectedLanguage) === -1) {
        appSettings.selectedLanguage = availableLangs.indexOf("Cantonese") !== -1 ? "Cantonese" : (availableLangs[0] || "Cantonese");
    }

    // Populate flag buttons in AI modal (row of flag buttons, no text, just flags)
    var $flagsRow = $("#ai_language_flags");
    if ($flagsRow.length && typeof LANGUAGE_FLAGS !== "undefined") {
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
        if (typeof getLanguageFromLesson === "function" && getLanguageFromLesson(item) === currentLang) {
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
    if (typeof appSettings !== "undefined") {
        appSettings.completedLessons = checked;
        if (!appSettings.completedLessonsByLang) {
            appSettings.completedLessonsByLang = {};
        }
        if (appSettings.selectedLanguage) {
            appSettings.completedLessonsByLang[appSettings.selectedLanguage] = checked.slice();
        }
        if (typeof saveSettings === "function") {
            saveSettings();
        }
    }
    updateAiGenStatusText();
}

function selectAllLessons(select) {
    $(".lesson-chk").prop("checked", !!select);
    onLessonCheckChange();
}

function selectCantoneseLessons() {
    if (typeof appSettings !== "undefined") {
        appSettings.selectedLanguage = "Cantonese";
        if (typeof saveSettings === "function") {
            saveSettings();
        }
    }
    renderLessonChecklist();
    selectAllLessons(true);
}

function selectHebrewLessons() {
    if (typeof appSettings !== "undefined") {
        appSettings.selectedLanguage = "Hebrew";
        if (typeof saveSettings === "function") {
            saveSettings();
        }
    }
    renderLessonChecklist();
    selectAllLessons(true);
}

function updateAiGenStatusText() {
    if (typeof appSettings === "undefined") return;
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
    var activeLang = (typeof getActiveLessonLanguage === "function") ? getActiveLessonLanguage() : "";
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

function generateSentencesFromCompletedLessons() {
    if (isGeneratingSentences) return;

    var selectedFiles = (typeof appSettings !== "undefined" && appSettings.completedLessons) || [];
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

        var requestedCount = (typeof appSettings !== "undefined" && appSettings.aiSentenceCount) || 25;
        if ($("#ai_sentence_count").length) {
            var val = parseInt($("#ai_sentence_count").val(), 10);
            if (!isNaN(val) && val > 0) requestedCount = val;
        }

        var targetLanguage = (sourceLanguage || (appSettings && appSettings.selectedLanguage) || "cantonese").toLowerCase();

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
        var hasMalayalamChars = combinedVocab.some(function(line) {
            return /[\u0D00-\u0D7F]/.test(line);
        });
        if (hasMalayalamChars) {
            targetLanguage = "malayalam";
        }

        var displayLang = targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1);
        $("#ai_gen_status").html('<span class="ai-gen-status">Composing ' + requestedCount + ' ' + displayLang + ' sentences strictly from ' + combinedVocab.length + ' vocabulary items...</span>');

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

                if (typeof sessionCharactersMap !== "undefined") {
                    sessionCharactersMap = {};
                    data.sentences.forEach(function(item) {
                        var targetText = (item.target || item.jyutping || "").trim();
                        if (item.characters && targetText) {
                            var cKey = clean(targetText);
                            sessionCharactersMap[cKey] = item.characters.trim();
                            var yKey = clean(transliterate(targetText));
                            sessionCharactersMap[yKey] = item.characters.trim();
                        }
                    });
                }

                var finalLang = data.language || sourceLanguage || targetLanguage || "cantonese";
                var finalLangId = (typeof getLanguageIdForCategory === "function") ? (getLanguageIdForCategory(finalLang) || finalLang.toLowerCase()) : finalLang.toLowerCase();

                activeSessionLanguage = finalLangId;
                linkToDictionary = (activeSessionLanguage === "cantonese");
                lines = generatedLines;
                if (typeof set === "function") {
                    seen = new set(lines.length);
                }
                if (typeof resetFirstTryTracker === "function") {
                    resetFirstTryTracker(lines.length);
                }
                presentYtping = (activeSessionLanguage === "cantonese" && typeof appSettings !== "undefined" && appSettings.romanization === "yale");
                if (typeof clearPassiveTimers === "function") {
                    clearPassiveTimers();
                }

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

                if (typeof updateActiveLessonBanner === "function") {
                    updateActiveLessonBanner(aiLessonObj, finalLangId);
                }

                $(".flag-btn").removeClass("is-active");
                if (finalLangId) {
                    $("#flag_btn_" + finalLangId).addClass("is-active");
                }

                var aiLessonValue = "ai_gen_" + Date.now();
                if ($("#lesson").length) {
                    $("#lesson").append($("<option>", { value: aiLessonValue, text: aiLessonTitle, selected: true }));
                    $("#lesson").val(aiLessonValue);
                }

                if (typeof hideTable === "function") {
                    hideTable();
                }

                $("#stage").show();
                if (typeof updatePassiveModeUI === "function") {
                    updatePassiveModeUI();
                }
                if (typeof showNext === "function") {
                    showNext();
                }
                if (typeof updateList === "function") {
                    updateList(lines);
                }

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

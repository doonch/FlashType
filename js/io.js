/* =========================================================================
 * js/io.js
 * Lesson File Input / Output: Download modal, export, and custom lesson upload.
 * ========================================================================= */

/**
 * Retrieves the raw text (lines of "question:answer") for the currently active or selected lesson.
 * @param {Function} [callback] - Invoked with the text content.
 * @returns {string} Text content if immediately available.
 */
function getSelectedLessonText(callback) {
    if (typeof lines !== "undefined" && lines && lines.length > 0) {
        var text = lines.join("\n");
        if (callback) callback(text);
        return text;
    }
    if (typeof $ !== "undefined" && $("#list").length) {
        var raw = $("#list").text().trim();
        if (raw) {
            var rawLines = raw.split(/\r?\n/).filter(function(s) {
                return s.trim().split(":").length >= 2;
            });
            if (rawLines.length > 0) {
                var rawText = rawLines.join("\n");
                if (callback) callback(rawText);
                return rawText;
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

/* =========================================================================
 * Download Modal Functions
 * ========================================================================= */

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

/* =========================================================================
 * Upload Custom Lesson Modal Functions
 * ========================================================================= */

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
    var activeLang = (typeof getActiveLessonLanguage === "function") ? getActiveLessonLanguage() : "";
    var activeLangId = (activeLang && typeof getLanguageIdForCategory === "function") ? getLanguageIdForCategory(activeLang) : "";

    lines = validLines;
    seen = new set(lines.length);
    if (typeof resetFirstTryTracker === "function") {
        resetFirstTryTracker(lines.length);
    }
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
        else if (fn.indexOf("malayalam") !== -1) detectedLangId = "malayalam";
        else if (fn.indexOf("polish") !== -1) detectedLangId = "polish";
        else if (fn.indexOf("greek") !== -1) detectedLangId = "greek";
        else if (fn.indexOf("hebrew") !== -1) detectedLangId = "hebrew";
        else if (fn.indexOf("mandarin") !== -1) detectedLangId = "mandarin";
        else if (fn.indexOf("cantonese") !== -1 || /\bca\b|\bcp\b|\bc\d/i.test(fn)) detectedLangId = "cantonese";
        else if (fn.indexOf("civics") !== -1) detectedLangId = "civics";
    }

    // 4. Content character markers if still undetermined
    if (!detectedLangId) {
        if (/[\u0D00-\u0D7F]/.test(combinedAnswers)) {
            detectedLangId = "malayalam";
        } else if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(combinedAnswers)) {
            detectedLangId = "polish";
        } else if (/[¿¡áéíóúüñÁÉÍÓÚÜÑ]/.test(combinedAnswers)) {
            detectedLangId = "spanish";
        } else if (typeof isJyutpingOrYale === "function" && isJyutpingOrYale(combinedAnswers)) {
            detectedLangId = "cantonese";
        }
    }

    // 5. Fallback to app settings or default
    if (!detectedLangId) {
        if (typeof appSettings !== "undefined" && appSettings.selectedLanguage) {
            detectedLangId = (typeof getLanguageIdForCategory === "function" ? getLanguageIdForCategory(appSettings.selectedLanguage) : "") || "spanish";
        } else {
            detectedLangId = "spanish";
        }
    }

    activeSessionLanguage = detectedLangId;
    var flagCfg = (typeof getLanguageFlagConfig === "function") ? getLanguageFlagConfig(detectedLangId) : null;
    var langDisplayName = flagCfg ? flagCfg.name : (detectedLangId.charAt(0).toUpperCase() + detectedLangId.slice(1));
    if (typeof appSettings !== "undefined") {
        appSettings.selectedLanguage = langDisplayName;
        if (typeof saveSettings === "function") {
            saveSettings();
        }
    }

    currentLessonIndex = -1;
    presentYtping = (activeSessionLanguage === "cantonese" && typeof appSettings !== "undefined" && appSettings.romanization === "yale");
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

    if (typeof updateActiveLessonBanner === "function") {
        updateActiveLessonBanner({
            name: customLabel,
            category: langDisplayName
        }, detectedLangId);
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

    closeUploadModal();
}

// Drag & drop file event listeners on upload textarea
if (typeof $ !== "undefined") {
    $(document).ready(function() {
        var ta = $("#upload_textarea");
        if (ta.length) {
            ta.on("dragover dragenter", function(e) {
                e.preventDefault();
                e.stopPropagation();
            });
            ta.on("drop", function(e) {
                e.preventDefault();
                e.stopPropagation();
                var dt = e.originalEvent && e.originalEvent.dataTransfer;
                if (dt && dt.files && dt.files.length > 0) {
                    readUploadFile(dt.files[0]);
                }
            });
            ta.on("input paste", function() {
                setTimeout(updateUploadStatusCount, 50);
            });
        }
    });
}

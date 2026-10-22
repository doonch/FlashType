/* =========================================================================
 * js/drill.js
 * Core Flashcard drill engine, question selection, answer checking, and table.
 * ========================================================================= */

var lines = new Array();
var index = 0;
var lastIndex = 0;
var presentYtping = false;
var forgiveTones = false;
var autoLoop = false;
var currentLessonIndex = -1;
var currentQuestionAnswerRevealed = false;
var tableData = "";

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

if (typeof isDebugMode !== "function") {
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
}

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

function checkAnswer()
{
    var answer = $("#answer")[0].value;
    var correctAnswers = transliterate(lines[index]).split(":")[1].split("/");
    var gotAnswer = false;
    for (var i = 0; i < correctAnswers.length; i++)
    {
        if (clean(answer) == clean(correctAnswers[i])) gotAnswer = true;
    }
    if (gotAnswer)
    {
        if (typeof firstTryTracker !== "undefined") {
            if (!currentQuestionAnswerRevealed) {
                firstTryTracker.mastered[index] = true;
            }
            if (typeof updateMasteryProgressUI === "function") {
                updateMasteryProgressUI();
            }
        }
        var masteredAll = (typeof checkMasteryCompletion === "function") ? checkMasteryCompletion() : false;

        if (forgiveTones && correctAnswers.length == 1)
            SetFeedback("Correct! It's: <span class=\"correct\">" + correctAnswers.join("/") + "</span>", correctAnswers[0]);
        else if (correctAnswers.length == 1)
            SetFeedback("<span class=\"correct-fb\">Correct!</span>", correctAnswers[0]);
        else
            SetFeedback("<span class=\"correct-fb\">Correct!</span> Other options: " + correctAnswers.join("/"), correctAnswers[0]);
        showNext();

        if (masteredAll) {
            setTimeout(function() {
                if (typeof showReadySplashModal === "function") {
                    showReadySplashModal();
                }
            }, 500);
        }
    }
    else
    {
        currentQuestionAnswerRevealed = true;
        if (typeof updateMasteryProgressUI === "function") {
            updateMasteryProgressUI();
        }

        var wrongAnswerToSpeak = correctAnswers[0].trim();
        if (correctAnswers.length > 1) {
            var randIdx = Math.floor(Math.random() * correctAnswers.length);
            wrongAnswerToSpeak = correctAnswers[randIdx].trim();
        }
        if (!answer || !answer.trim()) {
            SetFeedback("It's: <span class=\"correct\">" + correctAnswers.join("/") + "</span>", wrongAnswerToSpeak);
        } else {
            SetFeedback("<span class=\"incorrect-fb\">Wrong!</span> Not \"" + answer + "\", it's: <span class=\"correct\">" + correctAnswers.join("/") + "</span>. Try again!", wrongAnswerToSpeak);
        }
    }
    $("#answer")[0].value = "";
}

function skip()
{
    if (typeof clearPassiveTimers === "function") {
        clearPassiveTimers();
    }
    showNext();
    $("#answer")[0].value = "";
    SetFeedback("");
}

function setQuestion(newIndex)
{
    index = newIndex;
    currentQuestionAnswerRevealed = false;
    if (typeof markSeen === "function") {
        markSeen(index);
    }
    if (typeof updateMasteryProgressUI === "function") {
        updateMasteryProgressUI();
    }
    var questionText = lines[index].split(":")[0];
    var debugSpan = isDebugMode() ? "<span class=\"lesser-text\">[" + index + "/" + seen.size() + "/" + lines.length + "]</span> " : "";
    $("#question_txt")[0].innerHTML = debugSpan + questionText + " <span id=\"speaker_question\" class=\"speaker-btn\" role=\"button\" tabindex=\"0\" title=\"Read question out loud\" aria-label=\"Read question out loud\" onclick=\"readQuestion(event)\">🔊</span>";
    
    if (typeof appSettings !== "undefined" && appSettings.speakQuestions && typeof readQuestion === "function") {
        readQuestion();
    }

    if (typeof appSettings !== "undefined" && appSettings.passiveMode && typeof startPassiveQuestionTimer === "function") {
        $("#feedback")[0].innerHTML = "";
        $("#answer").val("");
        startPassiveQuestionTimer();
    } else if (autoLoop) {
        setTimeout(tellAnswerAndSkip, 4200);
    }
}

function tellAnswerAndSkip()
{
    currentQuestionAnswerRevealed = true;
    if (typeof updateMasteryProgressUI === "function") {
        updateMasteryProgressUI();
    }
    var correctAnswers = transliterate(lines[index]).split(":")[1].split("/");
    var answerIdx = Math.floor(Math.random() * correctAnswers.length);
    if (typeof appSettings !== "undefined" && appSettings.speakAnswers && typeof speakAnswer === "function") {
        speakAnswer(correctAnswers[answerIdx]);
    }
    $("#answer")[0].value = correctAnswers[answerIdx];
    setTimeout(showNext, 3500);
}

function showNext()
{
    if (typeof clearPassiveTimers === "function") {
        clearPassiveTimers();
    }
    if (lines.length <= 1) {
        SetFeedback("<span class=\"incorrect-fb\">Notice: Lesson has 1 or fewer items.</span>");
    }
    index = GetRandomIndex();
    setQuestion(index);
}

function showNextUnseen()
{
    if (typeof clearPassiveTimers === "function") {
        clearPassiveTimers();
    }
    SetFeedback("Skipping...");
    for (var localIndex = 0; localIndex < lines.length; localIndex++)
    {
        if (!seen.contains(localIndex))
        {
            index = localIndex;
            lastIndex = index;
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
        if (typeof seen !== "undefined") markSeen(0);
        return 0;
    }
    var newIndex = lastIndex;
    while (newIndex == lastIndex)
        newIndex = Math.floor(Math.random() * lines.length);
    lastIndex = newIndex;
    if (typeof seen !== "undefined") markSeen(newIndex);
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
    if (typeof appSettings === "undefined" || !appSettings.speakAnswers) {
        return;
    }
    if (answerToSpeak && typeof speakAnswer === "function") {
        speakAnswer(answerToSpeak);
        return;
    }
    if (!s) return;
    var correctSpan = $("#feedback .correct");
    if (correctSpan.length > 0 && typeof speakAnswer === "function") {
        var answerText = correctSpan.text().trim();
        if (answerText) {
            speakAnswer(answerText);
        }
    } else if (typeof speakAnswer === "function") {
        var optMatch = s.match(/Other options:\s*([^<]+)/i);
        if (optMatch && optMatch[1]) {
            speakAnswer(optMatch[1].trim());
        }
    }
}

function updateList(inputLines)
{
    if (!inputLines || inputLines.length === 0) {
        tableData = "";
        $("#vocabTable").empty().hide();
        $("#vocabTableWrapper").hide();
        $("#toggleTable").hide();
        $("#table_toggle_container").hide();
        $("#passive_mode_btn").hide();
        return;
    }

    var cat = (typeof getLessonCategory === "function") ? getLessonCategory() : "";
    var isCantonese = (typeof activeSessionLanguage !== "undefined" && activeSessionLanguage === "cantonese") || (cat.indexOf("cantonese") !== -1);
    var rows = [];
    for (var i = 0; i < inputLines.length; i++)
    {
        var rawAnswer = inputLines[i].split(":")[1] || "";
        var value = (typeof transliterate === "function") ? transliterate(rawAnswer) : rawAnswer;
        // This dictionary is only for Cantonese. Other languages should not have links.
        if (typeof linkToDictionary !== "undefined" && linkToDictionary == true && isCantonese && !/[\u0590-\u05FF]/.test(rawAnswer)) {
            value = "<a href=\"http://www.cantonese.sheik.co.uk/dictionary/search/?searchtype=3&text=" + getQueryText(rawAnswer) + "\">"
                    + value
                    + "</a>";
        }
        var speakerBtn = " <span class=\"speaker-btn speaker-vocab\" role=\"button\" tabindex=\"0\" title=\"Read answer out loud\" aria-label=\"Read answer out loud\" data-answer=\"" + escapeHtmlAttr(rawAnswer) + "\" onclick=\"readVocabAnswer(event, this)\">🔊</span>";
        var isSeen = (typeof seen !== "undefined" && seen && typeof seen.contains === "function" && seen.contains(i));
        var rowClass = isSeen ? ' class="seen"' : '';
        var rowStyle = isSeen ? ' style="color: #16a34a;"' : ' style="color: #000000;"';
        rows.push("<tr" + rowClass + rowStyle + "><td>" + inputLines[i].split(":")[0] + "</td><td>"
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

    if (inputLines && inputLines.length > 0) {
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

// Global modal overlay dismissers & Escape listener
if (typeof $ !== "undefined") {
    $(document).on("keydown", function(e) {
        if (e.which === 27) { // Escape
            if ($("#timer_ring_modal").is(":visible") && typeof closeTimerRingModal === "function") {
                closeTimerRingModal();
            }
            if ($("#settings_modal").is(":visible") && typeof closeSettingsModal === "function") {
                closeSettingsModal();
            }
            if ($("#ai_modal").is(":visible") && typeof closeAiModal === "function") {
                closeAiModal();
            }
            if ($("#download_modal").is(":visible") && typeof closeDownloadModal === "function") {
                closeDownloadModal();
            }
            if ($("#upload_modal").is(":visible") && typeof closeUploadModal === "function") {
                closeUploadModal();
            }
            if ($("#language_lessons_modal").is(":visible") && typeof closeLanguageLessonsModal === "function") {
                closeLanguageLessonsModal();
            }
            if ($("#help_modal").is(":visible") && typeof closeHelpModal === "function") {
                closeHelpModal();
            }
            if ($("#ready_splash_modal").is(":visible") && typeof closeReadySplashModal === "function") {
                closeReadySplashModal();
            }
        }
    });

    $(document).on("click", "#timer_ring_modal", function(e) {
        if ($(e.target).is("#timer_ring_modal") && typeof closeTimerRingModal === "function") {
            closeTimerRingModal();
        }
    });
    $(document).on("click", "#settings_modal", function(e) {
        if ($(e.target).is("#settings_modal") && typeof closeSettingsModal === "function") {
            closeSettingsModal();
        }
    });
    $(document).on("click", "#ai_modal", function(e) {
        if ($(e.target).is("#ai_modal") && typeof closeAiModal === "function") {
            closeAiModal();
        }
    });
    $(document).on("click", "#download_modal", function(e) {
        if ($(e.target).is("#download_modal") && typeof closeDownloadModal === "function") {
            closeDownloadModal();
        }
    });
    $(document).on("click", "#upload_modal", function(e) {
        if ($(e.target).is("#upload_modal") && typeof closeUploadModal === "function") {
            closeUploadModal();
        }
    });
    $(document).on("click", "#language_lessons_modal", function(e) {
        if ($(e.target).is("#language_lessons_modal") && typeof closeLanguageLessonsModal === "function") {
            closeLanguageLessonsModal();
        }
    });
    $(document).on("click", "#help_modal", function(e) {
        if ($(e.target).is("#help_modal") && typeof closeHelpModal === "function") {
            closeHelpModal();
        }
    });
    $(document).on("click", "#ready_splash_modal", function(e) {
        if ($(e.target).is("#ready_splash_modal") && typeof closeReadySplashModal === "function") {
            closeReadySplashModal();
        }
    });
}

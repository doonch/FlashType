/* =========================================================================
 * js/mastery.js
 * First-try mastery tracking, opportunity highlights, and Ready! splash modal.
 * ========================================================================= */

var firstTryTracker = {
    totalQuestions: 0,
    mastered: {},
    masteryAchieved: false,
    splashShown: false
};

function resetFirstTryTracker(total) {
    firstTryTracker = {
        totalQuestions: total || (typeof lines !== "undefined" && lines ? lines.length : 0),
        mastered: {},
        masteryAchieved: false,
        splashShown: false
    };
    if (typeof currentQuestionAnswerRevealed !== "undefined") {
        currentQuestionAnswerRevealed = false;
    }
    updateMasteryProgressUI();
}

function canGainMasteryOnCurrentQuestion() {
    if (typeof lines === "undefined" || !lines || lines.length === 0) return false;
    if (typeof index === "undefined" || index < 0 || index >= lines.length) return false;
    if (typeof firstTryTracker === "undefined") return false;
    // If already mastered this item, answering will not gain new mastery
    if (firstTryTracker.mastered && firstTryTracker.mastered[index]) {
        return false;
    }
    // If the answer has already been revealed or user made an error on this question
    if (typeof currentQuestionAnswerRevealed !== "undefined" && currentQuestionAnswerRevealed) {
        return false;
    }
    return true;
}

function updateMasteryProgressUI() {
    if (typeof $ === "undefined") return;
    var total = (typeof lines !== "undefined" && lines) ? lines.length : (firstTryTracker.totalQuestions || 0);
    var masteredCount = Object.keys(firstTryTracker.mastered || {}).length;
    var $badge = $("#first_try_badge");
    var $score = $("#first_try_score");
    if ($badge.length && $score.length) {
        if (total <= 0) {
            $badge.hide();
            return;
        }
        $score.text(masteredCount + "/" + total);
        $badge.show();

        if (masteredCount === total && total > 0) {
            $badge.addClass("is-mastered");
            $badge.removeClass("can-gain-mastery");
            $badge.attr("title", "Lesson Mastered! All " + total + " items mastered.");
        } else {
            $badge.removeClass("is-mastered");
            if (canGainMasteryOnCurrentQuestion()) {
                $badge.addClass("can-gain-mastery");
                $badge.attr("title", "Mastery: " + masteredCount + "/" + total + " (Answer correctly to gain mastery). Click to jump to next unmastered item.");
            } else {
                $badge.removeClass("can-gain-mastery");
                $badge.attr("title", "Mastery: " + masteredCount + "/" + total + ". Click to jump to next unmastered item.");
            }
        }
    }
}

function checkMasteryCompletion() {
    if (typeof lines === "undefined" || !lines || lines.length === 0) return false;
    var total = lines.length;
    var masteredCount = Object.keys(firstTryTracker.mastered || {}).length;
    if (masteredCount >= total && !firstTryTracker.splashShown) {
        firstTryTracker.masteryAchieved = true;
        firstTryTracker.splashShown = true;
        return true;
    }
    return false;
}

function showReadySplashModal() {
    if (typeof $ === "undefined") return;
    var total = (typeof lines !== "undefined" && lines) ? lines.length : 0;
    var lessonName = "Lesson";
    var langName = (typeof getActiveLessonLanguage === "function") ? getActiveLessonLanguage() : "";
    if (typeof currentLessonIndex !== "undefined" && currentLessonIndex > 0 && typeof lessonFiles !== "undefined" && lessonFiles[currentLessonIndex]) {
        lessonName = lessonFiles[currentLessonIndex].name;
        if (!langName) langName = lessonFiles[currentLessonIndex].category || "";
    } else {
        var bannerText = $("#active_lesson_banner strong").text();
        if (bannerText) lessonName = bannerText;
    }

    $("#ready_splash_lesson_badge").text("🏆 " + lessonName + (langName ? " (" + langName + ")" : ""));
    $("#ready_stat_total").text(total + " / " + total);
    $("#ready_stat_count").text("100%");
    $("#ready_splash_desc").text("You answered every question (" + total + " total) correctly without needing the on-screen answer.");

    $("#ready_splash_modal").fadeIn(200);
}

function closeReadySplashModal() {
    if (typeof $ !== "undefined") {
        $("#ready_splash_modal").fadeOut(150);
    }
}

function skipToNextUnmastered() {
    if (typeof clearPassiveTimers === "function") {
        clearPassiveTimers();
    }
    if (typeof lines === "undefined" || !lines || lines.length === 0) return;
    var total = lines.length;
    var masteredCount = Object.keys(firstTryTracker.mastered || {}).length;
    if (masteredCount >= total) {
        if (typeof SetFeedback === "function") {
            SetFeedback("<span class=\"correct-fb\">All items in this lesson are already mastered! 🎯</span>");
        }
        return;
    }

    // Search cyclically starting from (index + 1) for the next unmastered item
    for (var step = 1; step <= total; step++) {
        var nextIdx = (index + step) % total;
        if (!firstTryTracker.mastered || !firstTryTracker.mastered[nextIdx]) {
            index = nextIdx;
            lastIndex = nextIdx;
            if (typeof $ !== "undefined") {
                $("#answer").val("");
            }
            if (typeof SetFeedback === "function") {
                SetFeedback("");
            }
            if (typeof setQuestion === "function") {
                setQuestion(nextIdx);
            }
            return;
        }
    }
}

function onMasteryBadgeClick() {
    skipToNextUnmastered();
}

function restartCurrentLesson() {
    closeReadySplashModal();
    if (typeof currentLessonIndex !== "undefined" && currentLessonIndex > 0 && typeof lessonFiles !== "undefined" && lessonFiles[currentLessonIndex]) {
        if (typeof selectAndStartLesson === "function") {
            selectAndStartLesson(currentLessonIndex);
        }
    } else if (typeof lines !== "undefined" && lines && lines.length > 0) {
        if (typeof set === "function") {
            seen = new set(lines.length);
        }
        resetFirstTryTracker(lines.length);
        if (typeof $ !== "undefined") {
            $("#feedback").empty();
            $("#answer").val("");
        }
        if (typeof showNext === "function") {
            showNext();
        }
        if (typeof updateList === "function") {
            updateList(lines);
        }
    }
}

function openAiSentenceGenWithPrepopulatedLessons() {
    closeReadySplashModal();

    var activeLang = (typeof getActiveLessonLanguage === "function" ? getActiveLessonLanguage() : null) || (appSettings && appSettings.selectedLanguage) || "Cantonese";
    var relevantLessons = [];
    if (typeof lessonFiles !== "undefined") {
        for (var i = 1; i < lessonFiles.length; i++) {
            var item = lessonFiles[i];
            if (typeof getLanguageFromLesson === "function" && getLanguageFromLesson(item) === activeLang) {
                relevantLessons.push(item);
            }
        }
    }

    var currentFile = "";
    if (typeof currentLessonIndex !== "undefined" && currentLessonIndex > 0 && typeof lessonFiles !== "undefined" && lessonFiles[currentLessonIndex]) {
        currentFile = lessonFiles[currentLessonIndex].file;
    }

    var currentIdxInRelevant = -1;
    for (var r = 0; r < relevantLessons.length; r++) {
        if (relevantLessons[r].file === currentFile) {
            currentIdxInRelevant = r;
            break;
        }
    }

    var preselectedFiles = [];
    if (currentIdxInRelevant >= 0) {
        // Pre-populate with current lesson and all preceding lessons in that language
        for (var k = 0; k <= currentIdxInRelevant; k++) {
            preselectedFiles.push(relevantLessons[k].file);
        }
    } else if (relevantLessons.length > 0) {
        preselectedFiles = [relevantLessons[0].file];
    }

    if (typeof appSettings !== "undefined") {
        appSettings.selectedLanguage = activeLang;
        appSettings.completedLessons = preselectedFiles;
        if (!appSettings.completedLessonsByLang) {
            appSettings.completedLessonsByLang = {};
        }
        appSettings.completedLessonsByLang[activeLang] = preselectedFiles.slice();
        if (typeof saveSettings === "function") {
            saveSettings();
        }
    }

    if (typeof renderLessonChecklist === "function") {
        renderLessonChecklist();
    }
    if (typeof updateAiGenStatusText === "function") {
        updateAiGenStatusText();
    }

    if (typeof $ !== "undefined") {
        $("#ai_modal").fadeIn(200);
    }
}

if (typeof $ !== "undefined") {
    $(document).on("keydown", "#first_try_badge", function(e) {
        if (e.which === 13 || e.which === 32) {
            e.preventDefault();
            onMasteryBadgeClick();
        }
    });
}

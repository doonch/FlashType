/* =========================================================================
 * js/passive.js
 * Passive mode countdown timers, animated SVG circle & autonomous drill loop.
 * ========================================================================= */

var passiveQuestionTimer = null;
var passiveDecayTimer = null;
var passiveAnimFrameId = null;
var passiveAnimStartTime = 0;
var passiveAnimDuration = 0;
var passiveCircumference = 2 * Math.PI * 11; // ~69.115px (radius 11 in 28x28 viewBox)

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
    if (typeof appSettings === "undefined" || !appSettings.passiveMode) return;

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
    if (typeof appSettings === "undefined") return;
    appSettings.passiveMode = !appSettings.passiveMode;
    if (typeof saveSettings === "function") {
        saveSettings();
    }
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
    if (typeof $ === "undefined" || typeof appSettings === "undefined") return;
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
    if (typeof appSettings === "undefined" || !appSettings.passiveMode) return;
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
    if (typeof appSettings === "undefined" || !appSettings.passiveMode || typeof lines === "undefined" || !lines || !lines[index]) return;
    if (typeof currentQuestionAnswerRevealed !== "undefined") {
        currentQuestionAnswerRevealed = true;
    }
    if (typeof updateMasteryProgressUI === "function") {
        updateMasteryProgressUI();
    }
    var correctAnswers = (typeof transliterate === "function") ? transliterate(lines[index]).split(":")[1].split("/") : lines[index].split(":")[1].split("/");
    var primaryAnswer = correctAnswers[0].trim();
    if (typeof $ !== "undefined") {
        $("#feedback")[0].innerHTML = "Answer: <span class=\"correct\">" + correctAnswers.join(" / ") + "</span>";
        $("#answer").val(primaryAnswer);
        $("#passive_status").text("Review answer");
    }
    if (appSettings.speakAnswers && typeof speakAnswer === "function") {
        speakAnswer(primaryAnswer);
    }
    var decayMs = Math.max(1000, (appSettings.decayTimeoutSec || 2.5) * 1000);

    var completed = false;
    function finishDecayPhase() {
        if (completed) return;
        completed = true;
        clearPassiveTimers();
        if (appSettings.passiveMode && typeof showNext === "function") {
            showNext();
        }
    }

    startPassiveCountdown(decayMs, "decay", finishDecayPhase);
    passiveDecayTimer = setTimeout(finishDecayPhase, decayMs + 50);
}

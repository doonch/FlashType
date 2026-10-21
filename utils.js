/* =========================================================================
 * utils.js (Legacy Aggregator / Backward-Compatibility Facade)
 *
 * NOTE: The monolithic utils.js (previously ~2,900 lines) has been refactored
 * into clean, modular files located in the `js/` directory:
 *
 *   1. js/translit.js     - Sanitization, clean(), Pinyin/Jyutping/Yale
 *                           transliteration, QueryString parser
 *   2. js/settings.js     - App settings state, localStorage persistence,
 *                           speech speed & passive countdown timer controls
 *   3. js/audio.js        - SpeechSynthesis API wrapper, voice detection,
 *                           question and answer audio playback
 *   4. js/mastery.js      - Mastery tracking, 🎯 opportunity indicator,
 *                           congratulatory splash modal, skip-to-unmastered
 *   5. js/passive.js      - Passive practice mode, countdown timers, animated
 *                           circular progress ring, auto-reveal loop
 *   6. js/languages.js    - Flag configurations, collapsible toolbar bar,
 *                           active lesson banner, lesson selection modal
 *   7. js/drill.js        - Core practice engine, set() tracking, checkAnswer(),
 *                           interactive controls, vocabulary table rendering
 *   8. js/ai-generator.js - AI sentence synthesis modal, lesson checklist UI,
 *                           Gemini API client (/api/generate-sentences)
 *   9. js/io.js           - Lesson download modal, custom upload modal, file parser
 *
 * For new pages or scripts, include the modules above directly.
 * If this file is loaded directly by an external script, it dynamically loads
 * the modules below in dependency order.
 * ========================================================================= */

(function() {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
        var modules = [
            "js/translit.js",
            "js/settings.js",
            "js/audio.js",
            "js/mastery.js",
            "js/passive.js",
            "js/languages.js",
            "js/drill.js",
            "js/ai-generator.js",
            "js/io.js"
        ];
        // If the modules have not been loaded via individual script tags, load them
        if (typeof clean === "undefined") {
            for (var i = 0; i < modules.length; i++) {
                var s = document.createElement("script");
                s.src = modules[i];
                s.async = false;
                document.head.appendChild(s);
            }
        }
    }
})();

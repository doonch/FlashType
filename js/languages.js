/* =========================================================================
 * js/languages.js
 * Language configurations, collapsible flag navigation, active banner & lesson selection.
 * ========================================================================= */

var LANGUAGE_FLAGS = [
    {
        id: "cantonese",
        name: "Cantonese",
        country: "Hong Kong",
        flagEmoji: "🇭🇰",
        categories: ["Cantonese.Dan", "Cantonese.ca", "Sheik", "Cantonese 1", "Cantonese 4", "Cantonese 5", "Cantonese 6"],
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
        id: "malayalam",
        name: "Malayalam",
        country: "Kerala",
        flagEmoji: "🌴",
        categories: ["Malayalam"],
        svg: '<svg viewBox="0 0 30 20" class="flag-svg" aria-hidden="true"><rect width="30" height="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.5"/><circle cx="15" cy="11" r="3.2" fill="#0b3b60"/><circle cx="15" cy="11" r="2.6" fill="#d97706"/><path d="M14.3,12.2 C14.1,11.3 14.3,10.2 15,9.6 C15.7,10.2 15.9,11.3 15.7,12.2 C15.3,12.6 14.7,12.6 14.3,12.2 Z" fill="#ffffff"/><path d="M14.2,6.8 L15.8,6.8 L15.4,8.2 L14.6,8.2 Z" fill="#d97706"/><circle cx="15" cy="6.2" r="0.8" fill="#d97706"/><path d="M9.5,14 L10.5,14 L10.5,11.5 L11.8,11.5 L11.8,14 L12.8,14 L12.8,9.5 C13.5,9.5 14,8.5 13.8,7.2 C13.2,7.2 12.8,7.8 12.5,8.5 C12,7 10.5,6.5 9,6.5 C7.8,6.5 7,7.2 7,8.8 C7,10 7.8,11 8.5,11.5 L8.5,14 Z" fill="#334155"/><path d="M13.2,8.6 L14.2,8.4 L13.6,9.2 Z" fill="#ffffff"/><path d="M20.5,14 L19.5,14 L19.5,11.5 L18.2,11.5 L18.2,14 L17.2,14 L17.2,9.5 C16.5,9.5 16,8.5 16.2,7.2 C16.8,7.2 17.2,7.8 17.5,8.5 C18,7 19.5,6.5 21,6.5 C22.2,6.5 23,7.2 23,8.8 C23,10 22.2,11 21.5,11.5 L21.5,14 Z" fill="#334155"/><path d="M16.8,8.6 L15.8,8.4 L16.4,9.2 Z" fill="#ffffff"/><path d="M8.5,15 C11.5,16.5 18.5,16.5 21.5,15 C20,16.8 10,16.8 8.5,15 Z" fill="#15803d"/></svg>'
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
    if (c.indexOf("cantonese") !== -1 || c === "sheik") return "cantonese";
    if (c.indexOf("hebrew") !== -1) return "hebrew";
    if (c.indexOf("mandarin") !== -1) return "mandarin";
    if (c.indexOf("greek") !== -1) return "greek";
    if (c.indexOf("polish") !== -1) return "polish";
    if (c.indexOf("spanish") !== -1) return "spanish";
    if (c.indexOf("italian") !== -1) return "italian";
    if (c.indexOf("malayalam") !== -1) return "malayalam";
    if (c.indexOf("civics") !== -1) return "civics";
    return "";
}

function getLanguageFromLesson(l) {
    if (!l) return "";
    var cat = (l.category || "").trim();
    var file = (l.file || "").trim();
    if (cat === "TestCategory" || file === "lessons/test.txt") return "";
    if (/^Cantonese/i.test(cat) || cat === "Sheik" || /cantonese/i.test(file) || /\/c[0-9p]/i.test(file) || /\/ca\./i.test(file)) return "Cantonese";
    if (/^Hebrew/i.test(cat) || /hebrew/i.test(file)) return "Hebrew";
    if (/^Greek/i.test(cat) || /greek/i.test(file)) return "Greek";
    if (/^Polish/i.test(cat) || /polish/i.test(file)) return "Polish";
    if (/^Spanish/i.test(cat) || /spanish/i.test(file)) return "Spanish";
    if (/^Italian/i.test(cat) || /italian/i.test(file)) return "Italian";
    if (/^Malayalam/i.test(cat) || /malayalam/i.test(file)) return "Malayalam";
    if (/^Mandarin/i.test(cat) || /mandarin/i.test(file)) return "Mandarin";
    if (/^Civics/i.test(cat) || /civics/i.test(file)) return "Civics";
    if (cat) return cat.split(/[. -]/)[0];
    return "";
}

function getAvailableLanguages() {
    var langs = [];
    var preferredOrder = ["Cantonese", "Hebrew", "Greek", "Polish", "Spanish", "Italian", "Malayalam", "Mandarin", "Civics"];
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
        var langFromL = getLanguageFromLesson(curL);
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
            var selLang = getLanguageFromLesson(lessonFiles[lIdx]);
            if (selLang) return selLang;
            var lId = getActiveLanguageId(lessonFiles[lIdx]);
            var cfgSel = getLanguageFlagConfig(lId);
            if (cfgSel && cfgSel.name) return cfgSel.name;
        }
    }

    return "";
}

var flagsRowState = {
    isExpanded: false
};

function hasCurrentActiveLesson() {
    var $banner = $("#active_lesson_banner");
    if ($banner.length && $banner.is(":visible") && $banner.attr("data-lang-id")) {
        return true;
    }
    if (typeof currentLessonIndex !== "undefined" && currentLessonIndex > 0 && typeof lessonFiles !== "undefined" && !!lessonFiles[currentLessonIndex]) {
        return true;
    }
    if (typeof activeSessionLanguage !== "undefined" && activeSessionLanguage && typeof lines !== "undefined" && lines && lines.length > 0) {
        return true;
    }
    return false;
}

function getCurrentActiveLanguageId() {
    var $banner = $("#active_lesson_banner");
    if ($banner.length && $banner.attr("data-lang-id")) {
        return $banner.attr("data-lang-id");
    }
    if (typeof currentLessonIndex !== "undefined" && currentLessonIndex > 0 && typeof lessonFiles !== "undefined" && lessonFiles[currentLessonIndex]) {
        return getActiveLanguageId(lessonFiles[currentLessonIndex]);
    }
    if (typeof activeSessionLanguage !== "undefined" && activeSessionLanguage) {
        return getLanguageIdForCategory(activeSessionLanguage);
    }
    if (typeof appSettings !== "undefined" && appSettings.selectedLanguage) {
        return getLanguageIdForCategory(appSettings.selectedLanguage);
    }
    return "cantonese";
}

function renderFlagButtons() {
    if (typeof $ === "undefined") return;
    var $container = $("#flag_buttons_bar");
    if (!$container.length) return;
    $container.empty();

    var activeLessonExists = hasCurrentActiveLesson();

    // 1. Initial State: No active lesson loaded yet -> All flags visible and expanded
    if (!activeLessonExists) {
        flagsRowState.isExpanded = false;
        $container.removeClass("is-collapsed is-active-lesson-expanded");

        for (var i = 0; i < LANGUAGE_FLAGS.length; i++) {
            var lang = LANGUAGE_FLAGS[i];
            var btn = $('<button>', {
                type: "button",
                id: "flag_btn_" + lang.id,
                class: "flag-btn",
                "data-lang-id": lang.id,
                title: lang.name + " (" + lang.country + ") lessons",
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
        return;
    }

    // 2. An active lesson exists!
    var activeLangId = getCurrentActiveLanguageId();
    var activeLangConfig = getLanguageFlagConfig(activeLangId) || LANGUAGE_FLAGS[0];

    if (!flagsRowState.isExpanded) {
        // Collapsed state: ONLY the selected language button remains, changed into "select language"
        $container.addClass("is-collapsed").removeClass("is-active-lesson-expanded");

        var selectLangBtn = $('<button>', {
            type: "button",
            id: "flag_btn_" + activeLangConfig.id,
            class: "flag-btn is-active flag-btn-toggle flag-btn-select-lang",
            "data-lang-id": activeLangConfig.id,
            "aria-expanded": "false",
            title: "Active language: " + activeLangConfig.name + ". Click to expand and select language",
            "aria-label": "Select language: currently " + activeLangConfig.name
        });
        selectLangBtn.html(
            activeLangConfig.svg +
            '<span>' + activeLangConfig.name + '</span>' +
            '<span class="flag-action-pill" aria-hidden="true">▾</span>'
        );
        selectLangBtn.on("click", function(e) {
            e.preventDefault();
            flagsRowState.isExpanded = true;
            renderFlagButtons();
        });
        $container.append(selectLangBtn);
    } else {
        // Expanded state: Active language is ALWAYS FIRST and acts as a "collapse" button
        $container.addClass("is-active-lesson-expanded").removeClass("is-collapsed");

        var collapseBtn = $('<button>', {
            type: "button",
            id: "flag_btn_" + activeLangConfig.id,
            class: "flag-btn is-active flag-btn-toggle flag-btn-collapse",
            "data-lang-id": activeLangConfig.id,
            "aria-expanded": "true",
            title: "Click to collapse language buttons",
            "aria-label": "Collapse language buttons"
        });
        collapseBtn.html(
            activeLangConfig.svg +
            '<span>' + activeLangConfig.name + '</span>' +
            '<span class="flag-action-pill flag-action-collapse" aria-hidden="true">▴</span>'
        );
        collapseBtn.on("click", function(e) {
            e.preventDefault();
            flagsRowState.isExpanded = false;
            renderFlagButtons();
        });
        $container.append(collapseBtn);

        // Render all OTHER language flags after the active one
        for (var j = 0; j < LANGUAGE_FLAGS.length; j++) {
            var otherLang = LANGUAGE_FLAGS[j];
            if (otherLang.id === activeLangConfig.id) continue;

            var otherBtn = $('<button>', {
                type: "button",
                id: "flag_btn_" + otherLang.id,
                class: "flag-btn",
                "data-lang-id": otherLang.id,
                title: otherLang.name + " (" + otherLang.country + ") lessons",
                "aria-label": otherLang.name + " (" + otherLang.country + ") lessons"
            });
            otherBtn.html(otherLang.svg + '<span>' + otherLang.name + '</span>');
            (function(languageId) {
                otherBtn.on("click", function() {
                    openLanguageLessonsModal(languageId);
                });
            })(otherLang.id);
            $container.append(otherBtn);
        }
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
            var curLang = getLanguageFromLesson(cur);
            if (curLang.toLowerCase() === lang.name.toLowerCase() || lang.categories.indexOf(cur.category) !== -1) {
                matchingLessons.push({ idx: j, lesson: cur });
            }
        }
    }

    if (matchingLessons.length === 0) {
        $list.html('<div style="padding: 12px; color: #64748b; font-size: 0.9rem;">No lessons found for ' + lang.name + '.</div>');
    } else {
        // Sort matching lessons by category according to category order, then by index
        var categoryOrder = (lang && lang.categories) ? lang.categories : [];
        matchingLessons.sort(function(a, b) {
            var catA = (a.lesson && a.lesson.category) || "";
            var catB = (b.lesson && b.lesson.category) || "";
            var idxCatA = categoryOrder.indexOf(catA);
            var idxCatB = categoryOrder.indexOf(catB);
            if (idxCatA !== -1 && idxCatB !== -1 && idxCatA !== idxCatB) {
                return idxCatA - idxCatB;
            }
            if (idxCatA !== -1 && idxCatB === -1) return -1;
            if (idxCatA === -1 && idxCatB !== -1) return 1;
            return a.idx - b.idx;
        });

        var lastCategory = null;
        for (var k = 0; k < matchingLessons.length; k++) {
            var item = matchingLessons[k];
            var curCategory = (item.lesson && item.lesson.category) || "";

            // If language has multiple categories, render a section header on category change
            if (categoryOrder.length > 1 && curCategory && curCategory !== lastCategory) {
                lastCategory = curCategory;
                var catHeader = $('<div>', {
                    class: "lang-modal-category-header"
                }).text(curCategory);
                $list.append(catHeader);
            }

            var rowBtn = $('<button>', {
                type: "button",
                class: "lang-lesson-row-btn",
                id: "lesson_pick_" + item.idx,
                "data-lesson-idx": item.idx
            });
            var debugIdxBadge = (typeof isDebugMode === "function" && isDebugMode()) ? ' <span class="lesser-text">#' + item.idx + '</span>' : '';
            rowBtn.html(
                '<span class="lang-lesson-name">' + item.lesson.name + debugIdxBadge + '</span>' +
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
        var lName = getLanguageFromLesson(curLesson);
        if (lName) {
            var fromName = getLanguageIdForCategory(lName);
            if (fromName) return fromName;
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
        flagsRowState.isExpanded = false;
        renderFlagButtons();
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

    // With an active lesson, collapse the flags row to only the selected language
    flagsRowState.isExpanded = false;
    renderFlagButtons();
}

function selectAndStartLesson(lessonIdx) {
    closeLanguageLessonsModal();
    if (typeof lessonFiles === "undefined") return;
    var curLesson = lessonFiles[lessonIdx];
    if (!curLesson) return;

    currentLessonIndex = lessonIdx;
    activeSessionLanguage = "";
    sessionCharactersMap = {};
    if (typeof clearPassiveTimers === "function") {
        clearPassiveTimers();
    }

    if ($("#lesson").length) {
        $("#lesson").val(lessonIdx);
    }

    if (typeof hideTable === "function") {
        hideTable();
    }

    var cat = (curLesson.category || "").toLowerCase();
    var isCantonese = (cat.indexOf("cantonese") !== -1 || cat === "sheik");
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
    } else if (cat.indexOf("malayalam") !== -1) {
        activeSessionLanguage = "malayalam";
        langId = "malayalam";
    } else if (cat.indexOf("civics") !== -1) {
        activeSessionLanguage = "civics";
        langId = "civics";
    } else {
        activeSessionLanguage = cat;
        langId = cat;
    }

    presentYtping = (activeSessionLanguage === "cantonese" && typeof appSettings !== "undefined" && appSettings.romanization === "yale");
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
        if (typeof set === "function") {
            seen = new set(lines.length);
        }
        if (typeof resetFirstTryTracker === "function") {
            resetFirstTryTracker(lines.length);
        }
        presentYtping = (typeof appSettings !== "undefined" && appSettings.romanization === "yale");
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
    }).fail(function() {
        alert("Failed to load lesson file: " + curLesson.file);
        updateActiveLessonBanner(null);
    });
}

if (typeof $ !== "undefined") {
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
}

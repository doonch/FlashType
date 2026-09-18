const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

// Lazy GoogleGenAI initialization
let aiClient = null;
function getGenAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    const { GoogleGenAI } = require('@google/genai');
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Log incoming requests for easy debugging
app.use((req, res, next) => {
  next();
});

// Helper to detect language from request or vocabulary
function detectLanguage(language, vocabList = [], lessonTitle = "") {
  if (language && typeof language === 'string' && language.trim().length > 0) {
    const langLower = language.toLowerCase().trim();
    if (langLower.includes('hebrew') || langLower === 'he' || langLower === 'iw') return 'hebrew';
    if (langLower.includes('cantonese') || langLower.includes('yue') || langLower === 'zh-hk') return 'cantonese';
    if (langLower.includes('greek') || langLower === 'el') return 'greek';
    if (langLower.includes('mandarin') || langLower.includes('chinese') || langLower === 'zh-cn') return 'mandarin';
    if (langLower.includes('polish') || langLower === 'pl') return 'polish';
    if (langLower.includes('spanish') || langLower === 'es') return 'spanish';
    return langLower;
  }

  // Check vocab content for Hebrew characters
  const sample = vocabList.slice(0, 50).join(' ');
  if (/[\u0590-\u05FF]/.test(sample)) {
    return 'hebrew';
  }

  // Check vocab content for Greek characters
  if (/[\u0370-\u03FF]/.test(sample)) {
    return 'greek';
  }

  // Check lesson title or vocab for Hebrew or Greek hints
  if (lessonTitle && /hebrew/i.test(lessonTitle)) {
    return 'hebrew';
  }
  if (lessonTitle && /greek/i.test(lessonTitle)) {
    return 'greek';
  }

  // Check if sample has Jyutping tones (e.g., word + 1-6)
  if (/[a-z]{1,6}[1-6]/i.test(sample)) {
    return 'cantonese';
  }

  if (lessonTitle && /cantonese/i.test(lessonTitle)) {
    return 'cantonese';
  }

  return 'cantonese';
}

function buildPrompt({ language, vocabString, numSentences }) {
  const normalizedLang = (language || 'cantonese').toLowerCase();

  // General instructions shared across all languages
  const generalInstructions = `GENERAL INSTRUCTIONS:
1. STRICT VOCABULARY RESTRICTION: Every content word (verbs, nouns, adjectives, places, pronouns, time words, numbers) in your practice sentences MUST originate from or directly match the vocabulary list above. Do NOT introduce outside nouns, outside food names, outside locations, outside numbers, or outside verbs.
2. English Prompt: Provide a natural, clear English sentence prompt for flashcard practice in the "english" property.
3. Alternative Answers: Provide 1-2 valid variations (such as alternative word choice, synonym, or interchangeable phrasing) in the "alternatives" array if naturally acceptable.`;

  let langTitle = 'Cantonese';
  let languageSpecificInstructions = '';
  let jsonFormatExample = '';

  if (normalizedLang.includes('hebrew')) {
    langTitle = 'Hebrew';
    languageSpecificInstructions = `HEBREW-SPECIFIC INSTRUCTIONS:
1. Hebrew Characters Only: The output in the "target" property and all entries in the "alternatives" list MUST use Hebrew characters (אותיות עבריות), NOT any transliteration, Romanization, or Latin alphabet.
2. Grammar & Agreement: Follow standard modern Hebrew grammar, including appropriate gender agreement (masculine/feminine) and number agreement (singular/plural).
3. Natural Syntax: Follow natural modern Hebrew word order and syntax.
4. Orthography: Use standard modern unvocalized spelling (Ktiv Male / כתיב מלא). 
5. Pronunciation: Retain Niqqud from input vocabulary. For example, the word רוצֶה if used in a sentence, should appear with this niqqud in the output. This is critical for correct pronunciation and speech synthesis.`;

    jsonFormatExample = `Output JSON with an array of objects matching this exact structure:
[
  {
    "english": "twenty five",
    "target": "עשרים וחמש",
    "alternatives": ["עשרים וחמישה"]
  }
]`;
  } else if (normalizedLang.includes('cantonese')) {
    langTitle = 'Cantonese';
    languageSpecificInstructions = `CANTONESE-SPECIFIC INSTRUCTIONS:
1. Grammar & Particles: You may use standard spoken Cantonese functional particles if grammatically required for natural sentences (e.g., question particles like aa3, maa3, or locative marker hai2, or aspect markers like zo2 / gwo3 if appropriate).
2. Natural Spoken Cantonese Word Order: Follow standard colloquial Cantonese syntax (e.g., [Time] [Subject] [Modal] [Location: hai2 + Place] [Verb] [Object] [Particle]).
3. Jyutping Format: Provide exact standard Jyutping with numeric tone markers 1-6 attached to each syllable (e.g., "ngo5 soeng2 hai2 ngo5 dou6 sik6 je5") in the "target" (and "jyutping") property. Do not use diacritics/tone marks.
4. Traditional Chinese Characters: Provide standard Cantonese written characters (Hanzi) for the primary sentence in the "characters" property (e.g. "我想要喺我度食嘢").
5. Yes/No questions should strictly follow the Cantonese structure: "verb not verb", for example: do you want? "nei5 soeng2 m4 soeng2", do you have? "nei5 jau5 mou5".
6. Prefer the question final particle "aa3", except specifically in "(nei5) hou2 maa3".
7. "Or": use "waak6 ze5" when making a statement, "ding6 hai6"/"jik1 waak6" when asking questions.`;

    jsonFormatExample = `Output JSON with an array of objects matching this exact structure:
[
  {
    "english": "I want to eat something at my place",
    "target": "ngo5 soeng2 hai2 ngo5 dou6 sik6 je5",
    "jyutping": "ngo5 soeng2 hai2 ngo5 dou6 sik6 je5",
    "characters": "我想要喺我度食嘢",
    "alternatives": ["ngo5 soeng2 jiu3 hai2 ngo5 dou6 sik6 je5"]
  }
]`;
  } else if (normalizedLang.includes('greek') || normalizedLang === 'el') {
    langTitle = 'Greek';
    languageSpecificInstructions = `GREEK-SPECIFIC INSTRUCTIONS:
1. Greek Characters Only: The output in the "target" property and all entries in the "alternatives" list MUST use standard modern Greek alphabet (Ελληνικό αλφάβητο) with monotonic stress accents (τόνοι), NOT any transliteration or Latin characters.
2. Grammar & Agreement: Follow standard modern Greek grammar, including proper case (nominative, accusative, genitive), gender agreement, and verb conjugation.
3. Natural Syntax: Follow natural modern Greek word order and phrasing.`;

    jsonFormatExample = `Output JSON with an array of objects matching this exact structure:
[
  {
    "english": "We want water",
    "target": "Θέλουμε νερό",
    "alternatives": ["Εμείς θέλουμε νερό"]
  }
]`;
  } else {
    langTitle = normalizedLang.charAt(0).toUpperCase() + normalizedLang.slice(1);
    languageSpecificInstructions = `${langTitle.toUpperCase()}-SPECIFIC INSTRUCTIONS:
1. Target Script: Provide natural, grammatically correct practice sentences in the native script and orthography of ${langTitle} in the "target" property.
2. Grammar & Agreement: Follow standard grammar, declension, conjugation, and natural word order.`;

    jsonFormatExample = `Output JSON with an array of objects matching this exact structure:
[
  {
    "english": "English sentence prompt",
    "target": "Sentence in ${langTitle}",
    "alternatives": ["Alternative valid sentence in ${langTitle}"]
  }
]`;
  }

  return `You are a ${langTitle} language pedagogy expert creating interactive flashcard practice sentences for a language student.

STUDENT VOCABULARY LIST:
"""
${vocabString}
"""

TASK:
Compose ${numSentences} varied, conversational, and natural practice sentences strictly constrained by the provided vocabulary list.

${generalInstructions}

${languageSpecificInstructions}

${jsonFormatExample}`;
}

// API route to generate practice sentences constrained to specific vocabulary
app.post('/api/generate-sentences', async (req, res) => {
  try {
    const { vocabList, count = 25, lessonTitle = "", language = "" } = req.body;

    if (!vocabList || !Array.isArray(vocabList) || vocabList.length === 0) {
      return res.status(400).json({ error: 'vocabList array is required and must not be empty' });
    }

    const targetLang = detectLanguage(language, vocabList, lessonTitle);
    const numSentences = Math.min(Math.max(parseInt(count, 10) || 25, 1), 50);
    const vocabString = vocabList.join('\n');
    const prompt = buildPrompt({ language: targetLang, vocabString, numSentences });

    const ai = getGenAI();
    // Support fallback models when a specific model experiences transient high demand spikes (503)
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let responseText = '';
    let lastError = null;

    for (const candidateModel of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: candidateModel,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
        responseText = response.text || '';
        if (responseText) {
          lastError = null;
          break;
        }
      } catch (callErr) {
        console.warn(`Model ${candidateModel} failed, trying fallback. Error:`, callErr.message || callErr);
        lastError = callErr;
        // Small delay before trying fallback model
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (lastError && !responseText) {
      throw lastError;
    }
    let sentences = [];
    try {
      sentences = JSON.parse(responseText.trim());
    } catch (parseErr) {
      // Fallback: search for JSON array within the text
      const match = responseText.match(/\[[\s\S]*\]/);
      if (match) {
        sentences = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse Gemini JSON response: ' + responseText);
      }
    }

    if (!Array.isArray(sentences)) {
      sentences = [];
    }

    // Normalize output format
    sentences = sentences.map(item => {
      const target = (item.target || item.jyutping || item.hebrew || "").trim();
      const normalized = {
        english: (item.english || "").trim(),
        target: target,
        alternatives: Array.isArray(item.alternatives)
          ? item.alternatives.map(a => (typeof a === "string" ? a.trim() : "")).filter(Boolean)
          : []
      };
      if (targetLang.includes('cantonese') || item.jyutping) {
        normalized.jyutping = item.jyutping || target;
      }
      if (item.characters) {
        normalized.characters = item.characters.trim();
      }
      return normalized;
    });

    return res.json({
      success: true,
      language: targetLang,
      lessonTitle,
      count: sentences.length,
      sentences
    });
  } catch (err) {
    console.error('Error generating sentences:', err);
    return res.status(500).json({
      error: err.message || 'Failed to synthesize sentences from vocabulary'
    });
  }
});

// Alias direct lesson file requests if requested at root
app.get('/test.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'lessons', 'test.txt'));
});
app.get('/Polish.7.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'lessons', 'Polish.7.txt'));
});

// Serve static assets from root directory
app.use(express.static(path.join(__dirname)));

// Root route serves Flash.html directly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Flash.html'));
});

// Fallback to Flash.html for unrecognized routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Flash.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FlashType app listening on http://0.0.0.0:${PORT}`);
});

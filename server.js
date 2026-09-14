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

// API route to generate practice sentences constrained to specific vocabulary
app.post('/api/generate-sentences', async (req, res) => {
  try {
    const { vocabList, count = 25, lessonTitle = "" } = req.body;

    if (!vocabList || !Array.isArray(vocabList) || vocabList.length === 0) {
      return res.status(400).json({ error: 'vocabList array is required and must not be empty' });
    }

    const numSentences = Math.min(Math.max(parseInt(count, 10) || 25, 1), 50);
    const vocabString = vocabList.join('\n');

    const prompt = `You are a Cantonese language pedagogy expert creating interactive flashcard practice sentences for a language student.

STUDENT VOCABULARY LIST:
"""
${vocabString}
"""

TASK:
Compose ${numSentences} varied, conversational, and natural practice sentences strictly constrained by the provided vocabulary list.

STRICT CONSTRAINTS:
1. STRICT VOCABULARY RESTRICTION: Every content word (verbs, nouns, adjectives, places, pronouns, time words) in your sentences MUST originate from or directly match the vocabulary list above. Do NOT introduce outside nouns, outside food names, outside locations, or outside verbs.
2. Grammar & Particles: You may use standard spoken Cantonese functional particles if grammatically required for natural sentences (e.g., question particles like aa3, maa3, or locative marker hai2, or aspect markers like zo2 / gwo3 if appropriate).
3. Natural Spoken Cantonese Word Order: Follow standard colloquial Cantonese syntax (e.g., [Time] [Subject] [Modal] [Location: hai2 + Place] [Verb] [Object] [Particle]).
4. Jyutping Format: Provide exact standard Jyutping with numeric tone markers 1-6 attached to each syllable (e.g., "ngo5 soeng2 hai2 ngo5 dou6 sik6 je5"). Do not use diacritics/tone marks.
5. Alternative answers: Provide 1-3 valid variations in Jyutping (such as alternative word order like time at the beginning, or interchangeable phrasing like soeng2 vs soeng2 jiu3) if naturally acceptable.
6. English format: Natural, clear English sentence prompt for flashcard practice.
7. Traditional Chinese Characters: Provide standard Cantonese written characters (Hanzi) for the primary sentence in the "characters" property (e.g. "我想要喺我度食嘢").

Output JSON with an array of objects matching this exact structure:
[
  {
    "english": "I want to eat something at my place",
    "jyutping": "ngo5 soeng2 hai2 ngo5 dou6 sik6 je5",
    "characters": "我想要喺我度食嘢",
    "alternatives": ["ngo5 soeng2 jiu3 hai2 ngo5 dou6 sik6 je5"]
  }
]`;

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

    return res.json({
      success: true,
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

// Audio requests that do not exist return 404 without falling back to HTML
app.get('/audio/*', (req, res) => {
  res.status(404).send('Audio file not found');
});

// Fallback to Flash.html for unrecognized routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Flash.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FlashType app listening on http://0.0.0.0:${PORT}`);
});

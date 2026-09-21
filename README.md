# FlashType

FlashType is an interactive, voice-enabled language-learning application designed to build rapid vocabulary recall, authentic pronunciation, and sentence-production fluency.

---

## 🌐 Live Deployments

* **GitHub Pages**: [https://doonch.github.io/FlashType](https://doonch.github.io/FlashType)  
  *(Client-side static deployment. Features typing drills, Web Speech audio synthesis, and passive mode.)*
* **Google AI Studio App**: [https://ais-pre-npa66crhfhw725c7lgm4mu-487464250671.us-east1.run.app](https://ais-pre-npa66crhfhw725c7lgm4mu-487464250671.us-east1.run.app)  
  *(Full-stack deployment supporting all core drills plus Gemini AI sentence generation.)*

---

## 💡 Learning Philosophy

FlashType is built around a two-stage acquisition model that transitions learners from active memory retrieval to natural conversational production:

### 1. Type-to-Memorize: Single Words & Expressions
Passive recognition (e.g., flashcard flipping or multiple-choice guessing) often creates an "illusion of competence" where you recognize a word when seen, but cannot recall or produce it under pressure.

* **Muscle Memory for Words**: You **must** type in the exact correct target answer to advance to the next prompt.
* **Instant Character-Level Feedback**: Typing forces your brain to recall every letter, syllable, and tone marker, encoding vocabulary into long-term active memory.

### 2. Speak Full Sentences & Verify by Listening
Once you have memorized single words and essential expressions, you transition to fluent sentence production:

* **Say It Out Loud Before the Reveal**: When a prompt appears on screen or is read aloud, challenge yourself to speak the complete translation out loud before the countdown ends.
* **Instant Audio Self-Correction**: When the answer reveals, the browser reads the native translation aloud using high-quality speech synthesis. You immediately verify your pronunciation, word order, and cadence against native audio.
* **Hands-Free Passive Audio Mode**: Switch to passive practice (▶) to listen to an automatic, rhythmic loop of question-and-answer pairs while commuting, cooking, or resting.

---

## ✨ AI Sentence Generation & Gemini API Key Setup

FlashType includes a **Practice Sentence Synthesizer** (the ✨ button in the top navigation). Powered by Google Gemini, it dynamically generates brand-new, realistic conversational sentences that **strictly use only the vocabulary you have already studied** across your selected lessons.

> **Note**: AI sentence generation runs server-side and requires a valid **Gemini API key**. On static GitHub Pages, core typing drills and speech playback work fully client-side, but the AI sentence generator requires a backend instance configured with an API key.

### How to Configure Your Gemini API Key

1. **Obtain a Gemini API Key**:
   * Visit [Google AI Studio](https://aistudio.google.com/) and click **Get API key**.
   * Create or select a Google Cloud project to generate your free key.

2. **When Running in Google AI Studio**:
   * Open the app workspace in [Google AI Studio](https://ai.studio).
   * Open the **Settings** menu and set your `GEMINI_API_KEY`.
   * The backend proxy will automatically authenticate requests without exposing your secret key to the browser.

3. **When Running Locally (Node.js)**:
   * Clone the repository:
     ```bash
     git clone https://github.com/doonch/FlashType.git
     cd FlashType
     ```
   * Install dependencies:
     ```bash
     npm install
     ```
   * Create your local environment file:
     ```bash
     cp .env.example .env
     ```
   * Open `.env` in any editor and add your key:
     ```env
     GEMINI_API_KEY=your_actual_api_key_here
     ```
     *(Alternatively, set the environment variable in your terminal: `export GEMINI_API_KEY="your_api_key"`)*
   * Start the server:
     ```bash
     npm start
     ```
   * Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ How to Add a New Language Course

FlashType is designed to make adding new languages and custom lessons straightforward. Every course follows a standard 8-lesson curriculum of high-frequency vocabulary (maximum 30 items per lesson).

For complete curriculum details and ready-to-use LLM prompts, see [`INSTRUCTIONS_ADD_LANGUAGE.txt`](INSTRUCTIONS_ADD_LANGUAGE.txt).

### Step 1: Create the Lesson Text Files
Create plain text `.txt` files inside the `lessons/` directory following the naming pattern `lessons/<Language>.<LessonNumber>.txt` (e.g., `lessons/Italian.1.txt` through `lessons/Italian.8.txt`).

* **Format**: One item pair per line using a colon (`question:answer`).
* **Synonyms**: If multiple target answers are valid, separate them with forward slashes (`/`).
* **Size**: Keep each lesson to a maximum of 30 lines.

```text
Hello:Ciao
good morning:buongiorno
please:per favore/per piacere
thank you:grazie
goodbye:arrivederci/ciao
```

### Step 2: Register in `files.list`
Add the lesson filename to `files.list`:
```text
Italian.1.txt
Italian.2.txt
...
```

### Step 3: Register Lessons & Category in `data.js`
1. Add the new language category to the `groups` array:
   ```javascript
   var groups = [
       "Cantonese",
       "Greek",
       "Hebrew",
       "Italian",
       ...
   ];
   ```
2. Append the lesson definitions to `lessonFiles`:
   ```javascript
   lessonFiles[lessonFiles.length] = new lesson("Lesson 1: Greetings & identity", "lessons/Italian.1.txt", "Italian", false, false);
   lessonFiles[lessonFiles.length] = new lesson("Lesson 2: Orientation & travel", "lessons/Italian.2.txt", "Italian", false, false);
   ```

### Step 4: Configure Flags & Voice in `utils.js`
1. **Add Flag and Metadata to `LANGUAGE_FLAGS`**:
   ```javascript
   {
       id: "italian",
       name: "Italian",
       country: "Italy",
       flagEmoji: "🇮🇹",
       categories: ["Italian"],
       svg: '<svg viewBox="0 0 30 20" class="flag-svg" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#ffffff"/><rect x="20" width="10" height="20" fill="#ce2b37"/></svg>'
   }
   ```
2. **Map Category ID in `getLanguageIdForCategory()`**:
   ```javascript
   if (c.indexOf("italian") !== -1) return "italian";
   ```
3. **Set Web Speech Voice Code in `getAnswerLanguage()`**:
   Map the language category to the target BCP 47 language code (e.g., `"it-IT"` for Italian, `"de-DE"` for German, `"fr-FR"` for French, `"ja-JP"` for Japanese):
   ```javascript
   if (cat.indexOf("italian") !== -1) return "it-IT";
   ```

---

## 📄 License
This project is open-source under the BSD 3-Clause License. See [LICENSE](LICENSE) for details.

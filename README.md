# ReflectOS: The Whispering Pages

A beautifully designed, Dark Academia-themed AI journaling application powered by Google Gemini. "The Whispering Pages" acts as an intelligent, philosophical archivist that listens to your daily thoughts, analyzes your state of mind, and curates an aesthetic landscape based on your reflections.

## Features

- **Multimodal Journaling:** Express yourself through text, voice dictation (Web Speech API), or by uploading images (handwritten notes, photos) to be transcribed via Gemini Vision.
- **AI-Powered Insights:** Every entry is analyzed by Gemini to generate a philosophical observation about your state of mind, extract core conceptual "blossoms", and generate a custom 4-color hex palette reflecting your mood.
- **Elegant UI:** A highly responsive, glassmorphic parchment interface with custom SVG graphics ("Memory Loom" and "Concept Blossoms") that adapt gracefully from desktop to mobile.
- **Secure Authentication:** Built-in Firebase Authentication ensures your reflections remain private.

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express
- **AI Integration:** `@google/genai` (Gemini 3.1 Flash Lite for chat/insights, Gemini Flash Latest for vision)
- **Database/Auth:** Firebase

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Ensure you have a `.env` file with the following keys:
   - `GEMINI_API_KEY` (Required for AI features)
   - Firebase configuration keys (if running locally)

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available on `http://localhost:3000`.

4. **Build for Production:**
   ```bash
   npm run build
   ```

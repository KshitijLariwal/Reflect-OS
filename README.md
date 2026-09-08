# ReflectOS

A beautifully designed, AI-augmented journaling application built for the Google Cloud Run AI Challenge. ReflectOS acts as an intelligent archivist that listens to your daily thoughts, analyzes your state of mind, and curates an aesthetic landscape based on your reflections.

## Features

- **Multimodal Journaling:** Express yourself through text, voice dictation, or by uploading images (e.g., handwritten notes) to be transcribed via Gemini Vision.
- **AI-Powered Insights:** Every entry is analyzed by Gemini 3.6 Flash to generate philosophical observations, extract core concepts, and build a custom 4-color palette reflecting your mood.
- **Semantic Memory:** Utilizes Firestore vector search and `text-embedding-005` to surface relevant past entries and thematic patterns over time.
- **Organic UI:** A highly responsive, glassmorphic parchment interface with custom SVG graphics that adapt based on the generated emotional landscape.
- **Secure Authentication:** Built-in Firebase Authentication ensures your reflections remain entirely private.

## Architecture & Tech Stack

- **Compute & Deployment:** Containerized and deployed serverless on Google Cloud Run for zero-maintenance scalability.
- **CI/CD:** Fully automated deployments via GitHub Actions (`.github/workflows/deploy.yml`), publishing to Google Artifact Registry.
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite.
- **Backend:** Express.js bundled via esbuild for lean Node.js execution.
- **AI Integration:** `@google/genai` (Gemini 3.6 Flash for chat/vision, `text-embedding-005` for vectorization).
- **Database/Auth:** Firebase Auth (Client) + Firebase Admin SDK (Server) backed by Google Cloud Secret Manager for credential isolation.

## Getting Started (Local Development)

### Prerequisites
- Node.js (v20 or higher recommended)
- A Firebase Project with Firestore and Authentication enabled
- A Gemini API Key

### Installation

1. **Clone and Install:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=your_service_account_email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available on `http://localhost:3000`.

## Production Build

The application is configured to build the Vite frontend and esbuild backend into a single deployment artifact:

```bash
npm run build
npm start
```

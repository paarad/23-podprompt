# PodPrompt

An AI tool that breaks down podcast episodes into structured summaries, key insights, and social-ready content.

## Setup

1. Clone and install:

```
npm install
```

2. Configure environment:

```
cp .env.local.example .env.local
# Fill OPENAI_API_KEY in .env.local
```

3. Run the dev server:

```
npm run dev
```

Then open http://localhost:3000

## Usage

- Upload an audio file or paste a direct audio URL
- Click "Transcribe & Summarize"
- Copy generated content from sections

## API

- POST `/api/transcribe` — multipart/form-data with `file` and/or `url`
- POST `/api/summarize` — JSON `{ "transcript": string }`

## Stack

- Next.js (App Router)
- Tailwind CSS
- shadcn/ui (optional components)
- OpenAI Whisper (transcription) + GPT-4o (summarization)

## Notes

- This project does not require auth.
- For non-direct links (Spotify/Apple), you need a direct audio URL.

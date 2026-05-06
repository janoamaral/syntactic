# Syntactic

AI-powered English writing practice companion. Simulate real conversations, receive structured feedback on grammar, syntax, naturalness and style, track your score over time, and review past sessions — all locally, no account needed.

## Requirements

- **Node.js** 18 or newer
- **npm** 9 or newer (bundled with Node)
- **Ollama** running locally (default provider for the MVP)
  - Install from https://ollama.com
  - Pull at least one model before starting, e.g. `ollama pull llama3`
  - The Ollama API must be reachable at `http://localhost:11434` (configurable in Settings)

> Other providers (OpenAI, Anthropic, Google, Qwen) are supported via the Settings panel; they require an API key.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (opens at http://localhost:5173)
npm run dev
```

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR at `http://localhost:5173` |
| `npm run build` | Type-check and compile a production bundle into `dist/` |
| `npm run preview` | Serve the production build locally to verify it before deploying |
| `npm run lint` | Run ESLint across all source files |
| `npm run typecheck` | Run `tsc --noEmit` without emitting files (type-check only) |

## Building for production

```bash
npm run build
```

The optimised bundle is written to `dist/`. You can serve it with any static file server:

```bash
# Quick local check
npm run preview

# Or with a generic static server
npx serve dist
```

## Project structure

```
src/
├── features/
│   ├── practice/     # Conversation flow, Composer input, active session state
│   ├── sessions/     # Session history list and transcript replay
│   ├── progress/     # Recharts score visualisations
│   └── settings/     # LLM provider config, import/export
├── llm/
│   ├── provider.ts          # LLMProvider interface and shared types
│   ├── prompts/             # Conversation and evaluator prompt templates
│   └── providers/           # Ollama, OpenAI, Anthropic, Google, Qwen adapters
├── storage/
│   ├── settingsStorage.ts   # localStorage repository (versioned, JSON export/import)
│   └── sessionDb.ts         # IndexedDB repository for sessions and per-turn analyses
├── types/
│   └── domain.ts            # Core domain models (Session, Turn, FeedbackAnalysis, Score…)
├── voice/
│   └── speechAdapter.ts     # Speech input interface — reserved for future voice support
└── utils/
    └── schema.ts            # Runtime validation helpers (Zod schemas)
```

## Data persistence

| Store | Mechanism | What is saved |
|---|---|---|
| Settings | `localStorage` | LLM provider, model name, base URL, API key, default topic/culture |
| Sessions & analyses | `IndexedDB` (`syntactic-db`) | Full conversation transcripts, per-turn feedback and scores |

### Export / import settings

In the **Settings** panel, use **Export config** to download a `syntactic-config.json` file. Use **Import config** to load that file in another browser or machine. Only settings (provider, model, keys) are exported — session history stays in the local IndexedDB.

## LLM provider configuration

Open **Settings** and choose a provider:

| Provider | Base URL default | Requires API key |
|---|---|---|
| Ollama | `http://localhost:11434` | No |
| OpenAI | `https://api.openai.com` | Yes |
| Anthropic | `https://api.anthropic.com` | Yes |
| Google Gemini | `https://generativelanguage.googleapis.com` | Yes |
| Qwen (Dashscope) | `https://dashscope.aliyuncs.com` | Yes |

> **CORS note:** Browser-based direct calls to OpenAI/Anthropic/Google work for local development (Vite proxying or browser extension disabling CORS). For a deployed instance, add a thin backend proxy to avoid exposing API keys in the browser.

## Voice support (future)

The `src/voice/speechAdapter.ts` interface is already defined and wired into the feature flag system. It is disabled at runtime in the MVP. A future implementation only needs to provide a concrete `SpeechAdapter` and enable the `VITE_ENABLE_VOICE=true` env flag.

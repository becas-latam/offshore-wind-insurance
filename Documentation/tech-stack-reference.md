# Tech Stack Reference

Reference tech stack from **german-learning-game** project to be used as the foundation for **offshore-wind-insurance**.

---

## Core Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 19 |
| Language | TypeScript | 5.2 |
| Build Tool | Vite | 5.4 |
| Styling | Tailwind CSS | 3.4 |
| Component Library | shadcn/ui (New York style) | - |
| Headless UI | Radix UI | - |
| Additional UI | MUI (Material-UI) | 6.3 |
| Icons | Lucide React, Phosphor Icons | - |
| Routing | React Router | 7 |
| Data Fetching | TanStack React Query | 5 |
| Animations | Framer Motion | 12 |

## Backend & Infrastructure

| Service | Technology | Details |
|---------|-----------|---------|
| Auth | Firebase Auth | - |
| Database | Firestore | NoSQL, with rules and indexes |
| Storage | Firebase Storage | File storage with security rules |
| Hosting | Firebase Hosting | Serves from `dist` folder |
| Server Functions | Firebase Functions (Node.js 22) | Serverless |
| Python Functions | Google Cloud Functions (Python 3.12) | Flask, Uvicorn, Gunicorn |
| Offline DB | PouchDB | Client-side local storage |

## Payments & Communication

| Feature | Technology |
|---------|-----------|
| Payments | Stripe (client: @stripe/stripe-js, server: stripe) |
| Email | SendGrid (@sendgrid/mail) |
| Real-time Audio/Video | LiveKit (client + server SDK + React components) |

## AI Integration

| Technology | Purpose |
|-----------|---------|
| OpenAI SDK (Python) | LLM integration via Gemini API |
| Google Vertex AI | Cloud AI services |

## Internationalization

| Technology | Purpose |
|-----------|---------|
| i18next | i18n framework |
| react-i18next | React bindings |
| i18next-browser-languagedetector | Auto language detection |
| i18next-http-backend | Translation file loading |

## Content & Media

| Technology | Purpose |
|-----------|---------|
| TinyMCE + @tinymce/tinymce-react | Rich text editor |
| react-markdown / marked | Markdown rendering |
| Mermaid | Diagram rendering |
| Chart.js + react-chartjs-2 | Charts |
| Recharts | React charting |
| RecordRTC | Audio/video recording |
| PDF.js | PDF viewing |
| @react-pdf/renderer | PDF generation |
| Sharp | Image optimization |
| Howler.js | Audio playback |

## UI Utilities & Interactions

| Technology | Purpose |
|-----------|---------|
| Framer Motion | Animations |
| react-slick | Carousel |
| react-draggable | Drag-and-drop |
| react-dropzone | File uploads |
| clsx / tailwind-merge / class-variance-authority | Class name utilities |

## Dev & Testing

| Technology | Purpose |
|-----------|---------|
| Jest | Test runner |
| Firebase Emulators | Local development (Firestore, Functions, Auth, Storage) |
| dotenv | Environment variables |
| ESBuild | Bundling |

## Firebase Emulator Ports

| Service | Port |
|---------|------|
| Firestore | 8081 |
| Functions | 5001 |
| Auth | 9099 |
| Hosting | 5000 |
| Storage | 9199 |
| Emulator UI | 4000 |

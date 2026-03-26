# StreamVault

Browse movies and TV shows with data from [The Movie Database (TMDB)](https://www.themoviedb.org/). StreamVault includes search, genres, a watchlist, continue watching (stored locally in your browser), trailers, and embedded playback via VidKing.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- npm (bundled with Node)

## Setup

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Copy [`.env.example`](.env.example) to `.env` in the project root and add your TMDB API key:

   ```bash
   cp .env.example .env
   ```

   Set `VITE_TMDB_API_KEY` to your key from [TMDB API settings](https://www.themoviedb.org/settings/api).

   **Note:** With Vite, variables prefixed with `VITE_` are exposed to the client bundle. TMDB’s free key is intended for client-side use in many demos, but treat any API key as non-secret only if you accept that tradeoff. See comments in [`src/api/tmdb.js`](src/api/tmdb.js).

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start dev server (Vite + HMR)  |
| `npm run build`| Production build to `dist/`    |
| `npm run preview` | Serve production build locally |
| `npm run lint` | Run ESLint                     |
| `npm test`     | Run Vitest (watch mode)        |
| `npm run test:run` | Run Vitest once (CI / scripts) |

## Tech stack

- React 19, React Router 7, Vite 8
- Styling: CSS ([`src/index.css`](src/index.css))
- Icons: [Lucide React](https://lucide.dev/)

## Deploying

Run `npm run build` and host the `dist/` folder on any static host (Netlify, Vercel, GitHub Pages, etc.). Configure the host to serve `index.html` for client-side routes (SPA fallback).

## License

Private project (`private` in `package.json`). Third-party content and APIs are subject to their respective terms.

# Mitra Maheshwari Seva Pratishthan — Frontend

React + TypeScript + Vite + React Router PWA with a centralized CSS design system.

- **Design system:** `src/styles/global.css` — all colors, typography, spacing,
  borders, shadows and radii are CSS variables. Change the brand there, not in
  components.
- **Design language:** warm off-white background, dark charcoal text, deep maroon
  primary, Inter (400/700 only), restrained borders/shadows, mobile-first.
- **Pages:** `/` landing, `/register` verify member, `/register/details` review &
  correct record, `/register/verify` OTP, then `/dashboard`, `/family`, `/payments`
  (protected).
- **Data flow:** pages → feature services (`src/features/*/*.service.ts`) → central
  client (`src/services/api.ts`). No fetch calls inside components.

## Run

```bash
npm install
npm run dev        # http://localhost:5173 — proxies /api and /health to :5000
npm run build      # typecheck + production build (PWA artifacts in dist/)
```

Set `VITE_API_BASE_URL` only when the API is not served at `/api`.

## Logo

The real logo ships at `public/cropped-logo-removebg-preview.webp` and is rendered
by the `Logo` component (monogram fallback only if the asset is missing).

## Icons

`node scripts/generate-icons.mjs` regenerates the favicon/PWA icon set from the
real logo asset (it renders the logo through headless Chrome, preserving its
proportions).
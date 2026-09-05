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
npm run dev        # http://localhost:5173 — proxies /api to http://localhost:4000
npm run build      # typecheck + production build (PWA artifacts in dist/)
```

Set `VITE_API_BASE_URL` only when the API is not served at `/api`.

## Logo

Place the real logo at `public/assets/logo.svg`. Until then the `Logo` component
shows a monogram fallback automatically.

## Icons

Placeholder PWA icons are generated with `node scripts/generate-icons.mjs`
(regenerate after editing the brand color). Replace them with branded artwork
before production.
# DeMeetUP

**Premium social discovery — web, PWA, and native mobile.**

DeMeetUP is an 18+ social discovery platform that connects users with companions for curated meetup experiences. It runs as a Progressive Web App out of the box and ships to iOS and Android via Capacitor using the same codebase.

---

## Features

- **Account & onboarding** — email auth, password reset, role selection (user vs. companion), and a guided profile-completion flow
- **Discover** — browse and filter companions, feature curated picks, save favorites
- **Companion profiles** — dedicated setup flow with image moderation and watermarking
- **Chat** — in-app messaging between users and companions
- **Booking** — request, schedule, and manage meetups
- **Dashboard** — activity and booking overview
- **Admin panel** — moderation and oversight tools
- **Push notifications** — web push today, native push ready via Capacitor
- **Safety & privacy** — dedicated settings page and notification preferences
- **PWA** — installable, offline-aware, with a custom service worker for push
- **Native mobile** — Capacitor shells for iOS and Android with platform-aware APIs (`src/platform/*`)

---

## Tech stack

| Layer            | Tools                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Framework        | React 18, TypeScript, Vite 5                                          |
| Styling / UI     | Tailwind CSS, shadcn/ui (Radix primitives), Framer Motion, Lucide     |
| Routing          | React Router v6                                                       |
| Data / state     | TanStack Query, React Hook Form + Zod                                 |
| Backend          | Supabase (auth, Postgres, Storage, Edge Functions, Realtime)          |
| Edge functions   | `moderate-image`, `watermark-image`, `recommendations`, `send-push-notification` |
| Mobile           | Capacitor (iOS + Android)                                             |
| PWA              | `vite-plugin-pwa` + custom `sw-push.js` for web push                  |
| Testing          | Vitest, Testing Library, jsdom                                        |
| Tooling          | ESLint 9, TypeScript-ESLint, Bun (lockfile committed)                 |

---

## Project structure

```
src/
├── pages/            # Route-level screens (Discover, Chat, Booking, Admin, etc.)
├── features/         # Feature-scoped logic (chat, media)
├── components/       # Shared UI components (shadcn/ui lives here)
├── contexts/         # React contexts (AuthContext)
├── hooks/            # Reusable hooks (push notifications, etc.)
├── integrations/     # Third-party SDK wrappers (Supabase, Lovable)
├── platform/         # Platform-abstracted APIs — always import from here,
│                     # never call localStorage / navigator.share / etc. directly
├── lib/              # Small utilities
└── data/             # Static data
supabase/
├── migrations/       # SQL migrations
└── functions/        # Edge functions (Deno)
public/
├── sw-push.js        # Custom service worker for push notifications
└── pwa-icon-*.png    # PWA icons
```

The `src/platform/` folder is the key architectural rule: storage, haptics, share, clipboard, media, and lifecycle all go through it so the same code works on web, iOS, and Android. See `CAPACITOR.md` for the full rules.

---

## Prerequisites

- **Node.js** 18+ (or Bun — there's a `bun.lock` committed)
- **A Supabase project** — you'll need the URL and anon/publishable key
- For native mobile:
  - **Xcode** (for iOS builds, macOS only)
  - **Android Studio** (for Android builds)

---

## Running locally

### 1. Clone and install

```bash
git clone https://github.com/lizzietack/DeMeetUP.git
cd DeMeetUP
npm install
# or: bun install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key
```

You can find these in your Supabase project under **Project Settings → API**.

> ⚠️ **Do not commit `.env`.** Make sure `.env` is listed in `.gitignore` before your first push. If secrets have already been committed, rotate them in Supabase and scrub git history.

### 3. Apply database migrations

From the Supabase dashboard, or with the Supabase CLI:

```bash
supabase db push
```

Deploy the edge functions (optional — only if you want image moderation, watermarking, recommendations, and push working locally):

```bash
supabase functions deploy moderate-image
supabase functions deploy watermark-image
supabase functions deploy recommendations
supabase functions deploy send-push-notification
```

### 4. Start the dev server

```bash
npm run dev
```

Open the URL Vite prints (usually http://localhost:8080 or :5173).

---

## Scripts

| Command            | What it does                                |
| ------------------ | ------------------------------------------- |
| `npm run dev`      | Start Vite dev server with hot reload       |
| `npm run build`    | Production build to `dist/`                 |
| `npm run build:dev`| Build in development mode                   |
| `npm run preview`  | Preview the production build locally        |
| `npm run lint`     | Run ESLint                                  |
| `npm test`         | Run the Vitest test suite once              |
| `npm run test:watch` | Run Vitest in watch mode                  |

---

## Building for iOS and Android

Capacitor is pre-configured in `capacitor.config.ts`. Full setup lives in [`CAPACITOR.md`](./CAPACITOR.md), but the short version:

```bash
# One-time setup
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npm run build
npx cap add ios
npx cap add android
npx cap sync

# Run on device / simulator
npx cap run ios      # or: npx cap run android
```

> The `server.url` block in `capacitor.config.ts` points to the Lovable sandbox for hot-reload during development. **Remove it for production builds.**

---

## Contributing

1. Create a feature branch off `main`.
2. Follow the architecture rules in `CAPACITOR.md` — especially: never call `localStorage`, `navigator.share`, `navigator.clipboard`, etc. directly outside `src/platform/`.
3. Run `npm run lint` and `npm test` before opening a PR.

---

## License

Private project. All rights reserved.

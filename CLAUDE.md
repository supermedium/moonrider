# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Moon Rider is a free, open-source WebXR/VR rhythm game built with A-Frame (THREE.js abstraction). Players surf a musical road in VR, hitting beats synced to songs from BeatSaver.com. Supports multiple game modes: Ride (passive), Punch, Classic (Beat Saber-style), and Viewer (desktop).

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run start        # Dev server at localhost:3000 with HMR
npm run build        # Production build
npm run lint         # Lint with semistandard
npm run lint:fix     # Auto-fix lint issues
npm run deploy       # Build + deploy to gh-pages
```

**Critical: Node/npm version requirements are strict, not suggestions.**
- Node.js <= 12.18.3 (use nvm; Node 14+ breaks webpack 4/Babel)
- npm <= 6.14.6 (npm 7+ causes ERESOLVE errors; do NOT use `--legacy-peer-deps`)
- Build scripts (`build.sh` / `build.ps1`) validate versions before building
- Docker alternative: `docker run -it --rm -v "$(pwd)":/app -w /app node:12.18.3-alpine sh -c "npm install && npm run build"`
- For CI (GitHub Actions): use `node-version: '12.18.3'` in setup-node action

### Common Build Problems

| Problem | Solution |
|---|---|
| `ERR_OSSL_EVP_UNSUPPORTED` | Downgrade to Node 12. Do NOT use `--openssl-legacy-provider` |
| `ERESOLVE unable to resolve dependency tree` | Downgrade to npm 6. Do NOT use `--legacy-peer-deps` |
| `gyp ERR! build error` | Linux: `apt install build-essential` / macOS: `xcode-select --install` |
| `Cannot find module 'webpack-cli'` | Delete `node_modules` + `package-lock.json`, re-run `npm install` |
| Build hangs or OOM | Ensure 1GB+ free RAM. Use `NODE_OPTIONS=--max-old-space-size=1024` |
| `zip-loader` install fails | Ensure git is installed — dep fetched from GitHub (`ngokevin/ziploader#xhrdist`) |

## Architecture

**Tech stack:** A-Frame + THREE.js, webpack 4, Babel 7 (ES5/CommonJS), aframe-state-component (Redux-like), Firebase (leaderboards), GLSL shaders.

### Entry Points & Build

- `src/index.js` — Webpack entry. Dynamically requires all components and state handlers via webpack context, then loads the scene.
- `src/scene.html` — Main A-Frame scene template (Nunjucks). Defines entity pools, state bindings, VR rig, and containers.
- `src/workers/zip.js` — Web Worker entry for background beatmap decompression.
- Build output: `build/build.js` (app bundle) and `build/zip.js` (worker bundle).

### State Management

`src/state/index.js` — Single centralized state (~30KB) using `aframe-state-component`. Contains `initialState` (40+ properties) and all handlers (play/pause, scoring, menu navigation, favorites). Components bind to state declaratively: `bind__component="property: state.path"`. Favorites/preferences persist via localStorage.

### Component System

`src/components/` contains 87+ A-Frame custom components organized by function:
- **Beat system:** `beat-generator.js` (loads/spawns beats), `beat.js` (individual block logic), `beat-cut-fx.js` (hit effects)
- **Menu/UI:** 21+ `menu-*.js` files for all screens and navigation
- **VR/Input:** `controller.js` (hand tracking + collision), `punch.js`/`blade.js` (weapons)
- **Visuals:** `stage-lasers.js`, `supercurve.js`, `tunnels.js` + 36 GLSL shaders in `src/components/shaders/`

### Game Data Flow

Menu selection → `beat-generator` fetches song metadata from BeatSaver API → `zip-loader` web worker downloads/decompresses beatmap ZIP → parses beatmap JSON → spawns beat objects from entity pool → audio plays, beats move along curve → controller collision triggers scoring via state handlers.

## Debugging

URL parameters for development:
- `?skipintro=true` — Skip intro sequence
- `?challenge=<id>` — Auto-load specific song
- `?debugcontroller={classic,punch,ride}` — Keyboard controller simulation (shift/ctrl + h,j,k,l to move)
- `?debugbeatpositioning={classic,punch}` — Show all notes in possible positions
- `?debugstate={loading,victory}` — Force UI state

Environment variables: `DEBUG_LOG`, `DEBUG_AFRAME`, `DEBUG_KEYBOARD`, `DEBUG_INSPECTOR`.

## Key Constraints

- Pure CommonJS/ES5 — no TypeScript, no ESM modules
- A-Frame loaded from local `vendor/` copy (not CDN — the CDN version is broken)
- Components are auto-discovered via webpack `require.context` — just add a `.js` file to `src/components/` and it's included
- Entity pools are used for performance-critical objects (beats, effects) — defined in `scene.html`
- Global `AFRAME` and `THREE` objects are expected to be available (loaded before bundle)
- `npm run deploy` pushes to `gh-pages` branch → GitHub Pages at `https://<user>.github.io/moonrider/`

## Customization Entry Points

- Color palettes: `src/constants/colors.js`
- Game speed / reaction time: `speed` in `src/state/index.js`, `BEAT_PRELOAD_TIME` in `src/components/beat-generator.js`
- Assets (images, models, sounds): replace files in `src/assets/img/`, `src/assets/models/`, `src/assets/sounds/`

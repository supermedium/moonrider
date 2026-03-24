<!-- LLM-BUILD-GUIDE-START -->
## Build Guide for LLM Agents / AI Assistants

> **This section is intended for AI/LLM models** (Claude, GPT, Copilot, etc.)
> that need to build, modify, or deploy this repository.

### Critical Requirements

| Requirement | Version | Why |
|---|---|---|
| **Node.js** | any modern LTS (16+, 18+, 20+, 22+) | Projekt działa z nowszym Node dzięki pnpm i `--openssl-legacy-provider` |
| **pnpm** | latest | **Jedyny dozwolony menedżer pakietów.** npm/yarn są zablokowane przez `preinstall` script |
| **git** | any recent | Required for cloning and `zip-loader` GitHub dependency |
| **OS** | Linux, macOS, Windows | All platforms supported |

> **UWAGA:** Nie używaj `npm install` ani `yarn install` — zostaną zablokowane. Używaj wyłącznie `pnpm`.

### Quick Start (copy-paste ready)

**Linux/macOS:**
```bash
# Install pnpm (if not present)
corepack enable && corepack prepare pnpm@latest --activate
# Or: npm install -g pnpm

# Install and build
pnpm install
pnpm run build

# Dev server
pnpm run start    # https://localhost:4010
```

**Windows:**
```powershell
# Install pnpm
corepack enable
corepack prepare pnpm@latest --activate

pnpm install
pnpm run build
```

**Docker (any platform, no local Node needed):**
```bash
docker run -it --rm -v "$(pwd)":/app -w /app node:20-alpine sh -c "corepack enable && pnpm install && pnpm run build"
```

### Using the Build Scripts

This repo includes automated build scripts that check all dependencies before building:

```bash
# Linux/macOS
chmod +x build.sh
./build.sh              # Full check + build
./build.sh --check-only # Only verify dependencies

# Windows PowerShell
.\build.ps1              # Full check + build
.\build.ps1 -CheckOnly   # Only verify dependencies
```

> **Uwaga:** Build scripts mogą nadal odwoływać się do npm — w takim przypadku użyj bezpośrednio `pnpm run build`.

### Common Problems & Solutions

| Problem | Cause | Solution |
|---|---|---|
| `ERR_OSSL_EVP_UNSUPPORTED` | Node 17+ uses OpenSSL 3.0 | Użyj `NODE_OPTIONS=--openssl-legacy-provider` przed komendą webpack |
| `ERESOLVE unable to resolve dependency tree` | Użyto npm zamiast pnpm | Przełącz się na `pnpm install` — npm jest zablokowany w tym projekcie |
| `gyp ERR! build error` / native module failures | Missing C++ build tools | Linux: `apt install build-essential` / macOS: `xcode-select --install` / Windows: `npm install -g windows-build-tools` |
| `Error: Cannot find module 'webpack-cli'` | Incomplete install | Delete `node_modules` and `pnpm-lock.yaml`, then run `pnpm install` again |
| `EACCES permission denied` | Brak uprawnień | Use `corepack enable` lub zainstaluj pnpm przez `npm install -g pnpm` bez sudo (użyj nvm) |
| Build hangs or OOM killed | Not enough memory | Ensure at least 1GB free RAM. For CI, use `NODE_OPTIONS=--max-old-space-size=1024` |
| `zip-loader` install fails | Can't access GitHub | Ensure git is installed and GitHub is reachable. The `zip-loader` dep is fetched from `github:ngokevin/ziploader#xhrdist` |

### Architecture Notes for LLMs

- **Build system**: webpack 4 (`webpack.config.js`) with Babel 7
- **Entry points**: `src/index.js` (main app), `src/workers/zip.js` (web worker)
- **Output**: `build/build.js`, `build/zip.js`
- **Package manager**: pnpm (npm/yarn zablokowane przez `preinstall` script)
- **Dev server**: `pnpm run start` → `https://localhost:4010` (webpack-dev-server with HMR + HTTPS)
- **Production build**: `pnpm run build` (sets `NODE_ENV=production`, enables minification)
- **Deploy**: `pnpm run deploy` → builds and pushes to `gh-pages` branch
- **Framework**: A-Frame (WebXR/VR) — global `AFRAME` and `THREE` are expected
- **State management**: `aframe-state-component` (Redux-like for A-Frame)
- **Templates**: Nunjucks (`.html` files processed by `super-nunjucks-loader`)
- **No TypeScript, no ESM** — pure CommonJS/ES5-transpiled JS

### CI/CD Notes

- GitHub Pages deployment uses the `gh-pages` branch
- If GitHub Actions build fails with HTTP 500, it's a GitHub infrastructure issue — just re-run the job
- For GitHub Actions, use `pnpm/action-setup` + `setup-node` with `cache: 'pnpm'`

<!-- LLM-BUILD-GUIDE-END -->

# Moon Rider

![moonrider](https://user-images.githubusercontent.com/674727/54646629-e91dc600-4a5c-11e9-8a6e-91e77f28523d.jpg)

Surf the musical road among the moon, stars, and northern lights.

A side project built by two people in a few months to show off VR running
inside a webpage. Built with HTML, JavaScript, and A-Frame. Not meant to be an
official game nor commerical product. Moon Rider is meant to be an open source
resource for the web developer community to learn from, and to push forward the
open WebXR initiative.

![gif](https://user-images.githubusercontent.com/674727/58050249-ab442900-7b03-11e9-8763-913d42a26708.gif)

Song maps are sourced from [beatsaver](https://beatsaver.com). Supports all browsers and headsets (incl. Quest). If
there are any issues, file an issue here on GitHub or leave a message in the
[Supermedium Discord](https://supermedium.com/discord).

[**Try the site out now in your browser!**](https://supermedium.com/moonrider/)

![](https://user-images.githubusercontent.com/674727/58050969-b8621780-7b05-11e9-9494-1db7cee9f69b.jpeg)

Featuring various modes:

- **Ride Mode** - Just sit back and enjoy the ride.
- **Punch Mode** - Crush the stars.
- **Viewer Mode** - Watch the beatmap within your browser.
- **Classic Mode** - Surf and slice along the musical road.

Big thanks to @elliottate for helping out with this!

## Development

> **Ten projekt wymaga `pnpm` jako menedżera pakietów.** Użycie `npm` lub `yarn` jest zablokowane przez skrypt `preinstall`.

### Instalacja pnpm

```bash
# Przez corepack (Node >= 16.13)
corepack enable
corepack prepare pnpm@latest --activate

# Lub globalnie
npm install -g pnpm
```

### Uruchomienie

```bash
pnpm install        # Instalacja zależności
pnpm run start      # Dev server na https://localhost:4010
pnpm run build      # Build produkcyjny
pnpm run lint       # Linting (semistandard)
pnpm run lint:fix   # Auto-fix lint
pnpm run deploy     # Build + deploy na gh-pages
```

Then head to `https://localhost:4010` in your browser.

> **Dlaczego pnpm?** Projekt ma złożone drzewo zależności z wieloma peer dependency conflicts. pnpm z `shamefully-hoist=true` (skonfigurowane w `.npmrc`) rozwiązuje te konflikty lepiej niż npm/yarn, jednocześnie zachowując kompatybilność z webpack 4 i A-Frame.

### Remixing and Forking

Make this game your own! Some easy ways to mess around:

- To modify or add more color palettes, change `src/constants/colors.js`.
- To change images, replace images in `src/assets/img/` folder. For example,
  replace the moon at `src/assets/img/moon.png'.
- To change models, replace models in `src/assets/models/` folder. For example,
  replace the arrow blocks at `src/assets/models/arrowblue.obj` or
  `arrowred.obj`.
- To change sounds, replace sounds in `src/assets/sounds`. For example, replace
  the hit sounds at `src/assets/sounds/`.
- Change various values such as `speed` in `src/state/index.js` or
  `BEAT_PRELOAD_TIME` in `src/components/beat-generator.js` to mess with how
  fast you travel along the curve, or how much reaction time until the notes
  arrive to the player.

Other ways such as adding more modes are more involved, but with knowledge of
A-Frame and JavaScript, is doable!

### Test URL Parameters

| URL Parameter                           | Description                                                   |
|-----------------------------------------|---------------------------------------------------------------|
| ?debugcontroller={classic, punch, ride} | Show controllers and move them with shift/ctrl + {h, j, k, l} |
| ?debugbeatpositioning={classic, punch}  | Show all notes in possible positionings.                      |
| ?debugstate={loading, victory}          | Show loading or victory screen.                               |
| ?skipintro=true                         | Skip introduction screen.                                     |

### Deploying to GitHub

Showing off some crazy customizations? Enable GitHub Pages deployment to deploy
`gh-pages` branch, and then:

```
pnpm run deploy
```

The website will be available on `https://yourusername.github.io/moonrider/`.

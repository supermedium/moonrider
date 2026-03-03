<!-- LLM-BUILD-GUIDE-START -->
## Build Guide for LLM Agents / AI Assistants

> **This section is intended for AI/LLM models** (Claude, GPT, Copilot, etc.)
> that need to build, modify, or deploy this repository.

### Critical Requirements

| Requirement | Version | Why |
|---|---|---|
| **Node.js** | **<= 12.18.3** (recommended: v11 or v12) | webpack 4 + legacy Babel plugins break on Node 14+ |
| **npm** | **<= 6.14.6** | npm 7+ auto-installs peer deps, causing ERESOLVE conflicts |
| **git** | any recent | Required for cloning and `zip-loader` GitHub dependency |
| **OS** | Linux, macOS, Windows | All platforms supported |

### Quick Start (copy-paste ready)

**Linux/macOS with nvm:**
```bash
# Install nvm if not present
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh

# Switch to required Node version
nvm install 12.18.3
nvm use 12.18.3

# Verify versions
node --version  # must show v12.18.3 or lower
npm --version   # must show 6.x

# Install and build
npm install
npm run build
```

**Windows with nvm-windows:**
```powershell
# Install nvm-windows from: https://github.com/coreybutler/nvm-windows/releases
nvm install 12.18.3
nvm use 12.18.3

node --version  # must show v12.18.3 or lower
npm --version   # must show 6.x

npm install
npm run build
```

**Docker (any platform, no local Node needed):**
```bash
docker run -it --rm -v "$(pwd)":/app -w /app node:12.18.3-alpine sh -c "npm install && npm run build"
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

### Common Problems & Solutions

| Problem | Cause | Solution |
|---|---|---|
| `ERR_OSSL_EVP_UNSUPPORTED` | Node 17+ uses OpenSSL 3.0 | Downgrade to Node 12. Do NOT use `--openssl-legacy-provider` — other APIs are also broken |
| `ERESOLVE unable to resolve dependency tree` | npm 7+ strict peer dep resolution | Downgrade to npm 6 (comes with Node 12). Do NOT use `--legacy-peer-deps` — may cause runtime issues |
| `gyp ERR! build error` / native module failures | Missing C++ build tools | Linux: `apt install build-essential` / macOS: `xcode-select --install` / Windows: `npm install -g windows-build-tools` |
| `Error: Cannot find module 'webpack-cli'` | Incomplete npm install | Delete `node_modules` and `package-lock.json`, then run `npm install` again |
| `EACCES permission denied` | npm global install as wrong user | Use `nvm` (manages Node in user space, no sudo needed) |
| Build hangs or OOM killed | Not enough memory | Ensure at least 1GB free RAM. For CI, use `NODE_OPTIONS=--max-old-space-size=1024` |
| `zip-loader` install fails | Can't access GitHub | Ensure git is installed and GitHub is reachable. The `zip-loader` dep is fetched from `github:ngokevin/ziploader#xhrdist` |

### Architecture Notes for LLMs

- **Build system**: webpack 4 (`webpack.config.js`) with Babel 7
- **Entry points**: `src/index.js` (main app), `src/workers/zip.js` (web worker)
- **Output**: `build/build.js`, `build/zip.js`
- **Dev server**: `npm run start` → `localhost:3000` (webpack-dev-server with HMR)
- **Production build**: `npm run build` (sets `NODE_ENV=production`, enables minification)
- **Deploy**: `npm run deploy` → builds and pushes to `gh-pages` branch
- **Framework**: A-Frame (WebXR/VR) — global `AFRAME` and `THREE` are expected
- **State management**: `aframe-state-component` (Redux-like for A-Frame)
- **Templates**: Nunjucks (`.html` files processed by `super-nunjucks-loader`)
- **No TypeScript, no ESM** — pure CommonJS/ES5-transpiled JS

### CI/CD Notes

- GitHub Pages deployment uses the `gh-pages` branch
- If GitHub Actions build fails with HTTP 500, it's a GitHub infrastructure issue — just re-run the job
- For GitHub Actions, use `node-version: '12.18.3'` in the setup-node action

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

Have Node (< v12, recommended v11) and npm installed.

```
npm install
npm run start
```

Then head to `localhost:3000` in your browser.

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
npm run deploy
```

The website will be available on `https://yourusername.github.io/moonrider/`.

#!/usr/bin/env bash
# =============================================================================
# Moon Rider - Build Environment Checker & Builder (Linux/macOS)
# =============================================================================
# This script checks all required dependencies, validates versions,
# and builds the project. Exit code 0 = success, 1 = failure.
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

ERRORS=()
WARNINGS=()

# Required versions
REQUIRED_NODE_MAJOR=12
REQUIRED_NODE_MAX="12.18.3"
REQUIRED_NPM_MAX="6.14.6"

print_header() {
    echo ""
    echo -e "${CYAN}=============================================${NC}"
    echo -e "${CYAN}  Moon Rider - Build Environment Check${NC}"
    echo -e "${CYAN}=============================================${NC}"
    echo ""
}

print_section() {
    echo -e "${BLUE}--- $1 ---${NC}"
}

ok() {
    echo -e "  ${GREEN}[OK]${NC} $1"
}

warn() {
    echo -e "  ${YELLOW}[WARN]${NC} $1"
    WARNINGS+=("$1")
}

fail() {
    echo -e "  ${RED}[FAIL]${NC} $1"
    ERRORS+=("$1")
}

info() {
    echo -e "  ${CYAN}[INFO]${NC} $1"
}

# Compare semver: returns 0 if $1 <= $2, 1 otherwise
version_lte() {
    local IFS='.'
    local i
    local ver1=($1)
    local ver2=($2)
    for ((i=0; i<${#ver1[@]}; i++)); do
        if [[ -z "${ver2[i]:-}" ]]; then
            return 1
        fi
        if ((10#${ver1[i]} < 10#${ver2[i]})); then
            return 0
        fi
        if ((10#${ver1[i]} > 10#${ver2[i]})); then
            return 1
        fi
    done
    return 0
}

# Extract major version number
get_major() {
    echo "$1" | cut -d. -f1
}

# =============================================================================
# CHECK: Operating System
# =============================================================================
check_os() {
    print_section "Operating System"
    local os_name
    os_name="$(uname -s)"
    case "$os_name" in
        Linux)  ok "Linux detected" ;;
        Darwin) ok "macOS detected" ;;
        *)      warn "Untested OS: $os_name - build may have issues" ;;
    esac
}

# =============================================================================
# CHECK: Git
# =============================================================================
check_git() {
    print_section "Git"
    if command -v git &>/dev/null; then
        local git_ver
        git_ver="$(git --version | awk '{print $3}')"
        ok "git $git_ver installed"
    else
        fail "git is NOT installed. Install it: https://git-scm.com/"
    fi
}

# =============================================================================
# CHECK: Node.js
# =============================================================================
check_node() {
    print_section "Node.js (required: <= $REQUIRED_NODE_MAX, recommended: v11.x or v12.x)"

    if ! command -v node &>/dev/null; then
        fail "Node.js is NOT installed"
        info "Install Node.js v$REQUIRED_NODE_MAX using nvm:"
        info "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
        info "  nvm install $REQUIRED_NODE_MAX"
        info "  nvm use $REQUIRED_NODE_MAX"
        return
    fi

    local node_ver
    node_ver="$(node --version | sed 's/^v//')"
    local node_major
    node_major="$(get_major "$node_ver")"

    if version_lte "$node_ver" "$REQUIRED_NODE_MAX"; then
        ok "Node.js v$node_ver (within required range)"
    else
        fail "Node.js v$node_ver is TOO NEW (max: v$REQUIRED_NODE_MAX)"
        info "This project uses webpack 4 + legacy Babel plugins that are incompatible with Node > 12"
        info ""
        info "Fix with nvm:"
        info "  nvm install $REQUIRED_NODE_MAX"
        info "  nvm use $REQUIRED_NODE_MAX"
        info ""
        info "Fix with Docker:"
        info "  docker run -it --rm -v \"\$(pwd)\":/app -w /app node:$REQUIRED_NODE_MAX-alpine sh"
        info ""
        info "Known issues with newer Node versions:"
        info "  - Node 14+: webpack 4 compilation errors with OpenSSL changes"
        info "  - Node 16+: ERR_OSSL_EVP_UNSUPPORTED (OpenSSL 3.0 incompatibility)"
        info "  - Node 17+: --openssl-legacy-provider workaround may partially help"
        info "    but other deprecated APIs will still break the build"
        info "  - Node 18+: Multiple broken native module builds"
    fi
}

# =============================================================================
# CHECK: npm
# =============================================================================
check_npm() {
    print_section "npm (required: <= $REQUIRED_NPM_MAX)"

    if ! command -v npm &>/dev/null; then
        fail "npm is NOT installed (should come with Node.js)"
        return
    fi

    local npm_ver
    npm_ver="$(npm --version)"

    if version_lte "$npm_ver" "$REQUIRED_NPM_MAX"; then
        ok "npm v$npm_ver (within required range)"
    else
        fail "npm v$npm_ver is TOO NEW (max: v$REQUIRED_NPM_MAX)"
        info "npm 7+ changed the dependency resolution algorithm (peer deps auto-install)"
        info "which causes conflicts with this project's legacy dependency tree"
        info ""
        info "Fix: use nvm to switch to Node v$REQUIRED_NODE_MAX (comes with npm 6)"
        info "  nvm install $REQUIRED_NODE_MAX"
        info "  nvm use $REQUIRED_NODE_MAX"
    fi
}

# =============================================================================
# CHECK: nvm (optional but recommended)
# =============================================================================
check_nvm() {
    print_section "nvm (optional, recommended for managing Node versions)"

    if command -v nvm &>/dev/null || [ -d "$HOME/.nvm" ]; then
        ok "nvm is available"

        # Check if correct Node version is installed in nvm
        if [ -d "$HOME/.nvm/versions/node/v$REQUIRED_NODE_MAX" ]; then
            ok "Node v$REQUIRED_NODE_MAX is installed in nvm"
            info "Activate it with: nvm use $REQUIRED_NODE_MAX"
        else
            warn "Node v$REQUIRED_NODE_MAX not installed in nvm"
            info "Install it: nvm install $REQUIRED_NODE_MAX"
        fi
    else
        info "nvm not found - recommended for managing Node versions"
        info "Install: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    fi
}

# =============================================================================
# CHECK: Build tools (make, gcc/g++, python) - needed for native modules
# =============================================================================
check_build_tools() {
    print_section "Build tools (for native npm modules)"

    if command -v make &>/dev/null; then
        ok "make is available"
    else
        warn "make not found - some native npm modules may fail to compile"
        info "Install: sudo apt install build-essential  (Debian/Ubuntu)"
        info "         sudo yum groupinstall 'Development Tools'  (RHEL/CentOS)"
    fi

    if command -v gcc &>/dev/null || command -v cc &>/dev/null; then
        ok "C compiler is available"
    else
        warn "C compiler not found - some native npm modules may fail to compile"
    fi

    if command -v g++ &>/dev/null || command -v c++ &>/dev/null; then
        ok "C++ compiler is available"
    else
        warn "C++ compiler not found - some native npm modules may fail to compile"
    fi

    if command -v python3 &>/dev/null || command -v python &>/dev/null; then
        ok "Python is available (needed by node-gyp)"
    else
        warn "Python not found - node-gyp requires Python for building native modules"
    fi
}

# =============================================================================
# CHECK: package.json exists
# =============================================================================
check_package_json() {
    print_section "Project files"

    if [ -f "package.json" ]; then
        ok "package.json found"
    else
        fail "package.json NOT found - are you in the project root directory?"
        info "Run this script from the moonrider project root"
    fi

    if [ -f "webpack.config.js" ]; then
        ok "webpack.config.js found"
    else
        fail "webpack.config.js NOT found"
    fi

    if [ -f "src/index.js" ]; then
        ok "src/index.js entry point found"
    else
        fail "src/index.js NOT found"
    fi
}

# =============================================================================
# CHECK: node_modules
# =============================================================================
check_node_modules() {
    print_section "Dependencies (node_modules)"

    if [ -d "node_modules" ]; then
        ok "node_modules directory exists"
        # Quick check for key deps
        local missing_deps=()
        for dep in webpack webpack-cli cross-env babel-loader; do
            if [ ! -d "node_modules/$dep" ] && [ ! -d "node_modules/.package-lock.json" ]; then
                missing_deps+=("$dep")
            fi
        done
        if [ ${#missing_deps[@]} -gt 0 ]; then
            warn "Some key dependencies may be missing. Run: npm install"
        fi
    else
        info "node_modules not found - run 'npm install' first"
    fi
}

# =============================================================================
# CHECK: Disk space
# =============================================================================
check_disk_space() {
    print_section "Disk space"
    local available_kb
    available_kb=$(df -k . | awk 'NR==2{print $4}')
    local available_mb=$((available_kb / 1024))

    if [ "$available_mb" -gt 1024 ]; then
        ok "${available_mb}MB available (need ~500MB for build)"
    elif [ "$available_mb" -gt 500 ]; then
        warn "${available_mb}MB available - may be tight for build"
    else
        fail "Only ${available_mb}MB available - need at least 500MB"
    fi
}

# =============================================================================
# BUILD
# =============================================================================
run_build() {
    print_section "Build"

    if [ ${#ERRORS[@]} -gt 0 ]; then
        echo ""
        echo -e "${RED}Cannot proceed with build - critical errors found:${NC}"
        for err in "${ERRORS[@]}"; do
            echo -e "  ${RED}*${NC} $err"
        done
        echo ""
        echo -e "${YELLOW}Fix the above errors and re-run this script.${NC}"
        return 1
    fi

    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}Warnings found (build may still work):${NC}"
        for w in "${WARNINGS[@]}"; do
            echo -e "  ${YELLOW}*${NC} $w"
        done
        echo ""
    fi

    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ] && [ ! -f "node_modules/.yarn-integrity" ]; then
        info "Installing dependencies..."
        if ! npm install 2>&1; then
            fail "npm install failed"
            info "If you see ERESOLVE errors, your npm version is too new (needs <= 6)"
            info "If you see node-gyp errors, you may need build tools (gcc, make, python)"
            return 1
        fi
        ok "Dependencies installed"
    else
        ok "Dependencies already installed"
    fi

    # Run production build
    info "Running production build..."
    echo ""
    if NODE_ENV=production npm run build 2>&1; then
        echo ""
        ok "Build completed successfully!"
        echo ""
        echo -e "${GREEN}Output files:${NC}"
        if [ -f "build/build.js" ]; then
            echo "  build/build.js ($(du -h build/build.js | cut -f1))"
        fi
        if [ -f "build/zip.js" ]; then
            echo "  build/zip.js ($(du -h build/zip.js | cut -f1))"
        fi
    else
        echo ""
        fail "Build failed!"
        info ""
        info "Common causes:"
        info "  1. Wrong Node.js version (must be <= $REQUIRED_NODE_MAX)"
        info "  2. Corrupted node_modules - try: rm -rf node_modules && npm install"
        info "  3. OpenSSL errors (Node 17+) - downgrade Node instead of using --openssl-legacy-provider"
        return 1
    fi
}

# =============================================================================
# SUMMARY
# =============================================================================
print_summary() {
    echo ""
    echo -e "${CYAN}=============================================${NC}"
    echo -e "${CYAN}  Summary${NC}"
    echo -e "${CYAN}=============================================${NC}"

    if [ ${#ERRORS[@]} -eq 0 ] && [ ${#WARNINGS[@]} -eq 0 ]; then
        echo -e "${GREEN}  All checks passed!${NC}"
    fi

    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo -e "${YELLOW}  Warnings: ${#WARNINGS[@]}${NC}"
        for w in "${WARNINGS[@]}"; do
            echo -e "    ${YELLOW}-${NC} $w"
        done
    fi

    if [ ${#ERRORS[@]} -gt 0 ]; then
        echo -e "${RED}  Errors: ${#ERRORS[@]}${NC}"
        for err in "${ERRORS[@]}"; do
            echo -e "    ${RED}-${NC} $err"
        done
        echo ""
        echo -e "${RED}  BUILD BLOCKED - fix errors above first${NC}"
    fi
    echo ""
}

# =============================================================================
# MAIN
# =============================================================================
main() {
    print_header

    check_os
    check_git
    check_node
    check_npm
    check_nvm
    check_build_tools
    check_package_json
    check_node_modules
    check_disk_space

    print_summary

    if [[ "${1:-}" == "--check-only" ]]; then
        info "Check-only mode - skipping build"
        [ ${#ERRORS[@]} -eq 0 ] && exit 0 || exit 1
    fi

    run_build
    local build_exit=$?

    [ $build_exit -eq 0 ] && exit 0 || exit 1
}

main "$@"

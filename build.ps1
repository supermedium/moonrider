# =============================================================================
# Moon Rider - Build Environment Checker & Builder (Windows PowerShell)
# =============================================================================
# This script checks all required dependencies, validates versions,
# and builds the project. Exit code 0 = success, 1 = failure.
#
# Usage: .\build.ps1              # Check + Build
#        .\build.ps1 -CheckOnly   # Only check dependencies
# =============================================================================

param(
    [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

# Required versions
$RequiredNodeMax = "12.18.3"
$RequiredNpmMax = "6.14.6"

$Errors = [System.Collections.ArrayList]::new()
$Warnings = [System.Collections.ArrayList]::new()

function Write-Header {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "  Moon Rider - Build Environment Check" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Section($text) {
    Write-Host "--- $text ---" -ForegroundColor Blue
}

function Write-Ok($text) {
    Write-Host "  [OK]   $text" -ForegroundColor Green
}

function Write-Warn($text) {
    Write-Host "  [WARN] $text" -ForegroundColor Yellow
    $null = $Warnings.Add($text)
}

function Write-Fail($text) {
    Write-Host "  [FAIL] $text" -ForegroundColor Red
    $null = $Errors.Add($text)
}

function Write-Info($text) {
    Write-Host "  [INFO] $text" -ForegroundColor Cyan
}

function Compare-SemVer {
    param([string]$Version1, [string]$Version2)
    # Returns $true if $Version1 <= $Version2
    $v1 = $Version1.Split('.') | ForEach-Object { [int]$_ }
    $v2 = $Version2.Split('.') | ForEach-Object { [int]$_ }
    for ($i = 0; $i -lt $v1.Count; $i++) {
        if ($i -ge $v2.Count) { return $false }
        if ($v1[$i] -lt $v2[$i]) { return $true }
        if ($v1[$i] -gt $v2[$i]) { return $false }
    }
    return $true
}

# =============================================================================
# CHECK: Operating System
# =============================================================================
function Test-OperatingSystem {
    Write-Section "Operating System"
    $os = [System.Environment]::OSVersion
    Write-Ok "Windows $($os.Version) detected"
}

# =============================================================================
# CHECK: Git
# =============================================================================
function Test-Git {
    Write-Section "Git"
    try {
        $gitVer = & git --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "$gitVer installed"
        } else {
            throw "git not found"
        }
    } catch {
        Write-Fail "git is NOT installed. Install from: https://git-scm.com/download/win"
    }
}

# =============================================================================
# CHECK: Node.js
# =============================================================================
function Test-Node {
    Write-Section "Node.js (required: <= v$RequiredNodeMax, recommended: v11.x or v12.x)"

    try {
        $nodeVerRaw = & node --version 2>$null
        if ($LASTEXITCODE -ne 0) { throw "node not found" }

        $nodeVer = $nodeVerRaw -replace '^v', ''

        if (Compare-SemVer $nodeVer $RequiredNodeMax) {
            Write-Ok "Node.js v$nodeVer (within required range)"
        } else {
            Write-Fail "Node.js v$nodeVer is TOO NEW (max: v$RequiredNodeMax)"
            Write-Info "This project uses webpack 4 + legacy Babel plugins incompatible with Node > 12"
            Write-Info ""
            Write-Info "Fix with nvm-windows:"
            Write-Info "  1. Install nvm-windows: https://github.com/coreybutler/nvm-windows/releases"
            Write-Info "  2. nvm install $RequiredNodeMax"
            Write-Info "  3. nvm use $RequiredNodeMax"
            Write-Info ""
            Write-Info "Fix with Docker:"
            Write-Info "  docker run -it --rm -v `"$($pwd.Path):/app`" -w /app node:$RequiredNodeMax-alpine sh"
            Write-Info ""
            Write-Info "Known issues with newer Node versions:"
            Write-Info "  - Node 14+: webpack 4 compilation errors with OpenSSL changes"
            Write-Info "  - Node 16+: ERR_OSSL_EVP_UNSUPPORTED (OpenSSL 3.0 incompatibility)"
            Write-Info "  - Node 17+: --openssl-legacy-provider workaround may partially help"
            Write-Info "    but other deprecated APIs will still break the build"
            Write-Info "  - Node 18+: Multiple broken native module builds"
        }
    } catch {
        Write-Fail "Node.js is NOT installed"
        Write-Info "Install Node.js v$RequiredNodeMax using nvm-windows:"
        Write-Info "  1. Download from: https://github.com/coreybutler/nvm-windows/releases"
        Write-Info "  2. nvm install $RequiredNodeMax"
        Write-Info "  3. nvm use $RequiredNodeMax"
    }
}

# =============================================================================
# CHECK: npm
# =============================================================================
function Test-Npm {
    Write-Section "npm (required: <= v$RequiredNpmMax)"

    try {
        $npmVer = & npm --version 2>$null
        if ($LASTEXITCODE -ne 0) { throw "npm not found" }

        if (Compare-SemVer $npmVer $RequiredNpmMax) {
            Write-Ok "npm v$npmVer (within required range)"
        } else {
            Write-Fail "npm v$npmVer is TOO NEW (max: v$RequiredNpmMax)"
            Write-Info "npm 7+ changed dependency resolution (auto-installs peer deps)"
            Write-Info "causing conflicts with this project's legacy dependency tree"
            Write-Info ""
            Write-Info "Fix: use nvm-windows to switch to Node v$RequiredNodeMax (comes with npm 6)"
            Write-Info "  nvm install $RequiredNodeMax"
            Write-Info "  nvm use $RequiredNodeMax"
        }
    } catch {
        Write-Fail "npm is NOT installed (should come with Node.js)"
    }
}

# =============================================================================
# CHECK: nvm-windows (optional)
# =============================================================================
function Test-Nvm {
    Write-Section "nvm-windows (optional, recommended for managing Node versions)"

    try {
        $nvmVer = & nvm version 2>$null
        if ($LASTEXITCODE -eq 0 -and $nvmVer) {
            Write-Ok "nvm-windows is available ($nvmVer)"

            $nvmList = & nvm list 2>$null
            if ($nvmList -match $RequiredNodeMax) {
                Write-Ok "Node v$RequiredNodeMax is installed in nvm"
                Write-Info "Activate it with: nvm use $RequiredNodeMax"
            } else {
                Write-Warn "Node v$RequiredNodeMax not installed in nvm"
                Write-Info "Install it: nvm install $RequiredNodeMax"
            }
        } else {
            throw "nvm not found"
        }
    } catch {
        Write-Info "nvm-windows not found - recommended for managing Node versions"
        Write-Info "Install from: https://github.com/coreybutler/nvm-windows/releases"
    }
}

# =============================================================================
# CHECK: Build tools (Visual Studio Build Tools for node-gyp)
# =============================================================================
function Test-BuildTools {
    Write-Section "Build tools (for native npm modules)"

    # Check for windows-build-tools / Visual Studio
    $vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (Test-Path $vsWhere) {
        Write-Ok "Visual Studio detected (vswhere found)"
    } else {
        # Check for standalone build tools
        try {
            $null = & npm config get msvs_version 2>$null
            Write-Info "If native modules fail, install Windows Build Tools:"
            Write-Info "  npm install --global windows-build-tools"
            Write-Info "  (run PowerShell as Administrator)"
        } catch {
            Write-Warn "Visual Studio Build Tools not detected"
            Write-Info "Some native npm modules may fail to compile"
            Write-Info "Fix: npm install --global windows-build-tools (as Administrator)"
        }
    }

    # Check Python (needed by node-gyp)
    try {
        $pyVer = & python --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "Python found: $pyVer (needed by node-gyp)"
        } else {
            throw "python not found"
        }
    } catch {
        try {
            $py3Ver = & python3 --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Ok "Python3 found: $py3Ver"
            } else {
                throw "python3 not found"
            }
        } catch {
            Write-Warn "Python not found - node-gyp requires Python for native modules"
            Write-Info "Install Python from: https://www.python.org/downloads/"
        }
    }
}

# =============================================================================
# CHECK: Project files
# =============================================================================
function Test-ProjectFiles {
    Write-Section "Project files"

    if (Test-Path "package.json") {
        Write-Ok "package.json found"
    } else {
        Write-Fail "package.json NOT found - are you in the project root directory?"
        Write-Info "Run this script from the moonrider project root"
    }

    if (Test-Path "webpack.config.js") {
        Write-Ok "webpack.config.js found"
    } else {
        Write-Fail "webpack.config.js NOT found"
    }

    if (Test-Path "src\index.js") {
        Write-Ok "src\index.js entry point found"
    } else {
        Write-Fail "src\index.js NOT found"
    }
}

# =============================================================================
# CHECK: node_modules
# =============================================================================
function Test-NodeModules {
    Write-Section "Dependencies (node_modules)"

    if (Test-Path "node_modules") {
        Write-Ok "node_modules directory exists"
    } else {
        Write-Info "node_modules not found - run 'npm install' first"
    }
}

# =============================================================================
# CHECK: Disk space
# =============================================================================
function Test-DiskSpace {
    Write-Section "Disk space"
    $drive = (Get-Location).Drive
    $freeSpace = (Get-PSDrive $drive.Name).Free
    $freeMB = [math]::Round($freeSpace / 1MB)

    if ($freeMB -gt 1024) {
        Write-Ok "${freeMB}MB available (need ~500MB for build)"
    } elseif ($freeMB -gt 500) {
        Write-Warn "${freeMB}MB available - may be tight for build"
    } else {
        Write-Fail "Only ${freeMB}MB available - need at least 500MB"
    }
}

# =============================================================================
# BUILD
# =============================================================================
function Invoke-Build {
    Write-Section "Build"

    if ($Errors.Count -gt 0) {
        Write-Host ""
        Write-Host "Cannot proceed with build - critical errors found:" -ForegroundColor Red
        foreach ($err in $Errors) {
            Write-Host "  * $err" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "Fix the above errors and re-run this script." -ForegroundColor Yellow
        return $false
    }

    if ($Warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "Warnings found (build may still work):" -ForegroundColor Yellow
        foreach ($w in $Warnings) {
            Write-Host "  * $w" -ForegroundColor Yellow
        }
        Write-Host ""
    }

    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Info "Installing dependencies..."
        try {
            & npm install 2>&1
            if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
            Write-Ok "Dependencies installed"
        } catch {
            Write-Fail "npm install failed"
            Write-Info "If you see ERESOLVE errors, your npm version is too new (needs <= 6)"
            Write-Info "If you see node-gyp errors, you may need build tools"
            return $false
        }
    } else {
        Write-Ok "Dependencies already installed"
    }

    # Run production build
    Write-Info "Running production build..."
    Write-Host ""

    $env:NODE_ENV = "production"
    try {
        & npm run build 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Build failed" }

        Write-Host ""
        Write-Ok "Build completed successfully!"
        Write-Host ""
        Write-Host "Output files:" -ForegroundColor Green
        if (Test-Path "build\build.js") {
            $size = (Get-Item "build\build.js").Length / 1MB
            Write-Host "  build\build.js ($([math]::Round($size, 2))MB)"
        }
        if (Test-Path "build\zip.js") {
            $size = (Get-Item "build\zip.js").Length / 1KB
            Write-Host "  build\zip.js ($([math]::Round($size, 2))KB)"
        }
        return $true
    } catch {
        Write-Host ""
        Write-Fail "Build failed!"
        Write-Info ""
        Write-Info "Common causes:"
        Write-Info "  1. Wrong Node.js version (must be <= v$RequiredNodeMax)"
        Write-Info "  2. Corrupted node_modules - try: Remove-Item -Recurse node_modules; npm install"
        Write-Info "  3. OpenSSL errors (Node 17+) - downgrade Node instead of using --openssl-legacy-provider"
        return $false
    }
}

# =============================================================================
# SUMMARY
# =============================================================================
function Write-Summary {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "  Summary" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan

    if ($Errors.Count -eq 0 -and $Warnings.Count -eq 0) {
        Write-Host "  All checks passed!" -ForegroundColor Green
    }

    if ($Warnings.Count -gt 0) {
        Write-Host "  Warnings: $($Warnings.Count)" -ForegroundColor Yellow
        foreach ($w in $Warnings) {
            Write-Host "    - $w" -ForegroundColor Yellow
        }
    }

    if ($Errors.Count -gt 0) {
        Write-Host "  Errors: $($Errors.Count)" -ForegroundColor Red
        foreach ($err in $Errors) {
            Write-Host "    - $err" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "  BUILD BLOCKED - fix errors above first" -ForegroundColor Red
    }
    Write-Host ""
}

# =============================================================================
# MAIN
# =============================================================================
Write-Header

Test-OperatingSystem
Test-Git
Test-Node
Test-Npm
Test-Nvm
Test-BuildTools
Test-ProjectFiles
Test-NodeModules
Test-DiskSpace

Write-Summary

if ($CheckOnly) {
    Write-Info "Check-only mode - skipping build"
    if ($Errors.Count -eq 0) { exit 0 } else { exit 1 }
}

$buildResult = Invoke-Build
if ($buildResult) { exit 0 } else { exit 1 }

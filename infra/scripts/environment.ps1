# Shared helpers only. Dot-sourcing this file does not install, start or write anything.

function Get-CarbonLensPaths {
    $root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..')).TrimEnd('\')
    if (-not (Test-Path -LiteralPath (Join-Path $root 'AGENTS.md') -PathType Leaf) -or
        -not (Test-Path -LiteralPath (Join-Path $root 'apps\carbonlens_flutter\pubspec.yaml') -PathType Leaf)) {
        throw 'Run these scripts from a complete CarbonLens checkout.'
    }
    $flutterRoot = Join-Path $root '.tools\flutter'
    $archiveSdk = Join-Path $root '.tools\flutter-sdk\flutter'
    if (-not (Test-Path -LiteralPath (Join-Path $flutterRoot 'bin\flutter.bat')) -and
        (Test-Path -LiteralPath (Join-Path $archiveSdk 'bin\flutter.bat'))) {
        $flutterRoot = Assert-CarbonLensPath $archiveSdk $root
    }
    return @{
        Root = $root
        Tools = (Join-Path $root '.tools')
        Flutter = $flutterRoot
        FlutterCommand = (Join-Path $flutterRoot 'bin\flutter.bat')
        DartCommand = (Join-Path $flutterRoot 'bin\dart.bat')
        Android = (Join-Path $root '.tools\android-sdk')
        App = (Join-Path $root 'apps\carbonlens_flutter')
        State = (Join-Path $root '.tools\state')
    }
}

function Assert-CarbonLensPath([string]$Path, [string]$Root) {
    $resolved = [IO.Path]::GetFullPath($Path)
    if (-not $resolved.StartsWith($Root.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw 'A setup target escaped the project checkout.'
    }
    # Refuse a junction/symlink within the checkout before writing through it.
    $probe = $resolved
    while ($probe.StartsWith($Root.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
        if (Test-Path -LiteralPath $probe) {
            $item = Get-Item -LiteralPath $probe -Force
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                throw 'Setup does not write through a symlink/junction. Review that target.'
            }
        }
        $parent = [IO.Path]::GetDirectoryName($probe)
        if ($parent -eq $probe -or -not $parent) { break }
        $probe = $parent
    }
    return $resolved
}

function Invoke-CarbonLensTool([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw 'A development tool failed. Review the output before continuing.' }
}

function Get-CarbonLensConfig([hashtable]$Paths) {
    $config = Get-Content -Raw -LiteralPath (Join-Path $Paths.Root 'dev-environment.json') | ConvertFrom-Json
    if ($config.schemaVersion -ne 1 -or $config.flutter.version -notmatch '^\d+\.\d+\.\d+$' -or
        $config.flutter.revision -notmatch '^[a-f0-9]{40}$' -or
        $config.flutter.source -ne 'https://github.com/flutter/flutter.git') {
        throw 'The reviewed development environment definition is invalid.'
    }
    if ($config.web.host -ne '127.0.0.1' -or $config.web.port -lt 1 -or $config.web.port -gt 65535 -or
        $config.initialManifestSha256 -notmatch '^[a-f0-9]{64}$' -or
        $config.android.buildTools -notmatch '^\d+\.\d+\.\d+$' -or
        $config.android.ndk -notmatch '^\d+\.\d+\.\d+$' -or
        $config.android.compileSdk -lt 24) {
        throw 'Review the loopback preview, manifest hash and Android version settings.'
    }
    return $config
}

function Invoke-InCarbonLensEnvironment([hashtable]$Paths, [scriptblock]$Action) {
    $overrides = @{
        PUB_CACHE = (Join-Path $Paths.Tools 'pub-cache')
        GRADLE_USER_HOME = (Join-Path $Paths.Tools 'gradle')
        ANDROID_HOME = $Paths.Android
        ANDROID_SDK_ROOT = $Paths.Android
        ANDROID_USER_HOME = (Join-Path $Paths.State 'android')
        ANDROID_AVD_HOME = (Join-Path $Paths.State 'avd')
        APPDATA = (Join-Path $Paths.State 'appdata')
        LOCALAPPDATA = (Join-Path $Paths.State 'localappdata')
        TEMP = (Join-Path $Paths.State 'temp')
        TMP = (Join-Path $Paths.State 'temp')
        FLUTTER_SUPPRESS_ANALYTICS = 'true'
        GIT_TERMINAL_PROMPT = '0'
    }
    $saved = @{}
    $originalLocation = Get-Location
    try {
        foreach ($name in $overrides.Keys) {
            $saved[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
            if ($name -notin @('FLUTTER_SUPPRESS_ANALYTICS', 'GIT_TERMINAL_PROMPT')) {
                $target = Assert-CarbonLensPath $overrides[$name] $Paths.Root
                $null = New-Item -ItemType Directory -Path $target -Force
            }
            [Environment]::SetEnvironmentVariable($name, $overrides[$name], 'Process')
        }
        Set-Location -LiteralPath $Paths.Root
        & $Action
    }
    finally {
        Set-Location -LiteralPath $originalLocation.Path
        foreach ($name in $saved.Keys) {
            [Environment]::SetEnvironmentVariable($name, $saved[$name], 'Process')
        }
    }
}

function Assert-CarbonLensSdk([hashtable]$Paths, $Config) {
    if (-not (Test-Path -LiteralPath $Paths.FlutterCommand -PathType Leaf)) {
        throw 'Project-local Flutter SDK is missing. Approve and run InstallSdk first.'
    }
    $revision = & git -C $Paths.Flutter rev-parse HEAD
    if ($LASTEXITCODE -ne 0 -or $revision.Trim() -ne $Config.flutter.revision) {
        throw 'Flutter SDK does not match dev-environment.json. No automatic upgrade/reset is performed.'
    }
}

function Get-CarbonLensAuthArguments([hashtable]$Paths,
    [ValidateSet('demo', 'firebase')][string]$AuthMode = 'demo') {
    if ($AuthMode -eq 'demo') {
        return @('--dart-define=AUTH_MODE=demo')
    }
    $privateConfig = Assert-CarbonLensPath (Join-Path $Paths.App 'config\firebase.local.json') $Paths.Root
    if (-not (Test-Path -LiteralPath $privateConfig -PathType Leaf)) {
        throw 'Firebase mode requires apps/carbonlens_flutter/config/firebase.local.json. Fill it privately using firebase.example.json; do not paste credentials into logs or chat.'
    }
    # Pass the file directly to Flutter without reading or printing its values.
    # The explicit mode wins over an accidental AUTH_MODE entry in that file.
    return @("--dart-define-from-file=$privateConfig", '--dart-define=AUTH_MODE=firebase')
}

function Get-CarbonLensTextHash([string]$Path) {
    $text = (Get-Content -Raw -LiteralPath $Path).Replace("`r`n", "`n").TrimEnd() + "`n"
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
        $hash = $sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($text))
        return (($hash | ForEach-Object { $_.ToString('x2') }) -join '')
    }
    finally { $sha.Dispose() }
}

function Initialize-CarbonLensManifest([hashtable]$Paths, $Config) {
    $active = Join-Path $Paths.App 'pubspec.yaml'
    if ((Get-CarbonLensTextHash $active) -eq $Config.initialManifestSha256) {
        $backup = Assert-CarbonLensPath (Join-Path $Paths.App 'pubspec.scaffold.yaml') $Paths.Root
        if (-not (Test-Path -LiteralPath $backup)) {
            Copy-Item -LiteralPath $active -Destination $backup
        }
        Copy-Item -LiteralPath (Join-Path $Paths.App 'pubspec.proposed.yaml') -Destination $active
        return
    }
    $text = Get-Content -Raw -LiteralPath $active
    foreach ($dependency in @('flutter', 'firebase_core', 'firebase_auth', 'firebase_app_check', 'google_sign_in')) {
        if ($text -notmatch ("(?m)^  " + [regex]::Escape($dependency) + ":")) {
            throw 'The active manifest has other edits. Review it rather than overwriting it.'
        }
    }
    # Existing application manifests are preserved, including future reviewed changes.
}

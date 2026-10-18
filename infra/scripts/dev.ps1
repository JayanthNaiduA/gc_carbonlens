[CmdletBinding()]
param(
    [ValidateSet('Inspect', 'InstallSdk', 'PrepareApp', 'Check', 'RunWeb', 'RunPhone', 'BuildApk')]
    [string]$Task = 'Inspect',
    [ValidateSet('demo', 'firebase')]
    [string]$AuthMode = 'demo',
    [switch]$Approved,
    [string]$DeviceId
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'environment.ps1')
$paths = Get-CarbonLensPaths
$config = Get-CarbonLensConfig $paths

if ($Task -eq 'Inspect') {
    Write-Output ('Configured Flutter: ' + $config.flutter.version + '; default profile: web')
    Write-Output ('Local Flutter SDK present: ' + (Test-Path -LiteralPath $paths.FlutterCommand))
    Write-Output ('Dependency lockfile present: ' + (Test-Path -LiteralPath (Join-Path $paths.App 'pubspec.lock')))
    Write-Output ('Private Firebase config present: ' + (Test-Path -LiteralPath (Join-Path $paths.App 'config\firebase.local.json')))
    Write-Output 'Inspect is read-only. No downloads, installation, account access or services.'
    return
}
if (-not $Approved) {
    throw 'Review docs/development.md and obtain the AGENTS.md approval before this action. Nothing was started.'
}
if ($env:OS -ne 'Windows_NT' -or -not [Environment]::Is64BitProcess) {
    throw 'These automation scripts target 64-bit Windows. See CONTRIBUTING.md for other platforms.'
}
if ($Task -eq 'RunPhone' -and
    ([string]::IsNullOrWhiteSpace($DeviceId) -or $DeviceId -notmatch '^[A-Za-z0-9._:-]+$')) {
    throw 'RunPhone needs an explicit connected Android device ID. No device is selected automatically.'
}

$authArguments = @()
if ($Task -in @('RunWeb', 'RunPhone', 'BuildApk')) {
    $authArguments = @(Get-CarbonLensAuthArguments $paths $AuthMode)
}
if ($AuthMode -eq 'firebase' -and $Task -in @('RunPhone', 'BuildApk')) {
    & (Join-Path $PSScriptRoot 'check-firebase.ps1')
    if ($LASTEXITCODE -ne 0) { throw 'Firebase debug configuration checks failed. No build or device was started.' }
}

Invoke-InCarbonLensEnvironment $paths {
    if ($Task -eq 'InstallSdk') {
        $null = Get-Command git -ErrorAction Stop
        $flutterTarget = Assert-CarbonLensPath $paths.Flutter $paths.Root
        if (-not (Test-Path -LiteralPath $paths.FlutterCommand)) {
            if (Test-Path -LiteralPath $flutterTarget) {
                throw 'An incomplete SDK target exists. Review it; do not overwrite/delete it.'
            }
            Invoke-CarbonLensTool 'git' @('clone', '--branch', $config.flutter.version, '--depth', '1',
                $config.flutter.source, $flutterTarget)
        }
        Assert-CarbonLensSdk $paths $config
        Invoke-CarbonLensTool $paths.FlutterCommand @('precache', '--web', '--no-android')
        $ready = Assert-CarbonLensPath (Join-Path $paths.State 'sdk-ready.json') $paths.Root
        $record = @{ flutter = $config.flutter.version; revision = $config.flutter.revision; webCache = $true } | ConvertTo-Json
        [IO.File]::WriteAllText($ready, $record)
        Write-Output 'Pinned Flutter/web SDK prepared locally. No Android SDK, emulator or Firebase CLI installed.'
        return
    }

    Assert-CarbonLensSdk $paths $config
    Set-Location -LiteralPath $paths.App
    if ($Task -eq 'PrepareApp') {
        Initialize-CarbonLensManifest $paths $config
        if (Test-Path -LiteralPath 'pubspec.lock') {
            Invoke-CarbonLensTool $paths.FlutterCommand @('pub', 'get', '--enforce-lockfile')
        } else {
            Invoke-CarbonLensTool $paths.FlutterCommand @('pub', 'get')
            Write-Output 'First dependency lockfile created. Review and commit it with the active manifest.'
        }
        Invoke-CarbonLensTool $paths.DartCommand @('format', 'lib', 'test')
        Write-Output 'Packages restored and Dart source formatted. Run Check next; no preview started.'
        return
    }
    if (-not (Test-Path -LiteralPath '.dart_tool\package_config.json') -or
        -not (Test-Path -LiteralPath 'pubspec.lock')) {
        throw 'Dependencies are not ready. Approve and run PrepareApp first.'
    }
    if ($Task -eq 'Check') {
        Invoke-CarbonLensTool $paths.DartCommand @('format', '--output=none', '--set-exit-if-changed', 'lib', 'test')
        Invoke-CarbonLensTool $paths.FlutterCommand @('analyze', '--no-pub')
        Invoke-CarbonLensTool $paths.FlutterCommand @('test', '--no-pub', '--concurrency=1')
        Write-Output 'Formatting, analyzer and serial tests passed. These checks do not verify real Firebase login.'
        return
    }
    if ($Task -eq 'RunWeb') {
        Write-Output ('Starting foreground ' + $AuthMode + ' mode at http://' + $config.web.host + ':' + $config.web.port + '. Open it in Edge/Chrome; q or Ctrl+C stops it.')
        Invoke-CarbonLensTool $paths.FlutterCommand (@('run', '-d', 'web-server', '--debug', '--no-pub',
            "--web-hostname=$($config.web.host)", "--web-port=$($config.web.port)") + $authArguments)
        return
    }
    if (-not (Test-Path -LiteralPath (Join-Path $paths.App 'android\app\build.gradle.kts'))) {
        throw 'Android platform setup is missing. See docs/development.md for the optional phone setup.'
    }
    if ($Task -eq 'RunPhone') {
        Write-Output ('Running ' + $AuthMode + ' mode on the explicitly selected Android device. No emulator is launched.')
        Invoke-CarbonLensTool $paths.FlutterCommand (@('run', '-d', $DeviceId, '--debug', '--no-pub') + $authArguments)
        return
    }
    if ($Task -eq 'BuildApk') {
        Invoke-CarbonLensTool $paths.FlutterCommand (@('build', 'apk', '--debug', '--no-pub') + $authArguments)
        Write-Output ('Debug ' + $AuthMode + ' APK: apps/carbonlens_flutter/build/app/outputs/flutter-apk/app-debug.apk')
        if ($AuthMode -eq 'demo') {
            Write-Output 'The APK is a local UI demo, not verified production Firebase authentication.'
        } else {
            Write-Output 'Firebase mode is configured; real sign-in and App Check still require integration verification.'
        }
    }
}

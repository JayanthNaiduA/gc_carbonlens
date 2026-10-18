[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('InstallTools', 'PrepareApp', 'LaunchDemo')]
    [string]$Phase,
    [switch]$Approved,
    [switch]$SkipEmulator,
    [ValidatePattern('^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$')]
    [string]$Organization = 'com.example'
)

$ErrorActionPreference = 'Stop'
if (-not $Approved) {
    throw 'Approval is required. Review docs/android_setup.md and AGENTS.md before running this script.'
}

. (Join-Path $PSScriptRoot 'environment.ps1')
$carbonLensPaths = Get-CarbonLensPaths
$carbonLensEnvironment = Get-CarbonLensConfig $carbonLensPaths
$carbonLensRoot = $carbonLensPaths.Root
function Assert-ProjectPath([string]$Path) {
    return Assert-CarbonLensPath $Path $carbonLensRoot
}
function Invoke-Checked([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Tool failed during $Phase. Stop and review its output." }
}

$carbonLensTools = Assert-ProjectPath (Join-Path $carbonLensRoot '.tools')
$carbonLensFlutter = Assert-ProjectPath $carbonLensPaths.Flutter
$carbonLensSdk = Assert-ProjectPath (Join-Path $carbonLensTools 'android-sdk')
$carbonLensState = Assert-ProjectPath (Join-Path $carbonLensTools 'state')
$carbonLensApp = Assert-ProjectPath (Join-Path $carbonLensRoot 'apps\carbonlens_flutter')
$carbonLensFlutterCommand = Join-Path $carbonLensFlutter 'bin\flutter.bat'
$carbonLensSdkManager = Join-Path $carbonLensSdk 'cmdline-tools\latest\bin\sdkmanager.bat'
$carbonLensAvdManager = Join-Path $carbonLensSdk 'cmdline-tools\latest\bin\avdmanager.bat'
$carbonLensImage = 'system-images;android-36;google_apis_playstore;x86_64'

$carbonLensOverrides = @{
    PUB_CACHE = (Join-Path $carbonLensTools 'pub-cache')
    GRADLE_USER_HOME = (Join-Path $carbonLensTools 'gradle')
    ANDROID_HOME = $carbonLensSdk
    ANDROID_SDK_ROOT = $carbonLensSdk
    ANDROID_USER_HOME = (Join-Path $carbonLensState 'android')
    ANDROID_AVD_HOME = (Join-Path $carbonLensState 'avd')
    APPDATA = (Join-Path $carbonLensState 'appdata')
    LOCALAPPDATA = (Join-Path $carbonLensState 'localappdata')
    TEMP = (Join-Path $carbonLensState 'temp')
    TMP = (Join-Path $carbonLensState 'temp')
    FLUTTER_SUPPRESS_ANALYTICS = 'true'
    GIT_TERMINAL_PROMPT = '0'
}
$carbonLensOriginalEnvironment = @{}
$carbonLensOriginalLocation = Get-Location

try {
    foreach ($name in $carbonLensOverrides.Keys) {
        $carbonLensOriginalEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
        if ($name -notin @('FLUTTER_SUPPRESS_ANALYTICS', 'GIT_TERMINAL_PROMPT')) {
            $null = New-Item -ItemType Directory -Path (Assert-ProjectPath $carbonLensOverrides[$name]) -Force
        }
        [Environment]::SetEnvironmentVariable($name, $carbonLensOverrides[$name], 'Process')
    }
    Set-Location -LiteralPath $carbonLensRoot

    if ($Phase -eq 'InstallTools') {
        if (-not [Environment]::Is64BitOperatingSystem) {
            throw 'This reviewed system image is for x64 Windows. Select another image before downloading.'
        }
        $null = Get-Command git -ErrorAction Stop
        $null = Get-Command java -ErrorAction Stop
        & (Join-Path $PSScriptRoot 'dev.ps1') -Task InstallSdk -Approved
        Assert-CarbonLensSdk $carbonLensPaths $carbonLensEnvironment

        if (-not (Test-Path -LiteralPath $carbonLensSdkManager)) {
            $downloadDir = Assert-ProjectPath (Join-Path $carbonLensTools 'downloads')
            $null = New-Item -ItemType Directory -Path $downloadDir -Force
            $zip = Assert-ProjectPath (Join-Path $downloadDir 'android-commandline-tools.zip')
            $extract = Assert-ProjectPath (Join-Path $downloadDir 'android-commandline-tools')
            $toolsTarget = Assert-ProjectPath (Join-Path $carbonLensSdk 'cmdline-tools\latest')
            if ((Test-Path -LiteralPath $zip) -or (Test-Path -LiteralPath $extract) -or
                (Test-Path -LiteralPath $toolsTarget)) {
                throw 'A download/install target already exists. Review it before retrying; no overwrite is performed.'
            }
            Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip' -OutFile $zip
            $expectedHash = '90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a'
            if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedHash) {
                throw 'Android tools checksum mismatch. No extraction or installation performed.'
            }
            Expand-Archive -LiteralPath $zip -DestinationPath $extract
            $null = New-Item -ItemType Directory -Path (Assert-ProjectPath (Join-Path $carbonLensSdk 'cmdline-tools')) -Force
            Copy-Item -LiteralPath (Assert-ProjectPath (Join-Path $extract 'cmdline-tools')) -Destination $toolsTarget -Recurse
        }

        # Present license terms interactively. Do not automatically answer yes.
        Invoke-Checked $carbonLensSdkManager @("--sdk_root=$carbonLensSdk", '--licenses')
        $sdkPackages = @('platform-tools',
            "platforms;android-$($carbonLensEnvironment.android.compileSdk)",
            "build-tools;$($carbonLensEnvironment.android.buildTools)",
            "ndk;$($carbonLensEnvironment.android.ndk)")
        if (-not $SkipEmulator) { $sdkPackages += @('emulator', $carbonLensImage) }
        Invoke-Checked $carbonLensSdkManager (@("--sdk_root=$carbonLensSdk") + $sdkPackages)
        if (-not $SkipEmulator) {
            $existing = & $carbonLensAvdManager list avd -c
            if ($LASTEXITCODE -ne 0) { throw 'Could not list project-local AVDs.' }
            if ($existing -notcontains 'carbonlens_demo') {
                # "no" declines only custom hardware configuration, not license terms.
                'no' | & $carbonLensAvdManager create avd -n carbonlens_demo -k $carbonLensImage
                if ($LASTEXITCODE -ne 0) { throw 'Could not create the project-local AVD.' }
            }
        }
        Write-Output 'Tools installed locally. Review package identity before PrepareApp.'
    }

    if ($Phase -eq 'PrepareApp') {
        Assert-CarbonLensSdk $carbonLensPaths $carbonLensEnvironment
        $nativeTarget = Assert-ProjectPath (Join-Path $carbonLensApp 'android')
        if (-not (Test-Path -LiteralPath (Join-Path $nativeTarget 'app\build.gradle.kts'))) {
            $template = Assert-ProjectPath (Join-Path $carbonLensTools 'android-template')
            if (Test-Path -LiteralPath $template) { throw 'Template target exists. Review it before retrying.' }
            Invoke-Checked $carbonLensFlutterCommand @('create', '--platforms=android', '--project-name=carbonlens_flutter',
                "--org=$Organization", '--no-pub', $template)
            foreach ($item in Get-ChildItem -LiteralPath (Join-Path $template 'android') -Force) {
                $destination = Assert-ProjectPath (Join-Path $nativeTarget $item.Name)
                if (Test-Path -LiteralPath $destination) { throw 'A native Android target already exists. No overwrite performed.' }
                Copy-Item -LiteralPath $item.FullName -Destination $destination -Recurse
            }
            $gradle = Assert-ProjectPath (Join-Path $nativeTarget 'app\build.gradle.kts')
            $gradleText = Get-Content -Raw -LiteralPath $gradle
            if ($gradleText -notmatch 'minSdk = flutter.minSdkVersion') { throw 'Unexpected Flutter Android template. Review minSdk manually.' }
            [IO.File]::WriteAllText($gradle, $gradleText.Replace('minSdk = flutter.minSdkVersion', 'minSdk = 24'))
            $manifest = Assert-ProjectPath (Join-Path $nativeTarget 'app\src\main\AndroidManifest.xml')
            [xml]$manifestXml = Get-Content -Raw -LiteralPath $manifest
            $permission = $manifestXml.CreateElement('uses-permission')
            $null = $permission.SetAttribute('name', 'http://schemas.android.com/apk/res/android', 'android.permission.INTERNET')
            $null = $manifestXml.manifest.PrependChild($permission)
            $manifestXml.Save($manifest)
            # Apply memory limits only to this newly generated native template.
            Copy-Item -LiteralPath (Join-Path $carbonLensRoot 'infra\android\gradle.properties') -Destination (Assert-ProjectPath (Join-Path $nativeTarget 'gradle.properties'))
        }

        Set-Location -LiteralPath $carbonLensApp
        Initialize-CarbonLensManifest $carbonLensPaths $carbonLensEnvironment
        if (Test-Path -LiteralPath 'pubspec.lock') {
            Invoke-Checked $carbonLensFlutterCommand @('pub', 'get', '--enforce-lockfile')
        } else {
            Invoke-Checked $carbonLensFlutterCommand @('pub', 'get')
        }
        Invoke-Checked (Join-Path $carbonLensFlutter 'bin\dart.bat') @('format', 'lib', 'test')
        Invoke-Checked $carbonLensFlutterCommand @('analyze', '--no-pub')
        Invoke-Checked $carbonLensFlutterCommand @('test', '--no-pub', '--concurrency=1')
        Write-Output 'Android source, packages, analysis and tests prepared. No emulator launched.'
    }

    if ($Phase -eq 'LaunchDemo') {
        $emulator = Assert-ProjectPath (Join-Path $carbonLensSdk 'emulator\emulator.exe')
        if (-not (Test-Path -LiteralPath $emulator)) { throw 'Android emulator is missing.' }
        Invoke-Checked $emulator @('-accel-check')
        Write-Output 'Starting visible Android emulator: 2048 MB, 2 cores, ports 5554/5555; ADB 5037; Flutter VM 8181.'
        # The user specifically requested an interactive Android emulator.
        $null = Start-Process -FilePath $emulator -ArgumentList @('-avd', 'carbonlens_demo',
            '-port', '5554', '-memory', '2048', '-cores', '2', '-no-snapshot-save') -WindowStyle Normal -PassThru
        Set-Location -LiteralPath $carbonLensApp
        Invoke-Checked (Join-Path $carbonLensSdk 'platform-tools\adb.exe') @('-s', 'emulator-5554', 'wait-for-device')
        Invoke-Checked $carbonLensFlutterCommand @('run', '-d', 'emulator-5554',
            '--vm-service-port=8181', '--dart-define=AUTH_MODE=demo')
    }
}
finally {
    Set-Location -LiteralPath $carbonLensOriginalLocation.Path
    foreach ($name in $carbonLensOriginalEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($name, $carbonLensOriginalEnvironment[$name], 'Process')
    }
}

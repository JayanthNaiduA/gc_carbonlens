# Read-only debug-variant checks. Never print client configuration values or credentials.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'environment.ps1')
$paths = Get-CarbonLensPaths
$dartPath = Assert-CarbonLensPath (Join-Path $paths.App 'config\firebase.local.json') $paths.Root
$nativePath = Assert-CarbonLensPath (Join-Path $paths.App 'android\app\src\debug\google-services.json') $paths.Root
if (-not (Test-Path -LiteralPath $nativePath -PathType Leaf)) {
    $nativePath = Assert-CarbonLensPath (Join-Path $paths.App 'android\app\google-services.json') $paths.Root
}
if (-not (Test-Path -LiteralPath $dartPath -PathType Leaf) -or
    -not (Test-Path -LiteralPath $nativePath -PathType Leaf)) {
    Write-Output 'FAIL: Native and Dart Firebase config files are both required. See docs/firebase-signin-setup.md.'
    exit 1
}
try {
    $dart = Get-Content -Raw -LiteralPath $dartPath | ConvertFrom-Json
    $native = Get-Content -Raw -LiteralPath $nativePath | ConvertFrom-Json
} catch {
    Write-Output 'FAIL: A Firebase config file is not valid JSON. Values are withheld.'
    exit 1
}
$clients = @($native.client | Where-Object {
    $_.client_info.android_client_info.package_name -eq 'com.example.carbonlens_flutter'
})
$client = if ($clients.Count -eq 1) { $clients[0] } else { $null }
$webClients = @($client.oauth_client | Where-Object { $_.client_type -eq 3 })
$apiUri = $null
$validUri = [Uri]::TryCreate([string]$dart.API_BASE_URL, [UriKind]::Absolute, [ref]$apiUri)
$backendConfigured = -not [string]::IsNullOrEmpty([string]$dart.API_BASE_URL)
$checks = @(
    @{ Name = 'Android package matches com.example.carbonlens_flutter'; Pass = ($clients.Count -eq 1) }
    @{ Name = 'Firebase project agrees across native and Dart config'; Pass = (
        -not [string]::IsNullOrWhiteSpace($dart.FIREBASE_PROJECT_ID) -and
        $dart.FIREBASE_PROJECT_ID -eq $native.project_info.project_id) }
    @{ Name = 'Android Firebase app ID matches'; Pass = ($client -and
        $dart.FIREBASE_APP_ID -eq $client.client_info.mobilesdk_app_id) }
    @{ Name = 'Firebase project number matches'; Pass = (
        -not [string]::IsNullOrWhiteSpace($dart.FIREBASE_MESSAGING_SENDER_ID) -and
        [string]$dart.FIREBASE_MESSAGING_SENDER_ID -eq [string]$native.project_info.project_number) }
    @{ Name = 'Firebase client API key matches'; Pass = ($client -and
        -not [string]::IsNullOrWhiteSpace($dart.FIREBASE_API_KEY) -and
        $dart.FIREBASE_API_KEY -in @($client.api_key.current_key)) }
    @{ Name = 'Web OAuth client ID is present in Android config'; Pass = (
        -not [string]::IsNullOrWhiteSpace($dart.GOOGLE_SERVER_CLIENT_ID) -and
        $dart.GOOGLE_SERVER_CLIENT_ID -in @($webClients.client_id)) }
    @{ Name = 'Real Firebase mode does not enable the Auth emulator'; Pass = (
        [string]$dart.USE_AUTH_EMULATOR -ne 'true') }
)
if ($backendConfigured) {
    $checks += @{ Name = 'Profile backend uses a valid HTTPS URL'; Pass = ($validUri -and
        $apiUri.Scheme -eq 'https' -and $apiUri.Host -and -not $apiUri.UserInfo -and
        -not $apiUri.Query -and -not $apiUri.Fragment) }
}
$failed = $false
foreach ($check in $checks) {
    $label = if ($check.Pass) { 'PASS' } else { $failed = $true; 'FAIL' }
    Write-Output ($label + ': ' + $check.Name)
}
if (-not $backendConfigured) {
    Write-Output 'WARN: API_BASE_URL is empty. Firebase sign-in can be tested; profile enrollment/persistence needs a deployed HTTPS backend.'
}
Write-Output 'These local checks do not verify Console providers, SHA fingerprints, App Check or backend reachability.'
if ($failed) {
    Write-Output 'Preserve existing config; correct the intended environment using docs/firebase-signin-setup.md.'
    exit 1
}
exit 0

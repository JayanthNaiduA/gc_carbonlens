# Flutter web entry

index.html bootstraps the generated flutter_bootstrap.js from the real Flutter app.
manifest.json contains only public app metadata. No Firebase configuration is embedded.

The browser demo runs in debug mode at 127.0.0.1:8080 using the portable dev.ps1 script.
Flutter tooling/packages need approved setup first; no web build or server has run yet.
Release mode requires real Firebase configuration and a separate deployment review.

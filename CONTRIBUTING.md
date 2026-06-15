# Contributing

Thanks for helping improve WillowTab. This repository is a small public browser extension, so contribution notes stay intentionally lightweight.

## Development

Open `newtab.html` in a Chromium-based browser or load the repository as an unpacked extension from `chrome://extensions`.

Before submitting code changes, run:

```bash
node --check js/assets.js js/clock.js js/i18n.js js/search.js js/settings.js js/theme.js pack-zip.js scripts/build-chrome-store.js scripts/validate-release.js
```

## Release Validation

Before publishing extension packages, run:

```bash
node scripts/build-chrome-store.js
node pack-zip.js generic
node pack-zip.js chrome
node scripts/validate-release.js
```

The validation script checks version consistency, package file existence, zip freshness, and `_locales/*/messages.json` paths.

## Packaging

Use the existing Node.js packaging scripts. Do not use PowerShell `Compress-Archive` for extension zips because it can flatten `_locales/*/messages.json` paths and produce invalid Chrome Web Store packages.

## Pull Requests

Please include a short summary, validation commands, and screenshots for visible UI or documentation changes.

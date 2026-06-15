# WillowTab

**Languages:** English | [简体中文](README.zh-CN.md)

WillowTab is a clean and elegant new tab extension for Chromium-based browsers. It provides a focused search entry, multi-engine search switching, light and dark themes, and personal appearance settings so every new tab feels quieter and more comfortable.

![WillowTab main page](https://raw.githubusercontent.com/Un1quer23/WillowTab/main/docs/screenshots/en-main-page.png)

## Key Features

### Clean Search Entry and Multi-Engine Switching

Use the centered search box to start searching quickly. WillowTab supports Google, Baidu, Bing, and DuckDuckGo, so you can choose the engine that fits your habits. You can also enable search suggestions to make keyword entry smoother.

### Personal Backgrounds

Use a solid color background, import local images, or import a local folder. You can manage multiple wallpapers, choose one manually, or rotate them automatically. In wallpaper mode, WillowTab also adjusts text, controls, and the search surface to keep the interface readable.

### Light and Dark Themes

Choose light mode, dark mode, or follow the system appearance so the page stays comfortable across different times of day and usage environments.

### Appearance Customization

Adjust fonts, corner radius, shadow strength, settings button placement, and the browser tab title so the interface better matches your habits.

### Privacy-Friendly

WillowTab does not collect, track, or sell personal data.

WillowTab is for people who want a new tab page that stays simple, beautiful, and efficient without adding distracting information.

## Install

### Microsoft Edge

Edge users should install WillowTab directly from Microsoft Edge Add-ons:

[Install from Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/willowtab/ljkgjcbecpanckomdgebinggfhpkmmph)

### Google Chrome

Google Chrome users should install WillowTab directly from the Chrome Web Store:

[Install from Chrome Web Store](https://chromewebstore.google.com/detail/willowtab/gfigaeaddejhmnlkeppgccklahgepapm)

### Other Chromium Browsers

For other Chromium-based browsers, install manually from GitHub Releases:

[GitHub Releases](https://github.com/Un1quer23/WillowTab/releases/latest)

Download `WillowTab-v1.6.2.zip`, the generic build for Chromium-based browsers.

Manual installation steps:

1. Download `WillowTab-v1.6.2.zip`.
2. Extract it to a local folder.
3. Open your browser's extension management page, such as `chrome://extensions`.
4. Enable Developer mode.
5. Click "Load unpacked" and select the extracted folder.

### Chrome Web Store Package

`WillowTab-for-Chrome-v1.6.2.zip` is a dedicated Chrome Web Store build for Google compliance. It is mainly intended for Chrome Web Store submission and review.

## Project Structure

```text
WillowTab/
├── manifest.json
├── newtab.html
├── privacy-policy.html
├── css/
│   └── style.css
├── js/
│   ├── i18n.js
│   ├── search.js
│   ├── clock.js
│   ├── settings.js
│   └── theme.js
├── icons/
└── chrome-store/
```

The Chrome Web Store build lives in `chrome-store/`. Its policy-specific override files include `manifest.json`, `newtab.html`, `js/search.js`, `js/settings.js`, `js/i18n.js`, `privacy-policy.html`, and `README.md`.

## Privacy, Security, and Contributing

- [Privacy Policy](https://un1quer23.github.io/WillowTab/privacy-policy.html)
- [Security Policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## License

[GNU General Public License v3](LICENSE)

---

Think Different.

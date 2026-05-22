# WillowTab

WillowTab is a clean, elegant, and customizable new tab extension for Chromium-based browsers.

WillowTab 是一款简洁优雅、可高度自定义的浏览器新标签页扩展。

It replaces the default new tab page with a focused start page that includes a search entry, local wallpapers, light/dark themes, and personal appearance settings.

它会将默认新标签页替换为一个轻量、专注的启动页面，提供搜索入口、本地壁纸、浅色/深色主题和外观个性化设置。

## Features / 功能

- **Clean search entry / 简洁搜索入口**  
  Start searching directly from the new tab page.  
  打开新标签页即可直接输入关键词并开始搜索。

- **Multi-engine search switching / 多搜索引擎切换**  
  The generic build supports switching between Google, Baidu, Bing, and DuckDuckGo.  
  通用版支持在 Google、百度、Bing、DuckDuckGo 之间切换。

- **Custom wallpapers / 个性化壁纸**  
  Use a solid color background or choose local images as wallpapers.  
  支持纯色背景，也可以选择本地图片作为壁纸。

- **Light and dark themes / 浅色与深色主题**  
  Choose light mode, dark mode, or follow the system appearance.  
  支持浅色、深色以及跟随系统主题。

- **Appearance settings / 外观设置**  
  Adjust fonts, corner radius, shadow strength, settings button placement, and the tab title.  
  可调整字体、圆角、阴影强度、设置按钮位置和标签页标题。

- **Local-first and privacy-friendly / 本地优先与隐私友好**  
  Personal settings and wallpaper data are stored locally in your browser. WillowTab does not collect, track, or sell personal data.  
  个性化设置和壁纸数据均保存在浏览器本地。WillowTab 不收集、不追踪、不出售个人数据。

## Install / 安装

### Microsoft Edge

Edge users should install WillowTab directly from Microsoft Edge Add-ons:

[Install from Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/willowtab/ljkgjcbecpanckomdgebinggfhpkmmph)

Edge 用户建议直接从 Microsoft Edge 扩展商店安装：

[从 Microsoft Edge 扩展商店安装](https://microsoftedge.microsoft.com/addons/detail/willowtab/ljkgjcbecpanckomdgebinggfhpkmmph)

### Other Chromium Browsers

For other Chromium-based browsers, install manually from GitHub Releases:

[GitHub Releases](https://github.com/Un1quer23/WillowTab/releases/latest)

Download `WillowTab-v1.5.0.zip`, the generic build for Chromium-based browsers.

其他 Chromium 系浏览器用户，请从 GitHub Releases 手动安装：

[GitHub Releases](https://github.com/Un1quer23/WillowTab/releases/latest)

下载 `WillowTab-v1.5.0.zip`，也就是适用于 Chromium 系浏览器的通用版。

Manual installation steps:

1. Download `WillowTab-v1.5.0.zip`.
2. Extract it to a local folder.
3. Open your browser's extension management page, such as `chrome://extensions`.
4. Enable Developer mode.
5. Click "Load unpacked" and select the extracted folder.

手动安装步骤：

1. 下载 `WillowTab-v1.5.0.zip`。
2. 解压到本地文件夹。
3. 打开浏览器扩展管理页面，例如 `chrome://extensions`。
4. 启用“开发者模式”。
5. 点击“加载已解压的扩展”，选择解压后的文件夹。

### Chrome Web Store Package / Chrome 商店特供包

`WillowTab-for-Chrome-v1.5.0.zip` is a dedicated Chrome Web Store build for Google compliance. It is mainly intended for Chrome Web Store submission and review.

`WillowTab-for-Chrome-v1.5.0.zip` 是为满足 Google 合规要求提供的 Chrome Web Store 特供版，主要用于 Chrome Web Store 提交和审核。

## Project Structure / 项目结构

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

Chrome Web Store 版本位于 `chrome-store/`。其中 `manifest.json`、`newtab.html`、`js/search.js`、`js/settings.js`、`js/i18n.js`、`privacy-policy.html`、`README.md` 是审核策略相关的覆盖文件。

## Privacy Policy / 隐私政策

[Privacy Policy](https://un1quer23.github.io/WillowTab/privacy-policy.html)

[隐私政策](https://un1quer23.github.io/WillowTab/privacy-policy.html)

## License / 开源协议

[GNU General Public License v3](LICENSE)

---

Think Different.

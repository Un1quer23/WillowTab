// i18n — Simplified Chinese ↔ English
(() => {
  const DICT = {
    'zh-CN': {
      // Greetings
      'greeting.default': '你好',
      'greeting.深夜': '夜深了，注意休息',
      'greeting.早上好': '早上好',
      'greeting.上午好': '上午好',
      'greeting.中午好': '中午好',
      'greeting.下午好': '下午好',
      'greeting.晚上好': '晚上好',

      // Search
      'search.placeholder': 'Think Different.',
      'search.toggleEngine': '切换搜索引擎',
      'search.settings': '设置',

      // Engine names
      'engine.baidu': '百度',

      // Settings panel
      'settings.title': '设置',
      'settings.close': '关闭',
      'settings.background': '背景',
      'settings.bgMode': '背景模式',
      'settings.bgColorMode': '纯色背景',
      'settings.bgWallpaperMode': '壁纸',
      'settings.presetColors': '预设颜色',
      'settings.customColor': '自选颜色',
      'settings.wallpaperSettings': '壁纸设置',
      'settings.selectFolder': '选择文件夹',
      'settings.overlayStrength': '遮罩强度',
      'settings.displayMode': '显示模式',
      'settings.followSystem': '跟随系统',
      'settings.dark': '深色',
      'settings.light': '浅色',
      'settings.font': '字体',
      'settings.fontSerif': '衬线体',
      'settings.fontSystem': '系统默认',
      'settings.fontMono': '等宽体',
      'settings.radius': '圆角',
      'settings.radiusRounded': '圆润',
      'settings.radiusSquare': '方正',
      'settings.radiusSlight': '微圆',
      'settings.radiusCapsule': '胶囊',
      'settings.shadow': '阴影',
      'settings.shadowStrength': '阴影强度',
      'settings.settingsBtnPosition': '设置按钮位置',
      'settings.btnPosFooter': '搜索框底部',
      'settings.btnPosDropdown': '搜索引擎菜单',
      'settings.tabTitle': '标签页名称',
      'settings.tabTitlePlaceholder': '留空使用默认名称',

      // About
      'about.title': '关于 WillowTab',
      'about.close': '关闭',
      'about.description': 'WillowTab 是一个特别的浏览器新标签页扩展，致力于为您带来简洁高效的浏览器启动与搜索体验。',
      'about.author': '作者',
      'about.github': 'GitHub',
      'about.license': '本程序为开源软件，遵循 GNU General Public License v3 协议。',

      // Colors
      'color.beige': '米灰',
      'color.sage': '鼠尾草',

      // Wallpaper
      'wallpaper.empty': '暂无壁纸，请选择文件夹添加',
      'wallpaper.delete': '删除',
      'wallpaper.oldWallpaper': '旧壁纸',

      // Toast
      'toast.addedAndSkipped': '新增 {added} 张，跳过 {skipped} 张重复',
      'toast.allSkipped': '全部 {skipped} 张已存在，已跳过',

      // Error
      'error.quotaExceeded': '存储空间不足，已清除所有壁纸。请删除部分壁纸后重新添加。',

      // Hint
      'hint.darkColorDisabled': '仅在浅色模式下可用',

      // Privacy Policy
      'privacy.title': 'WillowTab 隐私政策',
      'privacy.effectiveDate': '生效日期：2026年5月8日　|　最后更新：2026年5月22日',
      'privacy.section1.title': '一、引言',
      'privacy.section1.p1': 'WillowTab（以下简称"本扩展"）是一款浏览器新标签页替换扩展，由个人开发者 Un1quer（以下简称"我们"）开发和维护。我们高度重视你的隐私和个人信息保护。',
      'privacy.section1.p2': '本隐私政策旨在向你说明本扩展如何处理你的信息，包括信息的收集、使用、存储和保护方式。请你仔细阅读本政策。安装或使用本扩展，即表示你同意本政策所述的信息处理方式。',
      'privacy.section2.title': '二、我们收集什么信息',
      'privacy.section2_1.title': '2.1 我们不收集的信息',
      'privacy.section2_1.p': '本扩展<strong>不收集、不存储、不传输</strong>任何可识别个人身份的信息，包括但不限于：姓名、电子邮箱、电话号码、地理位置、IP 地址、设备标识符、浏览历史、书签数据。',
      'privacy.section2_2.title': '2.2 本地存储的信息',
      'privacy.section2_2.p1': '以下数据仅存储在你设备的浏览器本地存储（localStorage）中，<strong>完全离线</strong>，不会上传至任何服务器：',
      'privacy.section2_2.li1': '背景模式偏好（纯色 / 壁纸）',
      'privacy.section2_2.li2': '自定义背景颜色值',
      'privacy.section2_2.li3': '壁纸图片文件（本地压缩后以 Base64 格式存储）',
      'privacy.section2_2.li4': '字体、圆角、阴影强度等界面偏好',
      'privacy.section2_2.li5': '显示模式偏好（跟随系统 / 深色 / 浅色）',
      'privacy.section2_2.li6': '当前选择的搜索引擎',
      'privacy.section2_2.li7': '设置按钮位置偏好',
      'privacy.section2_2.p2': '你可以随时通过浏览器清除网站数据来删除上述所有本地信息。',
      'privacy.section3.title': '三、网络请求',
      'privacy.section3.p': '本扩展仅在以下场景发起网络请求，<strong>不附加任何用户标识信息</strong>：',
      'privacy.section3_1.title': '3.1 搜索建议',
      'privacy.section3_1.p': '当搜索建议功能启用或当前版本支持搜索联想时，你在搜索框中输入的关键词会被发送到当前选择的搜索引擎（Google、百度、Bing 或 DuckDuckGo）以获取自动补全建议。提交搜索时，支持“浏览器默认”的版本会调用浏览器默认搜索服务；手动选择其他搜索引擎时，关键词会直接发送到所选搜索服务。这些请求不包含任何个人身份信息或设备标识符。',
      'privacy.section4.title': '四、权限说明',
      'privacy.section4.p': '本扩展在浏览器中声明了以下权限，均仅用于实现核心功能：',
      'privacy.section4.li1': '<strong>新标签页覆盖（newtab）</strong>：用于替换浏览器默认新标签页，显示 WillowTab 界面。',
      'privacy.section4.li2': '<strong>主机权限（host_permissions / optional_host_permissions）</strong>：用于向所选搜索引擎发送搜索建议请求。不同浏览器或发布版本可能使用固定主机权限或可选主机权限；可选权限仅在开启搜索联想时请求，关闭后会撤销。',
      'privacy.section5.title': '五、第三方服务',
      'privacy.section5.li1': '本扩展<strong>不集成</strong>任何第三方统计分析 SDK、广告联盟、用户画像或行为跟踪服务。',
      'privacy.section5.li2': '搜索建议请求直接发往各搜索引擎的公开 API 接口，各搜索引擎的隐私政策请参见其官方网站。',
      'privacy.section6.title': '六、信息安全',
      'privacy.section6.p1': '所有个性化设置和壁纸数据均存储在浏览器本地沙箱中，受浏览器自身的安全机制保护。由于数据完全不上传至任何外部服务器，不存在服务器端数据泄露的风险。',
      'privacy.section6.p2': '你应妥善保管自己的设备，避免他人物理接触导致本地数据被查看。',
      'privacy.section7.title': '七、未成年人保护',
      'privacy.section7.p': '本扩展不针对未成年人。未成年人应在父母或其他监护人的指导下使用本扩展。',
      'privacy.section8.title': '八、政策更新',
      'privacy.section8.p': '我们可能根据法律法规变化或功能调整适时更新本隐私政策。更新后的政策将在本页面发布并注明更新日期。重大变更将通过扩展更新说明或 GitHub 仓库通知。',
      'privacy.section9.title': '九、开源许可声明',
      'privacy.section9.p': '本扩展的图标基于 Google Material Design Icons 修改制作，其遵循 <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache License 2.0</a> 开源许可协议。',
      'privacy.section10.title': '十、联系方式',
      'privacy.section10.p': '如你对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们：',
      'privacy.section10.li1': '电子邮箱：<a href="mailto:un1works@outlook.com">un1works@outlook.com</a>',
      'privacy.section10.li2': 'GitHub：<a href="https://github.com/Un1quer23/WillowTab">github.com/Un1quer23/WillowTab</a>',
    },
    en: {
      // Greetings
      'greeting.default': 'Hello',
      'greeting.深夜': 'Good night',
      'greeting.早上好': 'Good morning',
      'greeting.上午好': 'Good morning',
      'greeting.中午好': 'Good afternoon',
      'greeting.下午好': 'Good afternoon',
      'greeting.晚上好': 'Good evening',

      // Search
      'search.placeholder': 'Think Different.',
      'search.toggleEngine': 'Switch search engine',
      'search.settings': 'Settings',

      // Engine names
      'engine.baidu': 'Baidu',

      // Settings panel
      'settings.title': 'Settings',
      'settings.close': 'Close',
      'settings.background': 'Background',
      'settings.bgMode': 'Background Mode',
      'settings.bgColorMode': 'Solid Color',
      'settings.bgWallpaperMode': 'Wallpaper',
      'settings.presetColors': 'Preset Colors',
      'settings.customColor': 'Custom Color',
      'settings.wallpaperSettings': 'Wallpaper Settings',
      'settings.selectFolder': 'Select Folder',
      'settings.overlayStrength': 'Overlay Opacity',
      'settings.displayMode': 'Display Mode',
      'settings.followSystem': 'Follow System',
      'settings.dark': 'Dark',
      'settings.light': 'Light',
      'settings.font': 'Font',
      'settings.fontSerif': 'Serif',
      'settings.fontSystem': 'System Default',
      'settings.fontMono': 'Monospace',
      'settings.radius': 'Corner Radius',
      'settings.radiusRounded': 'Rounded',
      'settings.radiusSquare': 'Square',
      'settings.radiusSlight': 'Slightly Round',
      'settings.radiusCapsule': 'Capsule',
      'settings.shadow': 'Shadow',
      'settings.shadowStrength': 'Shadow Strength',
      'settings.settingsBtnPosition': 'Settings Button',
      'settings.btnPosFooter': 'Below Search',
      'settings.btnPosDropdown': 'Engine Menu',
      'settings.tabTitle': 'Tab Title',
      'settings.tabTitlePlaceholder': 'Leave empty for default',

      // About
      'about.title': 'About WillowTab',
      'about.close': 'Close',
      'about.description': 'WillowTab is a distinctive browser new tab extension, dedicated to bringing you a clean and efficient browser launch and search experience.',
      'about.author': 'Author',
      'about.github': 'GitHub',
      'about.license': 'This program is open source software, licensed under the GNU General Public License v3.',

      // Colors
      'color.beige': 'Beige',
      'color.sage': 'Sage',

      // Wallpaper
      'wallpaper.empty': 'No wallpapers. Select a folder to add some.',
      'wallpaper.delete': 'Delete',
      'wallpaper.oldWallpaper': 'Old Wallpaper',

      // Toast
      'toast.addedAndSkipped': '{added} added, {skipped} duplicates skipped',
      'toast.allSkipped': 'All {skipped} already exist, skipped',

      // Error
      'error.quotaExceeded': 'Storage full. All wallpapers cleared. Please remove some wallpapers and try again.',

      // Hint
      'hint.darkColorDisabled': 'Only available in light mode',

      // Privacy Policy
      'privacy.title': 'WillowTab Privacy Policy',
      'privacy.effectiveDate': 'Effective: May 8, 2026  |  Last updated: May 22, 2026',
      'privacy.section1.title': 'I. Introduction',
      'privacy.section1.p1': 'WillowTab (hereinafter referred to as "the Extension") is a browser new tab replacement extension developed and maintained by individual developer Un1quer (hereinafter referred to as "we"). We highly value your privacy and the protection of your personal information.',
      'privacy.section1.p2': 'This Privacy Policy is intended to explain how the Extension handles your information, including collection, use, storage, and protection. Please read this policy carefully. By installing or using the Extension, you agree to the information handling practices described in this policy.',
      'privacy.section2.title': 'II. What Information We Collect',
      'privacy.section2_1.title': '2.1 Information We Do NOT Collect',
      'privacy.section2_1.p': 'The Extension <strong>does not collect, store, or transmit</strong> any personally identifiable information, including but not limited to: name, email address, phone number, geographic location, IP address, device identifiers, browsing history, or bookmark data.',
      'privacy.section2_2.title': '2.2 Locally Stored Information',
      'privacy.section2_2.p1': 'The following data is stored solely in your browser\'s local storage (localStorage), <strong>completely offline</strong>, and is never uploaded to any server:',
      'privacy.section2_2.li1': 'Background mode preference (solid color / wallpaper)',
      'privacy.section2_2.li2': 'Custom background color value',
      'privacy.section2_2.li3': 'Wallpaper image files (stored locally as compressed Base64)',
      'privacy.section2_2.li4': 'Font, corner radius, shadow strength, and other interface preferences',
      'privacy.section2_2.li5': 'Display mode preference (follow system / dark / light)',
      'privacy.section2_2.li6': 'Currently selected search engine',
      'privacy.section2_2.li7': 'Settings button position preference',
      'privacy.section2_2.p2': 'You can delete all of the above local information at any time by clearing site data through your browser.',
      'privacy.section3.title': 'III. Network Requests',
      'privacy.section3.p': 'The Extension initiates network requests only in the following scenarios, <strong>without attaching any user identification information</strong>:',
      'privacy.section3_1.title': '3.1 Search Suggestions',
      'privacy.section3_1.p': 'When search suggestions are enabled or supported by the current version, keywords you enter in the search box are sent to the currently selected search engine (Google, Baidu, Bing, or DuckDuckGo) to retrieve autocomplete suggestions. When submitting a search, versions that support "Browser Default" use your browser\'s default search provider; manually choosing another search engine sends the keyword directly to that selected search service. These requests contain no personal identity information or device identifiers.',
      'privacy.section4.title': 'IV. Permission Explanation',
      'privacy.section4.p': 'The Extension declares the following permissions in the browser, all used solely to implement core functionality:',
      'privacy.section4.li1': '<strong>New Tab Override (newtab)</strong>: Used to replace the browser\'s default new tab page and display the WillowTab interface.',
      'privacy.section4.li2': '<strong>Host Permissions (host_permissions / optional_host_permissions)</strong>: Used to send search suggestion requests to the selected search engine. Different browsers or release builds may use fixed host permissions or optional host permissions; optional permissions are requested only when search suggestions are enabled and removed again when suggestions are disabled.',
      'privacy.section5.title': 'V. Third-Party Services',
      'privacy.section5.li1': 'The Extension <strong>does not integrate</strong> any third-party statistical analytics SDKs, advertising networks, user profiling, or behavioral tracking services.',
      'privacy.section5.li2': 'Search suggestion requests are sent directly to the public API endpoints of each search engine. Please refer to each search engine\'s official website for their respective privacy policies.',
      'privacy.section6.title': 'VI. Information Security',
      'privacy.section6.p1': 'All personalization settings and wallpaper data are stored within the browser\'s local sandbox, protected by the browser\'s own security mechanisms. Since data is never uploaded to any external server, there is no risk of server-side data breaches.',
      'privacy.section6.p2': 'You should properly secure your device to prevent unauthorized physical access that could lead to local data being viewed.',
      'privacy.section7.title': 'VII. Protection of Minors',
      'privacy.section7.p': 'The Extension is not targeted at minors. Minors should use the Extension under the guidance of their parents or other guardians.',
      'privacy.section8.title': 'VIII. Policy Updates',
      'privacy.section8.p': 'We may update this Privacy Policy from time to time in response to changes in laws, regulations, or functionality. The updated policy will be published on this page with the revision date noted. Significant changes will be notified through extension update notes or the GitHub repository.',
      'privacy.section9.title': 'IX. Open Source License Statement',
      'privacy.section9.p': 'The Extension\'s icons are modified from Google Material Design Icons, which are licensed under the <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache License 2.0</a>.',
      'privacy.section10.title': 'X. Contact',
      'privacy.section10.p': 'If you have any questions, comments, or suggestions regarding this Privacy Policy, please contact us through the following channels:',
      'privacy.section10.li1': 'Email: <a href="mailto:un1works@outlook.com">un1works@outlook.com</a>',
      'privacy.section10.li2': 'GitHub: <a href="https://github.com/Un1quer23/WillowTab">github.com/Un1quer23/WillowTab</a>',
    },
  };

  // 只检查浏览器首选语言；非中文一律返回英文，不做 zh-TW/zh-HK 细分
  function detectLang() {
    const primary = navigator.language;
    if (primary && primary.startsWith('zh')) return 'zh-CN';
    return 'en';
  }
  const state = { lang: detectLang() };

  window.__i18n = {
    get lang() { return state.lang; },
    set lang(v) { state.lang = v; },
    // 回退链：当前语言 → 英语（最完整）→ 原始 key（兜底，避免显示 undefined）
    t(key, vars) {
      let text = (DICT[state.lang] && DICT[state.lang][key]) || DICT.en[key] || key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, v);
        }
      }
      return text;
    },
  };

  // Apply translations to DOM on load
  function applyDOM() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = window.__i18n.t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      el.innerHTML = window.__i18n.t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', window.__i18n.t(el.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', window.__i18n.t(el.getAttribute('data-i18n-title')));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', window.__i18n.t(el.getAttribute('data-i18n-aria')));
    });
    // Set document.title if <html> has data-i18n-doctitle
    const doctitleKey = document.documentElement.getAttribute('data-i18n-doctitle');
    if (doctitleKey) {
      document.title = window.__i18n.t(doctitleKey);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDOM);
  } else {
    applyDOM();
  }
})();

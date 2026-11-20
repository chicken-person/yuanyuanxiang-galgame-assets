/**
 * 《远远乡》UI v3（用户 2026-11-19 11:16 的 13 项修改，并入 v2 升级为 v3）
 * 本文件是全部 UI 改动的注入层（WebGAL 4.6.6 引擎不改源码；G02 场景文字文件冻结不动）：
 *  - 底栏整行去掉（第 0 项，沿用 10:54 决定）：CSS 藏底栏容器；右键／滚轮上滑／
 *    Ctrl 快进／F11／Esc 慌张遮罩等后门一并禁掉；点读（单击／空格）保留。
 *  - 第 1 项 删存档：标题菜单只藏“读取存档”（手动存读档入口）；自动书签悄悄记
 *    上次听到哪篇哪张卡（localStorage yyx-bookmark-v1），供“继续”用；
 *    “继续”本身由引擎按有无进度置灰／变亮（一次没听过时不可点）。
 *  - 第 2 项 主页标题：书法体《远远乡》（本地子集字体，见 game/fonts/），逐字
 *    1 秒出现；标题画面的引擎占位 Logo 藏掉，换成同一个书法标题。
 *  - 第 3 项 入口屏视频循环当背景：start.txt 不再原生 playVideo；本文件在
 *    入口屏挂一个循环 <video> 当全屏背景（home-opening，无音轨），两入口叠在上面。
 *  - 第 4 项 视频强制播放：热点已撤（video-events.js 改自动播）；细节选项
 *    “看看 X”／“回到故事”出现时由本文件自动点（藏起选项闪一下即进）；
 *    字幕层 window.__yyxSubtitle 由 video-events.js 在播视频时调用。
 *  - 第 5 项 G02 结尾：结尾选项出现时自动点“回到心香目录”（冻结文件里的
 *    旧目录名在 DOM 里先改名再点），强制回心香目录，不设下一篇。
 *  - 第 6 项 两线目录合并：入口屏两个选项改名心香／心碑（start.txt），本文件
 *    把它们重排成左右两个发光光点入口（书法字）。
 *  - 第 7 项 字幕居中：对话框左右留白对称（padding 左右各 270px）、文字居中。
 *  - 第 11／13 项 改名：标题菜单改成 开始／继续／图集／设置／退出；
 *    旧的两个线名在 DOM 里不再出现（冻结的 G02 结尾选项在 DOM 里改名）；
 *    全站不出现游戏化措辞。
 *  - 第 12 项 全页左上返回：返回按钮固定在舞台左上角；点后记目标、重载、
 *    由本文件的自动导航带到上一级（标题／入口屏／本线目录）。
 * 视频跳过按钮（#fx-native-skip / #g02-native-skip / 视频层内跳过）不属于
 * 底栏，单独保留，本文件不碰；播视频时返回按钮暂隐（跳过优先）。
 * ── v4（用户 2026-11-19 16:03 补的 10 项反馈，9 项代码改动；第 6 项视频重做另有人做）──
 *  - 第 1 项 不要语言选择：启动时强制 localStorage lang='0'（简体中文），
 *    CSS 藏 splash 与语言选择器，立即点 title-enter；tick 里 startupGuard() 兜底。
 *    副作用：设置屏改语言后重载会被打回简体中文（有意为之，见 forceChineseStartup）。
 *  - 第 2／5 项 标题去书名号、字号统一：TITLE_CHARS=['远','远','乡']；
 *    标题画面与入口屏字号统一为 95px（实测同字号则同渲染尺寸）。
 *  - 第 3 项 返回不重载：goBack() 改走引擎机制（底栏“标题”按钮＋确认框 wO、
 *    结束界面 choose 直跳、其余遮罩后隐藏重走）；耗时记 window.__yyxBackTimings。
 *    “继续”恢复（startResume）仍是重载＋导航，另一条路，不动；启动时清掉无恢复
 *    陪伴的旧 yyx-goto 残留，免得下次启动误导航。
 *  - 第 4 项 点开始闪动：MutationObserver 在选项容器插入的同一微任务里立即加
 *    yyx-entry-choose 类（先于下一次绘制），300ms tick 只作兜底。
 *  - 第 8 项 图集页内标题“鉴赏模式”→“图集”；退出确认框“确定要退出游戏吗？”→
 *    “确定要退出吗？”；设置屏“无游戏二字”已于 v4 实测复核（见 cleanSettings 注释）。
 *  - 第 9 项 图集全屏查看加上一张／下一张按钮（固定在屏幕左右，手机竖屏可点），
 *    驱动引擎自身的组内推进／开关组切换；到头／尾循环。
 *  - 第 10 项 图集分组：打开图集时用引擎 unlockCgInUserData/setUserData 的
 *    机制把 CG 按心香（G01–G05＋HOME-01 最前）／心碑（M01–M05＋M04-04）重排
 *    为两组（只改内存里的展示顺序与 series，不动存储的解锁记录本身——
 *    存储由引擎自己的保存时机写回；下次打开图集幂等重做），并在网格里插组标题。
 *    HOME-01 放心香组最前：它没有单一归属，按左幅奶奶夜景场景归入。
 * 实现：CSS 常驻规则＋ MutationObserver＋ 300ms tick；不改引擎源码、不动视频。
 */
(function () {
  'use strict';

  /* ================= 0. 常驻样式 ================= */
  var FONT_URL = 'game/fonts/zhimangxing-subset.woff2';
  function injectCss() {
    if (document.getElementById('yyx-ui-clean-style')) return;
    var st = document.createElement('style');
    st.id = 'yyx-ui-clean-style';
    st.textContent = [
      "@font-face{font-family:'YYX-Calligraphy';src:url('" + FONT_URL + "') format('woff2');font-display:swap;}",
      /* overflow:hidden 仍允许浏览器把外层滚偏，裁掉入口标题；各面板自行滚动。 */
      'body{overflow:clip !important;}',
      /* 底栏整行去掉 */
      '._main_rdjpk_1{display:none !important;}',
      /* 设置屏底栏（存档/读档/标题/选项/返回那一行，另一套容器）也去掉；
         返回走左上返回按钮 */
      '._MenuPanel_main_1c9ky_1{display:none !important;}',
      /* 标题画面引擎占位 Logo 藏掉（换成书法标题，见下） */
      '._Logo_main_1t2wi_1{display:none !important;}',
      /* v4 第 1 项：Logo 的白底（_Logo_Back，background:#fff）也藏掉——
         它盖在标题菜单之上约 5 秒（0.7s 出现、5.5s 消失），期间标题点不动，
         且 Logo 图本身已被上面一条藏掉，白底后面什么都没有，只剩白屏等 5 秒。
         不藏它，“直接进标题画面”就做不到（实测：等它消失前点“开始”会被吞掉）。 */
      '._Logo_Back_1t2wi_32{display:none !important;}',
      /* v4 第 1 项：不要语言选择——splash 与语言选择器永不显示
         （lang 已在启动时强制预置为 0=简体中文；这两条是双保险） */
      '.html-body__title-enter{display:none !important;}',
      '._trans_1oupq_2{display:none !important;}',
      /* 字幕居中（第 7 项）：左右留白对称（原左 490px／右 50px，现左右各 270px），文字居中 */
      '#textBoxMain{padding-left:270px !important;padding-right:270px !important;text-align:center !important;}',
      '#textBoxMain div{text-align:center !important;}',
      /* 入口屏两光点（第 6 项）：选项容器铺满舞台、横排左右分列 */
      '#chooseContainer.yyx-auto-choose,body:has(#playVideoElement,#fx-video-layer,#g02-video-layer) #chooseContainer{visibility:hidden !important;pointer-events:none !important;}',
      '#chooseContainer.yyx-entry-choose{overflow:visible !important;}',
      '#chooseContainer.yyx-entry-choose > div{position:absolute !important;left:0 !important;top:0 !important;width:100% !important;height:100% !important;display:flex !important;flex-direction:row !important;align-items:center !important;justify-content:space-evenly !important;background:transparent !important;}',
      '#chooseContainer.yyx-entry-choose > div > div{display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;background:transparent !important;border:none !important;box-shadow:none !important;padding:0 !important;margin:0 !important;cursor:pointer !important;}',
      '#chooseContainer.yyx-entry-choose > div > div::before{content:"";display:block;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle, rgba(255,244,214,0.95) 0%, rgba(255,205,110,0.6) 42%, rgba(255,180,80,0.0) 72%);box-shadow:0 0 70px 22px rgba(255,200,100,0.45);animation:yyx-dot-pulse 2.4s ease-in-out infinite;}',
      '#chooseContainer.yyx-entry-choose > div > div > div{font-family:"YYX-Calligraphy", serif !important;font-size:165px !important;line-height:1.15 !important;color:#fff !important;text-shadow:0 3px 18px rgba(0,0,0,0.8), 0 0 28px rgba(255,210,120,0.45) !important;background:transparent !important;border:none !important;box-shadow:none !important;padding:0 !important;margin-top:18px !important;}',
      '@keyframes yyx-dot-pulse{0%,100%{opacity:0.75;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}',
      /* 书法标题（第 2 项）。层级要点：标题画面背景是一层 z13 的全屏背景 div，
         它盖在舞台（z1）之上，菜单容器是它的子元素——所以标题画面字必须挂在
         这个背景 div 下面（和菜单同一层级），挂在舞台上会被背景盖住。背景 div
         是屏幕坐标（1280×720），字号按屏幕坐标取舞台字号的一半；入口屏字挂在
         舞台上（舞台坐标），因为剧情场景背景是舞台内的画布，没有那层 z13 背景。
         封面按参考图把书法标题放大，双线入口沿用原本的字号。 */
      '.yyx-callig-title{position:absolute;left:50%;transform:translateX(-50%);z-index:20;font-family:"YYX-Calligraphy", serif;line-height:1.15;color:#fff;text-shadow:0 0 26px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.6), 0 0 8px rgba(255,255,255,0.5);pointer-events:none;white-space:nowrap;}',
      '.yyx-callig-title span{display:inline-block;opacity:0;transition:opacity 0.6s ease;}',
      '#yyx-title-menu{left:47.4%;top:7%;font-size:270px;letter-spacing:8px;text-shadow:0 8px 28px rgba(32,17,10,0.55);}',
      '#yyx-title-menu span{opacity:1;transition:none;transform:scaleY(1.18);transform-origin:center top;}',
      '#yyx-title-menu.yyx-cover-title-intro{animation:yyx-cover-title-arrive 2.8s cubic-bezier(.38,.12,.24,1) both;}',
      '@keyframes yyx-cover-title-arrive{from{opacity:0;transform:translate3d(-50%,175%,0) scale(.28);}18%{opacity:.88;}to{opacity:1;transform:translate3d(-50%,0,0) scale(1);}}',
      '@media(prefers-reduced-motion:reduce){#yyx-title-menu.yyx-cover-title-intro{animation:none;}}',
      '#yyx-title-entry{top:7%;font-size:195px;letter-spacing:6px;color:#fff;text-shadow:0 3px 24px rgba(0,0,0,0.78),0 0 12px rgba(48,29,20,0.45);}',
      /* 入口屏循环背景视频（第 3 项） */
      '#yyx-bg-video{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;z-index:2;pointer-events:none;}',
      /* 视频字幕层（第 4 项）：与对话框同文同字号、居中；点按穿透 */
      '#yyx-video-subtitle{position:absolute;left:0;right:0;bottom:0;z-index:30;pointer-events:none;text-align:center;padding:36px 270px 70px;background:linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 70%, rgba(0,0,0,0) 100%);display:none;}',
      '#yyx-video-subtitle .yyx-sub-name{font-size:51.2px;line-height:1.4;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,0.9);}',
      '#yyx-video-subtitle .yyx-sub-body{font-size:52.48px;line-height:1.5;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,0.9);}',
      /* 返回按钮（第 12 项）：舞台左上固定、大而清楚 */
      '#yyx-back-btn{position:fixed;left:16px;top:16px;z-index:9999;min-height:52px;padding:8px 18px;font-size:28px;line-height:1.2;color:#fff;background:rgba(0,0,0,0.6);border:2px solid rgba(255,255,255,0.75);border-radius:26px;cursor:pointer;display:none;}',
      /* 正在返回遮罩（自动导航时盖住屏幕，防误点） */
      '#yyx-returning{position:fixed;left:0;top:0;width:100%;height:100%;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(20,16,12,0.55);color:#fff;font-size:40px;pointer-events:auto;}',
      /* v4 第 9 项：图集全屏查看的上一张／下一张按钮（固定在屏幕左右，手机竖屏可点） */
      '#yyx-gallery-prev,#yyx-gallery-next{position:fixed;top:50%;transform:translateY(-50%);z-index:10000;width:76px;height:76px;border-radius:50%;background:rgba(0,0,0,0.55);color:#fff;border:2px solid rgba(255,255,255,0.85);font-size:42px;line-height:1;display:none;align-items:center;justify-content:center;cursor:pointer;padding:0;}',
      '#yyx-gallery-prev{left:18px;}',
      '#yyx-gallery-next{right:18px;}',
      '#yyx-gallery-prev.yy-nav-busy,#yyx-gallery-next.yy-nav-busy{opacity:0.45;pointer-events:none;}',
      /* v4 第 10 项：图集组标题（插在网格每组之前，占满一行） */
      '.yyx-gallery-group-title{flex-basis:100%;grid-column:1 / -1;text-align:center;font-family:"YYX-Calligraphy", serif;font-size:46px;line-height:1.3;color:#4a3520;padding:10px 0 2px;pointer-events:none;}',
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ================= 工具 ================= */
  var DBG = (window.__yyxUiClean = window.__yyxUiClean || { cb: 0, scanned: 0, hidden: 0, renamed: 0 });
  function stage() {
    return document.querySelector('[class*="MainStage_main"]');
  }
  function textBox() {
    return document.getElementById('textBoxMain');
  }
  function visible(el) {
    if (!el) return false;
    var cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function textOf(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }
  // 找标题菜单项（div.css-u5nuln）：按叶子 span 精确文本
  function menuItem(label) {
    var spans = document.querySelectorAll('span');
    for (var i = 0; i < spans.length; i++) {
      if (textOf(spans[i]) !== label) continue;
      var item = spans[i];
      while (item && String(item.className || '').indexOf('css-u5nuln') === -1) {
        item = item.parentElement;
      }
      if (item) return item;
    }
    return null;
  }
  function menuVisible(label) {
    var item = menuItem(label);
    return !!item && visible(item);
  }
  // 选项容器里的可见选项标签（叶子 div 的文本；选项 div 本身文本即标签）
  // 注意：选项容器本身是 0 高包装层（子元素绝对定位溢出），不能用容器自身
  // 的 rect 判断可见性，要看叶子 div 是否有非零可见尺寸。
  function chooseLabels(includeHidden) {
    var c = document.querySelector('[class*="chooseContainer"]');
    if (!c) return null;
    var labels = [];
    var divs = c.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
      var d = divs[i];
      if (d.children.length !== 0) continue;
      var t = textOf(d);
      if (!t) continue;
      if (!includeHidden && !visible(d)) continue;
      labels.push(t);
    }
    if (!labels.length) return null;
    // 去重（同一标签在嵌套层可能出现多次，只留一次、保序）
    var out = [];
    for (var j = 0; j < labels.length; j++) {
      if (out.indexOf(labels[j]) === -1) out.push(labels[j]);
    }
    return out;
  }
  // 找选项的“标签 div”（叶子 div，文本即标签）。注意：引擎选项的点击处理
  // 挂在标签 div 上（css-191qauy），不是选项外层 div——对选项外层调
  // el.click() 不会触发（2026-11-19 实测：点外层无反应，点标签 div 正常进目录），
  // 所以这里返回叶子 div 本身，由调用方直接点它。
  function chooseOptionEl(label) {
    var c = document.querySelector('[class*="chooseContainer"]');
    if (!c) return null;
    var divs = c.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
      var d = divs[i];
      if (d.children.length !== 0) continue;
      if (textOf(d) === label) return d;
    }
    return null;
  }

  /* ================= v4 第 1 项：不要语言选择 =================
     引擎用 localStorage "lang" 存语言（0=简体中文；实测点一次简体中文后写 "0"）。
     本文件是经典脚本，在引擎 module 脚本之前执行，所以在这里同步强制写 "0"，
     赶在 React 挂载前预置——语言选择器挂载时见 lang 已存在就静默用简体中文、不显示。
     双保险：CSS 藏掉 splash 与语言选择器；再立即点一次 title-enter（触发 enter()，
     resolve enterPromise）；tick 里的 startupGuard() 会兜底再点。
     副作用：用户在设置屏改语言后重载会被打回简体中文——这是第 1 项“不许出现
     语言选择”的要求所致，有意为之。 */
  function forceChineseStartup() {
    try { localStorage.setItem('lang', '0'); } catch (e) {}
    try {
      var te = document.querySelector('.html-body__title-enter');
      if (te) te.click();
    } catch (e) {}
  }
  // 启动守护（tick 里跑）：万一预置／CSS 失效，语言选择一出现就自动点简体中文，
  // splash 一出现就自动点掉；正常启动时这两页根本不会出现，这里不触发。
  function startupGuard() {
    var page = currentPage();
    if (page === 'title-enter') {
      var te = document.querySelector('.html-body__title-enter');
      if (te) { try { te.click(); } catch (e) {} }
    } else if (page === 'language') {
      var els = document.querySelectorAll('div');
      for (var i = 0; i < els.length; i++) {
        if (textOf(els[i]) === '简体中文' && visible(els[i])) { try { els[i].click(); } catch (e) {} break; }
      }
    }
  }

  /* ================= v4 第 4 项：点开始后的闪动 =================
     原因（2026-11-19 10ms 轮询实测）：点“开始”后选项容器先以引擎默认版式上屏
     （两个上下排列的框），300ms tick 才加上 yyx-entry-choose 类改成左右光点，
     中间最长 300ms 的窗口能看到旧版式。修法：MutationObserver 在容器插入的
     同一微任务里立即加类（先于下一次绘制），300ms tick 只作兜底。
     另：首页背景图 home-opening_videoframe.png 底部自带两个淡色空白矩形
     （视频抽帧里也一直存在），那是美术素材自带的、与本闪动无关。 */
  function syncEntryNow() {
    var c = document.querySelector('[class*="chooseContainer"]');
    if (!c) return;
    var labels = chooseLabels(true);
    var onEntry = !!labels && labels.length === 2 &&
      labels.indexOf('心香') !== -1 && labels.indexOf('心碑') !== -1;
    c.classList.toggle('yyx-entry-choose', onEntry);
  }
  function observeEntryFlash() {
    var mo = new MutationObserver(function () { syncEntryNow(); autoChoose(); });
    mo.observe(document.body || document.documentElement, { childList: true, characterData: true, subtree: true });
  }

  /* ================= 1. 标题菜单：改名＋藏读取存档 ================= */
  var MENU_RENAME = {
    '开始游戏': '开始',
    '继续游戏': '继续',
    '鉴赏模式': '图集',
    '游戏选项': '设置',
    '退出游戏': '退出',
  };
  // 标题画面最终顺序（第 13 项）：开始／继续／图集／设置／退出
  // （引擎原顺序是 开始／继续／设置／读取存档／图集／退出，用 flex order 调整）
  var MENU_ORDER = { '开始': 1, '继续': 2, '图集': 3, '设置': 4, '退出': 5 };
  var MENU_HIDE = ['读取存档'];
  function scanMenu(root) {
    var scope = root || document;
    var items = [];
    if (scope.querySelectorAll) {
      var found = scope.querySelectorAll('div');
      for (var i = 0; i < found.length; i++) {
        if (String(found[i].className || '').indexOf('css-u5nuln') !== -1) items.push(found[i]);
      }
      // root 本身就是菜单项时（observer 传进来的是它）
      if (scope.nodeType === 1 && String(scope.className || '').indexOf('css-u5nuln') !== -1) {
        items.push(scope);
      }
    }
    for (var k = 0; k < items.length; k++) {
      var item = items[k];
      var label = textOf(item);
      // 菜单项文本是标签×3，取其一作判定
      var base = null;
      for (var old in MENU_RENAME) {
        if (label.indexOf(old) === 0) { base = old; break; }
      }
      if (!base) {
        for (var h = 0; h < MENU_HIDE.length; h++) {
          if (label.indexOf(MENU_HIDE[h]) === 0) { base = MENU_HIDE[h]; break; }
        }
      }
      if (!base) continue;
      if (MENU_HIDE.indexOf(base) !== -1) {
        if (item.style.display !== 'none') { item.style.display = 'none'; DBG.hidden += 1; }
        continue;
      }
      var target = MENU_RENAME[base];
      // 顺序：开始／继续／图集／设置／退出（flex order，React 不管它，不会被重渲染冲掉）
      if (MENU_ORDER[target] && item.style.order !== String(MENU_ORDER[target])) {
        item.style.order = String(MENU_ORDER[target]);
      }
      // 改名：把子树里所有恰好等于旧标签的文本节点换成新标签
      var walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT, null);
      var node;
      var changed = false;
      while ((node = walker.nextNode())) {
        if ((node.nodeValue || '').trim() === base) {
          node.nodeValue = target;
          changed = true;
        }
      }
      if (changed) DBG.renamed += 1;
    }
    // 兜底：万一底栏 class 被重命名，按内容再找一次底栏容器藏掉
    var fastSave = null;
    var all = scope.querySelectorAll ? scope.querySelectorAll('span') : [];
    for (var j = 0; j < all.length; j++) {
      if (textOf(all[j]) === '快速存档') { fastSave = all[j]; break; }
    }
    if (fastSave) {
      var bar = fastSave;
      while (bar && String(bar.className || '').indexOf('_main_rdjpk_1') === -1) {
        bar = bar.parentElement;
      }
      if (bar && bar.style.display !== 'none') bar.style.display = 'none';
    }
  }
  function observeMenu() {
    scanMenu(document);
    // 注意：一次 React 提交会产生几十条 mutation 记录；逐条扫（scanMenu(node)）
    // 会在同个微任务里反复全量查 DOM，把主线程堵上（实测点底栏“标题”后
    // 确认框 1–2.8 秒才出现，心跳 20ms 采样 1 秒内只走了 2 次）。所以这里只做
    // 合并：每批 mutation 记一笔，下一帧统一扫一次 document；i18n 填词、
    // 重渲染都由这一次扫覆盖，300ms tick 与 5 秒扫尾作兜底。
    var menuScanQueued = false;
    function queueMenuScan() {
      if (menuScanQueued) return;
      menuScanQueued = true;
      var run = function () { menuScanQueued = false; scanMenu(document); };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
      else setTimeout(run, 0);
    }
    var mo = new MutationObserver(function (muts) {
      DBG.cb += 1;
      queueMenuScan();
    });
    mo.observe(document.body || document.documentElement, {
      childList: true, subtree: true, characterData: true,
    });
    // 兜底：i18n 异步填词的时机不确定，加载后 5 秒内每 500ms 再扫一遍
    var sweeps = 0;
    var timer = setInterval(function () {
      scanMenu(document);
      sweeps += 1;
      if (sweeps >= 10) clearInterval(timer);
    }, 500);
  }

  /* ================= 2. 书法标题 ================= */
  var TITLE_CHARS = ['远', '远', '乡']; // v4 第 2 项：去书名号
  // 标题画面背景 div（z13 全屏背景，菜单容器是它的子元素；标题画面字挂在这里）
  function menuBgDiv() {
    var found = document.querySelectorAll('div');
    var item = null;
    for (var i = 0; i < found.length; i++) {
      if (String(found[i].className || '').indexOf('css-u5nuln') !== -1) { item = found[i]; break; }
    }
    if (!item) return null;
    var container = item.parentElement;       // 菜单容器
    if (!container) return null;
    return container.parentElement || null;   // 背景 div
  }
  // parentFn：标题画面字挂背景 div（和菜单同层），入口屏字挂舞台
  function makeTitleEl(id, parentFn) {
    var el = document.getElementById(id);
    if (el) return el;
    var parent = (parentFn && parentFn()) || stage();
    if (!parent) return null;
    el = document.createElement('div');
    el.id = id;
    el.className = 'yyx-callig-title';
    el.style.display = 'none';
    for (var i = 0; i < TITLE_CHARS.length; i++) {
      var sp = document.createElement('span');
      sp.textContent = TITLE_CHARS[i];
      el.appendChild(sp);
    }
    parent.appendChild(el);
    return el;
  }
  function playTitle(el) {
    if (!el) return;
    var spans = el.querySelectorAll('span');
    for (var i = 0; i < spans.length; i++) spans[i].style.opacity = '0';
    for (var j = 0; j < spans.length; j++) {
      (function (idx) {
        setTimeout(function () {
          if (spans[idx]) spans[idx].style.opacity = '1';
        }, idx * 1000);
      })(j);
    }
  }
  var titleMenuShown = false;
  var coverIntroPlayed = false;
  var titleEntryShown = false;
  function updateTitles() {
    var onMenu = menuVisible('开始') || menuVisible('开始游戏');
    var menuEl = onMenu ? makeTitleEl('yyx-title-menu', menuBgDiv) : document.getElementById('yyx-title-menu');
    if (menuEl) {
      if (onMenu) {
        // 自愈：React 重渲染可能把标题节点移掉，之后 makeTitleEl 又新建一个
        // （display:none）；旧标志还停在 true，单靠标志就再也不会显示。
        // v4 实测抓到过：返回标题画面后 #yyx-title-menu 一直是 display:none。
        // 回到封面时直接显示标题。镜头入场只在此次打开游戏时播放。
        if (!titleMenuShown || menuEl.style.display === 'none') {
          menuEl.style.display = 'block';
          menuEl.classList.toggle('yyx-cover-title-intro', !coverIntroPlayed);
          coverIntroPlayed = true;
          titleMenuShown = true;
        }
      } else if (titleMenuShown) {
        menuEl.style.display = 'none';
        titleMenuShown = false;
      }
    }
    var labels = chooseLabels();
    var onEntry = !!labels && labels.length === 2 &&
      labels.indexOf('心香') !== -1 && labels.indexOf('心碑') !== -1;
    var entryEl = onEntry ? makeTitleEl('yyx-title-entry', stage) : document.getElementById('yyx-title-entry');
    if (entryEl) {
      if (onEntry) {
        if (!titleEntryShown || entryEl.style.display === 'none') {
          entryEl.style.display = 'block';
          playTitle(entryEl);
          titleEntryShown = true;
        }
      } else if (titleEntryShown) {
        entryEl.style.display = 'none';
        titleEntryShown = false;
      }
    }
  }

  /* ================= 3. 入口屏：循环背景视频＋光点入口 ================= */
  var bgVideoMounted = false;
  function updateEntryScreen() {
    var labels = chooseLabels();
    var onEntry = !!labels && labels.length === 2 &&
      labels.indexOf('心香') !== -1 && labels.indexOf('心碑') !== -1;
    var c = document.querySelector('[class*="chooseContainer"]');
    if (c) {
      if (onEntry) c.classList.add('yyx-entry-choose');
      else c.classList.remove('yyx-entry-choose');
    }
    var st = stage();
    if (!st) return;
    var v = document.getElementById('yyx-bg-video');
    // 自愈：视频挂在舞台上（React 管辖），重渲染可能把它移掉；若标志还在、
    // 节点却没了，复位标志让下面重新挂载（否则入口屏只剩静态底图）。
    if (bgVideoMounted && !v) bgVideoMounted = false;
    if (onEntry && !bgVideoMounted) {
      if (!v) {
        v = document.createElement('video');
        v.id = 'yyx-bg-video';
        v.src = 'game/video/home-opening.mp4';
        v.loop = true;
        v.muted = true;
        v.playsInline = true;
        v.autoplay = true;
        st.appendChild(v);
      }
      var pr = v.play();
      if (pr && typeof pr.catch === 'function') pr.catch(function () {});
      bgVideoMounted = true;
    } else if (!onEntry && bgVideoMounted) {
      if (v && v.parentNode) v.parentNode.removeChild(v);
      bgVideoMounted = false;
    }
  }

  /* ================= 4. 视频字幕层 ================= */
  window.__yyxSubtitle = {
    show: function (name, body) {
      var st = stage();
      if (!st) return;
      var el = document.getElementById('yyx-video-subtitle');
      if (!el) {
        el = document.createElement('div');
        el.id = 'yyx-video-subtitle';
        el.innerHTML = '<div class="yyx-sub-name"></div><div class="yyx-sub-body"></div>';
        st.appendChild(el);
      }
      var n = el.querySelector('.yyx-sub-name');
      var b = el.querySelector('.yyx-sub-body');
      if (n) n.textContent = name || '';
      if (b) b.textContent = body || '';
      el.style.display = 'block';
    },
    hide: function () {
      var el = document.getElementById('yyx-video-subtitle');
      if (el) el.style.display = 'none';
    },
  };

  /* ================= 5. 返回按钮＋自动导航 ================= */
  function galleryVisible() {
    var g = document.querySelector('[class*="_extra_top_"]');
    return !!g && visible(g);
  }
  function settingsVisible() {
    var o = document.querySelector('[class*="_Options_main_"]');
    return !!o && visible(o);
  }
  function langVisible() {
    var els = document.querySelectorAll('div');
    for (var i = 0; i < els.length; i++) {
      if (textOf(els[i]) === '简体中文' && visible(els[i])) return true;
    }
    return false;
  }
  function currentPage() {
    if (galleryVisible()) return 'gallery';
    if (settingsVisible()) return 'settings';
    var te = document.querySelector('.html-body__title-enter');
    if (te && visible(te)) return 'title-enter';
    if (langVisible()) return 'language';
    if (menuVisible('开始') || menuVisible('开始游戏')) return 'title';
    var labels = chooseLabels();
    if (labels && labels.length) {
      if (labels.length === 2 && labels.indexOf('心香') !== -1 && labels.indexOf('心碑') !== -1) return 'entry';
      if (labels.length >= 5 && /^G0\d《/.test(labels[0])) return 'menu-grandma';
      if (labels.length >= 5 && /^M0\d《/.test(labels[0])) return 'menu-mama';
      if (labels.indexOf('全篇尾声') !== -1) {
        if (labels.indexOf('听心碑') !== -1) return 'end-grandma';
        if (labels.indexOf('听心香') !== -1) return 'end-mama';
        return 'end';
      }
      if (labels.indexOf('重听尾声') !== -1) return 'finale';
      return 'story-choose';
    }
    if (textBox() && visible(textBox())) return 'story';
    return 'other';
  }
  /* 核验调试出口：返回当前页（entry/menu-grandma/menu-mama/story/
     story-choose/end-grandma/end-mama/finale/gallery/settings/title/
     title-enter/language/other），供 design/verify_full.py 用。 */
  window.__yyxPage = function () { return currentPage(); };
  // 返回目标：story→本线目录；目录→入口屏；入口屏→标题画面；
  // 结束界面→本线目录；图集／设置→标题画面
  function backTarget(page) {
    if (page === 'entry') return 'title';
    if (page === 'menu-grandma' || page === 'menu-mama') return 'start';
    if (page === 'story' || page === 'story-choose') {
      var key = (window.__yyxCard && window.__yyxCard.key) || '';
      var line = null;
      if (/^G/.test(key)) line = 'grandma';
      else if (/^M/.test(key)) line = 'mama';
      else {
        try { line = sessionStorage.getItem('yyx-line'); } catch (e) {}
      }
      if (line === 'grandma') return 'menu-grandma';
      if (line === 'mama') return 'menu-mama';
      return 'start';
    }
    if (page === 'end-grandma') return 'menu-grandma';
    if (page === 'end-mama') return 'menu-mama';
    if (page === 'finale') {
      var lastEnd = null;
      try { lastEnd = sessionStorage.getItem('yyx-last-end'); } catch (e) {}
      if (lastEnd === 'grandma') return 'menu-grandma';
      if (lastEnd === 'mama') return 'menu-mama';
      return 'start';
    }
    if (page === 'gallery' || page === 'settings') return 'title';
    return null;
  }
  function videoPlaying() {
    return !!(
      document.getElementById('fx-video-layer') ||
      document.getElementById('g02-video-layer') ||
      document.getElementById('playVideoElement')
    );
  }
  function ensureBackBtn() {
    /* 返回按钮挂在 body 下、fixed 定位、z-index 9999：它必须压过所有覆盖层
       （设置屏、图集都是舞台的兄弟层，舞台子元素会被它们盖住、点不到）。
       固定在屏幕左上角、屏幕像素尺寸，各页位置一致，老人好找。 */
    var btn = document.getElementById('yyx-back-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'yyx-back-btn';
      btn.textContent = '‹ 返回';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        goBack();
      });
      document.body.appendChild(btn);
    }
    return btn;
  }
  function updateBackBtn() {
    var btn = ensureBackBtn();
    if (!btn) return;
    var page = currentPage();
    // 记一下当前线（供故事页返回用）与最后到过的结束屏（供尾声页返回用）
    if (page === 'menu-grandma' || page === 'end-grandma') {
      try { sessionStorage.setItem('yyx-line', 'grandma'); } catch (e) {}
    } else if (page === 'menu-mama' || page === 'end-mama') {
      try { sessionStorage.setItem('yyx-line', 'mama'); } catch (e) {}
    }
    if (page === 'end-grandma') {
      try { sessionStorage.setItem('yyx-last-end', 'grandma'); } catch (e) {}
    } else if (page === 'end-mama') {
      try { sessionStorage.setItem('yyx-last-end', 'mama'); } catch (e) {}
    }
    var target = backTarget(page);
    // 标题画面／标题入口／语言选择没有上一级；播视频时跳过优先，返回暂隐
    if (!target || videoPlaying()) {
      btn.style.display = 'none';
      btn.dataset.target = '';
      return;
    }
    btn.dataset.target = target;
    btn.style.display = 'block';
  }
  function showReturning(show, text) {
    var el = document.getElementById('yyx-returning');
    if (show) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'yyx-returning';
        document.body.appendChild(el);
      }
      el.textContent = text || '正在返回…';
      el.style.display = 'flex';
    } else if (el) {
      el.style.display = 'none';
    }
  }
  /* ================= v4 第 3 项：返回不重载 =================
     旧 goBack() 写 yyx-goto → reload → navStep 一步步重走，用户看到的就是
     “回到初始页再自动重走”＋长时间白屏。新做法：直接用引擎自己的机制切页。
     引擎切场景的原生路（choose 点击）只在故事内有效，直跳目录没有公开入口；
     但 Redux store 可以从 React fiber 上找到（#root 的 __reactContainer$），
     dispatch 实测有效（2026-11-19：userData/setGlobalVar 后底栏立即出现
     “流程图”按钮）。所以：
       - 到标题画面：优先直接 dispatch gui/setVisibility（showTitle=true，
         并关掉图集／设置覆盖层）——实测从剧情页 9ms 到标题画面，BGM 会随
         标题渲染自己停掉，标题画面干净、点“开始”正常；dispatch 不到时才退回
         底栏“标题”按钮＋确认框（引擎 wO）。旧的纯按钮路线要 2–3.5 秒：对话框
         在入口屏／剧情页要 1–3 秒才出现（底栏按钮点按后主线程有约 1 秒长任务），
         等的全是它；且初版 dialogButton 按 span 找按钮永远找不到、对话框会
         残留盖住标题屏（已修：按钮是 div）。
       - 结束界面→本线目录：直接点现成的 choose 选项“重听心香／重听心碑”
         （引擎 choose 切场景，不重载）。
       - 剧情→本线目录、目录→入口屏：引擎没有直跳入口，折中为无重载、遮罩后
         隐藏重走（标题按钮＋是 → 标题画面 → 点“开始” → 入口屏 → 点光点），
         全程不 reload，用户只看到“正在返回…”遮罩。汇报里如实写明这是折中。
       - 尾声→本线目录：点“回到首页”→ 入口屏 → 点光点（两步 choose，不重载）。
     “继续”恢复（startResume）本来就是重载＋导航，是另一条路，不动。
     每次返回的耗时记在 window.__yyxBackTimings（供核验读）。 */
  var yyxStore = null;
  // 候选对象本身就是 store（有 dispatch/getState），或是 React-Redux v9 的
  // Provider value（{store, subscription, ...}，store 藏在 .store 里）
  function storeFromCandidate(c) {
    if (!c || typeof c !== 'object') return null;
    if (typeof c.dispatch === 'function' && typeof c.getState === 'function') return c;
    if (c.store && typeof c.store.dispatch === 'function' && typeof c.store.getState === 'function') return c.store;
    return null;
  }
  function findStore() {
    if (yyxStore) {
      try { yyxStore.getState(); return yyxStore; } catch (e) { yyxStore = null; }
    }
    var root = document.getElementById('root');
    if (!root) return null;
    var key = null;
    for (var k in root) {
      if (k.indexOf('__reactContainer$') === 0) { key = k; break; }
    }
    if (!key) return null;
    var start = root[key];
    var queue = [start];
    var seen = new Set();
    var checked = 0;
    while (queue.length && checked < 3000) {
      var f = queue.shift();
      if (!f || seen.has(f)) continue;
      seen.add(f);
      checked += 1;
      var candidates = [];
      if (f.memoizedProps && f.memoizedProps.value) candidates.push(f.memoizedProps.value);
      // context 依赖链：dependencies.firstContext 起，顺 .next 找下去
      var dep = f.dependencies && f.dependencies.firstContext;
      while (dep) {
        if (dep.memoizedValue) candidates.push(dep.memoizedValue);
        dep = dep.next;
      }
      for (var i = 0; i < candidates.length; i++) {
        var found = storeFromCandidate(candidates[i]);
        if (found) {
          yyxStore = found;
          window.__yyxStore = found;
          return found;
        }
      }
      if (f.child) queue.push(f.child);
      if (f.sibling) queue.push(f.sibling);
    }
    return null;
  }
  function guiVisibility(component, visibility) {
    var st = findStore();
    if (!st) return false;
    try {
      st.dispatch({ type: 'gui/setVisibility', payload: { component: component, visibility: visibility } });
      return true;
    } catch (e) { return false; }
  }
  // 底栏按钮（被 CSS 藏起但仍在 DOM 里）：按 span 精确文本找，el.click() 可点
  function barButton(label) {
    var bar = document.querySelector('[class*="_main_rdjpk_"]');
    if (!bar) return null;
    var spans = bar.querySelectorAll('span');
    for (var i = 0; i < spans.length; i++) {
      if (textOf(spans[i]) === label) return spans[i];
    }
    return null;
  }
  // 全局确认框（_GlobalDialog_main_）里的按钮。必须限定在框内找：
  // 对白文字是逐字 span，框外搜“是”会误点到对白里的“是”字、推进剧情。
  // 注意：框内按钮是 div（_button_…，文本就是“是”/“否”），不是 span——
  // v4 初版按 span 找永远找不到，会走到 dispatch 退路且对话框残留盖住标题屏，
  // 2026-11-19 实测抓到过（elementFromPoint 在“开始”按钮上命中的仍是对话框）。
  function dialogButton(label) {
    var dlg = document.querySelector('[class*="_GlobalDialog_main_"]');
    if (!dlg) return null;
    var divs = dlg.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
      if (textOf(divs[i]) === label && visible(divs[i])) return divs[i];
    }
    return null;
  }
  function waitForPage(page, timeoutMs) {
    var deadline = Date.now() + (timeoutMs || 3000);
    return new Promise(function (resolve) {
      (function poll() {
        if (currentPage() === page) { resolve(true); return; }
        if (Date.now() > deadline) { resolve(false); return; }
        setTimeout(poll, 50);
      })();
    });
  }
  function waitFor(fn, timeoutMs) {
    var deadline = Date.now() + (timeoutMs || 2000);
    return new Promise(function (resolve) {
      (function poll() {
        var v = null;
        try { v = fn(); } catch (e) {}
        if (v) { resolve(v); return; }
        if (Date.now() > deadline) { resolve(null); return; }
        setTimeout(poll, 50);
      })();
    });
  }
  // 到标题画面：优先直接 dispatch GUI 显示标题（实测从剧情页 9ms 到标题画面，
  // BGM 会随标题渲染自己停掉，标题画面干净、点“开始”正常）。
  // 旧做法（点底栏“标题”按钮＋确认框，等引擎 wO）要 2–3.5 秒：对话框本身在
  // 入口屏／剧情页要 1–3 秒才出现（底栏按钮点按后主线程有约 1 秒长任务，实测
  // longtask 1001ms；同一个对话框从标题画面点只要 122ms），等的全是它。
  // dispatch 不到标题时，再退回到底栏按钮＋确认框（引擎 wO）那条路。
  // 返回 Promise，resolve 为走通的路线（'dispatch-title'／'bar-title'）或 null（都失败）。
  function goToTitleViaBar() {
    var dispatched = goToTitleViaDispatchSync();
    if (dispatched) {
      return waitForPage('title', 800).then(function (shown) {
        if (shown) return 'dispatch-title';
        return goToTitleViaDialog();
      });
    }
    return goToTitleViaDialog();
  }
  function goToTitleViaDispatchSync() {
    var a = guiVisibility('showExtra', false);
    var b = guiVisibility('showMenuPanel', false);
    var c = guiVisibility('showTitle', true);
    return !!(a || b || c);
  }
  function goToTitleViaDialog() {
    return new Promise(function (resolve) {
      var btn = barButton('标题');
      if (btn) {
        try { btn.click(); } catch (e) {}
        waitFor(function () { return dialogButton('是'); }, 4000).then(function (yes) {
          if (yes) {
            try { yes.click(); } catch (e) {}
            // 点“是”后 wO 只切标题 GUI，不管图集／设置覆盖层——覆盖层还开着时
            // currentPage() 仍报 gallery/settings、看不到标题画面，所以先关掉它们再等标题
            // （不先关会等满 3 秒超时、再走 dispatch 退路，白白多等 3 秒）。
            finishTitleCleanup();
            waitForPage('title', 3000).then(function (ok) {
              if (ok) { resolve('bar-title'); return; }
              goToTitleViaDispatch().then(function (ok2) { resolve(ok2 ? 'bar-title' : null); });
            });
          } else {
            goToTitleViaDispatch().then(function (ok2) { resolve(ok2 ? 'bar-title' : null); });
          }
        });
      } else {
        goToTitleViaDispatch().then(function (ok2) { resolve(ok2 ? 'bar-title' : null); });
      }
    });
  }
  function finishTitleCleanup() {
    // wO 不碰图集/设置覆盖层，顺手关掉，免得标题画面上残留
    guiVisibility('showExtra', false);
    guiVisibility('showMenuPanel', false);
  }
  function goToTitleViaDispatch() {
    guiVisibility('showExtra', false);
    guiVisibility('showMenuPanel', false);
    guiVisibility('showTitle', true);
    return waitForPage('title', 3000);
  }
  var backWalkActive = false; // 隐藏重走进行中：autoChoose/navStep/resumeAdvance 暂停
  window.__yyxBackTimings = window.__yyxBackTimings || [];
  function recordBack(from, target, ms, route, ok, note) {
    var rec = { from: from, target: target, ms: Math.round(ms), route: route, ok: !!ok };
    if (note) rec.note = note;
    window.__yyxBackTimings.push(rec);
    window.__yyxLastBack = rec;
    return rec;
  }
  function endBackWalk(from, target, t0, route, ok, note) {
    backWalkActive = false;
    showReturning(false);
    // v4 返回不再写 yyx-goto；顺手清掉旧残留（没有待恢复时才清，免得动“继续”的恢复）
    try { if (!readResume()) localStorage.removeItem('yyx-goto'); } catch (e) {}
    return recordBack(from, target, performance.now() - t0, route, ok, note);
  }
  function goBack() {
    var btn = document.getElementById('yyx-back-btn');
    var from = currentPage();
    // 目标优先读按钮的 data-target（由 updateBackBtn 按当前页写好）；
    // 若数据集还没来得及写（刚重载完就点），按当前页现算一个，
    // 免得快点之下点下去没反应。
    var target = (btn && btn.dataset.target) || backTarget(from);
    if (!target) return Promise.resolve(null);
    var t0 = performance.now();
    // 结束界面→本线目录：单步 choose 直跳，不用遮罩、不重载
    if ((from === 'end-grandma' && target === 'menu-grandma') ||
        (from === 'end-mama' && target === 'menu-mama')) {
      var label = from === 'end-grandma' ? '重听心香' : '重听心碑';
      var opt = chooseOptionEl(label);
      if (!opt) {
        return Promise.resolve(recordBack(from, target, performance.now() - t0, 'choose-direct', false, '找不到选项 ' + label));
      }
      try { opt.click(); } catch (e) {}
      return waitForPage(target, 3000).then(function (ok) {
        return recordBack(from, target, performance.now() - t0, 'choose-direct', ok,
          ok ? '' : '选项点了但目标页未出现');
      });
    }
    // 尾声→本线目录／入口屏：点“回到首页”→ 入口屏 →（需要时）点光点
    if (from === 'finale') {
      backWalkActive = true;
      showReturning(true);
      var line = target === 'menu-grandma' ? '心香' : (target === 'menu-mama' ? '心碑' : null);
      var home = chooseOptionEl('回到首页');
      if (!home) {
        return Promise.resolve(endBackWalk(from, target, t0, 'finale-home', false, '找不到“回到首页”选项'));
      }
      try { home.click(); } catch (e) {}
      return waitForPage('entry', 3000).then(function (okEntry) {
        if (!okEntry) return endBackWalk(from, target, t0, 'finale-home', false, '点“回到首页”后未到入口屏');
        if (!line) return endBackWalk(from, target, t0, 'finale-home', true, '');
        var opt2 = chooseOptionEl(line);
        if (!opt2) return endBackWalk(from, target, t0, 'finale-home', false, '入口屏找不到光点 ' + line);
        try { opt2.click(); } catch (e) {}
        return waitForPage(target, 3000).then(function (okMenu) {
          return endBackWalk(from, target, t0, 'finale-home', okMenu, okMenu ? '' : '点光点后未到目录');
        });
      });
    }
    // 到标题画面：设置／图集／入口屏
    if (target === 'title') {
      backWalkActive = true;
      showReturning(true);
      return goToTitleViaBar().then(function (route) {
        return endBackWalk(from, target, t0, route || 'bar-title', !!route,
          route ? '' : 'dispatch 与底栏对话框均未到达标题画面');
      });
    }
    // 剧情→本线目录、目录→入口屏：遮罩后隐藏重走（引擎无直跳入口，见节首注释）
    backWalkActive = true;
    showReturning(true);
    var line2 = target === 'menu-grandma' ? '心香' : (target === 'menu-mama' ? '心碑' : null);
    return goToTitleViaBar().then(function (route) {
      if (!route) return endBackWalk(from, target, t0, 'hidden-rewalk', false, '第一步未到标题画面');
      var startBtn = menuItem('开始') || menuItem('开始游戏');
      if (!startBtn) return endBackWalk(from, target, t0, 'hidden-rewalk', false, '标题画面找不到“开始”');
      try { startBtn.click(); } catch (e) {}
      return waitForPage('entry', 3000).then(function (okEntry) {
        if (!okEntry) return endBackWalk(from, target, t0, 'hidden-rewalk', false, '点“开始”后未到入口屏');
        if (target === 'start') return endBackWalk(from, target, t0, 'hidden-rewalk', true, '');
        if (!line2) return endBackWalk(from, target, t0, 'hidden-rewalk', false, '未知的返回目标 ' + target);
        var opt3 = chooseOptionEl(line2);
        if (!opt3) return endBackWalk(from, target, t0, 'hidden-rewalk', false, '入口屏找不到光点 ' + line2);
        try { opt3.click(); } catch (e) {}
        return waitForPage(target, 3000).then(function (okMenu) {
          return endBackWalk(from, target, t0, 'hidden-rewalk', okMenu, okMenu ? '' : '点光点后未到目录');
        });
      });
    });
  }
  window.__yyxGoBack = goBack; // 核验出口：返回 Promise，resolve 为本次返回的计时记录
  window.__yyxFindStore = findStore; // 核验出口：返回 Redux store（供测试解锁 CG 等用）
  /* ============ 1b. 继续：自动书签恢复（第 1 项） ============
     引擎的“继续”回到最后状态——回过目录后它会回到目录，不是故事卡，
     所以“继续”改由自动书签（yyx-bookmark-v1）恢复：拦截继续的点击，
     记下要回的卡（yyx-resume），重载后导航到该篇，再自动快进到该卡。
     没听过（无书签）时不拦截，引擎自己把它置灰不可点。 */
  function readBookmark() {
    try {
      var raw = localStorage.getItem('yyx-bookmark-v1');
      if (!raw) return null;
      var bm = JSON.parse(raw);
      return (bm && bm.card) ? bm : null;
    } catch (e) { return null; }
  }
  function readResume() {
    try { return localStorage.getItem('yyx-resume') || null; } catch (e) { return null; }
  }
  function clearResume() {
    try { localStorage.removeItem('yyx-resume'); } catch (e) {}
    try { localStorage.removeItem('yyx-goto'); } catch (e) {}
    nav.target = null;
    showReturning(false);
  }
  function startResume(cardKey) {
    try { localStorage.setItem('yyx-resume', cardKey); } catch (e) {}
    var line = cardKey.charAt(0) === 'G' ? 'menu-grandma' : 'menu-mama';
    try { localStorage.setItem('yyx-goto', line); } catch (e) {}
    showReturning(true, '正在回到上次听到的地方…');
    location.reload();
  }
  // 按前缀找选项的标签 div（如 'G01' → G01《…》那项）
  function chooseOptionElByPrefix(prefix) {
    var c = document.querySelector('[class*="chooseContainer"]');
    if (!c) return null;
    var divs = c.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
      var d = divs[i];
      if (d.children.length !== 0) continue;
      if (textOf(d).indexOf(prefix) === 0) return d;
    }
    return null;
  }
  // 点画面推进（#FullScreenClick，全套合成事件；单发 el.click() 推不动，
  // 2026-11-19 实测：必须 pointerdown/mousedown/pointerup/mouseup/click 全套）
  function advanceStage() {
    var el = document.getElementById('FullScreenClick');
    if (!el) return;
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var init = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window, button: 0 };
    try {
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window, button: 0, pointerId: 1, isPrimary: true }));
      el.dispatchEvent(new MouseEvent('mousedown', init));
      el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX: cx, clientY: cy, view: window, button: 0, pointerId: 1, isPrimary: true }));
      el.dispatchEvent(new MouseEvent('mouseup', init));
      el.dispatchEvent(new MouseEvent('click', init));
    } catch (e) {}
  }
  /* 自动导航：重载后按 yyx-goto 一步步点到目标（只往下走：标题→开始→入口屏→点光点→目录） */
  var nav = { target: null, startedAt: 0 };
  function navStep() {
    if (backWalkActive) return; // v4 返回正在隐藏重走，别插手
    if (!nav.target) return;
    var page = currentPage();
    var resumeCard = readResume();
    var done = false;
    if (nav.target === 'title' && page === 'title') done = true;
    if (nav.target === 'start' && page === 'entry') done = true;
    // 有未完成的恢复时，到目录不算完——还要点进该篇（下面处理），快进由 resumeAdvance 接手
    if (nav.target === 'menu-grandma' && page === 'menu-grandma' && !resumeCard) done = true;
    if (nav.target === 'menu-mama' && page === 'menu-mama' && !resumeCard) done = true;
    if (done || Date.now() - nav.startedAt > 25000) {
      try { localStorage.removeItem('yyx-goto'); } catch (e) {}
      nav.target = null;
      showReturning(false);
      return;
    }
    if (page === 'title-enter') {
      var te = document.querySelector('.html-body__title-enter');
      if (te) te.click();
    } else if (page === 'language') {
      var els = document.querySelectorAll('div');
      for (var i = 0; i < els.length; i++) {
        if (textOf(els[i]) === '简体中文' && visible(els[i])) { els[i].click(); break; }
      }
    } else if (page === 'title') {
      if (nav.target !== 'title') {
        var item = menuItem('开始') || menuItem('开始游戏');
        if (item) item.click();
      }
    } else if (page === 'entry') {
      if (nav.target === 'menu-grandma' || nav.target === 'menu-mama') {
        var label = nav.target === 'menu-grandma' ? '心香' : '心碑';
        var opt = chooseOptionEl(label);
        if (opt) opt.click();
      }
    } else if ((page === 'menu-grandma' || page === 'menu-mama') && resumeCard) {
      // 恢复：到目录后点进该篇（目标卡所在篇）
      var storyPrefix = resumeCard.split('-')[0];
      var storyOpt = chooseOptionElByPrefix(storyPrefix);
      if (storyOpt) storyOpt.click();
    }
    // 其余页面（story/gallery/settings 等）重载后本不该出现；等下一轮或超时收尾
  }
  /* 恢复快进：已进剧情后，自动跳过视频、点画面推进，直到回到书签卡 */
  var resumeState = { lastCard: '', cardSince: 0, lastAdvanceAt: 0, advances: 0, startedAt: 0 };
  function resumeAdvance() {
    if (backWalkActive) return; // v4 返回正在隐藏重走，别插手
    var target = readResume();
    if (!target) return;
    if (!resumeState.startedAt) resumeState.startedAt = Date.now();
    var page = currentPage();
    if (page !== 'story' && page !== 'story-choose') return; // 还没进剧情，等导航
    var now = Date.now();
    // 超时收尾：90 秒或 120 次推进还没到，放手（用户自己接着听）
    if (now - resumeState.startedAt > 90000 || resumeState.advances > 120) {
      clearResume();
      resumeState.startedAt = 0;
      resumeState.advances = 0;
      return;
    }
    var cur = (window.__yyxCard && window.__yyxCard.key) || '';
    if (cur === target) { // 到了
      clearResume();
      resumeState.startedAt = 0;
      resumeState.advances = 0;
      resumeState.lastCard = '';
      return;
    }
    if (cur !== resumeState.lastCard) {
      // 卡刚变，等它稳定（等打字、等视频层出现）再动，避免冲过目标卡
      resumeState.lastCard = cur;
      resumeState.cardSince = now;
      return;
    }
    if (now - resumeState.cardSince < 800) return;
    // 正在播视频：点跳过（自建层或原生层，都是普通按钮，el.click() 够用）
    var skip = document.querySelector('#fx-video-skip') || document.querySelector('#g02-video-skip') ||
               document.querySelector('#fx-native-skip') || document.querySelector('#g02-native-skip');
    if (skip && visible(skip)) { try { skip.click(); } catch (e) {} return; }
    if (videoPlaying()) return; // 视频层刚出现、跳过按钮还没就绪，等一下
    if (chooseLabels()) return; // 有选项：让 autoChoose 处理（细节/结尾）
    if (now - resumeState.lastAdvanceAt < 600) return; // 两次推进至少隔 600ms
    resumeState.lastAdvanceAt = now;
    resumeState.advances += 1;
    advanceStage();
  }

  /* ================= 6. 选项自动点（细节／G02 结尾） ================= */
  var activeAutoChoice = null;
  function foregroundVideoActive() {
    return document.querySelector('#playVideoElement,#fx-video-layer,#g02-video-layer');
  }
  function autoChoose() {
    var c = document.getElementById('chooseContainer');
    var labels = c && chooseLabels(true);
    var want = labels && labels.find(function (label) {
      return label.indexOf('看看') === 0 || label === '回到故事' ||
        label === '回到奶奶线目录' || label === '回到心香目录';
    });
    var opt = want && chooseOptionEl(want);
    // 在绘制前隐藏整组。等选项被新的剧情替换后才解除，避免点击后旧框又闪一次。
    if (c) c.classList.toggle('yyx-auto-choose', !!opt);
    if (!opt) { activeAutoChoice = null; return; }
    if (backWalkActive || foregroundVideoActive()) return;
    if (activeAutoChoice && activeAutoChoice.node === opt && activeAutoChoice.label === want) return;
    var selection = { node: opt, label: want };
    activeAutoChoice = selection;
    setTimeout(function () {
      if (activeAutoChoice !== selection) return;
      if (!opt.isConnected || !c.contains(opt) || textOf(opt) !== want ||
          backWalkActive || foregroundVideoActive()) {
        activeAutoChoice = null;
        return;
      }
      try { opt.click(); } catch (e) {}
    }, 150);
  }

  /* ================= 7. 自动书签（第 1 项） ================= */
  var lastBookmarkKey = '';
  function writeBookmark() {
    var card = window.__yyxCard;
    if (!card || !card.key) return;
    if (card.key === lastBookmarkKey) return;
    lastBookmarkKey = card.key;
    try {
      localStorage.setItem('yyx-bookmark-v1', JSON.stringify({
        card: card.key, name: card.name || '', body: card.body || '', at: Date.now(),
      }));
    } catch (e) {}
  }

  /* ================= v4 第 8 项：图集页内标题＋对话框禁用词 =================
     图集页内标题是 i18n extra.title（中文“鉴赏模式”），与 MENU_RENAME 同类机制：
     文本节点精确替换＋ tick／observer 兜底（i18n 异步填词、React 重渲染都可能还原）。
     退出确认框“确定要退出游戏吗？”含“游戏”，一并改成“确定要退出吗？”。
     其余界面文字已扫过（见汇报）：标题菜单由 MENU_RENAME 管，设置屏原文无禁用词，
     故事正文是原书文字、grep 为零。流程图面板里的 title.options.extra
     “鉴赏模式”在 v4 界面里打不开（流程图入口在被藏掉的底栏里），够不着，不改。 */
  function renameTextIn(root, from, to) {
    if (!root) return false;
    var changed = false;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if ((node.nodeValue || '').trim() === from) { node.nodeValue = to; changed = true; }
    }
    return changed;
  }
  function renameGalleryTitle() {
    var t = document.querySelector('[class*="_extra_title_"]');
    if (t) renameTextIn(t, '鉴赏模式', '图集');
  }
  function renameDialogs() {
    var dlg = document.querySelector('[class*="_GlobalDialog_main_"]');
    if (dlg) renameTextIn(dlg, '确定要退出游戏吗？', '确定要退出吗？');
  }

  /* ================= v4 第 10 项：图集分组（心香／心碑） =================
     引擎图集按 CG 的 series 分组（dNe：同 series 合并为一组 stack，按 order 排序，
     每页 8 组）。场景文件里 series 是 G01–G05／M01–M05（10 组），所以打开图集时
     把内存里的 appreciationData.cg 重排为两组（心香／心碑），并补上从未 unlockCg
     的两张：HOME-01（首页双联图，只作 changeBg）与 M04-04（锅盖特写首帧）。
     HOME-01 放心香组最前面：它没有单一归属，按左幅奶奶夜景场景归入。
     实现用引擎自己的 action（userData/setUserData，整包替换 appreciationData；
     unlockCgInUserData 只能追加、改不了已有项的 series）。只改内存：存储由引擎
     自己的保存时机（rr/My）写回；Yd 重载会还原成存储里的旧 series，但下次打开
     图集时本函数幂等重做，所以展示永远是两组。解锁记录本身（哪些图已解锁）不动。 */
  // 文件名（小写）→ 组与组内顺序。31 张已解锁 CG 按场景 unlock 顺序排；
  // HOME-01 心香第 0 位；M04-04 心碑第 12 位（M04-03 之后）。
  var GALLERY_GROUP_OF = {
    'home-opening_videoframe.png': ['心香', 0],
    'g01-kang_videoframe.png': ['心香', 1],
    'g01-room_videoframe.png': ['心香', 2],
    'g01-quilt_videoframe.png': ['心香', 3],
    'g02-01_videoframe.png': ['心香', 4],
    'g02-02_videoframe.png': ['心香', 5],
    'g02-03_videoframe.png': ['心香', 6],
    'g02-04_videoframe.png': ['心香', 7],
    'g03-doorway_videoframe.png': ['心香', 8],
    'g03-bowl_videoframe.png': ['心香', 9],
    'g03-bellows_videoframe.png': ['心香', 10],
    'g04-fire_videoframe.png': ['心香', 11],
    'g04-after_videoframe.png': ['心香', 12],
    'g04-chest_videoframe.png': ['心香', 13],
    'g05-carry_videoframe.png': ['心香', 14],
    'g05-road_videoframe.png': ['心香', 15],
    'g05-plaza_videoframe.png': ['心香', 16],
    'm01-young-mother_videoframe.png': ['心碑', 0],
    'm01-books_videoframe.png': ['心碑', 1],
    'm01-interior_videoframe.png': ['心碑', 2],
    'm02-diary_videoframe.png': ['心碑', 3],
    'm02-hands_videoframe.png': ['心碑', 4],
    'm02-pages_videoframe.png': ['心碑', 5],
    'm03-schoolhouse_videoframe.png': ['心碑', 6],
    'm03-classroom_videoframe.png': ['心碑', 7],
    'm03-desk_videoframe.png': ['心碑', 8],
    'm04-01_videoframe.png': ['心碑', 9],
    'm04-02_videoframe.png': ['心碑', 10],
    'm04-03_videoframe.png': ['心碑', 11],
    'm04-04_videoframe.png': ['心碑', 12],
    'm05-talk_videoframe.png': ['心碑', 13],
    'm05-study_videoframe.png': ['心碑', 14],
    'm05-books_videoframe.png': ['心碑', 15],
  };
  var GALLERY_EXTRA_NAMES = {
    'home-opening_videoframe.png': '首页双联',
    'm04-04_videoframe.png': '锅盖特写', // 键是小写文件名；URL 用真文件名 M04-04（区分大小写，见下）
  };
  function galleryFileOf(url) {
    var u = String(url || '').replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    var parts = u.split('/');
    return (parts[parts.length - 1] || '').toLowerCase();
  }
  function galleryGroupOfFile(file) {
    var hit = GALLERY_GROUP_OF[file];
    if (hit) return hit;
    if (/^g0[1-5]/.test(file)) return ['心香', 99];
    if (/^m0[1-5]/.test(file)) return ['心碑', 99];
    return null;
  }
  // 理想的 cg 数组（心香组在前、心碑组在后，组内按 order 排）
  function galleryDesiredCg(cg) {
    var list = (cg || []).slice();
    var have = {};
    list.forEach(function (it) { have[galleryFileOf(it.url)] = true; });
    // 补两张从未 unlockCg 的图（url 前缀沿用已有项的格式：场景里 unlockCg 只写裸文件名）
    var prefix = '';
    if (list.length && list[0].url) {
      var u = String(list[0].url);
      var idx = u.lastIndexOf('/');
      if (idx !== -1) prefix = u.slice(0, idx + 1);
    }
    ['home-opening_videoframe.png', 'M04-04_videoframe.png'].forEach(function (f) {
      if (!have[galleryFileOf(f)]) {
        list.push({ name: GALLERY_EXTRA_NAMES[galleryFileOf(f)], url: prefix + f, series: '', order: 0 });
      }
    });
    var desired = list.map(function (it) {
      var file = galleryFileOf(it.url);
      var g = galleryGroupOfFile(file);
      if (!g) return { name: it.name, url: it.url, series: it.series, order: it.order };
      return { name: it.name, url: it.url, series: g[0], order: g[1] };
    });
    desired.sort(function (a, b) {
      if (a.series === b.series) return (a.order || 0) - (b.order || 0);
      if (a.series === '心香') return -1;
      if (b.series === '心香') return 1;
      return String(a.series).localeCompare(String(b.series));
    });
    return desired;
  }
  function galleryGroupingApplied(cg) {
    if (!cg || !cg.length) return false;
    var desired = galleryDesiredCg(cg);
    if (desired.length !== cg.length) return false;
    for (var i = 0; i < cg.length; i++) {
      if (cg[i].url !== desired[i].url || cg[i].series !== desired[i].series || (cg[i].order || 0) !== (desired[i].order || 0)) return false;
    }
    return true;
  }
  // ---- 持久化：把分组后的 userData 写回引擎自己的本地存储 ----
  // 引擎用 localforage（IndexedDB 'localforage' 库、'keyvaluepairs' 表、键为
  // game/config.txt 的 Game_key）存 userData，引擎自己的 rr() 就是往这里写
  // （As.setItem(R.gameKey, getState().userData)）。注入层改了内存里的 cg 分组
  // 后必须同步写回去，否则引擎的 Yd（读存储重载，见下）会把内存洗回旧的存盘值。
  // 写的是引擎自己形状的完整 userData 对象（不是局部字段），与 rr() 等价。
  var YYX_GAME_KEY = 'yyxG02skeleton20261117'; // game/config.txt: Game_key
  var persistTimer = null;
  function yyxPersistUserData() {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(function () {
      persistTimer = null;
      var st = findStore();
      var ud = null;
      try { ud = st && st.getState().userData; } catch (e) {}
      if (!ud || !ud.appreciationData) return;
      try {
        var req = window.indexedDB.open('localforage');
        req.onsuccess = function () {
          var db = req.result;
          try {
            var tx = db.transaction('keyvaluepairs', 'readwrite');
            tx.objectStore('keyvaluepairs').put(ud, YYX_GAME_KEY);
            tx.oncomplete = function () { try { db.close(); } catch (e) {} };
            tx.onerror = function () { try { db.close(); } catch (e) {} };
          } catch (e) { try { db.close(); } catch (e2) {} }
        };
        req.onerror = function () {};
      } catch (e) {}
    }, 300);
  }
  // ---- 防 Yd 洗掉：图集会话内的 cg 快照 ----
  // 引擎的 Yd（gui/setVisibility 与 setMenuPanelTag 的 reducer 里调用，防抖 100ms
  // 后读 IndexedDB、dispatch userData/resetUserData）会在打开图集后约 1–3 秒
  // 把内存 cg 洗回存盘值。存盘若是旧的（测试里合成解锁从未存盘、存盘为空），
  // 内存的解锁就丢了：全屏查看会自己关掉、翻页走到一半失败（2026-11-19 实测：
  // resetUserData 的 payload cgLen=0，随后分组只剩补的两张图）。
  // 对策（都在注入层，不动引擎）：① 分组后立即把 userData 写回存盘（上文），
  // 使 Yd 读回的也是分组后的值；② 会话内快照：图集打开后记下分组好的 cg，
  // tick 里一旦发现内存 cg 比快照短（被洗掉了），就用快照恢复内存并重写存盘。
  // 快照只在一次图集打开期间有效（离开图集即清掉），所以设置屏“清除所有数据”
  // 不会被复活；图集内不可能新解锁（解锁只发生在剧情里），快照只会短不会错。
  var gallerySessionCg = null; // [{name,url,series,order}]，本会话分组好的 cg
  var galleryWasOpen = false;
  var galleryLastOpenIdx = -1; // 全屏查看打开时记下的 flat 下标（用于洗掉后重开）
  function gallerySnapshotCg(cg) {
    return (cg || []).map(function (it) {
      return { name: it.name, url: it.url, series: it.series, order: it.order };
    });
  }
  function ensureGalleryGrouping() {
    var st = findStore();
    if (!st) return false;
    var ud = null;
    try { ud = st.getState().userData; } catch (e) { return false; }
    var app = ud && ud.appreciationData;
    if (!app || !app.cg) return false;
    // 内存被洗空、但本会话快照还在：别急着用“补两张图”去修（那会把解锁丢光），
    // 交给下面的快照恢复（updateGallery 里做）。
    if (!app.cg.length && gallerySessionCg && gallerySessionCg.length) return false;
    if (galleryGroupingApplied(app.cg)) return true;
    var desired = galleryDesiredCg(app.cg);
    try {
      st.dispatch({ type: 'userData/setUserData', payload: { key: 'appreciationData', value: { bgm: app.bgm || [], cg: desired } } });
      yyxPersistUserData();
      return true;
    } catch (e) { return false; }
  }
  // 组标题：插在每组 stack 之前（按 stack 里首张图的归属判定，不依赖顺序）。
  // 先清理残留标题：React 重渲染移掉 stack 时，不属于它的标题节点会残留下来
  // （孤儿标题，或跟错了组的标题），不清理就会越积越多、组名错位。
  // stack 里首张图的归属：背景图在 stack-item 的子 div 上（不是 stack 本身），
  // 要扫后代 div、找带 backgroundImage 的那一个；单图组则直接是子 div。
  function galleryStackGroup(st) {
    var divs = st.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
      var bg = window.getComputedStyle(divs[i]).backgroundImage || '';
      if (bg && bg !== 'none') {
        var g = galleryGroupOfFile(galleryFileOf(bg));
        return g ? g[0] : null;
      }
    }
    return null;
  }
  function insertGroupTitles() {
    var cont = document.querySelector('[class*="_cgContainer_"]');
    if (!cont) return;
    var titles = cont.querySelectorAll('.yyx-gallery-group-title');
    for (var k = 0; k < titles.length; k++) {
      var t = titles[k];
      var nx = t.nextElementSibling;
      var keep = false;
      if (nx && String(nx.className || '').indexOf('_cgElement_') !== -1) {
        keep = galleryStackGroup(nx) === t.textContent;
      }
      if (!keep && t.parentNode) t.parentNode.removeChild(t);
    }
    var stacks = cont.querySelectorAll('[class*="_cgElement_"]');
    for (var i = 0; i < stacks.length; i++) {
      var st = stacks[i];
      var g = galleryStackGroup(st);
      if (!g) continue;
      var prev = st.previousElementSibling;
      if (prev && prev.classList && prev.classList.contains('yyx-gallery-group-title') &&
          prev.textContent === g) continue;
      var title = document.createElement('div');
      title.className = 'yyx-gallery-group-title';
      title.textContent = g;
      cont.insertBefore(title, st);
    }
  }

  /* ================= v4 第 9 项：图集上一张／下一张 =================
     引擎全屏查看（cNe）本来只有“点图进组内下一张、到组尾点图关闭”，没有上一张、
     没有跨组切换。本实现在全屏查看时显示一对固定按钮（屏幕左右，手机竖屏可点），
     点按驱动引擎自己的切换：组内前进 = 点全屏图；跨组／后退 = 关掉全屏 → 点目标
     组的 stack 打开 → 再点图推进到目标张。每步等 React 落定（约 250ms）再走下一步，
     失败就停在原地（不丢状态）。到头／尾循环：最后一张的下一张是第一张，
     第一张的上一张是最后一张。 */
  function galleryFlatList() {
    var st = findStore();
    var cg = null;
    try { cg = st && st.getState().userData.appreciationData.cg; } catch (e) {}
    if (!cg || !cg.length) return [];
    return galleryDesiredCg(cg).map(function (it) {
      return { url: it.url, file: galleryFileOf(it.url), name: it.name, series: it.series, order: it.order };
    });
  }
  function galleryFullView() {
    var cont = document.querySelector('[class*="_showFullContainer_"]');
    if (!cont || !visible(cont)) return null;
    return cont;
  }
  function galleryCurrentImageFile() {
    var cont = galleryFullView();
    if (!cont) return null;
    var main = cont.querySelector('[class*="_showFullCgMain_"]');
    if (!main) return null;
    var vid = main.querySelector('video');
    if (vid && vid.getAttribute('src')) return galleryFileOf(vid.getAttribute('src'));
    var div = main.querySelector('div');
    if (div) {
      var cs = window.getComputedStyle(div);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return galleryFileOf(cs.backgroundImage);
    }
    return null;
  }
  function galleryCurrentFlatIndex() {
    var file = galleryCurrentImageFile();
    if (!file) return -1;
    var list = galleryFlatList();
    for (var i = 0; i < list.length; i++) if (list[i].file === file) return i;
    return -1;
  }
  var galleryNav = { busy: false, timer: null };
  window.__yyxLastGalleryNav = null;
  function galleryNavButtons() {
    var prev = document.getElementById('yyx-gallery-prev');
    var next = document.getElementById('yyx-gallery-next');
    if (!prev) {
      prev = document.createElement('button');
      prev.id = 'yyx-gallery-prev';
      prev.textContent = '‹';
      prev.addEventListener('click', function (e) { e.stopPropagation(); galleryStep(-1); });
      document.body.appendChild(prev);
    }
    if (!next) {
      next = document.createElement('button');
      next.id = 'yyx-gallery-next';
      next.textContent = '›';
      next.addEventListener('click', function (e) { e.stopPropagation(); galleryStep(1); });
      document.body.appendChild(next);
    }
    return { prev: prev, next: next };
  }
  function galleryUpdateNavButtons() {
    var b = galleryNavButtons();
    var open = !!galleryFullView();
    b.prev.style.display = open ? 'flex' : 'none';
    b.next.style.display = open ? 'flex' : 'none';
    var busy = galleryNav.busy ? 'yy-nav-busy' : '';
    b.prev.className = busy;
    b.next.className = busy;
  }
  function galleryClickFullImage() {
    var cont = galleryFullView();
    if (!cont) return false;
    var main = cont.querySelector('[class*="_showFullCgMain_"]');
    if (!main) return false;
    try { main.click(); return true; } catch (e) { return false; }
  }
  function galleryCloseFull() {
    var cont = galleryFullView();
    if (!cont) return false;
    try { cont.click(); return true; } catch (e) { return false; }
  }
  // 按 series 找网格里的 stack 并点开（全屏从该组第 1 张打开）
  function galleryOpenStackForSeries(series) {
    var cont = document.querySelector('[class*="_cgContainer_"]');
    if (!cont) return false;
    var stacks = cont.querySelectorAll('[class*="_cgElement_"]');
    for (var i = 0; i < stacks.length; i++) {
      if (galleryStackGroup(stacks[i]) === series) {
        try { stacks[i].click(); return true; } catch (e) { return false; }
      }
    }
    return false;
  }
  // 从 cur 到 target 的步子（与 galleryStep 共用；restore 后重开也用它）
  function galleryStepsFor(cur, target, list) {
    var tItem = list[target];
    var cItem = list[cur];
    var steps = [];
    if (cur >= 0 && tItem.series === cItem.series && target > cur) {
      for (var i = 0; i < target - cur; i++) steps.push('advance');
    } else {
      if (cur >= 0) steps.push('close');
      steps.push('open:' + tItem.series);
      for (var j = 0; j < tItem.order; j++) steps.push('advance');
    }
    return steps;
  }
  // 跑一串步子（每步等 React 落定约 250ms）；跑完／失败记 __yyxLastGalleryNav
  function galleryRunSteps(from, target, steps, onDone) {
    galleryNav.busy = true;
    galleryUpdateNavButtons();
    var stepIdx = 0;
    var startedAt = Date.now();
    window.__yyxGalleryNavLog = window.__yyxGalleryNavLog || [];
    window.__yyxGalleryNavLog.push({ from: from, to: target, steps: steps.slice(), at: Date.now() });
    (function runStep() {
      if (stepIdx >= steps.length || Date.now() - startedAt > 15000) {
        galleryNav.busy = false;
        galleryUpdateNavButtons();
        var landed = galleryCurrentFlatIndex();
        window.__yyxLastGalleryNav = { from: from, to: target, landed: landed, ok: landed === target };
        window.__yyxGalleryNavLog.push({ done: true, landed: landed, at: Date.now() });
        if (onDone) onDone(landed === target);
        return;
      }
      var s = steps[stepIdx];
      stepIdx += 1;
      var ok = false;
      if (s === 'advance') ok = galleryClickFullImage();
      else if (s === 'close') ok = galleryCloseFull();
      else if (s.indexOf('open:') === 0) ok = galleryOpenStackForSeries(s.slice(5));
      window.__yyxGalleryNavLog.push({ step: s, ok: ok, cur: galleryCurrentFlatIndex(), at: Date.now() });
      if (!ok) {
        galleryNav.busy = false;
        galleryUpdateNavButtons();
        window.__yyxLastGalleryNav = { from: from, to: target, landed: galleryCurrentFlatIndex(), ok: false, failedStep: s };
        if (onDone) onDone(false);
        return;
      }
      galleryNav.timer = setTimeout(runStep, 250);
    })();
  }
  function galleryStep(dir) {
    if (galleryNav.busy) return;
    var list = galleryFlatList();
    if (list.length < 2) return;
    var cur = galleryCurrentFlatIndex();
    if (cur < 0) return;
    var target = (cur + dir + list.length) % list.length;
    if (target === cur) return;
    galleryRunSteps(cur, target, galleryStepsFor(cur, target, list));
  }
  function updateGallery() {
    renameGalleryTitle();
    renameDialogs();
    var open = currentPage() === 'gallery';
    if (open) {
      if (!galleryWasOpen) { gallerySessionCg = null; galleryLastOpenIdx = -1; }
      galleryWasOpen = true;
      ensureGalleryGrouping();
      insertGroupTitles();
      // 记下当前全屏打开的是第几张（洗掉后重开用）
      var curIdx = galleryCurrentFlatIndex();
      if (curIdx >= 0) galleryLastOpenIdx = curIdx;
      // 会话快照与洗掉恢复
      var st = findStore();
      var cg = null;
      try { cg = st && st.getState().userData.appreciationData.cg; } catch (e) {}
      if (cg) {
        if (!gallerySessionCg) {
          if (cg.length && galleryGroupingApplied(cg)) gallerySessionCg = gallerySnapshotCg(cg);
        } else if (cg.length > gallerySessionCg.length) {
          if (galleryGroupingApplied(cg)) gallerySessionCg = gallerySnapshotCg(cg);
        } else if (cg.length < gallerySessionCg.length) {
          // 被 Yd 洗掉了：用快照恢复内存并重写存盘；全屏若被关掉，等 React 落定后重开同一张
          var snap = gallerySessionCg;
          var wasOpen = galleryLastOpenIdx;
          try {
            st.dispatch({ type: 'userData/setUserData', payload: { key: 'appreciationData', value: { bgm: (st.getState().userData.appreciationData.bgm || []), cg: snap } } });
          } catch (e) {}
          yyxPersistUserData();
          window.__yyxGalleryRestore = { at: Date.now(), fromLen: cg.length, toLen: snap.length, wasOpen: wasOpen };
          gallerySessionCg = gallerySnapshotCg(snap);
          if (wasOpen >= 0 && wasOpen < snap.length) {
            setTimeout(function () {
              if (currentPage() !== 'gallery' || galleryNav.busy) return;
              if (galleryCurrentFlatIndex() >= 0) return; // 没关掉就不用重开
              var list = galleryFlatList();
              if (wasOpen >= list.length) return;
              galleryRunSteps(-1, wasOpen, galleryStepsFor(-1, wasOpen, list));
            }, 400);
          }
        }
      }
    } else {
      galleryWasOpen = false;
      gallerySessionCg = null;
    }
    galleryUpdateNavButtons();
  }

  /* ================= 7b. 设置屏清理（第 1／13 项） =================
     设置屏是引擎自带的选项面板，里面还留着已去掉的功能：
     自动播放速度、快进模式（AUTO／快进已去）、清除所有存档、
     导入／导出存档与选项（手动存读档已去）。藏掉这些行／按钮，
     留下语言、显示、音频、还原默认设置、清除所有数据。
     “游戏”措辞：设置屏原文里本来就没有“游戏”二字，已核对。
     v4 2026-11-19 实测复核：设置屏全文“选项 系统 显示 音频 自动播放速度
     快进模式 已读全部 语言 简体中文 清除或还原数据 清除所有存档 还原默认设置
     清除所有数据 导入或导出存档与选项 导出存档与选项 导入存档与选项”——
     无“游戏／通关／关卡／鉴赏模式”，注释属实。 */
  var SETTINGS_HIDE_ROWS = ['自动播放速度', '快进模式', '导入或导出存档与选项'];
  function cleanSettings() {
    if (currentPage() !== 'settings') return;
    var divs = document.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
      var d = divs[i];
      var cls = String(d.className || '');
      if (cls.indexOf('_NormalOption_ogzuv_1') !== -1) {
        var title = d.querySelector('div[class*="_NormalOption_title_"]');
        var t = title ? (title.textContent || '').trim() : '';
        if (SETTINGS_HIDE_ROWS.indexOf(t) !== -1 && d.style.display !== 'none') {
          d.style.display = 'none';
        }
      }
      if (cls.indexOf('_NormalButton_1qk3b_1') !== -1) {
        var bt = (d.textContent || '').trim();
        if (bt === '清除所有存档' && d.style.display !== 'none') {
          d.style.display = 'none';
        }
      }
    }
  }

  /* ================= 8. 输入后门拦截（沿用旧版） ================= */
  // “继续”拦截（第 1 项）：有书签时，点“继续”不走引擎（引擎回到最后状态，
  // 回目录后它会回到目录），改走自动书签恢复。捕获阶段拦，React 收不到。
  document.addEventListener('click', function (e) {
    var bm = readBookmark();
    if (!bm || !bm.card) return;
    var t = e.target;
    while (t && t !== document.body) {
      if (t.nodeType === 1 && String(t.className || '').indexOf('css-u5nuln') !== -1) {
        var label = textOf(t);
        if (label && label.indexOf('继续') === 0) {
          e.preventDefault();
          e.stopPropagation();
          startResume(bm.card);
        }
        return;
      }
      t = t.parentElement;
    }
  }, true);
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    e.stopPropagation();
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.keyCode === 17) { // 按住 Ctrl = 快进（底栏功能）
      e.stopPropagation();
    } else if (e.key === 'F11') { // 引擎全屏切换（底栏“全屏”）；只拦引擎，不管浏览器默认行为
      e.stopPropagation();
    }
  }, true);
  document.addEventListener('keyup', function (e) {
    if (e.keyCode === 17) {
      e.stopPropagation();
    } else if (e.code === 'Escape' || e.code === 'Backquote') { // 松开 Esc/` = 慌张遮罩
      e.stopPropagation();
    }
  }, true);
  document.addEventListener('wheel', function (e) {
    if (e.ctrlKey) return; // Ctrl+滚轮是浏览器缩放，不管
    // 只在剧情场景拦上滑（对话框在 DOM 里）；标题画面/图集不管
    if (e.deltaY < 0 && document.getElementById('textBoxMain')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { capture: true, passive: false });

  /* ================= 启动 ================= */
  forceChineseStartup(); // v4 第 1 项：强制简体中文＋点掉 splash（在引擎 module 脚本之前）
  injectCss();
  if (document.body) {
    observeMenu();
    observeEntryFlash(); // v4 第 4 项：选项容器一插入就立即加光点类
  } else {
    document.addEventListener('DOMContentLoaded', function () { observeMenu(); observeEntryFlash(); });
  }
  try {
    var gotoTarget = localStorage.getItem('yyx-goto');
    var resumePending = null;
    try { resumePending = localStorage.getItem('yyx-resume'); } catch (e) {}
    // v4 第 3 项：无恢复陪伴的 yyx-goto 是旧版返回留下的残留，下次启动会误导航，清掉
    if (gotoTarget && !resumePending) {
      try { localStorage.removeItem('yyx-goto'); } catch (e) {}
      gotoTarget = null;
    }
    if (gotoTarget) {
      nav.target = gotoTarget;
      nav.startedAt = Date.now();
      showReturning(true, resumePending ? '正在回到上次听到的地方…' : '正在返回…');
    }
  } catch (e) {}
  setInterval(function () {
    startupGuard(); // v4 第 1 项兜底
    updateTitles();
    updateEntryScreen();
    syncEntryNow(); // v4 第 4 项兜底（observer 之外再同步一次）
    updateBackBtn();
    writeBookmark();
    autoChoose();
    navStep();
    resumeAdvance();
    cleanSettings();
    updateGallery(); // v4 第 8／9／10 项
  }, 300);
})();

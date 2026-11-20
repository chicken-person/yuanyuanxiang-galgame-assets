/* ============================================================
 * G02 事件视频（v3，2026-11-19 13 项修改之第 4 项：视频强制播放）
 * v3 改动：
 *   - 3 处图上热点（油灯／纺车／窗户）全部撤掉；走到该段就直接强制播放。
 *   - 播视频时出字幕：视频层之上盖一层字幕（UI 脚本提供的
 *     window.__yyxSubtitle），与当前卡同文（名牌＋正文）、同字号、居中；
 *     字幕层 pointer-events:none，点按仍走视频层。
 *   - 细节视频（线轴，g02-d01-spool）走 g02-d01.txt 的原生 playVideo：
 *     UI 脚本在引子卡的选项出现时自动点“看看线轴”、播完自动点
 *     “回到故事”；本文件负责原生视频出现时补字幕（字幕文案 = 引子卡
 *     T06 原文）与跳过按钮。
 * 触发点（video → 首播卡；每卡只播一次，重听／重进故事时重置）：
 *   油灯 g02-lamp.mp4：T01 夜景 G02-01_videoframe
 *   纺车 g02-wheel.mp4：T03 手部 G02-02_videoframe
 *   窗户 g02-dawn-window.mp4：T05 清晨 G02-03_videoframe
 *   线轴 g02-d01-spool.mp4：D01 —— 原生 playVideo（见上）
 * 剧情背景说明（2026-11-17 晚，用户定稿）：GPT 图只作生成视频的
 *   首帧参考；游戏中实际显示的画面是视频真正的首帧
 *   （G02-0X_videoframe.png = 剪掉头 1 秒后视频的第 0 帧）。
 * 实现：
 *   视频层为舞台容器 div._MainStage_main 的子元素（position:absolute，
 *   全屏），随舞台一起旋转缩放，手机竖屏也贴合。视频层 z 14，跳过按钮
 *   z 15（层内），字幕层 z 30（UI 脚本挂，与视频层同属舞台）。
 *   播视频时把 #currentBgm / #currentVocal 音量置 0（仿原生
 *   playVideo），并每 200ms 重新压住（React 重渲染会把音量顶回
 *   设定值）；播完 / 跳过 / 失败后恢复（若播期间剧本改了音量，
 *   以剧本为准）。视频失败（error、起播超时）直接撤层，故事不停在当前卡。
 * 不改动：剧情文字、插画、名牌、片尾、转场修复
 *   （g02-dissolve-overlay.js 与 g02.txt T05 的 changeBg -enter 写法）。
 *   G02 场景文字文件（g02.txt、g02-t07.txt、g02-d01.txt）冻结，一字不改；
 *   G02 结尾强制回目录（第 5 项）由 UI 脚本在选项层实现，本文件不管。
 * ============================================================ */
(function () {
  'use strict';

  // 剧情卡原文（任务书 §5，一字未改），用于识别当前卡
  // T06–T09／END 来自 g02-t07.txt（同文件原文，一字未改）：供细节字幕
  // （引子卡 T06）与 UI 脚本的 G02 结尾判定用。
  var CARDS = {
    T01: '我小时候，总觉得奶奶好像不怎么睡觉。',
    T02: '农家的吃穿用度，很多都要自己做。',
    T03: '白天下地，晚上回到屋里，她又坐下来纺线。',
    T04: '我睡着的时候，纺车还在响；醒来时，也还在响。',
    T05: '一闭眼，一睁眼，一宿就过去了。',
    T06: '棉花要一点点纺成线，线再做成衣服、布鞋、被子和床单。',
    T07: '那时我只觉得这是家里的声音，没认真想过她累不累。',
    T08: '现在回头看，才明白那一轴轴线，是奶奶把白天和夜晚一点点纺进去的。',
    T09: '我就在这声音里，慢慢长大了。',
    END: '那一声声纺车响，长大后才听见里面的辛劳。',
    D01a: '书里写到，家里的棉花要经过纺线，才会成为衣物、布鞋、被子和床单。',
    D01b: '线轴一圈圈变长，背后是许多个晚上的手工劳动。',
  };

  // v3 自动播：卡 → 视频（走到该卡就直接播，每卡只播一次；离开剧情后重置）
  var AUTOPLAY = {
    T01: 'g02-lamp.mp4',
    T03: 'g02-wheel.mp4',
    T05: 'g02-dawn-window.mp4',
  };

  var NAMEPLATE = '我（成年后的回忆）';
  var activeVideo = null; // 正在播的视频层
  var observedTextNode = null;
  var observer = null;
  var playedCards = {}; // 本次进剧情已自动播过的卡
  var lastCardKey = null; // 最近一次认出的卡（供字幕与自动书签用）
  var nativeSubShown = false; // 原生视频的字幕是否正显示
  var nativeSubKey = null; // 原生视频字幕当前对应的卡（跟随 lastCardKey 补正）

  function norm(s) { return (s || '').replace(/\s+/g, ''); }
  // 子序列匹配：对话文字在 DOM 中每字渲染三份，连续子串匹配会失效
  function seqHas(text, needle) {
    var t = norm(text), n = norm(needle), j = 0;
    for (var i = 0; i < t.length && j < n.length; i++) if (t[i] === n[j]) j++;
    return j === n.length;
  }

  function stage() {
    return document.querySelector('[class*="MainStage_main"]');
  }
  function textBox() {
    return document.getElementById('textBoxMain');
  }
  function currentCard() {
    var tb = textBox();
    if (!tb) return null;
    var txt = tb.textContent || '';
    for (var k in CARDS) if (seqHas(txt, CARDS[k])) return k;
    return null;
  }
  function dialogVisible() {
    var tb = textBox();
    if (!tb) return false;
    var cs = window.getComputedStyle(tb);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    var r = tb.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  // 选项是否可见：选项容器本身是 0 高包装层（子元素绝对定位溢出），
  // 须看容器内子元素是否有非零可见尺寸，不能只看容器自身。
  function chooseVisible() {
    var c = document.querySelector('[class*="chooseContainer"]');
    if (!c) return false;
    if (c.classList.contains('yyx-auto-choose')) return true;
    var cs = window.getComputedStyle(c);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    var kids = c.querySelectorAll('*');
    for (var i = 0; i < kids.length; i++) {
      var kcs = window.getComputedStyle(kids[i]);
      if (kcs.display === 'none' || kcs.visibility === 'hidden') continue;
      var r = kids[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return true;
    }
    return false;
  }

  /* ---------- 自动播 ---------- */
  function evaluate() {
    var card = dialogVisible() ? currentCard() : null;
    if (card) {
      lastCardKey = card;
      // 供 UI 脚本的自动书签（第 1 项）与 G02 结尾判定（第 5 项）读取；
      // 本文件卡号无篇前缀，对外统一补成 G02-T01 / G02-END。
      window.__yyxCard = { key: 'G02-' + card, name: NAMEPLATE, body: CARDS[card] || '' };
    } else {
      playedCards = {};
    }
    if (!card || activeVideo || document.querySelector('#playVideoElement,#fx-video-layer,#g02-video-layer') || chooseVisible()) return;
    var file = AUTOPLAY[card];
    if (file && !playedCards[card]) {
      playedCards[card] = true;
      playVideo(file, card);
    }
  }

  /* ---------- 视频层（仿原生 playVideo 行为） ---------- */
  function duckBgm() {
    var saved = {};
    var bgm = document.getElementById('currentBgm');
    var vocal = document.getElementById('currentVocal');
    if (bgm) { saved.bgm = bgm.volume; bgm.volume = 0; }
    if (vocal) { saved.vocal = vocal.volume; vocal.volume = 0; }
    return saved;
  }
  function restoreBgm(saved) {
    // 只恢复仍被压到 0 的那一路：若播视频期间剧本改了音量（如 T07 降音量），以剧本为准，不覆盖。
    var bgm = document.getElementById('currentBgm');
    var vocal = document.getElementById('currentVocal');
    if (bgm && typeof saved.bgm === 'number' && bgm.volume === 0) { try { bgm.volume = saved.bgm; } catch (e) {} }
    if (vocal && typeof saved.vocal === 'number' && vocal.volume === 0) { try { vocal.volume = saved.vocal; } catch (e) {} }
  }

  function showSubtitle(cardKey) {
    if (window.__yyxSubtitle && cardKey && CARDS[cardKey]) {
      window.__yyxSubtitle.show(NAMEPLATE, CARDS[cardKey]);
    }
  }
  function hideSubtitle() {
    if (window.__yyxSubtitle) window.__yyxSubtitle.hide();
  }

  function playVideo(file, cardKey) {
    if (activeVideo) return;
    var st = stage();
    if (!st) return;
    var saved = duckBgm();
    // 持续压住环境声：React 重渲染会把 <audio> 音量重置回设定值，单次置 0 会被顶回。
    // 引擎还会以约 0.04/s 的速度把音量淡回目标值，100ms 周期可把残余压到 <0.005（基本听不见）。
    var duckTimer = setInterval(function () {
      var b = document.getElementById('currentBgm');
      var v = document.getElementById('currentVocal');
      if (b) { try { b.volume = 0; } catch (e) {} }
      if (v) { try { v.volume = 0; } catch (e) {} }
    }, 100);

    var layer = document.createElement('div');
    layer.id = 'g02-video-layer';
    layer.style.position = 'absolute';
    layer.style.left = '0';
    layer.style.top = '0';
    layer.style.width = '100%';
    layer.style.height = '100%';
    layer.style.zIndex = '14';
    layer.style.background = '#000';
    layer.style.pointerEvents = 'auto';

    var video = document.createElement('video');
    video.id = 'g02-video-element';
    video.src = 'game/video/' + file;
    video.autoplay = true;
    video.playsInline = true;
    video.style.position = 'absolute';
    video.style.left = '0';
    video.style.top = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    if (typeof saved.bgm === 'number') video.volume = saved.bgm;
    layer.appendChild(video);

    var skip = document.createElement('button');
    skip.id = 'g02-video-skip';
    skip.textContent = '跳过视频 ▸';
    skip.style.cssText = 'position:absolute;right:4%;bottom:5%;z-index:2;min-height:56px;padding:10px 22px;font-size:20px;color:#fff;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.6);border-radius:28px;cursor:pointer;';
    layer.appendChild(skip);

    var done = false;
    var watchdog = null;
    function cleanup() {
      if (done) return;
      done = true;
      if (watchdog) clearTimeout(watchdog);
      if (duckTimer) clearInterval(duckTimer);
      try { video.pause(); } catch (e) {}
      try { video.removeAttribute('src'); video.load(); } catch (e) {}
      if (layer.parentNode) layer.parentNode.removeChild(layer);
      restoreBgm(saved);
      hideSubtitle();
      activeVideo = null;
      evaluate();
    }
    video.addEventListener('ended', cleanup);
    video.addEventListener('error', cleanup);
    video.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); cleanup(); });
    skip.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); cleanup(); });
    layer.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); });

    activeVideo = layer;
    st.appendChild(layer);
    // 字幕：当前卡原文（名牌＋正文）盖在视频上当字幕
    showSubtitle(cardKey);

    var started = video.play();
    if (started && typeof started.catch === 'function') started.catch(cleanup);
    // 起播看门狗：12 秒内没播起来就撤层，不卡住故事。
    // （v3 实测：游戏里视频起播要 ~5 秒，5 秒看门狗会在首帧到来前误杀；
    // 12 秒留足余量。跳过按钮全程可点，真播不起来用户一点就过。）
    watchdog = setTimeout(function () {
      if (!done && (video.readyState === 0 || video.paused)) cleanup();
    }, 12000);
  }

  /* ---------- 原生 playVideo（D01）的跳过按钮 + 字幕 ---------- */
  // v3：D01 线轴视频的字幕文案 = 引子卡 T06 原文（lastCardKey）。
  function ensureNativeSkip() {
    var v = document.getElementById('playVideoElement');
    var st = stage();
    // 只处理 G02 自己的原生视频（g02-d01-spool.mp4）。其它篇的 d01 原生视频
    // 由 video-events.js 处理；这里若抢了，会把字幕写成 G02 的旧卡
    // （如 G02-END，因本脚本的 lastCardKey 仍停在 G02）。
    // src 未定则本轮不处理，等下一轮 src 有了再判。
    var src = v ? (v.getAttribute('src') || v.currentSrc || '') : '';
    var isG02Video = src.indexOf('g02-') !== -1;
    if (!v || !st || !isG02Video) {
      var old = document.getElementById('g02-native-skip');
      if (old && old.parentNode) old.parentNode.removeChild(old);
      if (!v && nativeSubShown) { nativeSubShown = false; nativeSubKey = null; hideSubtitle(); }
      return;
    }
    // 原生视频在播：字幕跟随最新认出的卡。引子卡可能比视频晚认出
    // （lastCardKey 还是上一张），认出后补正，避免字幕一直是错的卡。
    if (lastCardKey && lastCardKey !== nativeSubKey) {
      nativeSubKey = lastCardKey;
      nativeSubShown = true;
      showSubtitle(lastCardKey);
    }
    if (document.getElementById('g02-native-skip')) return;
    var btn = document.createElement('button');
    btn.id = 'g02-native-skip';
    btn.textContent = '跳过视频 ▸';
    btn.style.cssText = 'position:absolute;right:4%;bottom:5%;z-index:15;min-height:56px;padding:10px 22px;font-size:20px;color:#fff;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.6);border-radius:28px;cursor:pointer;';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      var vv = document.getElementById('playVideoElement');
      if (vv) vv.dispatchEvent(new Event('ended'));
    });
    st.appendChild(btn);
  }

  /* ---------- 监听 ---------- */
  function attachObserver() {
    var tb = textBox();
    if (!tb) return;
    if (observedTextNode === tb && observer) return;
    if (observer) { try { observer.disconnect(); } catch (e) {} }
    observedTextNode = tb;
    observer = new MutationObserver(function () { evaluate(); ensureNativeSkip(); });
    try {
      observer.observe(tb, { childList: true, characterData: true, subtree: true });
    } catch (e) {}
    try {
      new MutationObserver(function () { ensureNativeSkip(); }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  function tick() {
    attachObserver();
    evaluate();
    ensureNativeSkip();
  }

  function init() {
    if (!stage() || !textBox()) {
      setTimeout(init, 300);
      return;
    }
    tick();
    setInterval(tick, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

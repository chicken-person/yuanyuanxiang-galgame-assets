(() => {
  'use strict';

  const lineNames = { G: '心香', M: '心碑' };
  const coverArt = { G: 'g02', M: 'm01' };
  const picture = (file) => './game/catalog-art/' + file + '.webp';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const visited = {};
  let active;
  let entrySelection;
  let coversPrepared = false;

  // Only direct selections on the entry screen play the cover. The engine also
  // clicks these same controls when it rebuilds the path back from a story.
  document.addEventListener('click', (event) => {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    const choice = event.target.closest('#chooseContainer.yyx-entry-choose > div > div');
    if (!choice) return;
    const label = choice.textContent.trim();
    const line = Object.keys(lineNames).find((key) => lineNames[key] === label);
    if (line) entrySelection = { line, at: performance.now() };
  }, true);

  function chapterChoices(container) {
    if (!container || !container.firstElementChild) return [];
    return [...container.firstElementChild.children].map((node) => {
      const label = node.textContent.trim();
      const match = /^(([GM])0[1-5])《(.+)》$/.exec(label);
      if (!match) return null;
      const [, chapter, line, title] = match;
      return { label, line, title, image: chapter.toLowerCase() };
    });
  }

  function openCover(root, line) {
    const spread = root.querySelector('.catalog-spread');
    const indexPage = root.querySelector('.catalog-index');
    const controls = root.querySelector('.catalog-controls');
    const cover = document.createElement('div');
    cover.className = 'catalog-cover';
    cover.setAttribute('aria-hidden', 'true');
    cover.innerHTML = `
      <div class="catalog-cover-front">
        <span class="catalog-cover-series">远远乡</span>
        <div class="catalog-cover-portrait">
          <img class="catalog-cover-art" alt="" draggable="false">
        </div>
        <span class="catalog-cover-title"></span>
      </div>
      <div class="catalog-cover-inside"></div>`;
    cover.querySelector('img').src = picture(coverArt[line]);
    cover.querySelector('.catalog-cover-title').textContent = lineNames[line];
    cover.querySelector('.catalog-cover-inside').append(indexPage.cloneNode(true));
    const skip = document.createElement('button');
    skip.className = 'catalog-opening-skip';
    skip.type = 'button';
    skip.textContent = '跳过开书';

    function finish() {
      const moveFocus = document.activeElement === skip;
      dispose();
      if (moveFocus) {
        const title = indexPage.querySelector('h1');
        title.tabIndex = -1;
        title.focus({ preventScroll: true });
      }
    }

    function motionChanged(event) {
      if (event.matches) finish();
    }

    function dispose() {
      clearTimeout(fallback);
      reducedMotion.removeEventListener('change', motionChanged);
      cover.remove();
      skip.remove();
      root.classList.remove('is-opening');
      spread.inert = controls.inert = false;
      spread.removeAttribute('aria-hidden');
      controls.removeAttribute('aria-hidden');
    }

    cover.addEventListener('animationend', (event) => {
      if (event.target === cover && event.animationName === 'yyx-cover-opening') finish();
    });
    skip.addEventListener('click', finish);
    reducedMotion.addEventListener('change', motionChanged);
    spread.inert = controls.inert = true;
    spread.setAttribute('aria-hidden', 'true');
    controls.setAttribute('aria-hidden', 'true');
    root.classList.add('is-opening');
    spread.append(cover);
    root.append(skip);
    const fallback = setTimeout(finish, 3200);
    return { finish, dispose };
  }

  function mount(container, choices, findChoice, playOpening) {
    const line = choices[0].line;
    const root = document.createElement('section');
    root.id = 'yyx-catalog-book';
    root.dataset.line = line;
    root.setAttribute('aria-label', lineNames[line] + '章节目录');
    root.innerHTML = `
      <div class="catalog-shell">
        <div class="catalog-spread">
          <div class="catalog-index">
            <div class="catalog-imprint">远远乡<span></span>篇目</div>
            <h1 class="catalog-line"></h1>
            <ol class="catalog-list"></ol>
          </div>
          <div class="catalog-stage">
            <article class="catalog-leaf">
              <img class="catalog-picture" alt="" draggable="false">
              <div class="catalog-copy">
                <span class="catalog-chapter-number"></span>
                <h2></h2>
                <button class="catalog-read" type="button">开始阅读 <span aria-hidden="true">→</span></button>
              </div>
            </article>
            <button class="catalog-corner" type="button" aria-label="从纸角翻到下一页"></button>
          </div>
        </div>
        <nav class="catalog-controls" aria-label="翻阅章节">
          <button class="catalog-prev" type="button"><span aria-hidden="true">←</span> 上一页</button>
          <span class="catalog-count" aria-live="polite" aria-atomic="true"></span>
          <button class="catalog-next" type="button">下一页 <span aria-hidden="true">→</span></button>
        </nav>
      </div>`;
    const stage = root.querySelector('.catalog-stage');
    const leaf = root.querySelector('.catalog-leaf');
    const art = leaf.querySelector('img');
    const read = leaf.querySelector('.catalog-read');
    const list = root.querySelector('.catalog-list');
    const prev = root.querySelector('.catalog-prev');
    const next = root.querySelector('.catalog-next');
    const corner = root.querySelector('.catalog-corner');
    const count = root.querySelector('.catalog-count');
    let index = visited[line] ?? 0;
    let flip;
    let frame = 0;
    let startLock;
    let gesture;
    let ignoreCornerClick = false;
    let opening;

    root.querySelector('.catalog-line').textContent = lineNames[line];
    const entries = choices.map((chapter, chapterIndex) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = chapter.title;
      button.addEventListener('click', () => go(chapterIndex));
      item.append(button);
      list.append(item);
      return button;
    });

    function fill(page, pageIndex) {
      const chapter = choices[pageIndex];
      page.querySelector('img').src = picture(chapter.image);
      page.querySelector('.catalog-chapter-number').textContent = '第' + '一二三四五'[pageIndex] + '篇';
      page.querySelector('h2').textContent = chapter.title;
    }

    function showPage() {
      fill(leaf, index);
      entries.forEach((button, entryIndex) => {
        if (entryIndex === index) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      });
      prev.disabled = index === 0;
      next.disabled = corner.disabled = index === choices.length - 1;
      count.textContent = (index + 1) + ' / ' + choices.length;
      // Prepare the immediate neighbors before their edges are revealed.
      for (const adjacent of [choices[index - 1], choices[index + 1]]) {
        if (adjacent) new Image().src = picture(adjacent.image);
      }
    }

    function setPage(target) {
      index = visited[line] = target;
      showPage();
    }

    function beginFlip(target) {
      const forward = target > index;
      const size = leaf.getBoundingClientRect();
      const turningPage = leaf.cloneNode(true);
      if (!forward) fill(turningPage, target);
      const layer = document.createElement('div');
      layer.className = 'catalog-turn';
      layer.setAttribute('aria-hidden', 'true');
      layer.inert = true;
      const shade = document.createElement('div');
      shade.className = 'catalog-cast-shadow';
      const sheet = document.createElement('div');
      sheet.className = 'catalog-turn-sheet';
      const sliceCount = 12;
      const width = size.width / sliceCount;
      const slices = Array.from({ length: sliceCount }, (_, sliceIndex) => {
        const slice = document.createElement('div');
        slice.className = 'catalog-slice';
        slice.style.width = (width + 0.7) + 'px';
        const front = document.createElement('div');
        front.className = 'catalog-slice-front';
        const ink = turningPage.cloneNode(true);
        ink.style.width = size.width + 'px';
        ink.style.height = size.height + 'px';
        ink.style.left = -sliceIndex * width + 'px';
        front.append(ink);
        const back = document.createElement('div');
        back.className = 'catalog-slice-back';
        slice.append(front, back);
        sheet.append(slice);
        return slice;
      });
      layer.append(shade, sheet);
      stage.append(layer);
      stage.classList.add('is-turning');
      stage.setAttribute('aria-busy', 'true');
      if (forward) fill(leaf, target);
      flip = { target, forward, layer, shade, slices, width, progress: 0 };
      drawFlip(0);
    }

    function drawFlip(progress) {
      flip.progress = progress;
      const turn = flip.forward ? progress : 1 - progress;
      const curve = Math.sin(Math.PI * turn);
      const base = Math.PI * turn;
      let x = 0;
      let z = 0;
      flip.slices.forEach((slice, sliceIndex) => {
        const start = sliceIndex / flip.slices.length;
        const end = (sliceIndex + 1) / flip.slices.length;
        const distance = (start + end) / 2;
        const angle = base + Math.pow(distance, 1.65) * curve * .84;
        const lift = curve * start * start * 15;
        const nextLift = curve * end * end * 15;
        const slope = Math.atan((lift - nextLift) / flip.width);
        slice.style.transform = `translate3d(${x}px,${-lift}px,${z}px) rotateY(${-angle}rad) skewY(${slope}rad)`;
        slice.style.setProperty('--fold-shadow', (curve * (.06 + .26 * distance)).toFixed(3));
        x += Math.cos(angle) * flip.width;
        z += Math.sin(angle) * flip.width;
      });
      flip.shade.style.opacity = (curve * .67).toFixed(3);
      flip.shade.style.transform = `translateX(${(1 - turn) * 30 - 15}%) scaleX(${.42 + curve * .58})`;
      flip.layer.style.opacity = String(Math.min(1, flip.forward ? (1 - progress) * 20 : progress * 20));
    }

    function endFlip(commit) {
      if (!flip) return;
      cancelAnimationFrame(frame);
      const { target, layer } = flip;
      if (commit) setPage(target);
      else showPage();
      layer.remove();
      stage.classList.remove('is-turning');
      stage.removeAttribute('aria-busy');
      flip = null;
    }

    function settle(commit) {
      const from = flip.progress;
      const to = commit ? 1 : 0;
      const duration = 170 + Math.abs(from - to) * 470;
      const start = performance.now();
      function animate(now) {
        const time = Math.min(1, (now - start) / duration);
        const eased = time * time * (3 - 2 * time);
        drawFlip(from + (to - from) * eased);
        if (time < 1) frame = requestAnimationFrame(animate);
        else endFlip(commit);
      }
      frame = requestAnimationFrame(animate);
    }

    function canGo(target) {
      return !flip && !startLock && target !== index && target >= 0 && target < choices.length;
    }

    function go(target) {
      if (!canGo(target)) return;
      if (reducedMotion.matches) {
        setPage(target);
        return;
      }
      beginFlip(target);
      settle(true);
    }

    function handleKey(event) {
      if (!root.isConnected || event.altKey || event.ctrlKey || event.metaKey) return;
      if (root.classList.contains('is-opening')) {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          opening.finish();
        }
        return;
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) go(index + (event.key === 'ArrowRight' ? 1 : -1));
    }

    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
    corner.addEventListener('click', () => {
      if (!ignoreCornerClick) go(index + 1);
    });
    read.addEventListener('click', () => {
      if (flip || startLock) return;
      const option = findChoice(choices[index].label);
      if (!option || !container.contains(option)) return;
      startLock = setTimeout(() => { startLock = 0; read.disabled = false; }, 1400);
      read.disabled = true;
      option.click();
    });

    // Touch swipes can start on the illustration. Mouse drags start at the folded corner.
    stage.addEventListener('pointerdown', (event) => {
      ignoreCornerClick = false;
      if (!event.isPrimary || event.button !== 0 || flip || startLock) return;
      const cornerDrag = event.target === corner;
      if (!cornerDrag && (event.pointerType !== 'touch' || event.target !== art)) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, cornerDrag };
    });
    stage.addEventListener('pointermove', (event) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!gesture.direction) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { gesture = null; return; }
        if (Math.abs(dx) < 12) return;
        const direction = dx < 0 ? 1 : -1;
        if ((gesture.cornerDrag && direction === -1) || !canGo(index + direction)) return;
        gesture.direction = direction;
        ignoreCornerClick = true;
        stage.setPointerCapture(event.pointerId);
        if (!reducedMotion.matches) beginFlip(index + direction);
      }
      if (flip) drawFlip(Math.max(0, Math.min(.94, -dx * gesture.direction / (stage.clientWidth * .74))));
    });

    function finishGesture(event, cancelled) {
      if (!gesture || gesture.id !== event.pointerId) return;
      const direction = gesture.direction;
      const distance = (gesture.x - event.clientX) * direction;
      gesture = null;
      if (!direction) return;
      const commit = !cancelled && distance >= Math.min(96, stage.clientWidth * .19);
      if (flip) settle(commit);
      else if (commit) go(index + direction);
    }
    stage.addEventListener('pointerup', (event) => finishGesture(event, false));
    stage.addEventListener('pointercancel', (event) => finishGesture(event, true));
    stage.addEventListener('pointerleave', () => { if (!gesture?.direction) gesture = null; });
    root.addEventListener('click', (event) => event.stopPropagation());
    root.addEventListener('dragstart', (event) => event.preventDefault());
    document.addEventListener('keydown', handleKey, true);
    showPage();
    if (playOpening) opening = openCover(root, line);
    document.body.append(root);
    container.classList.add('yyx-book-engine');
    container.setAttribute('aria-hidden', 'true');
    document.body.classList.add('yyx-catalog-open');

    return {
      container, line,
      destroy() {
        cancelAnimationFrame(frame);
        clearTimeout(startLock);
        opening?.dispose();
        document.removeEventListener('keydown', handleKey, true);
        root.remove();
        container.classList.remove('yyx-book-engine');
        container.removeAttribute('aria-hidden');
        document.body.classList.remove('yyx-catalog-open');
      },
    };
  }

  window.__yyxSyncCatalog = (container, findChoice) => {
    if (!coversPrepared && container?.classList.contains('yyx-entry-choose')) {
      coversPrepared = true;
      for (const art of Object.values(coverArt)) new Image().src = picture(art);
    }
    const choices = chapterChoices(container);
    const line = choices[0]?.line;
    const isCatalog = choices.length === 5 && line && choices.every((chapter) => chapter?.line === line);
    if (isCatalog && active?.container === container && active.line === line) return;
    active?.destroy();
    active = null;
    if (isCatalog) {
      const playOpening = entrySelection?.line === line &&
        performance.now() - entrySelection.at < 4000 && !reducedMotion.matches;
      entrySelection = null;
      active = mount(container, choices, findChoice, playOpening);
    }
  };
})();

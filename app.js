// 作品データはここに追加・編集できます。
    const books = window.CLASSICS_LIBRARY.books;

    const KEY = 'classicFateApp_v1';
    let state = loadState();
    // 開発中の一度限りのストック回復。履歴は残し、次回以降は実行されません。
    const STOCK_RESET_VERSION = 'classicFateApp_stockReset_v1';
    if (!localStorage.getItem(STOCK_RESET_VERSION)) { state.recoveryTimes = []; saveState(); localStorage.setItem(STOCK_RESET_VERSION, 'done'); }
    let currentBook = null;
    let currentMode = 'normal';
    let currentHistoryId = null;
    let countdownTimer = null;
    let historyFilter = 'all';
    let historyQuery = '';

    function todayKey() { const now = new Date(); return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`; }
    function defaultState() { return { recoveryTimes: [], history: [], stockDate: todayKey() }; }
    function loadState() { try { const saved = JSON.parse(localStorage.getItem(KEY)); return saved && Array.isArray(saved.recoveryTimes) && Array.isArray(saved.history) ? saved : defaultState(); } catch { return defaultState(); } }
    function saveState() { localStorage.setItem(KEY, JSON.stringify(state)); }
    // 回復予定を過ぎたストックを取り除くことで、残ストックを自動復元します。
    function refreshStock() { const today = todayKey(); if (!state.stockDate) state.stockDate = today; if (state.stockDate !== today) { state.recoveryTimes = []; state.stockDate = today; } saveState(); updateStockUI(); }
    function stockCount() { return Math.max(0, 3 - state.recoveryTimes.length); }
    function consumeStock() { refreshStock(); if (stockCount() <= 0) return false; state.recoveryTimes.push(Date.now()); saveState(); updateStockUI(); return true; }
    function formatRemaining(ms) { const total = Math.max(0, Math.ceil(ms / 60000)); return `${Math.floor(total / 60)}時間${String(total % 60).padStart(2,'0')}分`; }
    function updateStockUI() { const count = stockCount(); const badge = document.getElementById('stockBadge'); badge.setAttribute('aria-label', `提案ストック ${count} / 3`); badge.innerHTML = [0,1,2].map(i => `<span class="stock-book ${i < count ? '' : 'empty'}" aria-hidden="true">📖</span>`).join(''); const start = document.getElementById('startButton'); const free = document.getElementById('freeStartButton'); const notice = document.getElementById('countdown'); start.disabled = count === 0; free.hidden = count !== 0; notice.hidden = count !== 0; if (!notice.hidden) notice.textContent = '今日はここまで。明日もおたのしみに。'; }
    function closeMenu() { const menu = document.getElementById('menuPanel'); const toggle = document.getElementById('menuToggle'); menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    function showScreen(id) { closeMenu(); refreshStock(); document.querySelectorAll('.screen').forEach(el => el.classList.toggle('active', el.id === id)); if (id === 'history') renderHistory(); if (id === 'stats') renderStats(); }
    // Kindle 無料版などの導線もあるため、海外古典を含めた作品群を提案します。
    const catalog = books;
    function chooseBook() { const candidates = catalog.filter(book => !currentBook || book.title !== currentBook.title); currentBook = candidates[Math.floor(Math.random() * candidates.length)] || catalog[0]; renderProposal(); }
    function renderProposal() { const b = currentBook; const card = document.getElementById('swipeCard'); const title = document.getElementById('proposalTitle'); card.classList.remove('commit-read', 'commit-later', 'dragging'); card.style.transform = ''; card.style.opacity = ''; title.textContent = b.title; title.style.fontSize = b.title.length > 8 ? 'clamp(24px, 7.2vw, 32px)' : ''; document.getElementById('proposalAuthor').textContent = b.author; document.getElementById('proposalSummary').textContent = b.summary; document.getElementById('proposalBio').textContent = b.authorBio; document.getElementById('proposalStats').textContent = b.dummyStats; document.getElementById('workSearchLink').href = `https://www.google.com/search?q=${encodeURIComponent(`${b.title} ${b.author} 作品 解説`)}`; document.getElementById('authorSearchLink').href = `https://www.google.com/search?q=${encodeURIComponent(`${b.author} 経歴 代表作`)}`; document.getElementById('accordion').classList.remove('open'); document.getElementById('detailToggle').textContent = '詳細を見る'; const bookCard = document.querySelector('.book-card'); bookCard.style.animation = 'none'; void bookCard.offsetWidth; bookCard.style.animation = ''; }
    function beginProposal(mode) { refreshStock(); if (mode === 'normal' && stockCount() === 0) return; currentMode = mode; showScreen('stage'); setTimeout(() => { chooseBook(); showScreen('proposal'); }, 1900); }
    function addHistory(action) { const entry = { id: Date.now() + Math.random(), selectedAt: new Date().toISOString(), mode: currentMode, title: currentBook.title, author: currentBook.author, action, status:'未読' }; state.history.unshift(entry); saveState(); return entry.id; }
    function act(action) { if (!currentBook) return; if (currentMode === 'normal' && !consumeStock()) { showScreen('home'); return; } currentHistoryId = addHistory(action); if (action === '読んでみる') { showDetail(); return; } if (currentMode === 'free' || stockCount() > 0) { chooseBook(); showScreen('proposal'); } else { showScreen('home'); } }
    const openingMore = window.CLASSICS_LIBRARY.openingMore;
    // アプリ内読書用の初期棚。本文データは作品ごとに出典とともに追加します。
    const readerTexts = window.CLASSICS_LIBRARY.readerTexts;
    const readerSources = window.CLASSICS_LIBRARY.readerSources;
    // 提案の余韻をそのまま読書のきっかけにする、作品ごとの一言。
    const recommendations = window.CLASSICS_LIBRARY.recommendations;
    let readerFontSize = Number(localStorage.getItem('classicReaderFontSize')) || 18;
    function showDetail() { const b = currentBook; document.getElementById('detailTitle').textContent = b.title; document.getElementById('detailAuthor').textContent = b.author; document.getElementById('detailSummary').textContent = b.summary; document.getElementById('detailOpening').textContent = b.openingText; document.getElementById('detailRecommendation').textContent = recommendations[b.title] || '少しだけ日常から離れたいとき、短い時間でも物語の世界に入りたいときにおすすめです。'; document.getElementById('detailAuthorBio').textContent = b.authorBio; document.getElementById('detailUserStats').textContent = b.dummyStats; document.getElementById('detailPageMore').classList.remove('open'); document.getElementById('detailPageMoreButton').textContent = '詳細を見る'; const query = encodeURIComponent(`${b.title} ${b.author}`); const workSearch = `https://www.google.com/search?q=${encodeURIComponent(`${b.title} ${b.author} 作品 解説`)}`; const authorSearch = `https://www.google.com/search?q=${encodeURIComponent(`${b.author} 経歴 代表作`)}`; const aozoraSearch = `https://www.google.com/search?q=${encodeURIComponent(`site:aozora.gr.jp ${b.title} ${b.author}`)}`; document.getElementById('aozoraLink').href = aozoraSearch; document.getElementById('kindleLink').href = `https://www.amazon.co.jp/s?k=${query}&i=digital-text`; document.getElementById('workSearchLink').href = workSearch; document.getElementById('authorSearchLink').href = authorSearch; document.getElementById('detailWorkSearchLink').href = workSearch; document.getElementById('detailAuthorSearchLink').href = authorSearch; document.getElementById('readerButton').hidden = !readerTexts[b.title]; document.getElementById('freeMoreButton').hidden = currentMode !== 'free'; showScreen('detail'); }
    function showReader() { const b = currentBook; const body = document.getElementById('readerBody'); document.getElementById('readerTitle').textContent = b.title; document.getElementById('readerAuthor').textContent = b.author; body.innerHTML = readerTexts[b.title].split(/\n\n+/).map(p => `<p>${escapeHtml(p)}</p>`).join('') + `<footer class="reader-credit">試し読み（アプリ内収録）<br>作品：${escapeHtml(b.title)} ／ 著者：${escapeHtml(b.author)}<br>出典：<a href="${readerSources[b.title]}" target="_blank" rel="noopener">青空文庫 作品カード</a><br>続きの本文は、出典情報を保ったうえで順次このリーダーへ収録します。</footer>`; body.style.fontSize = `${readerFontSize}px`; const saved = Number(localStorage.getItem(`classicReaderPosition_${b.title}`)) || 0; requestAnimationFrame(() => { body.scrollTop = saved; }); showScreen('reader'); }
    function renderHistory() { const list = document.getElementById('historyList'); document.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('active', button.dataset.filter === historyFilter)); const query = historyQuery.trim().toLowerCase(); const filtered = state.history.filter(item => { const kind = historyFilter === 'read' ? item.action === '読んでみる' : historyFilter === 'later' ? item.action === 'あとで読む' : historyFilter === 'finished' ? item.status === '読了' : true; const matches = !query || `${item.title} ${item.author}`.toLowerCase().includes(query); return kind && matches; }); if (!filtered.length) { list.innerHTML = `<p class="empty">${state.history.length ? '条件に合う作品はありません。' : 'まだ選択の履歴はありません。<br>最初の一冊を決めてみましょう。'}</p>`; return; } list.innerHTML = filtered.map(item => `<article class="history-item"><div class="history-head"><span>${item.mode === 'normal' ? '✨ 通常モード' : '🔍 無制限モード'}</span><div class="history-side"><span>${new Date(item.selectedAt).toLocaleString('ja-JP')}</span>${item.status === '読了' ? '<span class="read-mark">✓ 読んだ</span>' : ''}</div></div><div class="history-book">${escapeHtml(item.title)}<button class="favorite-button ${item.favorite ? 'active' : ''}" data-favorite-id="${item.id}" aria-label="お気に入り">${item.favorite ? '★' : '☆'}</button></div><div class="history-meta">${escapeHtml(item.author)} · ${item.action}</div><button class="small-button" data-read-id="${item.id}">${item.status === '読了' ? '未読に戻す' : '読んだ'}</button></article>`).join(''); }
    function renderStats() { const normal = state.history.filter(x => x.mode === 'normal'); const read = normal.filter(x => x.action === '読んでみる').length; const later = normal.filter(x => x.action === 'あとで読む').length; const finished = normal.filter(x => x.status === '読了').length; const total = normal.length; const ratio = n => total ? Math.round(n / total * 100) : 0; document.getElementById('statsGrid').innerHTML = `<div class="stat"><div class="stat-label">読んでみる</div><div class="stat-value">${read}</div><div class="stat-label">${ratio(read)}%</div><button class="shelf-button" data-history-filter="read">本棚表示</button></div><div class="stat"><div class="stat-label">あとで読む</div><div class="stat-value">${later}</div><div class="stat-label">${ratio(later)}%</div><button class="shelf-button" data-history-filter="later">本棚表示</button></div><div class="stat"><div class="stat-label">読んだ</div><div class="stat-value">${finished}</div><div class="stat-label">読了済み</div><button class="shelf-button" data-history-filter="finished">本棚表示</button></div><div class="stat"><div class="stat-label">これまでに選択した回数</div><div class="stat-value">${total}</div><div class="stat-label">通常モードのみ</div></div>`; }
    function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
    function exportCsv() { const rows = [['選択日時','モード','タイトル','著者名','アクション'], ...state.history.map(x => [new Date(x.selectedAt).toLocaleString('ja-JP'), x.mode === 'normal' ? '通常' : '制限なし', x.title, x.author, x.action])]; const csv = '\uFEFF' + rows.map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n'); const blob = new Blob([csv], {type:'text/csv;charset=utf-8'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'classics-history.csv'; a.click(); URL.revokeObjectURL(url); }

    document.getElementById('startButton').addEventListener('click', () => beginProposal('normal'));
    document.getElementById('freeStartButton').addEventListener('click', () => beginProposal('free'));
    document.getElementById('detailToggle').addEventListener('click', () => { const el = document.getElementById('accordion'); const open = el.classList.toggle('open'); document.getElementById('detailToggle').textContent = open ? '詳細を閉じる' : '詳細を見る'; });
    document.getElementById('detailPageMoreButton').addEventListener('click', () => { const el = document.getElementById('detailPageMore'); const open = el.classList.toggle('open'); document.getElementById('detailPageMoreButton').textContent = open ? '詳細を閉じる' : '詳細を見る'; });
    document.getElementById('readerButton').addEventListener('click', showReader);
    document.getElementById('changeToLaterButton').addEventListener('click', () => { const item = state.history.find(entry => String(entry.id) === String(currentHistoryId)); if (!item) return; if (item.action === 'あとで読む') { item.action = '読んでみる'; saveState(); showDetail(); return; } item.action = 'あとで読む'; item.status = '未読'; saveState(); if (currentMode === 'free' || stockCount() > 0) { chooseBook(); showScreen('proposal'); } else { showScreen('home'); } });
    document.getElementById('freeMoreButton').addEventListener('click', () => beginProposal('free'));
    document.getElementById('readerBack').addEventListener('click', () => showScreen('detail'));
    document.getElementById('readerBody').addEventListener('scroll', e => { if (currentBook) localStorage.setItem(`classicReaderPosition_${currentBook.title}`, String(e.currentTarget.scrollTop)); });
    document.querySelectorAll('[data-font]').forEach(button => button.addEventListener('click', () => { readerFontSize = Math.max(15, Math.min(24, readerFontSize + Number(button.dataset.font))); localStorage.setItem('classicReaderFontSize', String(readerFontSize)); document.getElementById('readerBody').style.fontSize = `${readerFontSize}px`; }));
    // メイン画面の空白を右へ払うと、本棚をすぐ開けます。
    let homeSwipeStart = null;
    const homeScreen = document.getElementById('home');
    const startHomeSwipe = (x, y, target) => {
      if (target?.closest?.('button, a, input')) return;
      homeSwipeStart = { x, y };
    };
    const finishHomeSwipe = (x, y) => {
      if (!homeSwipeStart) return;
      const dx = x - homeSwipeStart.x;
      const dy = y - homeSwipeStart.y;
      homeSwipeStart = null;
      if (dx > 88 && Math.abs(dy) < 56) showScreen('history');
    };
    homeScreen.addEventListener('pointerdown', event => {
      startHomeSwipe(event.clientX, event.clientY, event.target);
      if (homeSwipeStart) homeScreen.setPointerCapture?.(event.pointerId);
    });
    homeScreen.addEventListener('pointerup', event => finishHomeSwipe(event.clientX, event.clientY));
    homeScreen.addEventListener('pointercancel', () => { homeSwipeStart = null; });
    // Pointer Eventsを使わないブラウザでも動くよう、タッチ操作も明示的に受け取ります。
    homeScreen.addEventListener('touchstart', event => {
      const touch = event.changedTouches[0];
      if (touch) startHomeSwipe(touch.clientX, touch.clientY, event.target);
    }, { passive:true });
    homeScreen.addEventListener('touchend', event => {
      const touch = event.changedTouches[0];
      if (touch) finishHomeSwipe(touch.clientX, touch.clientY);
    }, { passive:true });

    // 本棚を左へ払うと、右側からメイン画面をのぞかせながら戻れます。
    let historySwipeStart = null;
    const historyScreen = document.getElementById('history');
    const clearHistoryPreview = () => {
      historySwipeStart = null;
      historyScreen.classList.remove('swiping-page');
      homeScreen.classList.remove('swipe-preview');
      historyScreen.style.transform = '';
      homeScreen.style.transform = '';
    };
    const startHistorySwipe = (x, y, target) => {
      if (target?.closest?.('button, a, input')) return;
      historySwipeStart = { x, y };
    };
    const moveHistorySwipe = (x, y) => {
      if (!historySwipeStart) return;
      const dx = x - historySwipeStart.x;
      const dy = y - historySwipeStart.y;
      if (dx >= -8 || Math.abs(dy) > 72) return;
      const distance = Math.min(Math.abs(dx), window.innerWidth * .86);
      homeScreen.classList.add('swipe-preview');
      historyScreen.classList.add('swiping-page');
      historyScreen.style.transform = 'translateX(' + dx + 'px)';
      homeScreen.style.transform = 'translateX(' + Math.max(0, window.innerWidth - distance) + 'px)';
    };
    const finishHistorySwipe = (x, y) => {
      if (!historySwipeStart) return;
      const dx = x - historySwipeStart.x;
      const dy = y - historySwipeStart.y;
      if (dx < -88 && Math.abs(dy) < 56) {
        clearHistoryPreview();
        showScreen('home');
        return;
      }
      clearHistoryPreview();
    };
    historyScreen.addEventListener('pointerdown', event => {
      startHistorySwipe(event.clientX, event.clientY, event.target);
      if (historySwipeStart) historyScreen.setPointerCapture?.(event.pointerId);
    });
    historyScreen.addEventListener('pointermove', event => moveHistorySwipe(event.clientX, event.clientY));
    historyScreen.addEventListener('pointerup', event => finishHistorySwipe(event.clientX, event.clientY));
    historyScreen.addEventListener('pointercancel', clearHistoryPreview);
    historyScreen.addEventListener('touchstart', event => {
      const touch = event.changedTouches[0];
      if (touch) startHistorySwipe(touch.clientX, touch.clientY, event.target);
    }, { passive:true });
    historyScreen.addEventListener('touchmove', event => {
      const touch = event.changedTouches[0];
      if (touch) moveHistorySwipe(touch.clientX, touch.clientY);
    }, { passive:true });
    historyScreen.addEventListener('touchend', event => {
      const touch = event.changedTouches[0];
      if (touch) finishHistorySwipe(touch.clientX, touch.clientY);
    }, { passive:true });
    historyScreen.addEventListener('touchcancel', clearHistoryPreview, { passive:true });

    // 作品カードを右へ払うと「読んでみる」、左へ払うと「あとで読む」です。
    let swipeStartX = null;
    const swipeCard = document.getElementById('swipeCard');
    const swipeOverlay = document.getElementById('swipeOverlay');
    const swipeOverlayText = document.getElementById('swipeOverlayText');
    swipeCard.addEventListener('pointerdown', e => { swipeStartX = e.clientX; swipeCard.setPointerCapture(e.pointerId); swipeCard.classList.add('dragging'); swipeOverlay.classList.remove('show', 'later'); });
    swipeCard.addEventListener('pointermove', e => { if (swipeStartX === null) return; const dx = e.clientX - swipeStartX; swipeCard.style.transform = `translateX(${Math.max(-120, Math.min(120, dx))}px) rotate(${dx / 28}deg)`; swipeCard.style.opacity = String(1 - Math.min(Math.abs(dx) / 420, .35)); const active = Math.abs(dx) > 16; swipeOverlay.classList.toggle('show', active); swipeOverlay.classList.toggle('later', dx < 0); if (active) swipeOverlayText.textContent = dx > 0 ? '読んでみる →' : '← あとで読む'; });
    function completeSwipe(e) { if (swipeStartX === null) return; const dx = e.clientX - swipeStartX; swipeStartX = null; swipeCard.classList.remove('dragging'); swipeOverlay.classList.remove('show', 'later'); swipeCard.style.transform = ''; swipeCard.style.opacity = ''; if (Math.abs(dx) < 72) return; const action = dx > 0 ? '読んでみる' : 'あとで読む'; swipeCard.classList.add(dx > 0 ? 'commit-read' : 'commit-later'); setTimeout(() => act(action), 160); }
    swipeCard.addEventListener('pointerup', completeSwipe);
    swipeCard.addEventListener('pointercancel', completeSwipe);
    document.getElementById('alreadyButton').addEventListener('click', chooseBook);
    document.getElementById('csvButton').addEventListener('click', exportCsv);
    document.getElementById('menuToggle').addEventListener('click', e => { e.stopPropagation(); const menu = document.getElementById('menuPanel'); const open = menu.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', String(open)); });
    document.getElementById('historySearch').addEventListener('input', e => { historyQuery = e.target.value; renderHistory(); });
    document.getElementById('historyFilters').addEventListener('click', e => { const filter = e.target.closest('[data-filter]')?.dataset.filter; if (filter) { historyFilter = filter; renderHistory(); } });
    document.addEventListener('click', e => { const screen = e.target.closest('[data-screen]')?.dataset.screen; if (screen) showScreen(screen); const id = e.target.closest('[data-read-id]')?.dataset.readId; if (id) { const item = state.history.find(x => String(x.id) === id); if (item) { item.status = item.status === '読了' ? '未読' : '読了'; saveState(); renderHistory(); } } const favoriteId = e.target.closest('[data-favorite-id]')?.dataset.favoriteId; if (favoriteId) { const item = state.history.find(x => String(x.id) === favoriteId); if (item) { item.favorite = !item.favorite; saveState(); renderHistory(); } } const statsFilter = e.target.closest('[data-history-filter]')?.dataset.historyFilter; if (statsFilter) { historyFilter = statsFilter; historyQuery = ''; document.getElementById('historySearch').value = ''; showScreen('history'); } if (!e.target.closest('#menuPanel')) closeMenu(); });
    refreshStock(); countdownTimer = setInterval(refreshStock, 30000);
  


    // 試し読み棚を拡張。翻訳が複数ある海外・古典思想は、特定の訳文ではなく導入ガイドとして収録します。
    (() => {
      const newBooks = window.CLASSICS_LIBRARY.newBooks;
      const guideTexts = window.CLASSICS_LIBRARY.guideTexts;
      // データ入力時の改行エスケープを、ここで確実に実際の改行へ変換します。
      Object.keys(guideTexts).forEach(title => {
        guideTexts[title] = guideTexts[title].replace(/\\{1,}n/g, '\n');
      });
      const extendedGuides = window.CLASSICS_LIBRARY.extendedGuides;
      catalog.push(...newBooks);
      Object.assign(readerTexts, guideTexts);
      Object.assign(readerSources, Object.fromEntries(newBooks.map(book => [book.title, 'https://www.google.com/search?q=' + encodeURIComponent(book.title + ' ' + book.author + ' 作品')])));
      Object.assign(recommendations, {'饗宴':'愛という言葉を、恋愛だけで終わらせずに考え直したいときに。','幸福について':'気持ちが外側の出来事に振り回されていると感じる日に。','孫子':'勢いで動く前に、状況を静かに読み直したいときに。','孟子':'人は本当に善くなれるのか、という問いから始めたいときに。','論語':'短い言葉を一つ持ち帰るように、古典へ入りたい日に。','千夜一夜物語':'物語が次々に枝分かれする、豊かな夜の読書をしたいときに。','ギルガメシュ叙事詩':'英雄の物語の奥にある、友情と死の古さに触れたいときに。','オデュッセイア':'旅と帰還の物語を、世界文学の源流から始めたいときに。','神曲':'人生の道を見失う感覚を、壮大な詩で見つめたいときに。','君主論':'きれいごとではない現実の判断について考えたいときに。'});
      const baseShowDetail = showDetail;
      showDetail = function() {
        baseShowDetail();
        document.getElementById('detailOpening').textContent = currentBook.openingText.replace(/\\n/g, '\n');
        const historyItem = state.history.find(entry => String(entry.id) === String(currentHistoryId));
        document.getElementById('changeToLaterButton').textContent = historyItem?.action === 'あとで読む' ? 'やっぱり読んでみる' : 'やっぱりあとで読む';
      };
      const catalogOnly = window.CLASSICS_LIBRARY.catalogOnly;
      catalog.push(...catalogOnly.map(([title, author]) => ({
        title, author,
        summary:'作品の詳しい紹介とアプリ内試し読みは、順次追加しています。まずはタイトルと著者から、偶然の一冊に出会ってください。',
        authorBio:'作品・著者の詳しい情報は、「作品についてもっと知る」から調べられます。',
        openingText:'この作品は、目録からの提案です。\n気になったら、作品について調べて最初のページを開いてみてください。',
        dummyStats:'読んでみる 50% / あとで読む 50%'
      })));
      const featuredCatalog = window.CLASSICS_LIBRARY.featuredCatalog;
      Object.entries(featuredCatalog).forEach(([title, details]) => {
        const book = catalog.find(entry => entry.title === title);
        if (book) Object.assign(book, details);
        if (details.recommendation) recommendations[title] = details.recommendation;
      });
      const favoriteFilter = document.createElement('button');
      favoriteFilter.className = 'filter-button';
      favoriteFilter.dataset.filter = 'favorite';
      favoriteFilter.textContent = '★ お気に入り';
      document.getElementById('historyFilters').append(favoriteFilter);
      const baseRenderHistory = renderHistory;
      renderHistory = function() {
        const fullHistory = state.history;
        const query = historyQuery.trim().toLowerCase();
        const visibleHistory = fullHistory.filter(item => {
          const matchesFilter = historyFilter === 'read' ? item.action === '読んでみる' : historyFilter === 'later' ? item.action === 'あとで読む' : historyFilter === 'finished' ? item.status === '読了' : historyFilter === 'favorite' ? item.favorite : true;
          return matchesFilter && (!query || (item.title + ' ' + item.author).toLowerCase().includes(query));
        });
        if (historyFilter === 'favorite') state.history = visibleHistory;
        baseRenderHistory();
        state.history = fullHistory;
        document.querySelectorAll('#historyList .history-item').forEach((node, index) => {
          if (visibleHistory[index]) node.dataset.historyOpenId = String(visibleHistory[index].id);
        });
      };
      document.getElementById('historyList').addEventListener('click', event => {
        if (event.target.closest('button')) return;
        const id = event.target.closest('[data-history-open-id]')?.dataset.historyOpenId;
        const item = state.history.find(entry => String(entry.id) === id);
        if (!item) return;
        currentBook = catalog.find(book => book.title === item.title && book.author === item.author);
        if (!currentBook) return;
        currentHistoryId = item.id;
        currentMode = item.mode;
        showDetail();
      });
      const normalizeReadingText = value => {
        // データ内の「\n」や「\\n」を、画面表示用の実際の改行へ統一します。
        return String(value || '').replace(/\\{1,}n/g, '\n');
      };
      showReader = function() {
        const b = currentBook, body = document.getElementById('readerBody'), isGuide = Boolean(guideTexts[b.title]);
        const normalizedText = normalizeReadingText(readerTexts[b.title]);
        const paragraphs = normalizedText.split(/\n\n+/).map(p => '<p>' + escapeHtml(p) + '</p>').join('');
        const guide = extendedGuides[b.title] || (isGuide ? '' : b.summary + '\n\n' + (recommendations[b.title] || '気になった場面をひとつ持ち帰って、続きは本で確かめてみてください。'));
        const normalizedGuide = normalizeReadingText(guide);
        const companion = normalizedGuide ? '<section class="reader-guide"><h2>この先の見どころ</h2>' + normalizedGuide.split(/\n\n+/).map(p => '<p>' + escapeHtml(p) + '</p>').join('') + '</section>' : '';
        const credit = isGuide ? '読書の導入ガイド（アプリ内編集）<br>作品：' + escapeHtml(b.title) + ' ／ 著者：' + escapeHtml(b.author) + '<br>特定の訳文ではなく、作品の方向性が残るよう編集・収録しています。<br><a href="' + readerSources[b.title] + '" target="_blank" rel="noopener">作品を詳しく調べる</a>' : '試し読み＋読書ガイド（アプリ内収録）<br>作品：' + escapeHtml(b.title) + ' ／ 著者：' + escapeHtml(b.author) + '<br>本文冒頭のあとに、この先の見どころを添えています。<br>出典：<a href="' + readerSources[b.title] + '" target="_blank" rel="noopener">青空文庫 作品カード</a>';
        document.getElementById('readerTitle').textContent = b.title;
        document.getElementById('readerAuthor').textContent = b.author;
        body.innerHTML = paragraphs + companion + '<footer class="reader-credit">' + credit + '</footer>';
        body.style.fontSize = readerFontSize + 'px';
        const saved = Number(localStorage.getItem('classicReaderPosition_' + b.title)) || 0;
        requestAnimationFrame(() => { body.scrollTop = saved; });
        showScreen('reader');
      };
    })();
  


    // ABOUT THIS APP の文章はここにまとめ、文面の調整をしやすくしています。
    (() => {
      const sections = document.querySelectorAll('#about .about-section');
      if (sections.length < 4) return;

      sections[0].querySelector('.about-copy').textContent = `古典を読みたいけど、なにを読もうか決められない。
選択肢が多すぎると、古典はなかなか読めません。

このアプリは、古今東西の古典からひとつだけ、あなたに提案します。
気になる古典に出会ったら、すぐに本文へ。

古典への一歩を、すこしだけ軽くする。
「きょうの古典」は、そんなちいさなアプリです。`;

      sections[2].querySelector('.about-heading').textContent = '◇FOR CLASSICS LOVERS';
      sections[2].querySelector('.about-copy').textContent = '日頃から古典に慣れ親しんでいる古典愛好家の方も、「きょうの古典」で偶然の一冊をお楽しみください。\nこのアプリを通じて、普段は読まない時代やジャンルの古典とめぐり合うことができたなら、幸甚です';
      sections[3].querySelector('.about-copy').textContent = `このアプリは古典を提案するアプリであり、古典を通読するためのアプリではありません。
また、このアプリで提案される古典のすべてが、青空文庫やKindle等のサービスを通じて読めるわけではありません。
一部の作品は、無料で読むことができない場合があります。あらかじめご了承ください。

青空文庫やKindle無料版が利用できない場合でも、Kindleの定額読み放題サービス「Kindle Unlimited」では、配信されている場合があります。実際、Kindle Unlimitedでは、多くの古典作品が配信されています。
Kindle Unlimitedは、以下のボタンからご登録可能です。※Kindle Unlimitedの利用は有料です。`;
    })();
  


    // HTTPS で公開した場合だけ、Android のホーム画面アプリとしてオフライン利用を可能にします。
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
    }

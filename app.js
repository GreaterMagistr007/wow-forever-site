// Поиск по справочнику, меню разделов на узком экране, регистрация service worker.
(function () {
  'use strict';

  // ё и е считаем одной буквой, регистр не важен
  const norm = s => s.toLowerCase().replace(/ё/g, 'е');
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const input = document.getElementById('q');
  const box = document.getElementById('results');
  let index = null;
  let sel = -1;

  function getIndex() {
    if (!index) {
      index = (window.SEARCH_INDEX || []).map(e => ({ e, title: norm(e.s), text: norm(e.t) }));
    }
    return index;
  }

  // Подсветка найденных слов: е в запросе совпадает и с ё в тексте
  function highlight(str, words) {
    let out = esc(str);
    for (const w of words) {
      const pattern = reEsc(esc(w)).replace(/е/g, '[её]');
      out = out.replace(new RegExp('(' + pattern + ')', 'gi'), '<mark>$1</mark>');
    }
    return out;
  }

  function snippet(text, words) {
    const n = norm(text);
    let pos = -1;
    for (const w of words) {
      const p = n.indexOf(w);
      if (p >= 0 && (pos < 0 || p < pos)) pos = p;
    }
    const start = Math.max(0, pos - 70);
    let s = text.slice(start, start + 220);
    if (start > 0) s = '…' + s;
    if (start + 220 < text.length) s += '…';
    return highlight(s, words);
  }

  function search(q) {
    const words = norm(q).split(/\s+/).filter(w => w.length > 1);
    if (!words.length) return { words, hits: [] };
    const hits = [];
    for (const item of getIndex()) {
      let score = 0;
      let all = true;
      for (const w of words) {
        const inTitle = item.title.includes(w);
        const inText = item.text.includes(w);
        if (!inTitle && !inText) { all = false; break; }
        score += (inTitle ? 10 : 0) + (inText ? 1 + Math.min(item.text.split(w).length - 2, 5) : 0);
      }
      if (all) hits.push({ item, score });
    }
    hits.sort((a, b) => b.score - a.score);
    return { words, hits: hits.slice(0, 40) };
  }

  function show() {
    const q = input.value.trim();
    sel = -1;
    if (q.length < 2) { box.hidden = true; box.innerHTML = ''; return; }
    const { words, hits } = search(q);
    if (!hits.length) {
      box.innerHTML = '<div class="empty">Ничего не нашлось. Попробуйте другое слово или начало слова: «трав», «маунт».</div>';
    } else {
      box.innerHTML = hits.map(({ item }) => {
        const e = item.e;
        const href = e.p + (e.a ? '#' + encodeURIComponent(e.a) : '');
        const where = esc(e.w);
        return '<a role="option" href="' + href + '"><div class="rp">' + where + '</div>' +
          '<div class="rt">' + highlight(e.s, words) + '</div>' +
          '<div class="rs">' + snippet(e.t, words) + '</div></a>';
      }).join('');
    }
    box.hidden = false;
  }

  function move(step) {
    const links = box.querySelectorAll('a');
    if (!links.length) return;
    if (sel >= 0) links[sel].classList.remove('sel');
    sel = (sel + step + links.length) % links.length;
    links[sel].classList.add('sel');
    links[sel].scrollIntoView({ block: 'nearest' });
  }

  if (input && box) {
    input.addEventListener('input', show);
    input.addEventListener('focus', () => { if (input.value.trim().length >= 2) show(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        const links = box.querySelectorAll('a');
        const target = links[sel >= 0 ? sel : 0];
        if (target) { e.preventDefault(); location.href = target.href; box.hidden = true; }
      } else if (e.key === 'Escape') { input.value = ''; show(); input.blur(); }
    });
    // Переход по якорю на той же странице: закрыть выдачу
    box.addEventListener('click', () => { box.hidden = true; });
    document.addEventListener('click', e => {
      if (!e.target.closest('.search')) box.hidden = true;
    });
    document.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement !== input && !e.target.closest('input, textarea')) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  // Меню разделов на узком экране
  const menu = document.querySelector('.menu');
  const nav = document.getElementById('nav');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', e => {
      if (e.target.closest('a')) { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Отметки чек-листов гайдов: хранятся только в этом браузере, без хранилища просто не запоминаются
  const boxes = document.querySelectorAll('li.chk input[type=checkbox]');
  if (boxes.length) {
    const key = 'wowf-check:' + location.pathname;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { saved = []; }
    boxes.forEach((b, i) => {
      b.checked = saved.includes(i);
      b.addEventListener('change', () => {
        const on = [];
        boxes.forEach((x, j) => { if (x.checked) on.push(j); });
        try { localStorage.setItem(key, JSON.stringify(on)); } catch (e) { /* хранилище недоступно */ }
      });
    });
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* без service worker сайт просто не работает оффлайн */ });
  }
})();

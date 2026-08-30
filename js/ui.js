// js/ui.js – DOM rendering helpers (IIFE namespace)
(function(exports) {
  'use strict';

  let currentWord = null;

  exports.setCurrentWord = function(w) { currentWord = w; };
  exports.getCurrentWord = function() { return currentWord; };

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ===== CARD =====
  exports.renderCard = function(word) {
    currentWord = word;
    const container = document.getElementById('card-container');

    const card = document.createElement('div');
    card.className = 'flash-card';
    card.id = 'flash-card';

    const sentence = word.sentence
      ? `<div class="card-sentence">💬 ${escapeHtml(word.sentence)}</div>`
      : `<div class="card-sentence" style="color:var(--text-muted);font-style:normal;">Örnek cümle yok.</div>`;

    card.innerHTML = `
      <div class="card-category">🇫🇷 Fransızca Kelime</div>
      <div class="card-fr-row">
        <div class="card-fr-word">${escapeHtml(word.fr)}</div>
        <button id="speak-btn" title="Seslendir" aria-label="Seslendir">🔊</button>
      </div>
      <div class="card-tr-meaning">${escapeHtml(word.tr)}</div>
      <div class="card-divider"></div>
      ${sentence}
    `;

    const old = document.getElementById('flash-card');
    if (old) old.remove();

    const actions = document.getElementById('card-actions');
    container.insertBefore(card, actions);

    card.querySelector('#speak-btn').addEventListener('click', function() {
      const btn = this;
      btn.classList.add('speaking');
      const utter = window.Speech.speak(word.fr);
      if (utter) {
        utter.onend = () => btn.classList.remove('speaking');
        utter.onerror = () => btn.classList.remove('speaking');
      } else {
        setTimeout(() => btn.classList.remove('speaking'), 1200);
      }
    });
  };

  exports.animateCardOut = function(direction) {
    return new Promise(resolve => {
      const card = document.getElementById('flash-card');
      if (!card) { resolve(); return; }
      card.classList.add(direction === 'left' ? 'leaving-left' : 'leaving');
      setTimeout(resolve, 340);
    });
  };

  // ===== FAVORITES =====
  exports.renderFavorites = function(list) {
    const el = document.getElementById('favorites-list');
    if (!list || list.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <div class="empty-title">Henüz favori yok</div>
          <div class="empty-desc">Kelimeler ekranında ⭐ Favorile butonuna basarak kelimeleri buraya ekleyebilirsiniz.</div>
        </div>`;
      return;
    }
    el.innerHTML = '';
    list.forEach((word, i) => {
      const item = document.createElement('div');
      item.className = 'fav-item';
      item.style.animationDelay = (i * 40) + 'ms';
      item.innerHTML = `
        <div class="fav-item-icon">⭐</div>
        <div class="fav-item-text">
          <div class="fav-item-fr">${escapeHtml(word.fr)}</div>
          <div class="fav-item-tr">${escapeHtml(word.tr)}</div>
        </div>
        <div class="fav-item-arrow">›</div>
      `;
      item.addEventListener('click', () => exports.openModal(word));
      el.appendChild(item);
    });
  };

  // ===== MODAL =====
  exports.openModal = function(word) {
    document.getElementById('modal-fr-word').textContent = word.fr;
    document.getElementById('modal-tr-meaning').textContent = word.tr;
    document.getElementById('modal-sentence').textContent = word.sentence || 'Örnek cümle yok.';
    document.getElementById('modal-overlay').classList.add('open');
  };

  exports.closeModal = function() {
    document.getElementById('modal-overlay').classList.remove('open');
  };

  // ===== STATS =====
  exports.renderStats = function(stats) {
    animateNumber('stat-total', stats.total);
    animateNumber('stat-learned', stats.done);
    animateNumber('stat-remaining', stats.unlearned);
    animateNumber('stat-fav', stats.favorite);
    const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    document.getElementById('progress-pct').textContent = '%' + pct;
    document.getElementById('progress-fill').style.width = pct + '%';
  };

  function animateNumber(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const diff = target - start;
    if (diff === 0) { el.textContent = target; return; }
    const duration = 600;
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const prog = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      el.textContent = Math.round(start + diff * ease);
      if (prog < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ===== TOAST =====
  let toastTimer = null;
  exports.showToast = function(msg, type) {
    type = type || 'info';
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'show ' + type;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = ''; }, 3000);
  };

  // ===== EMPTY STATE =====
  exports.renderNoMoreWords = function() {
    const container = document.getElementById('card-container');
    const old = document.getElementById('flash-card');
    if (old) old.remove();
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.id = 'flash-card';
    empty.innerHTML = `
      <div class="empty-icon">🎉</div>
      <div class="empty-title">Mükemmel!</div>
      <div class="empty-desc">Havuzdaki tüm kelimeleri tamamladınız. Daha fazla kelime için "Sayaç" sekmesinden senkronize edebilirsiniz.</div>
    `;
    const actions = document.getElementById('card-actions');
    container.insertBefore(empty, actions);
  };

})(window.UI = window.UI || {});

// js/app.js – Ana uygulama mantığı (no ES modules)
(function() {
  'use strict';

  // ===== INIT =====
  async function init() {
    showLoading(true);
    try {
      await DB.initDB();
      await DB.seedWords(window.WORD_DATA);
      Speech.initSpeech();
      setupNav();
      setupWordButtons();
      setupModal();
      setupSync();
      await loadNextCard();
      showLoading(false);
    } catch (err) {
      console.error('Init error:', err);
      showLoading(false);
      UI.showToast('Başlatma hatası: ' + (err.message || err), 'error');
    }
  }

  // ===== LOADING =====
  function showLoading(show) {
    const el = document.getElementById('loading-overlay');
    if (!el) return;
    if (show) {
      el.style.opacity = '1';
      el.style.pointerEvents = 'all';
    } else {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 600);
    }
  }

  // ===== BOTTOM NAV =====
  function setupNav() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const panels = document.querySelectorAll('.tab-panel');

    navBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        const target = btn.dataset.tab;
        navBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(target + '-panel').classList.add('active');
        if (target === 'favorites') refreshFavorites();
        if (target === 'stats') refreshStats();
      });
    });
  }

  // ===== CARD FLOW =====
  async function loadNextCard() {
    const word = await DB.getNextWord();
    if (!word) { UI.renderNoMoreWords(); return; }
    UI.renderCard(word);
  }

  async function handleAction(status, direction) {
    const word = UI.getCurrentWord();
    if (!word) return;
    await UI.animateCardOut(direction || 'right');
    await DB.updateWordStatus(word.id, status);
    await loadNextCard();
  }

  function setupWordButtons() {
    document.getElementById('btn-no').addEventListener('click', function() {
      handleAction('unlearned', 'left');
    });

    document.getElementById('btn-skip').addEventListener('click', function() {
      UI.animateCardOut('right').then(loadNextCard);
    });

    document.getElementById('btn-yes').addEventListener('click', function() {
      handleAction('learned', 'right');
      UI.showToast('✅ Öğrenildi!', 'success');
    });

    document.getElementById('btn-fav').addEventListener('click', async function() {
      const word = UI.getCurrentWord();
      if (!word) return;
      await UI.animateCardOut('right');
      await DB.updateWordStatus(word.id, 'favorite');
      UI.showToast('⭐ Favorilere eklendi!', 'success');
      await loadNextCard();
    });
  }

  // ===== FAVORITES =====
  async function refreshFavorites() {
    try {
      const list = await DB.getFavorites();
      UI.renderFavorites(list);
    } catch (err) { UI.showToast('Favoriler yüklenemedi', 'error'); }
  }

  // ===== STATS =====
  async function refreshStats() {
    try {
      const stats = await DB.getStats();
      UI.renderStats(stats);
    } catch (err) { UI.showToast('İstatistikler yüklenemedi', 'error'); }
  }

  // ===== MODAL =====
  function setupModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) UI.closeModal();
    });
    document.getElementById('modal-speak-btn').addEventListener('click', function() {
      Speech.speak(document.getElementById('modal-fr-word').textContent);
    });
  }

  // ===== SYNC =====
  function setupSync() {
    const btn = document.getElementById('sync-btn');
    btn.addEventListener('click', async function() {
      btn.classList.add('syncing');
      btn.disabled = true;
      try {
        const added = await DB.syncWords(window.WORD_DATA);
        if (added > 0) {
          UI.showToast('✅ ' + added + ' yeni kelime eklendi!', 'success');
        } else {
          UI.showToast('ℹ️ Yeni kelime yok, liste güncel.', 'info');
        }
      } catch (err) {
        UI.showToast('Senkronizasyon hatası: ' + (err.message || ''), 'error');
      } finally {
        btn.classList.remove('syncing');
        btn.disabled = false;
      }
    });
  }

  // ===== START =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

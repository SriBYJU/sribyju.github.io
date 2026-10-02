(() => {
  'use strict';

  const ADMIN_EMAIL = 'admin@gradescope.app';
  const PREVIEW_PARAM = 'reviewPreview';
  let reviews = [];
  let activeFilter = 'all';
  let selectedRating = 0;
  let initialized = false;
  let observer = null;

  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function currentUser() {
    return window.currentUser || window._gsUser || window._gsAuth?.currentUser || null;
  }

  function isAdmin() {
    return (currentUser()?.email || '').trim().toLowerCase() === ADMIN_EMAIL;
  }

  function accountName() {
    const user = currentUser();
    return (user?.displayName || window._gsProfile?.name || '').trim();
  }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0,2).toUpperCase() || '?';
  }

  function monthKeyToLabel(value) {
    const raw = String(value || '').trim();
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(raw);
    if (!match) return '';
    const d = new Date(Number(match[1]), Number(match[2]) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function stars(rating) {
    const n = Math.max(0, Math.min(5, Number(rating) || 0));
    return '<span class="reviews-star-row" aria-label="' + n + ' out of 5 stars">' +
      Array.from({length:5}, (_,i) => i < n ? '★' : '☆').join('') + '</span>';
  }

  function previewMode() {
    try { return new URLSearchParams(location.search).get(PREVIEW_PARAM) === '1'; }
    catch { return false; }
  }

  function normalizedFixtures() {
    if (!previewMode() || !Array.isArray(window.SCHOLARK_REVIEW_FIXTURES)) return [];
    return window.SCHOLARK_REVIEW_FIXTURES.map((r, index) => ({
      id: 'fixture-' + index,
      uid: null,
      displayName: r.displayName || r.name || 'Scholark user',
      rating: Number(r.rating) || 5,
      body: r.body || r.review || '',
      createdMonth: r.createdMonth || r.month || '',
      source: 'preview'
    }));
  }

  function reviewMonthNow() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0');
  }

  function setMessage(text, type) {
    const el = $('review-inline-message');
    if (!el) return;
    if (!text) {
      el.textContent = '';
      el.className = 'review-inline-message';
      return;
    }
    el.textContent = text;
    el.className = 'review-inline-message show ' + (type || '');
  }

  function updateAccountChip() {
    const nameEl = $('review-account-name');
    const metaEl = $('review-account-meta');
    const avatarEl = $('review-account-avatar');
    const user = currentUser();
    if (!nameEl || !metaEl || !avatarEl) return;

    if (!user) {
      nameEl.textContent = 'Sign in required';
      metaEl.textContent = 'Your Scholark account name appears automatically';
      avatarEl.textContent = 'S';
      return;
    }

    const name = accountName();
    nameEl.textContent = name || 'Account name unavailable';
    metaEl.textContent = 'Shown exactly as your Scholark account name';
    avatarEl.textContent = initials(name || 'S');
  }

  function renderPicker() {
    document.querySelectorAll('.review-star-btn').forEach((btn) => {
      const value = Number(btn.dataset.rating);
      btn.classList.toggle('active', value <= selectedRating);
      btn.setAttribute('aria-pressed', value === selectedRating ? 'true' : 'false');
    });
    const label = $('review-rating-label');
    if (label) label.textContent = selectedRating ? selectedRating + ' / 5' : 'Choose a rating';
  }

  function openComposer() {
    const user = currentUser();
    if (!user) {
      if (typeof window.openAuth === 'function') window.openAuth('login', 'Sign in to leave a Scholark review');
      return;
    }

    const composer = $('review-composer');
    if (!composer) return;
    updateAccountChip();
    const existing = reviews.find(r => r.uid && r.uid === user.uid);
    selectedRating = existing ? Number(existing.rating) || 0 : 0;
    const body = $('review-body');
    if (body) body.value = existing?.body || '';
    const submit = $('review-submit');
    if (submit) submit.textContent = existing ? 'Update review' : 'Publish review';
    renderPicker();
    setMessage('', '');
    composer.classList.add('open');
    composer.setAttribute('aria-hidden','false');
    setTimeout(() => composer.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center'}), 30);
  }

  function closeComposer() {
    const composer = $('review-composer');
    if (!composer) return;
    composer.classList.remove('open');
    composer.setAttribute('aria-hidden','true');
    setMessage('', '');
  }

  async function submitReview() {
    const user = currentUser();
    if (!user) return openComposer();
    const name = accountName();
    if (!name) {
      setMessage('Your Scholark account needs a display name before you can publish a review.', 'error');
      return;
    }
    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
      setMessage('Choose a rating from 1 to 5 stars.', 'error');
      return;
    }
    if (typeof window._dbSaveReview !== 'function') {
      setMessage('Reviews are not connected to the cloud yet. Please reload and try again.', 'error');
      return;
    }

    const body = ($('review-body')?.value || '').trim();
    if (body.length > 800) {
      setMessage('Keep your review to 800 characters or fewer.', 'error');
      return;
    }

    const button = $('review-submit');
    if (button) { button.disabled = true; button.textContent = 'Saving…'; }
    setMessage('', '');

    try {
      await window._dbSaveReview({
        uid: user.uid,
        displayName: name,
        rating: selectedRating,
        body,
        createdMonth: reviewMonthNow()
      });
      setMessage('Your review is live. Thank you for sharing your experience.', 'success');
      await loadReviews();
      if (button) button.textContent = 'Update review';
    } catch (error) {
      console.error('Review save failed:', error);
      setMessage('Could not save your review. Please try again.', 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function removeReview(reviewId) {
    if (!isAdmin()) return;
    const target = reviews.find(r => r.id === reviewId);
    if (!target || target.source === 'preview') {
      if (typeof window.showToast === 'function') window.showToast('Preview reviews are fixture data, not live Firestore reviews.', 'error');
      return;
    }
    if (!confirm('Remove this review from Scholark?')) return;
    try {
      await window._dbDeleteReview(reviewId);
      if (typeof window.showToast === 'function') window.showToast('Review removed.');
      await loadReviews();
    } catch (error) {
      console.error('Review delete failed:', error);
      if (typeof window.showToast === 'function') window.showToast('Could not remove that review.', 'error');
    }
  }

  function visibleReviews() {
    if (activeFilter === 'all') return reviews;
    const wanted = Number(activeFilter);
    return reviews.filter(r => Number(r.rating) === wanted);
  }

  function renderSummary() {
    const count = reviews.length;
    const average = count ? reviews.reduce((sum,r) => sum + (Number(r.rating) || 0),0) / count : 0;
    const rounded = count ? average.toFixed(1) : '—';

    document.querySelectorAll('[data-review-average]').forEach(el => el.textContent = rounded);
    document.querySelectorAll('[data-review-count]').forEach(el => el.textContent = count.toLocaleString());
    document.querySelectorAll('[data-review-stars]').forEach(el => {
      const full = count ? Math.round(average) : 0;
      el.innerHTML = stars(full);
    });

    for (let rating = 5; rating >= 1; rating--) {
      const n = reviews.filter(r => Number(r.rating) === rating).length;
      const pct = count ? Math.round((n / count) * 100) : 0;
      const fill = $('review-breakdown-' + rating);
      const num = $('review-breakdown-count-' + rating);
      if (fill) fill.style.width = pct + '%';
      if (num) num.textContent = n;
    }

    const toolbar = $('reviews-toolbar-count');
    if (toolbar) toolbar.textContent = count ? count + (count === 1 ? ' review' : ' reviews') : 'No reviews yet';

    const previewBadge = $('reviews-preview-badge');
    if (previewBadge) previewBadge.style.display = previewMode() && normalizedFixtures().length ? 'inline-flex' : 'none';
  }

  function renderFilters() {
    document.querySelectorAll('.review-filter').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === activeFilter);
    });
  }

  function cardHTML(review) {
    const body = String(review.body || '').trim();
    const month = monthKeyToLabel(review.createdMonth);
    const name = String(review.displayName || 'Scholark user').trim();
    const adminControl = isAdmin() && review.source !== 'preview'
      ? '<button class="review-card-admin-remove" type="button" data-remove-review="' + esc(review.id) + '">Remove</button>'
      : '';

    return '<article class="review-card" data-review-card>' +
      '<div class="review-card-top">' + stars(review.rating) +
      '<span class="review-card-month">' + esc(month) + '</span></div>' +
      '<div class="review-card-body' + (body ? '' : ' review-empty') + '">' +
      (body ? '“' + esc(body) + '”' : 'Star rating only') + '</div>' +
      '<div class="review-card-author"><div class="review-author-avatar">' + esc(initials(name)) + '</div>' +
      '<div><div class="review-author-name">' + esc(name) + '</div>' +
      '<div class="review-author-sub">Scholark review</div></div></div>' +
      adminControl + '</article>';
  }

  function observeCards() {
    if (observer) observer.disconnect();
    const cards = [...document.querySelectorAll('[data-review-card]')];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      cards.forEach(c => c.classList.add('review-visible'));
      return;
    }
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('review-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold:.12});
    cards.forEach((card,index) => {
      card.style.transitionDelay = Math.min(index, 8) * 35 + 'ms';
      observer.observe(card);
    });
  }

  function renderGrid() {
    const grid = $('reviews-grid');
    if (!grid) return;
    const list = visibleReviews();
    if (!list.length) {
      grid.innerHTML = '<div class="reviews-empty"><strong>No reviews in this filter yet.</strong><span>Be the first to share your experience with Scholark.</span></div>';
      return;
    }
    grid.innerHTML = list.map(cardHTML).join('');
    grid.querySelectorAll('[data-remove-review]').forEach(btn => {
      btn.addEventListener('click', () => removeReview(btn.dataset.removeReview));
    });
    observeCards();
  }

  function render() {
    renderSummary();
    renderFilters();
    renderGrid();
    updateAccountChip();
  }

  async function loadReviews() {
    const grid = $('reviews-grid');
    if (grid) {
      grid.innerHTML = '<div class="reviews-load-state"><div class="review-skeleton"></div><div class="review-skeleton"></div><div class="review-skeleton"></div></div>';
    }

    let live = [];
    if (typeof window._dbGetReviews === 'function') {
      try { live = await window._dbGetReviews(); }
      catch (error) { console.error('Review load failed:', error); }
    }

    const fixtures = normalizedFixtures();
    reviews = [...live, ...fixtures].sort((a,b) => {
      const monthSort = String(b.createdMonth || '').localeCompare(String(a.createdMonth || ''));
      if (monthSort) return monthSort;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
    render();
  }

  function bind() {
    document.querySelectorAll('[data-open-review-composer]').forEach(btn => btn.addEventListener('click', openComposer));
    $('review-close')?.addEventListener('click', closeComposer);
    $('review-submit')?.addEventListener('click', submitReview);

    document.querySelectorAll('.review-star-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        const hover = Number(btn.dataset.rating);
        document.querySelectorAll('.review-star-btn').forEach(b => b.classList.toggle('active', Number(b.dataset.rating) <= hover));
      });
      btn.addEventListener('mouseleave', renderPicker);
      btn.addEventListener('click', () => {
        selectedRating = Number(btn.dataset.rating);
        renderPicker();
      });
    });

    document.querySelectorAll('.review-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.filter || 'all';
        renderFilters();
        renderGrid();
      });
    });
  }

  async function init() {
    if (!initialized) {
      bind();
      initialized = true;
    }
    await loadReviews();
  }

  function authChanged() {
    updateAccountChip();
    renderGrid();
    const composer = $('review-composer');
    if (composer?.classList.contains('open') && !currentUser()) closeComposer();
  }

  window.ScholarkReviews = {
    init,
    reload: loadReviews,
    openComposer,
    closeComposer,
    authChanged,
    formatMonth: monthKeyToLabel
  };
})();

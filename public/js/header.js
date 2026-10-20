// ══════════════════════════════════════════════════════════
// 🧭 Header: search panel opened from the magnifier, and a slimmer header
// once the page scrolls.
// ══════════════════════════════════════════════════════════

function toggleHeaderSearch(force) {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const open = typeof force === 'boolean' ? force : !header.classList.contains('search-open');
  header.classList.toggle('search-open', open);
  if (open) setTimeout(() => document.getElementById('mainSearchInput')?.focus(), 60);
}

(function wireHeader() {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      document.body.classList.toggle('header-compact', window.scrollY > 120);
      ticking = false;
    });
  }, { passive: true });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleHeaderSearch(false); });
  // Picking a section from the menu closes the search panel.
  document.addEventListener('click', e => {
    if (e.target.closest('.main-nav a')) toggleHeaderSearch(false);
  });
})();

// ── Nav Drawer (menu lateral ⋯) ──────────────────────────────
(function () {
  const btn     = document.getElementById('navMenuBtn');
  const drawer  = document.getElementById('navDrawer');
  const overlay = document.getElementById('navDrawerOverlay');
  const closeBtn = document.getElementById('navDrawerClose');

  if (!btn || !drawer) return;

  function openDrawer() {
    drawer.classList.add('nav-drawer--open');
    overlay.classList.add('nav-drawer-overlay--visible');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('nav-drawer--open');
    overlay.classList.remove('nav-drawer-overlay--visible');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  // Fecha com ESC
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  // Marca o link ativo com base na URL atual
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-drawer-link').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('nav-drawer-link--active');
    }
  });
})();

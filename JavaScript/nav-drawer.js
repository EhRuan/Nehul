/* ============================================
   NEHUL – nav-drawer.js
   Controla o painel lateral de navegação (☰)
   ============================================ */
(function () {
  const btn      = document.getElementById('navMenuBtn');
  const drawer   = document.getElementById('navDrawer');
  const overlay  = document.getElementById('navDrawerOverlay');
  const closeBtn = document.getElementById('navDrawerClose');

  if (!btn || !drawer) return;

  function open() {
    drawer.classList.add('nav-drawer--open');
    overlay.classList.add('nav-drawer-overlay--visible');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    drawer.classList.remove('nav-drawer--open');
    overlay.classList.remove('nav-drawer-overlay--visible');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });

  // Marca link ativo
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-drawer-link').forEach(function (link) {
    if (link.getAttribute('href') === current) {
      link.classList.add('nav-drawer-link--active');
    }
  });
})();

/* ============================================
   NEHUL – Museu Digital
   app.js — interações da página
   ============================================ */

// Navegação: ativa o link correspondente à seção atual
document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', function () {
    document.querySelectorAll('.nav a').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
  });
});

// Cards de navegação: pronto para receber ação de roteamento
document.querySelectorAll('.nav-card').forEach(card => {
  card.addEventListener('click', function () {
    const title = this.querySelector('h3').textContent.trim();
    console.log('Navegar para:', title);
    // Adicione aqui o roteamento quando integrar com o resto do site
  });
});

// Botões do hero
document.querySelector('.btn-primary')?.addEventListener('click', () => {
  console.log('Explorar Exposições clicado');
  // Adicione aqui a navegação para a seção de exposições
});

document.querySelector('.btn-secondary')?.addEventListener('click', () => {
  document.querySelector('.sobre')?.scrollIntoView({ behavior: 'smooth' });
});

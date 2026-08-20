(function(){
  // ---------------------------------------------------------
  // Carrossel "cover flow": navegação manual apenas (sem autoplay,
  // sem bolinhas). A imagem central fica nítida e em destaque;
  // as laterais ficam menores, borradas e com opacidade reduzida.
  // ---------------------------------------------------------
  const track   = document.getElementById('track');
  const slides  = Array.from(track.querySelectorAll('.slide'));
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const curNum  = document.getElementById('curNum');
  const total   = slides.length;

  let current = 0;

  // Marca imagens em retrato para ajustar a proporção do quadro.
  slides.forEach(s => {
    const img = s.querySelector('img');
    const setPortrait = () => {
      if (img.naturalHeight > img.naturalWidth) s.setAttribute('data-portrait','1');
    };
    if (img.complete) setPortrait(); else img.addEventListener('load', setPortrait);
  });

  function spacing(){
    // distância horizontal entre slides, responsiva ao tamanho da tela
    const w = window.innerWidth;
    if (w < 480) return w * 0.52;
    if (w < 720) return w * 0.40;
    if (w < 1100) return w * 0.30;
    return 300;
  }

  function render(){
    const sp = spacing();
    slides.forEach((slide, i) => {
      // menor distância circular até o slide atual
      let offset = i - current;
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;

      const abs = Math.abs(offset);
      const img = slide.querySelector('img');

      let scale, opacity, blur, z, rotate;

      if (abs === 0){
        scale = 1; opacity = 1; blur = 0; z = 100; rotate = 0;
      } else if (abs === 1){
        scale = 0.72; opacity = 0.55; blur = 3; z = 90 - abs; rotate = offset > 0 ? -22 : 22;
      } else if (abs === 2){
        scale = 0.56; opacity = 0.30; blur = 6; z = 90 - abs; rotate = offset > 0 ? -28 : 28;
      } else if (abs === 3){
        scale = 0.44; opacity = 0.15; blur = 8; z = 90 - abs; rotate = offset > 0 ? -32 : 32;
      } else {
        scale = 0.36; opacity = 0; blur = 8; z = 0; rotate = offset > 0 ? -32 : 32;
      }

      const tx = offset * sp;
      slide.style.transform =
        `translate(-50%,-50%) translateX(${tx}px) scale(${scale}) rotateY(${rotate}deg)`;
      slide.style.zIndex = z;
      slide.style.opacity = opacity;
      slide.style.pointerEvents = abs === 0 ? 'auto' : (abs <= 3 ? 'none' : 'none');
      img.style.filter = blur ? `blur(${blur}px) saturate(0.9) brightness(0.85)` : 'none';

      slide.classList.toggle('is-center', abs === 0);
    });
    curNum.textContent = (current + 1);
  }

  function go(delta){
    current = (current + delta + total) % total;
    render();
  }

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  // Deslizar (touch/swipe) para navegação em telas sensíveis ao toque
  let touchStartX = null;
  const vp = document.querySelector('.viewport');
  vp.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, {passive:true});
  vp.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStartX = null;
  }, {passive:true});

  // Clique em uma imagem lateral também navega até ela
  slides.forEach((slide, i) => {
    slide.querySelector('.frame').addEventListener('click', () => {
      if (i !== current) { current = i; render(); }
    });
    slide.querySelector('.frame').style.cursor = 'pointer';
  });

  window.addEventListener('resize', render);
  render();
})();
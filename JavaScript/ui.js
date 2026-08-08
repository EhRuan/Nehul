/* ============================================
   NEHUL – Museu Digital
   ui.js — interações compartilhadas por todas as
   páginas: menu mobile e estado ativo da navegação.
   ============================================ */

// Marca o link correspondente à página atual como ativo
(function markActiveNav() {
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a, .mobile-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === current || (current === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });
})();

// Menu mobile (hambúrguer)
const mobileToggle = document.getElementById("mobileNavToggle");
const mobileNav = document.getElementById("mobileNav");
if (mobileToggle && mobileNav) {
  mobileToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    mobileToggle.setAttribute("aria-expanded", String(isOpen));
  });
  mobileNav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      mobileNav.classList.remove("is-open");
      mobileToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Botão "Conhecer o NEHUL" no hero rola até a seção Sobre (apenas no index)
document.querySelector(".btn-secondary")?.addEventListener("click", () => {
  document.querySelector("#sobre")?.scrollIntoView({ behavior: "smooth" });
});

document.querySelector(".btn-primary")?.addEventListener("click", () => {
  document.querySelector("#vitrine")?.scrollIntoView({ behavior: "smooth" });
});

/* ============================================
   NEHUL – Museu Digital
   projects.js — funções compartilhadas de busca e
   renderização de projetos (usadas nas páginas
   públicas: andamento, futuros, realizados e index).
   ============================================ */

const STATUS_META = {
  futuro:     { label: "Futuro",      page: "futuros.html",    badgeClass: "status-badge--futuro" },
  andamento:  { label: "Em andamento",page: "andamento.html",  badgeClass: "status-badge--andamento" },
  realizado:  { label: "Realizado",   page: "realizados.html", badgeClass: "status-badge--realizado" },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// Extrai o ID de um vídeo do YouTube usando o parser de URL de verdade —
// funciona independente da ordem dos parâmetros (ex: vindo de playlist,
// onde "v=" não é o primeiro parâmetro) ou do formato do link.
function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") {
      return u.pathname.slice(1, 12) || null;
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch (e) { /* URL inválida — ignora */ }
  return null;
}

// Extrai o ID do Vimeo, incluindo o hash de vídeos "não listados"
// (ex: vimeo.com/123456789/abcd1234ef precisa do hash pra tocar)
function extractVimeoId(url) {
  try {
    const u = new URL(url);
    if (!/(^|\.)vimeo\.com$/.test(u.hostname)) return null;
    const m = u.pathname.match(/(\d+)(?:\/([a-zA-Z0-9]+))?/);
    if (!m) return null;
    return m[2] ? `${m[1]}?h=${m[2]}` : m[1];
  } catch (e) {
    return null;
  }
}

// Detecta YouTube/Vimeo e monta o embed; se não reconhecer o link nem for
// um arquivo de vídeo direto, mostra um link clicável em vez de deixar a
// área em branco.
function buildVideoEmbed(url) {
  const ytId = extractYouTubeId(url);
  if (ytId) {
    const iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube.com/embed/" + ytId;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    return iframe;
  }

  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    const iframe = document.createElement("iframe");
    iframe.src = "https://player.vimeo.com/video/" + vimeoId;
    iframe.allow = "autoplay; fullscreen; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    return iframe;
  }

  if (/\.(mp4|webm|ogv|ogg|mov)(\?.*)?$/i.test(url)) {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    return video;
  }

  // Fallback: nunca fica em branco silenciosamente
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "media-carousel__fallback-link";
  link.textContent = "▶ Assistir vídeo";
  return link;
}

function buildMedia(project) {
  const items = [];
  (project.image_urls || []).forEach((url) => items.push({ type: "image", url }));
  (project.video_urls || []).forEach((url) => items.push({ type: "video", url }));

  const wrap = document.createElement("div");
  wrap.className = "project-card__media";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "project-card__media-empty";
    empty.textContent = "Sem mídia ainda";
    wrap.appendChild(empty);
    return wrap;
  }

  const viewport = document.createElement("div");
  viewport.className = "media-carousel__viewport";
  wrap.appendChild(viewport);

  let index = 0;
  let counterEl = null;

  function renderItem() {
    viewport.innerHTML = "";
    const item = items[index];
    if (item.type === "image") {
      const img = document.createElement("img");
      img.src = item.url;
      img.alt = project.title;
      img.loading = "lazy";
      viewport.appendChild(img);
    } else {
      viewport.appendChild(buildVideoEmbed(item.url));
    }
    if (counterEl) counterEl.textContent = (index + 1) + "/" + items.length;
  }

  if (items.length > 1) {
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "media-carousel__nav media-carousel__nav--prev";
    prev.innerHTML = "‹";
    prev.setAttribute("aria-label", "Mídia anterior");
    prev.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      index = (index - 1 + items.length) % items.length;
      renderItem();
    });

    const next = document.createElement("button");
    next.type = "button";
    next.className = "media-carousel__nav media-carousel__nav--next";
    next.innerHTML = "›";
    next.setAttribute("aria-label", "Próxima mídia");
    next.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      index = (index + 1) % items.length;
      renderItem();
    });

    counterEl = document.createElement("span");
    counterEl.className = "media-carousel__counter";

    wrap.append(prev, next, counterEl);
  }

  renderItem();
  return wrap;
}

// Card de projeto para as páginas de listagem (andamento/futuros/realizados)
function renderProjectCard(project) {
  const card = document.createElement("article");
  card.className = "project-card";
  card.appendChild(buildMedia(project));

  const body = document.createElement("div");
  body.className = "project-card__body";

  const title = document.createElement("h3");
  title.textContent = project.title;
  body.appendChild(title);

  if (project.description) {
    const desc = document.createElement("p");
    desc.className = "project-card__desc";
    desc.textContent = project.description;
    body.appendChild(desc);
  }

  const footer = document.createElement("div");
  footer.className = "project-card__footer";
  const date = document.createElement("span");
  date.textContent = formatDate(project.created_at);
  footer.appendChild(date);
  body.appendChild(footer);

  card.appendChild(body);
  return card;
}

async function fetchProjectsByStatus(status) {
  return supabaseClient
    .from("projects")
    .select("*")
    .eq("status", status)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });
}

// Usado pelas páginas andamento.html / futuros.html / realizados.html
async function initListingPage(status) {
  const grid = document.getElementById("projectsGrid");
  const empty = document.getElementById("emptyState");
  const loading = document.getElementById("loadState");

  loading.hidden = false;
  empty.hidden = true;
  grid.innerHTML = "";

  const { data, error } = await fetchProjectsByStatus(status);
  loading.hidden = true;

  if (error) {
    loading.hidden = false;
    loading.textContent = "Erro ao carregar projetos: " + error.message;
    return;
  }

  if (!data || data.length === 0) {
    empty.hidden = false;
    return;
  }

  data.forEach((project) => grid.appendChild(renderProjectCard(project)));
}
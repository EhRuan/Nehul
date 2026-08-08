/* ============================================
   NEHUL – Museu Digital
   home.js — vitrine dinâmica (index.html)
   Mostra um projeto por vez, embaralhado, com
   navegação anterior/próximo entre projetos, e
   cada card com seu próprio carrossel de mídia
   (imagens + vídeos) quando o projeto tem mais
   de um item.
   ============================================ */

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

let showcaseProjects = [];
let showcaseIndex = 0;

function renderShowcaseSlide() {
  const slide = document.getElementById("showcaseSlide");
  const counter = document.getElementById("showcaseCounter");
  slide.innerHTML = "";

  const project = showcaseProjects[showcaseIndex];
  if (!project) return;

  const meta = STATUS_META[project.status];

  const card = document.createElement("div");
  card.className = "showcase-card";

  card.appendChild(buildMedia(project));

  const body = document.createElement("div");
  body.className = "showcase-card__body";

  const badge = document.createElement("span");
  badge.className = "status-badge " + (meta ? meta.badgeClass : "");
  badge.textContent = meta ? meta.label : project.status;
  body.appendChild(badge);

  const title = document.createElement("h4");
  title.textContent = project.title;
  body.appendChild(title);

  if (project.description) {
    const desc = document.createElement("p");
    desc.textContent = project.description;
    body.appendChild(desc);
  }

  const cta = document.createElement("a");
  cta.className = "showcase-card__cta";
  cta.href = meta ? meta.page : "#";
  cta.textContent = "Ver na página de " + (meta ? meta.label.toLowerCase() : project.status) + " →";
  body.appendChild(cta);

  card.appendChild(body);
  slide.appendChild(card);

  counter.textContent = `${showcaseIndex + 1} de ${showcaseProjects.length}`;
}

function goTo(delta) {
  if (showcaseProjects.length === 0) return;
  showcaseIndex = (showcaseIndex + delta + showcaseProjects.length) % showcaseProjects.length;
  renderShowcaseSlide();
}

async function loadShowcase() {
  const frame = document.getElementById("showcaseFrame");
  const empty = document.getElementById("showcaseEmpty");
  const loading = document.getElementById("showcaseLoad");

  const { data, error } = await supabaseClient
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  loading.hidden = true;

  if (error) {
    loading.hidden = false;
    loading.textContent = "Erro ao carregar vitrine: " + error.message;
    return;
  }

  if (!data || data.length === 0) {
    empty.hidden = false;
    return;
  }

  showcaseProjects = shuffle(data);
  showcaseIndex = 0;
  frame.hidden = false;
  renderShowcaseSlide();
}

document.getElementById("showcasePrev")?.addEventListener("click", () => goTo(-1));
document.getElementById("showcaseNext")?.addEventListener("click", () => goTo(1));

loadShowcase();

/* ============================================
   NEHUL – Museu Digital
   memorial.js — linha do tempo dos projetos com
   status "realizado", em ordem cronológica.
   ============================================ */

async function loadTimeline() {
  const loading = document.getElementById("loadState");
  const empty = document.getElementById("emptyState");
  const section = document.getElementById("timelineSection");

  const { data, error } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("status", "realizado")
    .order("created_at", { ascending: true });

  loading.hidden = true;

  if (error) {
    loading.hidden = false;
    loading.textContent = "Erro ao carregar linha do tempo: " + error.message;
    return;
  }

  if (!data || data.length === 0) {
    empty.hidden = false;
    return;
  }

  data.forEach((project) => section.appendChild(renderTimelineItem(project)));
}

function renderTimelineItem(project) {
  const item = document.createElement("article");
  item.className = "timeline-item";

  const dot = document.createElement("span");
  dot.className = "timeline-item__dot";
  item.appendChild(dot);

  const card = document.createElement("div");
  card.className = "timeline-item__card";

  const year = document.createElement("div");
  year.className = "timeline-item__year";
  year.textContent = new Date(project.created_at).getFullYear();
  card.appendChild(year);

  card.appendChild(buildMedia(project));

  const body = document.createElement("div");
  body.className = "timeline-item__card-body";
  const title = document.createElement("h3");
  title.textContent = project.title;
  body.appendChild(title);
  if (project.description) {
    const desc = document.createElement("p");
    desc.textContent = project.description;
    body.appendChild(desc);
  }
  card.appendChild(body);

  item.appendChild(card);
  return item;
}

loadTimeline();

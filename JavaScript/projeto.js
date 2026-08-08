/* ============================================
   NEHUL – projeto.js
   Carrega e renderiza a página individual de um projeto.
   URL esperada: projeto.html?id=UUID_DO_PROJETO
   ============================================ */

const ROLES = [
  { key: "coordenador",   label: "Coordenador" },
  { key: "coorientador",  label: "Coorientador" },
  { key: "colaborador",   label: "Colaborador" },
  { key: "bolsista",      label: "Bolsista" },
  { key: "voluntario",    label: "Voluntário" },
];

async function initProjetoPage() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const loadEl      = document.getElementById("projetoLoad");
  const notFoundEl  = document.getElementById("projetoNotFound");
  const mainEl      = document.getElementById("projetoMain");

  if (!id) {
    loadEl.hidden = true;
    notFoundEl.hidden = false;
    return;
  }

  // Busca o projeto pelo ID
  const { data: project, error } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) {
    loadEl.hidden = true;
    notFoundEl.hidden = false;
    return;
  }

  loadEl.hidden = true;
  mainEl.hidden = false;

  // Atualiza o <title>
  document.title = project.title + " – NEHUL";

  // Breadcrumb
  const statusMeta = STATUS_META[project.status] || {};
  const breadcrumbStatus = document.getElementById("breadcrumbStatus");
  breadcrumbStatus.textContent = statusMeta.label || project.status;
  breadcrumbStatus.href = statusMeta.page || "index.html";
  document.getElementById("breadcrumbTitle").textContent = project.title;

  // Badge de status
  const badge = document.getElementById("projetoStatusBadge");
  badge.textContent = statusMeta.label || project.status;
  badge.className = "status-badge " + (statusMeta.badgeClass || "");

  // Título e descrição
  document.getElementById("projetoTitulo").textContent = project.title;
  const descEl = document.getElementById("projetoDescricao");
  if (project.description) {
    descEl.textContent = project.description;
  } else {
    descEl.hidden = true;
  }

  // Meta (data)
  const metaEl = document.getElementById("projetoMeta");
  if (project.created_at) {
    const dateSpan = document.createElement("span");
    dateSpan.className = "projeto-meta-item";
    dateSpan.textContent = "Cadastrado em " + formatDate(project.created_at);
    metaEl.appendChild(dateSpan);
  }

  // ── Mídia ──────────────────────────────────────
  const images = project.image_urls || [];
  const videos = project.video_urls || [];

  if (images.length > 0 || videos.length > 0) {
    document.getElementById("projetoMidiaSection").hidden = false;
    const midiaGrid = document.getElementById("projetoMidia");

    images.forEach((url) => {
      const wrap = document.createElement("div");
      wrap.className = "projeto-midia-item";
      const img = document.createElement("img");
      img.src = url;
      img.alt = project.title;
      img.loading = "lazy";
      wrap.appendChild(img);
      midiaGrid.appendChild(wrap);
    });

    videos.forEach((url) => {
      const wrap = document.createElement("div");
      wrap.className = "projeto-midia-item projeto-midia-item--video";
      wrap.appendChild(buildVideoEmbed(url));
      midiaGrid.appendChild(wrap);
    });
  }

  // ── Equipe ─────────────────────────────────────
  // Suporta tanto campos separados (coordenador, bolsista…) quanto
  // um campo JSON "members" com array [{role, name}]
  const membros = [];

  // Tenta campo JSON members primeiro
  if (project.members && Array.isArray(project.members)) {
    project.members.forEach((m) => membros.push(m));
  } else {
    // Campos individuais por papel
    ROLES.forEach(({ key, label }) => {
      const val = project[key];
      if (!val) return;
      const names = Array.isArray(val) ? val : [val];
      names.forEach((name) => membros.push({ role: label, name }));
    });
  }

  if (membros.length > 0) {
    document.getElementById("projetoEquipeSection").hidden = false;
    const equipeGrid = document.getElementById("projetoEquipe");

    membros.forEach(({ role, name }) => {
      const card = document.createElement("div");
      card.className = "equipe-card";

      const avatar = document.createElement("div");
      avatar.className = "equipe-avatar";
      avatar.textContent = name.charAt(0).toUpperCase();

      const info = document.createElement("div");
      info.className = "equipe-info";

      const nameEl = document.createElement("strong");
      nameEl.textContent = name;

      const roleEl = document.createElement("span");
      roleEl.textContent = role;

      info.appendChild(nameEl);
      info.appendChild(roleEl);
      card.appendChild(avatar);
      card.appendChild(info);
      equipeGrid.appendChild(card);
    });
  }
}

initProjetoPage();
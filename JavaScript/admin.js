/* ============================================
   NEHUL – Museu Digital
   admin.js — autenticação, CRUD e organização
   (ordem manual) dos projetos.
   ============================================ */

const STATUS_LABELS = { futuro: "Futuro", andamento: "Em andamento", realizado: "Realizado" };

let currentUser = null;
let allProjects = [];
let currentFilter = "todos";
let videoUrls = [];
let pendingVideoFiles = [];
let pendingImageFiles = [];
let existingImageUrls = [];

const el = (id) => document.getElementById(id);

// ============================================================
// AUTENTICAÇÃO
// ============================================================

async function initAuth() {
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session ? data.session.user : null;
  renderAuthState();

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session ? session.user : null;
    renderAuthState();
    if (currentUser) loadProjects();
  });
}

function renderAuthState() {
  const headerActions = el("adminHeaderActions");
  headerActions.innerHTML = "";

  if (currentUser) {
    el("adminLoginSection").hidden = true;
    el("adminPanel").hidden = false;

    const pill = document.createElement("span");
    pill.className = "auth-box__pill";
    pill.textContent = currentUser.email;
    const sair = document.createElement("button");
    sair.className = "link-btn";
    sair.textContent = "Sair";
    sair.onclick = async () => { await supabaseClient.auth.signOut(); };
    headerActions.append(pill, sair);
  } else {
    el("adminLoginSection").hidden = false;
    el("adminPanel").hidden = true;
  }
}

el("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = el("loginStatus");
  status.textContent = "Entrando…";
  status.className = "form-status";
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: el("lEmail").value,
    password: el("lSenha").value,
  });
  if (error) {
    status.textContent = "Não foi possível entrar: " + error.message;
    return;
  }
  status.textContent = "";
  el("loginForm").reset();
});

// ============================================================
// LISTAGEM
// ============================================================

async function loadProjects() {
  el("loadState").hidden = false;
  el("emptyState").hidden = true;

  const { data, error } = await supabaseClient
    .from("projects")
    .select("*")
    .order("status", { ascending: true })
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });

  el("loadState").hidden = true;

  if (error) {
    el("loadState").hidden = false;
    el("loadState").textContent = "Erro ao carregar: " + error.message;
    return;
  }
  allProjects = data;
  renderList();
}

function renderList() {
  const counts = { todos: allProjects.length, futuro: 0, andamento: 0, realizado: 0 };
  allProjects.forEach((p) => counts[p.status]++);
  Object.keys(counts).forEach((k) => { const c = el("count-" + k); if (c) c.textContent = counts[k]; });

  const list = currentFilter === "todos"
    ? allProjects
    : allProjects.filter((p) => p.status === currentFilter);

  const container = el("adminList");
  container.innerHTML = "";
  el("emptyState").hidden = list.length > 0;

  // agrupa por status para saber quem são os "vizinhos" na reordenação
  const groups = {};
  allProjects.forEach((p) => { (groups[p.status] ||= []).push(p); });

  list.forEach((project) => {
    container.appendChild(renderRow(project, groups[project.status]));
  });
}

function renderRow(project, siblings) {
  const idxInGroup = siblings.findIndex((p) => p.id === project.id);

  const row = document.createElement("div");
  row.className = "admin-row";

  const thumb = document.createElement("div");
  thumb.className = "admin-row__thumb";
  if (project.image_urls && project.image_urls[0]) {
    const img = document.createElement("img");
    img.src = project.image_urls[0];
    thumb.appendChild(img);
  } else {
    thumb.textContent = "—";
  }
  row.appendChild(thumb);

  const info = document.createElement("div");
  info.className = "admin-row__info";
  const badge = document.createElement("span");
  badge.className = "status-badge status-badge--" + project.status;
  badge.textContent = STATUS_LABELS[project.status];
  const title = document.createElement("strong");
  title.textContent = project.title;
  info.append(badge, title);
  row.appendChild(info);

  const order = document.createElement("div");
  order.className = "admin-row__order";
  const up = document.createElement("button");
  up.className = "btn-ghost btn-icon";
  up.textContent = "▲";
  up.disabled = idxInGroup <= 0;
  up.title = "Mover para cima";
  up.onclick = () => reorder(project, siblings, idxInGroup, -1);
  const down = document.createElement("button");
  down.className = "btn-ghost btn-icon";
  down.textContent = "▼";
  down.disabled = idxInGroup >= siblings.length - 1;
  down.title = "Mover para baixo";
  down.onclick = () => reorder(project, siblings, idxInGroup, 1);
  order.append(up, down);
  row.appendChild(order);

  const actions = document.createElement("div");
  actions.className = "admin-row__actions";
  const viewLink = document.createElement("a");
  viewLink.className = "btn-ghost";
  viewLink.textContent = "Ver";
  viewLink.href = "projeto.html?id=" + encodeURIComponent(project.id);
  viewLink.target = "_blank";
  viewLink.rel = "noopener noreferrer";
  actions.appendChild(viewLink);
  const editBtn = document.createElement("button");
  editBtn.className = "btn-ghost";
  editBtn.textContent = "Editar";
  editBtn.onclick = () => openForm(project);
  actions.appendChild(editBtn);
  row.appendChild(actions);

  return row;
}

async function reorder(project, siblings, idx, direction) {
  const neighbor = siblings[idx + direction];
  if (!neighbor) return;
  const a = { id: project.id, ordem: neighbor.ordem };
  const b = { id: neighbor.id, ordem: project.ordem };
  await Promise.all([
    supabaseClient.from("projects").update({ ordem: a.ordem }).eq("id", a.id),
    supabaseClient.from("projects").update({ ordem: b.ordem }).eq("id", b.id),
  ]);
  await loadProjects();
}

el("statusTabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
  btn.classList.add("is-active");
  currentFilter = btn.dataset.filter;
  renderList();
});

// ============================================================
// FORMULÁRIO (criar / editar)
// ============================================================

function openForm(project = null) {
  el("projectForm").reset();
  pendingImageFiles = [];
  existingImageUrls = project ? [...(project.image_urls || [])] : [];
  videoUrls = project ? [...(project.video_urls || [])] : [];
  pendingVideoFiles = [];
  renderImageChips();
  renderVideoChips();

  if (project) {
    el("formEyebrow").textContent = "editar projeto";
    el("formTitle").textContent = "Editar projeto";
    el("projectId").value = project.id;
    el("fTitulo").value = project.title;
    el("fDescricao").value = project.description || "";
    el("fStatus").value = project.status;
    el("btnExcluirRegistro").hidden = false;
  } else {
    el("formEyebrow").textContent = "novo projeto";
    el("formTitle").textContent = "Adicionar projeto";
    el("projectId").value = "";
    el("btnExcluirRegistro").hidden = true;
  }
  el("formStatus").textContent = "";
  el("formOverlay").hidden = false;
}

el("btnNovoProjeto").onclick = () => openForm();
el("btnFecharForm").onclick = () => { el("formOverlay").hidden = true; };
el("btnCancelarForm").onclick = () => { el("formOverlay").hidden = true; };
el("formOverlay").addEventListener("click", (e) => { if (e.target === el("formOverlay")) el("formOverlay").hidden = true; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") el("formOverlay").hidden = true; });

el("fImagens").addEventListener("change", (e) => {
  pendingImageFiles.push(...Array.from(e.target.files));
  renderImageChips();
  e.target.value = "";
});

function renderImageChips() {
  const wrap = el("imagensAtuais");
  wrap.innerHTML = "";
  existingImageUrls.forEach((url, i) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `<img src="${url}"> salva`;
    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "×";
    rm.onclick = () => { existingImageUrls.splice(i, 1); renderImageChips(); };
    chip.appendChild(rm);
    wrap.appendChild(chip);
  });
  pendingImageFiles.forEach((file, i) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = "📎 " + file.name;
    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "×";
    rm.onclick = () => { pendingImageFiles.splice(i, 1); renderImageChips(); };
    chip.appendChild(rm);
    wrap.appendChild(chip);
  });
}

function totalVideoCount() {
  return videoUrls.length + pendingVideoFiles.length;
}

el("btnAdicionarVideoLink").addEventListener("click", () => {
  const input = el("fVideoLink");
  const value = input.value.trim();
  if (!value) return;
  if (totalVideoCount() >= 5) {
    alert("Máximo de 5 vídeos por projeto.");
    return;
  }
  videoUrls.push(value);
  input.value = "";
  renderVideoChips();
});

el("fVideoArquivo").addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  const espacoRestante = 5 - totalVideoCount();
  if (espacoRestante <= 0) {
    alert("Máximo de 5 vídeos por projeto.");
    e.target.value = "";
    return;
  }
  pendingVideoFiles.push(...files.slice(0, espacoRestante));
  if (files.length > espacoRestante) alert("Só cabiam mais " + espacoRestante + " vídeo(s). O restante foi ignorado.");
  renderVideoChips();
  e.target.value = "";
});

function renderVideoChips() {
  const wrap = el("videosAtuais");
  wrap.innerHTML = "";
  videoUrls.forEach((url, i) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = "🔗 " + (url.length > 28 ? url.slice(0, 28) + "…" : url);
    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "×";
    rm.onclick = () => { videoUrls.splice(i, 1); renderVideoChips(); };
    chip.appendChild(rm);
    wrap.appendChild(chip);
  });
  pendingVideoFiles.forEach((file, i) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = "🎬 " + file.name;
    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "×";
    rm.onclick = () => { pendingVideoFiles.splice(i, 1); renderVideoChips(); };
    chip.appendChild(rm);
    wrap.appendChild(chip);
  });
}

el("projectForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = el("formStatus");
  const btnSalvar = el("btnSalvarForm");
  status.className = "form-status";
  status.textContent = "Salvando…";
  btnSalvar.disabled = true;

  try {
    const id = el("projectId").value || null;
    const newStatus = el("fStatus").value;

    const uploadedUrls = [];
    for (const file of pendingImageFiles) {
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      const { error: upErr } = await supabaseClient.storage.from("project-images").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabaseClient.storage.from("project-images").getPublicUrl(path);
      uploadedUrls.push(pub.publicUrl);
    }
    const finalImageUrls = [...existingImageUrls, ...uploadedUrls];

    const uploadedVideoUrls = [];
    for (const file of pendingVideoFiles) {
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      const { error: upErr } = await supabaseClient.storage.from("project-videos").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabaseClient.storage.from("project-videos").getPublicUrl(path);
      uploadedVideoUrls.push(pub.publicUrl);
    }
    const finalVideoUrls = [...videoUrls, ...uploadedVideoUrls].slice(0, 5);

    const payload = {
      title: el("fTitulo").value.trim(),
      description: el("fDescricao").value.trim(),
      status: newStatus,
      image_urls: finalImageUrls,
      video_urls: finalVideoUrls,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (id) {
      const existing = allProjects.find((p) => p.id === id);
      // se mudou de status, manda pro fim da nova coluna
      if (existing && existing.status !== newStatus) {
        payload.ordem = allProjects.filter((p) => p.status === newStatus).length;
      }
      ({ error } = await supabaseClient.from("projects").update(payload).eq("id", id));
    } else {
      payload.ordem = allProjects.filter((p) => p.status === newStatus).length;
      ({ error } = await supabaseClient.from("projects").insert(payload));
    }
    if (error) throw error;

    status.textContent = "Salvo!";
    status.classList.add("is-success");
    await loadProjects();
    setTimeout(() => { el("formOverlay").hidden = true; }, 350);
  } catch (err) {
    status.textContent = "Erro: " + err.message;
  } finally {
    btnSalvar.disabled = false;
  }
});

el("btnExcluirRegistro").addEventListener("click", async () => {
  const id = el("projectId").value;
  if (!id) return;
  if (!confirm("Excluir este projeto? Essa ação não pode ser desfeita.")) return;
  const { error } = await supabaseClient.from("projects").delete().eq("id", id);
  if (error) {
    el("formStatus").textContent = "Erro ao excluir: " + error.message;
    return;
  }
  el("formOverlay").hidden = true;
  await loadProjects();
});

// ============================================================
// INICIALIZAÇÃO
// ============================================================
(async function start() {
  await initAuth();
  if (currentUser) await loadProjects();
})();
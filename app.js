let tickets = [
  { id: "#2024-0012", client: "João Silva", priority: "Alta", status: "Aberto", tech: "-", date: "20/05/2024", service: "Manutenção de ar-condicionado" },
  { id: "#2024-0011", client: "Maria Santos", priority: "Média", status: "Em andamento", tech: "Carlos", date: "20/05/2024", service: "Manutenção preventiva" },
  { id: "#2024-0010", client: "Pedro Lima", priority: "Alta", status: "Aguardando peça", tech: "Rafael", date: "19/05/2024", service: "Vazamento de fluido refrigerante" },
  { id: "#2024-0009", client: "Fernanda Costa", priority: "Baixa", status: "Concluído", tech: "Carlos", date: "19/05/2024", service: "Higienização de evaporadora" },
  { id: "#2024-0008", client: "Marcos Paulo", priority: "Média", status: "Em deslocamento", tech: "Lucas", date: "18/05/2024", service: "Instalação de split" },
  { id: "#2024-0007", client: "Ana Beatriz", priority: "Baixa", status: "Cancelado", tech: "-", date: "18/05/2024", service: "Inspeção técnica" }
];

let clients = [
  { id: "client-1", name: "João Silva", phone: "(11) 99999-9999", city: "São Paulo", lastOs: "#2024-0012" },
  { id: "client-2", name: "Maria Santos", phone: "(11) 98888-8888", city: "Guarulhos", lastOs: "#2024-0011" },
  { id: "client-3", name: "Pedro Lima", phone: "(11) 97777-7777", city: "São Paulo", lastOs: "#2024-0010" },
  { id: "client-4", name: "Fernanda Costa", phone: "(11) 96666-6666", city: "Osasco", lastOs: "#2024-0009" },
  { id: "client-5", name: "Marcos Paulo", phone: "(11) 95555-5555", city: "São Bernardo", lastOs: "#2024-0008" },
  { id: "client-6", name: "Ana Beatriz", phone: "(11) 94444-4444", city: "Santo André", lastOs: "#2024-0007" }
];

let technicians = [
  { id: "tech-1", name: "Carlos Eduardo", phone: "(11) 91234-5678", status: "Disponível", initials: "CE" },
  { id: "tech-2", name: "Rafael Santos", phone: "(11) 92345-6789", status: "Em atendimento", initials: "RS" },
  { id: "tech-3", name: "Lucas Almeida", phone: "(11) 93456-7890", status: "Disponível", initials: "LA" },
  { id: "tech-4", name: "Diego Oliveira", phone: "(11) 94567-8901", status: "Em deslocamento", initials: "DO" },
  { id: "tech-5", name: "Bruno Ferreira", phone: "(11) 95678-9012", status: "Disponível", initials: "BF" }
];

const agenda = [
  ["08:00", "João Silva", "Instalação de ar-condicionado split"],
  ["09:30", "Maria Santos", "Manutenção preventiva"],
  ["11:00", "Pedro Lima", "Vazamento de fluido refrigerante"],
  ["14:00", "Fernanda Costa", "Higienização de evaporadora"],
  ["15:30", "Marcos Paulo", "Instalação de split"]
];

const users = {
  admin: {
    name: "Administrador",
    username: "yuriadm",
    email: "admin@yurimanutencoes.com",
    password: "123456",
    mode: "admin",
    label: "Admin"
  },
  tech: {
    name: "Carlos Técnico",
    email: "tecnico@yurimanutencoes.com",
    password: "123456",
    mode: "tech",
    label: "Técnico"
  },
  client: {
    name: "João Cliente",
    email: "cliente@yurimanutencoes.com",
    password: "123456",
    mode: "client",
    label: "Cliente"
  }
};

const serviceOrder = {
  id: "#2024-0012",
  client: "João Silva",
  technician: "Carlos Eduardo",
  service: "Manutenção de ar-condicionado",
  equipment: "Ar-condicionado Split 12.000 BTUs LG Dual Inverter",
  diagnosis: "Capacitor da condensadora danificado e serpentina com sujeira.",
  work: "Substituição do capacitor, limpeza da serpentina e testes realizados.",
  date: "20/05/2024",
  total: "R$ 470,00"
};

const statusClass = (status) => {
  if (status.includes("Concl")) return "green";
  if (status.includes("Cancel")) return "red";
  if (status.includes("Aguard")) return "gray";
  return "blue";
};

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
const apiBase = "/.netlify/functions";
const storageKeys = {
  tickets: "yuriTickets",
  technicians: "yuriTechnicians",
  clients: "yuriClients"
};
let deferredInstallPrompt = null;

function readStoredList(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.warn("Nao foi possivel ler dados locais.", error);
    return fallback;
  }
}

function saveStoredList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (error) {
    console.warn("Nao foi possivel salvar dados locais.", error);
  }
}

function loadLocalData() {
  tickets = readStoredList(storageKeys.tickets, tickets);
  technicians = readStoredList(storageKeys.technicians, technicians);
  clients = readStoredList(storageKeys.clients, clients);
}

function persistTickets() {
  saveStoredList(storageKeys.tickets, tickets);
}

function persistTechnicians() {
  saveStoredList(storageKeys.technicians, technicians);
}

function persistClients() {
  saveStoredList(storageKeys.clients, clients);
}

function hasNetlifyBackend() {
  return location.hostname.endsWith(".netlify.app") || location.hostname.includes("netlify");
}

function isTicketAssignedToCurrentTech(ticket) {
  return ["Carlos", "Carlos Eduardo"].includes(ticket.tech);
}

function refreshTicketViews() {
  renderTickets(qs(".segmented button.active")?.dataset.filter || "Todos", qs("#global-search")?.value || "");
  renderDashboard();
  renderMobileCards();
  syncTechCurrentOrder();
}

function isOnlineApp() {
  return location.protocol === "http:" || location.protocol === "https:";
}

function syncTechCurrentOrder() {
  const assignedTickets = tickets.filter(isTicketAssignedToCurrentTech);
  const current = assignedTickets.find((ticket) => !ticket.status.includes("Concl")) || assignedTickets[0];
  const osId = qs("#tech-os-id");
  const osTitle = qs("#tech-os-title");
  const diagnosis = qs("#tech-os-diagnosis");
  const statusPill = qs("#tech-os-status-pill");
  const finishButton = qs('[data-action="finish-tech-service"]');
  if (!statusPill || !finishButton) return;

  if (!current) {
    if (osId) osId.textContent = "Nenhuma OS";
    if (osTitle) osTitle.textContent = "Sem chamados disponíveis";
    if (diagnosis) diagnosis.textContent = "Quando houver um chamado aberto ou em andamento, ele aparecerá aqui.";
    statusPill.textContent = "Sem OS";
    statusPill.className = "pill gray";
    finishButton.textContent = "Sem serviço para finalizar";
    finishButton.disabled = true;
    delete finishButton.dataset.ticketId;
    return;
  }

  if (osId) osId.textContent = `OS ${current.id}`;
  if (osTitle) osTitle.textContent = current.service;
  if (diagnosis) diagnosis.textContent = current.workNotes || "Verifique o equipamento, registre o diagnóstico e finalize após o atendimento.";
  statusPill.textContent = current.status;
  statusPill.className = `pill ${statusClass(current.status)}`;
  finishButton.dataset.ticketId = current.id;

  if (current.status.includes("Concl")) {
    finishButton.textContent = "Último serviço finalizado";
    finishButton.disabled = true;
  } else {
    finishButton.textContent = "Finalizar serviço";
    finishButton.disabled = false;
  }
  renderTechPhotos(current);
}

function renderTechPhotos(ticket) {
  const grid = qs("#tech-photo-grid");
  if (!grid) return;

  const photos = Array.isArray(ticket?.photos) ? ticket.photos : [];
  if (!photos.length) {
    grid.innerHTML = '<span class="photo p1"></span><span class="photo p2"></span><span class="photo p3"></span><span class="photo p4"></span>';
    return;
  }

  grid.innerHTML = photos.map((photo) => `
    <span class="photo uploaded" style="background-image:url('${photo.dataUrl}')" title="${photo.name}"></span>
  `).join("");
}

function readPhotoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: reader.result
    });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function loadTicketsFromDatabase() {
  if (!isOnlineApp() || !hasNetlifyBackend()) {
    refreshTicketViews();
    return;
  }

  try {
    const response = await fetch(`${apiBase}/tickets`);
    if (!response.ok) throw new Error("Falha ao carregar chamados");
    const data = await response.json();
    if (Array.isArray(data.tickets)) {
      tickets = data.tickets;
      persistTickets();
      refreshTicketViews();
    }
  } catch (error) {
    console.warn("Usando chamados locais porque o banco não respondeu.", error);
  }
}

async function saveTicketToDatabase(ticket) {
  if (!isOnlineApp() || !hasNetlifyBackend()) {
    tickets.unshift(ticket);
    persistTickets();
    refreshTicketViews();
    return ticket;
  }

  try {
    const response = await fetch(`${apiBase}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticket)
    });
    if (!response.ok) throw new Error("Falha ao salvar chamado");
    const data = await response.json();
    if (Array.isArray(data.tickets)) tickets = data.tickets;
    persistTickets();
    refreshTicketViews();
    return data.ticket;
  } catch (error) {
    console.warn("Salvando chamado localmente porque o banco não respondeu.", error);
    tickets.unshift(ticket);
    persistTickets();
    refreshTicketViews();
    return ticket;
  }
}

async function updateTicketInDatabase(id, updates) {
  const applyLocalUpdate = () => {
    let found = false;
    tickets = tickets.map((ticket) => {
      if (ticket.id !== id) return ticket;
      found = true;
      return { ...ticket, ...updates };
    });
    if (!found) tickets.unshift({ id, ...updates });
    persistTickets();
    refreshTicketViews();
  };

  if (!isOnlineApp() || !hasNetlifyBackend()) {
    applyLocalUpdate();
    return { id, ...updates };
  }

  try {
    const response = await fetch(`${apiBase}/tickets`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    if (!response.ok) throw new Error("Falha ao atualizar chamado");
    const data = await response.json();
    if (Array.isArray(data.tickets)) tickets = data.tickets;
    persistTickets();
    refreshTicketViews();
    return data.ticket;
  } catch (error) {
    console.warn("Atualizando chamado localmente porque o banco não respondeu.", error);
    applyLocalUpdate();
    return { id, ...updates };
  }
}

function initialsFromName(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "TE";
}

async function loadTechniciansFromDatabase() {
  if (!isOnlineApp() || !hasNetlifyBackend()) {
    renderTechnicians();
    return;
  }

  try {
    const response = await fetch(`${apiBase}/technicians`);
    if (!response.ok) throw new Error("Falha ao carregar técnicos");
    const data = await response.json();
    if (Array.isArray(data.technicians)) {
      technicians = data.technicians;
      persistTechnicians();
      renderTechnicians();
    }
  } catch (error) {
    console.warn("Usando técnicos locais porque o banco não respondeu.", error);
  }
}

async function saveTechnicianToDatabase(technician) {
  if (!isOnlineApp() || !hasNetlifyBackend()) {
    technicians.unshift(technician);
    persistTechnicians();
    renderTechnicians();
    return technician;
  }

  try {
    const response = await fetch(`${apiBase}/technicians`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(technician)
    });
    if (!response.ok) throw new Error("Falha ao salvar técnico");
    const data = await response.json();
    if (Array.isArray(data.technicians)) technicians = data.technicians;
    persistTechnicians();
    renderTechnicians();
    return data.technician;
  } catch (error) {
    console.warn("Salvando técnico localmente porque o banco não respondeu.", error);
    technicians.unshift(technician);
    persistTechnicians();
    renderTechnicians();
    return technician;
  }
}

async function deleteTechnicianFromDatabase(id) {
  if (!isOnlineApp() || !hasNetlifyBackend()) {
    technicians = technicians.filter((technician) => technician.id !== id);
    persistTechnicians();
    renderTechnicians();
    return;
  }

  try {
    const response = await fetch(`${apiBase}/technicians?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Falha ao remover técnico");
    const data = await response.json();
    if (Array.isArray(data.technicians)) technicians = data.technicians;
    persistTechnicians();
    renderTechnicians();
  } catch (error) {
    console.warn("Removendo técnico localmente porque o banco não respondeu.", error);
    technicians = technicians.filter((technician) => technician.id !== id);
    persistTechnicians();
    renderTechnicians();
  }
}

async function loadClientsFromDatabase() {
  if (!isOnlineApp() || !hasNetlifyBackend()) {
    renderClients();
    return;
  }

  try {
    const response = await fetch(`${apiBase}/clients`);
    if (!response.ok) throw new Error("Falha ao carregar clientes");
    const data = await response.json();
    if (Array.isArray(data.clients)) {
      clients = data.clients;
      persistClients();
      renderClients();
    }
  } catch (error) {
    console.warn("Usando clientes locais porque o banco não respondeu.", error);
  }
}

async function saveClientToDatabase(client) {
  if (!isOnlineApp() || !hasNetlifyBackend()) {
    clients.unshift(client);
    persistClients();
    renderClients();
    return client;
  }

  try {
    const response = await fetch(`${apiBase}/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(client)
    });
    if (!response.ok) throw new Error("Falha ao salvar cliente");
    const data = await response.json();
    if (Array.isArray(data.clients)) clients = data.clients;
    persistClients();
    renderClients();
    return data.client;
  } catch (error) {
    console.warn("Salvando cliente localmente porque o banco não respondeu.", error);
    clients.unshift(client);
    persistClients();
    renderClients();
    return client;
  }
}

async function deleteClientFromDatabase(id) {
  if (!isOnlineApp() || !hasNetlifyBackend()) {
    clients = clients.filter((client) => client.id !== id);
    persistClients();
    renderClients();
    return;
  }

  try {
    const response = await fetch(`${apiBase}/clients?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Falha ao remover cliente");
    const data = await response.json();
    if (Array.isArray(data.clients)) clients = data.clients;
    persistClients();
    renderClients();
  } catch (error) {
    console.warn("Removendo cliente localmente porque o banco não respondeu.", error);
    clients = clients.filter((client) => client.id !== id);
    persistClients();
    renderClients();
  }
}

function setActiveMode(mode) {
  qsa(".mode-tab").forEach((item) => item.classList.toggle("active", item.dataset.mode === mode));
  qsa(".mode-view").forEach((item) => item.classList.toggle("active", item.id === mode));
}

function applyUserSession(user) {
  document.body.classList.remove("auth-locked");
  qs("#session-user").textContent = `${user.name} · ${user.label}`;
  qsa(".mode-tab").forEach((button) => {
    button.hidden = button.dataset.mode !== user.mode;
  });
  setActiveMode(user.mode);
}

function clearUserSession() {
  localStorage.removeItem("yuriCurrentUser");
  sessionStorage.removeItem("yuriCurrentUser");
  document.body.classList.add("auth-locked");
  qsa(".mode-tab").forEach((button) => {
    button.hidden = false;
    button.classList.remove("active");
  });
  qs('.mode-tab[data-mode="admin"]').classList.add("active");
  setActiveMode("admin");
  qs("#login-password").value = "";
  qs("#login-error").textContent = "";
}

function setupAuth() {
  const form = qs("#auth-form");
  const roleInput = qs("#login-role");
  const emailInput = qs("#login-email");
  const passwordInput = qs("#login-password");
  const error = qs("#login-error");

  roleInput.addEventListener("change", () => {
    emailInput.value = "";
    passwordInput.value = "";
    error.textContent = "";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = users[roleInput.value];
    const login = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const validLogin = login === selected.email || login === selected.username;

    if (!validLogin || password !== selected.password) {
      error.textContent = "Usuário, senha ou perfil inválido.";
      return;
    }

    sessionStorage.setItem("yuriCurrentUser", JSON.stringify({ role: roleInput.value }));
    applyUserSession(selected);
  });

  qs("#logout-btn").addEventListener("click", clearUserSession);

  localStorage.removeItem("yuriCurrentUser");
  sessionStorage.removeItem("yuriCurrentUser");
  document.body.classList.add("auth-locked");
}

function renderTickets(filter = "Todos", query = "") {
  const table = qs("#tickets-table");
  const normalized = query.trim().toLowerCase();
  const filtered = tickets.filter((ticket) => {
    const matchesFilter = filter === "Todos" || ticket.status === filter;
    const values = Object.values(ticket).join(" ").toLowerCase();
    return matchesFilter && values.includes(normalized);
  });

  table.innerHTML = filtered.map((ticket) => `
    <tr>
      <td><strong>${ticket.id}</strong></td>
      <td>${ticket.client}</td>
      <td>${ticket.priority}</td>
      <td><span class="pill ${statusClass(ticket.status)}">${ticket.status}</span></td>
      <td>${ticket.tech}</td>
      <td>${ticket.date}</td>
      <td>
        <div class="table-actions">
          <select class="tech-release-select" data-ticket-id="${ticket.id}" aria-label="Selecionar técnico">
            <option value="">Escolher técnico</option>
            ${technicians.map((tech) => `<option value="${tech.name}" ${ticket.tech === tech.name ? "selected" : ""}>${tech.name}</option>`).join("")}
          </select>
          <button class="ghost-btn" data-action="release-ticket" data-ticket-id="${ticket.id}" type="button">Liberar</button>
          <button class="ghost-btn" data-action="set-ticket-status" data-ticket-id="${ticket.id}" data-ticket-status="Em andamento" type="button" ${ticket.status === "Em andamento" ? "disabled" : ""}>Em andamento</button>
          <button class="primary-btn" data-action="set-ticket-status" data-ticket-id="${ticket.id}" data-ticket-status="Concluído" type="button" ${ticket.status === "Concluído" ? "disabled" : ""}>Fechar</button>
          <button class="ghost-btn" data-action="view-ticket-details" data-ticket-id="${ticket.id}" type="button" ${ticket.status.includes("Concl") ? "" : "disabled"}>Ver</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderDashboard() {
  qs("#today-list").innerHTML = agenda.slice(0, 4).map(([time, client, service]) => `
    <div class="timeline-item">
      <time>${time}</time>
      <div><strong>${client}</strong><p>${service}</p></div>
      <span class="pill green">Hoje</span>
    </div>
  `).join("");

  const groups = [
    ["Abertos", tickets.filter((t) => t.status === "Aberto")],
    ["Em andamento", tickets.filter((t) => t.status.includes("andamento") || t.status.includes("deslocamento"))],
    ["Aguardando", tickets.filter((t) => t.status.includes("Aguardando"))],
    ["Concluídos", tickets.filter((t) => t.status.includes("Concluído"))]
  ];

  qs("#ticket-kanban").innerHTML = groups.map(([title, items]) => `
    <div class="kanban-col">
      <h3>${title}<span>${items.length}</span></h3>
      ${items.map((item) => `<div class="kanban-card"><strong>${item.id}</strong><p>${item.client} · ${item.service}</p></div>`).join("")}
    </div>
  `).join("");
}

function renderClients() {
  qs("#clients-table").innerHTML = clients.map((client) => `
    <tr>
      <td><strong>${client.name}</strong></td>
      <td>${client.phone}</td>
      <td>${client.city}</td>
      <td>${client.lastOs}</td>
      <td><button class="ghost-btn" data-action="remove-client" data-client-id="${client.id}" type="button">Remover</button></td>
    </tr>
  `).join("");
}

function renderTechnicians() {
  qs("#tech-grid").innerHTML = technicians.map((tech) => `
    <article class="person-card">
      <span class="avatar">${tech.initials}</span>
      <h2>${tech.name}</h2>
      <p class="muted">${tech.phone}</p>
      <span class="pill ${statusClass(tech.status)}">${tech.status}</span>
      <div class="button-row">
        <button class="ghost-btn" data-action="remove-technician" data-tech-id="${tech.id}" type="button">Remover</button>
      </div>
    </article>
  `).join("");
}

function renderAgenda() {
  const markup = agenda.map(([time, client, service]) => `
    <div class="agenda-item">
      <time>${time}</time>
      <div><strong>${client}</strong><p>${service}</p></div>
      <span class="pill blue">Carlos</span>
    </div>
  `).join("");
  qs("#agenda-list").innerHTML = markup;
  qs("#tech-agenda").innerHTML = markup;
}

function renderMobileCards() {
  const clientCards = tickets.slice(0, 3).map((ticket) => `
    <div class="mobile-card">
      <div><strong>${ticket.id}</strong><p>${ticket.service}<br>${ticket.date}</p></div>
      <span class="pill ${statusClass(ticket.status)}">${ticket.status}</span>
    </div>
  `).join("");
  const portalCards = tickets.slice(0, 4).map((ticket) => `
    <div class="client-ticket-card">
      <div><strong>${ticket.id} · ${ticket.service}</strong><p>${ticket.date} · Técnico: ${ticket.tech}</p></div>
      <span class="pill ${statusClass(ticket.status)}">${ticket.status}</span>
    </div>
  `).join("");

  qs("#client-cards").innerHTML = clientCards;
  qs("#client-portal-cards").innerHTML = portalCards;

  const assignedTechTickets = tickets.filter(isTicketAssignedToCurrentTech);
  qs("#tech-calls").innerHTML = assignedTechTickets.map((ticket) => `
    <div class="mobile-card">
      <div><strong>${ticket.id}</strong><p>${ticket.client}<br>${ticket.service}</p></div>
      <span class="pill ${statusClass(ticket.status)}">${ticket.status}</span>
    </div>
  `).join("") || '<p class="muted">Nenhuma OS liberada para você.</p>';
}

function renderOrder(tab = "geral") {
  const templates = {
    geral: `
      <div class="info-grid">
        <div class="info-box"><strong>Cliente</strong><p>João Silva<br>(11) 99999-9999<br>Rua das Flores, 123 - São Paulo/SP</p></div>
        <div class="info-box"><strong>Equipamento</strong><p>Ar-condicionado Split 12.000 BTUs<br>Marca LG · Modelo Dual Inverter<br>Nº Série: 123456789</p></div>
        <div class="info-box"><strong>Defeito relatado</strong><p>Não está refrigerando e apresenta ruído na condensadora.</p></div>
        <div class="info-box"><strong>Diagnóstico</strong><p>Capacitor da condensadora danificado e serpentina com sujeira.</p></div>
      </div>`,
    materiais: `
      <div class="table-card compact">
        <table><thead><tr><th>Material</th><th>Qtd.</th><th>Valor</th></tr></thead>
        <tbody><tr><td>Capacitor da condensadora</td><td>1</td><td>R$ 320,00</td></tr><tr><td>Higienização da serpentina</td><td>1</td><td>Incluso</td></tr></tbody></table>
      </div>`,
    fotos: `
      <div class="photo-grid"><span class="photo p1"></span><span class="photo p2"></span><span class="photo p3"></span><span class="photo p4"></span></div>`,
    assinatura: `
      <div class="info-box"><strong>Assinatura registrada</strong><p>João Silva confirmou a conclusão em 20/05/2024 às 11:30.</p></div>`,
    historico: `
      <div class="timeline">
        <div class="timeline-item"><time>09:02</time><div><strong>Chamado aberto</strong><p>Solicitação recebida pelo cliente</p></div></div>
        <div class="timeline-item"><time>09:18</time><div><strong>Técnico atribuído</strong><p>Carlos Eduardo</p></div></div>
        <div class="timeline-item"><time>11:30</time><div><strong>Serviço finalizado</strong><p>OS aguardando avaliação</p></div></div>
      </div>`
  };
  qs("#order-content").innerHTML = templates[tab];
}

function setupNavigation() {
  qsa(".mode-tab").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveMode(button.dataset.mode);
    });
  });

  qsa(".side-link").forEach((button) => {
    button.addEventListener("click", () => {
      qsa(".side-link").forEach((item) => item.classList.remove("active"));
      qsa(".admin-section").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      qs(`#${button.dataset.section}-section`).classList.add("active");
      qs("#workspace-title").textContent = button.textContent;
    });
  });

  qsa(".segmented button").forEach((button) => {
    button.addEventListener("click", () => {
      qsa(".segmented button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderTickets(button.dataset.filter, qs("#global-search").value);
    });
  });

  qs("#global-search").addEventListener("input", (event) => {
    const active = qs(".segmented button.active")?.dataset.filter || "Todos";
    renderTickets(active, event.target.value);
  });

  qsa(".order-tabs button").forEach((button) => {
    button.addEventListener("click", () => {
      qsa(".order-tabs button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderOrder(button.dataset.orderTab);
    });
  });
}

function setupModal() {
  const modal = qs("#ticket-modal");
  const openButton = qs("#new-ticket-btn");
  const createButton = qs('button[value="confirm"]', modal);
  openButton.addEventListener("click", () => {
    modal.returnValue = "";
    if (!modal.open) modal.showModal();
  });
  modal.addEventListener("close", async () => {
    if (modal.returnValue === "confirm") {
      createButton.textContent = "Salvando...";
      createButton.disabled = true;
      const fields = qsa("input, select, textarea", modal);
      await saveTicketToDatabase({
        client: fields[0]?.value || "João Silva",
        service: fields[1]?.value || "Manutenção de ar-condicionado",
        priority: fields[2]?.value || "Alta",
        status: "Aberto",
        tech: "-",
        date: new Date().toLocaleDateString("pt-BR")
      });
      createButton.textContent = "Criar chamado";
      createButton.disabled = false;
    }
  });
}

function setupRating() {
  qsa("[data-stars] button").forEach((button, index, buttons) => {
    button.addEventListener("click", () => {
      buttons.forEach((item, itemIndex) => {
        item.style.color = itemIndex <= index ? "#f2b43c" : "#c8ced4";
      });
    });
  });
}

function setupSignature() {
  const canvas = qs("#signature");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let drawing = false;

  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches?.[0];
    const source = touch || event;
    return {
      x: (source.clientX - rect.left) * (canvas.width / rect.width),
      y: (source.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const start = (event) => {
    drawing = true;
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (event) => {
    if (!drawing) return;
    event.preventDefault();
    const p = point(event);
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111820";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const end = () => { drawing = false; };

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
  canvas.addEventListener("touchstart", start, { passive: true });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);
  qs("#clear-signature").addEventListener("click", () => ctx.clearRect(0, 0, canvas.width, canvas.height));
}

function normalizePdfText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ");
}

function escapePdfText(text) {
  return normalizePdfText(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createPdfBlob(lines) {
  const content = [
    "BT",
    "/F1 18 Tf",
    "50 790 Td",
    `(YURI MANUTENCOES - Ordem de Servico) Tj`,
    "/F1 11 Tf"
  ];

  lines.forEach((line) => {
    content.push("0 -24 Td");
    content.push(`(${escapePdfText(line)}) Tj`);
  });
  content.push("ET");

  const stream = content.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function downloadServiceOrderPdf() {
  const lines = [
    `OS: ${serviceOrder.id}`,
    `Cliente: ${serviceOrder.client}`,
    `Tecnico: ${serviceOrder.technician}`,
    `Data: ${serviceOrder.date}`,
    `Servico: ${serviceOrder.service}`,
    `Equipamento: ${serviceOrder.equipment}`,
    `Diagnostico: ${serviceOrder.diagnosis}`,
    `Servico realizado: ${serviceOrder.work}`,
    `Valor total: ${serviceOrder.total}`
  ];
  const blob = createPdfBlob(lines);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `OS-${serviceOrder.id.replace("#", "")}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sendServiceOrderWhatsApp() {
  const message = [
    `YURI MANUTENÇÕES - ${serviceOrder.id}`,
    `Cliente: ${serviceOrder.client}`,
    `Serviço: ${serviceOrder.service}`,
    `Técnico: ${serviceOrder.technician}`,
    `Data: ${serviceOrder.date}`,
    `Total: ${serviceOrder.total}`,
    "Acesse o sistema para consultar os detalhes da ordem de serviço."
  ].join("\n");
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

function openTicketDetails(ticketId) {
  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket) return;

  qs("#ticket-detail-title").textContent = `OS ${ticket.id}`;
  const photos = Array.isArray(ticket.photos) && ticket.photos.length
    ? `<div class="photo-grid">${ticket.photos.map((photo) => `<span class="photo uploaded" style="background-image:url('${photo.dataUrl}')" title="${photo.name}"></span>`).join("")}</div>`
    : "<p class=\"muted\">Nenhuma foto anexada.</p>";

  qs("#ticket-detail-body").innerHTML = `
    <dl class="totals-list">
      <dt>Cliente</dt><dd>${ticket.client}</dd>
      <dt>Status</dt><dd><span class="pill ${statusClass(ticket.status)}">${ticket.status}</span></dd>
      <dt>Técnico</dt><dd>${ticket.tech}</dd>
      <dt>Serviço</dt><dd>${ticket.service}</dd>
      <dt>Data</dt><dd>${ticket.date}</dd>
      <dt>Executado</dt><dd>${ticket.workNotes || "Serviço concluído sem observações adicionais."}</dd>
    </dl>
    <h3>Fotos</h3>
    ${photos}
  `;
  qs("#ticket-detail-modal").showModal();
}

function setupDocumentActions() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    if (button.dataset.action === "install-pwa") {
      await installApp();
    }

    if (button.dataset.action === "download-pdf") {
      downloadServiceOrderPdf();
    }

    if (button.dataset.action === "send-whatsapp") {
      sendServiceOrderWhatsApp();
    }

    if (button.dataset.action === "focus-client-ticket") {
      const form = qs(".client-form");
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      qs("textarea", form)?.focus();
    }

    if (button.dataset.action === "focus-tech-os") {
      qs("#tech-current-os")?.scrollIntoView({ behavior: "smooth", block: "center" });
      qs("#tech-work-notes")?.focus();
    }

    if (button.dataset.action === "upload-tech-photos") {
      qs("#tech-photo-input")?.click();
    }

    if (button.dataset.action === "view-ticket-details") {
      openTicketDetails(button.dataset.ticketId);
    }

    if (button.dataset.action === "release-ticket") {
      const ticketId = button.dataset.ticketId;
      const select = qs(`.tech-release-select[data-ticket-id="${CSS.escape(ticketId)}"]`);
      const technicianName = select?.value;
      if (!technicianName) {
        alert("Escolha um técnico antes de liberar a OS.");
        return;
      }
      button.disabled = true;
      button.textContent = "Liberando...";
      await updateTicketInDatabase(ticketId, {
        tech: technicianName,
        status: "Em andamento",
        releasedAt: new Date().toISOString()
      });
      button.textContent = "Liberado";
    }

    if (button.dataset.action === "set-ticket-status") {
      const ticketId = button.dataset.ticketId;
      const newStatus = button.dataset.ticketStatus;
      const updates = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      if (newStatus === "Concluído") {
        updates.closedAt = new Date().toISOString();
        updates.workNotes = "Chamado fechado pelo administrador.";
      }
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Salvando...";
      await updateTicketInDatabase(ticketId, updates);
      button.textContent = originalText;
    }

    if (button.dataset.action === "create-client-ticket") {
      const form = button.closest(".client-form");
      const status = qs("#client-ticket-status");
      const service = qs("select", form)?.value || "Manutenção de ar-condicionado";
      const description = qs("textarea", form)?.value.trim();
      button.disabled = true;
      button.textContent = "Salvando...";
      status.textContent = "";
      await saveTicketToDatabase({
        client: "João Silva",
        service: description ? `${service}: ${description}` : service,
        priority: "Média",
        status: "Aberto",
        tech: "-",
        date: new Date().toLocaleDateString("pt-BR")
      });
      if (description) qs("textarea", form).value = "";
      status.textContent = "Chamado criado e salvo no banco.";
      button.disabled = false;
      button.textContent = "Enviar chamado";
      setTimeout(() => { status.textContent = ""; }, 2500);
    }

    if (button.dataset.action === "finish-tech-service") {
      const status = qs("#tech-service-status");
      const statusPill = qs("#tech-os-status-pill");
      const notes = qs("#tech-work-notes")?.value.trim();
      const ticketId = button.dataset.ticketId;
      const current = tickets.find((ticket) => ticket.id === ticketId);
      if (!ticketId || !current) {
        status.textContent = "Nenhum chamado aberto ou em andamento para finalizar.";
        return;
      }
      button.disabled = true;
      button.textContent = "Finalizando...";
      await updateTicketInDatabase(ticketId, {
        client: current.client,
        service: current.service,
        priority: current.priority,
        status: "Concluído",
        tech: current.tech,
        date: new Date().toLocaleDateString("pt-BR"),
        workNotes: notes || "Serviço finalizado pelo técnico."
      });
      statusPill.textContent = "Concluído";
      statusPill.classList.remove("blue");
      statusPill.classList.add("green");
      status.textContent = "Serviço finalizado e OS atualizada no banco.";
      button.disabled = true;
      button.textContent = "Serviço finalizado";
      setTimeout(() => { status.textContent = ""; }, 3000);
    }

    if (button.dataset.action === "add-technician") {
      const status = qs("#tech-manager-status");
      const nameInput = qs("#tech-name");
      const phoneInput = qs("#tech-phone");
      const statusInput = qs("#tech-status");
      const name = nameInput.value.trim();

      if (!name) {
        status.textContent = "Informe o nome do técnico.";
        return;
      }

      button.disabled = true;
      button.textContent = "Salvando...";
      await saveTechnicianToDatabase({
        id: `tech-${Date.now()}`,
        name,
        phone: phoneInput.value.trim() || "(00) 00000-0000",
        status: statusInput.value,
        initials: initialsFromName(name)
      });
      nameInput.value = "";
      phoneInput.value = "";
      statusInput.value = "Disponível";
      status.textContent = "Técnico adicionado com sucesso.";
      button.disabled = false;
      button.textContent = "Adicionar técnico";
      setTimeout(() => { status.textContent = ""; }, 2500);
    }

    if (button.dataset.action === "remove-technician") {
      const card = button.closest(".person-card");
      const name = qs("h2", card)?.textContent || "este técnico";
      if (!confirm(`Remover ${name}?`)) return;

      button.disabled = true;
      button.textContent = "Removendo...";
      await deleteTechnicianFromDatabase(button.dataset.techId);
      const status = qs("#tech-manager-status");
      status.textContent = "Técnico removido.";
      setTimeout(() => { status.textContent = ""; }, 2500);
    }

    if (button.dataset.action === "add-client") {
      const status = qs("#client-manager-status");
      const nameInput = qs("#client-name");
      const phoneInput = qs("#client-phone");
      const cityInput = qs("#client-city");
      const name = nameInput.value.trim();

      if (!name) {
        status.textContent = "Informe o nome do cliente.";
        return;
      }

      button.disabled = true;
      button.textContent = "Salvando...";
      await saveClientToDatabase({
        id: `client-${Date.now()}`,
        name,
        phone: phoneInput.value.trim() || "(00) 00000-0000",
        city: cityInput.value.trim() || "Cidade",
        lastOs: "-"
      });
      nameInput.value = "";
      phoneInput.value = "";
      cityInput.value = "";
      status.textContent = "Cliente adicionado com sucesso.";
      button.disabled = false;
      button.textContent = "Adicionar cliente";
      setTimeout(() => { status.textContent = ""; }, 2500);
    }

    if (button.dataset.action === "remove-client") {
      const row = button.closest("tr");
      const name = qs("strong", row)?.textContent || "este cliente";
      if (!confirm(`Remover ${name}?`)) return;

      button.disabled = true;
      button.textContent = "Removendo...";
      await deleteClientFromDatabase(button.dataset.clientId);
      const status = qs("#client-manager-status");
      status.textContent = "Cliente removido.";
      setTimeout(() => { status.textContent = ""; }, 2500);
    }
  });
}

function setupPwa() {
  if (!("serviceWorker" in navigator) || !isOnlineApp()) return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  window.addEventListener("load", () => {
    let refreshed = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshed) return;
      refreshed = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("sw.js").then((registration) => {
      registration.update();
    }).catch((error) => {
      console.warn("Service worker não registrado.", error);
    });
  });
}

function setupPhotoUpload() {
  const input = qs("#tech-photo-input");
  if (!input) return;

  input.addEventListener("change", async () => {
    const status = qs("#tech-photo-status");
    const finishButton = qs('[data-action="finish-tech-service"]');
    const ticketId = finishButton?.dataset.ticketId;
    const current = tickets.find((ticket) => ticket.id === ticketId);
    const files = [...input.files].slice(0, 6);

    if (!ticketId || !current) {
      status.textContent = "Abra uma OS antes de adicionar fotos.";
      input.value = "";
      return;
    }

    if (!files.length) return;

    status.textContent = "Enviando fotos...";
    const photos = await Promise.all(files.map(readPhotoFile));
    const nextPhotos = [...(Array.isArray(current.photos) ? current.photos : []), ...photos].slice(-8);

    await updateTicketInDatabase(ticketId, { photos: nextPhotos });
    renderTechPhotos({ ...current, photos: nextPhotos });
    status.textContent = "Fotos adicionadas à OS.";
    input.value = "";
    setTimeout(() => { status.textContent = ""; }, 2500);
  });
}

async function installApp() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIos) {
    alert("No iPhone, abra no Safari, toque em Compartilhar e escolha 'Adicionar à Tela de Início'.");
    return;
  }

  alert("No Android, abra este site no Chrome e toque em 'Adicionar à tela inicial' ou 'Instalar app' no menu.");
}

function init() {
  loadLocalData();
  renderDashboard();
  renderTickets();
  renderClients();
  renderTechnicians();
  renderAgenda();
  renderMobileCards();
  renderOrder();
  syncTechCurrentOrder();
  setupNavigation();
  setupModal();
  setupRating();
  setupSignature();
  setupAuth();
  setupDocumentActions();
  setupPwa();
  setupPhotoUpload();
  loadTicketsFromDatabase();
  loadTechniciansFromDatabase();
  loadClientsFromDatabase();
  qs(".theme-toggle").addEventListener("click", () => document.body.classList.toggle("contrast"));
}

init();

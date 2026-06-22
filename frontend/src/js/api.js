let _apiBase = null;

function getApiBase() {
  if (_apiBase) return _apiBase;
  const configIp = localStorage.getItem("serverIp");
  if (configIp) {
    _apiBase = `//${configIp}/api`;
  } else {
    _apiBase = "/api";
  }
  return _apiBase;
}

function getToken() {
  return localStorage.getItem("token");
}

function apiRequest(endpoint, options = {}) {
  const url = `${getApiBase()}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers })
    .then(async (res) => {
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Error ${res.status}`);
      }
      return data;
    });
}

const api = {
  // Auth
  login: (email, password) =>
    apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  register: (data) =>
    apiRequest("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  me: () => apiRequest("/auth/me"),

  // Tickets
  listTickets: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/tickets${qs ? "?" + qs : ""}`);
  },

  getTicket: (id) => apiRequest(`/tickets/${id}`),

  createTicket: (data) =>
    apiRequest("/tickets", { method: "POST", body: JSON.stringify(data) }),

  changeStatus: (id, estado, comentario = "") =>
    apiRequest(`/tickets/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado, comentario }),
    }),

  assignTicket: (id, asignado_a) =>
    apiRequest(`/tickets/${id}/asignar`, {
      method: "PATCH",
      body: JSON.stringify({ asignado_a }),
    }),

  addComment: (id, comentario) =>
    apiRequest(`/tickets/${id}/comentarios`, {
      method: "POST",
      body: JSON.stringify({ comentario }),
    }),

  // Users (admin)
  listUsers: () => apiRequest("/users"),

  updateUser: (id, data) =>
    apiRequest(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteUser: (id) =>
    apiRequest(`/users/${id}`, { method: "DELETE" }),

  // Dashboard (admin)
  dashboardResumen: () => apiRequest("/dashboard/resumen"),
  dashboardPorArea: () => apiRequest("/dashboard/por-area"),
  dashboardPorEstado: () => apiRequest("/dashboard/por-estado"),
  dashboardUltimos7: () => apiRequest("/dashboard/tickets-ultimos-7-dias"),
  dashboardTiempoMedio: () => apiRequest("/dashboard/tiempo-medio-resolucion"),
};

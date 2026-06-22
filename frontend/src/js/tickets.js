const Tickets = {
  async mostrarLista() {
    const page = App.currentPage;
    const container = document.getElementById("page-content");

    try {
      const params = { pagina: page, por_pagina: 20 };
      const estadoFiltro = document.getElementById("filter-estado")?.value;
      const prioridadFiltro = document.getElementById("filter-prioridad")?.value;
      if (estadoFiltro) params.estado = estadoFiltro;
      if (prioridadFiltro) params.prioridad = prioridadFiltro;

      const data = await api.listTickets(params);
      container.innerHTML = this.renderLista(data);
      this.bindListaEvents(data);
    } catch (err) {
      container.innerHTML = `<p class="text-center" style="color:var(--danger)">Error: ${err.message}</p>`;
    }
  },

  renderLista(data) {
    const tickets = data.tickets || [];
    return `
      <div class="card">
        <div class="card-header">
          <h3>Mis Tickets</h3>
          <button class="btn btn-primary btn-sm" id="btn-nuevo-ticket">+ Nuevo Ticket</button>
        </div>
        <div class="filters">
          <div class="form-group">
            <label>Estado</label>
            <select id="filter-estado">
              <option value="">Todos</option>
              <option value="abierto">Abierto</option>
              <option value="en_progreso">En Progreso</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
          <div class="form-group">
            <label>Prioridad</label>
            <select id="filter-prioridad">
              <option value="">Todas</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Critica</option>
            </select>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-filtrar" style="margin-bottom:1px">Filtrar</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Titulo</th>
                <th>Area</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Asignado</th>
                <th>Creado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${tickets.length === 0 ? '<tr><td colspan="8" class="text-center" style="color:var(--gray-400);padding:2rem">No hay tickets</td></tr>' : ""}
              ${tickets.map(t => `
                <tr>
                  <td>#${t.id}</td>
                  <td>${t.titulo}</td>
                  <td>${t.area_origen}</td>
                  <td><span class="badge badge-${t.prioridad}">${t.prioridad}</span></td>
                  <td><span class="badge badge-${t.estado}">${t.estado.replace("_", " ")}</span></td>
                  <td>${t.asignado_nombre || "-"}</td>
                  <td>${new Date(t.creado_en).toLocaleDateString()}</td>
                  <td><button class="btn-link ver-ticket" data-id="${t.id}">Ver</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        ${data.total_paginas > 1 ? `
          <div class="flex items-center justify-between" style="padding:0.75rem 1.25rem">
            <span style="font-size:0.8125rem;color:var(--gray-500)}">Pagina ${data.pagina} de ${data.total_paginas}</span>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" data-pagina="${data.pagina - 1}" ${data.pagina <= 1 ? "disabled" : ""}>Anterior</button>
              <button class="btn btn-secondary btn-sm" data-pagina="${data.pagina + 1}" ${data.pagina >= data.total_paginas ? "disabled" : ""}>Siguiente</button>
            </div>
          </div>
        ` : ""}
      </div>
    `;
  },

  bindListaEvents(data) {
    document.getElementById("btn-nuevo-ticket")?.addEventListener("click", () => this.mostrarFormulario());
    document.getElementById("btn-filtrar")?.addEventListener("click", () => {
      App.currentPage = 1;
      this.mostrarLista();
    });
    document.querySelectorAll(".ver-ticket").forEach(btn => {
      btn.addEventListener("click", () => this.mostrarDetalle(parseInt(btn.dataset.id)));
    });
    document.querySelectorAll("[data-pagina]").forEach(btn => {
      btn.addEventListener("click", () => {
        App.currentPage = parseInt(btn.dataset.pagina);
        this.mostrarLista();
      });
    });
  },

  mostrarFormulario() {
    const container = document.getElementById("page-content");
    container.innerHTML = `
      <div class="card" style="max-width:600px">
        <div class="card-header">
          <h3>Nuevo Ticket</h3>
          <button class="btn btn-secondary btn-sm" id="btn-cancelar-ticket">Cancelar</button>
        </div>
        <div class="card-body">
          <form id="ticket-form">
            <div class="form-group">
              <label>Titulo *</label>
              <input type="text" id="ticket-titulo" required placeholder="Resumen del problema">
            </div>
            <div class="form-group">
              <label>Descripcion *</label>
              <textarea id="ticket-descripcion" required placeholder="Describe el problema en detalle..."></textarea>
            </div>
            <div class="form-group">
              <label>Area de origen</label>
              <input type="text" id="ticket-area" value="${Auth.usuario.area}">
            </div>
            <div class="form-group">
              <label>Prioridad</label>
              <select id="ticket-prioridad">
                <option value="baja">Baja</option>
                <option value="media" selected>Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Critica</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Crear Ticket</button>
              <button type="button" class="btn btn-secondary" id="btn-cancelar-form">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById("ticket-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {
        titulo: document.getElementById("ticket-titulo").value,
        descripcion: document.getElementById("ticket-descripcion").value,
        area_origen: document.getElementById("ticket-area").value,
        prioridad: document.getElementById("ticket-prioridad").value,
      };
      try {
        await api.createTicket(data);
        App.navegar("tickets");
      } catch (err) {
        alert("Error: " + err.message);
      }
    });

    document.getElementById("btn-cancelar-ticket")?.addEventListener("click", () => App.navegar("tickets"));
    document.getElementById("btn-cancelar-form")?.addEventListener("click", () => App.navegar("tickets"));
  },

  async mostrarDetalle(id) {
    const container = document.getElementById("page-content");
    try {
      const data = await api.getTicket(id);
      const t = data.ticket;
      const historial = data.historial || [];

      container.innerHTML = `
        <div class="ticket-detail">
          <div style="margin-bottom:1rem">
            <button class="btn btn-secondary btn-sm" id="btn-volver-lista">&larr; Volver</button>
          </div>
          <div class="card">
            <div class="card-header">
              <h3>Ticket #${t.id} - ${t.titulo}</h3>
              <div class="flex gap-2 items-center">
                <span class="badge badge-${t.estado}">${t.estado.replace("_", " ")}</span>
                <span class="badge badge-${t.prioridad}">${t.prioridad}</span>
              </div>
            </div>
            <div class="card-body">
              <div class="field">
                <div class="field-label">Descripcion</div>
                <div class="field-value">${t.descripcion}</div>
              </div>
              <div class="field">
                <div class="field-label">Area Origen</div>
                <div class="field-value">${t.area_origen}</div>
              </div>
              <div class="field">
                <div class="field-label">Creado por</div>
                <div class="field-value">${t.usuario_nombre || "N/A"}</div>
              </div>
              <div class="field">
                <div class="field-label">Asignado a</div>
                <div class="field-value">${t.asignado_nombre || "Sin asignar"}</div>
              </div>
              <div class="field">
                <div class="field-label">Creado</div>
                <div class="field-value">${new Date(t.creado_en).toLocaleString()}</div>
              </div>
              ${Auth.isAdmin() ? `
                <hr style="margin:1rem 0">
                <h4 style="margin-bottom:0.75rem">Acciones</h4>
                <div class="flex gap-2" style="flex-wrap:wrap">
                  <select id="admin-nuevo-estado" style="padding:0.375rem;border:1px solid var(--gray-300);border-radius:4px">
                    <option value="abierto">Abierto</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                  <button class="btn btn-primary btn-sm" id="btn-cambiar-estado">Cambiar Estado</button>
                  <button class="btn btn-secondary btn-sm" id="btn-asignar-ticket">Asignar a mi</button>
                </div>
              ` : ""}
            </div>
          </div>

          <div class="card" style="margin-top:1rem">
            <div class="card-header"><h3>Historial</h3></div>
            <div class="card-body">
              ${historial.length === 0 ? '<p style="color:var(--gray-400)">Sin actividad</p>' : ""}
              ${historial.map(h => `
                <div class="history-item">
                  <div class="history-header">
                    <span><strong>${h.usuario_nombre || "Sistema"}</strong> - ${h.cambio}</span>
                    <span>${new Date(h.creado_en).toLocaleString()}</span>
                  </div>
                  <div style="margin-top:0.25rem">${h.comentario || ""}</div>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="card" style="margin-top:1rem">
            <div class="card-header"><h3>Agregar Comentario</h3></div>
            <div class="card-body">
              <form id="comment-form">
                <div class="form-group">
                  <textarea id="comment-text" placeholder="Escribe un comentario..." required></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-sm">Enviar</button>
              </form>
            </div>
          </div>
        </div>
      `;

      document.getElementById("btn-volver-lista").addEventListener("click", () => App.navegar("tickets"));

      document.getElementById("comment-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const comentario = document.getElementById("comment-text").value;
        try {
          await api.addComment(id, comentario);
          this.mostrarDetalle(id);
        } catch (err) {
          alert("Error: " + err.message);
        }
      });

      if (Auth.isAdmin()) {
        document.getElementById("btn-cambiar-estado")?.addEventListener("click", async () => {
          const estado = document.getElementById("admin-nuevo-estado").value;
          try {
            await api.changeStatus(id, estado);
            this.mostrarDetalle(id);
          } catch (err) {
            alert("Error: " + err.message);
          }
        });

        document.getElementById("btn-asignar-ticket")?.addEventListener("click", async () => {
          try {
            await api.assignTicket(id, Auth.usuario.id);
            this.mostrarDetalle(id);
          } catch (err) {
            alert("Error: " + err.message);
          }
        });
      }
    } catch (err) {
      container.innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
    }
  },
};

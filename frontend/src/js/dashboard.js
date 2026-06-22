const Dashboard = {
  async mostrar() {
    const container = document.getElementById("page-content");
    try {
      const [resumen, porArea, porEstado, ultimos7, tiempoMedio] = await Promise.all([
        api.dashboardResumen(),
        api.dashboardPorArea(),
        api.dashboardPorEstado(),
        api.dashboardUltimos7(),
        api.dashboardTiempoMedio(),
      ]);

      const areasHtml = Object.entries(porArea.areas || {})
        .map(([area, count]) => `<div class="flex items-center justify-between" style="padding:0.5rem 0"><span>${area}</span><strong>${count}</strong></div>`)
        .join("");

      const estadosHtml = Object.entries(porEstado.estados || {})
        .map(([estado, count]) => `<div class="flex items-center justify-between" style="padding:0.5rem 0"><span>${estado.replace("_", " ")}</span><strong>${count}</strong></div>`)
        .join("");

      const diasHtml = Object.entries(ultimos7.por_dia || {})
        .map(([dia, count]) => {
          const fecha = new Date(dia + "T00:00:00");
          const nomDia = fecha.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });
          return `<div class="flex items-center justify-between" style="padding:0.375rem 0"><span>${nomDia}</span><strong>${count}</strong></div>`;
        })
        .join("");

      container.innerHTML = `
        <h3 style="margin-bottom:1rem">Dashboard</h3>

        <div class="dashboard-grid">
          <div class="stat-card"><div class="stat-value">${resumen.total_tickets}</div><div class="stat-label">Total Tickets</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--primary)">${resumen.abiertos}</div><div class="stat-label">Abiertos</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--warning)">${resumen.en_progreso}</div><div class="stat-label">En Progreso</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--success)">${resumen.resueltos}</div><div class="stat-label">Resueltos</div></div>
          <div class="stat-card"><div class="stat-value">${resumen.total_usuarios}</div><div class="stat-label">Usuarios</div></div>
          <div class="stat-card"><div class="stat-value">${tiempoMedio.tiempo_medio_horas}h</div><div class="stat-label">Tiempo medio resolucion</div></div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div class="card">
            <div class="card-header"><h3>Tickets por Area</h3></div>
            <div class="card-body">${areasHtml || "<p style='color:var(--gray-400)'>Sin datos</p>"}</div>
          </div>
          <div class="card">
            <div class="card-header"><h3>Tickets por Estado</h3></div>
            <div class="card-body">${estadosHtml || "<p style='color:var(--gray-400)'>Sin datos</p>"}</div>
          </div>
          <div class="card" style="grid-column:1/-1">
            <div class="card-header"><h3>Ultimos 7 dias</h3></div>
            <div class="card-body">${diasHtml || "<p style='color:var(--gray-400)'>Sin datos</p>"}</div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
    }
  },
};

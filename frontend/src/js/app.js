const App = {
  currentPage: 1,
  vistaActual: "tickets",

  async iniciar() {
    const loading = document.getElementById("loading-screen");
    if (loading) loading.classList.add("hidden");

    if (window.electronAPI?.obtenerConfig) {
      try {
        const config = await window.electronAPI.obtenerConfig();
        if (config?.mode === "client" && config?.serverIp) {
          localStorage.setItem("serverIp", config.serverIp);
        }
      } catch (_) {}
    }

    const usuario = await Auth.init();
    if (!usuario) {
      Auth.mostrarLogin();
      return;
    }
    this.render();
  },

  render() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <header class="app-header">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <img src="img/logo.png" alt="Logo" style="height:32px">
          <h1>Sistema de Tickets - Informatica</h1>
        </div>
        <div class="user-info">
          <span>${Auth.usuario.nombre}</span>
          <span class="rol-badge">${Auth.usuario.rol}</span>
          <button class="btn-logout" id="btn-logout">Cerrar sesion</button>
        </div>
      </header>
      <nav class="app-nav">
        <button class="${this.vistaActual === "tickets" ? "active" : ""}" data-vista="tickets">Mis Tickets</button>
        ${Auth.isAdmin() ? `<button class="${this.vistaActual === "dashboard" ? "active" : ""}" data-vista="dashboard">Dashboard</button>` : ""}
        ${Auth.isAdmin() ? `<button class="${this.vistaActual === "usuarios" ? "active" : ""}" data-vista="usuarios">Usuarios</button>` : ""}
      </nav>
      <main class="app-content">
        <div id="page-content"></div>
      </main>
    `;

    document.getElementById("btn-logout").addEventListener("click", () => {
      Auth.logout();
      Auth.mostrarLogin();
    });

    document.querySelectorAll(".app-nav button[data-vista]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.navegar(btn.dataset.vista);
      });
    });

    this.cargarVista(this.vistaActual);
  },

  navegar(vista) {
    this.vistaActual = vista;
    this.currentPage = 1;
    if (document.querySelector(".app-nav")) {
      document.querySelectorAll(".app-nav button[data-vista]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.vista === vista);
      });
    }
    this.cargarVista(vista);
  },

  cargarVista(vista) {
    switch (vista) {
      case "tickets":
        Tickets.mostrarLista();
        break;
      case "dashboard":
        Dashboard.mostrar();
        break;
      case "usuarios":
        this.mostrarUsuarios();
        break;
    }
  },

  async mostrarUsuarios() {
    const container = document.getElementById("page-content");
    try {
      const data = await api.listUsers();
      const usuarios = data.usuarios || [];
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h3>Usuarios</h3>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Area</th>
                  <th>Rol</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${usuarios.map(u => `
                  <tr>
                    <td>${u.id}</td>
                    <td>${u.nombre}</td>
                    <td>${u.email}</td>
                    <td>${u.area}</td>
                    <td><span class="rol-badge" style="background:${u.rol === "admin" ? "var(--warning)" : "var(--primary)"}">${u.rol}</span></td>
                    <td>${new Date(u.creado_en).toLocaleDateString()}</td>
                    <td><button class="btn btn-secondary btn-sm btn-reset-pwd" data-user-id="${u.id}" data-user-name="${u.nombre}">Resetear password</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
      document.querySelectorAll(".btn-reset-pwd").forEach(btn => {
        btn.addEventListener("click", () => {
          const userId = parseInt(btn.dataset.userId);
          const userName = btn.dataset.userName;
          const newPassword = prompt(`Nueva contrasena para ${userName}:`);
          if (!newPassword || newPassword.length < 6) {
            alert("La contrasena debe tener al menos 6 caracteres");
            return;
          }
          api.updateUser(userId, { password: newPassword })
            .then(() => alert("Contrasena actualizada correctamente"))
            .catch(err => alert("Error: " + err.message));
        });
      });
    } catch (err) {
      container.innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
    }
  },
};

document.addEventListener("DOMContentLoaded", () => App.iniciar());

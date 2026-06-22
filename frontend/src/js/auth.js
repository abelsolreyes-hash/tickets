const Auth = {
  usuario: null,

  init() {
    const token = getToken();
    if (token) {
      return api.me().then((data) => {
        this.usuario = data.usuario;
        return this.usuario;
      }).catch(() => {
        localStorage.removeItem("token");
        this.usuario = null;
        return null;
      });
    }
    return Promise.resolve(null);
  },

  isAuthenticated() {
    return !!this.usuario;
  },

  isAdmin() {
    return this.usuario?.rol === "admin";
  },

  async login(email, password) {
    const data = await api.login(email, password);
    localStorage.setItem("token", data.token);
    this.usuario = data.usuario;
    return this.usuario;
  },

  async register(nombre, email, password, area) {
    const data = await api.register({ nombre, email, password, area });
    localStorage.setItem("token", data.token);
    this.usuario = data.usuario;
    return this.usuario;
  },

  logout() {
    localStorage.removeItem("token");
    this.usuario = null;
  },

  mostrarLogin() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="auth-screen">
        <div class="auth-card">
          <h2>Iniciar Sesion</h2>
          <p class="subtitle">Sistema de Tickets - Informatica</p>
          <div id="auth-error" class="auth-error hidden"></div>
          <form id="login-form">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="login-email" placeholder="tu@email.com" required>
            </div>
            <div class="form-group">
              <label>Contrasena</label>
              <input type="password" id="login-password" placeholder="********" required>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" style="width:100%">Ingresar</button>
            </div>
          </form>
          <p class="text-center mt-2" style="font-size:0.875rem;color:var(--gray-500)">
            ¿No tienes cuenta? <button class="btn-link" id="btn-show-register">Registrate</button>
          </p>
        </div>
      </div>
    `;

    document.getElementById("login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      const errorEl = document.getElementById("auth-error");
      try {
        await this.login(email, password);
        App.render();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove("hidden");
      }
    });

    document.getElementById("btn-show-register").addEventListener("click", () => this.mostrarRegister());
  },

  mostrarRegister() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="auth-screen">
        <div class="auth-card">
          <h2>Registrarse</h2>
          <p class="subtitle">Crea tu cuenta en el sistema de tickets</p>
          <div id="auth-error" class="auth-error hidden"></div>
          <form id="register-form">
            <div class="form-group">
              <label>Nombre completo</label>
              <input type="text" id="reg-nombre" required>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="reg-email" required>
            </div>
            <div class="form-group">
              <label>Area</label>
              <input type="text" id="reg-area" placeholder="Ej: Contabilidad, RRHH..." required>
            </div>
            <div class="form-group">
              <label>Contrasena</label>
              <input type="password" id="reg-password" required minlength="6">
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" style="width:100%">Crear cuenta</button>
            </div>
          </form>
          <p class="text-center mt-2" style="font-size:0.875rem;color:var(--gray-500)">
            ¿Ya tienes cuenta? <button class="btn-link" id="btn-show-login">Inicia sesion</button>
          </p>
        </div>
      </div>
    `;

    document.getElementById("register-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("reg-nombre").value;
      const email = document.getElementById("reg-email").value;
      const area = document.getElementById("reg-area").value;
      const password = document.getElementById("reg-password").value;
      const errorEl = document.getElementById("auth-error");
      try {
        await this.register(nombre, email, password, area);
        App.render();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove("hidden");
      }
    });

    document.getElementById("btn-show-login").addEventListener("click", () => this.mostrarLogin());
  },
};

const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

let mainWindow = null;
let flaskProcess = null;
let appConfig = null;
const CONFIG_PATH = path.join(app.getPath("userData"), "app-config.json");

function cargarConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      appConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      return true;
    }
  } catch (_) {}
  return false;
}

function guardarConfig(config) {
  appConfig = config;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function buscarBackendExe() {
  const candidatos = [
    path.join(__dirname, "..", "dist", "tickets-server.exe"),
    path.join(__dirname, "..", "..", "backend", "tickets-server.exe"),
    path.join(process.resourcesPath || "", "backend", "tickets-server.exe"),
    path.join(process.resourcesPath || "", "tickets-server.exe"),
  ];
  for (const p of candidatos) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return null;
}

function esperarServidor(url, retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (attempt) => {
      http
        .get(`${url}/api/auth/me`, () => resolve())
        .on("error", () => {
          if (attempt >= retries) {
            reject(new Error("No se pudo conectar al servidor"));
          } else {
            setTimeout(() => check(attempt + 1), 500);
          }
        });
    };
    check(0);
  });
}

function iniciarBackend() {
  const exePath = buscarBackendExe();
  if (!exePath) return;

  flaskProcess = spawn(exePath, [], {
    cwd: path.dirname(exePath),
    stdio: ["ignore", "pipe", "pipe"],
  });

  flaskProcess.stdout.on("data", (d) => console.log(`[Backend] ${d}`));
  flaskProcess.stderr.on("data", (d) => console.error(`[Backend] ${d}`));
  flaskProcess.on("exit", (code) => console.log(`Backend cerrado (${code})`));
}

function abrirVentanaPrincipal() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, "src", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "src", "index.html"));
  mainWindow.setTitle("Sistema de Tickets - Informatica");
  mainWindow.on("closed", () => (mainWindow = null));
}

function mostrarSetup() {
  const setupWin = new BrowserWindow({
    width: 500,
    height: 500,
    resizable: false,
    frame: true,
    title: "Configuracion inicial",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  setupWin.loadFile(path.join(__dirname, "src", "setup.html"));
  setupWin.setMenu(null);
  setupWin.on("closed", () => {
    if (!appConfig) app.quit();
  });
}

// IPC handlers
ipcMain.on("guardar-config", (_e, config) => guardarConfig(config));
ipcMain.on("reiniciar-app", () => {
  if (flaskProcess) { flaskProcess.kill(); flaskProcess = null; }
  if (mainWindow) { mainWindow.close(); mainWindow = null; }
  app.relaunch();
  app.exit(0);
});
ipcMain.handle("obtener-config", () => appConfig);

app.whenReady().then(async () => {
  if (!cargarConfig()) {
    mostrarSetup();
    return;
  }

  if (appConfig.mode === "server") {
    iniciarBackend();
    try {
      await esperarServidor("http://127.0.0.1:5000");
    } catch (err) {
      dialog.showErrorBox("Error", "No se pudo iniciar el servidor backend.");
    }
  }

  abrirVentanaPrincipal();
});

app.on("window-all-closed", () => {
  if (flaskProcess) { flaskProcess.kill(); flaskProcess = null; }
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (!mainWindow) {
    if (appConfig) abrirVentanaPrincipal();
    else mostrarSetup();
  }
});

app.on("before-quit", () => {
  if (flaskProcess) { flaskProcess.kill(); flaskProcess = null; }
});

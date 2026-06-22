const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true,
  guardarConfig: (config) => ipcRenderer.send("guardar-config", config),
  reiniciarApp: () => ipcRenderer.send("reiniciar-app"),
  obtenerConfig: () => ipcRenderer.invoke("obtener-config"),
});

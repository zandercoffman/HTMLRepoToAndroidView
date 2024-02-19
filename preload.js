// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('webusb', {
  requestDevice: async (filters) => {
    // Use the correct channel name
    return await ipcRenderer.invoke('requestWebUSBDevice', filters);
  },
});

contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer);
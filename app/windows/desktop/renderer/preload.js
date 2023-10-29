const { contextBridge, ipcRenderer } = require("electron");

const upstream = { 
    async SetupSubmitUsername(...args) {
        return await ipcRenderer.invoke("SetupSubmitUsername", ...args);
    },

    async ConfirmAccount(...args) {
        return await ipcRenderer.invoke("ConfirmAccount", ...args);
    },

    async RequestSetupProgress(...args) {
        return await ipcRenderer.invoke("RequestSetupProgress", ...args);
    }
    
}

contextBridge.exposeInMainWorld("upstream", upstream);

ipcRenderer.on("UpdateLoadingProgress", (e, title, content) => {
    document.getElementById("$status-loading-title").innerHTML = title;
    document.getElementById("$status-loading-content").innerHTML = content;
});
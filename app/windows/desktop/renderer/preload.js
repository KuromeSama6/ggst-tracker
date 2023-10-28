const { contextBridge, ipcRenderer } = require("electron");

const upstream = { 
    async SetupSubmitUsername(username) {
        return await ipcRenderer.invoke("SetupSubmitUsername", username);
    },

    async ConfirmAccount(ratingId) {
        return await ipcRenderer.invoke("ConfirmAccount", ratingId);
    },

    async RequestSetupProgress() {
        return await ipcRenderer.invoke("RequestSetupProgress");
    }
    
}

contextBridge.exposeInMainWorld("upstream", upstream);

ipcRenderer.on("UpdateLoadingProgress", (e, title, content) => {
    document.getElementById("$status-loading-title").innerHTML = title;
    document.getElementById("$status-loading-content").innerHTML = content;
});
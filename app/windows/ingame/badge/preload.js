const { contextBridge, ipcRenderer } = require("electron");

const upstream = { 

    
}

contextBridge.exposeInMainWorld("upstream", upstream);

ipcRenderer.addListener("SetBadgeContent", (e, title, message) => {
    document.getElementById("$badge-title").innerText = title;

    const isLoading = message == "load";
    document.getElementById("loading-spinner").hidden = !isLoading;
    document.getElementById("$badge-content").innerText = message;
    document.getElementById("$badge-content").hidden = isLoading;
});
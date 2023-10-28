const { app, BrowserWindow, globalShortcut } = require('electron')

async function Start() {
    await app.whenReady();

    // start the desktop window
    require("./windows/desktop/controller");
}

Start();
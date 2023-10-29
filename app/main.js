const { app, BrowserWindow, Tray, Menu, } = require('electron')
const { Screenshots } = require("./bin/node-screenshots.node");
const fs = require("fs");

async function Start() {
    await app.whenReady();

    // start the windows
    require("./windows/desktop/controller");
    require("./windows/ingame/controller");

    // system tray
    tray = new Tray("resources/favicon.ico");
    const contextMenu = Menu.buildFromTemplate([
        {
            type: 'separator'
        },
        { 
            label: 'Open Dev Console', 
            type: 'normal', 
            accelerator: 'Control+Shift+I',
            click: async () => {
                for (let window of BrowserWindow.getAllWindows()) {
                    if (!window.webContents.isDevToolsOpened() && window.isVisible())
                    window.webContents.openDevTools({mode: "detach"});
                }
            }
        },
        {
            label: "Show/Hide Overlay",
            type: 'normal',
            click: async () => {
                const window = require("./windows/ingame/controller").badgeWindow;
                if (!window.isVisible()) window.show();
                else window.hide();
            }
        },
        {
            type: 'separator'
        },
        { 
            label: 'Quit', 
            type: 'normal', 
            accelerator: 'Control+Shift+End',
            click: app.quit
        },
    ])
    tray.setToolTip('GGST Tracker');
    tray.setContextMenu(contextMenu);
}

Start();
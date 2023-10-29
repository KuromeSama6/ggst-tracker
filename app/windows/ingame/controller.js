const { app, BrowserWindow, Menu, screen } = require('electron');
const settingsDriver = require("../../util/settingsDriver");
const path = require("path");
const _fs = require("fs");
const dataApi = require('../../util/dataApi');
const ocrApi = require('../../util/ocrApi');
const fs = _fs.promises;

const SCREENSIZE = screen.getPrimaryDisplay().size;
const SCREENSCALE = {
    width: SCREENSIZE.width / 1920,
    height: SCREENSIZE.height / 1080
};

const badgeWindow = new BrowserWindow({
    icon: "resources/favicon.png",

    width: 200,
    height: 100,

    x: SCREENSIZE.width - 200, // Position from the right edge
    y: 0, // Position from the top

    resizable: false,

    fullscreenable: false,
    maximizable: false,
    transparent: true,
    focusable: false,

    frame: false,
    hasShadow: false,
    skipTaskbar: true,

    webPreferences: {
      preload: path.join(__dirname, 'badge/preload.js'),
      devTools: true
    },
});

badgeWindow.setAlwaysOnTop(true, 'screen-saver');
badgeWindow.loadFile(path.join(__dirname, "badge/index.html"));
badgeWindow.hide();

// console.log(Math.round((SCREENSIZE.height - 843 * SCREENSCALE.height) / 2))
// console.log(SCREENSIZE.width - 255 * SCREENSCALE.width - Math.round(531 * SCREENSCALE.width));

const p1Window = new BrowserWindow({
    icon: "resources/favicon.png",

    width: Math.round(531 * SCREENSCALE.width),
    height: Math.round(843 * SCREENSCALE.height),

    x: Math.round(255 * SCREENSCALE.width),
    y: Math.round((SCREENSIZE.height - 843 * SCREENSCALE.height) / 2) + 19,

    resizable: false,

    fullscreenable: false,
    maximizable: false,
    transparent: true,
    focusable: false,

    frame: false,
    hasShadow: false,
    skipTaskbar: true,

    webPreferences: {
      preload: path.join(__dirname, 'rcode/preload.js'),
      devTools: true
    },
});

p1Window.setAlwaysOnTop(true, 'screen-saver');
p1Window.loadFile(path.join(__dirname, "rcode/index.html"));
p1Window.hide();

const p2Window = new BrowserWindow({
    icon: "resources/favicon.png",

    width: Math.round(531 * SCREENSCALE.width),
    height: Math.round(843 * SCREENSCALE.height),

    x: Math.round(SCREENSIZE.width - 255 * SCREENSCALE.width - Math.round(531 * SCREENSCALE.width)),
    y: Math.round((SCREENSIZE.height - 843 * SCREENSCALE.height) / 2) + 19,

    resizable: false,

    fullscreenable: false,
    maximizable: false,
    transparent: true,
    focusable: false,

    frame: false,
    hasShadow: false,
    skipTaskbar: true,

    webPreferences: {
      preload: path.join(__dirname, 'rcode/preload.js'),
      devTools: true
    },
});

p2Window.setAlwaysOnTop(true, 'screen-saver');
p2Window.loadFile(path.join(__dirname, "rcode/index.html"));
p2Window.hide();

// register listeners
require("./upstream");

// methods
module.exports = {
	badgeWindow: badgeWindow,

    SetBadgeContent(title, message) {
        badgeWindow.webContents.send("SetBadgeContent", title, message);
    },

    /** 
     * Closes the game windows.
     */
    close() {
        badgeWindow.hide();
    },

    SetRcode(p1, p2) {
        p1Window.webContents.send("SetRcode", p1, p2);
        p2Window.webContents.send("SetRcode", p2, p1);
    }

}

// start ocr service
module.exports.SetBadgeContent("Starting OCR", "Registering workers");
ocrApi.GetScheduler().then(() => module.exports.SetBadgeContent("Ready", "Start a match to see player data."));


// p1Window.once('ready-to-show', () => p1Window.webContents.openDevTools({mode: 'detach'}));
(async () => {

})();

// main cycle
{
    var currentData;
    var occupied = false;

    setInterval(async () => {
        if (!ocrApi.scheduler || !badgeWindow.isVisible() || occupied || currentData) return;
        const screenshot = await ocrApi.TakeScreenshot();
        const img = await ocrApi.PreprocessImageOCR(screenshot);
        const data = (await ocrApi.OCRAll(img)).data.text;
    
        if (occupied || !ocrApi.Validate(data) || currentData) return;

        occupied = true;
        module.exports.SetBadgeContent("Loading Match", "load");
        console.log("Start data lookup")
        currentData = await ocrApi.LookupData(data);
        occupied = false;
        console.log(currentData);

        if (!currentData.valid) {
            currentData = null;
            module.exports.SetBadgeContent("Failed", "Try again.");
            console.warn("lookup failed.");
            return;
        } else {
            console.log("that's valid. starting match.")
            module.exports.SetRcode(currentData.p1, currentData.p2);
            badgeWindow.hide();
            p1Window.show();
            p2Window.show();
        }
    
    }, 1500);
}

const { app, BrowserWindow, Menu } = require('electron');
const settingsDriver = require("../../util/settingsDriver");
const path = require("path");
const _fs = require("fs");
const dataApi = require('../../util/dataApi');
const fs = _fs.promises;
const procfind = require("find-process");

const window = new BrowserWindow({
    icon: "resources/favicon.png",

    width: 800,
    height: 600,

    resizable: false,

    fullscreenable: false,
    maximizable: false,

    webPreferences: {
      preload: path.join(__dirname, 'renderer/preload.js'),
      devTools: true
    },
});

window.loadFile(path.join(__dirname, "renderer/index.html"));
window.setMenu(null);

// set behavior for opening new files
window.webContents.setWindowOpenHandler(({url}) => {
	require('electron').shell.openExternal(url);
	return { action: 'deny' };
});

// register listeners
require("./upstream");

// check for game status
setInterval(async () => {
    if (await module.exports.GetSetupProgress(false) != 2) return;

    const proc = await procfind("name", "GGST.exe");
	if (window.isVisible() && Object.keys(proc).length) {
		// launch the game badge
		window.hide();
		require("../ingame/controller");

	} else if (!window.isVisible() && !Object.keys(proc).length) {
		// show the main window
		window.show();
		require("../ingame/controller").close();
	}

}, 1000);

// methods
module.exports = {
	window: window,

	UpdateSetupProgress(title, content) {
		this.window.webContents.send("UpdateLoadingProgress", title, content);
	},
	
	async SaveAccount(ratingId, username) {
    	this.UpdateSetupProgress("Writing RatingID", `Updating account information`);
		
		// write
		await settingsDriver.Open();
		settingsDriver.Write("ratingId", ratingId);
		settingsDriver.Write("username", username);
		await settingsDriver.Close();

	},

	async DownloadFrameData(clean = false) {
		// clean download
		if (clean) await dataApi.ClearDataDirectory();

		const chrNames = await dataApi.GetChrNames();
		const req = clean ? Object.keys(chrNames) : await dataApi.GetMissingFrameData();
		console.log(`Awaiting download: ${req}`)

        for (let chrCode of req) {
			console.log(`Start download: ${chrCode}`);
			this.UpdateSetupProgress(`Downloading Frame Data`, 
			`Download: ${chrNames[chrCode].pretty}<br>Character ${req.indexOf(chrCode) + 1}/${req.length}`);

			try {
				var data = await dataApi.DownloadOne(chrCode);
				// write file
				await fs.writeFile(path.join(dataApi.DATA_DIR, `${chrCode}.json`), JSON.stringify(data, null, 2), { flag: 'wx' });
			} catch (e) {
				console.error(`Download fail: ${chrCode}`);
				console.warn(e.stack);

				this.UpdateSetupProgress(`Download Error`, `Character: ${chrCode}<br><code>${e}</code><br>See main process log for details. Restart app to reattempt.`)
				return;
			}
			
        }
	},

    async GetSetupProgress(downloadFrameData) {
        if (!_fs.existsSync(settingsDriver.SETTINGS_PATH)) return 0;
        // missing frame data
        if (!await dataApi.CheckDataIntegrity()) {
            if (downloadFrameData) this.DownloadFrameData(false);
            return 1;
        }

        return 2;
    }
}
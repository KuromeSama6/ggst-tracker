const { app, BrowserWindow, Menu } = require('electron');
const settingsDriver = require("../../util/settingsDriver");
const path = require("path");
const _fs = require("fs");
const dataApi = require('../../util/dataApi');
const fs = _fs.promises;

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

// open dev tools
window.webContents.openDevTools({mode: "detach"});

// set behavior for opening new files
window.webContents.setWindowOpenHandler(({url}) => {
	require('electron').shell.openExternal(url);
	return { action: 'deny' };
});

// register listeners
require("./upstream");

// methods
module.exports = {
	window: window,

	UpdateSetupProgress(title, content) {
		this.window.webContents.send("UpdateLoadingProgress", title, content);
	},
	
	async SaveAccount(ratingId) {
    	this.UpdateSetupProgress("Writing RatingID", `Updating account information`);
		
		// write
		await settingsDriver.Open();
		settingsDriver.Write("ratingId", ratingId);
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
			}
			
        }
	}
}
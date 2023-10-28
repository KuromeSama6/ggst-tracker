const { ipcMain } = require('electron');
const ratingApi = require("../../util/ratingApi");
const settingsDriver = require('../../util/settingsDriver');
const fs = require("fs");
const dataApi = require('../../util/dataApi');

// Setup: user submits username
ipcMain.handle("SetupSubmitUsername", async (e, username, isRatingId) => {    
    // find that username in 
    var res = await ratingApi.LookupOverview(username);

    // not found or error
    if (!res) return {
        suc: false,
        msg: "Either that username was not found, or there was an error on our side."
    }

    // ratingId is indeterminate
    if (!res.ratingId) return {
        suc: false,
        msg: "There were multiple accounts under that username. Try searching by Rating ID instead."
    }

    return {
        suc: true,
        ...res
    }
});

// Setup: username confirmed
ipcMain.handle("ConfirmAccount", async (e, ratingId) => {
    const controller = require("./controller");
    
    console.log(`Confirming account with RatingID ${ratingId}`);
    await controller.SaveAccount(ratingId);

    // frame data
    if (!await dataApi.CheckDataIntegrity()) await controller.DownloadFrameData(true);

});

// Setup: request setup progress
ipcMain.handle("RequestSetupProgress", async e => {
    const controller = require("./controller");

    // fresh start
    if (!fs.existsSync(settingsDriver.SETTINGS_PATH)) return 0;
    // missing frame data
    if (!await dataApi.CheckDataIntegrity()) {
        controller.DownloadFrameData(false);
        return 1;
    }

    return 2;
});
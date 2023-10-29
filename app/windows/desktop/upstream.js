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
ipcMain.handle("ConfirmAccount", async (e, ratingId, username) => {
    const controller = require("./controller");
    
    console.log(`Confirming account with RatingID ${ratingId}`);
    await controller.SaveAccount(ratingId, username);

    // frame data
    if (!await dataApi.CheckDataIntegrity()) await controller.DownloadFrameData();

});

// Setup: request setup progress
ipcMain.handle("RequestSetupProgress", async (e, isFirst) => {
    const controller = require("./controller");

    return await controller.GetSetupProgress(isFirst);
});
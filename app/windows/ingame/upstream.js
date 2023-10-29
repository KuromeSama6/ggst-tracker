const { ipcMain } = require('electron');
const ratingApi = require("../../util/ratingApi");
const settingsDriver = require('../../util/settingsDriver');
const fs = require("fs");
const dataApi = require('../../util/dataApi');
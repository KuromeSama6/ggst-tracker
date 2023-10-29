const { app } = require('electron');
const path = require("path");
const _fs = require("fs");
const fs = _fs.promises;

const SETTINGS_PATH = path.join(app.getPath("userData"), "Volatile/settings.json");
console.log(`Settings path: ${SETTINGS_PATH}`);
var current;

module.exports = {
    SETTINGS_PATH: SETTINGS_PATH,

    async _GetFile() {
        if (!_fs.existsSync(SETTINGS_PATH)) {
            await fs.mkdir(path.join(SETTINGS_PATH, ".."), { recursive: true });
            await fs.writeFile(SETTINGS_PATH, "{}", { flag: 'wx' });
        }
        
        return JSON.parse(await fs.readFile(SETTINGS_PATH));
    },

    async Open() {
        current = await this._GetFile();
    },

    async Close() {
        await fs.writeFile(SETTINGS_PATH, JSON.stringify(current));
        current = null;
    },

    Write(key, value) {
        current[key] = value;
    },

    Read(key, def = null) {
        return current[key] || def;
    }
}
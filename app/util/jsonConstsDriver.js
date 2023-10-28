const path = require("path");
const _fs = require("fs");
const fs = _fs.promises;

module.exports = {
    cache: {},

    async GetFile(relPath) {
        if (this.cache[relPath]) return this.cache[relPath];
        
        var ret = JSON.parse((await fs.readFile(path.join(__dirname, "../gamedata", relPath))).toString());
        this.cache[relPath] = ret;
        return ret;
    }
}
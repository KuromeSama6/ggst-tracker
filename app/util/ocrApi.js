const { Screenshots } = require("../bin/node-screenshots.node");
const fs = require('fs');
const path = require("path");
const tesseract = require("tesseract.js");
const sharp = require("sharp");
const ratingApi = require("./ratingApi");
const fuzz = require("fuzzbunny");
const dataApi = require("./dataApi");

/**
 * Reference format:
 * RE 3 A 問 還 生生 生 旬 計
    HE aul TA 19
    me 7
    ff : に や セン
    本 - 加 Ck Username1 TE SF 2a Username2 A2 od
    RAMLETHAL VALENTINE ・ BAIKEN
    BN © 890000000 © 8720000000
    ...
 */

module.exports = {
    scheduler: null,

    async GetScheduler() {
        if (!this.scheduler) {
            console.time("start-tesseract-worker");
            this.scheduler = await tesseract.createScheduler();
            for (let i = 0; i < 10; i++) this.scheduler.addWorker(await tesseract.createWorker("eng+chi_sim+jpn", 3));
            console.timeEnd("start-tesseract-worker");
        }
        return this.scheduler;
    },

    async KillScheduler() {
        await this.scheduler.terminate();
        this.scheduler = null;
    },

    async TakeScreenshot() {
        return await Screenshots.fromPoint(0, 0).capture();
    },

    async OCRAll(data) {
        return await (await this.GetScheduler()).addJob('recognize', data, 'eng+chi_sim+jpn');
    },

    /**
     * Crops 200px/ from each edge and upsizes resulting image by 100%.
     * @param {*} buf Input image buffer
     */
    async PreprocessImageOCR(buf, skipCrop = false) {
        return new Promise(async (accept, reject) => {
            const scaleFactor = 1;
            const marginSide = 200;
            const marginTop = 350;
    
            const metadata = await sharp(buf).metadata();
            const originalWidth = metadata.width;
            const originalHeight = metadata.height;

            var sh = sharp(buf);
            if (!skipCrop) sh.extract({ 
                left: marginSide, 
                top: marginTop, 
                width: originalWidth - 2 * marginSide, 
                height: originalHeight - 2 * marginTop
            })
            .resize({ 
                width: Math.round((originalWidth - 2 * marginSide) * scaleFactor), 
                height: Math.round((originalHeight - 2 * marginTop) * scaleFactor) 
            });

            sh
            .composite([{
                input: {
                  create: {
                    width: 200,
                    height: 300,
                    channels: 3,
                    background: { r: 0, g: 0, b: 0 } // Solid black
                  }
                }
            }])

            sh.clone()
            .threshold(150)
            .blur(1)
            .toBuffer((errUsername, bufUsername) => {
                if (errUsername) {
                    reject(errUsername);
                    return;
                }
                
                accept(bufUsername);

            });
        });
        
    },

    /**
     * Gets a line in the result according offset to marker line (line with "©").
     * Negative 1 indicates 1 line ABOVE marker line, positive 1 indicates 1 line BELOW marker line.
     * @param {*} offset Line offset from the marker line.
     */
    GetLine(text, offset) {
        const lines = text.split("\n");
        var marker = lines.indexOf(lines.find(c => c.includes("0000000")));

        if (marker == -1) return null;
        return lines[marker + offset];
    },

    Validate(text) {
        const lines = text.split("\n");
        return lines.find(c => c.includes("0000000")) != null;
    },

    /**
     * Strips possible usernames from the text (length > 2).
     * Username line is located 2 lines above marker line (line with "©").
     * @param {*} text 
     */
    StripUsername(text) {
        var ret = text.split(" ").filter(c => c.length > 2);
        return ret;
    },

    /**
     * Looks up one player's data using their username.
     * @param {*} username 
     */
    async LookupOneData(username, chrCode) {
        if (!username || !chrCode) return {
            suc: false,
            msg: `skipped (${username})`
        }

        const overview = await ratingApi.LookupOverview(username);
        if (!overview) return {
            suc: false,
            msg: `player not found (${username})`
        }
        if (!overview.ratingId) return {
            suc: false,
            msg: `RatingID indeterminate (${username})`
        }

        // lookup data
        const data = await ratingApi.LookupPlayerData(overview.ratingId, chrCode);
        const chrNames = await dataApi.GetChrNames();
        return {
            suc: Boolean(data),
            msg: "returned",
            data: data,
            extra: {
                chrPretty: chrNames[chrCode].pretty
            }
        };

    },

    /**
     * Looks up account data from a block of raw ocr output.
     * @param {*} usernames 
     */
    async LookupData(data) {
        const usernames = this.StripUsername(this.GetLine(data, -2));
        console.log(`Received usernames: ${usernames}`);
        const p1 = usernames[0];
        const p2 = usernames[1];
        const characters = await this.GetChrCodes(data);
        console.log(`Received character codes: ${characters}`);

        return {
            p1: {
                username: p1,
                ...await this.LookupOneData(p1, characters[0]),
            },
            p2: {
                username: p2,
                ...await this.LookupOneData(p2, characters[1]),
            },

            get valid() {
                return this.p1.suc || this.p2.suc;
            }
        }
    },
    
    /**
     * Fuzzy matches a character name.
     * @param {*} chrName 
     */
    async FuzzMatchChr(chrName) {
        const chrNames = await dataApi.GetChrNames();
        // console.log(Object.values(chrNames).map(c => {return {name: c.pretty.toUpperCase().split(" ")[0]}}));
        return fuzz.fuzzyFilter(
            Object.values(chrNames).map(c => {return {name: c.pretty.toUpperCase().split(" ")[0]}}),
            chrName,
            {
                fields: ["name"]
            }
        )[0];
    },

    /**
     * Get character codes from a block of text from OCR.
     * @param {*} text 
     */
    async GetChrCodes(text) {
        const chrNames = await dataApi.GetChrNames();
        const line = this.GetLine(text, -1);
        var tokens = line.trim().split(" ");
        console.log(`GetChrCodes: tokens: ${tokens}`);

        const pivot = Math.round(tokens.length / 2) - 1;

        var ret = [];

        for (let token of tokens) {
            const index = tokens.indexOf(token);
            let search = token.length >= 2 ? await this.FuzzMatchChr(token) : null;

            if (search) {
                ret.push(Object.keys(chrNames).find(
                    c => chrNames[c].pretty.split(" ")[0].toUpperCase() == search.item.name
                ));
                if (ret.length >= 2) break;
            }

            if (index >= pivot && ret.length == 0) ret.push(null);
        }

        return ret;

    }
}
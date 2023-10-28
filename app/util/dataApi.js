const { app } = require('electron');
const path = require("path");
const _fs = require("fs");
const fs = _fs.promises;
const axios = require("axios");
const parser = require("node-html-parser");

const jsonConstsDriver = require("./jsonConstsDriver");

const DATA_DIR = app ? path.join(app.getPath("userData"), "Volatile/FrameData") : "";
console.log(`Frame data directory: ${DATA_DIR}`);

module.exports = {
    DATA_DIR: DATA_DIR,

    async CheckDataIntegrity() {
        if (!_fs.existsSync(DATA_DIR)) return false;
        if ((await this.GetMissingFrameData()).length > 0) return false;
        
        return true;
    },

    async GetMissingFrameData() {
        if (!_fs.existsSync(DATA_DIR)) return null;

        var ret = [];
        const dirCodes = (await fs.readdir(DATA_DIR)).map(c => path.basename(c).split(".")[0].toUpperCase());
        for (let chrCode in await this.GetChrNames()) {
            if (!dirCodes.includes(chrCode)) ret.push(chrCode);
        }

        return ret;
    },

    async ClearDataDirectory() {
        if (_fs.existsSync(DATA_DIR)) await fs.unlink(DATA_DIR);
        await fs.mkdir(DATA_DIR, { recursive: true });
    },

    async GetChrNames() {
        return await jsonConstsDriver.GetFile("chrNames.json");
    },

    async DownloadOne(chrCode) {
        const chrNameData = (await this.GetChrNames())[chrCode.toUpperCase()];
        if (!chrNameData) return null;
        const chrName = chrNameData.callname;
        
        var res;
        try {
            res = await axios.get(`https://www.dustloop.com/w/GGST/${chrName}/Frame_Data`);
        } catch (err) {
            console.log(err.stack);
            return null;
        }
        
        const data = parser.parse(res.data);
        var frameData = {};

        // core data
        // entrypoint: field_R.I.S.C._Gain_Modifier (parent)
        {
            const parent = data.querySelector("td.field_R\\.I\\.S\\.C\\._Gain_Modifier").parentNode;
            frameData.coreData = {
                defense: parseInt(parent.querySelector(".field_Defense").innerText),
                guts: parseInt(parent.querySelector(".field_Defense").innerText),
                risc: parseInt(parent.querySelector(".field_R\\.I\\.S\\.C\\._Gain_Modifier").innerText),
                prejump: parseInt(parent.querySelector(".field_Prejump").innerText),
                backdash: parent.querySelector(".field_Backdash").innerText,
                forwardDash: parent.querySelector(".field_Forward_Dash").innerText,
                backdash: parent.querySelector(".field_Backdash").innerText,
                uniqueMovement: parent.querySelector(".field_Unique_Movement_Options").innerText,
                movementTensionGain: parseFloat(parent.querySelector(".field_Movement_Tension_Gain").innerText)
            }
        }

        // jump data
        // entrypoint: field_Pre-Instant_Air_Dash (parent)
        {
            const parent = data.querySelector("td.field_Pre-Instant_Air_Dash").parentNode;
            frameData.jumpData = {
                duration: parseFloat(parent.querySelector(".field_Jump_Duration").innerText),
                highDuration: parseFloat(parent.querySelector(".field_High_Jump_Duration").innerText),
                height: parseFloat(parent.querySelector(".field_Jump_Height").innerText),
                highHeight: parseFloat(parent.querySelector(".field_High_Jump_Height").innerText),
                preIAD: parseInt(parent.querySelector(".field_Pre-Instant_Air_Dash").innerText),
                adDuration: parent.querySelector(".field_Air_Dash_Duration").innerText,
                abdDuration: parent.querySelector(".field_Air_Backdash_Duration").innerText,
                adDistance: parseFloat(parent.querySelector(".field_Air_Dash_Distance").innerText),
                abdDistance: parseFloat(parent.querySelector(".field_Air_Backdash_Distance").innerText),
                jumpTensionGain: parent.querySelector(".field_Jumping_Tension_Gain").innerText,
                adTensionGain: parent.querySelector(".field_Air_Dash_Tension_Gain").innerText,
            }
        }

        const wikiFormat = await jsonConstsDriver.GetFile("wikiFormat.json");
        const moveTableSchema = wikiFormat.moveTable_schema;
        const gatlingTableSchema = wikiFormat.gatlingTable_schema;

        // normals
        // entrypoint: #section-collapsible-3 tbody (one per tr)
        {
            const parent = data.querySelector("#section-collapsible-3 tbody");
            const schema = [...moveTableSchema];
            var ret = {};

            // NOTE: moveTable_schema: Normal moves has no "name" (Column 1 in schema)
            schema.splice(1, 1);

            for (let row of parent.childNodes) {
                let index = 0;
                let move = {};
                for (let col of [...row.childNodes].slice(1)) {
                    if (col.innerText.startsWith("\t")) continue;
                    move[schema[index]] = col.innerText || null;
                    ++index;
                }

                // console.log(move);
                ret[move.input] = move;
            }

            frameData.normals = ret;
        }

        // specials
        // entrypoint: #section-collapsible-4 tbody (one per tr)
        {
            const parent = data.querySelector("#section-collapsible-4 tbody");
            const schema = [...moveTableSchema];
            var ret = {};

            for (let row of parent.childNodes) {
                let index = 0;
                var move = {};
                for (let col of [...row.childNodes].slice(1)) {
                    if (col.innerText.startsWith("\t")) continue;
                    move[schema[index]] = col.innerText || null;
                    ++index;
                }

                // console.log(move);
                ret[move.input] = move;
            }

            frameData.specials = ret;
        }

        // supers
        // entrypoint: #section-collapsible-5 tbody (one per tr)
        {
            const parent = data.querySelector("#section-collapsible-5 tbody");
            const schema = [...moveTableSchema];
            var ret = {};

            for (let row of parent.childNodes) {
                let index = 0;
                let move = {};
                for (let col of [...row.childNodes].slice(1)) {
                    if (col.innerText.startsWith("\t")) continue;
                    move[schema[index]] = col.innerText || null;
                    ++index;
                }

                // console.log(move);
                ret[move.input] = move;
            }

            frameData.supers = ret;
        }

        // others
        // entrypoint: #section-collapsible-6 tbody (one per tr)
        {
            const parent = data.querySelector("#section-collapsible-6 tbody");
            const schema = [...moveTableSchema];
            var ret = {};

            // NOTE: moveTable_schema: Other moves has no "input" (Column 0 in schema)
            schema.splice(0, 1);

            for (let row of parent.childNodes) {
                let index = 0;
                let move = {};
                for (let col of [...row.childNodes].slice(1)) {
                    if (col.innerText.startsWith("\t")) continue;
                    move[schema[index]] = col.innerText || null;
                    ++index;
                }

                //console.log(move);
                ret[move.name] = move;
            }

            frameData.normals = ret;
        }

        /**
         * Note on wikiFormat.use_section8_gatling:
         * On the Dustloop wiki, some characters have an extra table regarding
         * data from their unique mechanics, before their gatling tables. These characters'
         * gatling tables are on #section-collapsible-8 instead of #section-collapsible-7,
         * so we define them in wikiFormat.use_section8_gatling.
         */
        
        // gatling table
        // entrypoint: #section-collapsible-(7/8) tbody [0] (one per tr)
        {
            const parent = data.querySelectorAll(`#section-collapsible-${wikiFormat.use_section8_gatling.includes(chrCode) ? 8 : 7} tbody`)[0];
            const schema = [...gatlingTableSchema];
            var ret = {};

            for (let row of [...parent.childNodes].slice(1)) {
                let index = 0;
                let move = {};
                for (let col of row.childNodes) {
                    if (!col.tagName) continue;

                    let text = col.tagName == "TH" ? col.innerText.split("G")[0] : col.innerText.replace("\n", "");
                    move[schema[index]] = text;                    

                    ++index;
                }
                if (Object.keys(move).length == 0) continue;

                // console.log(move);
                ret[move.input] = move;
            }

            frameData.gatlings = ret;
        }

        // air gatling table
        // entrypoint: #section-collapsible-(7/8) tbody [1] (one per tr)
        {
            const parent = data.querySelectorAll(`#section-collapsible-${wikiFormat.use_section8_gatling.includes(chrCode) ? 8 : 7} tbody`)[0];
            const schema = [...gatlingTableSchema];
            var ret = {};

            for (let row of [...parent.childNodes].slice(1)) {
                let index = 0;
                let move = {};
                for (let col of row.childNodes) {
                    if (!col.tagName) continue;

                    let text = col.tagName == "TH" ? col.innerText.split("G")[0] : col.innerText.replace("\n", "");
                    move[schema[index]] = text;                    

                    ++index;
                }
                if (Object.keys(move).length == 0) continue;

                // console.log(move);
                ret[move.input] = move;
            }

            frameData.airGatlings = ret;
        }

        return {
            frameData: frameData
        };
    }
}
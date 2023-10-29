const axios = require('axios');
const parser = require('node-html-parser');
const dataApi = require("./dataApi");

module.exports = {

    /**
     * Looks up overview data by username.
     * Returns all data shown on http://ratingupdate.info/player/<RatingId>/[Character]
     * @param {*} username 
     */
    async LookupOverview(username) {
        if (!username) return null;
        var res = await axios.get(`http://ratingupdate.info/?name=${username.replace(" ", "+")}`);
        if (res.status != 200) return null;

        const data = parser.parse(res.data);
        const tableBody = data.querySelectorAll(".section >*>*>*>*>*");

        var ret = [];

        for (let i = 1; i < tableBody.length; i++) {
            let columns = tableBody[i].querySelectorAll("td");
            let link = columns[0].querySelector("a");
            if (!link || username != link.innerHTML) continue;

            // find the data
            let ratingId = link.attributes.href.match(/\/player\/([A-F0-9]+)\//)[1];
            ret.push({
                ratingId: ratingId,
                chr: columns[1].innerText,
                elo: parseInt(columns[2].innerText.split(" ")[0]),
                eloVariation: parseInt(columns[2].innerText.split(" ")[1].substring(1)),
                playCount: parseInt(columns[3].innerText)
            });
        }

        if (ret.length == 0) return null;
        ret = ret.filter(c => c);

        // see if there are multiple accounts with the same username
        return {
            ratingId: ret.find(c => c && c.ratingId != ret[0].ratingId) ? null : ret[0].ratingId,
            data: ret
        }
    },

    /**
     * Looks up account data by username and character.
     * Returns all data shown on http://ratingupdate.info/player/<RatingId>/<ChrCode>
     * @param {*} ratingId RatingID of the player.
     * @param {*} chrCode Character code of the player.
     */
    async LookupPlayerData(ratingId, chrCode) {
        if (!ratingId || !chrCode) return null;
        try {
            var res = await axios.get(`http://ratingupdate.info/player/${ratingId.toUpperCase()}/${chrCode.toUpperCase()}`);

        } catch {
            return null;
        }

        const data = parser.parse(res.data);
        const parent = data.querySelector(".is-three-quarters-fullhd").querySelector("div");

        // for (let node of parent.childNodes) console.log(`${parent.childNodes.indexOf(node)}:[${node.innerText}]`);
        var ret = {
            ratingId: ratingId,
            chr: chrCode
        };

        // Rating text
        {
            // Ramlethal Rating: 986 ±118 (408 games)
            const text = parent.childNodes[3].innerText
                .trim()
                .replace("\n", " ")
                .replace(/ {2,}/, " ")
                .split(" ");
            const markerIndex = text.indexOf("Rating:");

            ret.rating = {
                elo: parseInt(text[markerIndex + 1]),
                variation: parseInt(text[markerIndex + 2].substring(1)),
                playCount: parseInt(text[markerIndex + 3].substring(1)),
            };
        }

        // top rating
        {
            // Top rating: 983±90 (2023-10-20)   
            const text = parent.childNodes[5].innerText
                .trim()
                .replace("\n", " ")
                .replace(/ {2,}/, " ")
                .split(" ");

            const markerIndex = text.indexOf("rating:");

            ret.topRating = {
                elo: parseInt(text[markerIndex + 1].split("±")[0]),
                variation: parseInt(text[markerIndex + 1].split("±")[1]),
            };

            ret.topRating.achieved = ret.elo ? text[markerIndex + 2].substring(1).split(")")[0] : null;
        }

        // matchups table
        {
            const rows = data.querySelector(".table-container").querySelector("table").querySelectorAll("tr");
            const chrNames = await dataApi.GetChrNames();
            var winrates = {};

            for (let row of rows.slice(1)) {
                const col = row.querySelectorAll("td").map(c => c.innerText);
                var winrate = {
                    playcount: parseInt(col[1]),
                    winrate: parseInt(col[2]) / 100,
                    ratingOffset: col[3] ? parseInt(col[3].split(" ")[0]) : null,
                    variation: col[3] ? parseInt(col[3].split(" ")[1].substring(1)) : null,
                };
                
                winrate.wins = winrate.winrate * winrate.playcount;

                if (col[0] == "Overall") ret.winrate = winrate;
                else {
                    const code = Object.keys(chrNames)
                    .find(c => chrNames[c].pretty.split(" ")[0].toLowerCase() == col[0].split(" ")[0].toLowerCase());

                    // console.log(code);
                    winrates[code] = winrate;
                }

            }

            ret.matchups = winrates;
        }

        return ret;
    }
}
const axios = require('axios');
const parser = require('node-html-parser');

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

        if (!ret) return null;

        // see if there are multiple accounts with the same username
        return {
            ratingId: ret.find(c => c.ratingId != ret[0].ratingId) ? null : ret[0].ratingId,
            data: ret
        }
    }
}
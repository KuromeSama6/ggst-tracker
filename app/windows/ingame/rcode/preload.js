const { contextBridge, ipcRenderer } = require("electron");

const upstream = { 

    
}

contextBridge.exposeInMainWorld("upstream", upstream);

function $g(ele) {
    return document.getElementById(ele);
}

function _(ele, content) {
    $g(ele).innerHTML = content;
}

function glicko2WinRate(p1, p2) {
    // Glicko-2 constants
    const tau = 0.5; // System constant
    const ratingSystem = 1500.0; // The initial rating for all players
    const scaleFactor = 173.7178; // Conversion factor

    // Convert Glicko-2 rating to the scale
    const g2scale = (rating) => (rating - ratingSystem) / scaleFactor;

    // Inverse function to convert back to Glicko-2 rating
    const g2rating = (scale) => scale * scaleFactor + ratingSystem;

    // Calculate the estimated win rate with RD
    const g2RD1 = p1.rd / scaleFactor; // Convert RD to the scale
    const g2RD2 = p2.rd / scaleFactor;

    const g2phi1 = Math.sqrt(g2RD1 * g2RD1 + tau * tau);
    const g2phi2 = Math.sqrt(g2RD2 * g2RD2 + tau * tau);

    const g2E1 = 1 / (1 + Math.pow(10, (g2scale(p2.rating) - g2scale(p1.rating)) / (2 * g2phi1)));
    const g2E2 = 1 / (1 + Math.pow(10, (g2scale(p1.rating) - g2scale(p2.rating)) / (2 * g2phi2)));

    return {
        p1: g2E1,
        p2: g2E2,
    };
}

function lerpColor(col1, col2, p) {
    const rgb1 = parseInt(col1, 16);
    const rgb2 = parseInt(col2, 16);
  
    const [r1, g1, b1] = toArray(rgb1);
    const [r2, g2, b2] = toArray(rgb2);
  
    const q = 1-p;
    const rr = Math.round(r1 * p + r2 * q);
    const rg = Math.round(g1 * p + g2 * q);
    const rb = Math.round(b1 * p + b2 * q);
  
    return  Number((rr << 16) + (rg << 8) + rb).toString(16);
}

function toArray(rgb) {
    const r = rgb >> 16;
    const g = (rgb >> 8) % 256;
    const b = rgb % 256;
  
    return [r, g, b];
}

ipcRenderer.on("SetRcode", (e, self, rival) => {
    console.log(self);
    console.log(rival);

    document.querySelector("body").style.backgroundColor = self.suc ? "#171717ee" : "#0000";
    $g("rcode-error-box").hidden = self.suc;
    $g("rcode-content").hidden = !self.suc;
    // failed
    if (!self.suc) {
        _("rcode-error-msg", self.msg);
        return;
    }

    _("$username", self.username);
    _("$chr", self.extra.chrPretty);

    _("$elo", `${self.data.rating.elo} ±${self.data.rating.variation}`);
    _("$elo-hi", self.data.topRating.elo ? `${self.data.topRating.elo} ±${self.data.topRating.variation}` : "-");
    _("$elo-hi-ach", self.data.topRating.achieved || "-");

    _("$mu-overall-wl", `${Math.round(self.data.winrate.wins)}/${self.data.winrate.playcount}`);
    _("$mu-overall-wr", `${self.data.winrate.winrate * 100}%`);

    _("$mu-chr", rival.suc ? rival.data.chr : "[error]");
    var data = rival.suc ? self.data.matchups[rival.data.chr] : null;
    _("$mu-chr-wl", data ? `${Math.round(data.wins)}/${data.playcount}` : "-");
    _("$mu-chr-wr", data ? `${data.winrate * 100}%` : "-");
    _("$mu-chr-elo", data ? `${data.ratingOffset} ±${data.variation}` : "-");

    // winrate
    if (self.suc && rival.suc) {
        const chances = glicko2WinRate(
            {rating: self.data.rating.elo, rd: self.data.rating.variation},
            {rating: rival.data.rating.elo, rd: rival.data.rating.variation}
        );
        const chance = chances.p1;
        console.log(`elo win chance: ${chance}`);
        
        _("$elo-winchance", `${Math.round(chance * 10000) / 100}%`)
        $g("$elo-winchance").style.color = lerpColor("#cb0000", "#039500", chance);
        $g("$elo-winchance").style.borderColor = chance > chances.p2 ? "#00b9ff" : "#cb0000";
    } else _("$elo-winchance", `-`)

})
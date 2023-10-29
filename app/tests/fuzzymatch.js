const ocrApi = require("../util/ocrApi");
const _fs = require("fs");
const path = require("path");
const fs = _fs.promises;
const sharp = require("sharp");

async function Run() {
    var data = (await ocrApi.PrepareImageOCR(await fs.readFile(path.join(__dirname, "ocr", "7.png")), false)).username;
    await fs.writeFile(path.join(__dirname, "output.png"), data);

    const result = (await ocrApi.OCRAll(data)).data.text;

    //console.log(result);
    // console.log(await ocrApi.FuzzMatchChr("baiken"));
    // console.log(await ocrApi.GetChrCodes("K GIU S ASUKA R #"));
    console.log(await ocrApi.GetChrCodes(`- ER 4 vr -
AN LJ 4 1
[4 TIALS Wad ve
ーー し | と |
れれ (いい 4 四
TN ) ー ’
; CR KuromeSama6 TE ; 8 wald6 TE に
GU A ASUKA R # RAMLETHAL VALENTINE
© 890000000 © 780000000`));
}

Run();
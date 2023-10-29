const ocrApi = require("../util/ocrApi");
const _fs = require("fs");
const path = require("path");
const fs = _fs.promises;
const sharp = require("sharp");

async function Run() {
    var data = (await ocrApi.PreprocessImageOCR(await fs.readFile(path.join(__dirname, "ocr", "7.png")), false)).username;
    var counter = 0;
    await ocrApi.GetScheduler();

    console.time();
    for (let i = 0; i < 10; i++) {
        ocrApi.OCRAll(data).then(() => console.timeLog());
    }
}

Run();
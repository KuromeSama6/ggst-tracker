const ratingUtil = require("../util/ratingApi");

async function Run() {
    var ratingId = await ratingUtil.LookupOverview("GG Player");
    console.log(ratingId);
}
Run();
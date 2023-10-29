const ratingApi = require("../util/ratingApi");

async function Run() {
    var { ratingId } = await ratingApi.LookupOverview("KuromeSama6");
    var data = await ratingApi.LookupPlayerData(ratingId, "RA");
    console.log(data);
}
Run();
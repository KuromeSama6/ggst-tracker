const dataApi = require("../util/dataApi");

async function Run() {
    var chrNames = await dataApi.GetChrNames();
    var data = await dataApi.DownloadOne("JO");
    
    console.log(data);
}
Run();
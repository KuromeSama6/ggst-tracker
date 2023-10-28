var effectiveRatingId = "";

$g("@setup-input-username").addEventListener("click", () => {
    SubmitUsername(false);
});

$g("@setup-input-ratingid").addEventListener("click", () => {
    SubmitUsername(true);
});

$g("@setup-username-confirm-n").addEventListener("click", () => {
    effectiveRatingId = "";
    SetActiveBlock("status-username-input");
});

$g("@setup-username-confirm-y").addEventListener("click", () => {
    ConfirmAccount();
    SetActiveBlock("status-loading");
});

// functions
async function SubmitUsername(isRatingId) {
    var username = $g("!setup-input-username").value;
    if (username == "") return;

    const errorMsg = $g("$setup-input-errormsg");
    errorMsg.hidden = true;

    for (let ele of $g("setup-input-container").querySelectorAll("button")) ele.hidden = true;
    $g("setup-input-loading").hidden = false;

    var res = await upstream.SetupSubmitUsername(username, isRatingId);
    
    errorMsg.hidden = res.suc;
    for (let ele of $g("setup-input-container").querySelectorAll("button")) ele.hidden = false;
    $g("setup-input-loading").hidden = true;

    if (!res.suc) {
        errorMsg.innerText = res.msg;
        return;
    }

    // successful - next
    effectiveRatingId = res.ratingId;
    SetActiveBlock("status-username-confirm");
    _("$setup-username-confirm-ratingid", effectiveRatingId);
    _("$setup-username-confirm-username", username);
    _("$setup-username-confirm-characters", res.data.map(c => c.chr).join(", "));
}

async function ConfirmAccount(ratingId = effectiveRatingId) {
    upstream.ConfirmAccount(ratingId);
}

function SetActiveBlock(id) {
    var ele = document.getElementById(id);
    for (let child of document.getElementById("status-container").childNodes) child.hidden = true;
    ele.hidden = false;
}

upstream.RequestSetupProgress().then(progress => {
    console.log(`Setup progress: ${progress}`)

    switch (progress) {
        case 0:
            SetActiveBlock("status-username-input");
            break;

        case 1:
            SetActiveBlock("status-loading");
            break;
    }
});

// TODO Get setup progress from upstream
//SetActiveBlock("status-username-input");
//SetActiveBlock("status-loading");
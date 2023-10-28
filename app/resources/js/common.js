'use strict';

// Consts area ============================
const minecraftColorCodeTranslation = {
    0: "##000000", 1: "##0000AA", 2: "##00AA00",
    3: "##00AAAA", 4: "##AA0000", 5: "##AA00AA",
    6: "##FFAA00", 7: "##AAAAAA", 8: "##555555",
    9: "##5555FF", a: "##55FF55", b: "##55FFFF",
    c: "##FF5555", d: "##FF55FF", e: "##FFFF55",
    f: "##FFFFFF", d: "##FF55FF", l: "@b",
    r: "*"
}

// Code area ===============================

// recursive
function setAllElementsDisabled(element, disable){
    for (let child of element.children){
        child.disabled = disable;
        if (child.children.length > 0) setAllElementsDisabled(child, disable)
    }
}

function sendPostRequest(url, body, onSuccess, onFail=null){
    fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: Object.entries(body).map(([k,v])=>{
            return k+'='+encodeURI(v).replaceAll("%", "$$$");
        }).join('&')

    }).then(
        (response) => response.json().then(data => {
            try{
                onSuccess(JSON.parse(data));
                return
            }catch{
                onSuccess({});
            }
        })
    ).catch(
        (error) => {
            if (onFail != null) {
                onFail(error)
            }
        }
    )
}

function parseDateString(date){
    date = date;

    try{
        const offset = new Date().getTimezoneOffset()
        var ret = new Date(new Date(date).getTime() - (offset*60*1000))
        return `${ret.toISOString().split('T')[0]} ${ret.toISOString().split('T')[1].split('.')[0]}`
    }catch(e){
        return date;
    }
}


function Clone (parent, element) {
    var cloned = element.cloneNode(true);
    cloned.hidden = false;
    parent.appendChild(cloned);
 
    return cloned;
}

function ParseMinecraftColorCode(char, str){
    var segments = (`${char}0`+str).split(char);
    var ret = ''
    var supplements = [];
    // eg: &l&aYou&care&rd&ldead

    // early return
    if (segments.length <= 1) return str;

    // start processing

    // Note: color codes are parsed in a linear manner
    for (const seg of segments){
        // disregard a empty segment
        if (seg == '') continue;

        const colorCode = seg[0]; // color code
        const content = seg.substring(1, seg.length); // reset of the stuff
        const formatStr = minecraftColorCodeTranslation[colorCode];
        // disregard an invalid color code
        if (formatStr == undefined) continue;

        const operationType = formatStr[0];
        const format = formatStr.substring(1, formatStr.length);

        switch (operationType){
            // color code
            case '#':
                ret += `<span style="color:${format};">${content}`;
                supplements.push('</span>');
                break;

            // font weight code
            case '@':
                ret += `<span style="font-weight:bold;">${content}`;
                supplements.push(`</span>`);
                break;

            // reset
            case '*':
                ret += `<span style="font-weight:normal;color:black;">${content}`;
                supplements.push(`</span>`);
                break;
        }

    }

    // put back the supplements
    supplements.reverse();
    for (const suppl of supplements){
        ret += suppl;
    }

    return ret;

}


function _(id, content){
    var element = document.getElementById(id);
    if (element != null) {
        element.innerHTML = content;
        return true;
    } else return false;
}

function _a(id, content){
    for (let element of document.getElementsByClassName(id)){
        if (element != null) {
            element.innerHTML = content;
        }
    }
}

function $g(id){
    return document.getElementById(id);
}

function $ga(id){
    return document.getElementsByClassName(id);
}

function $v(id, visible){
    var ele = $g(id);
    if (ele != null) {
        ele.hidden = !visible;
        return true;
    } else return false;
}

$(document).ready(function(){

    $('#lastFarm').remove();
    let active = ' active';
    if(getUrlParam('farm') == '0xA2c88A39b1DE8f1d723d9E76AD07f6012826d0f3' ) {
        $('#genesisFarm').addClass('active');
        active = '';
    }
    if(getUrlParam('farm') == '0x87E5aFba16E3BEbd967699B4D5472B2ae1AA8Fa7' ) {
        $('#xdaiFarm').addClass('active');
        active = '';
    }
    let lastFarm = getCookie('lastFarm');
    lastFarm = JSON.parse(lastFarm);
    if (lastFarm && lastFarm.farm != '0x87E5aFba16E3BEbd967699B4D5472B2ae1AA8Fa7') {
        let address = 'address';
        let view = 'farm-view';
        if (lastFarm.farm == '0x4de091aD2Eda0a7837617Ab502d9724960119a47') {
            address = 'farm';
            view = 'farm';
        }
        $('.sidebar').find('.nav').append('<li id="lastFarm" class="nav-item' + (getUrlParam(address) ? active : '') + '">\n' +
            '                <a class="nav-link" href="' + view + '.html?' + address + '=' + lastFarm.farm + '">\n' +
            '                    <i class="material-icons">grass</i>\n' +
            '                    <p class="text-truncate">' + lastFarm.name + '</p>\n' +
            '                </a>\n' +
            '            </li>');
    }

});

function getUrlParam(param_name) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(param_name);
};

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
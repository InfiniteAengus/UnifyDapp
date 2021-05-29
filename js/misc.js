let network = 'Rinkeby';
let chain_id = '4';

// recommended block lists for adult collections on the marketplace
// remove the switch below to display all offers from these collections in the public marketplace
// add more items of any collection you want to block
let blocked_collections = [];

switch(chain_id){
    // xDai
    case '64':
        blocked_collections = [
            "0x601c54655927E15f897480Bf0964085892Ec2d4F".toLowerCase(), // haremtoken
            "0x0E015FaeEb2701D0b96eB2008cAdBF30A3C7A3de".toLowerCase() // mcthot
        ];
        break;
    // Binance Smart Chain
    case '38':
        blocked_collections = [
            "0x34F16273C250d30C9de5356f54c08C5E7f22de5d".toLowerCase(), // cumrocket
            "0x436B4B0D583A80742C968B9390B384B1BD00346f".toLowerCase(), // cumrocket 2
            "0x99303072453868da39EA02Bc8892d7f6c18ca657".toLowerCase(), // cumrocket 3
            "0x803Ab90866494262c56e30CEb1F86aAd2e36Be64".toLowerCase(), // unknown
            "0x8B94C8aB3c6C293eC5386706735D103C2f145eC0".toLowerCase(), // tight milena
            "0xCBC27b95130A7EBF834DEd352fbD4F715A3f6e59".toLowerCase(), // EDEN KAIN
            "0xcbd86C3693F8F948bc0C7118C3Ff96F66f317Caa".toLowerCase(), // EDEN KAIN 2
            "0xc7921109FB1Bea0c19fCfB5288E700D606AE6B59".toLowerCase(), // animated art
            "0x3C6C221EeF17bEa444d4B531A878b4373D3edeFC".toLowerCase(), // haremtoken
            "0xD8A6d085DfDB9498a263563f91Cc26bE57EFE4b6".toLowerCase(), // Blackie
            "0x11F5780B54FCfF12fe791eafa34A60F770442d98".toLowerCase(), // anime token
            "0x48d76436F7596DDE45bDD384C375B71Cde3F0208".toLowerCase(), // oppai
            "0x306d4e3Add799686c48FF51DE01DC4f6F122EfF5".toLowerCase(), // appai 2
            "0x59a713632989883b29D544B98Ef3D090A1Ea540B".toLowerCase(),  // rylieeeeb
            "0xDCe4d2AE85ef0E7db7923Cb0AA3307e8bF708BA7".toLowerCase(), // eden kain 3
            "0x339798Ab5b634f6EC3e733ade5d321685847aaa7".toLowerCase(), // eve
            "0x6ff76253235003970ee0224fa97F440166E1dC12".toLowerCase(), // crypto autistic portfolio
            "0x9dE954246AAC2166f7EC14FaAFFAe94bcc463336".toLowerCase(), // cumrocket 4
            "0x1040c4B3BB1Be9d7024499F6AFd0E9aba9d4dab0".toLowerCase(), // eden kain 3
            "0x082ccbFB8446Bc536eF43a1a1a456DEC5f79800C".toLowerCase(), // sophie's feet
            "0x53617d52F6c38235E485D40d053BE024E32aFbc4".toLowerCase(), // awesome colletion
            "0x8D7d1ec378F5FfE9CC3AEB20916e3bEc75B4727B".toLowerCase() // defi hefi
        ];
        break;
    // add further chain specific as desired...
}

/**
 * DO NOT EDIT ANYTHING BELOW
 */

//let api_url = 'http://localhost/knots/rest/public/';
let api_url = 'https://api.unifty.cloud/';

$(document).ready(function(){

    if(chain_id != '4' && chain_id != '1'){
        $('.bridgeNav').css('display', 'none');
    }

    if(chain_id != '1'){

        $('#chainSelectionDropdown').html(network);

    }

    if(chain_id == '1'){

        $('#marketNavLink').css('display', 'none');
        $('#marketRoyaltiesLink').css('display', 'none');
        $('#marketSellLink').css('display', 'none');
    }

    if(chain_id == '61' || chain_id == '38') {
        $('#featured').css('display', 'none');
        //$('#genesisFarm').css('display', 'none');
        //$('#xdaiFarm').css('display', 'none');
        $('#getNifUniswap').css('display', 'none');
        $('#mirror').css('display', 'none');
        $('#bscLogo').css('display', 'block');
        $('#paymentDescription').css('display', 'none');
        $('.hideNonEth').css('display', 'none');
        $('.networkStd').html('BEP20');
        $('#shopEthereum').css('display', 'none');
        $('#shopBsc').css('display', 'inline-block');
        $('#shopXdai').css('display', 'none');
    }else if(chain_id == '4d'){
        $('#featured').css('display', 'none');
        //$('#genesisFarm').css('display', 'none');
        //$('#xdaiFarm').css('display', 'none');
        $('#getNifUniswap').css('display', 'none');
        $('#mirror').css('display', 'none');
        $('#bscLogo').html('xDai/POA (Sokol) Testnet');
        $('#bscLogo').css('display', 'block');
        $('#paymentDescription').css('display', 'none');
        $('.hideNonEth').css('display', 'none');
        $('.networkStd').html('ERC20');
    }else if(chain_id == '64'){
        $('#featured').css('display', 'none');
        //$('#genesisFarm').css('display', 'none');
        //$('#xdaiFarm').css('display', 'none');
        $('#getNifUniswap').css('display', 'none');
        $('#mirror').css('display', 'none');
        $('#bscLogo').html('xDai Chain');
        $('#bscLogo').css('display', 'block');
        $('#paymentDescription').css('display', 'none');
        $('.hideNonEth').css('display', 'none');
        $('.networkStd').html('ERC20');
        $('#shopEthereum').css('display', 'none');
        $('#shopBsc').css('display', 'none');
        $('#shopXdai').css('display', 'inline-block');
    }else if(chain_id == '89'){
        $('#featured').css('display', 'none');
        //$('#genesisFarm').css('display', 'none');
        //$('#xdaiFarm').css('display', 'none');
        $('#getNifUniswap').css('display', 'none');
        $('#mirror').css('display', 'none');
        $('#bscLogo').html('Polygon (Matic)');
        $('#bscLogo').css('display', 'block');
        $('#paymentDescription').css('display', 'none');
        $('.hideNonEth').css('display', 'none');
        $('.networkStd').html('ERC20');
    }else if(chain_id == '507'){
        $('#featured').css('display', 'none');
        //$('#genesisFarm').css('display', 'none');
        //$('#xdaiFarm').css('display', 'none');
        $('#getNifUniswap').css('display', 'none');
        $('#mirror').css('display', 'none');
        $('#bscLogo').html('Moonbeam (Alpha)');
        $('#bscLogo').css('display', 'block');
        $('#paymentDescription').css('display', 'none');
        $('.hideNonEth').css('display', 'none');
        $('.networkStd').html('PRC20');
    }else if(chain_id == 'a4ec'){
        $('#featured').css('display', 'none');
        //$('#genesisFarm').css('display', 'none');
        //$('#xdaiFarm').css('display', 'none');
        $('#getNifUniswap').css('display', 'none');
        $('#mirror').css('display', 'none');
        $('#bscLogo').html('CELO');
        $('#bscLogo').css('display', 'block');
        $('#paymentDescription').css('display', 'none');
        $('.hideNonEth').css('display', 'none');
        $('.networkStd').html('CRC20');
    }else if(chain_id == 'a86a'){
        $('#featured').css('display', 'none');
        //$('#genesisFarm').css('display', 'none');
        //$('#xdaiFarm').css('display', 'none');
        $('#getNifUniswap').css('display', 'none');
        $('#mirror').css('display', 'none');
        $('#bscLogo').html('AVALANCHE');
        $('#bscLogo').css('display', 'block');
        $('#paymentDescription').css('display', 'none');
        $('.hideNonEth').css('display', 'none');
        $('.networkStd').html('ARC20');
    }
    else{
        $('.networkStd').html('ERC20');
        $('#linkToBsc').css('display', 'block');
        $('#linkToDai').css('display', 'block');
        $('#linkToMatic').css('display', 'block');
        $('#linkToCelo').css('display', 'block');
        $('#shopEthereum').css('display', 'inline-block');
        $('#shopBsc').css('display', 'none');
        $('#shopXdai').css('display', 'none');
    }

    $('#nulsSco').on('click', displayNulsScoInfo);
});

if(typeof marked != 'undefined') {
    marked.setOptions({
        renderer: new marked.Renderer(),
        pedantic: false,
        gfm: true,
        breaks: false,
        smartLists: true,
        smartypants: false,
        xhtml: true
    });
}

function _alert(msg){
    $('#alertModal .modal-body').html(msg);
    $('#alertModal').modal('show');
};

function displayNulsScoInfo(){

    _alert("Project capital funding is brokered by <a href=\"https://www.nuls.io/\" target=\"_blank\">NULS'</a> <a href=\"https://nuls.medium.com/nuls-2-0-project-nerve-network-bridges-into-the-larger-bitcoin-and-ethereum-universe-5a54bf0138e6\" target=\"_blank\">SCO</a> platform (Staked Coin Output) and highly recommended by the Unifty project.<br /><br />\n" +
        "As an entrepreneur, you may issue your own token on the NULS blockchain and the POCM platform will automatically introduce your project to investors.<br /><br />\n" +
        "Investors will stake on your token and you receive $NULS rewards as capital.<br /><br />\n" +
        "Additionally, your token will be listed on NULS' Nerve Network DEX (Decentralized Exchange) once completed.<br /><br />\n" +
        "A NULS token bridge will be available soon, enabling you to use your token with our services such as the Farm Builder.<br /><br />\n" +
        "\n" +
        "<button style=\"cursor: pointer;\" type=\"button\" class\"btn btn-secondary\" onclick=\"window.location.href='https://pocm.nuls.io/pocm';\">Get Project Funding</button><br/><br/>\n" +
        "\n" +
        "Disclaimer: Our support for NULS' project funding is not a paid promotion. We are planning to build native NULS chain support for Unifty. Once completed, tokens created on NULS' SCO platform will be directly usable with our platform and won't need any bridging.\n" +
        "\n" +
        "\n" +
        "\n");

}

function getCurrency(){
    if(chain_id == '61' || chain_id == '38') {
        return 'BNB';
    } else
    if(chain_id == '4d') {
        return 'SPOA';
    }
    if(chain_id == '64') {
        return 'xDai';
    }
    if(chain_id == '89') {
        return 'MATIC';
    }
    if(chain_id == '507') {
        return 'DEV';
    }
    if(chain_id == 'a4ec') {
        return 'CELO';
    }
    if(chain_id == 'a86a') {
        return 'AVAX';
    }
    return 'ETH';
}

async function fetchWithTimeout(resource, options) {
    const { timeout = 8000 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);

    return response;
}

async function fetchUrl(url, timeout) {
    try {
        const response = await fetchWithTimeout(url, {
            timeout: timeout
        });
        return await response.text();
    } catch (error) {
        console.log("FetchUrl Timeout: ", url);
        return false;
    }
}

function getTimestamp(){
    return Math.round((new Date()).getTime() / 1000);
}

function splitNChars(txt, num) {
    let theText = Base64.encode(txt);
    var result = [];
    for (var i = 0; i < theText.length; i += num) {
        result.push(web3.utils.asciiToHex(theText.substr(i, num)));
    }
    return result;
}

Handlebars.registerHelper('breaklines', function(text) {
    text = Handlebars.Utils.escapeExpression(text);
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
    return new Handlebars.SafeString(text);
});

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifNotEquals', function(arg1, arg2, options) {
    return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('eq', function () {
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(function (expression) {
        return args[0] === expression;
    });
});

Handlebars.registerHelper('mod0', function (value, res) {

    this.index = res.data.index;
    const _this = this;
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(function (expression) {
        return _this.index % expression === 0;
    });
});

Handlebars.registerHelper('mod1', function (value, res) {

    this.index = res.data.index;
    const _this = this;
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(function (expression) {
        return _this.index % expression === 1;
    });
});

Handlebars.registerHelper('mod2', function (value, res) {

    this.index = res.data.index;
    const _this = this;
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(function (expression) {
        return _this.index % expression === 2;
    });
});

Handlebars.registerHelper('mod3', function (value, res) {

    this.index = res.data.index;
    const _this = this;
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(function (expression) {
        return _this.index % expression === 3;
    });
});

Handlebars.registerHelper('mod4', function (value, res) {

    this.index = res.data.index;
    const _this = this;
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(function (expression) {
        return _this.index % expression === 4;
    });
});

Handlebars.registerHelper("markdown", function(md, options) {
    md = Handlebars.Utils.escapeExpression(md);
    md = md.replace(/(\r\n|\n|\r)/gm, '<br>');
    if(typeof marked == 'undefined'){
        return new Handlebars.SafeString(md);
    }
    return new Handlebars.SafeString(marked(md));
});

Handlebars.registerHelper("markdownNoBr", function(md, options) {
    if(typeof marked == 'undefined'){
        return new Handlebars.SafeString(md);
    }
    return new Handlebars.SafeString(marked(md));
});

$(function () {
    'use strict'

    $('[data-toggle="offcanvas"]').on('click', function () {
        $('.offcanvas-collapse').toggleClass('open')
    })
})

const promisify = (inner) =>
    new Promise((resolve, reject) =>
        inner((err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        })
    );
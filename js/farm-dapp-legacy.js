function TncDapp() {

    //const ipfs = window.IpfsHttpClient('ipfs.infura.io', '5001', { protocol: 'https' });
    const _this = this;
    this.farmTemplate = Handlebars.compile($('#farm-template').html());
    this.nextButtonTemplate = Handlebars.compile($('#next-button').html());
    this.lastNftIndex = -1;
    this.currentBlock = 0;
    this.prevAccounts = [];
    this.prevChainId = '';
    this.tokenStakingInterval = null;
    this.earnedStakingInterval = null;

    this.populateFarm = async function(farmAddress){

        let decimals = await tncLib.farmTokenDecimals(farmAddress);

        if(_this.lastNftIndex == -1) {
            $('#farmPage').html('');
        }else{
            $('#loadMore').remove();
        }

        let nfts = await window.tncLib.getFarmNfts(farmAddress);

        let farm_name = 'Farm';
        let custom_link_value = '';
        let custom_link_name = '';

        try {

            let data = await $.getJSON(await tncLib.farmJsonUrl(farmAddress));

            if (typeof data == 'object') {

                farm_name = typeof data.name != 'undefined' && data.name ? data.name : '';
                if(typeof data.customLink != 'undefined' && typeof data.customLink.name != 'undefined' && data.customLink.name
                    && typeof data.customLink.value != 'undefined' && data.customLink.value){
                    custom_link_value = data.customLink.value;
                    custom_link_name = data.customLink.name;
                }
            }

        }catch (e){

        }

        $('#farmPageHead').append('<div class="w-100 row justify-content-center content-center mb-3" id="headerInclude"></div>\'');

        $('#headerInclude').append('<div style="text-align: center" class="container-fluid mb-1"><h1 id="nftFarmNameTitle"></h1></div>');
        $('#nftFarmNameTitle').text(farm_name);

        if(custom_link_value != '') {
            $('#headerInclude').append('<div style="text-align: center" class="container-fluid mb-5"><a id="nftFarmCustomLink" href="#"></a></div>');
            $('#nftFarmCustomLink').text(custom_link_name);
            $('#nftFarmCustomLink').attr('href', custom_link_value);
        }


        let offset = _this.lastNftIndex > -1 ? _this.lastNftIndex : 0;
        let currentIndex = offset;

        for(let i = offset; i < nfts.length; i++){

            currentIndex = i;

            let nft = await window.tncLib.getNft(nfts[i].erc1155, nfts[i].id);
            let farm_data = await window.tncLib.farmNftData(farmAddress, nfts[i].erc1155, nfts[i].id);

            let data_image = '';
            let data_name = '';
            let data_description = '';
            let data_link = '';
            let data_attributes = [];

            try {

                let data = await $.getJSON(nft.uri);

                if (typeof data == 'object') {

                    data_image = typeof data.image != 'undefined' && data.image ? data.image : '';
                    data_name = typeof data.name != 'undefined' && data.name ? data.name : '';
                    data_description = typeof data.description != 'undefined' && data.description ? data.description : '';
                    data_link = typeof data.external_link != 'undefined' && data.external_link ? data.external_link : '';
                    data_attributes = typeof data.attributes != 'undefined' && data.attributes ? data.attributes : [];
                }

            }catch (e){

                try {
                    let data = await $.getJSON(nft.uri.toLowerCase().replace('gateway.ipfs.io', 'cloudflare-ipfs.com'));

                    if (typeof data == 'object') {

                        data_image = typeof data.image != 'undefined' && data.image ? data.image.toLowerCase().replace('gateway.ipfs.io', 'cloudflare-ipfs.com') : '';
                        data_name = typeof data.name != 'undefined' && data.name ? data.name : '';
                        data_description = typeof data.description != 'undefined' && data.description ? data.description : '';
                        data_link = typeof data.external_link != 'undefined' && data.external_link ? data.external_link : '';
                        data_attributes = typeof data.attributes != 'undefined' && data.attributes ? data.attributes : [];
                    }
                }catch (e){}

            }

            let stock = await tncLib.balanceof(nfts[i].erc1155, farmAddress, nfts[i].id);

            let traits_hide = '';
            if(data_attributes.length == 0){
                traits_hide = 'style="visibility:hidden;"';
            }

            if(farmAddress != '0xA2c88A39b1DE8f1d723d9E76AD07f6012826d0f3') {

                let cookieValue = JSON.stringify({farm: farmAddress, name: farm_name.replace(';', '.')});
                setCookie('lastFarm', cookieValue, 365);

                $('#lastFarm').remove();
                $('#collapseFarm').find('.nav').append('<li id="lastFarm" class="nav-item collapsible' + (getUrlParam('farm') ? ' active' : '') + '">\n' +
                    '                <a class="nav-link" href="farm.html?farm=' + farmAddress + '">\n' +
                    '                    <i class="material-icons">fiber_manual_record</i>\n' +
                    '                    <p class="text-truncate">' + farm_name + '</p>\n' +
                    '                </a>\n' +
                    '            </li>');
            }

            let tmpl = _this.farmTemplate({
                image: data_image,
                name: data_name,
                description: data_description,
                url: data_link,
                attributes: data_attributes,
                id: nfts[i].id,
                erc1155: nfts[i].erc1155,
                supply: nft.supply,
                maxSupply: nft.maxSupply,
                balance: nft.balance,
                points: nfts[i].points,
                pointsRaw: nfts[i].pointsRaw,
                mintFee: nfts[i].mintFee,
                artist: nfts[i].artist,
                nsfw: nfts[i].nsfw,
                shadowed: nfts[i].shadowed,
                releaseTime: nfts[i].releaseTime,
                totalSupply: farm_data.supply,
                stock : stock,
                traitsHide : traits_hide
            });


            // hack to not display an adult NFT in the unifty rares farm
            if( chain_id == '1' && nfts[i].erc1155.toLowerCase() == '0x774418646555F414CBaEcA6CF3C72A0613D4daB4'.toLowerCase() && nfts[i].id == 21 ){

                // nothing

            }else{

                $('#farmPage').append(tmpl);
            }

            $('#redeemButton'+nfts[i].erc1155+nfts[i].id).on('click', async function(){

                let user_balance = await tncLib.farmPointsEarned(farmAddress, tncLib.account);

                if(user_balance >= $(this).data('points') && stock > 0){

                    console.log("Mint Fee", nfts[i].mintFee);

                    await tncLib.farmRedeem(
                        farmAddress, nfts[i].erc1155,
                        nfts[i].id,
                        ""+nfts[i].mintFee,
                        function () {
                            toastr["info"]('Please wait for the transaction to finish.', "Redeem....");
                        },
                        function (receipt) {
                            console.log(receipt);
                            toastr.remove();
                            toastr["success"]('Transaction has been finished.', "Success");
                            $('#nftStakeButton').prop('disabled', false);
                            $('#nftStakeButton').html('Stake Now!');
                        },
                        function (err) {
                            toastr.remove();
                            let errMsg = 'An error occurred with your redeem transaction.';                    
                            toastr["error"](errMsg, "Error");
                            errorPopup("Error", errMsg, err.stack);
                            $('#nftStakeButton').prop('disabled', false);
                            $('#nftStakeButton').html('Stake!');
                        });

                }
            });

            let maxPerLoad = 8;

            if( i % maxPerLoad == maxPerLoad - 1 ){

                _this.lastNftIndex = i + 1;

                break;
            }

            fixingDropdowns();
        }

        if(currentIndex + 1 < nfts.length){

            $('#loadMore').remove();
            $('#farmPage').append(_this.nextButtonTemplate({}));
            $('#loadMoreButton').off('click');
            $('#loadMoreButton').on('click', function(){
                _this.populateFarm(farmAddress);
            });
        }

        /**
         * STAKE ACTION
         */

        $('#nftStakeButton').off('click');
        $('#nftStakeButton').on('click', async function(){

            toastr.remove();

            let stake_amount = $('#nftStakeAmount').val();

            let splitted = stake_amount.split(".");
            if(splitted.length == 1 && decimals > 0){
                splitted[1] = '';
            }
            if(splitted.length > 1) {
                let size = decimals - splitted[1].length;
                for (let i = 0; i < size; i++) {
                    splitted[1] += "0";
                }
                stake_amount = "" + (splitted[0] == 0 ? '' : splitted[0]) + splitted[1];
            }

            let farmToken = await tncLib.farmToken(farmAddress);

            if(
                await tncLib.allowanceErc20Raw(
                    farmToken,
                    tncLib.account,
                    farmAddress
                ) < parseInt(stake_amount)
            ){

                $('#nftStakeButton').prop('disabled', true);
                $('#nftStakeButton').html('Approve first!');

                await window.tncLib.approveErc20(
                    farmToken,
                    stake_amount,
                    farmAddress,
                    function () {
                        toastr["info"]('Please wait for the transaction to finish.', "Approve....");
                    },
                    function (receipt) {
                        console.log(receipt);
                        toastr.remove();
                        toastr["success"]('Transaction has been finished.', "Success");
                        $('#nftStakeButton').prop('disabled', false);
                        $('#nftStakeButton').html('Stake Now!');
                    },
                    function (err) {
                        toastr.remove();
                        let errMsg = 'An error occurred with your approval transaction.';                    
                        toastr["error"](errMsg, "Error");
                        errorPopup("Error", errMsg, err.stack);
                        $('#nftStakeButton').prop('disabled', false);
                        $('#nftStakeButton').html('Stake!');
                    });
            }
            else {

                $('#nftStakeButton').prop('disabled', false);
                $('#nftStakeButton').html('Stake!');

                await window.tncLib.farmStake(
                    farmAddress,
                    stake_amount,
                    function () {
                        toastr["info"]('Please wait for the transaction to finish.', "Staking....");
                        $('#nftStakeButton').prop('disabled', true);
                        $('#nftStakeButton').html('Processing...');
                    },
                    function (receipt) {
                        console.log(receipt);
                        toastr.remove();
                        toastr["success"]('Transaction has been finished.', "Success");
                        $('#nftStakeButton').prop('disabled', false);
                        $('#nftStakeButton').html('Staking successful!');
                        setTimeout(function(){

                            $('#nftStakeButton').html('Stake!');

                        }, 5000);
                    },
                    function (err) {
                        toastr.remove();
                        let errMsg = 'An error occurred with your staking transaction.';
                        if(err == 'gas'){
                            errMsg = 'Staking amount exceeds limit or general gas error.';
                        }                  
                        toastr["error"](errMsg, "Error");
                        errorPopup("Error", errMsg, err.stack);
                        $('#nftStakeButton').prop('disabled', false);
                        $('#nftStakeButton').html('Stake!');
                    });
            }
        });

        /**
         * UNSTAKE ACTION
         */

        $('#nftUnstakeButton').off('click');
        $('#nftUnstakeButton').on('click', async function(){

            toastr.remove();

            let unstake_amount = $('#nftUnstakeAmount').val();

            let splitted = unstake_amount.split(".");
            if(splitted.length == 1 && decimals > 0){
                splitted[1] = '';
            }
            if(splitted.length > 1) {
                let size = decimals - splitted[1].length;
                for (let i = 0; i < size; i++) {
                    splitted[1] += "0";
                }
                unstake_amount = "" + (splitted[0] == 0 ? '' : splitted[0]) + splitted[1];
            }

            console.log("unstake amount",unstake_amount);

            await window.tncLib.farmUnstake(
                farmAddress,
                unstake_amount,
                function () {
                    toastr["info"]('Please wait for the transaction to finish.', "Unstaking....");
                },
                function (receipt) {
                    console.log(receipt);
                    toastr.remove();
                    toastr["success"]('Transaction has been finished.', "Success");
                    $('#nftUnstakeButton').html('Unstaking successful!');
                    setTimeout(function(){

                        $('#nftUnstakeButton').html('Unstake!');

                    }, 5000);
                },
                function (err) {
                    toastr.remove();
                    let errMsg = 'An error occurred with your unstaking transaction.';
                    if(err == 'gas'){
                        errMsg = 'Unstaking amount exceeds balance or general gas error.';
                    }
                    toastr["error"](errMsg, "Error");
                    errorPopup("Error", errMsg, err.stack);

                });
        });
    };

    this.observeChanges = async function(){

        let farm_address = _this.getUrlParam('farm');
        if(farm_address != null  && await tncLib.isFarm(farm_address)) {

            $('.redeemButton').each(async function () {

                let user_balance = await tncLib.farmPointsEarned(farm_address, tncLib.account);
                let stock = await tncLib.balanceof($(this).data('erc1155'), farm_address, $(this).data('tokenId'));

                if(stock > 0 && user_balance >= $(this).data('points')){
                    let button_text = 'Redeem';
                    $(this).html(button_text);
                }
                else if(stock > 0){
                    let button_text = parseFloat($(this).data('points').toFixed(8)) + ' Points'
                    $(this).html(button_text);
                } else  if(stock == 0){
                    $(this).html('Check at OpenSea');
                    $(this).on('click', function(){
                        location.href = 'https://opensea.io/assets/'+$(this).data('erc1155')+'/'+$(this).data('tokenId');
                    });
                }
                $('#farmStockInfo'+$(this).data('erc1155')+$(this).data('tokenId')).html(
                    stock
                );
                let farm_data = await window.tncLib.farmNftData(farm_address, $(this).data('erc1155'), $(this).data('tokenId'));
                $('#farmTotalSupplyInfo'+$(this).data('erc1155')+$(this).data('tokenId')).html(
                    farm_data.supply
                );
                let nft = await window.tncLib.getNft($(this).data('erc1155'), $(this).data('tokenId'));
                $('#farmOwnInfo'+$(this).data('erc1155')+$(this).data('tokenId')).html(
                    nft.balance
                );


            });

            let farmBalance = await tncLib.farmBalanceOfRaw(farm_address, tncLib.account);
            let maxStakesLeft = await tncLib.farmMaxStakeRaw(farm_address) - farmBalance;
            let decimals = await tncLib.farmTokenDecimals(farm_address);
            let farmToken = await tncLib.farmToken(farm_address);
            let balanceOfErc20 = await tncLib.balanceOfErc20Raw(farmToken, tncLib.account);

            if(balanceOfErc20 > maxStakesLeft){
                $('#farmStakeMax').text(_this.formatNumberString(""+maxStakesLeft, decimals) + " " + await tncLib.farmTokenSymbol(farm_address));
            }
            else if(balanceOfErc20 < maxStakesLeft && balanceOfErc20 > 0){
                $('#farmStakeMax').text(_this.formatNumberString(""+balanceOfErc20, decimals) + " " + await tncLib.farmTokenSymbol(farm_address));
            }
            else
            {
                $('#farmStakeMax').text(0 + " " + await tncLib.farmTokenSymbol(farm_address));
            }

            $('#farmStakeMaxButton').off('click');
            $('#farmStakeMaxButton').on('click', function(){

                if(balanceOfErc20 > maxStakesLeft){
                    $('#nftStakeAmount').val( _this.formatNumberString(""+maxStakesLeft, decimals) );
                }
                else if(balanceOfErc20 < maxStakesLeft && balanceOfErc20 > 0){
                    $('#nftStakeAmount').val( _this.formatNumberString(""+balanceOfErc20, decimals) );                }


            });

            if(farmBalance > 0){
                $('#farmUnstakeMax').text(_this.formatNumberString(""+farmBalance, decimals) + " " + await tncLib.farmTokenSymbol(farm_address));
            }
            else
            {
                $('#farmUnstakeMax').text(0 + " " + await tncLib.farmTokenSymbol(farm_address));
            }

            $('#farmUnstakeMaxButton').off('click');
            $('#farmUnstakeMaxButton').on('click', function(){

                $('#nftUnstakeAmount').val( _this.formatNumberString(""+farmBalance, decimals)  );
            });
        }

        setTimeout(function(){

            _this.observeChanges();

        }, 5000);

    };

    this.formatNumberString = function (string, decimals) {
        let pos = string.length - decimals;
        if(pos > 0){
            string = string.substring(0, pos) + "." + string.substring(pos, string.length);
        }
        return string
    };

    this.loadPage = async function (page){

        $('#stakingOptions').css('display', 'none');
        $('#farmPage').css('display', 'none');

        switch (page){

            default:

                let farm_address = _this.getUrlParam('farm');
                if(farm_address != null  && await tncLib.isFarm(farm_address)) {

                    $('#farmTokensStaked').html(Number(await tncLib.farmBalanceOf(farm_address, tncLib.account)).toFixed(8));

                    clearInterval(_this.tokenStakingInterval);
                    _this.tokenStakingInterval = setInterval(
                        async function(){
                            $('#farmTokensStaked').html(Number(await tncLib.farmBalanceOf(farm_address, tncLib.account)).toFixed(8));
                        }, 5000
                    );

                    $('#farmPointsEarned').html(Number(await tncLib.farmPointsEarned(farm_address, tncLib.account)).toFixed(9));

                    clearInterval(_this.earnedStakingInterval);
                    _this.earnedStakingInterval = setInterval(
                        async function(){
                            $('#farmPointsEarned').html(Number(await tncLib.farmPointsEarned(farm_address, tncLib.account)).toFixed(9));
                        }, 5000
                    );

                    $('#farmTokenSymbol').html(await tncLib.farmTokenSymbol(farm_address));
                    $('#stakingOptions').css('display', 'flex');
                    $('#farmPage').css('display', 'grid');
                    _this.populateFarm(farm_address);
                }

                break;
        }
    };

    this.getUrlParam = function(param_name) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        return urlParams.get(param_name);
    };

    this.startBlockCounter = function(){

        const _this2 = this;

        let startTime = new Date();

        setInterval(async function(){

            const currBlock = await tncLib.getBlock();

            if(parseInt(currBlock) !== parseInt(_this2.currentBlock)){
                const endTime = new Date();
                let timeDiff = endTime - startTime;
                timeDiff /= 1000;
                const seconds = Math.round(timeDiff);
                startTime = new Date(); // restart
            }

            const _endTime = new Date();
            let _timeDiff = _endTime - startTime;
            _timeDiff /= 1000;
            const _seconds = Math.round(_timeDiff);

            if(_seconds > 60 * 5){

                startTime = new Date(); // restart

                console.log("no change in 5 minutes, restarting web3");

                if (window.ethereum) {
                    window.web3 = new Web3(ethereum);
                    try {
                        // Request account access if needed
                        if(typeof ethereum.enable == 'function' && ethereum.enable){

                            await ethereum.enable();
                        }

                        let accounts = [];

                        if(ethereum && typeof ethereum.enable != 'undefined' && ethereum.enable){
                            accounts = await web3.eth.getAccounts();
                            console.log('account classic with ethereum');
                        }
                        else if(ethereum && ( typeof ethereum.enable == 'undefined' || !ethereum.enable ) ){
                            accounts = await window.ethereum.request({
                                method: 'eth_requestAccounts',
                            });
                            console.log('account new with ethereum');
                        }else{
                            accounts = await web3.eth.getAccounts();
                            console.log('account classic without ethereum');
                        }

                        tncLib.account = accounts[0];

                    } catch (error) {
                        console.log(error);
                        _alert('You rejected to use this dapp.');
                    }
                }
                // Legacy dapp browsers...
                else if (window.web3) {
                    if(typeof window.web3 == 'undefined' || !window.web3) {
                        window.web3 = new Web3(web3.currentProvider);
                    }
                }
            }

            _this.currentBlock = currBlock;

        }, 1000);
    };

    this.accountChangeAlert = function(){
        _alert('Account has been changed. Please <button class="btn btn-primary" onclick="location.reload()">click here</button> to reload this dapp.');
    };

    this.chainChangeAlert = function(){
        _alert('The network has been changed. Please <button class="btn btn-primary" onclick="location.reload()">click here</button> to reload this dapp.');
    };

    this.startAccountCheck = function(){

        if(window.ethereum){

            window.ethereum.on('accountsChanged', function(accounts){
                const _that = _this;
                if (accounts.length != _that.prevAccounts.length || accounts[0].toUpperCase() != _that.prevAccounts[0].toUpperCase()) {
                    _that.accountChangeAlert();
                    _that.prevAccounts = accounts;
                }
            });

        }else if(window.web3){

            setInterval( function() {
                web3.eth.getAccounts(function(err, accounts){
                    const _that = _this;
                    if (accounts.length != _that.prevAccounts.length || accounts[0].toUpperCase() != _that.prevAccounts[0].toUpperCase()) {
                        _that.accountChangeAlert();
                        _that.prevAccounts = accounts;
                    }
                });
            }, 1000);
        }
    };

    this.startChainCheck = function(){

        if(window.ethereum) {
            window.ethereum.on('chainChanged', async function (chain) {
                let actualChainId = chain.toString(16);
                console.log('chain check: ', actualChainId + " != " + _this.prevChainId);
                if (actualChainId != _this.prevChainId) {
                    _this.prevChainId = actualChainId;
                    _this.chainChangeAlert();
                }
            });

        }else if(window.web3){

            setInterval( async function() {

                if(await web3.eth.net.getId() != _this.prevChainId){
                    _this.prevChainId = await web3.eth.net.getId();
                    _this.chainChangeAlert();
                }

            }, 1000);
        }
    };

    $(document).ready(async function(){

        $('#myPoolsButton').on('click', function(){
            _this.loadPage('myPools');
        });

        await web3.eth.subscribe("newBlockHeaders", async (error, event) => {
            if (!error) {
                return;
            }
            console.log(error);
        });
    });
}

function run(connected) {

    $(document).ready(async function () {

        toastr.options = {
            "closeButton": true,
            "debug": false,
            "newestOnTop": true,
            "progressBar": false,
            "positionClass": "toast-bottom-right",
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "100",
            "hideDuration": "1000",
            "timeOut": "0",
            "extendedTimeOut": "0",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

        let accounts = [];

        if (typeof ethereum != 'undefined' && ethereum && typeof ethereum.enable != 'undefined' && ethereum.enable) {
            accounts = await web3.eth.getAccounts();
            console.log('account classic with ethereum');
        } else if (typeof ethereum != 'undefined' && ethereum && (typeof ethereum.enable == 'undefined' || !ethereum.enable)) {
            accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });
            console.log('account new with ethereum');
        } else {
            accounts = await web3.eth.getAccounts();
            console.log('account classic without ethereum');
        }

        window.tncLib = new TncLib();
        tncLib.account = accounts[0];

        if (typeof accounts == 'undefined' || accounts.length == 0) {

            tncLib.account = '0x0000000000000000000000000000000000000000';
        }

        let dapp = new TncDapp();
        window.tncDapp = dapp;
        dapp.prevAccounts = accounts;
        if (window.ethereum) {
            let chain = await web3.eth.getChainId()
            let actualChainId = chain.toString(16);
            dapp.prevChainId = actualChainId;
        } else if (window.web3) {
            dapp.prevChainId = await web3.eth.net.getId();
        }
        if(window.torus){
            $('#torusAddress').css('display', 'inline-block')
            $('#torusAddressPopover').data('content', tncLib.account);
            $('#torusAddressPopover').popover();
            $('#torusAddressPopover').on('click', function(){
                let input = document.createElement("textarea");
                input.value = tncLib.account;
                document.body.appendChild(input);
                input.select();
                document.execCommand("Copy");
                input.remove();
            })
        }
        dapp.startAccountCheck();
        dapp.startChainCheck();
        //dapp.startBlockCounter();
        dapp.loadPage(''); // default
        dapp.observeChanges();
    });
}
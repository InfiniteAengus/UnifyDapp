function TncDapp() {

    let _this = this;

    this.unstake = async function () {

        let handle = $('#tikTokLookupHandle').val().trim().toLowerCase();

        if(handle == ''){

            _alert('Please enter a TikTok to look up.');
            return;
        }

        if(handle.startsWith('@')){

            handle = handle.substring(1);
        }

        toastr.remove();
        $(this).html("Pending Transaction...");
        $(this).prop("disabled", "disabled");

        let _button = this;

        tncLibTikTok.unstake(
            handle,
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Unregistering...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $(_button).html("Withdraw");
                $(_button).prop("disabled", false);
                toastr["success"]("Transaction has been finished.", "Success");
                _alert("Your unregistered successfully. Remaining gas funds and staked $NIF (if staking was enabled) have been returned to your wallet.");
            },
            function (err) {
                toastr.remove();
                $(_button).prop("disabled", false);
                $(_button).html("Withdraw");
                let errMsg = "An error occurred with your unregistering transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );
                errorPopup("Error", errMsg, err.stack);

            }
        );
    };

    this.addGasFunds = async function(){

        let funds = $("#fundsAmount").val().trim();

        if (funds == "" || parseFloat(funds) <= 0) {
            _alert("Please enter a positive amount of funds");
            return;
        }

        let handle = $('#tikTokLookupHandle').val().trim().toLowerCase();

        if(handle == ''){

            _alert('Please enter a TikTok to look up.');
            return;
        }

        if(handle.startsWith('@')){

            handle = handle.substring(1);
        }

        toastr.remove();
        $(this).html("Pending Transaction...");
        $(this).prop("disabled", "disabled");

        let _button = this;

        tncLibTikTok.addGasFunds(
            handle,
            _this.resolveNumberString(funds, 18),
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Depositing...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $(_button).html("Deposit");
                $(_button).prop("disabled", false);
                toastr["success"]("Transaction has been finished.", "Success");
                $('#depositFundsModal').modal('hide');
                _alert("Your funds have been depositeed successfully.");
            },
            function (err) {
                toastr.remove();
                $(_button).prop("disabled", false);
                $(_button).html("Deposit");
                let errMsg = "An error occurred with your deposit transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );
                errorPopup("Error", errMsg, err.stack);
            }
        );
    };

    this.lookup = async function(){

        $('#tikTokLookup').css('display', 'none');
        $('#lookupTikTikAddGasFunds').css('display', 'none');
        $('#lookupTikTikUnregister').css('display', 'none');

        let handle = $('#tikTokLookupHandle').val().trim().toLowerCase();

        if(handle == ''){

            _alert('Please enter a TikTok to look up.');
            return;
        }

        if(handle.startsWith('@')){

            handle = handle.substring(1);
        }

        let isYou = false;
        let tt = await tncLibTikTok.tikTokers(handle);

        if(!tt.blocked){

            _alert('TikToker not found.');
            return;
        }

        if(tt.account.toLowerCase() == tncLib.account.toLowerCase()){

            isYou = true;

            $('#lookupTikTikAddGasFunds').css('display', 'inline-block');
            $('#lookupTikTikUnregister').css('display', 'inline-block');
        }

        $('#tikTokLookupCreatedBy').html(tt.account + (isYou ? ' (You)' : ''));
        $('#tikTokLookupGasFunds').html(_this.cleanUpDecimals(_this.formatNumberString(tt.gasFunds, 18)) + " " + getCurrency());
        $('#tikTokLookupStaking').html(_this.cleanUpDecimals(_this.formatNumberString(tt.nifStake, 18)) + " $NIF");
        $('#tikTokLookupAuthorized').html(await tncLibTikTok.authorized(handle) ? 'Yes' : 'No');
        $('#tikTokLookupNumber').html(await tncLibTikTok.tikTokerNumber(handle));

        $('#tikTokLookup').css('display', 'block');
    }

    this.register = async function(){

        let handle = $('#tikTokHandle').val().trim();
        let funds = $('#tikTokGasFunds').val().trim();

        if(handle == ''){

            _alert('Please enter your TikTok handle.');
            return;
        }

        if(funds == '' || !_this.isNumeric( funds )){

            _alert('Please enter your TikTok gas funds. Only numeric values are allowed.');
            return;
        }

        handle = handle.toLowerCase();

        if(handle.startsWith('@')){

            handle = handle.substring(1);
        }

        if(handle == ''){

            _alert('Please enter your TikTok handle. You mac include or omit the @-symbol.');
            return;
        }

        let tt = await tncLibTikTok.tikTokers(handle);

        if(tt.blocked){

            _alert('The given TikTok handle is already registered.');
            return;
        }

        funds = web3.utils.toBN(_this.resolveNumberString(funds, 18));
        let minFunds = web3.utils.toBN(await tncLibTikTok.minFunds());

        if( funds.lt( minFunds ) ){

            _alert('Min. gas fund is ' + _this.cleanUpDecimals(_this.formatNumberString(funds.toString(), 18)) + " " + getCurrency());
            return;
        }

        let balance = web3.utils.toBN(await web3.eth.getBalance(tncLib.account));

        if( balance.lt( funds ) ){

            _alert('Insufficient balance for gas funds. Min. gas fund is ' + _this.cleanUpDecimals(_this.formatNumberString(funds.toString(), 18)) + " " + getCurrency());
            return;
        }

        let zero = web3.utils.toBN("0");
        let minNif = web3.utils.toBN( await tncLibTikTok.minNif() );
        let nifBalance = web3.utils.toBN( await tncLib.balanceOfErc20Raw(tncLib.nif.options.address, tncLib.account) );

        if( nifBalance.lt( minNif ) ){

            _alert('Insufficient $NIF balance for staking. Min. required: ' + _this.cleanUpDecimals(_this.formatNumberString(minNif.toString(), 18)) + " $NIF. You can obtain $NIF on various crypto exchanges like Kucoin, Uniswap, Pancakeswap or Honeyswap.");
            return;
        }

        let allowance = web3.utils.toBN( await tncLib.allowanceErc20Raw(
            tncLib.nif.options.address,
            tncLib.account,
            tncLibTikTok.tiktok.options.address
        ) );

        if( minNif.gt(zero) && !await tncLibTikTok.iHaveAnyWildcard() && allowance.lt( minNif ) ){

            _alert('Please approve your $NIF first, then click the "Register" button again.');

            let _button = $('#registerTikTikAccount');

            $(_button).prop('disabled', true);
            $(_button).html('Approve first!');

            await window.tncLib.approveErc20(
                tncLib.nif.options.address,
                minNif.toString(),
                tncLibTikTok.tiktok.options.address,
                function () {
                    toastr["info"]('Please wait for the transaction to finish.', "Approve....");
                },
                function (receipt) {
                    console.log(receipt);
                    toastr.remove();
                    toastr["success"]('Transaction has been finished.', "Success");
                    $(_button).prop('disabled', false);
                    $(_button).html('Register');
                    $('#alertModal').modal('hide');
                },
                function (err) {
                    toastr.remove();
                    let errMsg = 'An error occurred with your approval transaction.';
                    toastr["error"](errMsg, "Error");
                    $('#alertModal').modal('hide');
                    errorPopup("Error", errMsg, err.stack);
                    $(_button).prop('disabled', false);
                    $(_button).html('Register');
                });
        }
        else
        {

            toastr.remove();

            let _button = $('#registerTikTikAccount');

            $(_button).html('Pending Transaction...');
            $(_button).prop('disabled', true);

            tncLibTikTok.stake(
                handle,
                funds.toString(),
                function (){
                    toastr["info"]('Please wait for the transaction to finish.', "Registering....");
                },
                async function(receipt){
                    console.log(receipt);
                    toastr.remove();
                    $(_button).html('Register');
                    $(_button).prop('disabled', false);
                    toastr["success"]('Transaction has been finished.', "Success");
                    _alert('You successfully registered!<br/><br/><strong>Important:</strong> to activate NFTs, please copy and paste the following text as-is into the description of your next TikTok:<br/><br/><h2>NFT Authorization Granted</h2><br/>Once you post a TikTok with this text, NFTs will be created for each of your subsequent TikToks and being sent to your current wallet address. Before you are running out of gas, please make sure to lookup your account and update your gas funds.');
                },
                function(err){
                    toastr.remove();
                    $(_button).prop('disabled', false);
                    $(_button).html('Register');
                    let errMsg = 'An error occurred with your registering transaction.';
                    toastr["error"](errMsg, "Error");
                    errorPopup("Error", errMsg, err.stack);
                }
            );
        }
    }

    $(document).ready(async function(){

        $('#lookupTikTikAccount').on('click', _this.lookup);
        $('#registerTikTikAccount').on('click', _this.register);
        $("#depositFundsButton").on("click", _this.addGasFunds);
        $('#lookupTikTikUnregister').on("click", _this.unstake);

        $('#lookupRecommended').html(_this.cleanUpDecimals(_this.formatNumberString(await tncLibTikTok.minFunds(), 18)) + ' ' + getCurrency() + " minimum recommended (approx. 1 NFT).");

        await web3.eth.subscribe("newBlockHeaders", async (error, event) => {
            if (!error) {
                return;
            }
            console.log(error);
        });
    });

    this.loadPage = async function (page){

        $('#tikTokCurrency').html(getCurrency());

        let minFunds = web3.utils.toBN(await tncLibTikTok.minFunds());
        let ten = web3.utils.toBN("10");
        let def = minFunds.mul(ten);
        def = _this.cleanUpDecimals(_this.formatNumberString(def.toString(), 18));

        $('#tikTokGasFunds').val(def);
    };

    this.isNumeric = function(str) {
        if (typeof str != "string") return false // we only process strings!
        return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
            !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
    }

    this.cleanUpDecimals = function (price) {
        price = _this.removingDecimals(price);

        let decimalPoints = 0;
        if (price.includes(".")) {
            decimalPoints = price.split(".")[1].length;
        }

        //So that we always have at least 2 zeroes after decimal point
        if (decimalPoints == 0){
            price = price + "00"
        }
        else if(decimalPoints == 1){
            price = price + "0";
        }

        return price
    };

    this.removingDecimals = function (string) {
        if(string == '0') return '0';
        while (true) {
            if (string.slice(-1) == 0) {
                string = string.substring(0, string.length - 1);
            } else {
                return string;
            }
        }
    };

    this.formatNumberString = function (string, decimals) {

        let pos = string.length - decimals;

        if(decimals == 0) {
            // nothing
        }else
        if(pos > 0){
            string = string.substring(0, pos) + "." + string.substring(pos, string.length);
        }else{
            string = '0.' + ( "0".repeat( decimals - string.length ) ) + string;
        }

        return string
    };

    this.resolveNumberString = function(number, decimals){

        let splitted = number.split(".");
        if(splitted.length == 1 && decimals > 0){
            splitted[1] = '';
        }
        if(splitted.length > 1) {
            let size = decimals - splitted[1].length;
            for (let i = 0; i < size; i++) {
                splitted[1] += "0";
            }
            number = "" + (splitted[0] == 0 ? '' : splitted[0]) + splitted[1];
            if(parseInt(number) == 0){
                number = "0";
            }
        }

        return number;
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
                    if (accounts.length != 0 && ( accounts.length != _that.prevAccounts.length || accounts[0].toUpperCase() != _that.prevAccounts[0].toUpperCase())) {
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
}

function run(connected) {

    $(document).ready(async function() {

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

        if(typeof ethereum != 'undefined' && ethereum && typeof ethereum.enable != 'undefined' && ethereum.enable){
            accounts = await web3.eth.getAccounts();
            console.log('account classic with ethereum');
        }
        else if(typeof ethereum != 'undefined' && ethereum && ( typeof ethereum.enable == 'undefined' || !ethereum.enable ) ){
            accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });
            console.log('account new with ethereum');
        }else{
            accounts = await web3.eth.getAccounts();
            console.log('account classic without ethereum');
        }

        window.tncLib = new TncLib();
        tncLib.account = accounts[0];

        window.tncLibTikTok = new TncLibTikTok();
        tncLibTikTok.account = tncLib.account;

        if(typeof accounts == 'undefined' || accounts.length == 0){

            tncLib.account = '0x0000000000000000000000000000000000000000';
            tncLibTikTok.account = '0x0000000000000000000000000000000000000000';
        }

        let dapp = new TncDapp();
        window.tncDapp = dapp;
        dapp.prevAccounts = accounts;
        if(window.ethereum){
            let chain = await web3.eth.getChainId();
            let actualChainId = chain.toString(16);
            dapp.prevChainId = actualChainId;
        }
        else if(window.web3){
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
    });
}
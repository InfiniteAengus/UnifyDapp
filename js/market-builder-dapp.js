function TncDapp() {

    const ipfs = window.IpfsHttpClient('ipfs.infura.io', '5001', { protocol: 'https' });
    const _this = this;
    this.marketTemplate = Handlebars.compile($('#market-template').html());
    this.nextButtonTemplate = Handlebars.compile($('#next-button').html());
    this.noMarketsTemplate = Handlebars.compile($('#no-markets').html());
    this.lastIndex = -1;
    this.currentBlock = 0;
    this.prevAccounts = [];
    this.prevChainId = '';

    this.populateMyMarkets = async function(){

        if(_this.lastIndex == -1) {
            $('#marketsPage').html('');
        }else{
            $('#loadMore').remove();
        }

        let length = await window.tncLibCustomMarket.getMyMarketsLength();

        console.log('Markets Length: ', length);

        let offset = _this.lastIndex > -1 ? _this.lastIndex : length;
        let currentIndex = offset;

        let explorer = 'https://etherscan.io/address/';
        switch(chain_id){
            case '4':
                explorer = 'https://rinkeby.etherscan.io/address/';
                break;
            case '61':
                explorer = 'https://testnet.bscscan.com/address/';
                break;
            case '38':
                explorer = 'https://bscscan.com/address/';
                break;
            case '4d':
                explorer = 'https://blockscout.com/poa/sokol/address/';
                break;
            case '507':
                explorer = 'https://moonbeam-explorer.netlify.app/address/';
                break;
            case 'a4ec':
                explorer = 'https://explorer.celo.org/address/';
                break;
            case 'a86a': // avalanche
                explorer = 'https://cchain.explorer.avax.network/address/';
                break;
            case '64':
                explorer = 'https://blockscout.com/poa/xdai/address/';
                break;
            case '89':
                explorer = 'https://explorer.matic.network/address/';
                break;
        }

        for(let i = offset - 3; i >= 0; i = i - 3){
            currentIndex = i;
            let market = await window.tncLibCustomMarket.getMyMarket(i);

            let _uri = market.uri.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/');

            try {

                let data = await $.getJSON(_uri);

                console.log(data);

                let noStakes = await tncLibCustomMarket.userNoStakes(tncLib.account, market.wrapperAddress);

                if (typeof data == 'object') {

                    let currentTier = await tncLibCustomMarket.getCurrentTier(tncLib.account, market.wrapperAddress);

                    let tmpl = _this.marketTemplate({
                        explorer : explorer,
                        currency: getCurrency(),
                        image: data.image.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/'),
                        name: data.name,
                        description: data.description,
                        url : window.location.origin + window.location.pathname.replace('market-builder.html', 'market-view.html') + "?location=" + market.wrapperAddress,
                        index: i,
                        index2: i*2,
                        address: market.wrapperAddress,
                        currentTier: currentTier,
                        hideTier: noStakes ? 'style="display:none;"' : '',
                        displayTier1Option: currentTier < 1 && !noStakes ? 'style="display:none;"' : '',
                        displayTier2Option: currentTier < 2 && !noStakes ? 'style="display:none;"' : '',
                        displayTier3Option: currentTier < 3 && !noStakes ? 'style="display:none;"' : '',
                        hideIfTier0: currentTier == 0 ? 'style="display:none;"' : '',
                        hideIfTierNot0: currentTier != 0 || noStakes ? 'style="display:none;"' : ''
                    });

                    $('#marketsPage').append(tmpl);

                    $('.btn-clipboard' + (i*2)).off('click');
                    $('.btn-clipboard' + (i*2)).on('click', function () {

                        $(this).tooltip('enable');
                        let _this2 = this;
                        setTimeout(function () {
                            $(_this2).tooltip('show');
                        }, 100);
                        setTimeout(function () {
                            $(_this2).tooltip('hide');
                        }, 3000);

                    });

                    $('.btn-clipboard' + i).off('click');
                    $('.btn-clipboard' + i).on('click', function () {

                        $(this).tooltip('enable');
                        let _this2 = this;
                        setTimeout(function () {
                            $(_this2).tooltip('show');
                        }, 100);
                        setTimeout(function () {
                            $(_this2).tooltip('hide');
                        }, 3000);

                    });

                    $('.btn-clipboard' + (i*2)).off('mouseover');
                    $('.btn-clipboard' + (i*2)).on('mouseover', function () {

                        $(this).tooltip('disable');

                    });

                    $('.btn-clipboard' + i).off('mouseover');
                    $('.btn-clipboard' + i).on('mouseover', function () {

                        $(this).tooltip('disable');

                    });

                    $(".popover-description").popover({
                        trigger: "manual",
                        html: true,
                        animation: false
                    }).on("mouseenter", function() {
                        var _this = this;
                        $(this).popover("show");
                        $(".popover").on("mouseleave", function() {
                            $(_this).popover('hide');
                        });
                    }).on("mouseleave", function() {
                        var _this = this;
                        setTimeout(function() {
                            if (!$(".popover:hover").length) {
                                $(_this).popover("hide");
                            }
                        }, 300);
                    });
                }

            }catch (e){

                console.log('Trouble resolving market uri: ', _uri);
            }

            let maxPerLoad = 9;
            let currInvertedIndex = (length - 1) - i;

            if( currInvertedIndex % maxPerLoad == maxPerLoad - 1 ){

                _this.lastIndex = i;

                break;
            }
        }

        if(currentIndex > 0){

            $('#loadMore').remove();
            $('#marketsPage').append(_this.nextButtonTemplate({}));
            $('#loadMoreButton').off('click');
            $('#loadMoreButton').on('click', function(){
                _this.populateMyMarkets();
            });
        }

        if( length == 0 ){

            $('#marketsPage').html(_this.noMarketsTemplate({}));
        }

    };

    this.newMarket = async function(){

        let name = $('#marketName').val().trim();
        let tier = parseInt($('#marketTier').val().trim());
        let description = $('#marketDescription').val().trim();
        let controller = $('#marketFeeAddress').val().trim();
        let marketFee = $('#marketFee').val().trim();
        let marketSwapFee = $('#marketSwapFee').val().trim();
        let image = $('#marketImageUrl').val().trim();
        let twitter = $('#marketTwitter').val().trim();
        let discord = $('#marketDiscord').val().trim();
        let telegram = $('#marketTelegram').val().trim();
        let medium = $('#marketMedium').val().trim();
        let instagram = $('#marketInstagram').val().trim();
        let youtube = $('#marketYoutube').val().trim();
        let web = $('#marketWeb').val().trim();
        let email = $('#marketEmail').val().trim();
        let phone = $('#marketPhone').val().trim();
        let link = $('#marketCustomLink').val().trim();
        let text = $('#marketCustomLinkText').val().trim();

        if(name == ''){ _alert('Please enter a farm name'); return; }
        if(controller == ''){ _alert('Please enter a controller address'); return; }
        if(!await web3.utils.isAddress(controller)){ _alert('Invalid fee address'); return; }
        if(isNaN(parseFloat(marketFee))){ _alert('Please enter a valid sales fee.'); return; }
        if(isNaN(parseFloat(marketSwapFee))){ _alert('Please enter a valid swap fee.'); return; }
        if(parseFloat(marketFee) < 0){ _alert('Please enter a valid sales fee.'); return; }
        if(parseFloat(marketSwapFee) < 0){ _alert('Please enter a valid swap fee.'); return; }
        if(parseFloat(marketFee) > 50){ _alert('Market fee is too high (max. 50%).'); return; }
        if(parseFloat(marketSwapFee) > 50){ _alert('Market swap fee is too high (max. 50%).'); return; }

        let marketInfo = {
            name : name,
            description : description,
            image : image,
            twitter : twitter,
            discord: discord,
            telegram: telegram,
            medium: medium,
            instagram: instagram,
            youtube : youtube,
            web : web,
            email : email,
            phone : phone,
            customLink : { name : text, value : link }
        };

        console.log(JSON.stringify(marketInfo));

        ipfs.add(buffer.Buffer(JSON.stringify(marketInfo)), async (err, result) => {

            console.log(err, result);

            let marketJsonUrl = "https://gateway.ipfs.io/ipfs/" + result[0].hash;

            _this.pin(result[0].hash);

            toastr.remove();

            marketFee = _this.resolveNumberString(""+(Number(marketFee).toFixed(2)), 2);
            marketSwapFee = _this.resolveNumberString(""+(Number(marketSwapFee).toFixed(2)), 2);

            let staking = await tncLibCustomMarket.getStakingAmounts();
            let stakingAmount = 0;

            console.log("Available staking amounts: ", staking);

            switch(tier){
                case 2:
                    stakingAmount = staking.tier2;
                    break;
                case 3:
                    stakingAmount = staking.tier3;
                    break;
                default:
                    stakingAmount = staking.tier1;
            }

            console.log("staking amount: ", stakingAmount.toString());

            let nif = web3.utils.toBN(stakingAmount.toString(), 18);

            let allowance = web3.utils.toBN( await tncLib.allowanceErc20Raw(
                tncLib.nif.options.address,
                tncLib.account,
                tncLibCustomMarket.genesis.options.address
            ) );

            let stakingEnabled = await tncLibCustomMarket.isStakingEnabled();

            if(stakingEnabled){

                let balance = web3.utils.toBN(await tncLib.balanceOfErc20Raw(tncLib.nif.options.address, tncLib.account));

                if( balance.lt(stakingAmount) ){

                    _alert('Not enough $NIF available for staking based on your tier level ('+(await web3.utils.fromWei(stakingAmount.toString()+""))+' $NIF required for Tier ' + tier + ')');
                    return;
                }
            }

            $('#marketSubmit').prop('disabled', true);
            $('#marketSubmit').html('Approve first!');

            if( stakingEnabled && allowance.lt(nif)  ){

                await window.tncLib.approveErc20(
                    tncLib.nif.options.address,
                    nif.toString(),
                    tncLibCustomMarket.genesis.options.address,
                    function () {
                        toastr["info"]('Please wait for the transaction to finish.', "Approve....");
                    },
                    function (receipt) {
                        console.log(receipt);
                        toastr.remove();
                        toastr["success"]('Transaction has been finished.', "Success");
                        $('#marketSubmit').prop('disabled', false);
                        $('#marketSubmit').html('Create Market');
                    },
                    function () {
                        toastr.remove();
                        toastr["error"]('An error occurred with your approval transaction.', "Error");
                        $('#marketSubmit').prop('disabled', false);
                        $('#marketSubmit').html('Create Market');
                    });

            } else {

                tncLibCustomMarket.newMarket(
                    controller,
                    marketFee,
                    marketSwapFee,
                    tier,
                    marketJsonUrl,
                    stakingEnabled,
                    function () {
                        toastr["info"]('Please wait for the transaction to finish.', "New Market....");
                    },
                    function (receipt) {
                        console.log(receipt);
                        toastr.remove();
                        toastr["success"]('Transaction has been finished.', "Success");

                        $('#marketSubmit').prop('disabled', false);
                        $('#marketSubmit').html('Create Market');

                        _this.lastIndex = -1;
                        _this.populateMyMarkets();

                        $('#marketModal').modal('hide');
                    },
                    function (err) {
                        toastr.remove();
                        let errMsg = 'An error occurred with your New Market transaction. Do you have sufficient funds?';
                        toastr["error"](errMsg, "Error");
                        $('#marketSubmit').prop('disabled', false);
                        $('#marketSubmit').html('Create Market');
                    }
                );
            }
        });
    };

    this.updateMarketInfo = async function(){

        let name = $('#marketInfoName').val().trim();
        let description = $('#marketInfoDescription').val().trim();
        let image = $('#marketInfoImageUrl').val().trim();
        let twitter = $('#marketInfoTwitter').val().trim();
        let discord = $('#marketInfoDiscord').val().trim();
        let telegram = $('#marketInfoTelegram').val().trim();
        let medium = $('#marketInfoMedium').val().trim();
        let instagram = $('#marketInfoInstagram').val().trim();
        let youtube = $('#marketInfoYoutube').val().trim();
        let web = $('#marketInfoWeb').val().trim();
        let email = $('#marketInfoEmail').val().trim();
        let phone = $('#marketInfoPhone').val().trim();
        let link = $('#marketInfoCustomLink').val().trim();
        let text = $('#marketInfoCustomLinkText').val().trim();

        if(name == ''){ _alert('Please enter a farm name'); return; }

        let farmInfo = {
            name : name,
            description : description,
            image : image,
            twitter : twitter,
            discord: discord,
            telegram: telegram,
            medium: medium,
            instagram: instagram,
            youtube : youtube,
            web : web,
            email : email,
            phone : phone,
            customLink : { name : text, value : link }
        };

        console.log(JSON.stringify(farmInfo));

        ipfs.add(buffer.Buffer(JSON.stringify(farmInfo)), async (err, result) => {

            console.log(err, result);

            let farmJsonUrl = "https://gateway.ipfs.io/ipfs/" + result[0].hash;

            _this.pin(result[0].hash);

            toastr.remove();

            tncLibCustomMarket.setMarketUri(
                $('#marketInfoMarketAddress').val(),
                farmJsonUrl,
                function () {
                    $('#marketInfoButton').prop('disabled', true);
                    $('#marketInfoButton').html('Processing...');
                    toastr["info"]('Please wait for the transaction to finish.', "Update Market Info....");
                },
                function (receipt) {
                    console.log(receipt);
                    toastr.remove();
                    $('#marketInfoButton').prop('disabled', false);
                    $('#marketInfoButton').html('Update');
                    toastr["success"]('Transaction has been finished.', "Success");
                    _this.lastIndex = -1;
                    _this.populateMyMarkets();
                    $('#marketInfoModal').modal('hide');
                },
                function (err) {
                    toastr.remove();
                    $('#marketInfoButton').prop('disabled', false);
                    $('#marketInfoButton').html('Update');
                    let errMsg = 'An error occurred with your Update Market Info transaction.';
                    toastr["error"](errMsg, "Error");
                }
            );
        });
    };

    this.populateEditInfo = async function(e){

        _this.clearMarketInfo();

        let wrapperAddress = $(e.relatedTarget).data('contractAddress');

        let _uri = await tncLibCustomMarket.getMarketUri(wrapperAddress);

        try {

            let data = await $.getJSON(_uri);
            if (typeof data == 'object') {

                $('#marketInfoMarketAddress').val(wrapperAddress);
                $('#marketInfoName').val(data.name);
                $('#marketInfoDescription').val(data.description);
                $('#marketInfoImageUrl').val(data.image);
                $('#marketInfoTwitter').val(data.twitter);
                $('#marketInfoDiscord').val(data.discord);
                $('#marketInfoTelegram').val(data.telegram);
                $('#marketInfoMedium').val(data.medium);
                $('#marketInfoInstagram').val(data.instagram);
                $('#marketInfoYoutube').val(data.youtube);
                $('#marketInfoWeb').val(data.web);
                $('#marketInfoEmail').val(data.email);
                $('#marketInfoPhone').val(data.phone);
                $('#marketInfoCustomLink').val(data.customLink.value);
                $('#marketInfoCustomLinkText').val(data.customLink.name);
                $('.imageFileDisplay').html('<img src=' + JSON.stringify(data.image) + ' border="0" width="200"/>');
            }

        }catch (e){

            console.log('Trouble resolving market uri: ', _uri);
        }
    };

    this.updateAllowDisallow = async function(){

        let type = $('#marketAllowDisallowType').val();
        let address = $('#marketAllowedDisallowedStatusAddress').val().trim();
        let wrapperAddress = $('#marketAllowDisallowWrapperAddress').val();
        let id = $('#marketAllowedDisallowedStatusId').val().trim();
        let status = $("input[name='marketAllowedDisallowedStatus']:checked").val();

        if(address == '' || !await web3.utils.isAddress(address)){ _alert('Please enter a valid address'); return; }

        let func;
        let funcType = 1;

        switch(type){
            case 'setAllowedWallets':
                func = tncLibCustomMarket.setAllowedWallets;
                break;
            case 'setAllowedNfts':
                if(isNaN(parseInt(id)) || parseInt(id) < 1){_alert("Please enter a valid NFT ID"); return;}
                func = tncLibCustomMarket.setAllowedNfts;
                funcType = 2;
                break;
            case 'setAllowedCollections':
                func = tncLibCustomMarket.setAllowedCollection;
                break;
            case 'setDisallowedWallets':
                func = tncLibCustomMarket.setWalletBlockStatus;
                break;
            case 'setDisallowedNfts':
                if(isNaN(parseInt(id)) || parseInt(id) < 1){_alert("Please enter a valid NFT ID"); return;}
                func = tncLibCustomMarket.setNftBlockStatus;
                funcType = 2;
                break;
            case 'setDisallowedCollections':
                func = tncLibCustomMarket.setCollectionBlockStatus;
                break;
        }

        toastr.remove();

        if(funcType == 1) {

            func(
                address,
                status == '1' ? true : false,
                wrapperAddress,
                function () {
                    $('#marketAllowedDisallowedButton').prop('disabled', true);
                    $('#marketAllowedDisallowedButton').html('Processing...');
                    toastr["info"]('Please wait for the transaction to finish.', "Saving....");
                },
                function (receipt) {
                    console.log(receipt);
                    toastr.remove();
                    $('#marketAllowedDisallowedButton').prop('disabled', false);
                    $('#marketAllowedDisallowedButton').html('Save');
                    toastr["success"]('Transaction has been finished.', "Success");
                    $('#marketAllowDisallowModal').modal('hide');
                },
                function (err) {
                    toastr.remove();
                    $('#marketAllowedDisallowedButton').prop('disabled', false);
                    $('#marketAllowedDisallowedButton').html('Save');
                    let errMsg = 'An error occurred with your transaction.';
                    toastr["error"](errMsg, "Error");
                }
            );

        }else{

            func(
                address,
                id,
                status == '1' ? true : false,
                wrapperAddress,
                function () {
                    $('#marketAllowedDisallowedButton').prop('disabled', true);
                    $('#marketAllowedDisallowedButton').html('Processing...');
                    toastr["info"]('Please wait for the transaction to finish.', "Saving....");
                },
                function (receipt) {
                    console.log(receipt);
                    toastr.remove();
                    $('#marketAllowedDisallowedButton').prop('disabled', false);
                    $('#marketAllowedDisallowedButton').html('Save');
                    toastr["success"]('Transaction has been finished.', "Success");
                    $('#marketAllowDisallowModal').modal('hide');
                },
                function (err) {
                    toastr.remove();
                    $('#marketAllowedDisallowedButton').prop('disabled', false);
                    $('#marketAllowedDisallowedButton').html('Save');
                    let errMsg = 'An error occurred with your transaction.';
                    toastr["error"](errMsg, "Error");
                }
            );
        }
    };

    this.populateAllowDisallow = async function(e){

        let wrapperAddress = $(e.relatedTarget).data('contractAddress');
        let type = $(e.relatedTarget).data('type');

        $('#marketAllowDisallowType').val(type);
        $('#marketAllowDisallowWrapperAddress').val(wrapperAddress);

        $('#marketAllowedDisallowedStatusIdGroup').css('display','none');

        switch(type){

            case 'setAllowedWallets':
                $('#marketAllowDisallowModalLabel').html('Whitelist Wallet');
                $('#marketAllowedDisallowedStatusAddressId').html('Wallet Address');
                break;
            case 'setAllowedNfts':
                $('#marketAllowDisallowModalLabel').html('Whitelist NFT');
                $('#marketAllowedDisallowedStatusAddressId').html('Collection Address');
                $('#marketAllowedDisallowedStatusIdId').html('NFT ID');
                $('#marketAllowedDisallowedStatusIdGroup').css('display','block');
                break;
            case 'setAllowedCollections':
                $('#marketAllowDisallowModalLabel').html('Whitelist Collection');
                $('#marketAllowedDisallowedStatusAddressId').html('Collection Address');
                break;
            case 'setDisallowedWallets':
                $('#marketAllowDisallowModalLabel').html('Blacklist Wallet');
                $('#marketAllowedDisallowedStatusAddressId').html('Wallet Address');
                break;
            case 'setDisallowedNfts':
                $('#marketAllowDisallowModalLabel').html('Blacklist NFT');
                $('#marketAllowedDisallowedStatusAddressId').html('Collection Address');
                $('#marketAllowedDisallowedStatusIdId').html('NFT ID');
                $('#marketAllowedDisallowedStatusIdGroup').css('display','block');
                break;
            case 'setDisallowedCollections':
                $('#marketAllowDisallowModalLabel').html('Blacklist Collection');
                $('#marketAllowedDisallowedStatusAddressId').html('Collection Address');
                break;
        }

        $('#marketAllowedDisallowedStatus0Label').html($('#marketAllowDisallowModalLabel').html());
    };

    this.updateUnstake = async function(){

        let wrapperAddress = $('#marketUnstakeWrapperAddress').val();

        toastr.remove();

        tncLibCustomMarket.unstake(
            wrapperAddress,
            function () {
                $('#marketUnstakeButton').prop('disabled', true);
                $('#marketUnstakeButton').html('Processing...');
                toastr["info"]('Please wait for the transaction to finish.', "Unstaking....");
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $('#marketUnstakeButton').prop('disabled', false);
                $('#marketUnstakeButton').html('Unstake');
                toastr["success"]('Transaction has been finished.', "Success");
                _this.lastIndex = -1;
                _this.populateMyMarkets();
                $('#marketUnstakeModal').modal('hide');
            },
            function (err) {
                toastr.remove();
                $('#marketUnstakeButton').prop('disabled', false);
                $('#marketUnstakeButton').html('Unstake');
                let errMsg = 'An error occurred with your unstaking transaction.';
                toastr["error"](errMsg, "Error");
            }
        );
    };

    this.populateUnstake = async function(e){

        let wrapperAddress = $(e.relatedTarget).data('contractAddress');
        $('#marketUnstakeWrapperAddress').val(wrapperAddress);
        $('#marketCurrentTier').html(await tncLibCustomMarket.getCurrentTier(tncLib.account,wrapperAddress));
    };

    this.updateStake = async function(){

        let wrapperAddress = $('#marketStakeWrapperAddress').val();
        let tier = parseInt($('#marketStakeTier').val().trim());

        let staking = await tncLibCustomMarket.getStakingAmounts();
        let stakingAmount = 0;

        console.log("Available staking amounts: ", staking);

        switch(tier){
            case 2:
                stakingAmount = staking.tier2;
                break;
            case 3:
                stakingAmount = staking.tier3;
                break;
            default:
                stakingAmount = staking.tier1;
        }

        console.log("staking amount: ", stakingAmount.toString());

        let nif = web3.utils.toBN(stakingAmount.toString(), 18);

        let allowance = web3.utils.toBN( await tncLib.allowanceErc20Raw(
            tncLib.nif.options.address,
            tncLib.account,
            tncLibCustomMarket.genesis.options.address
        ) );

        let balance = web3.utils.toBN(await tncLib.balanceOfErc20Raw(tncLib.nif.options.address, tncLib.account));

        if( balance.lt(stakingAmount) ){

            _alert('Not enough $NIF available for staking based on your tier level ('+(await web3.utils.fromWei(stakingAmount.toString()+""))+' $NIF required for Tier ' + tier + ')');
            return;
        }

        if( allowance.lt(nif)  ){

            $('#marketStakeButton').prop('disabled', true);
            $('#marketStakeButton').html('Approve $NIF first!');

            await window.tncLib.approveErc20(
                tncLib.nif.options.address,
                nif.toString(),
                tncLibCustomMarket.genesis.options.address,
                function () {
                    toastr["info"]('Please wait for the transaction to finish.', "Approve....");
                },
                function (receipt) {
                    console.log(receipt);
                    toastr.remove();
                    toastr["success"]('Transaction has been finished.', "Success");
                    $('#marketStakeButton').prop('disabled', false);
                    $('#marketStakeButton').html('Stake');
                },
                function () {
                    toastr.remove();
                    toastr["error"]('An error occurred with your approval transaction.', "Error");
                    $('#marketStakeButton').prop('disabled', false);
                    $('#marketStakeButton').html('Stake');
                });

        } else {

            tncLibCustomMarket.stake(
                tier,
                wrapperAddress,
                function () {
                    toastr["info"]('Please wait for the transaction to finish.', "Staking....");
                },
                function (receipt) {
                    console.log(receipt);
                    toastr.remove();
                    toastr["success"]('Transaction has been finished.', "Success");

                    _this.lastIndex = -1;
                    _this.populateMyMarkets();

                    $('#marketStakeModal').modal('hide');
                },
                function (err) {
                    toastr.remove();
                    let errMsg = 'An error occurred with your staking transaction. Do you have sufficient funds?';
                    toastr["error"](errMsg, "Error");
                }
            );
        }
    };

    this.populateStake = async function(e){

        let wrapperAddress = $(e.relatedTarget).data('contractAddress');
        $('#marketStakeWrapperAddress').val(wrapperAddress);
    };

    this.populateTokenLookup = async function(e){

        let wrapperAddress = $(e.relatedTarget).data('contractAddress');
        $('#lookupWrapperAddress').val(wrapperAddress);

        let addresses = await tncLibCustomMarket.getMarketContractAddresses(wrapperAddress);

        $("#lookupToken").html('');

        switch(chain_id){
            case '64': // xDai
                var o = new Option("HNY", "0x71850b7E9Ee3f13Ab46d67167341E4bDc905Eef9");
                $(o).html("HNY");
                $("#lookupToken").append(o);

                var o2 = new Option("NIF (Unifty)", "0x1A186E7268F3Ed5AdFEa6B9e0655f70059941E11");
                $(o2).html("NIF (Unifty)");
                $("#lookupToken").append(o2);

                var o3 = new Option("COLD", "0xdbcade285846131a5e7384685eaddbdfd9625557");
                $(o3).html("COLD");
                $("#lookupToken").append(o3);

                var o4 = new Option("wxDai (Wrapped xDai)", "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d");
                $(o4).html("wxDai (Wrapped xDai)");
                $("#lookupToken").append(o4);

                var o6 = new Option("WETH (Wrapped Ether)", "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1");
                $(o6).html("WETH (Wrapped Ether)");
                $("#lookupToken").append(o6);

                var o5 = new Option("AGVE (Agave Token)", "0x3a97704a1b25f08aa230ae53b352e2e72ef52843");
                $(o5).html("AGVE (Agave Token)");
                $("#lookupToken").append(o5);

                var o6 = new Option("USDC", "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83");
                $(o6).html("USDC");
                $("#lookupToken").append(o6);
                break;
            case '4d': // xDai (SPOA) Testnet
                var o = new Option("NIF (Unifty)", "0x93fEB07f2823600DD3b9EFFd9356de10C387d9d7");
                $(o).html("NIF (Unifty)");
                $("#lookupToken").append(o);
                console.log($("#lookupToken").html());
                break;
            case '507': // xDai (SPOA) Testnet
                var o = new Option("NIF (Unifty)", "0x93fEB07f2823600DD3b9EFFd9356de10C387d9d7");
                $(o).html("NIF (Unifty)");
                $("#lookupToken").append(o);
                console.log($("#lookupToken").html());
                break;
            case 'a4ec': // CELO

                var o = new Option("CELO (token)", "0x471ece3750da237f93b8e339c536989b8978a438");
                $(o).html("CELO (token)");
                $("#lookupToken").append(o);
                console.log($("#lookupToken").html());

                var o2 = new Option("CUSD", "0x765DE816845861e75A25fCA122bb6898B8B1282a");
                $(o2).html("CUSD");
                $("#lookupToken").append(o2);
                console.log($("#lookupToken").html());

                break;
            case 'a86a': // AVALANCHE

                var o = new Option("WAVAX (Wrapped AVAX)", "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7");
                $(o).html("WAVAX (Wrapped AVAX)");
                $("#lookupToken").append(o);
                console.log($("#lookupToken").html());

                break;
            case 'a86a': // CELO

                var o = new Option("WAVAX (Wrapped AVAX)", "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7");
                $(o).html("WAVAX (Wrapped AVAX)");
                $("#lookupToken").append(o);
                console.log($("#lookupToken").html());

                break;
            case '38': // BSC MAINNET
                var o2 = new Option("bNIF (Unifty)", "0x3aD4eC50f30dAb25C60e0e71755AF6B9690B1297");
                $(o2).html("bNIF (Unifty)");
                $("#lookupToken").append(o2);

                var o = new Option("WBNB (Wrapped BNB)", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");
                $(o).html("WBNB (Wrapped BNB)");
                $("#lookupToken").append(o);

                var o3 = new Option("CAKE", "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82");
                $(o3).html("CAKE");
                $("#lookupToken").append(o3);

                var o4 = new Option("BUSD", "0xe9e7cea3dedca5984780bafc599bd69add087d56");
                $(o4).html("BUSD");
                $("#lookupToken").append(o4);

                var o5 = new Option("ETH", "0x2170ed0880ac9a755fd29b2688956bd959f933f8");
                $(o5).html("ETH");
                $("#lookupToken").append(o5);

                var o6 = new Option("TETHER", "0x55d398326f99059ff775485246999027b3197955");
                $(o6).html("TETHER");
                $("#lookupToken").append(o6);

                var o7 = new Option("BDT (Block Duelers)", "0x286a61a9b193f1b92d3a0fab4fd16028786273f3");
                $(o7).html("BDT (Block Duelers)");
                $("#lookupToken").append(o7);

                var o8 = new Option("DC (Duelers Credits)", "0x7990ad6dbe9bce17ed91e72b30899b77a415f6cc");
                $(o8).html("DC (Duelers Credits)");
                $("#lookupToken").append(o8);
                break;
            case '89': // Matic Mainnet
                var o = new Option("wMatic (Wrapped Matic)", "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270");
                $(o).html("Matic (Wrapped)");
                $("#lookupToken").append(o);

                break;
            case '61': // BSC TESTNET
                var o = new Option("NIF (Unifty)", "0xaC636E43b2a3e8654c993c4c5A72a2cDc41Db0FF");
                $(o).html("NIF (Unifty)");
                $("#lookupToken").append(o);
                break;
            case '4': // ETHEREUM TESTNET
                var o = new Option("NIF (Unifty)", "0xb93370d549a4351fa52b3f99eb5c252506e5a21e");
                $(o).html("NIF (Unifty)");
                $("#lookupToken").append(o);
                break;
            default: // ETHEREUM MAINNET
                var o = new Option("NIF (Unifty)", "0x7e291890B01E5181f7ecC98D79ffBe12Ad23df9e");
                $(o).html("NIF (Unifty)");
                $("#lookupToken").append(o);
                var o2 = new Option("WETH (Wrapped Ether)", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
                $(o2).html("WETH (Wrapped Ether)");
                $("#lookupToken").append(o2);
        }

        var o = new Option("Custom...", "custom");
        $(o).html("Custom...");
        $("#lookupToken").append(o);

        let currToken = $('#lookupToken').val();

        $('#lookupToken').off('change');
        $('#lookupToken').on('change', function(){
            $('#withdrawFundsButton').css('display', 'none');
            $('#lookupInfo').text('');
            if($(this).val() == 'custom'){
                currToken = $('#lookupTokenAddress').val().trim();
                $('#lookupTokenWrapper').css('display', 'block');
            }else{
                currToken = $('#lookupToken').val();
                $('#lookupTokenWrapper').css('display', 'none');
            }
        });

        $('#lookupTokenAddress').off('change');
        $('#lookupTokenAddress').on('change', function(){
            currToken = $('#lookupTokenAddress').val().trim();
        });

        $('#lookupButton').off('click');
        $('#lookupButton').on('click', async function(){

            if(await web3.utils.isAddress(currToken)){
                try {
                    let funds = await tncLibCustomMarket.getFees(currToken, addresses.market);
                    let symbol = await tncLib.tokenSymbolErc20(currToken);
                    $('#lookupInfo').text('Funds: ' + (
                        _this.formatNumberString(
                            ""+funds,
                            await tncLib.tokenDecimalsErc20(currToken)
                        )
                    ) + " " + symbol);
                    let testFunds = web3.utils.toBN(funds);
                    let testZero = web3.utils.toBN("0");
                    if(testFunds.gt(testZero)) {
                        $('#withdrawFundsButton').css('display', 'inline-block');
                    }else{
                        $('#withdrawFundsButton').css('display', 'none');
                    }
                }catch (e){
                    $('#lookupInfo').text('No valid token!');
                }
            }
            else{
                $('#lookupInfo').text('Invalid token address!');
            }
        });

        $('#withdrawFundsButton').off('click');
        $('#withdrawFundsButton').on('click', async function(){

            toastr.remove();
            $(this).html('Pending Transaction...');
            $(this).prop('disabled', 'disabled');

            let _button = this;

            tncLibCustomMarket.withdrawFee(
                currToken,
                addresses.market,
                function (){
                    toastr["info"]('Please wait for the transaction to finish.', "Withdrawing....");
                },
                function(receipt){
                    console.log(receipt);
                    toastr.remove();
                    $(_button).html('Withdraw');
                    $(_button).prop('disabled', false);
                    toastr["success"]('Transaction has been finished.', "Success");
                    $('#withdrawFundsModal').modal('hide');
                    $('#withdrawFundsButton').css('display', 'none');
                    $('#lookupInfo').text('');
                    _alert('Withdraw successful!');
                },
                function(){
                    toastr.remove();
                    $(_button).prop('disabled', false);
                    $(_button).html('Withdraw');
                    toastr["error"]('An error occurred with your withdrawal transaction.', "Error");
                }
            );
        });
    }

    this.populateSwapFunds = async function(e){

        let wrapperAddress = $(e.relatedTarget).data('contractAddress');
        $('#swapFeesWrapperAddress').val(wrapperAddress);
        let addresses = await tncLibCustomMarket.getMarketContractAddresses(wrapperAddress);
        let fees = await tncLibCustomMarket.getSwapFees(tncLib.nif.options.address, addresses.swap);

        let testFunds = web3.utils.toBN(fees);
        let testZero = web3.utils.toBN("0");

        if(testFunds.gt(testZero)) {
            $('#withdrawSwapFundsButton').css('display', 'inline-block');
        }else{
            $('#withdrawSwapFundsButton').css('display', 'none');
        }

        $('#withdrawSwapFundsNif').html(
            _this.formatNumberString(
            ""+fees,
            18)
        );

        $('#withdrawSwapFundsButton').off('click');
        $('#withdrawSwapFundsButton').on('click', async function(){

            toastr.remove();
            $(this).html('Pending Transaction...');
            $(this).prop('disabled', 'disabled');

            let _button = this;

            tncLibCustomMarket.withdrawSwapFunds(
                tncLib.nif.options.address,
                addresses.swap,
                function (){
                    toastr["info"]('Please wait for the transaction to finish.', "Withdrawing....");
                },
                function(receipt){
                    console.log(receipt);
                    toastr.remove();
                    $(_button).html('Withdraw');
                    $(_button).prop('disabled', false);
                    toastr["success"]('Transaction has been finished.', "Success");
                    $('#withdrawSwapFundsModal').modal('hide');
                    $('#withdrawSwapFundsButton').css('display', 'none');
                    $('#lookupInfo').text('');
                    _alert('Withdraw successful!');
                },
                function(){
                    toastr.remove();
                    $(_button).prop('disabled', false);
                    $(_button).html('Withdraw');
                    toastr["error"]('An error occurred with your withdrawal transaction.', "Error");
                }
            );
        });
    };

    this.populateSetupSwapFundsModal = async function(e){

        let wrapperAddress = $(e.relatedTarget).data('contractAddress');
        $('#marketSetupSwapFeeAddress').val(await tncLibCustomMarket.getSetupSwapFeeAddress(wrapperAddress));
        $('#marketSetupSwapFee').val(_this.formatNumberString(await tncLibCustomMarket.getSetupSwapFees(wrapperAddress), 2));
        $('#setupSwapFeesWrapperAddress').val(wrapperAddress);
    };

    this.performSetupSwapFunds = async function(){

        let controller = $('#marketSetupSwapFeeAddress').val().trim();
        let marketFee = $('#marketSetupSwapFee').val().trim();

        if(parseFloat(marketFee) < 0){ _alert('Please enter a valid sales fee.'); return; }
        if(parseFloat(marketFee) > 50){ _alert('Sales fee is too high (max. 50%).'); return; }
        if(controller == ''){ _alert('Please enter a valid fee address'); return; }
        if(!await web3.utils.isAddress(controller)){ _alert('Invalid fee address'); return; }

        marketFee = _this.resolveNumberString(""+(Number(marketFee).toFixed(2)), 2);

        tncLibCustomMarket.swapSetup(
            marketFee,
            controller,
            $('#setupSwapFeesWrapperAddress').val(),
            function () {
                toastr["info"]('Please wait for the transaction to finish.', "Swap Fee Setup....");
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                toastr["success"]('Transaction has been finished.', "Success");

                $('#setupFundsModal').modal('hide');
            },
            function (err) {
                toastr.remove();
                let errMsg = 'An error occurred with your swap setup transaction. Do you have sufficient funds?';
                toastr["error"](errMsg, "Error");
            }
        );
    };

    this.populateSetupFundsModal = async function(e){

        let wrapperAddress = $(e.relatedTarget).data('contractAddress');
        $('#marketSetupFeeAddress').val(await tncLibCustomMarket.getSetupFeeAddress(wrapperAddress));
        $('#marketSetupFee').val(_this.formatNumberString(await tncLibCustomMarket.getSetupFees(wrapperAddress), 2));
        $('#setupFeesWrapperAddress').val(wrapperAddress);
    };

    this.performSetupFunds = async function(){

        let controller = $('#marketSetupFeeAddress').val().trim();
        let marketFee = $('#marketSetupFee').val().trim();

        if(parseFloat(marketFee) < 0){ _alert('Please enter a valid sales fee.'); return; }
        if(parseFloat(marketFee) > 50){ _alert('Sales fee is too high (max. 50%).'); return; }
        if(controller == ''){ _alert('Please enter a valid fee address'); return; }
        if(!await web3.utils.isAddress(controller)){ _alert('Invalid fee address'); return; }

        marketFee = _this.resolveNumberString(""+(Number(marketFee).toFixed(2)), 2);

        tncLibCustomMarket.setup(
            marketFee,
            controller,
            $('#setupFeesWrapperAddress').val(),
            function () {
                toastr["info"]('Please wait for the transaction to finish.', "Fee Setup....");
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                toastr["success"]('Transaction has been finished.', "Success");

                $('#setupFundsModal').modal('hide');
            },
            function (err) {
                toastr.remove();
                let errMsg = 'An error occurred with your fee setup transaction. Do you have sufficient funds?';
                toastr["error"](errMsg, "Error");
            }
        );
    };

    this.clearMarketInfo = function(){
        $('#marketInfoMarketAddress').val();
        $("#marketInfoForm")[0].reset();
        $('#marketInfoButton').html('Update');
        $('#marketInfoImageUrl').val('');

        $('.imageFileDisplay').html('');
        $('.submitNewUpdate').prop('disabled', false);
        $('#marketInfoButton').prop('disabled', false);
    };

    document.getElementById('marketImageFile').onchange = function () {

        _this.storeIpfsImage( document.getElementById('marketImageFile'), document.getElementById('marketImageUrl') );
    };

    document.getElementById('marketInfoImageFile').onchange = function () {

        _this.storeIpfsImage( document.getElementById('marketInfoImageFile'), document.getElementById('marketInfoImageUrl') );
    };

    this.storeIpfsImage = function(fileElement, urlStorageElement){

        $('.submitNewUpdate').prop('disabled', true);
        let tmp = $('.submitNewUpdate').html();
        $('.submitNewUpdate').html('Uploading Image...');

        let reader = new FileReader();
        reader.onloadend = function () {

            const buf = buffer.Buffer(reader.result);

            ipfs.add(buf, (err, result) => {

                console.log(err, result);

                let ipfsLink = "https://gateway.ipfs.io/ipfs/" + result[0].hash;
                $(urlStorageElement).val(ipfsLink);
                $('.imageFileDisplay').html('<img src=' + JSON.stringify(ipfsLink) + ' border="0" width="200"/>');
                $('.submitNewUpdate').prop('disabled', false);
                $('.submitNewUpdate').html(tmp);

                _this.pin(result[0].hash);
            });
        };

        if (fileElement.files[0]) {
            reader.readAsArrayBuffer(fileElement.files[0]);
        }
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

    this.pin = function(ipfsToken){

        $.getScript("https://ipfs2arweave.com/permapin/" + ipfsToken)
            .done(function( script, textStatus ) {
                console.log( "PINNED!" );
                console.log( textStatus );
            })
            .fail(function( jqxhr, settings, exception ) {
                console.log( jqxhr, settings, exception );
            });
    }

    $(document).ready(async function(){

        $('#marketFeeAddress').val(tncLib.account);

        if(!await tncLibCustomMarket.isStakingEnabled()){

            $('#feeMarket').css('display','block');
            $('#tierGroup').css('display','none');

            let fee = await web3.utils.fromWei(await tncLibCustomMarket.feeEth()+"");
            $('#ethFee').html(fee);

            let minNif = await web3.utils.fromWei(await tncLibCustomMarket.getMinimumNif()+"");
            if(minNif > 0){
                $('#nifMinMarket').html(minNif);
                $('#paymentDescription').css('display','block');
            }
        }
        else
        {
            $('#stakeMarket').css('display','block');
            let amounts = await tncLibCustomMarket.getStakingAmounts();
            let tier1 = await web3.utils.fromWei(amounts.tier1.toString()+"");
            let tier2 = await web3.utils.fromWei(amounts.tier2.toString()+"");
            let tier3 = await web3.utils.fromWei(amounts.tier3.toString()+"");
            $('#tier1Nif').html(tier1);
            $('#tier2Nif').html(tier2);
            $('#tier3Nif').html(tier3);
        }

        $('#marketSubmit').on('click', async function(){

            await _this.newMarket();

        });

        $('#marketInfoButton').on('click', _this.updateMarketInfo);
        $('#marketAllowedDisallowedButton').on('click', _this.updateAllowDisallow);
        $('#marketUnstakeButton').on('click', _this.updateUnstake);
        $('#marketStakeButton').on('click', _this.updateStake);
        $('#marketSetupFeeButton').on('click', _this.performSetupFunds);
        $('#marketSetupSwapFeeButton').on('click', _this.performSetupSwapFunds);


        await web3.eth.subscribe("newBlockHeaders", async (error, event) => {
            if (!error) {
                return;
            }
            console.log(error);
        });
    });

    this.loadPage = async function (page){

        $('#marketsPage').css('display', 'none');

        switch (page){

            default:

                _this.clearMarketInfo();

                $('.currency').html(getCurrency());

                _this.lastIndex = -1;

                $('#marketInfoModal').off('show.bs.modal');
                $('#marketInfoModal').on('show.bs.modal', _this.populateEditInfo);

                $('#marketAllowDisallowModal').off('show.bs.modal');
                $('#marketAllowDisallowModal').on('show.bs.modal', _this.populateAllowDisallow);

                $('#marketUnstakeModal').off('show.bs.modal');
                $('#marketUnstakeModal').on('show.bs.modal', _this.populateUnstake);

                $('#marketStakeModal').off('show.bs.modal');
                $('#marketStakeModal').on('show.bs.modal', _this.populateStake);

                $('#withdrawFundsModal').off('show.bs.modal');
                $('#withdrawFundsModal').on('show.bs.modal', _this.populateTokenLookup);

                $('#withdrawSwapFundsModal').off('show.bs.modal');
                $('#withdrawSwapFundsModal').on('show.bs.modal', _this.populateSwapFunds);

                $('#setupFundsModal').off('show.bs.modal');
                $('#setupFundsModal').on('show.bs.modal', _this.populateSetupFundsModal);

                $('#setupSwapFundsModal').off('show.bs.modal');
                $('#setupSwapFundsModal').on('show.bs.modal', _this.populateSetupSwapFundsModal);

                $('#marketsPage').css('display', 'grid');
                await _this.populateMyMarkets();

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
                    if(typeof  window.web3 == 'undefined' || !window.web3) {
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

        window.tncLibCustomMarket = new TncLibCustomMarket();
        tncLibCustomMarket.account = accounts[0];

        if(typeof accounts == 'undefined' || accounts.length == 0){

            tncLib.account = '0x0000000000000000000000000000000000000000';
            tncLibCustomMarket.account = '0x0000000000000000000000000000000000000000';
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
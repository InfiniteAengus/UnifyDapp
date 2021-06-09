function TncDapp() {

    //const ipfs = window.IpfsHttpClient('ipfs.infura.io', '5001', { protocol: 'https' });
    const _this = this;
    this.farmHeaderTemplate = Handlebars.compile($('#farm-header-template').html());
    this.farmTemplate = Handlebars.compile($('#farm-template').html());
    this.nextButtonTemplate = Handlebars.compile($('#next-button').html());
    this.lastNftIndex = -1;
    this.currentBlock = 0;
    this.prevAccounts = [];
    this.prevChainId = '';
    this.tokenStakingInterval = null;
    this.earnedStakingInterval = null;

    this.populateFarm = async function(farmAddress){

        let isAdmin = await tncLib.farmIsWhitelistAdmin(tncLib.account, farmAddress);

        if( isAdmin ) {
            $('#farmAddNftsButton').css('display', 'flex');
        }

        let hasShop = await tncLib.farmHasShop(farmAddress);
        let runMode = 0;
        let addonAddress = '';
        if(hasShop){
            addonAddress = await tncLib.farmAddonAddress(farmAddress);
            runMode = await tncLib.farmShopRunMode(addonAddress);
        }

        let farmBalance = web3.utils.toBN("0");
        let _null = web3.utils.toBN("0");
        if(runMode == 2){
            $('#farmStakeButton').css('display','none');
            farmBalance = web3.utils.toBN( await tncLib.farmBalanceOfRaw(farmAddress, tncLib.account) );
            if(farmBalance.eq(_null)){
                $('#farmUnstakeButton').css('display','none');
                if(!isAdmin && 0 == await tncLib.farmPendingWithdrawals(tncLib.account, farmAddress)){
                    $('#stakingOptions').css('display','none');
                }else{
                    $('#stakingOptions').css('display','flex');
                }
            }else{
                $('#stakingOptions').css('display','flex');
            }
        }else{
            $('#stakingOptions').css('display','flex');
        }

        let decimals = await tncLib.farmTokenDecimals(farmAddress);

        if(_this.lastNftIndex == -1) {
            $('#farmHeader').html('');
            $('#farmPage').html('');
        }else{
            $('#loadMore').remove();
        }

        /**
         * STAKE ACTION
         */

        $('#nftStakeButton').off('click');
        $('#nftStakeButton').on('click', async function(){

            toastr.remove();

            let stake_amount = $('#nftStakeAmount').val();

            stake_amount = _this.resolveNumberString(stake_amount, decimals);

            let maxStakes = await tncLib.farmMaxStakeRaw(farmAddress);
            let minStakes = await tncLib.farmMinStakeRaw(farmAddress);
            let balance = await tncLib.farmBalanceOfRaw(farmAddress, tncLib.account);

            console.log(stake_amount);

            let added = parseInt(balance) + parseInt(stake_amount);

            if( added == 0 || added < minStakes || added > maxStakes ){
                let symbol = await tncLib.farmTokenSymbol(farmAddress);
                let maxStakesLeft = web3.utils.toBN( await tncLib.farmMaxStakeRaw(farmAddress) ).sub( web3.utils.toBN( balance ) );
                _alert("Please stake with the proper amounts.<br />Left for staking: " + _this.formatNumberString(maxStakesLeft.toString(), decimals) + " " + symbol + "<br /> " + ( minStakes == 0 ? '' : "Minimum Stake: " + ( _this.formatNumberString( minStakes, decimals ) ) + " " + symbol + "<br />" ) + "Maximum Stake: " + ( _this.formatNumberString( maxStakes, decimals ) ) + " " + symbol );
                return;
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
                    function () {
                        toastr.remove();
                        toastr["error"]('An error occurred with your approval transaction.', "Error");
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

            unstake_amount = _this.resolveNumberString(unstake_amount, decimals);

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
                });
        });

        if(_this.lastNftIndex == -1) {

            let farm_name = 'Farm';
            let farm_description = '';
            let farm_image = '';
            let custom_link_value = '';
            let custom_link_name = '';
            let farm_twitter = '';
            let farm_discord = '';
            let farm_instagram = '';
            let farm_youtube = '';
            let farm_web = '';
            let farm_email = '';
            let farm_phone = '';
            let farm_telegram = '';
            let farm_medium = '';

            try {

                let data = await $.getJSON(await tncLib.farmJsonUrl(farmAddress));

                console.log(data);

                if (typeof data == 'object') {

                    farm_name = typeof data.name != 'undefined' && data.name ? data.name : '';
                    farm_description = typeof data.description != 'undefined' && data.description ? data.description : '';
                    farm_image = typeof data.image != 'undefined' && data.image ? data.image.replace('ipfs://', 'https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/') : '';
                    farm_twitter = typeof data.twitter != 'undefined' && data.twitter ? data.twitter : '';
                    farm_discord = typeof data.discord != 'undefined' && data.discord ? data.discord : '';
                    farm_instagram = typeof data.instagram != 'undefined' && data.instagram ? data.instagram : '';
                    farm_youtube = typeof data.youtube != 'undefined' && data.youtube ? data.youtube : '';
                    farm_web = typeof data.web != 'undefined' && data.web ? data.web : '';
                    farm_email = typeof data.email != 'undefined' && data.email ? data.email : '';
                    farm_phone = typeof data.phone != 'undefined' && data.phone ? data.phone : '';
                    farm_telegram = typeof data.telegram != 'undefined' && data.telegram ? data.telegram : '';
                    farm_medium = typeof data.medium != 'undefined' && data.medium ? data.medium : '';

                    if (
                        typeof data.customLink != 'undefined' &&
                        typeof data.customLink.name != 'undefined' &&
                        data.customLink.name &&
                        typeof data.customLink.value != 'undefined' &&
                        data.customLink.value
                    ) {
                        custom_link_value = data.customLink.value;
                        custom_link_name = data.customLink.name;
                    }
                }

            } catch (e) {

                console.log(e);
            }

            let cookieValue = JSON.stringify({farm: farmAddress, name: farm_name.replace(';', '.')});
            setCookie('lastFarm', cookieValue, 365);

            $('#lastFarm').remove();
            $('.sidebar').find('.nav').append('<li id="lastFarm" class="nav-item' + (getUrlParam('address') ? ' active' : '') + '">\n' +
                '                <a class="nav-link" href="farm-view.html?address=' + farmAddress + '">\n' +
                '                    <i class="material-icons">grass</i>\n' +
                '                    <p class="text-truncate">' + farm_name + '</p>\n' +
                '                </a>\n' +
                '            </li>');

            console.log('FARM IMAGE: ', farm_image);

            let tmpl = _this.farmHeaderTemplate({
                name: farm_name,
                image: farm_image,
                custom_link_value: custom_link_value,
                custom_link_name: custom_link_name,
                twitter: farm_twitter,
                discord: farm_discord,
                medium: farm_medium,
                web: farm_web,
                phone: farm_phone,
                instagram: farm_instagram,
                email: farm_email,
                telegram: farm_telegram,
                youtube: farm_youtube,
                description: farm_description
            });

            $('#farmHeader').append(tmpl);

        }

        let offset = _this.lastNftIndex > -1 ? _this.lastNftIndex : 0;
        let currentIndex = offset;

        let nfts = await window.tncLib.getFarmNfts(farmAddress);

        for(let i = offset; i < nfts.length; i++){

            fetchUrl(api_url + '1.0/'+chain_id+'/collections/events/URI/erc1155Address/'+nfts[i].erc1155+'/id/0', 5000);

            currentIndex = i;

            let nft = await window.tncLib.getNft(nfts[i].erc1155, nfts[i].id);

            // new opensea json uri pattern
            if(nft.uri.includes("api.opensea.io")){

                let nftUri = nft.uri;
                nftUri = decodeURI(nftUri).replace("{id}", nfts[i].id);
                nftUri = nftUri.split("/");
                if(nftUri.length > 0 && nftUri[ nftUri.length - 1 ].startsWith("0x")){
                    nftUri[ nftUri.length - 1 ] = nftUri[ nftUri.length - 1 ].replace("0x", "");
                    nft.uri = nftUri.join("/");
                }
            }

            nft.uri  = decodeURI(nft.uri).replace("{id}", nfts[i].id);

            let farm_data = await window.tncLib.farmNftData(farmAddress, nfts[i].erc1155, nfts[i].id);

            let data_image = '';
            let data_animation_url = '';
            let data_audio_url = '';
            let data_interactive_url = '';
            let data_name = '';
            let data_description = '';
            let data_link = '';
            let data_attributes = [];

            try {

                let data = await $.getJSON(nft.uri.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/'));

                if (typeof data == 'object') {

                    data_image = typeof data.image != 'undefined' && data.image ? data.image.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/') : '';
                    data_animation_url = typeof data.animation_url != 'undefined' && data.animation_url ? data.animation_url.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/') : '';
                    data_audio_url = typeof data.audio_url != 'undefined' && data.audio_url ? data.audio_url.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/') : '';
                    data_interactive_url = typeof data.interactive_url != 'undefined' && data.interactive_url ? data.interactive_url.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/') : '';

                    data_name = typeof data.name != 'undefined' && data.name ? data.name : '';
                    data_description = typeof data.description != 'undefined' && data.description ? data.description : '';
                    data_link = typeof data.external_link != 'undefined' && data.external_link ? data.external_link : '';
                    data_attributes = typeof data.attributes != 'undefined' && data.attributes ? data.attributes : [];
                }

            }catch (e){

                try {
                    let data = await $.getJSON(nft.uri.toLowerCase().replace('gateway.ipfs.io', 'cloudflare-ipfs.com'));

                    if (typeof data == 'object') {

                        data_image = typeof data.image != 'undefined' && data.image ? data.image.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/').replace('gateway.ipfs.io', 'cloudflare-ipfs.com') : '';
                        data_animation_url = typeof data.animation_url != 'undefined' && data.animation_url ? data.animation_url.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/').replace('gateway.ipfs.io', 'cloudflare-ipfs.com') : '';
                        data_audio_url = typeof data.audio_url != 'undefined' && data.audio_url ? data.audio_url.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/').replace('gateway.ipfs.io', 'cloudflare-ipfs.com') : '';
                        data_interactive_url = typeof data.interactive_url != 'undefined' && data.interactive_url ? data.interactive_url.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/').replace('gateway.ipfs.io', 'cloudflare-ipfs.com') : '';
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

            let price = null;
            let buy = '';

            if(hasShop && runMode != 0){

                let prices = await tncLib.farmShopGetPrice(addonAddress, nfts[i].erc1155, nfts[i].id);
                let _price = web3.utils.toBN(prices[0]).add( web3.utils.toBN( prices[1] ) );
                let _null = web3.utils.toBN("0");

                if(_price.gt(_null)){
                    price = _this.formatNumberString(_price.toString(), 18);
                    price = price.substring(0, price.length - 10) + ' ' + getCurrency();
                    buy = 'Buyout ';
                    if(runMode == 2){
                        buy = 'Buy';
                    }
                }
            }

            if(data_interactive_url != ''){
                data_interactive_url =  data_interactive_url + "?erc1155Address="+nfts[i].erc1155+"&id="+nfts[i].id+"&chain_id="+chain_id;
            }

            let tmpl = _this.farmTemplate({
                checkOpenSea : chain_id == '1' || chain_id == '4' ? 'Check on OpenSea' : 'Open Details',
                image: data_image,
                animation_url: data_animation_url,
                audio_url: data_audio_url,
                interactive_url: data_interactive_url,
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
                traitsHide : traits_hide,
                options : isAdmin ? 'isAdmin' : '',
                shop: addonAddress,
                buy : buy,
                price : price,
                opensea : chain_id == '1' || chain_id == '4' ? 'https://opensea.io/assets/'+nfts[i].erc1155+'/'+nfts[i].id : 'collectible.html?collection=' +  nfts[i].erc1155 + '&id=' + nfts[i].id
            });

            // hack to not display an adult NFT in the unifty rares farm
            if( chain_id == '64' && nfts[i].erc1155.toLowerCase() == '0x16bc9611337A7251bA4575B55a37bb251cd61f4C'.toLowerCase() && nfts[i].id == 8 ){

                // nothing

            }else{

                $('#farmPage').append(tmpl);
            }

            if(hasShop && runMode != 0){
                $('#farmSetShopPrice'+nfts[i].erc1155+nfts[i].id).css('display', 'block');
            }
            else{
                $('#farmSetShopPrice'+nfts[i].erc1155+nfts[i].id).css('display', 'none');
            }

            if(runMode == 2){

                if( farmBalance.eq(_null) ) {
                    $('#redeemButton' + nfts[i].erc1155 + nfts[i].id).css('display', 'none');
                }
            }

            $('#buyButton'+nfts[i].erc1155+nfts[i].id).on('click', async function(){

                $('#farmBuyModal').modal('show');

                let prices = await tncLib.farmShopGetPrice(addonAddress, nfts[i].erc1155, nfts[i].id);
                let _price = web3.utils.toBN(prices[0]).add( web3.utils.toBN( prices[1] ) );

                $('#farmBuyPrice').html(_this.formatNumberString(_price.toString(), 18));
                $('.currency').html(getCurrency());

                $('#farmBuyAddress').val($(this).data('erc1155'));
                $('#farmBuyId').val($(this).data('tokenId'));
                $('#farmShopBuyAddress').val($(this).data('shopAddress'));

                $('#buyButton').off('click');
                $('#buyButton').on('click', async function(){

                    let amount = parseInt($('#farmBuyAmount').val().trim());
                    if(isNaN(amount) || amount < 0){
                        _alert('Please enter a valid amount.');
                        return;
                    }

                    let farmBalance = await tncLib.balanceof($('#farmBuyAddress').val(), farmAddress, $('#farmBuyId').val());
                    if( farmBalance < amount){

                        _alert('Your amount exceeds the current stock. You can buy max. ' + farmBalance + ' of this NFT.');
                        return;
                    }

                    let final = web3.utils.toBN("0");
                    for(let i = 0; i < amount; i++){
                        final = final.add(_price);
                    }

                    let balance = web3.utils.toBN(await web3.eth.getBalance(tncLib.account));
                    if(balance.lt(final)){
                        _alert('Insufficient funds to perform this purchase.');
                        return;
                    }

                    $('#buyButton').prop('disabled', true);
                    $('#buyButton').html('Processing...');

                    await tncLib.farmShopBuy(
                        $('#farmBuyAddress').val(),
                        $('#farmBuyId').val(),
                        amount,
                        final.toString(),
                        $('#farmShopBuyAddress').val(),
                        function () {
                            toastr["info"]('Please wait for the transaction to finish.', "Buying....");
                        },
                        function (receipt) {
                            console.log(receipt);
                            toastr.remove();
                            toastr["success"]('Transaction has been finished.', "Success");
                            $('#buyButton').prop('disabled', false);
                            $('#buyButton').html('Buy');
                            $('#farmBuyModal').modal('hide');
                            _alert('Thank you for your purchase!');
                        },
                        function (err) {
                            toastr.remove();
                            toastr["error"]('An error occurred with your Buy transaction.', "Error");
                            $('#buyButton').prop('disabled', false);
                            $('#buyButton').html('Buy');
                        });
                });
            });

            $('#redeemButton'+nfts[i].erc1155+nfts[i].id).on('click', async function(){

                let user_balance = await tncLib.farmPointsEarned(farmAddress, tncLib.account);

                if(user_balance >= $(this).data('points') && stock > 0){

                    console.log("Mint Fee", nfts[i].mintFee.toString());

                    let haveWildcard = await tncLib.farmIHaveAnyWildcard();
                    let nifBalance = web3.utils.toBN(await tncLib.nif.methods.balanceOf(tncLib.account).call({from:tncLib.account}));
                    let feeMinNif = web3.utils.toBN(await tncLib.getFarmMinimumNif());

                    let erc1155 = nfts[i].erc1155;

                    await tncLib.farmRedeem(
                        farmAddress, erc1155,
                        nfts[i].id,
                        !await tncLib.farmIsCloned(farmAddress) && ( haveWildcard || nifBalance.gte(feeMinNif) ) ? '0' : nfts[i].mintFee.toString(),
                        function () {
                            toastr["info"]('Please wait for the transaction to finish.', "Redeem....");
                        },
                        function (receipt) {
                            console.log(receipt);
                            toastr.remove();
                            toastr["success"]('Transaction has been finished.', "Success");
                            _this.updateRegisteredCollections(erc1155);
                        },
                        function (err) {
                            toastr.remove();
                            toastr["error"]('An error occurred with your redeem transaction.', "Error");
                        });

                }
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

            let maxPerLoad = 8;

            if( i % maxPerLoad == maxPerLoad - 1 ){

                _this.lastNftIndex = i + 1;

                break;
            }
        }

        if(currentIndex + 1 < nfts.length){

            $('#loadMore').remove();
            $('#farmPage').append(_this.nextButtonTemplate({}));
            $('#loadMoreButton').off('click');
            $('#loadMoreButton').on('click', function(){
                _this.populateFarm(farmAddress);
            });
        }
    };

    this.updateRegisteredCollections = async function(address){

        let collectionAddresses = [];

        if(localStorage.getItem('collectionAddresses'+chain_id)){
            collectionAddresses = JSON.parse(localStorage.getItem('collectionAddresses'+chain_id));
        }

        if(!collectionAddresses.includes(address)) {
            collectionAddresses.push(address);
            localStorage.setItem('collectionAddresses'+chain_id, JSON.stringify(collectionAddresses));
        }

    }

    this.observeChanges = async function(){

        let farm_address = _this.getUrlParam('address');
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
                } else if(stock == 0){
                    $(this).html('Sold Out');
                    if(chain_id == '1') {
                        $(this).on('click', function () {
                            location.href = 'https://opensea.io/assets/' + $(this).data('erc1155') + '/' + $(this).data('tokenId');
                        });
                    }
                    if(chain_id == '4') {
                        $(this).on('click', function () {
                            location.href = 'https://rinkeby.opensea.io/assets/' + $(this).data('erc1155') + '/' + $(this).data('tokenId');
                        });
                    }
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
        }

        setTimeout(function(){

            _this.observeChanges();

        }, 5000);

    };

    this.observeChanges2 = async function(){

        let farm_address = _this.getUrlParam('address');
        if(farm_address != null  && await tncLib.isFarm(farm_address)) {

            let _null = web3.utils.toBN("0");
            let farmBalance = web3.utils.toBN( await tncLib.farmBalanceOfRaw(farm_address, tncLib.account) );
            let maxStakesLeft = web3.utils.toBN( await tncLib.farmMaxStakeRaw(farm_address) ).sub( farmBalance );
            let decimals = await tncLib.farmTokenDecimals(farm_address);
            let farmToken = await tncLib.farmToken(farm_address);
            let balanceOfErc20 = web3.utils.toBN( await tncLib.balanceOfErc20Raw(farmToken, tncLib.account) );

            let pending = await tncLib.farmPendingWithdrawals(tncLib.account, farm_address);
            if(pending > 0) {
                $('#withdrawFeesModalButton').css('display', 'flex');
            }else{
                $('#withdrawFeesModalButton').css('display', 'none');
            }
            $('#withdrawFeesBody').html('Your current fee balance: ' + _this.formatNumberString(pending, 18) + " " + getCurrency());

            if(balanceOfErc20.gte( maxStakesLeft) ){
                $('#farmStakeMax').text(_this.formatNumberString(maxStakesLeft.toString(), decimals) + " " + await tncLib.farmTokenSymbol(farm_address));
            }
            else if(balanceOfErc20.lte( maxStakesLeft ) && balanceOfErc20.gt(_null) ){
                $('#farmStakeMax').text(_this.formatNumberString(balanceOfErc20.toString(), decimals) + " " + await tncLib.farmTokenSymbol(farm_address));
            }
            else
            {
                $('#farmStakeMax').text(0 + " " + await tncLib.farmTokenSymbol(farm_address));
            }

            $('#farmStakeMaxButton').off('click');
            $('#farmStakeMaxButton').on('click', function(){

                if(balanceOfErc20.gte( maxStakesLeft) ){
                    $('#nftStakeAmount').val( _this.formatNumberString(maxStakesLeft.toString(), decimals) );
                }
                else if(balanceOfErc20.lte( maxStakesLeft ) && balanceOfErc20.gt( 0 )){
                    $('#nftStakeAmount').val( _this.formatNumberString(balanceOfErc20.toString(), decimals) );
                }
            });

            if(farmBalance.gt(_null)){
                $('#farmUnstakeMax').text(_this.formatNumberString(farmBalance.toString(), decimals) + " " + await tncLib.farmTokenSymbol(farm_address));
            }
            else
            {
                $('#farmUnstakeMax').text(0 + " " + await tncLib.farmTokenSymbol(farm_address));
            }

            $('#farmUnstakeMaxButton').off('click');
            $('#farmUnstakeMaxButton').on('click', function(){

                $('#nftUnstakeAmount').val( _this.formatNumberString(farmBalance.toString(), decimals)  );
            });
        }

        setTimeout(function(){

            _this.observeChanges2();

        }, 5000);

    };

    this.updateNftRemoval = async function(){

        let amount = parseInt($('#farmRemoveNftsAmount').val().trim());

        if(amount <= 0 || $('#farmRemoveNftsAmount').val().trim() == ''){
            _alert('Please enter a positive amount to remove');
            return;
        }

        let nftBalance = await tncLib.balanceof($('#farmRemovalAddress').val(), _this.getUrlParam('address'), $('#farmRemovalId').val());
        if(nftBalance < amount){
            _alert("Balance exceeds desired amount. Farm's NFT balance: " + nftBalance);
            return;
        }

        toastr.remove();

        tncLib.farmRemoveNfts(
            $('#farmRemovalAddress').val(),
            $('#farmRemovalId').val(),
            amount,
            tncLib.account,
            _this.getUrlParam('address'),
            function () {
                $('#farmEditDataButton').prop('disabled', true);
                $('#farmEditDataButton').html('Processing...');
                toastr["info"]('Please wait for the transaction to finish.', "Removing NFTs ....");
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $('#farmEditDataButton').prop('disabled', false);
                $('#farmEditDataButton').html('Remove');
                toastr["success"]('Transaction has been finished.', "Success");
            },
            function (err) {
                toastr.remove();
                $('#farmEditDataButton').prop('disabled', false);
                $('#farmEditDataButton').html('Remove');
                let errMsg = 'An error occurred with your removing NFTs transaction.';
                toastr["error"](errMsg, "Error");
            }
        );
    };

    this.populateNftRemoval = function(e){

        let farmAddress = $(e.relatedTarget).data('contractAddress');
        let id = $(e.relatedTarget).data('contractId');

        $('#farmRemovalAddress').val(farmAddress);
        $('#farmRemovalId').val(id);
    };

    this.populateInteractive = async function(e){
        window.interactiveDefault = $('#interactiveBody').html();
        let url = $(e.relatedTarget).data('interactiveUrl');
        $('#nftInteractiveUrl').val(url);
        $('#runNftNewTab').off('click');
        $('#runNftNewTab').on('click', function(){
            window.open($('#nftInteractiveUrl').val(), '_blank');
        });
        $('#runNft').off('click');
        $('#runNft').on('click', function(){
            let tag = '<iframe style="width:100%;height:400px;border:none;" hspace="0" vspace="0" marginHeight="0" marginWidth="0" frameBorder="0" allowtransparency="true" src=' + JSON.stringify($('#nftInteractiveUrl').val()) + ' sandbox="allow-scripts allow-pointer-lock allow-popups allow-forms"></iframe>';
            $('#interactiveBody').html(tag);
        });
        $('#closeInteractive').off('click');
        $('#closeInteractive').on('click', function(){
            $('#interactiveBody').html(window.interactiveDefault);
        });
    };

    this.populateShopPrice = async function(e){

        $('.currency').html(getCurrency());

        let erc1155Address = $(e.relatedTarget).data('contractAddress');
        let id = $(e.relatedTarget).data('contractId');
        let shopAddress = $(e.relatedTarget).data('shopAddress');

        let prices = await tncLib.farmShopGetPrice(shopAddress, erc1155Address, id);

        $('#farmShopEditArtistPrice').val( _this.formatNumberString(prices[1], 18) );
        $('#farmShopEditControllerPrice').val( _this.formatNumberString(prices[0], 18) );
        $('#farmShopAddress').val( shopAddress );
        $('#farmShopEditId').val( id );
        $('#farmShopEditAddress').val( erc1155Address );

    };

    this.updateEditNft = async function(){

        let points = $('#farmEditPoints').val().trim();
        let mintFee = $('#farmEditArtistFee').val().trim();
        let controllerFee = $('#farmEditControllerFee').val().trim();
        let artist = $('#farmEditArtistAddress').val().trim();

        if(points == '' || parseFloat(points) <= 0){ _alert("Please enter a positive amount of redemption points."); return }
        if(mintFee == ''){ _alert("Please enter an artist fee."); return }
        if(controllerFee == ''){ _alert("Please enter a controller fee."); return }
        if(parseFloat(mintFee) > 0 && ( !web3.utils.isAddress(artist) || artist == '' ) ){ _alert("Please enter a valid artist address if artist fee is set."); return }

        toastr.remove();

        tncLib.farmUpdateNftData(
            $('#farmEditAddress').val(),
            $('#farmEditId').val(),
            _this.resolveNumberString(points, 18),
            _this.resolveNumberString(mintFee, 18),
            _this.resolveNumberString(controllerFee, 18),
            artist == '' ? '0x0000000000000000000000000000000000000000' : artist,
            _this.getUrlParam('address'),
            function () {
                $('#farmEditDataButton').prop('disabled', true);
                $('#farmEditDataButton').html('Processing...');
                toastr["info"]('Please wait for the transaction to finish.', "Updating NFT ....");
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $('#farmEditDataButton').prop('disabled', false);
                $('#farmEditDataButton').html('Update');
                toastr["success"]('Transaction has been finished.', "Success");
            },
            function (err) {
                toastr.remove();
                $('#farmEditDataButton').prop('disabled', false);
                $('#farmEditDataButton').html('Update');
                let errMsg = 'An error occurred with your update NFT transaction.';
                toastr["error"](errMsg, "Error");
            }
        );
    };

    this.updateShopPrice = async function(){

        let mintFee = $('#farmShopEditArtistPrice').val().trim();
        let controllerFee = $('#farmShopEditControllerPrice').val().trim();

        if(mintFee == ''){ _alert("Please enter an artist price."); return }
        if(controllerFee == ''){ _alert("Please enter a controller price."); return }

        toastr.remove();

        $('#farmShopEditDataButton').prop('disabled', true);
        $('#farmShopEditDataButton').html('Processing...');

        tncLib.farmShopUpdatePrice(
            $('#farmShopEditAddress').val(),
            $('#farmShopEditId').val(),
            _this.resolveNumberString(mintFee, 18),
            _this.resolveNumberString(controllerFee, 18),
            $('#farmShopAddress').val(),
            function () {
                toastr["info"]('Please wait for the transaction to finish.', "Updating NFT ....");
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $('#farmShopEditDataButton').prop('disabled', false);
                $('#farmShopEditDataButton').html('Update');
                toastr["success"]('Transaction has been finished.', "Success");
            },
            function (err) {
                toastr.remove();
                $('#farmShopEditDataButton').prop('disabled', false);
                $('#farmShopEditDataButton').html('Update');
                let errMsg = 'An error occurred with your update NFT transaction.';
                toastr["error"](errMsg, "Error");
            }
        );
    };

    this.populateEditNft = async function(e){

        let farmAddress = $(e.relatedTarget).data('contractAddress');
        let id = $(e.relatedTarget).data('contractId');

        $('#farmEditAddress').val(farmAddress);
        $('#farmEditId').val(id);

        let data = await tncLib.farmNftData(_this.getUrlParam('address'), farmAddress, id);

        $('#farmEditPoints').val( _this.formatNumberString( ""+data.points, 18) );
        $('#farmEditArtistFee').val( _this.formatNumberString( ""+data.mintFee, 18) );
        $('#farmEditControllerFee').val( _this.formatNumberString( ""+data.controllerFee, 18) );
        $('#farmEditArtistAddress').val(data.artist);

        $('.currency').html(getCurrency());
    };

    this.addNft = async function(){

        let amount = $('#farmNftAmount').val().trim();
        let points = $('#farmPoints').val().trim();
        let mintFee = $('#farmArtistFee').val().trim();
        let controllerFee = $('#farmControllerFee').val().trim();
        let artist = $('#farmArtistAddress').val().trim();
        let erc1155 = $('#farmSelectedWalletErc1155').val().trim();
        let id = $('#farmSelectedWalletId').val().trim();

        if(erc1155 == '' || id == ''){ _alert("Please select an NFT from your wallet."); return }
        if(amount == '' ||parseInt(amount) <= 0){ _alert('Please enter a positive amount of NFTs to add.'); return }
        let myNfts = await tncLib.getMyNfts(erc1155);
        if(myNfts.length == 0){ _alert("You don't own enough of this NFT."); return }
        if(points == '' ||parseFloat(points) <= 0){ _alert("Please enter a positive amount of redemption points."); return }
        if(mintFee == ''){ _alert("Please enter an artist fee in ETH."); return }
        if(controllerFee == ''){ _alert("Please enter an controller fee in ETH."); return }
        if(parseFloat(mintFee) > 0 && ( !web3.utils.isAddress(artist) || artist == '' ) ){ _alert("Please enter a valid artist address if artist fee is set."); return }

        points = web3.utils.toBN( _this.resolveNumberString(points, 18) );
        mintFee = web3.utils.toBN( _this.resolveNumberString(mintFee, 18) );
        controllerFee = web3.utils.toBN( _this.resolveNumberString(controllerFee, 18) );

        let approved = await tncLib.erc1155IsApprovedForAll(tncLib.account, _this.getUrlParam('address'), erc1155);

        if(approved){

            toastr.remove();

            tncLib.farmAddNfts(
                points.toString(),
                mintFee.toString(),
                controllerFee.toString(),
                artist == '' ? '0x0000000000000000000000000000000000000000' : artist,
                1,
                erc1155,
                id,
                "",
                parseInt(amount),
                _this.getUrlParam('address'),
                function () {
                    $('#addNftsButton').prop('disabled', true);
                    $('#addNftsButton').html('Processing...');
                    toastr["info"]('Please wait for the transaction to finish.', "Adding NFTs ....");
                },
                function (receipt) {
                    console.log(receipt);
                    toastr.remove();
                    $('#addNftsButton').prop('disabled', false);
                    $('#addNftsButton').html('Add');
                    toastr["success"]('Transaction has been finished.', "Success");
                    _this.lastFarmIndex = -1;
                    _this.populateFarm(_this.getUrlParam('address'));
                },
                function (err) {
                    toastr.remove();
                    $('#addNftsButton').prop('disabled', false);
                    $('#addNftsButton').html('Add');
                    let errMsg = 'An error occurred with your adding NFTs transaction.';
                    toastr["error"](errMsg, "Error");
                }
            );

        }else{

            $('#addNftsButton').prop('disabled', true);
            $('#addNftsButton').html('Approve first...');

            toastr.remove();

            tncLib.erc1155SetApprovalForAll(
                _this.getUrlParam('address'),
                true,
                erc1155,
                function () {
                    toastr["info"]('Please wait for the transaction to finish.', "Set approval for all....");
                },
                function (receipt) {
                    console.log(receipt);
                    toastr.remove();
                    $('#addNftsButton').prop('disabled', false);
                    $('#addNftsButton').html('Approved! Add Now.');
                    toastr["success"]('Transaction has been finished.', "Success");
                },
                function (err) {
                    toastr.remove();
                    $('#addNftsButton').prop('disabled', false);
                    $('#addNftsButton').html('Add');
                    let errMsg = 'An error occurred with your set approval for all transaction.';
                    toastr["error"](errMsg, "Error");
                }
            );
        }
    };

    this.withdrawFees = async function(){

        await tncLib.farmWithdrawFees(
            _this.getUrlParam('address'),
            function () {
                $('#withdrawFeesButton').prop('disabled', true);
                $('#withdrawFeesButton').html('Processing...');
                toastr["info"]('Please wait for the transaction to finish.', "Withdraw....");
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $('#withdrawFeesButton').prop('disabled', false);
                $('#withdrawFeesButton').html('Withdraw');
                toastr["success"]('Transaction has been finished.', "Success");
            },
            function (err) {
                toastr.remove();
                $('#withdrawFeesButton').prop('disabled', false);
                $('#withdrawFeesButton').html('Withdraw');
                let errMsg = 'An error occurred with your withdraw transaction.';
                toastr["error"](errMsg, "Error");
            }
        );

    };

    this.populateNftsModal = async function(){

        $("#farmNftCollection").html('');

        var o = new Option("Unifty", "unifty");
        $(o).html("Unifty");
        $("#farmNftCollection").append(o);

        switch(chain_id){
            case '1': // ETHEREUM MAINNET
            case '4': // ETHEREUM TESTNET
                var o1 = new Option("Rarible", "rarible");
                $(o1).html("Rarible");
                $("#farmNftCollection").append(o1);
                break;
            default: // anything else, no rarible
        }

        var o2 = new Option("Custom...", "custom");
        $(o2).html("Custom..");
        $("#farmNftCollection").append(o2);

        $('.currency').html(getCurrency());

    };

    this.populateWallet = async function(){

        $('#walletModalBody').html("Loading...");
        //$('#farmWalletAddButton').css('display', 'inline-block');

        let addresses = [];

        switch($('#farmNftCollection').val()){
            case 'unifty':
                let length = await tncLib.getMyErc1155Length();
                if(length == 0){
                    $('#walletModalBody').html("You don't own any Unifty collection.");
                    return;
                }
                for(let i = length - 1; i >= 0; i--){
                    let myCollection = await tncLib.getMyErc1155(i);
                    addresses.push(myCollection.erc1155);
                }
                break;
            case 'rarible':
                addresses.push('0xd07dc4262BCDbf85190C01c996b4C06a461d2430');
                break;
            default:
                if( !web3.utils.isAddress($('#farmCustomErc1155Address').val().trim()) ){
                    //$('#farmWalletAddButton').css('display', 'none');
                    $('#walletModalBody').html('Invalid custom collection address.');
                    return;
                }
                if( !await tncLib.isErc1155Supported($('#farmCustomErc1155Address').val().trim())){
                    $('#walletModalBody').html('Given address does not support the ERC1155 standard.');
                    return;
                }
                addresses.push($('#farmCustomErc1155Address').val().trim());
        }

        $('#walletModalBody').html("");

        let data = [];

        for(let i = 0; i < addresses.length; i++){

            data.push({erc1155 : addresses[i], ids : await tncLib.getMyNftsByUri(addresses[i])});
        }

        for(let i = 0; i < data.length; i++){
            for(let j = 0; j < data[i].ids.length; j++) {
                _this.addWalletRow(data[i].erc1155, data[i].ids[j]);
            }
        }
    };

    this.addWalletRow = async function(erc1155, id){

        let erc1155Meta = await tncLib.getErc1155Meta(erc1155);
        let nftMeta = await tncLib.getNftMeta(erc1155, id);

        let erc1155Name = erc1155Meta.name;
        let name = "#"+id;
        let image = 'n/a';

        try {

            let data = await $.getJSON(nftMeta);

            if (typeof data == 'object') {

                if(typeof data.name != "undefined" && data.name != '') {
                    name = data.name;
                }

                if(typeof data.image != "undefined" && data.image != '') {
                    image = '<img src="' + data.image.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/') + '" border="0" style="width: 25px;" />';
                }
            }

        }catch (e){
            console.log('error opening nft json: ', e);
        }

        let myNft = await window.tncLib.getNft(erc1155, id);

        let code = '<div style="cursor: pointer;border-bottom: 1px solid #ccc" class="row mb-2 pb-2" id="walletEntry'+erc1155+id+'">';
        code += '<div class="col-2">'+image+'</div>';
        code += '<div class="col-3">'+name+'</div>';
        code += '<div class="col-3">'+erc1155Name+'</div>';
        code += '<div class="col-2">#'+id+'</div>';
        code += '<div class="col-2">You own: ' + myNft.balance + '</div>';
        code += '</div>';

        console.log(code);

        let code2 = '<div class="col-2 mt-2 mb-2">'+image+'</div>';
        code2 += '<div class="col-3">'+name+'</div>';
        code2 += '<div class="col-3">'+erc1155Name+'</div>';
        code2 += '<div class="col-2">#'+id+'</div>';
        code2 += '<div class="col-2">You own: ' + myNft.balance + '</div>';

        $('#walletModalBody').append(code);

        $('#walletEntry'+erc1155+id).off('click');
        $('#walletEntry'+erc1155+id).on('click', function(){
            $('#farmSelectedWalletErc1155').val(erc1155);
            $('#farmSelectedWalletId').val(id);
            $('#farmSelectedCode').html(code2);
            $('#farmNftAmountWrapper').css('display', 'block');
            $('#farmWalletModal').modal('hide');
        });
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

    this.loadPage = async function (page){

        $('#stakingOptions').css('display', 'none');
        $('#farmPage').css('display', 'none');

        switch (page){

            default:

                let farm_address = _this.getUrlParam('address');
                if(farm_address != null  && await tncLib.isFarm(farm_address)) {

                    $('#withdrawFeesButton').on('click', _this.withdrawFees);
                    $('#farmWalletAddButton').on('click', _this.updateNftRemoval);
                    $('#farmEditDataButton').on('click', _this.updateEditNft);
                    $('#addNftsButton').on('click', _this.addNft);
                    $('#farmShopEditDataButton').on('click', _this.updateShopPrice);

                    $('#nftInteractiveModal').off('hide.bs.modal');
                    $('#nftInteractiveModal').on('hide.bs.modal', function(){
                        $('#interactiveBody').html(window.interactiveDefault);
                    });

                    $('#farmSetShopPriceModal').off('show.bs.modal');
                    $('#farmSetShopPriceModal').on('show.bs.modal', _this.populateShopPrice);

                    $('#nftInteractiveModal').off('show.bs.modal');
                    $('#nftInteractiveModal').on('show.bs.modal', _this.populateInteractive);

                    $('#addNftsModal').off('show.bs.modal');
                    $('#addNftsModal').on('show.bs.modal', _this.populateNftsModal);

                    $('#farmWalletModal').off('show.bs.modal');
                    $('#farmWalletModal').on('show.bs.modal', _this.populateWallet);

                    $('#farmEditDataModal').off('show.bs.modal');
                    $('#farmEditDataModal').on('show.bs.modal', _this.populateEditNft);

                    $('#farmRemoveNftsModal').off('show.bs.modal');
                    $('#farmRemoveNftsModal').on('show.bs.modal', _this.populateNftRemoval);

                    $('#farmNftCollection').on('change', function(){
                        if($(this).val() == 'custom'){
                            $('#farmCustomErc1155AddressWrapper').css('display', 'block');
                        }else{
                            $('#farmCustomErc1155AddressWrapper').css('display', 'none');
                        }
                    });

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
                    //$('#stakingOptions').css('display', 'flex');
                    $('#farmPage').css('display', 'grid');
                    _this.populateFarm(farm_address);
                }

                break;
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

        if(typeof accounts == 'undefined' || accounts.length == 0){

            tncLib.account = '0x0000000000000000000000000000000000000000';
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
        dapp.observeChanges();
        dapp.observeChanges2();
    });
}
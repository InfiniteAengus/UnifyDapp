function TncDapp() {

    const ipfs = window.IpfsHttpClient('ipfs.infura.io', '5001', { protocol: 'https' });
    const _this = this;
    this.farmTemplate = Handlebars.compile($('#farm-template').html());
    this.nextButtonTemplate = Handlebars.compile($('#next-button').html());
    this.noFarmsTemplate = Handlebars.compile($('#no-farms').html());
    this.lastFarmIndex = -1;
    this.currentBlock = 0;
    this.prevAccounts = [];
    this.prevChainId = '';

    this.defaultSocialMediaRow;

    this.populateMyFarms = async function(){

        if(_this.lastFarmIndex == -1) {
            $('#farmsPage').html('');
        }else{
            $('#loadMore').remove();
        }

        let length = await window.tncLib.getMyFarmsLength();
        let offset = _this.lastFarmIndex > -1 ? _this.lastFarmIndex : length;
        let currentIndex = offset;

        console.log('Farms Length: ', length);

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
                explorer = 'https://polygonscan.com/address/';
                break;
        }

        let shopAddonPrice = this.formatNumberString(await tncLib.farmShopAddonPrice(), 18);

        for(let i = offset - 1; i >= 0; i--){
            currentIndex = i;
            let farm = await window.tncLib.getMyFarm(i);
            let _uri = farm.uri.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/');

            try {

                let data = await $.getJSON(_uri);
                if (typeof data == 'object') {

                    let hasShop = await tncLib.farmHasShop(farm.farm);
                    let runMode = 0;
                    let addonAddress = '';
                    if(hasShop){
                        addonAddress = await tncLib.farmAddonAddress(farm.farm);
                        runMode = await tncLib.farmShopRunMode(addonAddress);
                    }

                    let nftcount = await tncLib.farmNftCount(farm.farm);
                    let controllerFunds = await tncLib.farmPendingWithdrawals(await tncLib.farmController(farm.farm), farm.farm);
                    let totalFees = await tncLib.farmTotalFeesCollected(farm.farm);

                    let tmpl = _this.farmTemplate({
                        explorer : explorer,
                        currency: getCurrency(),
                        image: data.image.replace('ipfs://','https://gateway.ipfs.io/ipfs/').replace('/ipfs/ipfs/', '/ipfs/'),
                        name: data.name,
                        description: data.description,
                        url : window.location.origin + window.location.pathname.replace('farm-builder.html', 'farm-view.html') + "?address=" + farm.farm,
                        index: i,
                        index2: i*2,
                        farm: farm.farm,
                        nftcount: nftcount,
                        controllerFunds: web3.utils.fromWei(controllerFunds, 'ether'),
                        totalFees: web3.utils.fromWei(totalFees, 'ether'),
                        shop : addonAddress,
                        runmode : runMode
                    });

                    $('#farmsPage').append(tmpl);

                    $('.currency').html(getCurrency());
                    $('.shopAddonPrice').html(shopAddonPrice);

                    if(!hasShop){
                       $('#farmShopAddon'+farm.farm).css('display', 'block');
                    }
                    else{

                        let isWhitelistAdmin = await tncLib.farmIsWhiteListAdmin(farm.farm, addonAddress);

                        console.log('is white: ', isWhitelistAdmin, addonAddress);

                        if(!isWhitelistAdmin){

                            $('#farmShopAddonWhitelistAdmin'+farm.farm).css('display', 'block');
                        }

                        if(isWhitelistAdmin){

                            let isPauser = await tncLib.farmIsPauser(farm.farm, addonAddress);

                            if(!isPauser) {
                                $('#farmShopAddonPauser' + farm.farm).css('display', 'block');
                            }else{

                                $('#farmShopEdit' + farm.farm).css('display', 'block');
                            }
                        }
                    }

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

                console.log('Trouble resolving farm uri: ', _uri);
            }
            fixingDropdowns();

            let maxPerLoad = 9;
            let currInvertedIndex = (length - 1) - i;

            if( currInvertedIndex % maxPerLoad == maxPerLoad - 1 ){

                _this.lastFarmIndex = i;

                break;
            }            
        }

        if(currentIndex > 0){

            $('#loadMore').remove();
            $('#farmsPage').append(_this.nextButtonTemplate({}));
            $('#loadMoreButton').off('click');
            $('#loadMoreButton').on('click', function(){
                _this.populateMyFarms();
            });
        }

        if( length == 0 ){

            $('#farmsPage').html(_this.noFarmsTemplate({}));
        }

    };

    this.populateRewardRate = async function(e){

        $('#farmEditRewardRate').val('');
        $('#editRewardRate').val('');
        $('#editRewardRateButton').val('Update');

        let farmAddress = $(e.relatedTarget).data('contractAddress');
        $('#editRewardRate').val(farmAddress);

        let rate = await tncLib.farmRewardRate(farmAddress);
        $('#farmEditRewardRate').val(rate);
        setRewardRate();
    };

    this.populateController = async function(e){

        $('#farmEditControllerAddress').val('');
        $('#editControllerFarmAddress').val('');
        $('#editControllerButton').val('Update');

        let farmAddress = $(e.relatedTarget).data('contractAddress');
        $('#editControllerFarmAddress').val(farmAddress);

        let controller = await tncLib.farmController(farmAddress);
        $('#farmEditControllerAddress').val(controller);
    };

    this.populateEditStakes = async function(e){

        $('#farmEditMinStake').val('');
        $('#farmEditMaxStake').val('');
        $('#editStakesFarmAddress').val('');
        $('#editStakeButton').val('Update');

        let farmAddress = $(e.relatedTarget).data('contractAddress');
        $('#editStakesFarmAddress').val(farmAddress);

        let minStake = await tncLib.farmMinStake(farmAddress);
        let maxStake = await tncLib.farmMaxStake(farmAddress);
        let decimals = await tncLib.farmTokenDecimals(farmAddress);

        $('#farmEditMinStake').val(minStake);
        $('#farmEditMaxStake').val(maxStake);

    };

    this.populateEditInfo = async function(e){

        _this.clearFarmInfo();

        let farmAddress = $(e.relatedTarget).data('contractAddress');

        let _uri = await tncLib.getFarmUri(farmAddress);
        try {

            let data = await $.getJSON(_uri);
            if (typeof data == 'object') {

                //Get the social media dropdown row without any values
                let socialMediaRow = _this.defaultSocialMediaRow;

                socialMediaRow.find(".removeSocial").on("click", function () {
                    removesSocial(this);
                });

              $(".farmSocialMediaAdd").fadeIn();

                for(let key in data){
                    if(key == "name" || key == "description" || key == "image" || key == "customLink" || data[key] == ""){
                        continue;
                    }

                    //Special case where the object was stored differently in previous versions
                    if (typeof data[key] == 'object') {
                        for(let key2 in data[key]){
                            let copy_SocialMediaRow = socialMediaRow.clone();

                            copy_SocialMediaRow.find("select").val(data[key][key2].name).attr("disabled", "true");
                            copy_SocialMediaRow.find("input").val(data[key][key2].value).prop("disabled", true);;
                            copy_SocialMediaRow.find(".removeSocial").on("click", function () {
                                removesSocial(this);
                            });

                            $("#editSocialMedia .farmSocialMediaGroupWrapper").append(copy_SocialMediaRow);
                        }

                        continue;
                    }

                    let copy_SocialMediaRow = socialMediaRow.clone();

                    copy_SocialMediaRow.find("select").val(key).attr("disabled", "true");
                    copy_SocialMediaRow.find("input").val(data[key]).prop("disabled", true);
                    copy_SocialMediaRow.find(".removeSocial").on("click", function () {
                        removesSocial(this);
                      });

                    $("#editSocialMedia .farmSocialMediaGroupWrapper").append(copy_SocialMediaRow);
                }

                if($("#editSocialMedia .farmSocialMediaGroupWrapper").children().length == 0){
                    //If there are no links then add a blank row
                    $("#editSocialMedia .farmSocialMediaGroupWrapper").append(socialMediaRow);
                }
                
                $('#farmInfoFarmAddress').val(farmAddress);
                $('#farmInfoName').val(data.name);
                $('#farmInfoDescription').val(data.description);
                $('#farmInfoImageUrl').val(data.image);
                $('#farmInfoCustomLink').val(data.customLink.value);
                $('#farmInfoCustomLinkText').val(data.customLink.name);
                $('.imageFileDisplay').html('<img src=' + JSON.stringify(data.image) + ' border="0" width="200"/>');
            }

        }catch (e){

            console.log('Trouble resolving farm uri: ', _uri);
        }

        //Resetting value to default on close
        $("#farmInfoModal").on('hidden.bs.modal', function () {
            $("#editSocialMedia .farmSocialMediaGroup").remove();
        });
    };

    this.populateShopEdit = async function(e){

        let farmAddress = $(e.relatedTarget).data('contractAddress');
        let shopAddress = $(e.relatedTarget).data('shopAddress');
        let runMode = $(e.relatedTarget).data('shopRunmode');
        $('#farmShopEditAddress').val(farmAddress);
        $('#farmShopEditShopAddress').val(shopAddress);
        $('#farmShopRunMode'+runMode).prop('checked', true);
    };

    this.populateShopAddonBuy = async function(e){

        let farmAddress = $(e.relatedTarget).data('contractAddress');
        $('#shopAddonFarmAddress').val(farmAddress);
    };

    this.populateShopAddonStep2 = async function(e){

        let farmAddress = $(e.relatedTarget).data('contractAddress');
        let shopAddress = $(e.relatedTarget).data('shopAddress');
        $('#shopAddonFarmStep2Address').val(farmAddress);
        $('#shopAddonFarmShopStep2Address').val(shopAddress);
    };

    this.populateShopAddonStep3 = async function(e){

        let farmAddress = $(e.relatedTarget).data('contractAddress');
        let shopAddress = $(e.relatedTarget).data('shopAddress');
        $('#shopAddonFarmStep3Address').val(farmAddress);
        $('#shopAddonFarmShopStep3Address').val(shopAddress);
    };

    this.buyShopAddon = async function(){

        /*
        let balance = web3.utils.toBN(await web3.eth.getBalance(tncLib.account));
        let price   = web3.utils.toBN(await tncLib.farmShopAddonPrice());

        if(!await tncLib.farmIHaveAnyWildcard() && balance.lt(price)){
            _alert('Insufficient funds to perform this purchase.');
            return;
        }*/

        let farmAddress = $('#shopAddonFarmAddress').val();

        $('#farmShopAddonBuyButton').prop('disabled', true);
        $('#farmShopAddonBuyButton').html('Pending transaction...');

        tncLib.farmBuyShopAddon(
            farmAddress,
            function () {
                toastr["info"]('Please wait for the transaction to finish.', "New Farm Shop Addon....");
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                toastr["success"]('Transaction has been finished.', "Success");

                $('#farmShopAddonBuyButton').prop('disabled', false);
                $('#farmShopAddonBuyButton').html('Buy');

                $('#shopAddonModal').modal('hide');
                $('#shopAddonWhitelistAdminModal').modal('show');

                $('#shopAddonFarmStep2Address').val($('#shopAddonFarmAddress').val());
                $('#shopAddonFarmShopStep2Address').val(receipt.events.NewShop.returnValues._shopAddress);

                _this.lastFarmIndex = -1;
                _this.populateMyFarms();
            },
            function (err) {
                toastr.remove();
                $('#farmShopAddonBuyButton').prop('disabled', false);
                $('#farmShopAddonBuyButton').html('Buy');

                let errMsg = 'An error occurred with your New Farm Shop Addon transaction. Do you have sufficient funds?';                    
                toastr["error"](errMsg, "Error");
                errorPopup("Error", errMsg, err.stack);
            }
        );
    }

    this.step2ShopAddon = async function(){

        let farmAddress = $('#shopAddonFarmStep2Address').val();
        let shopAddress = $('#shopAddonFarmShopStep2Address').val();

        $('#farmShopAddonStep2Button').prop('disabled', true);
        $('#farmShopAddonStep2Button').html('Pending transaction...');

        tncLib.farmStep2ShopAddon(
            farmAddress,
            shopAddress,
            function () {
                toastr["info"]('Please wait for the transaction to finish.', "Farm Shop Addon Step 2....");
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                toastr["success"]('Transaction has been finished.', "Success");

                $('#farmShopAddonStep2Button').prop('disabled', false);
                $('#farmShopAddonStep2Button').html('Allow');

                $('#shopAddonWhitelistAdminModal').modal('hide');
                $('#shopAddonPauserModal').modal('show');

                $('#shopAddonFarmStep3Address').val($('#shopAddonFarmStep2Address').val());
                $('#shopAddonFarmShopStep3Address').val($('#shopAddonFarmShopStep2Address').val());

                _this.lastFarmIndex = -1;
                _this.populateMyFarms();
            },
            function (err) {
                toastr.remove();
                let errMsg = 'An error occurred with your Farm Shop Addon Step 2 transaction. Do you have sufficient funds?';
                $('#farmShopAddonStep2Button').prop('disabled', false);
                $('#farmShopAddonStep2Button').html('Allow');
                   
                toastr["error"](errMsg, "Error");
                errorPopup("Error", errMsg, err.stack);
            }
        );
    }

    this.step3ShopAddon = async function(){

        let farmAddress = $('#shopAddonFarmStep3Address').val();
        let shopAddress = $('#shopAddonFarmShopStep3Address').val();

        $('#farmShopAddonStep3Button').prop('disabled', true);
        $('#farmShopAddonStep3Button').html('Pending transaction...');

        tncLib.farmStep3ShopAddon(
            farmAddress,
            shopAddress,
            function () {
                toastr["info"]('Please wait for the transaction to finish.', "Farm Shop Addon Step 3....");
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                toastr["success"]('Transaction has been finished.', "Success");

                $('#farmShopAddonStep3Button').prop('disabled', false);
                $('#farmShopAddonStep3Button').html('Allow');

                $('#shopAddonPauserModal').modal('hide');

                _alert('All permissions have been set, you may now enable shop features in your farm.');

                _this.lastFarmIndex = -1;
                _this.populateMyFarms();
            },
            function (err) {
                toastr.remove();
                let errMsg = 'An error occurred with your Farm Shop Addon Step 3 transaction. Do you have sufficient funds?';
                $('#farmShopAddonStep2Button').prop('disabled', false);
                $('#farmShopAddonStep2Button').html('Allow');
                
                toastr["error"](errMsg, "Error");
                errorPopup("Error", errMsg, err.stack);
            }
        );
    }

    this.setRunMode = async function(){

        let shopAddress = $('#farmShopEditShopAddress').val();
        let runMode = $("input[name='farmShopRunMode']:checked").val();

        $('#farmShopEditButton').prop('disabled', true);
        $('#farmShopEditButton').html('Pending transaction...');

        tncLib.shopSetRunMode(
            shopAddress,
            runMode,
            function () {
                $("#farmShopEditModal").modal("hide")
                _this.infoModal("info" ,"Please wait for the transaction to finish.");
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $("#farmShopEditModal").modal("hide")
                _this.infoModal("success" ,"Transaction has been finished.");
            },
            function (err) {
                toastr.remove();
                let errMsg = 'An error occurred with your Shop RunMode transaction. Do you have sufficient funds?';
                $('#farmShopEditButton').prop('disabled', false);
                $('#farmShopEditButton').html('Save');

                toastr["error"](errMsg, "Error");
                errorPopup("Error", errMsg, err.stack);

            }
        );
    }

    this.newFarm = async function(){

        let name = $('#farmName').val().trim();
        let token = $('#farmTokenAddress').val().trim();
        if($('#farmCustomTokenAddress').val().trim() != '' && token == 'custom'){
            token = $('#farmCustomTokenAddress').val().trim();
        }
        let minStake = $('#farmMinStake').val().trim();
        let maxStake = $('#farmMaxStake').val().trim();
        let description = $('#farmDescription').val().trim();
        let image = $('#farmImageUrl').val().trim();
        let controller = $('#farmControllerAddress').val().trim();
        let link = $('#farmCustomLink').val().trim();
        let text = $('#farmCustomLinkText').val().trim();
        //let check= $('#flexCheckDefault').val().is(':checked');
       
        $('#flexCheckDefault').on('change', function() { 
            // From the other examples
            if (!this.checked) {
                { _alert('Please read the notice and check the box to continue!'); return; }
            }
        });

        // if(check);
        // {   console.log(check.checked)
        //     { _alert('Please check the checkbox regarding fee'); return; }
        // }

        if(name == ''){ _alert('Please enter a farm name'); return; }
        if(token == '' || token == 'custom'){ _alert('Please choose a staking token or add a custom address'); return; }
        if(!await web3.utils.isAddress(token)){ _alert('Invalid staking token address'); return; }
        if(minStake == ''){ _alert('Please enter a minimum stake'); return; }
        if(parseFloat(minStake) == NaN){ _alert('Please enter a correct minimum stake as number'); return; }
        if(maxStake == ''){ _alert('Please enter a maximum stake'); return; }
        if(parseFloat(maxStake) == NaN){ _alert('Please enter a correct maximum stake as number'); return; }
        if(parseFloat(minStake) < 0){ _alert('Minimum Stake must be larger than zero'); return; }
        if(parseFloat(maxStake) < parseFloat(minStake) || parseFloat(maxStake) == 0){ _alert('Maximum stake must be equal or larger than minimum stake'); return; }
        if(controller == ''){ _alert('Please enter a controller address'); return; }
        if(!await web3.utils.isAddress(controller)){ _alert('Invalid controller address'); return; }
        if( ! ($('#flexCheckDefault').is(":checked")))
        {
            { _alert('Please read the notice and check the box to continue!'); return; }
        } 
        

        let farmInfo = {
            name : name,
            description : description,
            image : image,
            customLink : { name : text, value : link }
        };

        $(".farmSocialMediaGroup").each(function(){
            let social = $(this).find("select option:selected").val();
            let link = $(this).find("input").val().trim();

            farmInfo[social] = link
        })

        console.log(JSON.stringify(farmInfo));

        ipfs.add(buffer.Buffer(JSON.stringify(farmInfo)), async (err, result) => {

            console.log(err, result);

            let farmJsonUrl = "https://gateway.ipfs.io/ipfs/" + result[0].hash;

            _this.pin(result[0].hash);

            toastr.remove();

            let decimals = await tncLib.tokenDecimalsErc20(token);
            minStake = _this.resolveNumberString(""+minStake, decimals);
            maxStake = _this.resolveNumberString(""+maxStake, decimals);

            tncLib.newFarm(
                1, // period start, immediate in current version
                minStake,
                maxStake,
                controller,
                token,
                farmJsonUrl,
                function () {
                    $("#farmModal").modal("hide")
                    _this.infoModal("info" ,"Please wait for the transaction to finish.");
                },
                function (receipt) {
                    console.log(receipt);
                    $("#farmModal").modal("hide")
                    _this.infoModal("success" ,"Transaction has been finished.");

                    _this.lastFarmIndex = -1;
                    _this.populateMyFarms();
                },
                function (err) {
                    toastr.remove();
                    let errMsg = 'An error occurred with your New Farm transaction. Do you have sufficient funds?';            
                    toastr["error"](errMsg, "Error");
                    errorPopup("Error", errMsg, err.stack);
                }
            );

        });
    };


    this.infoModal = function(state, message){

        let imgSource

        if(state == "success"){
            imgSource = "assets/img/icons/task_success_black_48.svg";
        }
        else{
            imgSource = "assets/img/icons/info_black_48.svg";
        }

        _alert("<div class='modalFarmInfo'>" +
        "<img src='" + imgSource + "'>" +
        "<h3>" + message + "</h3>" +
        "</div>");        
    }

    this.updateRewardRate = async function(){
        let rate = $('#farmEditRewardRate').val();
        if(isNaN(parseFloat(rate)) || parseFloat(rate) <= 0){ _alert('Please enter a valid reward rate in seconds. Default is 86400 (1 day).'); return; }
        let farmAddress = $('#editRewardRate').val();
        await tncLib.farmSetRewardRate(
            rate,
            farmAddress,
            function () {
                $("#editRewardRateModal").modal("hide");
                _this.infoModal("info" ,"Please wait for the transaction to finish.");
            },
            function (receipt) {
                console.log(receipt);                
                $("#editRewardRateModal").modal("hide");
                _this.infoModal("success" ,"Transaction has been finished.");
            },
            function (err) {
                toastr.remove();
                $('#editRewardRateButton').prop('disabled', false);
                $('#editRewardRateButton').html('Update');
                let errMsg = 'An error occurred with your Set Reward Rate transaction.';
                toastr["error"](errMsg, "Error");
                errorPopup("Error", errMsg, err.stack);

            }
        );
    };

    this.updateController = async function(){
        let controller = $('#farmEditControllerAddress').val().trim();
        if(controller == ''){ _alert('Please enter a controller address'); return; }
        if(!await web3.utils.isAddress(controller)){ _alert('Invalid controller address'); return; }
        let farmAddress = $('#editControllerFarmAddress').val();
        await tncLib.farmSetController(
            controller,
            farmAddress,
            function () {
                $("#editControllerModal").modal("hide")
                _this.infoModal("info" ,"Please wait for the transaction to finish.");
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $("#editControllerModal").modal("hide")
                _this.infoModal("success" ,"Transaction has been finished.");
            },
            function (err) {
                toastr.remove();
                $('#editControllerButton').prop('disabled', false);
                $('#editControllerButton').html('Update');
                let errMsg = 'An error occurred with your Set Controller transaction.';
                toastr["error"](errMsg, "Error");
                errorPopup("Error", errMsg, err.stack);
            }
        );
    };

    this.updateStakes = async function(){

        let minStake = $('#farmEditMinStake').val().trim();
        let maxStake = $('#farmEditMaxStake').val().trim();
        if(minStake == ''){ _alert('Please enter a minimum stake'); return; }
        if(parseFloat(minStake) == NaN){ _alert('Please enter a correct minimum stake as number'); return; }
        if(maxStake == ''){ _alert('Please enter a maximum stake'); return; }
        if(parseFloat(maxStake) == NaN){ _alert('Please enter a correct maximum stake as number'); return; }
        if(parseFloat(minStake) < 0){ _alert('Minimum Stake must be larger than zero'); return; }
        if(parseFloat(maxStake) < parseFloat(minStake) || parseFloat(maxStake) == 0){ _alert('Maximum stake must be larger than minimum stake'); return; }

        let farmAddress = $('#editStakesFarmAddress').val();
        let decimals = await tncLib.farmTokenDecimals(farmAddress);
        minStake = _this.resolveNumberString(minStake, decimals);
        maxStake = _this.resolveNumberString(maxStake, decimals);

        await tncLib.farmSetMinMaxStake(
            minStake,
            maxStake,
            farmAddress,
            function () {
                $("#editStakeModal").modal("hide")
                _this.infoModal("info" ,"Please wait for the transaction to finish.");
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $("#editStakeModal").modal("hide")
                _this.infoModal("success" ,"Transaction has been finished.");
            },
            function (err) {
                toastr.remove();
                $('#editStakeButton').prop('disabled', false);
                $('#editStakeButton').html('Update');
                let errMsg = 'An error occurred with your Edit Stakes transaction.';
                toastr["error"](errMsg, "Error");
                errorPopup("Error", errMsg, err.stack);
            }
        );
    };

    this.updateFarmInfo = async function(){

        let name = $('#farmInfoName').val().trim();
        let description = $('#farmInfoDescription').val().trim();
        let image = $('#farmInfoImageUrl').val().trim();
        let link = $('#farmInfoCustomLink').val().trim();
        let text = $('#farmInfoCustomLinkText').val().trim();

        if(name == ''){ _alert('Please enter a farm name'); return; }

        let farmInfo = {
            name : name,
            description : description,
            image : image,
            customLink : { name : text, value : link }
        };

        $("#editSocialMedia .farmSocialMediaGroup").each(function(){
            let social = $(this).find("select option:selected").val();
            let link = $(this).find("input").val().trim();

            farmInfo[social] = link
        })

        console.log(JSON.stringify(farmInfo));

        ipfs.add(buffer.Buffer(JSON.stringify(farmInfo)), async (err, result) => {

            console.log(err, result);

            let farmJsonUrl = "https://gateway.ipfs.io/ipfs/" + result[0].hash;

            _this.pin(result[0].hash);

            toastr.remove();

            tncLib.emitFarmUri(
                $('#farmInfoFarmAddress').val(),
                farmJsonUrl,
                function () {
                    $("#farmInfoModal").modal("hide");
                    _this.infoModal("info" ,"Please wait for the transaction to finish.");
                },
                function (receipt) {
                    console.log(receipt);
                    $("#farmInfoModal").modal("hide");
                    _this.infoModal("success" ,"Transaction has been finished.");

                    _this.lastFarmIndex = -1;
                    _this.populateMyFarms();
                },
                function (err) {
                    toastr.remove();
                    $('#farmInfoButton').prop('disabled', false);
                    $('#farmInfoButton').html('Update');
                    let errMsg = 'An error occurred with your Update Farm Info transaction.';
                    toastr["error"](errMsg, "Error");
                    errorPopup("Error", errMsg, err.stack);
                }
            );
        });
    };

    this.updateFarm = async function(){

        $("#farmTokenAddress").html('');

        $('.currency').html(getCurrency());

        $('#farmControllerAddress').val(tncLib.account);

        switch(chain_id){
            case '64': // xDai
                var o = new Option("NIF (Unifty)", "0x1A186E7268F3Ed5AdFEa6B9e0655f70059941E11");
                $(o).html("NIF (Unifty)");
                $("#farmTokenAddress").append(o);

                var o2 = new Option("wxDai (Wrapped xDai)", "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d");
                $(o2).html("wxDai (Wrapped xDai)");
                $("#farmTokenAddress").append(o2);
                break;
            case '4d': // xDai (SPOA) Testnet
                var o = new Option("NIF (Unifty)", "0x93fEB07f2823600DD3b9EFFd9356de10C387d9d7");
                $(o).html("NIF (Unifty)");
                $("#farmTokenAddress").append(o);
                break;
            case '507': // xDai (SPOA) Testnet
                var o = new Option("NIF (Unifty)", "0x93fEB07f2823600DD3b9EFFd9356de10C387d9d7");
                $(o).html("NIF (Unifty)");
                $("#farmTokenAddress").append(o);
                break;
            case 'a4ec': // xDai (SPOA) Testnet
                var o = new Option("NIF (Unifty)", "0x3dF39266F1246128C39086E1b542Db0148A30d8c");
                $(o).html("NIF (Unifty)");
                $("#farmTokenAddress").append(o);
                break;
            case 'a86a': // xDai (SPOA) Testnet
                var o = new Option("WAVAX (Wrapped AVAX)", "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7");
                $(o).html("WAVAX (Wrapped AVAX)");
                $("#farmTokenAddress").append(o);
                break;
            case '38': // BSC MAINNET
                var o2 = new Option("bNIF (Unifty)", "0x3aD4eC50f30dAb25C60e0e71755AF6B9690B1297");
                $(o2).html("bNIF (Unifty)");
                $("#farmTokenAddress").append(o2);

                var o = new Option("WBNB (Wrapped BNB)", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");
                $(o).html("WBNB (Wrapped BNB)");
                $("#farmTokenAddress").append(o);
                break;
            case '89': // Matic Mainnet
                var o = new Option("wMatic (Wrapped Matic)", "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270");
                $(o).html("Matic (Wrapped)");
                $("#farmTokenAddress").append(o);

                break;
            case '61': // BSC TESTNET
                var o = new Option("NIF (Unifty)", "0xaC636E43b2a3e8654c993c4c5A72a2cDc41Db0FF");
                $(o).html("NIF (Unifty)");
                $("#farmTokenAddress").append(o);
                break;
            case '4': // ETHEREUM TESTNET
                var o = new Option("NIF (Unifty)", "0xb93370d549a4351fa52b3f99eb5c252506e5a21e");
                $(o).html("NIF (Unifty)");
                $("#farmTokenAddress").append(o);
                break;
            default: // ETHEREUM MAINNET
                var o = new Option("NIF (Unifty)", "0x7e291890B01E5181f7ecC98D79ffBe12Ad23df9e");
                $(o).html("NIF (Unifty)");
                $("#farmTokenAddress").append(o);
                var o2 = new Option("WETH (Wrapped Ether)", "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
                $(o2).html("WETH (Wrapped Ether)");
                $("#farmTokenAddress").append(o2);
        }

        var o = new Option("Custom...", "custom");
        $(o).html("Custom...");
        $("#farmTokenAddress").append(o);

        let fee = await web3.utils.fromWei(await window.tncLib.getFarmFee()+"");
        let nif = await web3.utils.fromWei(await window.tncLib.getFarmMinimumNif());
        
        $('#farm-builder-currency').html(getCurrency());        
        $('#farm-builder-fee').html(fee);
    };

    this.clearFarm = function(){
        $("#farmForm")[0].reset();
        $('#farmIsEdit').val(0);
        $('#farmSubmit').html('Create Farm');
        $('#farmImageUrl').val('');

        $('.imageFileDisplay').html('');
        $('.submitNewUpdate').prop('disabled', false);
    };

    this.clearFarmInfo = function(){
        $('#farmInfoFarmAddress').val();
        $("#farmInfoForm")[0].reset();
        $('#farmInfoButton').html('Update');
        $('#farmInfoImageUrl').val('');

        $('.imageFileDisplay').html('');
        $('.submitNewUpdate').prop('disabled', false);
        $('#farmInfoButton').prop('disabled', false);
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

    this.loadPage = async function (page){

        $('#farmsPage').css('display', 'none');

        switch (page){

            default:

                _this.clearFarm();
                _this.clearFarmInfo();

                _this.lastFarmIndex = -1;

                $('#farmShopAddonBuyButton').off('click');
                $('#farmShopAddonBuyButton').on('click', _this.buyShopAddon);

                $('#farmShopEditButton').off('click');
                $('#farmShopEditButton').on('click', _this.setRunMode);

                $('#farmShopAddonStep2Button').off('click');
                $('#farmShopAddonStep2Button').on('click', _this.step2ShopAddon);

                $('#farmShopAddonStep3Button').off('click');
                $('#farmShopAddonStep3Button').on('click', _this.step3ShopAddon);

                $('#farmShopEditModal').off('show.bs.modal');
                $('#farmShopEditModal').on('show.bs.modal', _this.populateShopEdit);

                $('#farmModal').off('show.bs.modal');
                $('#farmModal').on('show.bs.modal', _this.updateFarm);

                $('#shopAddonModal').off('show.bs.modal');
                $('#shopAddonModal').on('show.bs.modal', _this.populateShopAddonBuy);

                $('#shopAddonWhitelistAdminModal').off('show.bs.modal');
                $('#shopAddonWhitelistAdminModal').on('show.bs.modal', _this.populateShopAddonStep2);

                $('#shopAddonPauserModal').off('show.bs.modal');
                $('#shopAddonPauserModal').on('show.bs.modal', _this.populateShopAddonStep3);

                $('#farmInfoModal').off('show.bs.modal');
                $('#farmInfoModal').on('show.bs.modal', _this.populateEditInfo);

                $('#editStakeModal').off('show.bs.modal');
                $('#editStakeModal').on('show.bs.modal', _this.populateEditStakes);

                $('#editControllerModal').off('show.bs.modal');
                $('#editControllerModal').on('show.bs.modal', _this.populateController);

                $('#editRewardRateModal').off('show.bs.modal');
                $('#editRewardRateModal').on('show.bs.modal', _this.populateRewardRate);

                $('#farmsPage').css('display', 'grid');
                await _this.populateMyFarms();

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

    document.getElementById('farmImageFile').onchange = function () {

        _this.storeIpfsImage( document.getElementById('farmImageFile'), document.getElementById('farmImageUrl') );
    };

    document.getElementById('farmInfoImageFile').onchange = function () {

        _this.storeIpfsImage( document.getElementById('farmInfoImageFile'), document.getElementById('farmInfoImageUrl') );
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

        $('#editRewardRateButton').on('click', _this.updateRewardRate);
        $('#editControllerButton').on('click', _this.updateController);
        $('#editStakeButton').on('click', _this.updateStakes);
        $('#farmInfoButton').on('click', _this.updateFarmInfo);

        _this.defaultSocialMediaRow = $(".farmSocialMediaGroup").first().clone();
        
        $('#farmCustomTokenAddress').on('change', async function(){
            let token = $(this).val().trim();
            if(await web3.utils.isAddress(token)){
                try {
                    let symbol = await tncLib.tokenSymbolErc20(token);
                    $('#farmCustomTokenAddressInfo').text('Selected token: ' + symbol);
                }catch (e){
                    $('#farmCustomTokenAddressInfo').text('No valid token!');
                }
            }
            else{
                $('#farmCustomTokenAddressInfo').text('Invalid token address!');
            }
        });

        $('#farmTokenAddress').on('change', function(){

            if($(this).val() == 'custom'){
                $('#farmCustomTokenAddressWrapper').css('display', 'block');
            }else{
                $('#farmCustomTokenAddressWrapper').css('display', 'none');
            }

        });

        $('#farmSubmit').on('click', async function(){

            await _this.newFarm();

        });

        $('#myFarmsButton').on('click', function(){
            _this.loadPage('myFarms');
        });

        await web3.eth.subscribe("newBlockHeaders", async (error, event) => {
            if (!error) {
                return;
            }
            console.log(error);
        });

        
        $("#farmModal [data-toggle='popover']").each(function(){
            $(this).popover();
        })

        $(".farmSocialMediaAdd").on("click", async function () {
          let socialMediaWrapper = $(this).siblings(".farmSocialMediaGroupWrapper");
          let socialMediaFields = socialMediaWrapper.find(".farmSocialMediaGroup").last().clone();

          if($(socialMediaFields).find("option").length == 1){
            //Prevent from creating more dropdowns than there are social media options  
            return;
          }

          socialMediaWrapper.find('select[name="socialMediaName[]"]').each(function (i) {
            removeOption(this);
            socialMediaFields
              .find('option[value="' + $(this).val() + '"]')
              .remove();
          });

          if (socialMediaFields.find('input[type="text"]').val()) {
            socialMediaFields.find('input[type="text"]').val("");
            socialMediaWrapper.find(".farmSocialMediaGroup").last().find("select").attr("disabled", "true");
            socialMediaWrapper.find(".farmSocialMediaGroup").last().find("input").prop("disabled", true);

            socialMediaFields.find("select").removeAttr("disabled");
            socialMediaFields.find("input").prop("disabled", false);
            socialMediaWrapper.append(socialMediaFields);

            if($(socialMediaFields).find("option").length == 1){
                $(this).fadeOut();
            }

            socialMediaFields.find(".removeSocial").on("click", function () {
              removesSocial(this);
            });
          }
        });

        $(".removeSocial").on("click", function () {
          removesSocial(this);
        });

        //Remove option from dropdown if it is already selected
        function removeOption(el) {
          //el is select
          let option = $(el).val();
          $(el).parent().siblings().find('[name="socialMediaName[]"]').each(function () {
            if ($(this).find(":selected").val() != option) {
              $(this)
                .find('option[value="' + option + '"]')
                .remove();
            }
          });
        }

        function reAddOptions(el){
            //el is remove button

            let option = $(el)
            .parent()
            .find("select")
            .find(":selected")
            .text();

            $(el).parent().siblings().find('[name="socialMediaName[]"]').each(function(){
                let optionString = "<option value=" + option + ">" + option + "</option>";
                $(this).append(optionString);
            })
        }
        
        window.removesSocial = function(el){
            //el is remove button         
            if ($(el).parent().siblings().length > 0) {

                if($(el).parent().siblings().length == 1){
                    //Re enabling the dropdown when only one is available
                    $(el).parent().siblings().find("select").removeAttr("disabled");
                    $(el).parent().siblings().find("input").prop("disabled", false);
                }

                let attr = $(el).parent().find("select").attr("disabled")
                if (typeof attr !== 'undefined' && attr !== false) {
                    
                    reAddOptions(el);
                }                

              $(el).parent().remove();
              

              $(".farmSocialMediaAdd").fadeIn();
            }
        }

        //Setting up the range slider
        let range = document.querySelector(".range");
        let bubble = document.querySelector(".bubble");
        let currentTick = 0;
        let bubbleValue = 0;

        let defaultSliderValue = 86400 //Setting the default value
        
        range.value = defaultSliderValue * 10; 
        range.addEventListener("input", () => {
            setBubble();
            $("#farmEditRewardRate").val(bubbleValue)
        });
        setBubble();

        function setBubble() {
          let val = range.value;

          let min = range.min ? range.min : 0;
          let max = range.max ? range.max : 100;
          let step = range.step;
          let newVal = Number(((val - min) * 100) / (max - min));

          currentTick = val / step;

          if (currentTick <= 10) {
            bubbleValue = val / 10;
          } else {
            bubbleValue = step * ((currentTick - 10) * 10);
          }

          bubble.innerHTML = bubbleValue;          
          bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
        }
        
        $("#farmEditRewardRate").change(function(){
            setRewardRate();

            let userInput = $("#farmEditRewardRate").val();

            //Multiplication is neccesary because of the way the nonlinear input works
            if(userInput * 10 < Number(range.min)){
              bubble.style.left = '8px'
            }
            //The number is the middle value in between the ranges values. The ones displayed are a bit different because of the way the nonlinear input works
            else if(userInput > 86400 && userInput <= 475200){
                range.value = 864000;
            }
            else if(userInput > 475200 && userInput <= 1296000){
                range.value = 950400;
            }
            else if(userInput > 1296000 && userInput <= 2160000){
                range.value = 1036800;
            }
            else if(userInput > 2160000 && userInput <= 3024000){
                range.value = 1123200;
            }
            else if(userInput > 3024000 && userInput <= 3888000){
                range.value = 1209600;
            }
            else if(userInput > 3888000 && userInput <= 4752000){
                range.value = 1296000;
            }
            else if(userInput > 4752000 && userInput <= 5616000){
                range.value = 1382400;
            }
            else if(userInput > 5616000 && userInput <= 6480000){
                range.value = 1468800;
            }
            else if(userInput > 6480000 && userInput <= 7344000){
                range.value = 1555200;
            }
            else if(userInput > 7344000){
                range.value = 1641600;
                bubble.style.left = 'calc(100% + -7px)'
            }
            else if(userInput * 10 > Number(range.max)){
                bubble.style.left = 'calc(100% + -7px)'
            }

            setBubble();
            bubble.innerHTML = userInput;
        });

        window.setRewardRate = function() {
          let input = $("#farmEditRewardRate");
          let userValue = Number(input.val());

          if (userValue <= 0 || isNaN(userValue)) {
            $(range).attr({
              min: defaultSliderValue,
              max: defaultSliderValue * 20,
              step: defaultSliderValue,
            });
            range.value = defaultSliderValue * 10;

            input.val(defaultSliderValue);
          } else {
            range.value = userValue * 10;
          }
          
          setBubble();
          bubble.innerHTML = $("#farmEditRewardRate").val();
          
        }

        $("#rangeMin").on("click", function(){
            range.value = $(range).attr("min");
          setBubble();
          $("#farmEditRewardRate").val(bubble.innerHTML);

        })

        $("#rangeMax").on("click", function(){
            range.value = $(range).attr("max");
          setBubble();
          $("#farmEditRewardRate").val(bubble.innerHTML);


        })
        //------------------------------------
        
        $(".farm-builder-checkbox input[type=checkbox]").change(function(){
            if($(this).is(':checked')){
                $("#farmSubmit").removeClass("disabled")
            }
            else{
                $("#farmSubmit").addClass("disabled")
            }
        })
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
    });
}
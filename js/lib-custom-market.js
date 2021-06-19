function TncLibCustomMarket(){

    this.getUrlParam = function(param_name) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        return urlParams.get(param_name);
    };

    // ETHEREUM RINKEBY
    if(chain_id === "4") {

        this.genesis = new web3.eth.Contract(customMarketGenesisABI, '0xbBB89e27Ed8A7657E4d5171Af8E1a38A2F35DE5c', {from: this.account});
        this.account = '';

        // xDAI MAINNET
    } else if(chain_id === "64") {

        this.genesis = new web3.eth.Contract(customMarketGenesisABI, '0xe3a9110Ef5d8A2291f006a5cb8e778321E902D43', {from: this.account});
        this.account = '';

        // xDAI / POA (Sokol) TESTNET
    } else if(chain_id === "4d") {

        this.genesis = new web3.eth.Contract(customMarketGenesisABI, '', {from: this.account});
        this.account = '';

        // Matic
    } else if(chain_id === "89") {

        this.genesis = new web3.eth.Contract(customMarketGenesisABI, '0xe9E286a9788354E0114E5eB7b4b182027A3d0741', {from: this.account});
        this.account = '';

        // BINANCE TESTNET
    } else if(chain_id === "61") {

        this.genesis = new web3.eth.Contract(customMarketGenesisABI, '', {from: this.account});
        this.account = '';

        // Moonbase Alpha
    } else if(chain_id === "507") {

        this.genesis = new web3.eth.Contract(customMarketGenesisABI, '0x6adA7566eC6C3073Cf9180AC9c373C78047D798d', {from: this.account});
        this.account = '';

        // CELO
    } else if(chain_id === "a4ec") {

        this.genesis = new web3.eth.Contract(customMarketGenesisABI, '0xC2bC267EF4EA7Db7bD0F4F924A04A9eaE64D8eE3', {from: this.account});
        this.account = '';

        // BSC MAINNET
    } else if(chain_id === "38") {

        this.genesis = new web3.eth.Contract(customMarketGenesisABI, '0xAF1df7b55103b1a969FC966840d516EF79E58b9F', {from: this.account});
        this.account = '';

        // AVALANCHE
    } else if(chain_id === "a86a") {

        this.genesis = new web3.eth.Contract(customMarketGenesisABI, '0x3BC1cFFe6e6A16045eE52222f7f9fb89562e50D6', {from: this.account});
        this.account = '';

    } else{

        this.genesis = new web3.eth.Contract(customMarketGenesisABI, '0x5aE7A7059C597F28a451df6e2aF668D6b96ABBd0', {from: this.account});
        this.account = '';

    }

    this.marketInstances = {};
    this.swapInstances = {};
    this.wrapInstances = {};

    let _self = this;

    this.setAccount = function(address){
        this.account = address;
    };

    this.contractInstancesCache = function(address, type){

        switch(type){

            case 'market':
                if(typeof _self.marketInstances[address] == "undefined"){
                    _self.marketInstances[address] = new web3.eth.Contract(customMarketABI, address, {from: _self.account});
                    return _self.marketInstances[address];
                }
                else
                {
                    return _self.marketInstances[address];
                }
                break;
            case 'swap':
                if(typeof _self.swapInstances[address] == "undefined"){
                    _self.swapInstances[address] = new web3.eth.Contract(customSwapABI, address, {from: _self.account});
                    return _self.swapInstances[address];
                }
                else
                {
                    return _self.swapInstances[address];
                }
                break;
            case 'wrap':
                if(typeof _self.wrapInstances[address] == "undefined"){
                    _self.wrapInstances[address] = new web3.eth.Contract(customWrapABI, address, {from: _self.account});
                    return _self.wrapInstances[address];
                }
                else
                {
                    return _self.wrapInstances[address];
                }
                break;
        }

        return null;
    };

    this.getMyMarketsLength = async function(){

        await sleep(sleep_time);

        return await this.genesis.methods.getUserMarketsLength(this.account).call({from:this.account});
    };

    this.getMyMarket = async function(index){

        await sleep(sleep_time);
        let wrapperAddress = await this.genesis.methods.userMarkets(this.account, index).call({from:this.account});
        console.log("my market: ", index, " - ", wrapperAddress);
        await sleep(sleep_time);
        let wrap = _self.contractInstancesCache(wrapperAddress, 'wrap');
        let marketUri = await wrap.methods.marketUri().call({from:this.account});

        let out = {wrapperAddress: wrapperAddress, uri: marketUri};

        return out;
    };

    this.getMarketContractAddresses = async function(wrapperAddress){

        await sleep(sleep_time);
        let index = parseInt(await this.genesis.methods.wrapperIndex(wrapperAddress).call({from:this.account}));
        let marketAddress = await this.genesis.methods.markets(index+1).call({from:this.account});
        let swapAddress = await this.genesis.methods.markets(index+2).call({from:this.account});

        return {market: marketAddress, swap: swapAddress};
    };

    this.getMarketUri = async function(wrapperAddress){

        await sleep(sleep_time);

        let wrap = _self.contractInstancesCache(wrapperAddress, 'wrap');
        return await wrap.methods.marketUri().call({from:this.account});
    };

    this.setAllowedWallets = async function(address, status, wrapperAddress, preCallback, postCallback, errCallback){

        let wrap = _self.contractInstancesCache(wrapperAddress, 'wrap');

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await wrap.methods.setAllowedWallets(address, status).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log('Error at gas estimation: ', e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        wrap.methods.setAllowedWallets(address, status)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                console.log(e);
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.setAllowedNfts = async function(erc1155Address, id, status, wrapperAddress, preCallback, postCallback, errCallback){

        let wrap = _self.contractInstancesCache(wrapperAddress, 'wrap');

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await wrap.methods.setAllowedNfts(erc1155Address, id, status).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log('Error at gas estimation: ', e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        wrap.methods.setAllowedNfts(erc1155Address, id, status)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                console.log(e);
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.setAllowedCollection = async function(erc1155Address, status, wrapperAddress, preCallback, postCallback, errCallback){

        let wrap = _self.contractInstancesCache(wrapperAddress, 'wrap');

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await wrap.methods.setAllowedCollection(erc1155Address, status).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log('Error at gas estimation: ', e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        wrap.methods.setAllowedCollection(erc1155Address, status)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                console.log(e);
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.setCollectionBlockStatus = async function(erc1155Address, status, wrapperAddress, preCallback, postCallback, errCallback){

        let wrap = _self.contractInstancesCache(wrapperAddress, 'wrap');

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await wrap.methods.setCollectionBlockStatus(erc1155Address, status).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log('Error at gas estimation: ', e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        wrap.methods.setCollectionBlockStatus(erc1155Address, status)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                console.log(e);
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.setNftBlockStatus = async function(erc1155Address, id, status, wrapperAddress, preCallback, postCallback, errCallback){

        let wrap = _self.contractInstancesCache(wrapperAddress, 'wrap');

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await wrap.methods.setNftBlockStatus(erc1155Address, id, status).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log('Error at gas estimation: ', e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        wrap.methods.setNftBlockStatus(erc1155Address, id, status)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                console.log(e);
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.setWalletBlockStatus = async function(address, status, wrapperAddress, preCallback, postCallback, errCallback){

        let wrap = _self.contractInstancesCache(wrapperAddress, 'wrap');

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await wrap.methods.setWalletBlockStatus(address, status).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log('Error at gas estimation: ', e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        wrap.methods.setWalletBlockStatus(address, status)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                console.log(e);
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.setMarketUri = async function(wrapperAddress, uri, preCallback, postCallback, errCallback){

        let wrap = _self.contractInstancesCache(wrapperAddress, 'wrap');

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await wrap.methods.setMarketUri(uri).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log('Error at gas estimation: ', e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        wrap.methods.setMarketUri(uri)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                console.log(e);
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.stake = async function(tier, wrapperAddress, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.genesis.methods.stake(tier, wrapperAddress).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log('Error at gas estimation: ', e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.genesis.methods.stake(tier, wrapperAddress)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                console.log(e);
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.unstake = async function(wrapperAddress, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.genesis.methods.unstake(wrapperAddress).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log('Error at gas estimation: ', e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.genesis.methods.unstake(wrapperAddress)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                console.log(e);
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.getCurrentTier = async function(address, wrapperAddress){

        await sleep(sleep_time);
        return await this.genesis.methods.userTier(address, wrapperAddress).call({from:this.account})
    };

    this.getStakingAmounts = async function(){

        await sleep(sleep_time);
        let nifStakeTier1 = web3.utils.toBN(await this.genesis.methods.nifStakeTier1().call({from:this.account}));
        await sleep(sleep_time);
        let nifStakeTier2 = web3.utils.toBN(await this.genesis.methods.nifStakeTier2().call({from:this.account}));
        await sleep(sleep_time);
        let nifStakeTier3 = web3.utils.toBN(await this.genesis.methods.nifStakeTier3().call({from:this.account}));

        return {tier1: nifStakeTier1, tier2: nifStakeTier2, tier3: nifStakeTier3};
    };

    this.userNoStakes = async function(address, wrapperAddress){

        await sleep(sleep_time);
        return await this.genesis.methods.userNoStakes(address, wrapperAddress).call({from:this.account});
    };

    this.isStakingEnabled = async function(){

        let a = await this.getStakingAmounts();
        let one = web3.utils.toBN("1");
        let two = web3.utils.toBN("2");
        let three = web3.utils.toBN("3");
        return !( a.tier1.eq(one) && a.tier2.eq(two) && a.tier3.eq(three) );
    };

    this.newMarket = async function(
        controller,
        marketFee,
        marketSwapFee,
        tier,
        uri,
        stakingEnabled,
        preCallback,
        postCallback,
        errCallback)
    {

        console.log("fees: ", marketFee, " - ", marketSwapFee);

        let fee = 0;

        if(!stakingEnabled) {

            let haveWildcard = await this.iHaveAnyWildcard();
            await sleep(sleep_time);
            let nifBalance = web3.utils.toBN(await tncLib.nif.methods.balanceOf(this.account).call({from: this.account}));
            let feeMinNif = web3.utils.toBN(await this.getMinimumNif());

            console.log('Wilcard: ', haveWildcard, ' enough nif: ', nifBalance.lt(feeMinNif));

            if (!haveWildcard && nifBalance.lt(feeMinNif)) {
                fee = await this.feeEth();
            }
        }

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.genesis.methods.newMarket(
                controller,
                marketFee,
                marketSwapFee,
                tier,
                uri).estimateGas({
                from:this.account,
                value: ""+fee
            });
        }catch(e){
            console.log('Error at gas estimation: ', e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.genesis.methods.newMarket(
            controller,
            marketFee,
            marketSwapFee,
            tier,
            uri)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 ),
                value: ""+fee
            })
            .on('error', async function(e){
                console.log(e);
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.feeEth = async function(){
        await sleep(sleep_time);
        return await this.genesis.methods.marketFee().call({from:this.account});
    };

    this.getMinimumNif = async function(){
        await sleep(sleep_time);
        return await this.genesis.methods.marketFeeMinimumNif().call({from:this.account});
    };

    this.iHaveAnyWildcard = async function(){
        await sleep(sleep_time);
        return await this.genesis.methods.iHaveAnyWildcard().call({from:this.account});
    };

    this.saleExists = async function(account, index, marketAddress){
        await sleep(sleep_time);
        let market = _self.contractInstancesCache(marketAddress, 'market');
        return await market.methods.saleExists(account, index).call({from:this.account});
    };

    this.getSwapRequestsLength = async function(account, swapAddress){

        await sleep(sleep_time);
        let swap = _self.contractInstancesCache(swapAddress, 'swap');
        return await swap.methods.getSwapRequestsLength(account).call({from:this.account});
    };

    this.getSwapRequestsListLength = async function(account, swapAddress){

        await sleep(sleep_time);
        let swap = _self.contractInstancesCache(swapAddress, 'swap');
        return await swap.methods.getSwapRequestsListLength(account).call({from:this.account});
    };

    this.getSwapRequest = async function(account, index, swapAddress){

        await sleep(sleep_time);
        let swap = _self.contractInstancesCache(swapAddress, 'swap');
        return await swap.methods.getSwapRequest(account, index).call({from:this.account});
    };

    this.getSwapRequestListEntry = async function(account, index, swapAddress){

        await sleep(sleep_time);
        let swap = _self.contractInstancesCache(swapAddress, 'swap');
        return await swap.methods.getSwapRequestListEntry(account, index).call({from:this.account});
    };

    this.getSwapExists = async function(seller0, seller1, index0, swapAddress){

        await sleep(sleep_time);
        let _index0 = parseInt(index0);
        let swap = _self.contractInstancesCache(swapAddress, 'swap');
        return await swap.methods.swapStakers( seller0, seller1, '0x'+web3.utils.padLeft(_index0.toString(16), 64) ).call({from:this.account});
    };

    this.getAsksLengths = async function(account, marketAddress){

        if(account == ''){
            account = '0x0000000000000000000000000000000000000000';
        }

        await sleep(sleep_time);
        let market = _self.contractInstancesCache(marketAddress, 'market');
        return await market.methods.getAsksLengths(account).call({from:this.account});
    };

    this.getAsk = async function(index, account, marketAddress){

        await sleep(sleep_time);

        let askIndex = 0;

        let market = _self.contractInstancesCache(marketAddress, 'market');

        if(account != ''){

            askIndex = await market.methods.userAsks(account, index).call({from:this.account});
        }
        else
        {
            askIndex = await market.methods.publicAsks(index).call({from:this.account});
        }

        if(askIndex != 0) {

            return {ask: await this.getAskBase(askIndex, marketAddress), index: askIndex};
        }

        return null;
    };

    this.getCategoriesLength = async function(category, wrapAddress){

        await sleep(sleep_time);

        let wrap = _self.contractInstancesCache(wrapAddress, 'wrap');
        return await wrap.methods.getCategoriesLength(category).call({from: this.account});
    }

    this.getCategory = async function(category, index, wrapAddress){

        await sleep(sleep_time);

        let _cat = parseInt(category);
        let wrap = _self.contractInstancesCache(wrapAddress, 'wrap');
        return await wrap.methods.categories( '0x'+web3.utils.padLeft(_cat.toString(16), 64), index ).call({from: this.account});
    }

    this.getAskBase = async function(askIndex, marketAddress){

        await sleep(sleep_time);

        let market = _self.contractInstancesCache(marketAddress, 'market');
        return await market.methods.getAsk(askIndex).call({from: this.account});
    }

    this.getFunds = async function(owner, token, marketAddress){

        await sleep(sleep_time);

        let market = _self.contractInstancesCache(marketAddress, 'market');
        return await market.methods.funds(owner, token).call({from: this.account});
    }

    this.getSetupFeeAddress = async function(wrapperAddress){

        await sleep(sleep_time);

        let addresses = await this.getMarketContractAddresses(wrapperAddress);

        let market = _self.contractInstancesCache(addresses.market, 'market');
        return await market.methods.feeAddress().call({from: this.account});
    };

    this.getSetupFees = async function(wrapperAddress){

        await sleep(sleep_time);

        let addresses = await this.getMarketContractAddresses(wrapperAddress);

        let market = _self.contractInstancesCache(addresses.market, 'market');
        return await market.methods.fee().call({from: this.account});
    };

    this.getSetupSwapFeeAddress = async function(wrapperAddress){

        await sleep(sleep_time);

        let addresses = await this.getMarketContractAddresses(wrapperAddress);

        let market = _self.contractInstancesCache(addresses.swap, 'swap');
        return await market.methods.feeAddress().call({from: this.account});
    };

    this.getSetupSwapFees = async function(wrapperAddress){

        await sleep(sleep_time);

        let addresses = await this.getMarketContractAddresses(wrapperAddress);

        let market = _self.contractInstancesCache(addresses.swap, 'swap');
        return await market.methods.fee().call({from: this.account});
    };

    this.setup = async function(marketFee, controller, wrapperAddress, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let gas = 0;

        let addresses = await this.getMarketContractAddresses(wrapperAddress);
        let market = _self.contractInstancesCache(addresses.market, 'market');

        try{

            gas = await market.methods.setup(marketFee, controller).estimateGas({
                from:this.account,
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        market.methods.setup(marketFee, controller)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.swapSetup = async function(marketFee, controller, wrapperAddress, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let gas = 0;

        let addresses = await this.getMarketContractAddresses(wrapperAddress);
        let swap = _self.contractInstancesCache(addresses.swap, 'swap');

        try{

            gas = await swap.methods.setup(marketFee, controller).estimateGas({
                from:this.account,
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        swap.methods.setup(marketFee, controller)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.getFees = async function(token, marketAddress){

        await sleep(sleep_time);

        let market = _self.contractInstancesCache(marketAddress, 'market');
        return await market.methods.controllerFunds(token).call({from: this.account});
    }

    this.getSwapFees = async function(token, swapAddress){

        await sleep(sleep_time);

        let market = _self.contractInstancesCache(swapAddress, 'swap');
        return await market.methods.controllerFunds(token).call({from: this.account});
    }

    this.getMarketUri = async function(wrapperAddress){

        await sleep(sleep_time);

        let market = _self.contractInstancesCache(wrapperAddress, 'wrap');
        return await market.methods.marketUri().call({from: this.account});
    }

    this.getRoyalties = async function(erc1155Address, id, marketAddress){

        await sleep(sleep_time);

        let _id = parseInt(id);
        let market = _self.contractInstancesCache(marketAddress, 'market');
        return await market.methods.royalties( erc1155Address, '0x'+web3.utils.padLeft(_id.toString(16), 64) ).call({from: this.account});
    }

    this.sell = async function(erc1155Address, id, amount, token, collectionPrice, swapMode, category, wrapAddress, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let gas = 0;

        let setup = [collectionPrice, swapMode, category];

        let wrap = _self.contractInstancesCache(wrapAddress, 'wrap');

        try{

            gas = await wrap.methods.sell(erc1155Address, id, amount, token, setup).estimateGas({
                from:this.account,
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        wrap.methods.sell(erc1155Address, id, amount, token, setup)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback(transactionHash);
            })
            .on("receipt", function (receipt) {
                console.log("Sell order placed.");
                postCallback(receipt);
            });
    };

    this.setRoyalties = async function(erc1155Address, id, royaltyPercent, marketAddress, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let gas = 0;

        let market = _self.contractInstancesCache(marketAddress, 'market');

        try{

            gas = await market.methods.setRoyalty(erc1155Address, id, royaltyPercent).estimateGas({
                from:this.account,
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        market.methods.setRoyalty(erc1155Address, id, royaltyPercent)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.buy = async function(seller, amount, index, marketAddress, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let market = _self.contractInstancesCache(marketAddress, 'market');

        let gas = 0;

        try{

            gas = await market.methods.buy(seller, ""+amount, ""+index).estimateGas({
                from: this.account
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        market.methods.buy(seller, ""+amount, ""+index)
            .send({
                from: this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback(transactionHash);
            })
            .on("receipt", function (receipt) {
                console.log("Buy order placed.");
                postCallback(receipt);
            });
    };

    this.isWrapAdmin = async function(address, wrapAddress){

        await sleep(sleep_time);

        let wrap = _self.contractInstancesCache(wrapAddress, 'wrap');
        return await wrap.methods.isWhitelistAdmin(address).call({from:this.account});
    };

    this.cancelAdmin = async function(index, wrapAddress, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let wrap = _self.contractInstancesCache(wrapAddress, 'wrap');

        let gas = 0;

        try{

            gas = await wrap.methods.cancelAskAdmin(""+index).estimateGas({
                from: this.account
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        wrap.methods.cancelAskAdmin(""+index)
            .send({
                from: this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.cancel = async function(index, address, wrapAddress, preCallback, postCallback, errCallback){

        if(await this.isWrapAdmin(address, wrapAddress)){
            await this.cancelAdmin(index, wrapAddress, preCallback, postCallback, errCallback);
            return;
        }

        await sleep(sleep_time);

        let wrap = _self.contractInstancesCache(wrapAddress, 'wrap');

        let gas = 0;

        try{

            gas = await wrap.methods.cancelAsk(""+index).estimateGas({
                from: this.account
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        wrap.methods.cancelAsk(""+index)
            .send({
                from: this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.withdrawFunds = async function(token, marketAddress, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let market = _self.contractInstancesCache(marketAddress, 'market');

        let gas = 0;

        try{

            gas = await market.methods.withdrawBalance(token).estimateGas({
                from: this.account
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        market.methods.withdrawBalance(token)
            .send({
                from: this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.withdrawSwapFunds = async function(token, swapAddress, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let market = _self.contractInstancesCache(swapAddress, 'swap');

        let gas = 0;

        try{

            gas = await market.methods.withdrawFee(token).estimateGas({
                from: this.account
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        market.methods.withdrawFee(token)
            .send({
                from: this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.withdrawFee = async function(token, marketAddress, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let market = _self.contractInstancesCache(marketAddress, 'market');

        let gas = 0;

        try{

            gas = await market.methods.withdrawFee(token).estimateGas({
                from: this.account
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        market.methods.withdrawFee(token)
            .send({
                from: this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback();
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.requestSwap = async function(index0, index1, nif, swapAddress, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let swap = _self.contractInstancesCache(swapAddress, 'swap');

        let gas = 0;

        try{

            gas = await swap.methods.requestSwap(index0, index1, nif).estimateGas({
                from: this.account
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        swap.methods.requestSwap(index0, index1, nif)
            .send({
                from: this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback(transactionHash);
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.acceptSwap = async function(swapIndex, swapAddress, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let swap = _self.contractInstancesCache(swapAddress, 'swap');

        let gas = 0;

        try{

            gas = await swap.methods.acceptSwap(swapIndex).estimateGas({
                from: this.account
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        swap.methods.acceptSwap(swapIndex)
            .send({
                from: this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback(transactionHash);
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

    this.cancelSwapRequest = async function(seller, swapIndex, swapAddress, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let swap = _self.contractInstancesCache(swapAddress, 'swap');

        let gas = 0;

        try{

            gas = await swap.methods.cancelSwapRequest(seller, swapIndex).estimateGas({
                from: this.account
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        swap.methods.cancelSwapRequest(seller, swapIndex)
            .send({
                from: this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 )
            })
            .on('error', async function(e){
                errCallback(e);
            })
            .on('transactionHash', async function(transactionHash){
                preCallback(transactionHash);
            })
            .on("receipt", function (receipt) {
                postCallback(receipt);
            });
    };

}
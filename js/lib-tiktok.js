function TncLibTikTok(){

    this.getUrlParam = function(param_name) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        return urlParams.get(param_name);
    };

    // ETHEREUM RINKEBY
    if(chain_id === "4") {

        this.account = '';

        // xDAI
    } else if(chain_id === "64") {

        this.account = '';

        // Matic
    } else if(chain_id === "89") {

        this.account = '';

        // BINANCE
    } else if(chain_id === "38") {

        this.tiktok = new web3.eth.Contract(tiktokABI, '0x31AEb2e30ff9c51f404D2189E097f09ABF42FAb3', {from: this.account});
        this.account = '';

    } else{

        this.account = '';

    }

    this.setAccount = function(address){
        this.account = address;
    };

    this.minNif = async function(){
        await sleep(sleep_time);
        return await this.tiktok.methods.minNif().call({from:this.account});
    };

    this.minFunds = async function(){
        await sleep(sleep_time);
        return await this.tiktok.methods.minFunds().call({from:this.account});
    };

    this.tikTokers = async function(handle){
        await sleep(sleep_time);
        return await this.tiktok.methods.tikTokers(handle).call({from:this.account});
    };

    this.tikTokerNumber = async function(handle){
        await sleep(sleep_time);
        return await this.tiktok.methods.tikTokerNumber(handle).call({from:this.account});
    };

    this.authorized = async function(handle){
        await sleep(sleep_time);
        return 0 != await this.tiktok.methods.authorized(handle).call({from:this.account});
    };

    this.iHaveAnyWildcard = async function(){
        await sleep(sleep_time);
        return await this.tiktok.methods.iHaveAnyWildcard().call({from:this.account});
    };

    this.stake = async function(tikToker, funds, preCallback, postCallback, errCallback){

        let minNif = await this.minNif();

        if(await this.iHaveAnyWildcard()){

            minNif = "0";
        }

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.tiktok.methods.stake(tikToker, minNif).estimateGas({
                from:this.account,
                value: funds
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.tiktok.methods.stake(tikToker, minNif)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 ),
                value: funds
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

    this.unstake = async function(tikToker, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.tiktok.methods.unstake(tikToker).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.tiktok.methods.unstake(tikToker)
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

    this.addGasFunds = async function(tikToker, funds, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.tiktok.methods.addGasFunds(tikToker).estimateGas({
                from:this.account,
                value: funds
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.tiktok.methods.addGasFunds(tikToker)
            .send({
                from:this.account,
                gas: gas + Math.floor( gas * 0.1 ),
                gasPrice: Number(price) + Math.floor( Number(price) * 0.1 ),
                value: funds
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

}
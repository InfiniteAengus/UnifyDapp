function TncLibGov(){

    this.getUrlParam = function(param_name) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        return urlParams.get(param_name);
    };

    // ETHEREUM RINKEBY
    if(chain_id === "4") {

        this.gov = new web3.eth.Contract(govABI, '0x8A59bA3fb733912B4895c236A7679Ee433844d9d', {from: this.account});
        this.account = '';

    } else {

        this.gov = new web3.eth.Contract(govABI, '0x4fc279038774b065Df6A88b784280BF6F10DfA94', {from: this.account});
        this.account = '';

    }

    this.setAccount = function(address){
        this.account = address;
    };

    this.earnedConsumer = async function(consumer, account){
        await sleep(sleep_time);
        let con = new web3.eth.Contract(govConsumerABI, consumer, {from: this.account});
        return await con.methods.earned(account).call({from:this.account});
    }

    this.earnedLiveConsumer = async function(consumer, account){
        await sleep(sleep_time);
        let con = new web3.eth.Contract(govConsumerABI, consumer, {from: this.account});
        return await con.methods.earnedLive(account).call({from:this.account});
    }

    this.peerUri = async function(consumer, peer){
        await sleep(sleep_time);
        let con = new web3.eth.Contract(govConsumerABI, consumer, {from: this.account});
        return await con.methods.peerUri(peer).call({from:this.account});
    }

    this.peerNifCap = async function(consumer, peer){
        await sleep(sleep_time);
        let con = new web3.eth.Contract(govConsumerABI, consumer, {from: this.account});
        return await con.methods.peerNifCap(peer).call({from:this.account});
    }

    this.frozen = async function(account){
        await sleep(sleep_time);
        return await this.gov.methods.frozen(account).call({from:this.account});
    };

    this.minNifStake = async function(){
        await sleep(sleep_time);
        return await this.gov.methods.minNifStake().call({from:this.account});
    };

    this.consumerCounter = async function(){
        await sleep(sleep_time);
        return await this.gov.methods.consumerCounter().call({from:this.account});
    };

    this.consumerPeerNifAllocation = async function(consumer, peer){
        await sleep(sleep_time);
        return await this.gov.methods.consumerPeerNifAllocation(consumer, peer).call({from:this.account});
    };

    this.consumers = async function(id){
        await sleep(sleep_time);
        return await this.gov.methods.consumers(id).call({from:this.account});
    };

    this.consumerInfo = async function(id){
        await sleep(sleep_time);
        return await this.gov.methods.consumerInfo(id).call({from:this.account});
    };

    this.accountInfo = async function(_account){
        await sleep(sleep_time);
        return await this.gov.methods.accountInfo(_account).call({from:this.account});
    };

    this.votesCounter = async function(pid){
        await sleep(sleep_time);
        return await this.gov.methods.votesCounter(pid).call({from:this.account});
    };

    this.mintedUntConsumer = async function(consumer){
        await sleep(sleep_time);
        return await this.gov.methods.mintedUntConsumer(consumer).call({from:this.account});
    };

    this.votes = async function(pid, id){
        await sleep(sleep_time);
        return await this.gov.methods.votes(pid, id).call({from:this.account});
    };

    this.addressProposalInfo = async function(pid){
        await sleep(sleep_time);
        return await this.gov.methods.addressProposalInfo(pid).call({from:this.account});
    };

    this.uint256ProposalInfo = async function(pid){
        await sleep(sleep_time);
        return await this.gov.methods.uint256ProposalInfo(pid).call({from:this.account});
    };

    this.getProposal = async function(i){
        await sleep(sleep_time);
        return await this.gov.methods.proposals(i).call({from:this.account});
    };

    this.earnedUnt = async function(consumer){
        await sleep(sleep_time);
        return await this.gov.methods.earnedUnt(consumer).call({from:this.account});
    };

    this.voted = async function(_id, _account){
        await sleep(sleep_time);
        return await this.gov.methods.voted(_id, _account).call({from:this.account});
    };

    this.isPausing = async function(){
        await sleep(sleep_time);
        return await this.gov.methods.isPausing().call({from:this.account});
    };

    this.graceTime = async function(){
        await sleep(sleep_time);
        return await this.gov.methods.graceTime().call({from:this.account});
    };

    this.proposalExecutionLimit = async function(){
        await sleep(sleep_time);
        return await this.gov.methods.proposalExecutionLimit().call({from:this.account});
    };

    this.proposalCount = async function(){
        await sleep(sleep_time);
        return await this.gov.methods.proposalCounter().call({from:this.account});
    };

    this.accountInfo = async function(account){
        await sleep(sleep_time);
        return await this.gov.methods.accountInfo(account).call({from:this.account});
    };

    this.stake = async function(funds, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.gov.methods.stake(funds).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.gov.methods.stake(funds)
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

    this.unstake = async function(amount, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.gov.methods.unstake(amount).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.gov.methods.unstake(amount)
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

    this.proposeAddConsumer = async function(_consumer, _sizeUnt, _rateSeconds, _startTime, _duration, _url, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.gov.methods.proposeAddConsumer(_consumer, _sizeUnt, _rateSeconds, _startTime, _duration, _url).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.gov.methods.proposeAddConsumer(_consumer, _sizeUnt, _rateSeconds, _startTime, _duration, _url)
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

    this.proposeUpdateConsumerGrant = async function(_consumer, _sizeUnt, _rateSeconds, _startTime, _duration, _url, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.gov.methods.proposeUpdateConsumerGrant(_consumer, _sizeUnt, _rateSeconds, _startTime, _duration, _url).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.gov.methods.proposeUpdateConsumerGrant(_consumer, _sizeUnt, _rateSeconds, _startTime, _duration, _url)
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

    this.proposeConsumerWhitelistPeer = async function(_consumer, _peer,_duration, _url, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.gov.methods.proposeConsumerWhitelistPeer(_consumer, _peer,_duration, _url).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.gov.methods.proposeConsumerWhitelistPeer(_consumer, _peer,_duration, _url)
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

    this.proposeRemoveConsumer = async function(_consumer,_duration, _url, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.gov.methods.proposeRemoveConsumer(_consumer,_duration, _url).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.gov.methods.proposeRemoveConsumer(_consumer,_duration, _url)
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

    this.proposeConsumerRemovePeerFromWhitelist = async function(_consumer, _peer,_duration, _url, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.gov.methods.proposeConsumerRemovePeerFromWhitelist(_consumer, _peer,_duration, _url).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.gov.methods.proposeConsumerRemovePeerFromWhitelist(_consumer, _peer,_duration, _url)
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

    this.proposeGeneral = async function(_duration, _url, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.gov.methods.proposeGeneral(_duration, _url).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.gov.methods.proposeGeneral(_duration, _url)
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

    this.proposeNumeric = async function(_type, _value, _duration, _url, preCallback, postCallback, errCallback){

        _type = 'propose' + _type[0].toUpperCase() + _type.slice(1);

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.gov.methods[_type](_value, _duration, _url).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.gov.methods[_type](_value, _duration, _url)
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

    this.vote = async function(_proposalId, _supporting, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.gov.methods.vote(_proposalId, _supporting).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.gov.methods.vote(_proposalId, _supporting)
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

    this.execute = async function(_proposalId, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.gov.methods.execute(_proposalId).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.gov.methods.execute(_proposalId)
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

    this.allocate = async function(consumer, peer, preCallback, postCallback, errCallback){

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await this.gov.methods.allocate(consumer, peer).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.gov.methods.allocate(consumer, peer)
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

    this.withdraw = async function(consumer, preCallback, postCallback, errCallback){

        let con = new web3.eth.Contract(govConsumerABI, consumer, {from: this.account});

        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await con.methods.withdraw().estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e.message);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        con.methods.withdraw()
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
}
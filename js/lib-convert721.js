function TncLibConvert721() {

    this.getUrlParam = function (param_name) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        return urlParams.get(param_name);
    };

    // ETHEREUM RINKEBY
    if (chain_id === "4") {

        this.conv721 = new web3.eth.Contract(converter721To1155ABI, '0x8810A7f954792F2Cf938F9C8e6C87D4df4c8f1Ed', {from: this.account});
        this.uniftyverse721 = "0x2fA2725bA1A20fE914835893835CBCd472da5E9C";

        // xDAI MAINNET
    } else if (chain_id === "64") {

        this.conv721 = new web3.eth.Contract(converter721To1155ABI, '0x5dC95fEAA85DEA706fD8C30e20cd5f01F14733eB', {from: this.account});
        this.uniftyverse721 = "0x6fd506788E88E3be54Bd179B10d9F2C76BaA0dD9";

        // CELO (testnet: aef3)
    } else if (chain_id === "a4ec") {

        this.conv721 = new web3.eth.Contract(converter721To1155ABI, '0x14a870A37116EB70Bab88739a99a529cfac04C9d', {from: this.account});
        this.uniftyverse721 = "0xEB2F7E7162f8D6FefD3ae7E5e1Ab63BA192FFBa9";

        // xDAI / POA (Sokol) TESTNET
    } else if (chain_id === "4d") {

        this.conv721 = new web3.eth.Contract(converter721To1155ABI, '', {from: this.account});
        this.uniftyverse721 = "";

        // Matic
    } else if (chain_id === "89") {

        this.conv721 = new web3.eth.Contract(converter721To1155ABI, '0xf6792c69e89149815492dBca017c4B45CFF1f789', {from: this.account});
        this.uniftyverse721 = "0x91Be745b53F3d1871B86Da21285b50482b691e70";

        // BINANCE TESTNET
    } else if (chain_id === "61") {

        this.conv721 = new web3.eth.Contract(converter721To1155ABI, '', {from: this.account});
        this.uniftyverse721 = "";

        // BINANCE MAINNET
    } else if (chain_id === "38") {

        this.conv721 = new web3.eth.Contract(converter721To1155ABI, '0xCe24782557508f7A4b5dFf0972ef6359583F5acF', {from: this.account});
        this.uniftyverse721 = "0xCe24782557508f7A4b5dFf0972ef6359583F5acF";

        // assuming ethereum mainnet if nothing else specified

        // MOONBASE ALPHA
    } else if (chain_id === "507") {

        this.conv721 = new web3.eth.Contract(converter721To1155ABI, '0x1E4fF0af2e269B659D3D18b984036d93B99B28d2', {from: this.account});
        this.uniftyverse721 = "0xB62b9EA9453942dC884190b07D36C79727C59505";

        // assuming ethereum mainnet if nothing else specified

        // AVALANCHE
    } else if (chain_id === "a86a") {

        this.conv721 = new web3.eth.Contract(converter721To1155ABI, '0xa5B0C23Be6Eba8718091EE7671c9c05f2E8Af50f', {from: this.account});
        this.uniftyverse721 = "0xFe95f03cF7f9408a3599c402e98A1e947fDe5412";

        // assuming ethereum mainnet if nothing else specified

        // ethereum
    } else {

        this.conv721 = new web3.eth.Contract(converter721To1155ABI, '0x36db3f09cb7ba5df73db4a919e357a74e50ec4ef', {from: this.account});
        this.uniftyverse721 = "0x55d68cbd62E180739513caA39E3179Ec7EB4a849";

    }

    this.setAccount = function (address) {
        this.account = address;
    };

    this.convert = async function(eip721Address, tokenId, fractions, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let gas = 0;

        try{

            gas = await this.conv721.methods.convert(eip721Address, tokenId, fractions).estimateGas({
                from:this.account,
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.conv721.methods.convert(eip721Address, tokenId, fractions)
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

    this.undo = async function(tokenId, preCallback, postCallback, errCallback){

        await sleep(sleep_time);

        let gas = 0;

        try{

            gas = await this.conv721.methods.undo(tokenId).estimateGas({
                from:this.account,
            });

        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        this.conv721.methods.undo(tokenId)
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

    this.erc721SetApprovalForAll = async function(operator, approved, erc721Address, preCallback, postCallback, errCallback){

        let erc721 = new web3.eth.Contract( erc721ABI, erc721Address, {from:this.account} );
        let gas = 0;

        try {
            await sleep(sleep_time);
            gas = await erc721.methods.setApprovalForAll(operator, approved).estimateGas({
                from:this.account
            });
        }catch(e){
            console.log(e);
            errCallback(e);
            return;
        }

        const price = await web3.eth.getGasPrice();

        erc721.methods.setApprovalForAll(operator, approved)
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

    this.erc721IsApprovedForAll = async function(owner, operator, erc721Address){

        let erc721 = new web3.eth.Contract( erc721ABI, erc721Address, {from:this.account} );
        let approved = await erc721.methods.isApprovedForAll(owner, operator).call({from:this.account});

        return approved;
    };

};
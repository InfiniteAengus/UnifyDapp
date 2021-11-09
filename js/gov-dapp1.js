function TncDapp() {

    const ipfs = window.IpfsHttpClient('ipfs.infura.io', '5001', { protocol: 'https' });

    this.govTemplate = Handlebars.compile($('#gov-template').html());

    let _this = this;

    this.getProposals = async function(){

        let count     = 0;
        let length    = await tncLibGov.proposalCount();
        let block     = await web3.eth.getBlock('latest');
        let pausing   = await tncLibGov.isPausing();
        let graceTime = await tncLibGov.graceTime();
        let proposalExecutionLimit = await tncLibGov.proposalExecutionLimit();

        for(let i = length - 1; i >= 0; i--){

            let pName = 'Proposal';
            let pDescription = '';

            let proposal = await tncLibGov.getProposal(i);

            try{

                let data = await $.getJSON(proposal.url);

                pName = data.name;
                pDescription = data.description;

            }catch (e){

                console.log(e.message);
            }

            let timeLeft = _this.timeLeft(proposal, block.timestamp);

            let tmpl = _this.govTemplate({

                name : pName,
                subtitle : 'Proposal #'+ parseInt( proposal.proposalId ),
                description : pDescription,
                proposalId : parseInt(proposal.proposalId),
                details_button : _this.votable(proposal, block.timestamp, pausing, await tncLibGov.voted(proposal.proposalId, tncLib.account)) ? 'Vote' : 'Details',
                executable : _this.executable(proposal, block.timestamp, pausing, graceTime, proposalExecutionLimit)  ? 'true' : '',
                timeLeft : timeLeft,
                resolved : _this.resolved(proposal, block.timestamp),
                result : _this.result(proposal, block.timestamp)
            });

            $('#marketsPage').append(tmpl);

            if(timeLeft > 0) {

                _this.countDown(proposal.proposalId, proposal.openUntil);
            }

            $('#execute'+proposal.proposalId).on('click', function(){
                _this.execute(proposal.proposalId);
            });

            await waitForPaging('', count);
        }
    }

    this.countDown = function(proposalId, openUntil){

        let clearMe = setInterval(function(){

            let curr = Math.floor((new Date()).getTime() / 1000);
            let timeLeft = parseInt(openUntil) - curr;

            if(timeLeft < 0){

                $('#details'+proposalId).text('Check Results');
                clearInterval(clearMe);
                return;
            }

            let days = Math.floor(timeLeft / (3600 * 24));
            let hours = Math.floor((timeLeft % (60 * 60 * 24)) / (3600));
            let minutes = Math.floor((timeLeft % (60 * 60)) / 60);
            let seconds = Math.floor(timeLeft % 60);

            let count = '';

            count += days + ' d | ';
            count += hours + ' h | ';
            count += minutes + ' m | '
            count += seconds + ' s'

            $('#timeLeftCounter'+proposalId).text(count);

        }, 1000);
    }

    this.timeLeft = function(proposal, currTimestamp){

        let left =  parseInt(proposal.openUntil) - currTimestamp;

        if(left < 0){

            left = 0;
        }

        return left;
    }

    this.result = function(proposal, currTimestamp){

        let resolved = _this.resolved(proposal, currTimestamp);

        if(resolved == 'Approved' || resolved == 'Rejected'){

            let numSupporting = parseFloat(_this.formatNumberString( proposal.numSupporting, 18 ));
            let numNotSupporting = parseFloat(_this.formatNumberString( proposal.numNotSupporting, 18 ));
            let all = numNotSupporting + numSupporting;
            console.log(numSupporting, '/', all);
            return Number( ( numSupporting / all ) * 100 ).toFixed(2) + " % Approval Rate";
        }

        return '';
    }

    this.resolved = function(proposal, currTimestamp){

        let ended = currTimestamp > parseInt(proposal.openUntil);

        if(ended && proposal.executed){

            return 'Executed';

        } else  if(ended && proposal.numSupporting > parseInt(proposal.numNotSupporting) && parseInt(proposal.numVotes) > 1){

            return 'Approved';
        }
        else if(ended && proposal.numSupporting <= parseInt(proposal.numNotSupporting) && parseInt(proposal.numVotes) > 1){

            return 'Rejected';
        }
        else if(ended && parseInt(proposal.numVotes) <= 1){

            return 'Expired';
        }

        return '';
    }

    this.ended = function(proposal, currTimestamp){

        return !proposal.executed && currTimestamp > parseInt(proposal.openUntil);
    }

    this.votable = function(proposal, currTimestamp, pausing, voted){

        return currTimestamp <= parseInt(proposal.openUntil) && !pausing && !voted;
    }

    this.executable = function(proposal, currTimestamp, pausing, graceTime, proposalExecutionLimit){

        let exec =
            !proposal.executed &&
            parseInt(proposal.numSupporting) > parseInt(proposal.numNotSupporting) &&
            parseInt(proposal.numVotes) > 1 &&
            currTimestamp > parseInt(proposal.openUntil) + parseInt(graceTime) &&
            currTimestamp < parseInt(proposal.openUntil) + parseInt(graceTime) + parseInt(proposalExecutionLimit) &&
            !pausing;

        return exec;
    }

    this.reloadProposals = async function(){

        $('#marketsPage').html('');
        _this.getProposals();
    }

    this.proposeUpdateConsumerGrant = async function(ipfsUri){

        let address  = $('#typeUpdateGrantAddress').val().trim();
        let grant    = $('#typeUpdateGrantGrant').val().trim();
        let rate     = $('#typeUpdateGrantRate').val().trim();
        let start    = $('#typeUpdateGrantStart').val().trim();
        let duration = $('#duration').val().trim();

        if(!await web3.utils.isAddress(address)){
            _alert('Invalid Address.');
            return;
        }

        if(grant == '' || !_this.isNumeric(grant)){
            _alert('Invalid $UNT grant.');
            return;
        }

        if(rate == '' || !_this.isNumeric(rate)){
            _alert('Invalid reward rate.');
            return;
        }

        if(start == '' || !_this.isNumeric(start)){
            _alert('Invalid start time.');
            return;
        }

        if(duration == '' || !_this.isNumeric(duration)){
            _alert('Invalid voting duration.');
            return;
        }

        grant = _this.resolveNumberString(grant, 18);

        toastr.remove();

        let _button = $('#proposalButton');

        $(_button).html("Pending Transaction...");
        $(_button).prop("disabled", "disabled");

        tncLibGov.proposeUpdateConsumerGrant(
            address,
            grant,
            rate,
            start,
            duration,
            ipfsUri,
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Proposing...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $(_button).html("Propose");
                $(_button).prop("disabled", false);
                toastr["success"]("Transaction has been finished.", "Success");
                $('#proposal').modal('hide');
                _alert("You successfully added a new proposal.");
                _this.reloadProposals();
            },
            function (err) {
                toastr.remove();
                $(_button).prop("disabled", false);
                $(_button).html("Propose");
                let errMsg = "An error occurred with your proposal transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );
                errorPopup("Error", errMsg, err.stack);
            }
        );
    }

    this.proposeNewConsumer = async function(ipfsUri){

        let address  = $('#typeConsumerAddress').val().trim();
        let grant    = $('#typeConsumerGrant').val().trim();
        let rate     = $('#typeConsumerRate').val().trim();
        let start    = $('#typeConsumerStart').val().trim();
        let duration = $('#duration').val().trim();

        if(!await web3.utils.isAddress(address)){
            _alert('Invalid Address.');
            return;
        }

        if(grant == '' || !_this.isNumeric(grant)){
            _alert('Invalid $UNT grant.');
            return;
        }

        if(rate == '' || !_this.isNumeric(rate)){
            _alert('Invalid reward rate.');
            return;
        }

        if(start == '' || !_this.isNumeric(start)){
            _alert('Invalid start time.');
            return;
        }

        if(duration == '' || !_this.isNumeric(duration)){
            _alert('Invalid voting duration.');
            return;
        }

        grant = _this.resolveNumberString(grant, 18);

        toastr.remove();

        let _button = $('#proposalButton');

        $(_button).html("Pending Transaction...");
        $(_button).prop("disabled", "disabled");

        tncLibGov.proposeAddConsumer(
            address,
            grant,
            rate,
            start,
            duration,
            ipfsUri,
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Proposing...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $(_button).html("Propose");
                $(_button).prop("disabled", false);
                toastr["success"]("Transaction has been finished.", "Success");
                $('#proposal').modal('hide');
                _alert("You successfully added a new proposal.");
                _this.reloadProposals();
            },
            function (err) {
                toastr.remove();
                $(_button).prop("disabled", false);
                $(_button).html("Propose");
                let errMsg = "An error occurred with your proposal transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );
                errorPopup("Error", errMsg, err.stack);
            }
        );
    }

    this.proposeConsumerWhitelistPeer = async function(ipfsUri){

        let address  = $('#typeAddPeerAddress').val().trim();
        let peer     = $('#typeAddPeerPeer').val().trim();
        let duration = $('#duration').val().trim();

        if(!await web3.utils.isAddress(address)){
            _alert('Invalid Consumer Address.');
            return;
        }

        if(!await web3.utils.isAddress(address)){
            _alert('Invalid Peer Address.');
            return;
        }

        if(duration == '' || !_this.isNumeric(duration)){
            _alert('Invalid voting duration.');
            return;
        }

        toastr.remove();

        let _button = $('#proposalButton');

        $(_button).html("Pending Transaction...");
        $(_button).prop("disabled", "disabled");

        tncLibGov.proposeConsumerWhitelistPeer(
            address,
            peer,
            duration,
            ipfsUri,
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Proposing...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $(_button).html("Propose");
                $(_button).prop("disabled", false);
                toastr["success"]("Transaction has been finished.", "Success");
                $('#proposal').modal('hide');
                _alert("You successfully added a new proposal.");
                _this.reloadProposals();
            },
            function (err) {
                toastr.remove();
                $(_button).prop("disabled", false);
                $(_button).html("Propose");
                let errMsg = "An error occurred with your proposal transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );
                errorPopup("Error", errMsg, err.stack);
            }
        );
    }

    this.proposeRemoveConsumer = async function(ipfsUri){

        let address  = $('#typeRemoveConsumerAddress').val().trim();
        let duration = $('#duration').val().trim();

        if(!await web3.utils.isAddress(address)){
            _alert('Invalid Consumer Address.');
            return;
        }

        if(duration == '' || !_this.isNumeric(duration)){
            _alert('Invalid voting duration.');
            return;
        }

        toastr.remove();

        let _button = $('#proposalButton');

        $(_button).html("Pending Transaction...");
        $(_button).prop("disabled", "disabled");

        tncLibGov.proposeRemoveConsumer(
            address,
            duration,
            ipfsUri,
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Proposing...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $(_button).html("Propose");
                $(_button).prop("disabled", false);
                toastr["success"]("Transaction has been finished.", "Success");
                $('#proposal').modal('hide');
                _alert("You successfully added a new proposal.");
                _this.reloadProposals();
            },
            function (err) {
                toastr.remove();
                $(_button).prop("disabled", false);
                $(_button).html("Propose");
                let errMsg = "An error occurred with your proposal transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );
                errorPopup("Error", errMsg, err.stack);
            }
        );
    }

    this.proposeConsumerRemovePeerFromWhitelist = async function(ipfsUri){

        let address  = $('#typeRemovePeerConsumerAddress').val().trim();
        let peer     = $('#typeRemovePeerAddress').val().trim();
        let duration = $('#duration').val().trim();

        if(!await web3.utils.isAddress(address)){
            _alert('Invalid Consumer Address.');
            return;
        }

        if(!await web3.utils.isAddress(address)){
            _alert('Invalid Peer Address.');
            return;
        }

        if(duration == '' || !_this.isNumeric(duration)){
            _alert('Invalid voting duration.');
            return;
        }

        toastr.remove();

        let _button = $('#proposalButton');

        $(_button).html("Pending Transaction...");
        $(_button).prop("disabled", "disabled");

        tncLibGov.proposeConsumerRemovePeerFromWhitelist(
            address,
            peer,
            duration,
            ipfsUri,
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Proposing...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $(_button).html("Propose");
                $(_button).prop("disabled", false);
                toastr["success"]("Transaction has been finished.", "Success");
                $('#proposal').modal('hide');
                _alert("You successfully added a new proposal.");
                _this.reloadProposals();
            },
            function (err) {
                toastr.remove();
                $(_button).prop("disabled", false);
                $(_button).html("Propose");
                let errMsg = "An error occurred with your proposal transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );
                errorPopup("Error", errMsg, err.stack);
            }
        );
    }

    this.proposeGeneral = async function(ipfsUri){

        let duration = $('#duration').val().trim();

        if(duration == '' || !_this.isNumeric(duration)){
            _alert('Invalid voting duration.');
            return;
        }

        toastr.remove();

        let _button = $('#proposalButton');

        $(_button).html("Pending Transaction...");
        $(_button).prop("disabled", "disabled");

        tncLibGov.proposeGeneral(
            duration,
            ipfsUri,
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Proposing...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $(_button).html("Propose");
                $(_button).prop("disabled", false);
                toastr["success"]("Transaction has been finished.", "Success");
                $('#proposal').modal('hide');
                _alert("You successfully added a new proposal.");
                _this.reloadProposals();
            },
            function (err) {
                toastr.remove();
                $(_button).prop("disabled", false);
                $(_button).html("Propose");
                let errMsg = "An error occurred with your proposal transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );
                errorPopup("Error", errMsg, err.stack);
            }
        );
    }

    this.proposeNumeric = async function(type, ipfsUri){

        let value = $('#type' + type[0].toUpperCase() + type.slice(1)).val().trim();
        let duration = $('#duration').val().trim();

        if(value == '' || !_this.isNumeric(value)){
            _alert('Invalid value.');
            return;
        }

        if(duration == '' || !_this.isNumeric(duration)){
            _alert('Invalid voting duration.');
            return;
        }

        switch(type){
            case 'quorum':
            case 'minNifOverallStake':
            case 'minNifStake':
            case 'minNifConsumptionStake':
                value = _this.resolveNumberString(value, 18);
                break;
        }

        toastr.remove();

        let _button = $('#proposalButton');

        $(_button).html("Pending Transaction...");
        $(_button).prop("disabled", "disabled");

        tncLibGov.proposeNumeric(
            type,
            value,
            duration,
            ipfsUri,
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Proposing...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                $(_button).html("Propose");
                $(_button).prop("disabled", false);
                toastr["success"]("Transaction has been finished.", "Success");
                $('#proposal').modal('hide');
                _alert("You successfully added a new proposal.");
                _this.reloadProposals();
            },
            function (err) {
                toastr.remove();
                $(_button).prop("disabled", false);
                $(_button).html("Propose");
                let errMsg = "An error occurred with your proposal transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );
                errorPopup("Error", errMsg, err.stack);
            }
        );
    }

    this.passIpfsInfo = async function(title, description, func){

        let info = {
            name : title,
            description : description
        };

        ipfs.add(buffer.Buffer(JSON.stringify(info)), async (err, result) => {

            if(err !== null){

                console.log(err);
                _alert('There is a problem with IPFS. Could not post your proposal.');
                return;
            }

            let uri = "https://gateway.ipfs.io/ipfs/" + result[0].hash;
            _this.pin(result[0].hash);

            func(uri);
        });
    }

    this.newProposal = async function(){

        let type = $('#proposalType').val();
        let title = $('#title').val();
        let description = $('#description').val();

        if(type == ''){
            _alert('Please choose a proposal type.');
            return;
        }

        if(title == ''){
            _alert('Please add a title.');
            return;
        }

        if(title == ''){
            _alert('Please add a description.');
            return;
        }

        switch(type){
            case 'general':
                _this.passIpfsInfo(title, description, _this.proposeGeneral);
                break;
            case 'consumer':
                _this.passIpfsInfo(title, description, _this.proposeNewConsumer);
                break;
            case 'grant':
                _this.passIpfsInfo(title, description, _this.proposeUpdateConsumerGrant);
                break;
            case 'peer':
                _this.passIpfsInfo(title, description, _this.proposeConsumerWhitelistPeer);
                break;
            case 'removeConsumer':
                _this.passIpfsInfo(title, description, _this.proposeRemoveConsumer);
                break;
            case 'removePeer':
                _this.passIpfsInfo(title, description, _this.proposeConsumerRemovePeerFromWhitelist);
                break;
            case 'maxProposalDuration':
            case 'minProposalDuration':
            case 'proposalExecutionLimit':
            case 'quorum':
            case 'minNifOverallStake':
            case 'minNifStake':
            case 'minNifConsumptionStake':
                _this.passIpfsInfo(title, description, async function(ipfsUri){
                    _this.proposeNumeric(type, ipfsUri);
                });
                break;
        }
    }

    this.stakeNif = async function(){

        let amount = $('#nifAmount').val().trim();

        if(amount == '' || !_this.isNumeric(amount)){
            _alert('Please enter a valid $NIF amount.');
            return;
        }

        amount = web3.utils.toBN( _this.resolveNumberString(amount, 18) );
        let nifBalance = web3.utils.toBN( await tncLib.balanceOfErc20Raw(tncLib.nif.options.address, tncLib.account) );

        if( nifBalance.lt( amount ) ){

            _alert('Insufficient funds. You own ' + _this.cleanUpDecimals(_this.formatNumberString(nifBalance.toString(), 18))) + ' $NIF';
            return;
        }

        let allowance = web3.utils.toBN( await tncLib.allowanceErc20Raw(
            tncLib.nif.options.address,
            tncLib.account,
            tncLibGov.gov.options.address
        ) );

        if( allowance.lt( amount ) ){

            _alert('Please approve your $NIF first, then click the "Stake" button again.');

            let _button = $('#stakeNifButton');

            $(_button).prop('disabled', true);
            $(_button).html('Approve first!');

            await window.tncLib.approveErc20(
                tncLib.nif.options.address,
                amount.toString(),
                tncLibGov.gov.options.address,
                function () {
                    toastr["info"]('Please wait for the transaction to finish.', "Approve....");
                },
                function (receipt) {
                    console.log(receipt);
                    toastr.remove();
                    toastr["success"]('Transaction has been finished.', "Success");
                    $(_button).prop('disabled', false);
                    $(_button).html('Stake');
                    $('#alertModal').modal('hide');
                },
                function (err) {
                    toastr.remove();
                    let errMsg = 'An error occurred with your approval transaction.';
                    toastr["error"](errMsg, "Error");
                    $('#alertModal').modal('hide');
                    errorPopup("Error", errMsg, err.stack);
                    $(_button).prop('disabled', false);
                    $(_button).html('Stake');
                });
        }
        else
        {

            toastr.remove();

            let _button = $('#stakeNifButton');

            $(_button).html('Pending Transaction...');
            $(_button).prop('disabled', true);

            tncLibGov.stake(
                amount.toString(),
                function (){
                    toastr["info"]('Please wait for the transaction to finish.', "Staking....");
                },
                async function(receipt){
                    console.log(receipt);
                    toastr.remove();
                    $(_button).html('Stake');
                    $(_button).prop('disabled', false);
                    toastr["success"]('Transaction has been finished.', "Success");
                    $('#stakeNif').modal('hide');
                    let txt = "";
                    let earned = _this.cleanUpDecimals( _this.formatNumberString( receipt.events.Staked.returnValues.untEarned+"" ,18) );
                    if(parseFloat(earned) != 0) {
                        txt = "You successfully staked $NIF to the governance and earned " + earned + " $UNT from your current vault.";
                    } else {
                        txt = "You successfully staked $NIF.";
                    }
                    _alert(txt);
                },
                function(err){
                    toastr.remove();
                    $(_button).prop('disabled', false);
                    $(_button).html('Stake');
                    let errMsg = 'Your selected vault denied your staking request, most likely the max. amount of $NIF has been reached. Please check the vault description for details.';
                    toastr["error"](errMsg, "Error");
                    $('#stakeNif').modal('hide');
                    if(err.stack.toLowerCase().includes('allocation update has been rejected')){
                        _alert('The vault rejected your allocation update.');
                    }else {
                        errorPopup("Error", errMsg, err.stack);
                    }
                }
            );
        }
    }

    this.unstakeNif = async function(){

        let amount = $('#unstakeNifAmount').val().trim();

        if(amount == '' || !_this.isNumeric(amount)){
            _alert('Please enter a valid $NIF amount.');
            return;
        }

        let zero = web3.utils.toBN("0");
        amount = web3.utils.toBN( _this.resolveNumberString(amount, 18) );

        if( amount.eq( zero ) ){

            _alert('You cannot unstake zero.');
            return;
        }

        let account = await tncLibGov.accountInfo(tncLib.account);
        let balance = web3.utils.toBN( _this.resolveNumberString(account[4], 18) );

        if( balance.lt( amount ) ){

            _alert('Insufficient staking funds. You are currently staking ' + _this.cleanUpDecimals(_this.formatNumberString(balance.toString(), 18))) + ' $NIF';
            return;
        }

        console.log(account[4]);

        toastr.remove();

        tncLibGov.unstake(
            account[4],
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Unstaking...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                toastr["success"]("Transaction has been finished.", "Success");
                $('#unstakeNif').modal('hide');
                let earned = _this.cleanUpDecimals( _this.formatNumberString( receipt.events.Unstaked.returnValues.untEarned+"" ,18) );
                _alert("You successfully unstaked $NIF and earned " + earned + " $UNT.");
                console.log(receipt);
            },
            function (err) {
                toastr.remove();
                let errMsg = "An error occurred with your unstaking transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );

                if(err.stack.toLowerCase().includes('nif still locked')){
                    _alert('Your $NIF is still locked.');
                } else if(err.stack.toLowerCase().includes('allocation still frozen by consumer')){
                    _alert('Your $NIF allocation is still locked by your current vault. Please note that you might only receive your $UNT rewards once fully unstaked.');
                } else {
                    errorPopup("Error", errMsg, err.stack);
                }

            }
        );
    }

    this.withdrawUnt = async function(){

        let accountInfo = await tncLibGov.accountInfo(tncLib.account);
        let consumer = accountInfo[0];

        if(consumer == '0x0000000000000000000000000000000000000000'){

            _alert("You didn't allocate your $NIF stakes to a vault yet.");
            return;
        }

        let zero   = web3.utils.toBN("0");
        let earned = web3.utils.toBN(await tncLibGov.earnedConsumer(consumer, tncLib.account));

        /*
        if(earned.eq(zero)){

            _alert("Nothing to withdraw.");
            return;
        }*/

        toastr.remove();

        tncLibGov.withdraw(
            consumer,
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Withdrawing...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                toastr["success"]("Transaction has been finished.", "Success");
                let earned = _this.cleanUpDecimals( _this.formatNumberString( receipt.events.Withdrawn.returnValues.untEarned+"" ,18) );
                _alert("You successfully withdrew " + earned + " $UNT.");
            },
            function (err) {
                toastr.remove();
                let errMsg = "An error occurred with your withdrawing transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );
                if(err.stack.toLowerCase().includes('out of unt')){
                    _alert('Not enough $UNT released to this vault yet. Please come back later.');
                }else if(err.stack.toLowerCase().includes('cannot mint UNT')){
                    _alert('Not enough $UNT released to this vault yet. Please come back later.');
                }else if(err.stack.toLowerCase().includes('nothing to pay out')){
                    _alert('Nothing to pay out. Most likely the grant ran out of $UNT.');
                }else if(err.stack.toLowerCase().includes('you are withdrawing too early')){
                    _alert('Your $UNT is still locked. Please wait for the unlock.');
                }else {
                    errorPopup("Error", errMsg, err.stack);
                }
            }
        );
    }

    this.populateDetails = async function(e){

        $('#detailsModal .modal-non-nft-content').css('display', 'none');

        $('#detailsResolved').css('display', 'none');
        $('#detailsResult').css('display', 'none');
        $('.detailsParams').css('display', 'none');
        $('#detailsVote').css('display', 'none');
        $('#detailsExec').css('display', 'none');
        $('#detailsVotes').css('display', 'none');
        $('#detailsVotes').html('');

        let proposalId = $(e.relatedTarget).data('id');
        let block = await web3.eth.getBlock('latest');
        let pName = 'Proposal';
        let pDescription = '';
        let proposal = await tncLibGov.getProposal(proposalId);
        let resolved = _this.resolved(proposal, block.timestamp);
        let result = _this.result(proposal, block.timestamp);
        let pausing = await tncLibGov.isPausing();
        let graceTime = await tncLibGov.graceTime();
        let proposalExecutionLimit = await tncLibGov.proposalExecutionLimit();
        let addressProp = await tncLibGov.addressProposalInfo(proposalId);
        let uint256Prop = await tncLibGov.uint256ProposalInfo(proposalId);
        let prop = '';

        try{

            let data = await $.getJSON(proposal.url);

            pName = data.name;
            pDescription = data.description;

        }catch (e){

            console.log(e.message);
        }

        pName = Handlebars.Utils.escapeExpression(pName);
        pName = pName.replace(/(\r\n|\n|\r)/gm, '<br>');
        pName = new Handlebars.SafeString(pName);
        $('#detailsTitle').html('Proposal #' + proposalId + ': ' + pName);

        pDescription = Handlebars.Utils.escapeExpression(pDescription);
        pDescription = pDescription.replace(/(\r\n|\n|\r)/gm, '<br>');
        pDescription = new Handlebars.SafeString(pDescription);
        $('#detailsDescription').html(""+pDescription);

        $('#detailsEndTime').text( 'End Date: ' + new Date(parseInt(proposal.openUntil) * 1000).toUTCString() );

        if(resolved != ''){

            $('#detailsResolved').css('display', 'block');
            $('#detailsResolved').html('<strong>Status: </strong> ' + resolved);
        }

        if(result != ''){

            $('#detailsResult').css('display', 'block');
            $('#detailsResult').text(result);
        }

        switch(parseInt(proposal.actionId)){

            // add consumer
            case 3:

                prop = '<strong>Type:</strong> Add Consumer<br/>';
                prop += '<strong>Consumer:</strong> ' + addressProp[0] + '<br/>';
                prop += '<strong>$UNT Grant:</strong> ' + _this.cleanUpDecimals( _this.formatNumberString( uint256Prop[0], 18 ) ) + '<br/>';
                prop += '<strong>Grant Duration:</strong> ' + Math.floor( uint256Prop[1] / 86400 ) + ' day(s)<br/>';
                prop += '<strong>Start Time:</strong> ' + ( new Date(uint256Prop[2] * 1000).toUTCString() );

                $('#detailsConsumer').html(prop);
                $('#detailsConsumer').css('display', 'block');

                break;

            // update grant
            case 7:

                prop = '<strong>Type:</strong> Update Grant<br/>';
                prop += '<strong>Consumer:</strong> ' + addressProp[0] + '<br/>';
                prop += '<strong>$UNT Grant:</strong> ' + _this.cleanUpDecimals( _this.formatNumberString( uint256Prop[0], 18 ) )  + '<br/>';
                prop += '<strong>Grant Duration:</strong> ' + Math.floor( uint256Prop[1] / 86400 ) + ' day(s)<br/>';
                prop += '<strong>Start Time:</strong> ' + ( new Date(uint256Prop[2] * 1000).toUTCString() );

                $('#detailsGrant').html(prop);
                $('#detailsGrant').css('display', 'block');

                break;

            // add peer
            case 5:

                prop = '<strong>Type:</strong> Add Peer to Consumer<br/>';
                prop += '<strong>Consumer:</strong> ' + addressProp[1] + '<br/>';
                prop += '<strong>Peer:</strong> ' + addressProp[0];

                $('#detailsPeer').html(prop);
                $('#detailsPeer').css('display', 'block');

                break;

            // remove consumer
            case 4:

                prop = '<strong>Type:</strong> Remove Consumer<br/>';
                prop += '<strong>Consumer:</strong> ' + addressProp[0];

                $('#detailsRemoveConsumer').html(prop);
                $('#detailsRemoveConsumer').css('display', 'block');

                break;

            // remove peer
            case 6:

                prop = '<strong>Type:</strong> Remove Peer from Consumer<br/>';
                prop += '<strong>Consumer:</strong> ' + addressProp[2][0] + '<br/>';
                prop += '<strong>Peer:</strong> ' + addressProp[0];

                $('#detailsRemovePeer').html(prop);
                $('#detailsRemovePeer').css('display', 'block');

                break;

            case 1:
            case 2:
            case 8:
            case 10:
            case 11:
            case 12:
            case 13:

                let type = '';

                switch(parseInt(proposal.actionId)){
                    case 10:
                        type = 'Max. Proposal Duration';
                        break;
                    case 11:
                        type = 'Min Proposal Duration';
                        break;
                    case 12:
                        type = 'Proposal Execution Limit';
                        break;
                    case 13:
                        type = 'Quorum';
                        uint256Prop[0] = _this.cleanUpDecimals( _this.formatNumberString( uint256Prop[0], 18 ) ) + " $NIF";
                        break;
                    case 1:
                        type = 'Min. $NIF Overall Stake';
                        uint256Prop[0] = _this.cleanUpDecimals( _this.formatNumberString( uint256Prop[0], 18 ) ) + " $NIF";
                        break;
                    case 2:
                        type = 'Min. $NIF Stake';
                        uint256Prop[0] = _this.cleanUpDecimals( _this.formatNumberString( uint256Prop[0], 18 ) ) + " $NIF";
                        break;
                    case 8:
                        type = 'Min. $NIF Consumption Stake';
                        uint256Prop[0] = _this.cleanUpDecimals( _this.formatNumberString( uint256Prop[0], 18 ) ) + " $NIF";
                        break;
                }

                prop = '<strong>Type:</strong> '+type+'<br/>';
                prop += '<strong>Value:</strong> ' + uint256Prop[0] + '<br/>';

                $('#detailsRemovePeer').html(prop);
                $('#detailsRemovePeer').css('display', 'block');

                break;
        }

        $('#detailsApprove').off('click');
        $('#detailsReject').off('click');
        $('#detailsExecute').off('click');

        if(_this.votable(proposal, block.timestamp, pausing, await tncLibGov.voted(proposalId, tncLib.account))){

            $('#detailsVote').css('display', 'block');

            $('#detailsApprove').on('click', async function(){

                _this.vote(proposalId, true);
            });

            $('#detailsReject').on('click', async function(){

                _this.vote(proposalId, false);
            });
        }

        if(_this.executable(proposal, block.timestamp, pausing, graceTime, proposalExecutionLimit)){

            $('#detailsExec').css('display', 'block');

            $('#detailsExecute').on('click', function(){
                _this.execute(proposalId);
            });
        }

        if(parseInt(proposal.actionId) != 9 && _this.executable(proposal, block.timestamp, pausing, graceTime, proposalExecutionLimit)){

            $('#detailsExec').css('display', 'block');
        }

        $('#detailsModal .modal-non-nft-content').css('display', 'block');

        /**
         *
         * Populating initiator & voters
         */

        let votesLength = await tncLibGov.votesCounter(proposalId);

        if(votesLength != 0) {

            $('#detailsVotes').css('display', 'block');

            $('#detailsVotes').html('<hr/><h3>Voters</h3>');

            for (let i = 0; i < votesLength; i++) {

                let vote = await tncLibGov.votes(proposalId, i);
                let init = i == 0 ? ' (initiator)' : '';

                let inner = '<strong>Account:</strong> ' + vote.voter + init + "<br/>";
                inner += '<strong>Date:</strong> ' + (new Date(vote.voteTime * 1000).toUTCString()) + "<br/>";
                inner += '<strong>Vote:</strong> ' + (vote.supporting ? 'Approved' : 'Rejected') + "<br/>";
                inner += '<strong>Voting Power:</strong> ' + (_this.cleanUpDecimals(_this.formatNumberString(vote.power, 18))) + " $NIF<hr/>";

                $('#detailsVotes').html($('#detailsVotes').html() + inner);
            }
        }
    }

    this.execute = async function(id){

        toastr.remove();

        tncLibGov.execute(
            id,
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Executing...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                toastr["success"]("Transaction has been finished.", "Success");
                _alert("You successfully executed the proposal!");
            },
            function (err) {
                toastr.remove();
                let errMsg = "An error occurred with your execution transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );
                if(err.stack.toLowerCase().includes('not an executive')){
                    _alert('You are not allowed to execute this proposal.');
                }else if(err.stack.toLowerCase().includes('not enough support')){
                    _alert('The proposal has not been accepted.');
                }else if(err.stack.toLowerCase().includes('quorum not reached')){
                    _alert('Quorum too low. The proposal has not been accepted.');
                }else if(err.stack.toLowerCase().includes('need at least 2 votes')){
                    _alert('Need at least 2 votes. The proposal has not been accepted.');
                }else if(err.stack.toLowerCase().includes('voting and grace time not yet ended')){
                    _alert('The voting period did not end yet.');
                }else if(err.stack.toLowerCase().includes('execution window expired')){
                    _alert('The execution window expired.');
                }else {
                    errorPopup("Error", errMsg, err.stack);
                }

            }
        );
    }

    this.vote = async function(id, supporting){

        toastr.remove();

        tncLibGov.vote(
            id,
            supporting,
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Voting...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                toastr["success"]("Transaction has been finished.", "Success");
                _alert("You successfully Voted!");
            },
            function (err) {
                toastr.remove();
                let errMsg = "An error occurred with your voting transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );

                _alert('You cannot vote, please make sure you staked enough $NIF and the voting period did not end.');

                //errorPopup("Error", errMsg, err.stack);

            }
        );
    }

    this.peers = async function(){

        $('#peerList').html('<h3>Vaults</h3><hr/>');

        let accountInfo = await tncLibGov.accountInfo(tncLib.account);
        let length = await tncLibGov.consumerCounter();

        for(let i = length - 1; i >= 1; i--){

            let consumer = await tncLibGov.consumers(i);
            let info = await tncLibGov.consumerInfo(consumer.consumer);
            let peers = info[3]; // peers

            let minted = web3.utils.toBN(await tncLibGov.mintedUntConsumer( consumer.consumer ));
            let earnedUnt = web3.utils.toBN(await tncLibGov.earnedUnt( consumer.consumer ) );
            let supplied = minted.add(earnedUnt);
            let remainingUnt = consumer.grantSizeUnt;

            for(let j = peers.length - 1; j >= 0; j--){

                let uri = await tncLibGov.peerUri(consumer.consumer, peers[j]);

                let name = 'Vault';
                let description = '';
                let link = '';

                try{

                    let data = await $.getJSON(uri);

                    name = data.name;
                    description = data.description;
                    link = data.external_link;

                }catch (e){

                    console.log(e);
                }

                name = Handlebars.Utils.escapeExpression(name);
                name = new Handlebars.SafeString(name);

                description = Handlebars.Utils.escapeExpression(description);
                description = description.replace(/(\r\n|\n|\r)/gm, '<br>');
                description = new Handlebars.SafeString(description);

                link = Handlebars.Utils.escapeExpression(link);
                link = new Handlebars.SafeString(link);

                let inner = '<strong>Address:</strong> ' + peers[j] + '<br/><br/>';
                inner += '<strong>Name:</strong> ' + name + '<br/><br/>';
                inner += '<strong>Description:</strong> ';
                inner += '<div style="max-height: 300px; overflow: auto;">'+description+'</div>';
                if(link != ''){
                    inner += '<br/><a href="'+link+'" target="_blank">Website</a><br/>';
                }
                inner += "<br/><strong>Supplied $UNT:</strong> " + ( _this.cleanUpDecimals( _this.formatNumberString( supplied.toString(), 18 ) ) );
                inner += "<br/><strong>Remaining $UNT:</strong> " + ( _this.cleanUpDecimals( _this.formatNumberString( remainingUnt, 18 ) ) );
                inner += "<br/><strong>$NIF Limit:</strong> " + ( _this.cleanUpDecimals( _this.formatNumberString( await tncLibGov.consumerPeerNifAllocation(consumer.consumer, peers[j]), 18 ) ) ) + " / " + ( _this.cleanUpDecimals( _this.formatNumberString( await tncLibGov.peerNifCap(consumer.consumer, peers[j]), 18 ) ) );
                if(peers[j].toLowerCase() != accountInfo[1].toLowerCase()) {
                    inner += '<br/><br/><button class="btn btn-primary allocate" id="allocate' + consumer.consumer + peers[j] + '" data-consumer="' + consumer.consumer + '" data-peer="' + peers[j] + '">Allocate</button>';
                }else{
                    inner += '<br/><br/><strong>You are allocating to this vault.</strong>';
                }
                inner += '<hr/>';

                $('#peerList').html($('#peerList').html() + inner);

                $('.allocate').off('click');
                $('.allocate').on('click', async function(e){

                    if( await tncLibGov.frozen(tncLib.account) ){

                        _alert('You are not released from your current vault yet.');

                    } else {

                        _this.warnAllocation( $(e.target).data('consumer'), $(e.target).data('peer') );
                    }
                });
            }
        }
    }

    this.warnAllocation = async function(consumer, peer){

        $('#warnAllocationModal').modal('show');

        $('#warnAllocationButton').off('click');
        $('#warnAllocationButton').on('click', function(){

            _this.allocate(consumer, peer);
        });
    }

    this.allocate = async function(consumer, peer){

        toastr.remove();

        tncLibGov.allocate(
            consumer,
            peer,
            function () {
                toastr["info"](
                    "Please wait for the transaction to finish.",
                    "Allocating...."
                );
            },
            function (receipt) {
                console.log(receipt);
                toastr.remove();
                toastr["success"]("Transaction has been finished.", "Success");
                $('#warnAllocationModal').modal('hide');
                _alert("You successfully allocated!");
            },
            function (err) {
                toastr.remove();
                let errMsg = "An error occurred with your voting transaction.";
                toastr["error"](
                    errMsg,
                    "Error"
                );
                $('#warnAllocationModal').modal('hide');

                if( err.stack.toLowerCase().includes('execution reverted') ){

                    errorPopup("Error", "The vault denied your allocation. Please make sure you stake $NIF and your selected vault's allocation limits aren't reached.", '');

                }else{

                    errorPopup("Error", errMsg, err.stack);
                }
            }
        );
    }

    this.updateStakedNifDisplay = async function(){

        if(typeof tncLibGov != 'undefined'){

            let accountInfo = await tncLibGov.accountInfo(tncLib.account);
            $('#nifStaked').html( Number( _this.cleanUpDecimals( _this.formatNumberString( accountInfo[4], 18 ) ) ).toFixed(4) );
        }
    }

    this.updateEarnedUntDisplay = async function(){

        if(typeof tncLibGov != 'undefined'){

            let accountInfo = await tncLibGov.accountInfo(tncLib.account);
            let consumer = accountInfo[0];

            if(consumer != '0x0000000000000000000000000000000000000000') {

                let earned = await tncLibGov.earnedConsumer(consumer, tncLib.account);
                earned = Number(_this.cleanUpDecimals(_this.formatNumberString(web3.utils.toBN(earned).toString(), 18))).toFixed(4);
                $('#untEarned').text(earned);

                let earnedLive = await tncLibGov.earnedLiveConsumer(consumer, tncLib.account);
                earnedLive = Number(_this.cleanUpDecimals(_this.formatNumberString(web3.utils.toBN(earnedLive).toString(), 18))).toFixed(4);
                $('#untEarnedLive').text(earnedLive);
            }
            else
            {
                $('#untEarned').text('0.0000');
                $('#untEarnedLive').text('0.0000');
            }
        }
    }

    $(document).ready(async function(){

        _this.updateStakedNifDisplay();
        _this.updateEarnedUntDisplay();

        $("#detailsModal").off("show.bs.modal");
        $("#detailsModal").on("show.bs.modal", _this.populateDetails);

        $("#peersModal").off("show.bs.modal");
        $("#peersModal").on("show.bs.modal", _this.peers);

        $('#unstakeNifButton').on('click', _this.unstakeNif);
        $('#unstakeMaxButton').on('click', async function(){

            let amount = await tncLibGov.accountInfo(tncLib.account);
            $('#unstakeNifAmount').val( _this.cleanUpDecimals( _this.formatNumberString(amount[4], 18) ) );

        });

        $('#withdrawUnt').on('click', _this.withdrawUnt);
        $('#proposalButton').on('click', _this.newProposal);

        $('#proposalType').on('change', function(){

            $('#proposalForm').trigger('reset');
            $('.proposalType').css('display', 'none');
            $('.proposalField').css('display', 'none');

            let selection = $(this).val();

            switch(selection){

                case 'general':
                    $('.proposalField').css('display', 'block');
                    break;
                case 'consumer':
                    $('#addConsumer').css('display', 'block');
                    $('.proposalField').css('display', 'block');
                    break;
                case 'grant':
                    $('#updateGrant').css('display', 'block');
                    $('.proposalField').css('display', 'block');
                    break;
                case 'peer':
                    $('#addPeer').css('display', 'block');
                    $('.proposalField').css('display', 'block');
                    break;
                case 'removeConsumer':
                    $('#removeConsumer').css('display', 'block');
                    $('.proposalField').css('display', 'block');
                    break;
                case 'removePeer':
                    $('#removePeer').css('display', 'block');
                    $('.proposalField').css('display', 'block');
                    break;

                case 'maxProposalDuration':
                    $('#maxProposalDuration').css('display', 'block');
                    $('.proposalField').css('display', 'block');
                    break;
                case 'minProposalDuration':
                    $('#minProposalDuration').css('display', 'block');
                    $('.proposalField').css('display', 'block');
                    break;
                case 'proposalExecutionLimit':
                    $('#proposalExecutionLimit').css('display', 'block');
                    $('.proposalField').css('display', 'block');
                    break;
                case 'quorum':
                    $('#quorum').css('display', 'block');
                    $('.proposalField').css('display', 'block');
                    break;
                case 'minNifOverallStake':
                    $('#minNifOverallStake').css('display', 'block');
                    $('.proposalField').css('display', 'block');
                    break;
                case 'minNifStake':
                    $('#minNifStake').css('display', 'block');
                    $('.proposalField').css('display', 'block');
                    break;
                case 'minNifConsumptionStake':
                    $('#minNifConsumptionStake').css('display', 'block');
                    $('.proposalField').css('display', 'block');
                    break;
            }

        });

        await web3.eth.subscribe("newBlockHeaders", async (error, event) => {

            if (!error) {

                _this.updateStakedNifDisplay();
                _this.updateEarnedUntDisplay();

                return;
            }

            console.log(error);
        });
    });

    this.loadPage = async function (page){

        this.getProposals();

        $('#stakeNifButton').click(_this.stakeNif);
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

        window.tncLibGov = new TncLibGov();
        tncLibGov.account = tncLib.account;

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
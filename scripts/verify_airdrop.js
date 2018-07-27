var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');

const akyuDistributionArtifacts = require('../build/contracts/AkyuDistribution.json');
const akyuTokenArtifacts = require('../build/contracts/AkyuToken.json');
const contract = require('truffle-contract');
let AkyuDistribution = contract(akyuDistributionArtifacts);
let AkyuToken = contract(akyuTokenArtifacts);
const Web3 = require('web3');


if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

AkyuDistribution.setProvider(web3.currentProvider);
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof AkyuDistribution.currentProvider.sendAsync !== "function") {
  AkyuDistribution.currentProvider.sendAsync = function() {
    return AkyuDistribution.currentProvider.send.apply(
      AkyuDistribution.currentProvider, arguments
    );
  };
}

AkyuToken.setProvider(web3.currentProvider);
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof AkyuToken.currentProvider.sendAsync !== "function") {
  AkyuToken.currentProvider.sendAsync = function() {
    return AkyuToken.currentProvider.send.apply(
      AkyuToken.currentProvider, arguments
    );
  };
}

let akyuDistributionAddress = process.argv.slice(2)[0];

async function listAllocations() {
    let accounts = await web3.eth.getAccounts();
    let akyuDistribution = await AkyuDistribution.at(akyuDistributionAddress);

    let akyutokenAddress = await akyuDistribution.AKYU({from:accounts[0]});

    let akyuToken = await AkyuToken.at(akyutokenAddress);
    //console.log(akyuToken);
    let count = 0;
    let bal = await akyuToken.balanceOf(akyuDistribution.address);

    var events = await akyuToken.Transfer({from: akyuDistribution.address},{fromBlock: 0, toBlock: 'latest'});
    events.get(function(error, log) {
        event_data = log;
        console.log("Retrieving logs to inform total amount of tokens distributed so far. This may take a while...")

        //console.log(log);
        for (var i=0; i<event_data.length;i++){
            let tokens = event_data[i].args.value.times(10 ** -18).toString(10);
            let addressB = event_data[i].args.to;
            //console.log(`Distributed ${tokens} AKYU to address ${addressB}`);
            count++;
        }
        console.log(`Successfully airdropped ${count*250} AKYU to ${count} addresses`);
    });

}

if(akyuDistributionAddress){
  listAllocations();
}else{
  console.log("Please run the script by providing the address of the AkyuDistribution contract");
}

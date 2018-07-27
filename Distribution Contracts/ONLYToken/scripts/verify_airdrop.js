var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');

const onlyDistributionArtifacts = require('../build/contracts/OnlyDistribution.json');
const onlyTokenArtifacts = require('../build/contracts/OnlyToken.json');
const contract = require('truffle-contract');
let OnlyDistribution = contract(onlyDistributionArtifacts);
let OnlyToken = contract(onlyTokenArtifacts);
const Web3 = require('web3');


if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

OnlyDistribution.setProvider(web3.currentProvider);
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof OnlyDistribution.currentProvider.sendAsync !== "function") {
  OnlyDistribution.currentProvider.sendAsync = function() {
    return OnlyDistribution.currentProvider.send.apply(
      OnlyDistribution.currentProvider, arguments
    );
  };
}

OnlyToken.setProvider(web3.currentProvider);
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof OnlyToken.currentProvider.sendAsync !== "function") {
  OnlyToken.currentProvider.sendAsync = function() {
    return OnlyToken.currentProvider.send.apply(
      OnlyToken.currentProvider, arguments
    );
  };
}

let onlyDistributionAddress = process.argv.slice(2)[0];

async function listAllocations() {
    let accounts = await web3.eth.getAccounts();
    let onlyDistribution = await OnlyDistribution.at(onlyDistributionAddress);

    let onlytokenAddress = await onlyDistribution.ONLY({from:accounts[0]});

    let onlyToken = await OnlyToken.at(onlytokenAddress);
    //console.log(onlyToken);
    let count = 0;
    let bal = await onlyToken.balanceOf(onlyDistribution.address);

    var events = await onlyToken.Transfer({from: onlyDistribution.address},{fromBlock: 0, toBlock: 'latest'});
    events.get(function(error, log) {
        event_data = log;
        console.log("Retrieving logs to inform total amount of tokens distributed so far. This may take a while...")

        //console.log(log);
        for (var i=0; i<event_data.length;i++){
            let tokens = event_data[i].args.value.times(10 ** 1).toString(10);
            let addressB = event_data[i].args.to;
            //console.log(`Distributed ${tokens} ONLY to address ${addressB}`);
            count++;
        }
        console.log(`Successfully airdropped ${count*10} ONLY to ${count} addresses`);
    });

}

if(onlyDistributionAddress){
  listAllocations();
}else{
  console.log("Please run the script by providing the address of the OnlyDistribution contract");
}

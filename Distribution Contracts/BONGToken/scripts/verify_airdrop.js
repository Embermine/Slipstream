var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');

const bongDistributionArtifacts = require('../build/contracts/BongDistribution.json');
const bongTokenArtifacts = require('../build/contracts/BongToken.json');
const contract = require('truffle-contract');
let BongDistribution = contract(bongDistributionArtifacts);
let BongToken = contract(bongTokenArtifacts);
const Web3 = require('web3');


if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

BongDistribution.setProvider(web3.currentProvider);
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof BongDistribution.currentProvider.sendAsync !== "function") {
  BongDistribution.currentProvider.sendAsync = function() {
    return BongDistribution.currentProvider.send.apply(
      BongDistribution.currentProvider, arguments
    );
  };
}

BongToken.setProvider(web3.currentProvider);
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof BongToken.currentProvider.sendAsync !== "function") {
  BongToken.currentProvider.sendAsync = function() {
    return BongToken.currentProvider.send.apply(
      BongToken.currentProvider, arguments
    );
  };
}

let bongDistributionAddress = process.argv.slice(2)[0];

async function listAllocations() {
    let accounts = await web3.eth.getAccounts();
    let bongDistribution = await BongDistribution.at(bongDistributionAddress);

    let bongtokenAddress = await bongDistribution.BONG({from:accounts[0]});

    let bongToken = await BongToken.at(bongtokenAddress);
    //console.log(bongToken);
    let count = 0;
    let bal = await bongToken.balanceOf(bongDistribution.address);

    var events = await bongToken.Transfer({from: bongDistribution.address},{fromBlock: 0, toBlock: 'latest'});
    events.get(function(error, log) {
        event_data = log;
        console.log("Retrieving logs to inform total amount of tokens distributed so far. This may take a while...")

        //console.log(log);
        for (var i=0; i<event_data.length;i++){
            let tokens = event_data[i].args.value.times(10 ** -18).toString(10);
            let addressB = event_data[i].args.to;
            //console.log(`Distributed ${tokens} BONG to address ${addressB}`);
            count++;
        }
        console.log(`Successfully airdropped ${count*250} BONG to ${count} addresses`);
    });

}

if(bongDistributionAddress){
  listAllocations();
}else{
  console.log("Please run the script by providing the address of the BongDistribution contract");
}

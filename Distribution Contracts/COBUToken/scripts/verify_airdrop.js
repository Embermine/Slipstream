var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');

const cobuDistributionArtifacts = require('../build/contracts/CobuDistribution.json');
const cobuTokenArtifacts = require('../build/contracts/CobuToken.json');
const contract = require('truffle-contract');
let CobuDistribution = contract(cobuDistributionArtifacts);
let CobuToken = contract(cobuTokenArtifacts);
const Web3 = require('web3');


if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

CobuDistribution.setProvider(web3.currentProvider);
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof CobuDistribution.currentProvider.sendAsync !== "function") {
  CobuDistribution.currentProvider.sendAsync = function() {
    return CobuDistribution.currentProvider.send.apply(
      CobuDistribution.currentProvider, arguments
    );
  };
}

CobuToken.setProvider(web3.currentProvider);
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof CobuToken.currentProvider.sendAsync !== "function") {
  CobuToken.currentProvider.sendAsync = function() {
    return CobuToken.currentProvider.send.apply(
      CobuToken.currentProvider, arguments
    );
  };
}

let cobuDistributionAddress = process.argv.slice(2)[0];

async function listAllocations() {
    let accounts = await web3.eth.getAccounts();
    let cobuDistribution = await CobuDistribution.at(cobuDistributionAddress);

    let cobutokenAddress = await cobuDistribution.COBU({from:accounts[0]});

    let cobuToken = await CobuToken.at(cobutokenAddress);
    //console.log(cobuToken);
    let count = 0;
    let bal = await cobuToken.balanceOf(cobuDistribution.address);

    var events = await cobuToken.Transfer({from: cobuDistribution.address},{fromBlock: 0, toBlock: 'latest'});
    events.get(function(error, log) {
        event_data = log;
        console.log("Retrieving logs to inform total amount of tokens distributed so far. This may take a while...")

        //console.log(log);
        for (var i=0; i<event_data.length;i++){
            let tokens = event_data[i].args.value.times(10 ** 0).toString(10);
            let addressB = event_data[i].args.to;
            //console.log(`Distributed ${tokens} COBU to address ${addressB}`);
            count++;
        }
        console.log(`Successfully airdropped ${count*1000} COBU to ${count} addresses`);
    });

}

if(cobuDistributionAddress){
  listAllocations();
}else{
  console.log("Please run the script by providing the address of the CobuDistribution contract");
}

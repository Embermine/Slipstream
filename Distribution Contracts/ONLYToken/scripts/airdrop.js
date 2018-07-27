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
let BATCH_SIZE = process.argv.slice(2)[1];
if(!BATCH_SIZE) BATCH_SIZE = 80;
let distribData = new Array();
let allocData = new Array();
let fullFileData = new Array();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function setAllocation() {

  console.log(`
    --------------------------------------------
    ---------Performing allocations ------------
    --------------------------------------------
  `);

  let accounts = await web3.eth.getAccounts();
  let userBalance = await web3.eth.getBalance(accounts[0]);

  let onlyDistribution = await OnlyDistribution.at(onlyDistributionAddress);

  //console.log("%%%%%%%%%%%%%%%",distribData);
  //console.log(onlyDistribution);
  for(var i = 0;i< distribData.length;i++){

    try{
      let gPrice = 10000000000;
      console.log("Attempting to allocate ONLYs to accounts:",distribData[i],"\n\n");
      let r = await onlyDistribution.airdropTokens(distribData[i],{from:accounts[0], gas:5000000, gasPrice: gPrice});
      console.log("---------- ---------- ---------- ----------");
      console.log("Allocation + transfer was successful.", r.receipt.gasUsed, "gas used. Spent:",r.receipt.gasUsed * gPrice,"wei");
      console.log("---------- ---------- ---------- ----------\n\n")
    } catch (err){
      console.log("ERROR:",err);
    }

  }

  console.log("Distribution script finished successfully.")
  console.log("Waiting 2 minutes for transactions to be mined...")
  await delay(90000);
  console.log("Retrieving logs to inform total amount of tokens distributed so far. This may take a while...")

  let onlytokenAddress = await onlyDistribution.ONLY({from:accounts[0]});
  let onlyToken = await OnlyToken.at(onlytokenAddress);

  var sumAccounts = 0;
  var sumTokens = 0;

  var eventData = new Array();

  var events = await onlyToken.Transfer({from: onlyDistribution.address},{fromBlock: 0, toBlock: 'latest'});
  events.get(function(error, log) {
      event_data = log;
      //console.log(log);
      for (var i=0; i<event_data.length;i++){
          //let tokens = event_data[i].args.value.times(10 ** 1).toString(10);
          //let addressB = event_data[i].args.to;
          sumTokens += event_data[i].args.value.times(10 ** 1).toNumber();
          sumAccounts +=1;
          eventData.push(event_data[i].args.to);
          //console.log(`Distributed ${tokens} ONLY to address ${addressB}`);

      }

      console.log(`A total of ${sumTokens} ONLY tokens have been distributed to ${sumAccounts} accounts so far.`);
      var eventData_s = new Set(eventData);
      let missingDistribs = fullFileData.filter(x => !eventData_s.has(x));

      if(missingDistribs.length >0){
          console.log("************************");
          console.log("-- No Transfer event was found for the followign accounts. Please review them manually --")
          for(var i = 0; i<missingDistribs.length;i++){
              console.log('\x1b[31m%s\x1b[0m',`No Transfer event was found for account ${missingDistribs[i]}`);
          }
          console.log("************************");
      }

      //console.log(`Run 'node scripts/verify_airdrop.js ${onlyDistribution.address} > scripts/data/review.csv' to get a log of all the accounts that were distributed the airdrop tokens.`)


  });

}


function readFile() {
  var stream = fs.createReadStream("data/airdrop.csv");

  let index = 0;
  let batch = 0;

  console.log(`
    --------------------------------------------
    --------- Parsing distrib.csv file ---------
    --------------------------------------------
    ******** Removing beneficiaries without tokens or address data
  `);

  //console.log("QQQ",distribData);

  var csvStream = csv()
      .on("data", function(data){
          let isAddress = web3.utils.isAddress(data[0]);
          if(isAddress && data[0]!=null && data[0]!='' ){
            allocData.push(data[0]);
            fullFileData.push(data[0]);

            index++;
            if(index >= BATCH_SIZE)
            {
              distribData.push(allocData);
            //  console.log("DIS",distribData);
              allocData = [];
            //  console.log("ALLOC",allocData);
              index = 0;
            }

          }
      })
      .on("end", function(){
           //Add last remainder batch
           distribData.push(allocData);
           allocData = [];

           setAllocation();
      });

  stream.pipe(csvStream);
}

if(onlyDistributionAddress){
  console.log("Processing airdrop. Batch size is",BATCH_SIZE, "accounts per transaction");
  readFile();
}else{
  console.log("Please run the script by providing the address of the OnlyDistribution contract");
}

var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');

const onlyDistributionArtifacts = require('../build/contracts/OnlyDistribution.json');
const contract = require('truffle-contract');
let OnlyDistribution = contract(onlyDistributionArtifacts);
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

let onlyDistributionAddress = process.argv.slice(2)[0];
let ALLOC_TYPE = parseInt(process.argv.slice(2)[1]);
if(!ALLOC_TYPE) ALLOC_TYPE = 0;
let allocData = new Array();

let ALLOC_STRING = new Array("PROMO","CREATOR","ADVISOR","AIRDROP");

async function verifyAllocation() {

  console.log(`
    --------------------------------------------
    ---------Reviewing allocations ------------
    --------------------------------------------
  `);

    var sumAllocations = 0;
    var sumAccountsAllocated = 0;
    var failedAllocs = 0;

    let accounts = await web3.eth.getAccounts();
    let userBalance = await web3.eth.getBalance(accounts[0]);

    let onlyDistribution = await OnlyDistribution.at(onlyDistributionAddress);
    for(var i = 0;i< allocData.length;i++){

        let prevAllocation = await onlyDistribution.allocations(allocData[i][0],{from:accounts[0]});
        let tokens = new BigNumber(allocData[i][1]);
        parsedAlloc = parseInt(web3.utils.fromWei(prevAllocation[3].toString(10)));
        if(prevAllocation[3].toNumber() ==0){
            failedAllocs +=1;
            console.log('\x1b[31m%s\x1b[0m',`Account ${allocData[i][0]} has not been allocated any ONLY, review the transaction logs on Etherscan`);
        } else if (prevAllocation[0].toNumber() != ALLOC_TYPE){
            failedAllocs +=1;
            console.log('\x1b[31m%s\x1b[0m',`Existing allocation for account ${allocData[i][0]}. This account has already been allocated ONLY of type ${ALLOC_STRING[prevAllocation[0]]}`);
        } else if (parsedAlloc != allocData[i][1]){
            failedAllocs +=1;
            console.log('\x1b[31m%s\x1b[0m',`Existing allocation for account ${allocData[i][0]} (${parsedAlloc} ONLY) does not match the contents of the file (${allocData[i][1]} ONLY). `);
        } else{
            sumAllocations += parseInt(web3.utils.fromWei(prevAllocation[3].toString(10)));
            sumAccountsAllocated +=1;
            console.log(`Account ${allocData[i][0]} is successfully allocated ${parsedAlloc} ONLY`)
        }
    }

    console.log(`File contains ${allocData.length} valid addresses`);
    if(failedAllocs >0)
        console.log('\x1b[31m%s\x1b[0m',`${failedAllocs} allocations have failed, review them.`);
    console.log('\x1b[32m%s\x1b[0m',`${sumAllocations} ONLY have been allocated to ${sumAccountsAllocated} accounts`);
}


function readFile() {
    var stream;
    //console.log(ALLOC_TYPE, "=====");
    switch (ALLOC_TYPE) {
        case 0: //PROMO
            stream = fs.createReadStream("data/promo.csv");
            break;
        case 1: //CREATORS
            stream = fs.createReadStream("data/creators.csv");
            break;
        case 2: // ADVISOR
            stream = fs.createReadStream("data/advisors.csv");    
            break;
        case 3: // AIRDROP
            break;
        //case 4: // RESERVE
          //  stream = fs.createReadStream("data/reserve.csv");
         //   break;
        //case 5: // BONUS1
         //   stream = fs.createReadStream("data/bonus1.csv");
         //   break;
       // case 6: // BONUS2
        //    stream = fs.createReadStream("data/bonus2.csv");
         //   break;
        //case 7: // BONUS3
          //  stream = fs.createReadStream("data/bonus3.csv");
         //   break;
        default:
  
    }


  let index = 0;
  let batch = 0;

  console.log(`
    --------------------------------------------
    ------------- Parsing csv file -------------
    --------------------------------------------
    ******** Removing beneficiaries without tokens or address data
  `);


  var csvStream = csv()
      .on("data", function(data){
          let isAddress = web3.utils.isAddress(data[0]);
          if(isAddress && data[0]!=null && data[0]!='' ){
            data[1] = parseInt(data[1]);
            allocData.push([data[0],data[1]]);
          }
      })
      .on("end", function(){
           //Add last remainder batch
           //console.log(allocData);
           verifyAllocation();
      });

  stream.pipe(csvStream);
}

if(onlyDistributionAddress){
  readFile();
}else{
  console.log("Please run the script by providing the address of the OnlyDistribution contract");
}

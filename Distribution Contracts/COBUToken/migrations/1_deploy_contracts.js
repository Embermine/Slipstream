var CobuToken = artifacts.require('./CobuToken.sol');
var CobuDistribution = artifacts.require('./CobuDistribution.sol');

module.exports = async (deployer, network) => {
  let _now = Date.now();
  let _fromNow = 60 * 5 * 1000; // Start distribution in 1 hour
  let _startTime = (_now + _fromNow) / 1000;
  await deployer.deploy(CobuDistribution, _startTime);
  console.log(`
    ---------------------------------------------------------------
    --------- COINBUG (COBU) TOKEN SUCCESSFULLY DEPLOYED ---------
    ---------------------------------------------------------------
    - Contract address: ${CobuDistribution.address}
    - Distribution starts in: ${_fromNow/1000/60} minutes
    - Local Time: ${new Date(_now + _fromNow)}
    ---------------------------------------------------------------
  `);
};

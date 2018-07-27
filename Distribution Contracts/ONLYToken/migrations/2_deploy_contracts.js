var OnlyToken = artifacts.require('./OnlyToken.sol');
var OnlyDistribution = artifacts.require('./OnlyDistribution.sol');

module.exports = async (deployer, network) => {
  let _now = Date.now();
  let _fromNow = 60 * 5 * 1000; // Start distribution in 5 minutes
  let _startTime = (_now + _fromNow) / 1000;
  await deployer.deploy(OnlyDistribution, _startTime);
  console.log(`
    ---------------------------------------------------------------
    --------- MBRSOnly (ONLY) TOKEN SUCCESSFULLY DEPLOYED ---------
    ---------------------------------------------------------------
    - Contract address: ${OnlyDistribution.address}
    - Distribution starts in: ${_fromNow/1000/60} minutes
    - Local Time: ${new Date(_now + _fromNow)}
    ---------------------------------------------------------------
  `);
};

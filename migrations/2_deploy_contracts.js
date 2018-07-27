var AkyuToken = artifacts.require('./AkyuToken.sol');
var AkyuDistribution = artifacts.require('./AkyuDistribution.sol');

module.exports = async (deployer, network) => {
  let _now = Date.now();
  let _fromNow = 60 * 5 * 1000; // Start distribution in 1 hour
  let _startTime = (_now + _fromNow) / 1000;
  await deployer.deploy(AkyuDistribution, _startTime);
  console.log(`
    ---------------------------------------------------------------
    --------- AKYU (AKYU) TOKEN SUCCESSFULLY DEPLOYED ---------
    ---------------------------------------------------------------
    - Contract address: ${AkyuDistribution.address}
    - Distribution starts in: ${_fromNow/1000/60} minutes
    - Local Time: ${new Date(_now + _fromNow)}
    ---------------------------------------------------------------
  `);
};

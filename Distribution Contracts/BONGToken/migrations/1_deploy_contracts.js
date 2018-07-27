var BongToken = artifacts.require('./BongToken.sol');
var BongDistribution = artifacts.require('./BongDistribution.sol');

module.exports = async (deployer, network) => {
  let _now = Date.now();
  let _fromNow = 60 * 5 * 1000; // Start distribution in 1 hour
  let _startTime = (_now + _fromNow) / 1000;
  await deployer.deploy(BongDistribution, _startTime);
  console.log(`
    ---------------------------------------------------------------
    --------- BONG (BONG) TOKEN SUCCESSFULLY DEPLOYED ---------
    ---------------------------------------------------------------
    - Contract address: ${BongDistribution.address}
    - Distribution starts in: ${_fromNow/1000/60} minutes
    - Local Time: ${new Date(_now + _fromNow)}
    ---------------------------------------------------------------
  `);
};

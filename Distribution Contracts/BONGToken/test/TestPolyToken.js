const BongToken = artifacts.require("./BongToken.sol");
const Web3 = require('web3')

var BigNumber = require('bignumber.js')

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

const logTitle = function (title) {
  console.log("*****************************************");
  console.log(title);
  console.log("*****************************************");
}

const logError = function (err) {
  console.log("-----------------------------------------");
  console.log(err);
  console.log("-----------------------------------------");
}

contract('BongToken', function(accounts) {

  ////

  const DECIMALSFACTOR = new BigNumber('10').pow('18')

  const TOKEN_NAME = "Bong";
  const TOKEN_SYMBOL = "BONG";
  const TOKEN_DECIMALS = 18;
  const TOTAL_SUPPLY = 1000000000 * DECIMALSFACTOR;

  ////

  let bongToken;

  before(async() => {
        bongToken = await BongToken.new(accounts[0],{from:accounts[0]});
    });

  describe("Token Basic Properties", async function () {

    it("Name", async function () {
      let tokenName = await bongToken.name({from:accounts[0]});
      assert.equal(tokenName,TOKEN_NAME);
    });

    it("Symbol", async function () {
      let tokenSymbol = await bongToken.symbol({from:accounts[0]});
      assert.equal(tokenSymbol,TOKEN_SYMBOL);
    });

    it("Decimals", async function () {
      let tokenDecimals = await bongToken.decimals({from:accounts[0]});
      assert.equal(parseInt(tokenDecimals),TOKEN_DECIMALS);
    });

    it("Total Supply", async function () {
      let tokenTotalSupply = await bongToken.totalSupply({from:accounts[0]});
      assert.equal(tokenTotalSupply.toString(10),TOTAL_SUPPLY);
    });
  });

  describe("Token Transfer Functions", async function () {

    it("should transfer from owner to another address", async function () {
      await bongToken.transfer(accounts[1],1000,{from:accounts[0]});
      let account1Balance = await bongToken.balanceOf(accounts[1],{from:accounts[0]});
      assert.equal(account1Balance,1000);
    });

    it('should FAIL to transfer to null address', async() => {
      try {
          await bongToken.transfer(0,1000,{from:accounts[0]});
      } catch (error) {
          logError("✅   Tried to transfer to null address and failed");
          return true;
      }
      throw new Error("I should never see this!")
    });

    it('should FAIL to transfer more tokens than available', async() => {
      try {
          await bongToken.transfer(accounts[1],TOTAL_SUPPLY +1,{from:accounts[0]});
      } catch (error) {
          logError("✅   Tried to transfer more tokens than available and failed");
          return true;
      }
      throw new Error("I should never see this!")
    });

  });

  describe("Token TransferFrom / Allowance Functions", async function () {

    it('should give an allowance of 9999 to another account', async() => {
      await bongToken.approve(accounts[3],9999,{from:accounts[0]});
      let allowance = await bongToken.allowance(accounts[0],accounts[3],{from:accounts[0]});
      assert.equal(allowance.toString(10),9999);
    });

    it('should transferFrom from allowance', async() => {
      await bongToken.transferFrom(accounts[0],accounts[4],3333,{from:accounts[3]});
      let updatedAllowance = await bongToken.allowance(accounts[0],accounts[3],{from:accounts[0]});
      assert.equal(updatedAllowance.toString(10),6666);

      let account4Balance = await bongToken.balanceOf(accounts[4],{from:accounts[0]});
      assert.equal(account4Balance.toString(10),3333);
    });

    it('should increase allowance', async() => {
      await bongToken.increaseApproval(accounts[5],100,{from:accounts[0]});
      let updatedAllowance = await bongToken.allowance(accounts[0],accounts[5],{from:accounts[0]});
      assert.equal(updatedAllowance.toString(10),100);
    });

    it('should decrease allowance', async() => {
      let allowanceToDecrease = 50;
      let origAllowance = await bongToken.allowance(accounts[0],accounts[5],{from:accounts[0]});
      await bongToken.decreaseApproval(accounts[5],allowanceToDecrease,{from:accounts[0]});
      let updatedAllowance = await bongToken.allowance(accounts[0],accounts[5],{from:accounts[0]});
      assert.equal(parseInt(origAllowance),parseInt(updatedAllowance) + allowanceToDecrease);
    });

    it('should completely decrease allowance', async() => {
      let allowanceToDecrease = 100000;
      let origAllowance = await bongToken.allowance(accounts[0],accounts[5],{from:accounts[0]});
      await bongToken.decreaseApproval(accounts[5],allowanceToDecrease,{from:accounts[0]});
      let updatedAllowance = await bongToken.allowance(accounts[0],accounts[5],{from:accounts[0]});
      assert.equal(updatedAllowance.toString(10),0);
    });

    it('should FAIL to transferFrom to null address', async() => {
      try {
          await bongToken.transferFrom(accounts[0],0,1,{from:accounts[3]});
      } catch (error) {
          logError("✅   Tried to transferFrom to null address and failed");
          return true;
      }
      throw new Error("I should never see this!")
    });

    it('should FAIL to transferFrom if _from has not enough balance', async() => {
      try {
          await bongToken.transferFrom(accounts[0],accounts[5],TOTAL_SUPPLY +1,{from:accounts[3]});
      } catch (error) {
          logError("✅   Tried to transferFrom without enough balance and failed");
          return true;
      }
      throw new Error("I should never see this!")
    });

    it('should FAIL to transferFrom more than the allowance granted', async() => {
      try {
          await bongToken.transferFrom(accounts[0],accounts[5],50000,{from:accounts[3]});
      } catch (error) {
          logError("✅   Tried to transferFrom without enough balance and failed");
          return true;
      }
      throw new Error("I should never see this!")
    });

  });

});

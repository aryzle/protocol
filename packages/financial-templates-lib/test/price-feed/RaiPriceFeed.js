const winston = require("winston");

const { RaiPriceFeed } = require("../../src/price-feed/RaiPriceFeed");
const { getTruffleContract } = require("@uma/core");

const CONTRACT_VERSION = "latest";

const RaiMock = getTruffleContract("RaiMock", web3, CONTRACT_VERSION);
const RaiInterface = getTruffleContract("Rai", web3, CONTRACT_VERSION);

contract("RaiPriceFeed.js", function(accounts) {
  const owner = accounts[0];

  let raiMock;
  let raiPriceFeed;
  let mockTime = 0;
  let dummyLogger;

  beforeEach(async function() {
    raiMock = await RaiMock.new({ from: owner });

    dummyLogger = winston.createLogger({
      level: "info",
      transports: [new winston.transports.Console()]
    });

    raiPriceFeed = new RaiPriceFeed({
      logger: dummyLogger,
      web3,
      getTime: () => mockTime,
      RaiAbi: RaiInterface.abi,
      RaiAddress: raiMock.address
    });
  });

  it("Basic current price", async function() {
    await raiMock.setRedemptionRate("999999983117203764734439013");
    await raiPriceFeed.update();

    assert.equal(raiPriceFeed.getCurrentPrice().toString(), "983.1172037395402");
  });

  it("getCurrentPrice() returns undefined if update() is never called", async function() {
    const price = raiPriceFeed.getCurrentPrice();
    assert.equal(price, undefined);
  });

  it("Correctly selects most recent price", async function() {
    await raiMock.setRedemptionRate("999999983117203764734439013");
    await raiMock.setRedemptionRate("999999993117203764734439013");
    await raiMock.setRedemptionRate("1000000267417929490714933462");
    await raiPriceFeed.update();

    assert.equal(raiPriceFeed.getCurrentPrice().toString(), "1267.417929456749");
  });
});

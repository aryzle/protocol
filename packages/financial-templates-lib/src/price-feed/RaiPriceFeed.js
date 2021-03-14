// An implementation of PriceFeedInterface that uses the Rai v1 redemption rate as the price feed source.
const { PriceFeedInterface } = require("./PriceFeedInterface");
const { BlockFinder } = require("./utils");

class RaiPriceFeed extends PriceFeedInterface {
  /**
   * @notice Constructs new Rai redemption rate price feed object.
   * @param {Object} logger Winston module used to send logs.
   * @param {Object} RaiAbi RAI OracleRelay abi object to create a contract instance.
   * @param {Object} web3 Provider from Truffle instance of to connect to Ethereum network.
   * @param {String} RaiAddress Ethereum address of OracleRelay to monitor.
   * @param {Function} getTime Returns the current time.
   * @param {Function} [blockFinder] Optionally pass in a shared blockFinder instance (to share the cache).
   * @param {Integer} [minTimeBetweenUpdates] Minimum amount of time that must pass before update will actually run
   *                                        again.
   * @param {Integer} [priceFeedDecimals] Precision that the caller wants precision to be reported in.
   * @return None or throws an Error.
   */
  constructor({
    logger,
    RaiAbi,
    web3,
    RaiAddress,
    getTime,
    blockFinder,
    minTimeBetweenUpdates = 60,
    priceFeedDecimals = 9
  }) {
    super();

    this.logger = logger;
    this.web3 = web3;

    this.Rai = new web3.eth.Contract(RaiAbi, RaiAddress);
    this.uuid = `Rai-${RaiAddress}`;
    this.getTime = getTime;
    this.minTimeBetweenUpdates = minTimeBetweenUpdates;
    this.blockFinder = blockFinder || BlockFinder(web3.eth.getBlock);
    this.priceFeedDecimals = priceFeedDecimals;

    // Helper functions from web3.
    this.toBN = this.web3.utils.toBN;
  }

  getCurrentPrice() {
    return this.price;
  }

  async getHistoricalPrice(time) {
    const block = await this.blockFinder.getBlockForTimestamp(time);
    return this._getPrice(block.number, time);
  }

  getLastUpdateTime() {
    return this.lastUpdateTime;
  }

  getLookback() {
    // Return infinity since this price feed can technically look back as far as needed.
    return Infinity;
  }

  getPriceFeedDecimals() {
    return 9;
  }

  async update() {
    const currentTime = await this.getTime();
    if (this.lastUpdateTime === undefined || currentTime >= this.lastUpdateTime + this.minTimeBetweenUpdates) {
      this.price = await this._getPrice("latest", currentTime);
      this.lastUpdateTime = currentTime;
    }
  }

  async _getPrice(blockNumber) {
    // redemption rate is a uint 256, e.g. 999999983117203764734439013
    try {
      const redemptionRateString = await this.Rai.methods.getRedemptionRate().call(undefined, blockNumber);
      const redemptionRate = (Number(redemptionRateString) - 1e27) / 1e27;

      // redemption rate could be negative or positive, so using 1000 as the base for 0%
      const result = redemptionRate * 1e9 + 1000;

      this.logger.debug({
        at: "RaiPriceFeed",
        message: `redemptionRate= ${redemptionRate} result= ${result}`
      });

      return result;
    } catch (e) {
      this.logger.error({
        at: "RaiPriceFeed",
        message: e
      });
    }
  }
}

module.exports = {
  RaiPriceFeed
};

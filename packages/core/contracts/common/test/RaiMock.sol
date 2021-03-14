// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.6.0;

import "../interfaces/Rai.sol";

/**
 * @title RAI v1 Mock that allows manual price/rate injection.
 */
contract RaiMock is Rai {
    uint256 private _redemptionRate = 0;

    function getRedemptionRate() external view override returns (uint256) {
        return _redemptionRate;
    }

    function setRedemptionRate(uint256 rate) external {
        _redemptionRate = rate;
    }
}

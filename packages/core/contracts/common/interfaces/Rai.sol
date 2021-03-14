// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.6.0;

/**
 * @title Interface for RAI v1.
 * @dev This only contains the methods/events that we use in our contracts or offchain infrastructure.
 */
abstract contract Rai {
    // Return redemption rate in RAY.
    function getRedemptionRate() external view virtual returns (uint256);
}

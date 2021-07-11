// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.5.0 <0.9.0;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

interface IRebalancerDeployer {
    function parameters() external view returns (
        address factory,
        address pool
    );
}
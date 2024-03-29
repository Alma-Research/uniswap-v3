// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.5.0 <0.9.0;


interface UniswapV2FlashBorrowerLike {
  function uniswapV2Call(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external;
}
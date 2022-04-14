// SPDX-License-Identifier:  UNLICENSE
pragma solidity ^0.8.7;
import "./interfaces/ILiquidityValueCalculator.sol";

contract LiquidityManager is ILiquidityValueCalculator{

  address public uniswap;
  constructor(address _uniswap){
    uniswap = _uniswap;
  }

}

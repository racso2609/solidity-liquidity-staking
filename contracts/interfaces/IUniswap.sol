// SPDX-License-Identifier:  UNLICENSE
pragma solidity ^0.6.6;

interface IUniswap {
	function addLiquidity(
		address tokenA,
		address tokenB,
		uint256 amountADesired,
		uint256 amountBDesired,
		uint256 amountAMin,
		uint256 amountBMin,
		address to,
		uint256 deadline
	)
		external
		returns (
			uint256 amountA,
			uint256 amountB,
			uint256 liquidity
		);
function addLiquidityETH(
  address token,
  uint amountTokenDesired,
  uint amountTokenMin,
  uint amountETHMin,
  address to,
  uint deadline
) external payable returns (uint amountToken, uint amountETH, uint liquidity);

function permit(
	address owner, 
	address spender, 
	uint value, 
	uint deadline, 
	uint8 v, 
	bytes32 r, 
	bytes32 s
	) external;
}

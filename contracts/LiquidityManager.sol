// SPDX-License-Identifier:  UNLICENSE
pragma solidity ^0.6.6;
import "./interfaces/IUniswap.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

contract LiquidityManager  {
  // using SafeERC20 for IERC20;

	IUniswap public uniswap;
	uint256 constant DEADLINE = 5 minutes;

	constructor(address _uniswap) public {
		uniswap = IUniswap(_uniswap);
	}

	function pairInfo(address tokenA, address tokenB)
		internal
		view
		returns (
			uint256 reserveA,
			uint256 reserveB,
			uint256 totalSupply
		)
	{
		IUniswapV2Pair pair = IUniswapV2Pair(
			UniswapV2Library.pairFor(address(uniswap), tokenA, tokenB)
		);
		totalSupply = pair.totalSupply();
		(uint256 reserves0, uint256 reserves1, ) = pair.getReserves();
		(reserveA, reserveB) = tokenA == pair.token0()
			? (reserves0, reserves1)
			: (reserves1, reserves0);
	}

	function addLiquidityEth(
		address _tokenB,
		uint256 _amountTokenB,
		uint256 _amountTokenMin,
		uint256 _amountEthMin
	) external payable 
returns (uint amountToken, uint amountETH, uint liquidity)
  {
    IERC20(_tokenB).transferFrom(msg.sender,address(this),_amountTokenB);
    IERC20(_tokenB).approve(address(uniswap),_amountTokenB);

		return uniswap.addLiquidityETH{ value: msg.value }(
			_tokenB,
			_amountTokenB,
			_amountTokenMin,
			_amountEthMin,
			address(this),
			DEADLINE
		);
	}
}

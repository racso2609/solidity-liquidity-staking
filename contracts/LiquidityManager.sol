// SPDX-License-Identifier:  UNLICENSE
pragma solidity ^0.8.7;
import "./interfaces/IUniswap.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "hardhat/console.sol";

contract LiquidityManager {
	using SafeERC20 for IERC20;
	using SafeMath for uint256;
	IUniswap public uniswap;
	uint256 constant DEADLINE = 5 minutes;
	address public weth;
	address public UNISWAP_FACTORY;

	constructor(
		address _uniswap,
		address _weth,
		address _uniswapFactory
	) {
		uniswap = IUniswap(_uniswap);
		weth = _weth;
		UNISWAP_FACTORY = _uniswapFactory;
	}

	event AddLiquidity(
		address tokenA,
		address token2,
		uint256 liquidity,
		uint256 amountA,
		uint256 amountB
	);

	function sqrt(uint256 y) internal pure returns (uint256 z) {
		if (y > 3) {
			z = y;
			uint256 x = y / 2 + 1;
			while (x < z) {
				z = x;
				x = (y / x + x) / 2;
			}
		} else if (y != 0) {
			z = 1;
		}
		// else z = 0 (default value)
	}

	/*
  s = optimal swap amount
  r = amount of reserve for token a
  a = amount of token a the user currently has (not added to reserve yet)
  f = swap fee percent
  s = (sqrt(((2 - f)r)^2 + 4(1 - f)ar) - (2 - f)r) / (2(1 - f))
  */
	function getSwapAmount(uint256 r, uint256 a) public pure returns (uint256) {
		return
			(sqrt(r.mul(r.mul(3988009) + a.mul(3988000))).sub(r.mul(1997))) / 1994;
	}

	function addLiquidityEth(address _tokenOut)
		public
    payable
		returns (
			uint256,
			uint256,
			uint256
		)
	{
		address pair = IUniswapV2Factory(UNISWAP_FACTORY).getPair(
			uniswap.WETH(),
			_tokenOut
		);

		(uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(pair).getReserves();

		uint256 swapAmount;
		if (IUniswapV2Pair(pair).token0() == uniswap.WETH()) {
			// swap from token0 to token1
			swapAmount = getSwapAmount(reserve0, msg.value);
		} else {
			// swap from token1 to token0
			swapAmount = getSwapAmount(reserve1, msg.value);
		}
		uint amountTokenB = _swap(_tokenOut, swapAmount);
		return _addLiquidityEth(_tokenOut, amountTokenB, 1, 1,msg.value.sub(swapAmount));
	}

	/* @params _tokens the uniswap path of tokens  */
	/* @params _amount amount of srcTokens */
	/* @notice return a destination token amount  */

	function _getAmountsOut(address[] memory _tokens, uint256 _amount)
		internal
		view
		returns (uint256)
	{
		return uniswap.getAmountsIn(_amount, _tokens)[1];
	}

	function _swap(address _to, uint256 _amount) internal returns (uint){
		IERC20(uniswap.WETH()).approve(address(uniswap), _amount);

		address[] memory path = new address[](2);
		path = new address[](2);
		path[0] = uniswap.WETH();
		path[1] = _to;
    uint minAmount = _getAmountsOut(path, _amount);


		uniswap.swapExactETHForTokens{ value: _amount }(
			1,
			path,
			address(this),
			block.timestamp
		);

    return minAmount;
	}

	/// @param _tokenB second token pair
	/// @param _amountTokenB tokenB amount
	/// @param _amountTokenMin min token amount to return
	/// @param _amountEthMin min eth amount to return
	/// @notice add liquidity ETH/Token

	function _addLiquidityEth(
		address _tokenB,
		uint256 _amountTokenB,
		uint256 _amountTokenMin,
		uint256 _amountEthMin,
   uint _ethAmount
	)
		internal
		returns (
			uint256,
			uint256,
			uint256
		)
	{

		IERC20(_tokenB).safeApprove(address(uniswap), _amountTokenB);


		(uint256 amountToken, uint256 amountEth, uint256 liquidity) = uniswap
			.addLiquidityETH{ value: _ethAmount }(
			_tokenB,
			_amountTokenB,
			_amountTokenMin,
			_amountEthMin,
			msg.sender,
			block.timestamp + DEADLINE
		);

		emit AddLiquidity(weth, _tokenB, liquidity, amountEth, amountToken);
		return (amountToken, amountEth, liquidity);
	}

	receive() external payable {}
}

// SPDX-License-Identifier:  UNLICENSE
pragma solidity ^0.8.7;
import "./interfaces/IUniswap.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LiquidityManager {
	using SafeERC20 for IERC20;
	IUniswap public uniswap;
	uint256 constant DEADLINE = 5 minutes;
	address public weth;

	constructor(address _uniswap, address _weth) {
		uniswap = IUniswap(_uniswap);
		weth = _weth;
	}

	event AddLiquidity(
		address tokenA,
		address token2,
		uint256 liquidity,
		uint256 amountA,
		uint256 amountB
	);

	/// @param _tokenB second token pair
	/// @param _amountTokenB tokenB amount
	/// @param _amountTokenMin min token amount to return
	/// @param _amountEthMin min eth amount to return
	/// @notice add liquidity ETH/Token

	function addLiquidityEth(
		address _tokenB,
		uint256 _amountTokenB,
		uint256 _amountTokenMin,
		uint256 _amountEthMin
	) external payable {
		IERC20(_tokenB).safeTransferFrom(msg.sender, address(this), _amountTokenB);
		IERC20(_tokenB).approve(address(uniswap), _amountTokenB);
		IERC20(weth).approve(address(uniswap), msg.value);

		(uint256 amountToken, uint256 amountEth, uint256 liquidity) = uniswap
			.addLiquidityETH{ value: msg.value }(
			_tokenB,
			_amountTokenB,
			_amountTokenMin,
			_amountEthMin,
			msg.sender,
			block.timestamp + DEADLINE
		);
		emit AddLiquidity(weth, _tokenB, liquidity, amountEth, amountToken);
	}

	receive() external payable {}
}

// SPDX-License-Identifier:  UNLICENSE
pragma solidity ^0.6.6;
import "./interfaces/IUniswap.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

contract LiquidityManager  {
	IUniswap public uniswap;
	uint256 constant DEADLINE = 5 minutes;
  address public weth; 

	constructor(address _uniswap,address _weth) public {
		uniswap = IUniswap(_uniswap);
    weth = _weth;
	}

  event AddLiquidity(address tokenA,address token2,uint256 liquidity,uint256 amountA,uint256 amountB);

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
	) external payable 
  {
    IERC20(_tokenB).transferFrom(msg.sender,address(this),_amountTokenB);
    IERC20(_tokenB).approve(address(uniswap),_amountTokenB);
    IERC20(weth).approve(address(uniswap),msg.value);

		(uint amountToken,uint amountEth,uint liquidity)= uniswap.addLiquidityETH{ value: msg.value }(
			_tokenB,
			_amountTokenB,
			_amountTokenMin,
			_amountEthMin,
			address(this),
			block.timestamp + DEADLINE
		);
    emit AddLiquidity(weth,_tokenB,liquidity,amountEth,amountToken);
	}
receive() external payable { }
}

//  SPDX-License-Identifier:  UNLICENSE
pragma solidity ^0.6.6;
import "./Token.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenSale is Ownable {
	using SafeMath for uint256;
	Token public tokenContract;
	uint256 public tokenPrice;
	uint256 public tokensSold;

	constructor(Token _tokenContract, uint256 _tokenPrice) public {
		tokenContract = _tokenContract;
		tokenPrice = _tokenPrice;
	}

	event Sell(address indexed buyer, uint256 indexed numberOfTokens);

	function buyTokens(uint256 _numberOfTokens) external payable {
		// Require that value is equal to tokens
		require(msg.value == _numberOfTokens.mul(tokenPrice), "wrong eth amount");

		// Require that the contract have enought tokens
		require(
			tokenContract.balanceOf(address(this)) >= _numberOfTokens,
			"cannot purchase more tokens than avaliable"
		);
		// Require that a tranfer successfull
		require(tokenContract.transfer(msg.sender, _numberOfTokens));

		tokensSold += _numberOfTokens;

		emit Sell(msg.sender, _numberOfTokens);
	}

	function endSale() external onlyOwner {
		require(
			tokenContract.transfer(owner(), tokenContract.balanceOf(address(this)))
		);
		selfdestruct(payable(owner()));
	}
}

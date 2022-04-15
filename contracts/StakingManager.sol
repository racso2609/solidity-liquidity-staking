// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./StakingRewards.sol";
import "./interfaces/IUniswap.sol";

contract StakingRewardsFactory is Ownable {
	// immutables
	address public rewardsToken;
	uint256 public stakingRewardsGenesis;

	// address of LP Token from Uniswap
	address public stakingToken;

	// info about rewards for a particular staking token
	struct StakingRewardsInfo {
		address payable stakingRewards;
		uint256 rewardAmount;
		uint256 duration;
	}

	// rewards info by staking token
	StakingRewardsInfo public stakingRewardsTokenInfo;

	constructor(
		address _rewardsToken,
		uint256 _stakingRewardsGenesis,
		address _stakingToken,
		uint256 rewardAmount,
		uint256 rewardsDuration,
    address _uniswap,
    address _weth
	) public Ownable() {
		require(
			_stakingRewardsGenesis >= block.timestamp,
			"StakingManager::constructor: genesis too soon"
		);

		rewardsToken = _rewardsToken;
		stakingRewardsGenesis = _stakingRewardsGenesis;
		stakingToken = _stakingToken;
		stakingRewardsTokenInfo.stakingRewards = address(
			new StakingRewards(
				address(this),
				rewardsToken,
				_stakingToken,
        _uniswap,
        _weth
			)
		);
		stakingRewardsTokenInfo.rewardAmount = rewardAmount;
		stakingRewardsTokenInfo.duration = rewardsDuration;
	}

	// ---------- permissionless functions ----------

	/// @param _rewardAmount total staking amount
	/// @param _rewardsDuration staking duration
	/// @notice update staking info

	function update(uint256 _rewardAmount, uint256 _rewardsDuration)
		public
		onlyOwner
	{
		require(
			stakingRewardsTokenInfo.stakingRewards != address(0),
			"StakingManager::notifyRewardAmount: not deployed"
		);

		stakingRewardsTokenInfo.rewardAmount = _rewardAmount;
		stakingRewardsTokenInfo.duration = _rewardsDuration;
	}

	// ---------- permissionless functions ----------

	/// @notice notify reward amount for an individual staking token.
	/// @dev this is a fallback in case the notifyRewardAmounts costs too much gas to call for all contracts

	function notifyRewardAmount() public {
		require(
			block.timestamp >= stakingRewardsGenesis,
			"StakingManager::notifyRewardAmount: not ready"
		);
		require(
			stakingRewardsTokenInfo.stakingRewards != address(0),
			"StakingManager::notifyRewardAmount: not deployed"
		);

		if (
			stakingRewardsTokenInfo.rewardAmount > 0 &&
			stakingRewardsTokenInfo.duration > 0
		) {
			uint256 rewardAmount = stakingRewardsTokenInfo.rewardAmount;
			uint256 duration = stakingRewardsTokenInfo.duration;
			stakingRewardsTokenInfo.rewardAmount = 0;
			stakingRewardsTokenInfo.duration = 0;

			require(
				IERC20(rewardsToken).transfer(
					stakingRewardsTokenInfo.stakingRewards,
					rewardAmount
				),
				"StakingManager::notifyRewardAmount: transfer failed"
			);
			StakingRewards(stakingRewardsTokenInfo.stakingRewards).notifyRewardAmount(
					rewardAmount,
					duration
				);
		}
	}

	function pullExtraTokens(address token, uint256 amount) external onlyOwner {
		IERC20(token).transfer(msg.sender, amount);
	}
}

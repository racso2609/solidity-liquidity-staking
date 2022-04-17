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

	// the staking tokens for which the rewards contract has been deployed
	address[] public stakingTokens;

	// info about rewards for a particular staking token
	struct StakingRewardsInfo {
		address payable stakingRewards;
		uint256 rewardAmount;
		uint256 duration;
	}

	// rewards info by staking token
	mapping(address => StakingRewardsInfo) public stakingRewardsTokenInfo;

	constructor(
		address _rewardsToken,
		uint256 _stakingRewardsGenesis
	) public Ownable() {
		require(
			_stakingRewardsGenesis >= block.timestamp,
			"StakingManager::constructor: genesis too soon"
		);

		rewardsToken = _rewardsToken;
		stakingRewardsGenesis = _stakingRewardsGenesis;
	}

	// ---------- permissioned functions ----------

    /**
    * @notice deploy a staking reward contract for the staking token and store the rewards amount
    * @param rewardAmount total staking amount
    * @param rewardsDuration staking duration
    */
    function deploy(
        address stakingToken, 
        uint rewardAmount, 
        uint rewardsDuration, 
        address uniswap, 
        address weth
        ) public onlyOwner{
        StakingRewardsInfo storage info = stakingRewardsTokenInfo[stakingToken];
        require(
			info.stakingRewards == address(0),
			"StakingManager::deploy: staking token already deployed"
		);

        info.stakingRewards = address(
            new StakingRewards(
                /*_rewardsDistribution=*/ address(this), 
                rewardsToken, 
                stakingToken, 
                uniswap, 
                weth));
        info.rewardAmount = rewardAmount;
        info.duration = rewardsDuration;
        stakingTokens.push(stakingToken);
    }

	/// @param _rewardAmount total staking amount
	/// @param _rewardsDuration staking duration
	/// @notice update staking info

	function update(address stakingToken, uint256 _rewardAmount, uint256 _rewardsDuration)
		public
		onlyOwner
	{
        StakingRewardsInfo storage info = stakingRewardsTokenInfo[stakingToken];
		require(
			info.stakingRewards != address(0),
			"StakingManager::update: not deployed"
		);

		info.rewardAmount = _rewardAmount;
		info.duration = _rewardsDuration;
	}

	// ---------- permissionless functions ----------

	/// @notice notify reward amount for an individual staking token.

	function notifyRewardAmount(address stakingToken) public {
		require(
			block.timestamp >= stakingRewardsGenesis,
			"StakingManager::notifyRewardAmount: not ready"
		);

        StakingRewardsInfo storage info = stakingRewardsTokenInfo[stakingToken];
		require(
			info.stakingRewards != address(0),
			"StakingManager::notifyRewardAmount: not deployed"
		);

		if (
			info.rewardAmount > 0 &&
			info.duration > 0
		) {
			uint256 rewardAmount = info.rewardAmount;
			uint256 duration = info.duration;
			info.rewardAmount = 0;
			info.duration = 0;

			require(
				IERC20(rewardsToken).transfer(
					info.stakingRewards,
					rewardAmount
				),
				"StakingManager::notifyRewardAmount: transfer failed"
			);
			StakingRewards(info.stakingRewards).notifyRewardAmount(
					rewardAmount,
					duration
				);
		}
	}

	function pullExtraTokens(address token, uint256 amount) external onlyOwner {
		IERC20(token).transfer(msg.sender, amount);
	}
}

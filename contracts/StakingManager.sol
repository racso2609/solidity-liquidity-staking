// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./StakingRewards.sol";
import "./interfaces/IUniswap.sol";

contract StakingManager is Initializable, AccessControlUpgradeable {
	// immutables
	address public rewardsToken;
	uint256 public stakingRewardsGenesis;
	uint256 constant DEADLINE = 30 minutes;
	uint256 poolsAmounts;

	// info about rewards for a particular staking token
	struct StakingRewardsInfo {
		address payable stakingRewards;
		uint256 rewardAmount;
		uint256 duration;
	}

	mapping(uint256 => StakingRewardsInfo) public stakingRewardsTokenInfo;

	function initialize(address _rewardsToken, uint256 _stakingRewardsGenesis)
		public
		initializer
	{
		require(
			_stakingRewardsGenesis >= block.timestamp,
			"StakingManager::constructor: genesis too soon"
		);

		rewardsToken = _rewardsToken;
		stakingRewardsGenesis = _stakingRewardsGenesis;
    __AccessControl_init();
		_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

	}

	function setAdmin(address _newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
		grantRole(DEFAULT_ADMIN_ROLE, _newAdmin);
	}

	// ---------- permissioned functions ----------

	/**
	 * @notice deploy a staking reward contract for the staking token and store the rewards amount
	 * @param rewardAmount total staking amount
	 * @param rewardsDuration staking duration
	 */
	function deploy(
		address stakingToken,
		uint256 rewardAmount,
		uint256 rewardsDuration,
		address uniswap,
		address weth
	) public onlyRole(DEFAULT_ADMIN_ROLE) {
		StakingRewardsInfo storage info = stakingRewardsTokenInfo[poolsAmounts];

		require(
			info.stakingRewards == address(0),
			"StakingManager::deploy: staking token already deployed"
		);
		StakingRewards newContract = new StakingRewards(
			/*_rewardsDistribution=*/
			address(this),
			rewardsToken,
			stakingToken,
			uniswap,
			weth
		);

		info.stakingRewards = payable(address(newContract));
		info.rewardAmount = rewardAmount;
		info.duration = rewardsDuration;
		poolsAmounts++;
	}

	/// @param _rewardAmount total staking amount
	/// @param _rewardsDuration staking duration
	/// @notice update staking info

	function update(
		uint256 _stakeId,
		uint256 _rewardAmount,
		uint256 _rewardsDuration
	) public onlyRole(DEFAULT_ADMIN_ROLE) {
		StakingRewardsInfo storage info = stakingRewardsTokenInfo[_stakeId];
		require(
			info.stakingRewards != address(0),
			"StakingManager::update: not deployed"
		);

		info.rewardAmount = _rewardAmount;
		info.duration = _rewardsDuration;
	}

	// ---------- permissionless functions ----------

	/// @notice notify reward amount for an individual staking token.

	function notifyRewardAmount(uint256 _stakeId) public {
		require(
			block.timestamp >= stakingRewardsGenesis,
			"StakingManager::notifyRewardAmount: not ready"
		);

		StakingRewardsInfo storage info = stakingRewardsTokenInfo[_stakeId];
		require(
			info.stakingRewards != address(0),
			"StakingManager::notifyRewardAmount: not deployed"
		);

		if (info.rewardAmount > 0 && info.duration > 0) {
			uint256 rewardAmount = info.rewardAmount;
			uint256 duration = info.duration;
			info.rewardAmount = 0;
			info.duration = 0;

			require(
				IERC20(rewardsToken).transfer(info.stakingRewards, rewardAmount),
				"StakingManager::notifyRewardAmount: transfer failed"
			);
			StakingRewards(info.stakingRewards).notifyRewardAmount(
				rewardAmount,
				duration
			);
		}
	}

	function pullExtraTokens(address token, uint256 amount)
		external
		onlyRole(DEFAULT_ADMIN_ROLE)
	{
		IERC20(token).transfer(msg.sender, amount);
	}

	function stake(uint256 _amount, uint256 _stakeId) external {
		StakingRewards(stakingRewardsTokenInfo[_stakeId].stakingRewards).stake(
			_amount
		);
	}

	function stakeWithPermit(
		uint256 _amount,
		uint256 _stakeId,
		uint8 _v,
		bytes32 _r,
		bytes32 _s
	) external {
		StakingRewards(stakingRewardsTokenInfo[_stakeId].stakingRewards)
			.stakeWithPermit(_amount, DEADLINE, _v, _r, _s);
	}
}

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
  using SafeMath for uint256;
	// immutables
	address public rewardsToken;
	uint256 public stakingRewardsGenesis;
	uint256 constant DEADLINE = 30 minutes;
	uint256 public poolsAmounts;

  address[] public stakingTokens;
  event StakeCreation(address admin, address stakingReward);

	// info about rewards for a particular staking token
	struct StakingRewardsInfo {
		address payable stakingRewards;
		uint256 rewardAmount;
		uint256 duration;
	}

	mapping(address => StakingRewardsInfo) public stakingRewardsTokenInfo;

	function initialize (address _rewardsToken, uint256 _stakingRewardsGenesis)
		external
		initializer
	{

		rewardsToken = _rewardsToken;
		stakingRewardsGenesis = block.timestamp.add(_stakingRewardsGenesis);
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
		address weth,
    address _uniswapFactory
	) public onlyRole(DEFAULT_ADMIN_ROLE) {
		StakingRewardsInfo storage info = stakingRewardsTokenInfo[stakingToken];

		require(
			info.stakingRewards == address(0),
			"StakingManager::deploy: staking token already deployed"
		);
      StakingRewards newContract = new StakingRewards(
			address(this),
			rewardsToken,
			stakingToken,
			uniswap,
			weth,
      _uniswapFactory
		);

		info.stakingRewards = payable(address(newContract));
		info.rewardAmount = rewardAmount;
		info.duration = rewardsDuration;
    stakingTokens.push(stakingToken);
    poolsAmounts++;
    emit StakeCreation(msg.sender,address(newContract));
	}

	/// @param _rewardAmount total staking amount
	/// @param _rewardsDuration staking duration
	/// @notice update staking info

	function update(
		address _stakeToken,
		uint256 _rewardAmount,
		uint256 _rewardsDuration
	) public onlyRole(DEFAULT_ADMIN_ROLE) {
		StakingRewardsInfo storage info = stakingRewardsTokenInfo[_stakeToken];
		require(
			info.stakingRewards != address(0),
			"StakingManager::update: not deployed"
		);

		info.rewardAmount = _rewardAmount;
		info.duration = _rewardsDuration;
	}

	// ---------- permissionless functions ----------

	/// @notice notify reward amount for an individual staking token.

	function notifyRewardAmount(address _stakeToken) public {
		require(
			block.timestamp >= stakingRewardsGenesis,
			"StakingManager::notifyRewardAmount: not ready"
		);

		StakingRewardsInfo storage info = stakingRewardsTokenInfo[_stakeToken];
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

	function getStakingToken(address stakingToken) public view returns(StakingRewardsInfo memory) {
		return stakingRewardsTokenInfo[stakingToken];
	}
  
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./LiquidityManager.sol";

import "./interfaces/IStakingReward.sol";

import "hardhat/console.sol";

abstract contract RewardsDistributionRecipient {
	address public rewardsDistribution;

	function notifyRewardAmount(uint256 reward, uint256 duration)
		external
		virtual;

	modifier onlyRewardsDistribution() {
		require(
			msg.sender == rewardsDistribution,
			"Caller is not RewardsDistribution contract"
		);
		_;
	}
}

contract StakingRewards is
	IStakingRewards,
	RewardsDistributionRecipient,
	ReentrancyGuard,
	LiquidityManager
{
	using SafeMath for uint256;
	using SafeERC20 for IERC20;

	/* ========== STATE VARIABLES ========== */

	IERC20 public rewardsToken;
	IERC20 public stakingToken;
	uint256 public periodFinish;
	uint256 public lastUpdateTime;

	// check this
	uint256 public rewardRate;
	uint256 public rewardPerTokenStored;
	// check this

	mapping(address => uint256) public userRewardPerTokenPaid;
	mapping(address => uint256) public rewards;

	uint256 private _totalSupply;
	mapping(address => uint256) private _balances;

	/* ========== CONSTRUCTOR ========== */

	constructor(
		address _rewardsDistribution,
		address _rewardsToken,
		address _stakingToken,
		address _uniswap,
		address _weth,
		address _uniswapFactory
	) LiquidityManager(_uniswap, _weth, _uniswapFactory) {
		rewardsToken = IERC20(_rewardsToken);
		stakingToken = IERC20(_stakingToken);
		rewardsDistribution = _rewardsDistribution;
	}

	/// @notice return the total lp tokens on stake
	function totalSupply() external view override returns (uint256) {
		return _totalSupply;
	}

	/// @param _account user balance
	/// @notice return the balance lp tokens on stake
	function balanceOf(address _account)
		external
		view
		override
		returns (uint256)
	{
		return _balances[_account];
	}

	/// @notice return npi
	function lastTimeRewardApplicable() public view override returns (uint256) {
		return Math.min(block.timestamp, periodFinish);
	}

	function rewardPerToken() public view override returns (uint256) {
		if (_totalSupply == 0) {
			return rewardPerTokenStored;
		}
		return
			rewardPerTokenStored.add(
				lastTimeRewardApplicable()
					.sub(lastUpdateTime)
					.mul(rewardRate)
					.mul(1 * 10**18)
					.div(_totalSupply)
			);
	}

	/// @param _account user earned
	/// @notice return earned amount
	function earned(address _account) public view override returns (uint256) {
		return
			_balances[_account]
				.mul(rewardPerToken().sub(userRewardPerTokenPaid[_account]))
				.div(1 * 10**18)
				.add(rewards[_account]);
	}

	/* ========== MUTATIVE FUNCTIONS ========== */

	/// @param _amount lp tokens to stake
	/// @param _deadline stake deadline
	/// @param _v signature param
	/// @param _r signature param
	/// @param _s signature param
	/// @notice stake lp tokens with signature

	function stakeWithPermit(
		uint256 _amount,
		uint256 _deadline,
		uint8 _v,
		bytes32 _r,
		bytes32 _s
	) public nonReentrant updateReward(msg.sender) {
		require(_amount > 0, "Cannot stake 0");
		_totalSupply = _totalSupply.add(_amount);
		_balances[msg.sender] = _balances[msg.sender].add(_amount);

		// permit
		IUniswap(address(stakingToken)).permit(
			msg.sender,
			address(this),
			_amount,
			_deadline,
			_v,
			_r,
			_s
		);


    stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
		emit Staked(msg.sender, _amount);
	}

	/// @param _amount lp tokens to stake
	/// @notice stake lp tokens

	function stake(uint256 _amount)
		public
		override
		nonReentrant
		updateReward(msg.sender)
	{
		require(_amount > 0, "Cannot stake 0");
		_totalSupply = _totalSupply.add(_amount);
		_balances[msg.sender] = _balances[msg.sender].add(_amount);
		stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
		emit Staked(msg.sender, _amount);
	}

	function addLiquidityAndStake(address _tokenB) external payable {
		(, , uint256 liquidity) = addLiquidityEth(_tokenB);
		stake(liquidity);
	}

	/// @param _amount lp tokens to unstake
	/// @notice unstake lp tokens

	function unstake(uint256 _amount)
		public
		nonReentrant
		updateReward(msg.sender)
	{
		require(_amount > 0, "Cannot withdraw 0");
		_totalSupply = _totalSupply.sub(_amount);
		_balances[msg.sender] = _balances[msg.sender].sub(_amount);
		stakingToken.safeTransfer(msg.sender, _amount);
		emit Withdrawn(msg.sender, _amount);
	}

	/// @notice claim token reward
	function claimTokens() public nonReentrant updateReward(msg.sender) {
		uint256 reward = rewards[msg.sender];
		if (reward > 0) {
			rewards[msg.sender] = 0;
			rewardsToken.safeTransfer(msg.sender, reward);
			emit RewardPaid(msg.sender, reward);
		}
	}

	/* ========== RESTRICTED FUNCTIONS ========== */

	function notifyRewardAmount(uint256 reward, uint256 rewardsDuration)
		external
		override
		onlyRewardsDistribution
		updateReward(address(0))
	{
		require(
			block.timestamp.add(rewardsDuration) >= periodFinish,
			"Cannot reduce existing period"
		);

		if (block.timestamp >= periodFinish) {
			rewardRate = reward.div(rewardsDuration);
		} else {
			uint256 remaining = periodFinish.sub(block.timestamp);
			uint256 leftover = remaining.mul(rewardRate);
			rewardRate = reward.add(leftover).div(rewardsDuration);
		}

		// Ensure the provided reward amount is not more than the balance in the contract.
		// This keeps the reward rate in the right range, preventing overflows due to
		// very high values of rewardRate in the earned and rewardsPerToken functions;
		// Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
		uint256 balance = rewardsToken.balanceOf(address(this));
		require(
			rewardRate <= balance.div(rewardsDuration),
			"Provided reward too high"
		);

		lastUpdateTime = block.timestamp;
		periodFinish = block.timestamp.add(rewardsDuration);
		emit RewardAdded(reward, periodFinish);
	}

	/* ========== MODIFIERS ========== */

	/// @param _account user to modify earned
	/// @notice modify earns values

	modifier updateReward(address _account) {
		rewardPerTokenStored = rewardPerToken();
		lastUpdateTime = lastTimeRewardApplicable();

		if (_account != address(0)) {
			rewards[_account] = earned(_account);
			userRewardPerTokenPaid[_account] = rewardPerTokenStored;
		}
		_;
	}

	/* ========== EVENTS ========== */

	event RewardAdded(uint256 reward, uint256 periodFinish);
	event Staked(address indexed user, uint256 amount);
	event Withdrawn(address indexed user, uint256 amount);
	event RewardPaid(address indexed user, uint256 reward);
}

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
    uint public stakingRewardsGenesis;

    // address of LP Tokens ETH/DAI from Uniswap
    address public stakingToken;

    // info about rewards for a particular staking token
    struct StakingRewardsInfo {
        address stakingRewards;
        uint rewardAmount;
        uint duration;
    }

    // rewards info by staking token
    StakingRewardsInfo public stakingRewardsTokenInfo;

    constructor(
        address _rewardsToken,
        uint _stakingRewardsGenesis,
        address _stakingToken,
        uint rewardAmount,
        uint rewardsDuration
    ) Ownable() public {
        require(_stakingRewardsGenesis >= block.timestamp, 'StakingManager::constructor: genesis too soon');

        rewardsToken = _rewardsToken;
        stakingRewardsGenesis = _stakingRewardsGenesis;
        stakingToken = _stakingToken;
        stakingRewardsTokenInfo.stakingRewards = address(new stakingRewards(/*_rewardsDistribution=*/ address(this), rewardsToken, stakingToken));
        stakingRewardsTokenInfo.rewardAmount = rewardAmount;
        stakingRewardsTokenInfo.duration = rewardsDuration;
    }

    ///// permissioned functions

    function update(uint rewardAmount, uint256 rewardsDuration) public onlyOwner {
        require(stakingRewardsTokenInfo.stakingRewards != address(0), 'StakingManager::notifyRewardAmount: not deployed');

        stakingRewardsTokenInfo.rewardAmount = rewardAmount;
        stakingRewardsTokenInfo.duration = rewardsDuration;
    }



    ///// permissionless functions

    // notify reward amount for an individual staking token.
    // this is a fallback in case the notifyRewardAmounts costs too much gas to call for all contracts
    function notifyRewardAmount(address stakingToken) public {
        require(block.timestamp >= stakingRewardsGenesis, 'StakingManager::notifyRewardAmount: not ready');
        require(stakingRewardsTokenInfo.stakingRewards != address(0), 'StakingManager::notifyRewardAmount: not deployed');

        if (stakingRewardsTokenInfo.rewardAmount > 0 && stakingRewardsTokenInfo.duration > 0) {
            uint rewardAmount = stakingRewardsTokenInfo.rewardAmount;
            uint256 duration = stakingRewardsTokenInfo.duration;
            stakingRewardsTokenInfo.rewardAmount = 0;
            stakingRewardsTokenInfo.duration = 0;

            require(
                IERC20(rewardsToken).transfer(stakingRewardsTokenInfo.stakingRewards, rewardAmount),
                'StakingManager::notifyRewardAmount: transfer failed'
            );
            StakingRewards(stakingRewardsTokenInfo.stakingRewards).notifyRewardAmount(rewardAmount, duration);
        }
    }

    function pullExtraTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(msg.sender, amount);
    }
}
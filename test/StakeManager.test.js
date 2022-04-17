const { expect } = require("chai");
const { ethers } = require("hardhat");
const { fixture } = deployments;
const {
	impersonateTokens,
	getImpersonate,
	getToken,
	allowance,
	balanceOf,
} = require("../utils/tokens");
const { utils } = ethers;
const { parseEther } = utils;
const { printGas, getReceipt } = require("../utils/transactions");

describe("stake", () => {
	beforeEach(async () => {
		({ deployer, user, userNotRegister, feeRecipient } =
			await getNamedAccounts());
		DAI_TOKEN = getToken("DAI");
		UDAI_TOKEN = getToken("UDAI");
		WETH_TOKEN = getToken("WETH");

		await fixture(["liquidity","manager", "staking","ERC20"]);
		liquidityManager = await ethers.getContract("LiquidityManager");
		stakingRewards = await ethers.getContract("StakingRewards");
		rewardToken = await ethers.getContract("RewardToken");
		//stakingManager = await ethers.getContractAt("StakingManager");
	});

	describe("stake lps", () => {
		// provide liquidity to get lp
		beforeEach(async () => {
			liquidityAmount = parseEther("10");
			minToken = 1;
			minEth = 1;

			await impersonateTokens({
				to: deployer,
				from: getImpersonate("DAI").address, //dai impersonate
				tokenAddress: DAI_TOKEN.address,
				amount: liquidityAmount,
			});
			await allowance({
				to: liquidityManager.address,
				from: deployer,
				tokenAddress: DAI_TOKEN.address,
				amount: liquidityAmount,
			});

			const tx = await liquidityManager.addLiquidityEth(
				DAI_TOKEN.address,
				liquidityAmount,
				minToken,
				minEth,
				{ value: liquidityAmount }
			);
			await printGas(tx);
			stakingAmount = 100;
			await allowance({
				tokenAddress: UDAI_TOKEN.address,
				amount: stakingAmount,
				from: deployer,
				to: stakingRewards.address,
			});
		});
		describe("normal stake", () => {
			it("normal stake fail amount 0", async () => {
				await expect(stakingRewards.stake(0)).to.be.revertedWith(
					"Cannot stake 0"
				);
			});
			it("stake successfully", async () => {
				const preTotalSupply = await stakingRewards.totalSupply();
				const preBalance = await stakingRewards.balanceOf(deployer);

				const preStakingBalance = await balanceOf({
					tokenAddress: UDAI_TOKEN.address,
					from: deployer,
				});

				const tx = await stakingRewards.stake(stakingAmount);
				await printGas(tx);

				const postTotalSupply = await stakingRewards.totalSupply();

				const postBalance = await stakingRewards.balanceOf(deployer);
				const postStakingBalance = await balanceOf({
					tokenAddress: UDAI_TOKEN.address,
					from: deployer,
				});

				expect(postTotalSupply).to.be.gt(preTotalSupply);
				expect(postBalance).to.be.gt(preBalance);
				expect(preStakingBalance).to.be.gt(postStakingBalance);
			});
			it("stake event", async () => {
				await expect(stakingRewards.stake(stakingAmount))
					.to.emit(stakingRewards, "Staked")
					.withArgs(deployer, stakingAmount);
			});
		});
		describe("unstake", () => {
			beforeEach(async () => {
				const tx = await stakingRewards.stake(stakingAmount);
				await printGas(tx);
			});
			it("unstake fail amount 0", async () => {
				await expect(stakingRewards.unstake(0)).to.be.revertedWith(
					"Cannot withdraw 0"
				);
			});
			it("unstake successfully", async () => {
				const preTotalSupply = await stakingRewards.totalSupply();
				const preBalance = await stakingRewards.balanceOf(deployer);

				const preStakingBalance = await balanceOf({
					tokenAddress: UDAI_TOKEN.address,
					from: deployer,
				});

				const tx = await stakingRewards.unstake(stakingAmount);
				await printGas(tx);

				const postTotalSupply = await stakingRewards.totalSupply();

				const postBalance = await stakingRewards.balanceOf(deployer);
				const postStakingBalance = await balanceOf({
					tokenAddress: UDAI_TOKEN.address,
					from: deployer,
				});

				expect(postTotalSupply).to.be.lt(preTotalSupply);
				expect(postBalance).to.be.lt(preBalance);
				expect(preStakingBalance).to.be.lt(postStakingBalance);
			});
			it("stake event", async () => {
				await expect(stakingRewards.unstake(stakingAmount))
					.to.emit(stakingRewards, "Withdrawn")
					.withArgs(deployer, stakingAmount);
			});
		});
		describe("stake managment", () => {
			it("deploy a staking reward contract", async () => {
				
			})
		})
	});
});

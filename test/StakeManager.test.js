const { expect } = require("chai");
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
const { printGas, increaseBlocks } = require("../utils/transactions");

describe("stake", () => {
	beforeEach(async () => {
		({ deployer, user, userNotRegister, feeRecipient } =
			await getNamedAccounts());
		DAI_TOKEN = getToken("DAI");
		UDAI_TOKEN = getToken("UDAI");
		WETH_TOKEN = getToken("WETH");

		await fixture(["liquidity", "staking", "ERC20"]);
		liquidityManager = await ethers.getContract("LiquidityManager");
		stakingRewards = await ethers.getContract("StakingRewards");
		rewardToken = await ethers.getContract("RewardToken");

		userSigner = await ethers.provider.getSigner(user);
	});

	describe("stake lps", () => {
		// provide liquidity to get lp
		beforeEach(async () => {
			liquidityAmount = parseEther("5");
			minToken = 1;
			minEth = 1;

			await impersonateTokens({
				to: user,
				from: getImpersonate("DAI").address, //dai impersonate
				tokenAddress: DAI_TOKEN.address,
				amount: liquidityAmount,
			});

			await allowance({
				to: liquidityManager.address,
				from: user,
				tokenAddress: DAI_TOKEN.address,
				amount: liquidityAmount,
			});

			const tx = await liquidityManager
				.connect(userSigner)
				.addLiquidityEth(DAI_TOKEN.address, liquidityAmount, minToken, minEth, {
					value: liquidityAmount,
				});
			await printGas(tx);
			stakingAmount = 100;
			await allowance({
				tokenAddress: UDAI_TOKEN.address,
				amount: stakingAmount,
				from: user,
				to: stakingRewards.address,
			});
		});
		describe("normal stake", () => {
			it("normal stake fail amount 0", async () => {
				await expect(
					stakingRewards.connect(userSigner).stake(0)
				).to.be.revertedWith("Cannot stake 0");
			});
			it("stake successfully", async () => {
				const preTotalSupply = await stakingRewards.totalSupply();
				const preBalance = await stakingRewards.balanceOf(user);

				const preStakingBalance = await balanceOf({
					tokenAddress: UDAI_TOKEN.address,
					from: user,
				});

				const tx = await stakingRewards
					.connect(userSigner)
					.stake(stakingAmount);
				await printGas(tx);

				const postTotalSupply = await stakingRewards.totalSupply();

				const postBalance = await stakingRewards.balanceOf(user);
				const postStakingBalance = await balanceOf({
					tokenAddress: UDAI_TOKEN.address,
					from: user,
				});

				expect(postTotalSupply).to.be.gt(preTotalSupply);
				expect(postBalance).to.be.gt(preBalance);
				expect(preStakingBalance).to.be.gt(postStakingBalance);
			});
			it("stake event", async () => {
				await expect(stakingRewards.connect(userSigner).stake(stakingAmount))
					.to.emit(stakingRewards, "Staked")
					.withArgs(user, stakingAmount);
			});
		});
		describe("unstake", () => {
			beforeEach(async () => {
				const tx = await stakingRewards
					.connect(userSigner)
					.stake(stakingAmount);
				await printGas(tx);
			});
			it("unstake fail amount 0", async () => {
				await expect(stakingRewards.unstake(0)).to.be.revertedWith(
					"Cannot withdraw 0"
				);
			});
			it("unstake successfully", async () => {
				const preTotalSupply = await stakingRewards.totalSupply();
				const preBalance = await stakingRewards.balanceOf(user);

				const preStakingBalance = await balanceOf({
					tokenAddress: UDAI_TOKEN.address,
					from: user,
				});

				const tx = await stakingRewards
					.connect(userSigner)
					.unstake(stakingAmount);
				await printGas(tx);

				const postTotalSupply = await stakingRewards
					.connect(userSigner)
					.totalSupply();

				const postBalance = await stakingRewards
					.connect(userSigner)
					.balanceOf(user);
				const postStakingBalance = await balanceOf({
					tokenAddress: UDAI_TOKEN.address,
					from: user,
				});

				expect(postTotalSupply).to.be.lt(preTotalSupply);
				expect(postBalance).to.be.lt(preBalance);
				expect(preStakingBalance).to.be.lt(postStakingBalance);
			});
			it("unstake event", async () => {
				await expect(stakingRewards.connect(userSigner).unstake(stakingAmount))
					.to.emit(stakingRewards, "Withdrawn")
					.withArgs(user, stakingAmount);
			});
		});
		describe("claim tokens", () => {
			beforeEach(async () => {
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

				let tx = await liquidityManager.addLiquidityEth(
					DAI_TOKEN.address,
					liquidityAmount,
					minToken,
					minEth,
					{
						value: liquidityAmount,
					}
				);
				await printGas(tx);
				await allowance({
					tokenAddress: UDAI_TOKEN.address,
					amount: stakingAmount,
					from: user,
					to: stakingRewards.address,
				});

				// tx = await stakingRewards.stake(stakingAmount);
				// await printGas(tx);

				tx = await stakingRewards.connect(userSigner).stake(stakingAmount);
				await printGas(tx);
				// tx = await stakingRewards.notifyRewardAmount(1, 10);
				// await printGas(tx);
			});
			it("claim token", async () => {
				await increaseBlocks(1000);
				const preRewardBalance = await balanceOf({
					tokenAddress: rewardToken.address,
					from: user,
				});
				const tx = await stakingRewards.connect(userSigner).claimTokens();
				await printGas(tx);

				const postRewardBalance = await balanceOf({
					tokenAddress: rewardToken.address,
					from: user,
				});
				expect(postRewardBalance).to.be.gt(preRewardBalance);
			});
		});
	});
});

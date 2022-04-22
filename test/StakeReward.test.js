const { expect } = require("chai");
const { fixture } = deployments;
const {
	impersonateTokens,
	getImpersonate,
	getToken,
	allowance,
	balanceOf,
	getContract,
	transfer,
} = require("../utils/tokens");
const { utils } = ethers;
const { parseEther } = utils;
const {
	printGas,
	increaseBlocks,
	increaseTime,
} = require("../utils/transactions");
const { signERC2612Permit } = require("eth-permit");

describe("stake", () => {
	beforeEach(async () => {
		({ deployer, user, userNotRegister, feeRecipient } =
			await getNamedAccounts());
		DAI_TOKEN = getToken("DAI");
		UDAI_TOKEN = getToken("UDAI");
		WETH_TOKEN = getToken("WETH");
		UNISWAP = getContract("UNISWAP");
		userSigner = await ethers.getSigner(user);

		await fixture(["liquidity", "manager", "staking", "ERC20"]);
		liquidityManager = await ethers.getContract("LiquidityManager");
		stakingRewards = await ethers.getContract("StakingRewards");
		rewardToken = await ethers.getContract("RewardToken");
		//stakingManager = await ethers.getContractAt("StakingManager");

		rpcUrl = `${process.env.URL}/${process.env.ALCHEMY_KEY}`;
		privateKey = process.env.SIGNER_PV_KEY;
		provider = new ethers.providers.JsonRpcProvider(rpcUrl);
		signer = new ethers.Wallet(privateKey, provider);
		signerAddress = await signer.getAddress();
	});

	describe("stake lps", () => {
		// provide liquidity to get lp
		beforeEach(async () => {
			liquidityAmount = parseEther("10");
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
				.addLiquidityEth(DAI_TOKEN.address, {
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
				var amount = (await rewardToken.balanceOf(deployer)).toString();
				//console.log(amount);
				await transfer({
					tokenAddress: rewardToken.address,
					amount: amount,
					from: deployer,
					to: stakingRewards.address,
				});
				amount = (await rewardToken.balanceOf(deployer)).toString();
				//console.log(amount);
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

				let tx = await liquidityManager.addLiquidityEth(DAI_TOKEN.address, {
					value: liquidityAmount,
				});

				tx = await liquidityManager
					.connect(userSigner)
					.addLiquidityEth(DAI_TOKEN.address, {
						value: liquidityAmount,
					});

				await printGas(tx);
				await allowance({
					tokenAddress: UDAI_TOKEN.address,
					amount: stakingAmount,
					from: user,
					to: stakingRewards.address,
				});

				await allowance({
					tokenAddress: UDAI_TOKEN.address,
					amount: stakingAmount,
					from: deployer,
					to: stakingRewards.address,
				});

				rewardAmount = 100000;
				rewardAmountDuration = 60 * 60 * 24 * 4 * 30 * 7;

				tx = await stakingRewards.connect(userSigner).stake(stakingAmount / 2);
				await printGas(tx);

				tx = await stakingRewards.stake(stakingAmount / 2);
				await printGas(tx);

				tx = await stakingRewards.notifyRewardAmount(10000000000000, 10000000);
				await printGas(tx);
			});

			it("claim token", async () => {
				await increaseTime(60 * 60 * 24 * 3);
				const userBalance = (await stakingRewards.balanceOf(user)).toString();
				//console.log("user Balance: " + userBalance);
				const preRewardBalance = await balanceOf({
					tokenAddress: rewardToken.address,
					from: user,
				});

				tx = await stakingRewards.connect(userSigner).claimTokens();
				await printGas(tx);

				const postRewardBalance = await balanceOf({
					tokenAddress: rewardToken.address,
					from: user,
				});
				//console.log("Post Reward Balance: " + postRewardBalance);
				expect(postRewardBalance).to.be.gt(preRewardBalance);
			});
			it("reward amount", async () => {
				const tx = await stakingRewards.notifyRewardAmount(
					rewardAmount,
					rewardAmountDuration
				);
				await printGas(tx);

				expect(stakingRewards.rewardRate).to.be.not.equal(0);
			});
			it("reward amount event", async () => {
				await expect(
					stakingRewards.notifyRewardAmount(rewardAmount, rewardAmountDuration)
				).to.emit(stakingRewards, "RewardAdded");
			});

			// it("claim tokens event", async () => {
			//	let tx = await stakingRewards.notifyRewardAmount(
			//		rewardAmount,
			//		rewardAmountDuration
			//	);
			//	await printGas(tx);

			//	await expect(stakingRewards.connect(userSigner).claimTokens()).to.emit(
			//		stakingRewards,
			//		"RewardPaid"
			//	);
			// });
		});
	});

	describe("add liquidity and stake", () => {
		beforeEach(async () => {
			liquidityAmount = parseEther("1000");
			ethAmount = parseEther("0.004");

			await allowance({
				to: stakingRewards.address,
				from: user,
				tokenAddress: UDAI_TOKEN.address,
				amount: liquidityAmount,
			});
		});
		it("successfully", async () => {
			const preStakingBalance = await balanceOf({
				tokenAddress: UDAI_TOKEN.address,
				from: user,
			});

			const preTotalSupply = await stakingRewards.totalSupply();
			const preStakedBalance = await stakingRewards.balanceOf(user);

			tx = await stakingRewards
				.connect(userSigner)
				.addLiquidityAndStake(DAI_TOKEN.address, { value: ethAmount });
			const postStakingBalance = await balanceOf({
				tokenAddress: UDAI_TOKEN.address,
				from: user,
			});
			const postTotalSupply = await stakingRewards.totalSupply();
			const postStakedBalance = await stakingRewards.balanceOf(user);

			expect(postStakingBalance).to.be.eq(preStakingBalance);
			expect(postTotalSupply).to.be.gt(preTotalSupply);
			expect(postStakedBalance).to.be.gt(preStakedBalance);
		});
		it("should emit add liquidity event", async () => {
			await expect(
				stakingRewards.addLiquidityAndStake(DAI_TOKEN.address, {
					value: ethAmount,
				})
			).to.emit(stakingRewards, "AddLiquidity");
		});
		it("should staked event", async () => {
			await expect(
				stakingRewards.addLiquidityAndStake(DAI_TOKEN.address, {
					value: ethAmount,
				})
			).to.emit(stakingRewards, "Staked");
		});
	});
	describe("permit", () => {
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
				.addLiquidityEth(DAI_TOKEN.address, {
					value: liquidityAmount,
				});
			await printGas(tx);
			stakingAmount = 100;
			result = await signERC2612Permit(
				signer,
				UDAI_TOKEN.address,
				signerAddress,
				stakingRewards.address,
				stakingAmount
			);
		});
		it("stake successfully with permit", async () => {
			const preTotalSupply = await stakingRewards.totalSupply();

			const preBalance = await stakingRewards.balanceOf(signerAddress);

			const tx = await stakingRewards
				.connect(userSigner)
				.stakeWithPermit(
					stakingAmount,
					result.deadline,
					result.v,
					result.r,
					result.s
				);
			await printGas(tx);

			const postTotalSupply = await stakingRewards.totalSupply();

			const postBalance = await stakingRewards.balanceOf(signerAddress);
			const stakingBalance = await balanceOf({
				tokenAddress: UDAI_TOKEN.address,
				from: signerAddress,
			});

			expect(postTotalSupply).to.be.gt(preTotalSupply);
			expect(postBalance).to.be.gt(preBalance);
			expect(stakingBalance).to.be.gt(0);
		});
	});
});

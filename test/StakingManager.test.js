const { expect } = require("chai");
const { fixture } = deployments;
const { getContract, getToken, transfer } = require("../utils/tokens");
const {
	printGas,
	currentTime,
	increaseTime,
} = require("../utils/transactions");
const { IERC20 } = require("../utils/tokens");

describe("Staking manager", () => {
	beforeEach(async () => {
		({ deployer, user, userNotRegister, feeRecipient } =
			await getNamedAccounts());

		await fixture(["liquidity", "manager", "staking", "ERC20"]);
		liquidityManager = await ethers.getContract("LiquidityManager");
		stakingRewards = await ethers.getContract("StakingRewards");
		rewardToken = await ethers.getContract("RewardToken");
		stakingManager = await ethers.getContract("StakingManager");

		UDAI_TOKEN = getToken("UDAI");
		DAI_TOKEN = getToken("DAI");
		UNISWAP = getContract("UNISWAP");
		WETH_TOKEN = getToken("WETH");

		stakingToken = null;
		rewardAmount = 100 * 10 ** 18;
		rewardDuration = (await currentTime()) + 7776000;
	});

	describe("deploy", () => {
		it("deploy a staking token in the contract", async () => {
			let stakingToken = await stakingManager.getStakingToken(
				UDAI_TOKEN.address
			);
			expect(stakingToken[0]).to.be.equal(
				"0x0000000000000000000000000000000000000000"
			);
			expect(stakingToken[1]).to.be.equal(0);
			expect(stakingToken[2]).to.be.equal(0);
			const tx = await stakingManager.deploy(
				UDAI_TOKEN.address,
				rewardAmount.toString(),
				rewardDuration,
				UNISWAP.address,
				WETH_TOKEN.address
			);
			await printGas(tx);

			stakingToken = await stakingManager.getStakingToken(UDAI_TOKEN.address);
			expect(stakingToken.stakingRewards).to.be.not.equal(
				"0x0000000000000000000000000000000000000000"
			);
			expect(stakingToken.rewardAmount).to.be.equal(rewardAmount.toString());
			expect(stakingToken.duration).to.be.equal(rewardDuration);
		});

		it("Should fail if a staking token is already deployed in the contract", async () => {
			await stakingManager.deploy(
				UDAI_TOKEN.address,
				rewardAmount.toString(),
				rewardDuration,
				UNISWAP.address,
				WETH_TOKEN.address
			);
			await expect(
				stakingManager.deploy(
					UDAI_TOKEN.address,
					rewardAmount.toString(),
					rewardDuration,
					UNISWAP.address,
					WETH_TOKEN.address
				)
			).to.be.revertedWith(
				"StakingManager::deploy: staking token already deployed"
			);
		});
	});

	describe("update", () => {
		it("update a staking token in the contract", async () => {
			// deploying a staking token
			let tx = await stakingManager.deploy(
				UDAI_TOKEN.address,
				rewardAmount.toString(),
				rewardDuration,
				UNISWAP.address,
				WETH_TOKEN.address
			);
			await printGas(tx);
			stakingToken = await stakingManager.getStakingToken(UDAI_TOKEN.address);
			expect(stakingToken[0]).to.be.not.equal(
				"0x0000000000000000000000000000000000000000"
			);
			expect(stakingToken[1]).to.be.equal(rewardAmount.toString());
			expect(stakingToken[2]).to.be.equal(rewardDuration);

			// updating the staking token
			rewardAmount += 10 * 10 ** 18; // 10 tokens
			rewardDuration += 86400; // 1 day
			tx = await stakingManager.update(
				UDAI_TOKEN.address,
				rewardAmount.toString(),
				rewardDuration
			);
			stakingToken = await stakingManager.getStakingToken(UDAI_TOKEN.address);
			expect(stakingToken[0]).to.be.not.equal(
				"0x0000000000000000000000000000000000000000"
			);
			expect(stakingToken[1]).to.be.equal(rewardAmount.toString());
			expect(stakingToken[2]).to.be.equal(rewardDuration);
		});

		it("should fail if staking token is not deployed yet", async () => {
			// updating the staking token
			rewardAmount += 10 * 10 ** 18; // 10 tokens
			rewardDuration += 86400; // 1 day
			await expect(
				stakingManager.update(
					UDAI_TOKEN.address,
					rewardAmount.toString(),
					rewardDuration
				)
			).to.be.revertedWith("StakingManager::update: not deployed");
		});
	});

	describe("notify", () => {
		it("should fail if the staking is not ready yet", async () => {
			await expect(
				stakingManager.notifyRewardAmount(UDAI_TOKEN.address)
			).to.be.revertedWith("StakingManager::notifyRewardAmount: not ready");
		});

		it("should fail if the staking token is not deployed", async () => {
			await increaseTime(7776001);
			await expect(
				stakingManager.notifyRewardAmount(UDAI_TOKEN.address)
			).to.be.revertedWith("StakingManager::notifyRewardAmount: not deployed");
		});

		it("should notify the rewards tokens for the staking token", async () => {
			await stakingManager.deploy(
				UDAI_TOKEN.address,
				rewardAmount.toString(),
				rewardDuration,
				UNISWAP.address,
				WETH_TOKEN.address
			);
			await increaseTime(7776001);
			const rewardToken = await hre.ethers.getContractAt(
				IERC20,
				await stakingManager.rewardsToken()
			);
			const amount = (await rewardToken.balanceOf(deployer)).toString();
			await transfer({
				tokenAddress: rewardToken.address,
				amount: amount,
				from: deployer,
				to: stakingManager.address,
			});
			expect(
				await stakingManager.notifyRewardAmount(UDAI_TOKEN.address)
			).to.emit(stakingRewards, "RewardAdded");
			const stakingToken = await stakingManager.getStakingToken(
				UDAI_TOKEN.address
			);
			expect(stakingToken[1]).to.be.equal(0);
			expect(stakingToken[2]).to.be.equal(0);
		});
	});
});


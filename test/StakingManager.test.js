const { expect } = require("chai");
const { fixture } = deployments;
const {
    getContract,
	getToken,
    transfer,
} = require("../utils/tokens");
const { utils } = ethers;
const { parseEther } = utils;
const { printGas, currentTime, increaseTime } = require("../utils/transactions");

describe("Staking manager", () => {
    beforeEach(async () => {
        ({ deployer, user, userNotRegister, feeRecipient } =
			await getNamedAccounts());
		DAI_TOKEN = getToken("DAI");

		await fixture(["liquidity", "manager", "staking", "ERC20"]);
		liquidityManager = await ethers.getContract("LiquidityManager");
		stakingRewards = await ethers.getContract("StakingRewards");
		rewardToken = await ethers.getContract("RewardToken");
		stakingManager = await ethers.getContract("StakingManager");
    });

    describe("deploy", () => {
        UDAI_TOKEN = getToken("UDAI");
        UNISWAP = getContract("UNISWAP");
        WETH_TOKEN = getToken("WETH");
        it("deploy a staking token in the contract", async () => {
            var stakingToken = await stakingManager.getStakingToken(UDAI_TOKEN.address);
            const rewardAmount = 100*10**18;
            const rewardDuration = await currentTime() + 7776000;
            expect(stakingToken[0]).to.be.equal('0x0000000000000000000000000000000000000000');
            expect(stakingToken[1]).to.be.equal(0);
            expect(stakingToken[2]).to.be.equal(0);
            const tx = await stakingManager.deploy(UDAI_TOKEN.address, rewardAmount.toString(), rewardDuration, UNISWAP.address, WETH_TOKEN.address);
            await printGas(tx);
            stakingToken = await stakingManager.getStakingToken(UDAI_TOKEN.address);
            expect(stakingToken[0]).to.be.not.equal('0x0000000000000000000000000000000000000000');
            expect(stakingToken[1]).to.be.equal(rewardAmount.toString());
            expect(stakingToken[2]).to.be.equal(rewardDuration);
        });

        it("Should fail if a staking token is already deployed in the contract", async () => {
            const rewardAmount = 100*10**18;
            const rewardDuration = await currentTime() + 7776000;
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
            )
            .to.be.revertedWith("StakingManager::deploy: staking token already deployed");
        });
    });

    describe("update", () => {
        UDAI_TOKEN = getToken("UDAI");
        UNISWAP = getContract("UNISWAP");
        WETH_TOKEN = getToken("WETH");
        it("update a staking token in the contract", async () => {
            // deploying a staking token
            var stakingToken;
            var rewardAmount = 100*10**18;
            var rewardDuration = await currentTime() + 7776000;
            var tx = await stakingManager.deploy(UDAI_TOKEN.address, rewardAmount.toString(), rewardDuration, UNISWAP.address, WETH_TOKEN.address);
            await printGas(tx);
            stakingToken = await stakingManager.getStakingToken(UDAI_TOKEN.address);
            expect(stakingToken[0]).to.be.not.equal('0x0000000000000000000000000000000000000000');
            expect(stakingToken[1]).to.be.equal(rewardAmount.toString());
            expect(stakingToken[2]).to.be.equal(rewardDuration);

            // updating the staking token
            rewardAmount+= 10*10**18; // 10 tokens
            rewardDuration+= 86400; // 1 day 
            tx = await stakingManager.update(UDAI_TOKEN.address, rewardAmount.toString(), rewardDuration);
            stakingToken = await stakingManager.getStakingToken(UDAI_TOKEN.address);
            expect(stakingToken[0]).to.be.not.equal('0x0000000000000000000000000000000000000000');
            expect(stakingToken[1]).to.be.equal(rewardAmount.toString());
            expect(stakingToken[2]).to.be.equal(rewardDuration);
        });

        it("should fail if staking token is not deployed yet", async () => {
            var rewardAmount = 100*10**18;
            var rewardDuration = await currentTime() + 7776000;

            // updating the staking token
            rewardAmount+= 10*10**18; // 10 tokens
            rewardDuration+= 86400; // 1 day 
            await expect(stakingManager.update(
                UDAI_TOKEN.address, 
                rewardAmount.toString(), 
                rewardDuration
                )
            )
            .to.be.revertedWith("StakingManager::update: not deployed");
        });
    });

    describe("notify", () => {
        UDAI_TOKEN = getToken("UDAI");
        UNISWAP = getContract("UNISWAP");
        WETH_TOKEN = getToken("WETH");
        it("should fail if the staking is not ready yet", async () => {
            await expect(stakingManager.notifyRewardAmount(UDAI_TOKEN.address))
            .to.be.revertedWith("StakingManager::notifyRewardAmount: not ready");
        });

        it("should fail if the staking token is not deployed", async () => {
            await increaseTime(7776001);
            await expect(stakingManager.notifyRewardAmount(UDAI_TOKEN.address))
            .to.be.revertedWith("StakingManager::notifyRewardAmount: not deployed");
        });

        it("should notify the rewards tokens for the staking token", async () => {
            const rewardAmount = 100*10**18;
            const rewardDuration = await currentTime() + 7776000;
            await stakingManager.deploy(
                UDAI_TOKEN.address, 
                rewardAmount.toString(), 
                rewardDuration, 
                UNISWAP.address, 
                WETH_TOKEN.address
            );
            await increaseTime(7776001);
            const IERC20 = require("../abi/ERC20.json");
            const rewardToken = await hre.ethers.getContractAt(IERC20, await stakingManager.rewardsToken());
            const amount = (await rewardToken.balanceOf(deployer)).toString();
            await transfer({
				tokenAddress: rewardToken.address,
				amount: amount,
				from: deployer,
				to: stakingManager.address,
			});
            expect(await stakingManager.notifyRewardAmount(UDAI_TOKEN.address))
            .to.emit(stakingRewards, "RewardAdded");
            var stakingToken = await stakingManager.getStakingToken(UDAI_TOKEN.address);
            expect(stakingToken[1]).to.be.equal(0);
            expect(stakingToken[2]).to.be.equal(0);
        });
    });
});
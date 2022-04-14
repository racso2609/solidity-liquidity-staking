const { expect } = require("chai");
const { fixture } = deployments;
const { getContract, getToken } = require("../utils/tokens");
//const { utils } = ethers;
//const { parseEther } = utils;
//
describe("Liquidity Manager", () => {
	beforeEach(async () => {
		({ deployer, user, userNotRegister, feeRecipient } =
			await getNamedAccounts());
		DAI_TOKEN = getToken("DAI");

		// [admin, buyer] = await ethers.getSigners();

		await fixture(["liquidity"]);
		liquidityManager = await ethers.getContract("LiquidityManager");
		UNISWAP = getContract("UNISWAP");
	});
	describe("basic config", () => {
		it("correct uniswap address", async () => {
			expect(await liquidityManager.uniswap()).to.be.eq(UNISWAP.address);
		});
	});
	describe("add liquidity", async () => {
		beforeEach(async () => {
			liquidityAmount = 100;
			minToken = 90;
			minEth = 90;
		});
		it("fail dont make approve", async () => {
			await expect(
				liquidityManager.addLiquidityEth(
					DAI_TOKEN.address,
					liquidityAmount,
					minToken,
					minEth,
					{ value: liquidityAmount }
				)
			).to.be.reverted;
		});
	});
});

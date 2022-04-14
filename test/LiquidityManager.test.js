const { expect } = require("chai");
const { fixture } = deployments;
const {
	impersonateTokens,
	getImpersonate,
	getContract,
	getToken,
	allowance,
} = require("../utils/tokens");
const { utils } = ethers;
const { parseEther } = utils;
const { printGas, getReceipt } = require("../utils/transactions");
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

		WETH_TOKEN = getToken("WETH");
	});
	describe("basic config", () => {
		it("correct uniswap address", async () => {
			expect(await liquidityManager.uniswap()).to.be.eq(UNISWAP.address);
		});
		it("correct WETH address", async () => {
			expect(await liquidityManager.weth()).to.be.eq(WETH_TOKEN.address);
		});
	});
	describe("add liquidity", async () => {
		beforeEach(async () => {
			liquidityAmount = parseEther("10"); // 10$ dai
			minToken = 1;
			minEth = 1;

			await impersonateTokens({
				to: deployer,
				from: getImpersonate("DAI").address, //dai impersonate
				tokenAddress: DAI_TOKEN.address,
				amount: liquidityAmount,
			});
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
		it("add liquidity successfully", async () => {
			await allowance({
				to: liquidityManager.address,
				from: deployer,
				tokenAddress: DAI_TOKEN.address,
				amount: liquidityAmount,
			});

			await expect(
				liquidityManager.addLiquidityEth(
					DAI_TOKEN.address,
					liquidityAmount,
					minToken,
					minEth,
					{ value: parseEther("0.00334191") } // 10$ en eth
				)
			)
				.to.emit(liquidityManager, "AddLiquidity")
				.withArgs(
					WETH_TOKEN.address,
					DAI_TOKEN.address,
					"110547290024352590",
					"3311626268307640",
					"10000000000000000000"
				);
		});
	});
});
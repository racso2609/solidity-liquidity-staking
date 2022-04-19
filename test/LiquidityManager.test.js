const { expect } = require("chai");
const { fixture } = deployments;
const { getContract, getToken, balanceOf } = require("../utils/tokens");
const { utils } = ethers;
const { parseEther } = utils;
const { printGas } = require("../utils/transactions");
//
describe("Liquidity Manager", () => {
	beforeEach(async () => {
		({ deployer, user, userNotRegister, feeRecipient } =
			await getNamedAccounts());
		DAI_TOKEN = getToken("DAI");

		await fixture(["liquidity"]);
		liquidityManager = await ethers.getContract("LiquidityManager");

		UNISWAP = getContract("UNISWAP");
		UNISWAP_FACTORY = getContract("UNISWAP_FACTORY");
		WETH_TOKEN = getToken("WETH");
	});
	describe("basic config", () => {
		it("correct uniswap address", async () => {
			expect(await liquidityManager.uniswap()).to.be.eq(UNISWAP.address);
		});
		it("correct WETH address", async () => {
			expect(await liquidityManager.weth()).to.be.eq(WETH_TOKEN.address);
		});
		it("correct UNISWAP-FACTORY address", async () => {
			expect(await liquidityManager.UNISWAP_FACTORY()).to.be.eq(
				UNISWAP_FACTORY.address
			);
		});
	});
	describe("add liquidity", async () => {
		beforeEach(async () => {
			ethAmount = parseEther("2");

			UDAI_TOKEN = getToken("UDAI");
		});

		it("add liquidity successfully", async () => {
			const preBalanceOfUDAI = await balanceOf({
				tokenAddress: UDAI_TOKEN.address,
				from: deployer,
			});

			const tx = await liquidityManager.addLiquidityEth(
				DAI_TOKEN.address,

				{ value: ethAmount }
			);
			await printGas(tx);

			const postBalanceOfUDAI = await balanceOf({
				tokenAddress: UDAI_TOKEN.address,
				from: deployer,
			});

			expect(postBalanceOfUDAI).to.be.gt(preBalanceOfUDAI);
		});
		it("add liquidity event", async () => {
			await expect(
				liquidityManager.addLiquidityEth(DAI_TOKEN.address, {
					value: ethAmount,
				})
			).to.emit(liquidityManager, "AddLiquidity");
		});
	});
});

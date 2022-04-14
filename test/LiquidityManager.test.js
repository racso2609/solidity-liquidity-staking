const { expect } = require("chai");
const { fixture } = deployments;
//const { utils } = ethers;
//const { parseEther } = utils;
//
describe("Liquidity Manager", () => {
	beforeEach(async () => {
		[admin, buyer] = await ethers.getSigners();
		await fixture(["liquidity"]);
		liquidityManager = await ethers.getContract("LiquidityManager");
	});
});

const CONTRACT_NAME = "LiquidityManager";
const { getContract } = require("../utils/tokens");
const UNISWAP = getContract("UNISWAP");

// modify when needed
module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	// Upgradeable Proxy
	await deploy(CONTRACT_NAME, {
		from: deployer,
		log: true,
		args: [UNISWAP.address],
	});
};

module.exports.tags = [CONTRACT_NAME, "liquidity"];

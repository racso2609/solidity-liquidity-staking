const CONTRACT_NAME = "StakingRewards";
const { getToken, getContract } = require("../utils/tokens");
const UDAI_TOKEN = getToken("UDAI");
const UNISWAP = getContract("UNISWAP");
const WETH_TOKEN = getToken("WETH");
const UNISWAP_FACTORY = getContract("UNISWAP_FACTORY");

// modify when needed
module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	const RewardToken = await deployments.get("RewardToken");

	// Upgradeable Proxy
	await deploy(CONTRACT_NAME, {
		from: deployer,
		log: true,
		args: [
			deployer,
			RewardToken.address,
			UDAI_TOKEN.address,
			UNISWAP.address,
			WETH_TOKEN.address,
			UNISWAP_FACTORY.address,
		],
	});
};

module.exports.tags = [CONTRACT_NAME, "staking"];
module.exports.dependencies = ["RewardToken"];

const CONTRACT_NAME = "StakingRewards";
const { getToken } = require("../utils/tokens");
const UDAI_TOKEN = getToken("UDAI");

// modify when needed
module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	const RewardToken = await deployments.get("RewardToken");

	// Upgradeable Proxy
	await deploy(CONTRACT_NAME, {
		from: deployer,
		log: true,
		args: [deployer, RewardToken.address, UDAI_TOKEN.address],
	});
};

module.exports.tags = [CONTRACT_NAME, "staking"];
module.exports.dependencies = ["RewardToken"];

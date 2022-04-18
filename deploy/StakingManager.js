const CONTRACT_NAME = "StakingManager";
const { currentTime } = require("../utils/transactions");
const genesisTime = 7776000; // 3 months

// modify when needed
module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	const RewardToken = await deployments.get("RewardToken");
	const time = (await currentTime()) + genesisTime;

	// Upgradeable Proxy
	await deploy(CONTRACT_NAME, {
		from: deployer,
		log: true,
		proxy: {
			execute: {
				init: {
					methodName: "initialize",
					args: [RewardToken.address, time],
				},
			},
		},
	});
};

module.exports.tags = [CONTRACT_NAME, "manager"];
module.exports.dependencies = ["RewardToken"];

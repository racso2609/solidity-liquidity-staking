const CONTRACT_NAME = "RewardToken";

// modify when needed
module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	// Upgradeable Proxy
	await deploy(CONTRACT_NAME, {
		from: deployer,
		log: true,
		args: [],
	});
};

module.exports.tags = [CONTRACT_NAME, "ERC20"];

const ERC20ABI = require("@openzeppelin/contracts/build/contracts/ERC20.json");
const abi = ERC20ABI.abi;

const networkId = process.env.NETWORK_ID;

async function allowance({ tokenAddress, to, from, amount }) {
	const signer = await ethers.provider.getSigner(from);

	const tokenContract = new ethers.Contract(tokenAddress, abi, signer.provider);
	const txApprove = await tokenContract.connect(signer).approve(to, amount);

	await txApprove.wait();
}
async function transfer({ tokenAddress, to, from, amount }) {
	const signer = await ethers.provider.getSigner(from);

	const tokenContract = new ethers.Contract(tokenAddress, abi, signer.provider);
	const txApprove = await tokenContract.connect(signer).transfer(to, amount);

	await txApprove.wait();
}

async function balanceOf({ tokenAddress, from }) {
	const signer = await ethers.provider.getSigner(from);

	const tokenContract = new ethers.Contract(tokenAddress, abi, signer.provider);
	const balanceOf = await tokenContract.connect(signer).balanceOf(from);

	return balanceOf;
}
async function impersonateTokens({ to, from, tokenAddress, amount }) {
	await hre.network.provider.request({
		method: "hardhat_impersonateAccount",
		params: [from],
	});
	const signer = await ethers.provider.getSigner(from);

	const tokenContract = new ethers.Contract(tokenAddress, abi, signer.provider);
	const tx = await tokenContract.connect(signer).transfer(to, amount);
	await tx.wait();
}

function getToken(symbol) {
	const token = tokens[networkId]?.find((t) => t.symbol === symbol);

	if (!token)
		throw new Error(`Token ${symbol} not available on network ${networkId}`);
	return token;
}

const tokens = {
	[1]: [
		{
			decimals: 18,
			symbol: "ETH",
			address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
		},
		{
			decimals: 18,
			symbol: "LINK",
			address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
		},
		{
			decimals: 6,
			symbol: "USDC",
			address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		},
		{
			decimals: 8,
			symbol: "CDAI",
			address: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
		},
		{
			decimals: 18,
			symbol: "DAI",
			address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
		},
		{
			decimals: 18,
			symbol: "ALBT",
			address: "0x00a8b738E453fFd858a7edf03bcCfe20412f0Eb0",
		},
	],
	[137]: [
		{
			decimals: 18,
			symbol: "MATIC",
			address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
		},
		{
			decimals: 8,
			symbol: "WBTC",
			address: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
		},
		{
			decimals: 18,
			symbol: "WETH",
			address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
		},
	],
};

const contracts = {
  1:{
    address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D" 
    name: "UNISWAP"
  }
}

const getContract = (name)=>{
	const contract = contracts[networkId]?.find((t) => t.name === name);

	if (!contract)
		throw new Error(`Contract ${name} not available on network ${networkId}`);
	return contract;

}

module.exports = {
	allowance,
	balanceOf,
	impersonateTokens,
	tokens,
	getToken,
  contracts,
  getContract,
	transfer,
};

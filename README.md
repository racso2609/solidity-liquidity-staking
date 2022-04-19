- SLP staking liquidity

our stake contract use RT tokens to pay reward to the user, using uniSwapV2 we provide liquidity to any ETH/Token pool, and using this lp Token we can use or stake contract, we create a stakeManage that allow use create differente stakes contracts using anu ETH/Token pool

  - ENV
   
    * SIGNER_PV_KEY : run npx hardhat node and add here the private key of the signer with index 2
    * URL: url of the net to test, we recommend use https://eth-mainnet.alchemyapi.io/v2
    * NETWORK_ID: netId from test network
    * MNEMONIC: mnemonic using for hardhat 
    * ALCHEMY_KEY: alchemy api key
    * ETHERSCAN: api key
    * REPORT_GAS: report gas flag


  - Addresses


deploying "RewardToken" (tx: 0xb8099055e3fdbe6bc6483a92acc5f66cfce611c57250a204034a59ae1c87b69b)...: deployed at 0x9Abd96cB9Ee22D7608812AC279020E6e885786fd with 1835247 gas

deploying "StakingManager_Implementation" (tx: 0xf1c1b07e920836ff7246389969bd2f7947cd42b3e672028f8426f66b71e7c2f0)...: deployed at 0x889829764ba70B8d719eacb4f63142071a2A2e14 with 2593142 gas

deploying "StakingManager_Proxy" (tx: 0x60355177567fba24ac5787543410ab5deaacb8a72c7433a6a7a7bd613b662006)...: deployed at 0xd8878def8F3d06a7b4bEF93bBb427DEb856a6368 with 709852 gas
Done in 56.96s.one in 60.40s.

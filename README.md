- SLP staking liquidity

our stake contract use RT tokens to pay reward to the user, using uniSwapV2 we provide liquidity to any ETH/Token pool, and using this lp Token we can use or stake contract, we create a stakeManage that allow use create differente stakes contracts using anu ETH/Token pool

  - Scripts
    ## Dependencies

    Install dependencies with `yarn`
  
    ## Compiling

    ```
    yarn compile
    ```

    ## Testing

    ```
    yarn test
    yarn test:coverage
    ```

    ## Deploying
    To deploy the contract in the rinkeby network use

    ```
    yarn deploy:test
    ```

  - ENV

    * SIGNER_PV_KEY : run npx hardhat node and add here the private key of the signer with index 2
    * URL: url of the net to test, we recommend use https://eth-mainnet.alchemyapi.io/v2
    * NETWORK_ID: netId from test network
    * MNEMONIC: mnemonic using for hardhat 
    * ALCHEMY_KEY: alchemy api key
    * ETHERSCAN: api key
    * REPORT_GAS: report gas flag


  - Addresses


deploying "RewardToken" (tx: 0xb48452089fa6cc87d5746172d0c086487969f07efcff27567db9e2b247d8192e)...: deployed at 0xa399f67C61740f565bff49d39103EA0Bc18B1C29 with 1835247 gas

deploying "StakingManager_Implementation" (tx: 0x37cf0967f681dbe9a91b4e2ab2b5bbae2657e91750464cc03b8908e83e851d23)...: deployed at 0xC177a6b341dA805C2F6f49F6BFD9F90FDc1FE054 with 2442848 gas

deploying "StakingManager_Proxy" (tx: 0x0e4e9112bfe4b3dcab5d36a141144c90cdac1b69aff75710158295cd463bf3dd)...: deployed at 0x9FE560dA540a941BaFF6c7E4e5385FdAaaf426D9 with 709852 gas

Done in 55.88s.
- SLP staking liquidity

Our stake contract use RT tokens to pay reward to the user, using uniSwapV2 we provide liquidity to any ETH/Token pool, and using this lp Token we can use or stake contract, we create a stakeManage that allow use create differente stakes contracts using any ETH/Token pool

  - Scripts
    ## Dependencies

    Install dependencies with `yarn`
  
    ## Compiling

    ```
    yarn compile
    ```

    ## Testing
    To run tests with hardhat use
    
    ```
    yarn test
    ````

    To run tests with hardhat coverage use

    ````
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


    * RewardToken: Deployed at 0xa399f67C61740f565bff49d39103EA0Bc18B1C29

    * StakingManager_Implementation: Deployed at 0xC177a6b341dA805C2F6f49F6BFD9F90FDc1FE054 

    * StakingManager_Proxy: Deployed at 0x9FE560dA540a941BaFF6c7E4e5385FdAaaf426D9

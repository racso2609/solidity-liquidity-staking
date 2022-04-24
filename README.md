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


    * RewardToken: Deployed at 0x858b973dDEe347E22AD13707f5d6f91EfEbdbe88

    * Staking Manager: Deployed at 0x653CdbbEac3998C7060bAd55C7224F35FcBEa4cA
     
    * StakingManager_Implementation: Deployed at 0x5bDD54010F6715A521D1f05457E4473a19D6196f 

    * StakingManager_Proxy: Deployed at 0x653CdbbEac3998C7060bAd55C7224F35FcBEa4cA
    
    * Graph https://thegraph.com/hosted-service/subgraph/racso2609/stake-manager 
  
  - Front 
    * https://github.com/racso2609/liquidity-stake-front
    * https://merry-duckanoo-e51ac8.netlify.app/

- Comments
  * Contact with us to make you admin be able to access all options 
  * we deploy to ropsten because we dont found pool to dai or many others coins un rinkeby
  * run test on ropsten

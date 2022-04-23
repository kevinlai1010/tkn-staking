// hardhat.config.js
require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')
require('hardhat-deploy')
require('dotenv').config()

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.9"
      }
    ]
  },
  defaultNetwork: 'hardhat',
  networks: {
    rinkeby: {
      url: process.env.NETWORK_ENDPOINT_RINKEBY,
      accounts: [process.env.ACCOUNT_0_PRIVATE_KEY]
    }
  },
  namedAccounts: {
    account0: 0,
    account1: 1
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
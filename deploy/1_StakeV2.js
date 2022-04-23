// deploy/0_TKN.js
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments
  const { account0 } = await getNamedAccounts()

  await deploy('StakeV2', {
    from: account0,
    args: ['0x5FbDB2315678afecb367f032d93F642f64180aa3'],
    log: true,
  })
}

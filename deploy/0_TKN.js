// deploy/0_TKN.js
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments
  const { account0 } = await getNamedAccounts()

  await deploy('TKN', {
    from: account0,
    args: [],
    log: true,
  })
}

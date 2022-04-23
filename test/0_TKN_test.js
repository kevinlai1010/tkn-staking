const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('TKN', function () {
  var ERC20TKN, erc20TKN

  before(async () => {
    [test1, test2] = await ethers.getSigners()
  })

  it('Should deploy TKN token and mint 100000 tokens', async function () {
    ERC20TKN = await ethers.getContractFactory('TKN')
    erc20TKN = await ERC20TKN.deploy()
    await erc20TKN.deployed()

    expect(await erc20TKN.totalSupply()).to.equal(100000)
    expect(await erc20TKN.balanceOf(test1.address)).to.equal(100000)
  })

  it('Should transfer 1 TKN token to another wallet', async function () {
    await erc20TKN.transfer(test2.address, 1)
    expect(await erc20TKN.balanceOf(test1.address)).to.equal(99999)
    expect(await erc20TKN.balanceOf(test2.address)).to.equal(1)
  })
})

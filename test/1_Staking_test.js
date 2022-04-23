const { expect } = require('chai')
const { ethers } = require('hardhat')


describe('StakeV2', function () {
  let erc20TKN, stakeV2
  let owner, test1, test2, ownerAdd


  before(async () => {
    [owner, test1, test2] = await ethers.getSigners()
  })


  it('Should deploy TKN token and StakeV2 contracts', async () => {
    const ERC20TKN = await ethers.getContractFactory('TKN')
    erc20TKN = await ERC20TKN.deploy()
    await erc20TKN.deployed()
    console.log('TKN token address: ' + erc20TKN.address)


    const StakeV2 = await ethers.getContractFactory('StakeV2')
    stakeV2 = await StakeV2.deploy(erc20TKN.address)
    await stakeV2.deployed()
    console.log('stakeV2 address: ' + stakeV2.address)


    // send reward token to test account
    await erc20TKN.transfer(test1.address, 1000)
    await erc20TKN.transfer(test2.address, 1500)


    // send reward token to staking contract
    await erc20TKN.transfer(stakeV2.address, 1000)


    expect(await erc20TKN.balanceOf(test1.address)).to.equal(1000)
    expect(await erc20TKN.balanceOf(test2.address)).to.equal(1500)
    expect(await erc20TKN.balanceOf(stakeV2.address)).to.equal(1000)
    expect(await erc20TKN.balanceOf(owner.address)).to.equal(96500)
  })


  it('deposit function', async () => {
    await erc20TKN.connect(test1).approve(stakeV2.address, 1000)


    // zero staking will occur error
    await expect(stakeV2.connect(test1).deposit(0)).to.be.revertedWith(
      'Cannot stake nothing',
    )


    //stake 400 tokens in the pool
    await stakeV2.connect(test1).deposit(400)
    expect(await erc20TKN.balanceOf(test1.address)).to.equal(600)
    //check whether Deposited Event is occured or not
    await expect(stakeV2.connect(test1).deposit(100))
      .to.emit(stakeV2, 'Deposited')
      .withArgs(test1.address, 100)
  })


  it('distribute function', async () => {
    // zero rewardRate will occur error
    await expect(stakeV2.connect(test1).distribute(0)).to.be.revertedWith(
      'Too small amount of reward to take',
    )

    //Distribute 10 tokens for test1 according to its staked amount of tokens
    await stakeV2.connect(test1).distribute(10)
    //The reward should be 10
    expect(await stakeV2.connect(test1).compute_reward()).to.equal(10)
    //Withdraw reward
    await stakeV2.connect(test1).withdraw_reward()
    //Widthdraw reward consequently should occur error because nothing to be rewarded for test1 now
    await expect(stakeV2.connect(test1).withdraw_reward()).to.be.revertedWith(
      'Nothing to take reward',
    )
    //rewardable amount should be 0 after taking reward
    expect(await stakeV2.connect(test1).compute_reward()).to.equal(0)
    //after taking reward, the balance of test1's account should be 500 + 10 = 510
    expect(await erc20TKN.connect(test1).balanceOf(test1.address)).to.equal(510)
  })

  it('unstake partially', async () => {
    // Exceeded amount of staked tokens will occur error
    await expect(
      stakeV2.connect(test1).withdraw_stake(10000),
    ).to.be.revertedWith('Requested amount greater than staked amount')


    //Unstake 200 tokens, not all 500 tokens
    await stakeV2.connect(test1).withdraw_stake(200)
    //The balance of test1 account should be 500(rest) + 10(reward) + 200(unstaked) = 710
    expect(await erc20TKN.connect(test1).balanceOf(test1.address)).to.equal(710)
    //Then the amount of tokens in the staking pool should be 500 - 200 = 300
    expect(await stakeV2.total_stake()).to.equal(300)
    //The amount of unstakedable tokens in staking pool for test1 should be 300
    expect(await stakeV2.connect(test1).compute_unstakable()).to.equal(300)


    //Unstake 150 tokens, among rest 300 tokens in staking pool
    await stakeV2.connect(test1).withdraw_stake(150)
    //The balance of test1 account should be 710(rest) + 150(unstaked) = 860
    expect(await erc20TKN.connect(test1).balanceOf(test1.address)).to.equal(860)
    //Then the amount of tokens in the staking pool should be 300 - 150 = 150
    expect(await stakeV2.total_stake()).to.equal(150)
    //The amount of unstakedable tokens in staking pool for test1 should be 150
    expect(await stakeV2.connect(test1).compute_unstakable()).to.equal(150)
  })


  it('mixed testing for staking, unstaking, distribution for test1 & test2', async () => {
    await erc20TKN.connect(test1).approve(stakeV2.address, 1000)
    await erc20TKN.connect(test2).approve(stakeV2.address, 1500)


    //stake 500 tokens in the pool from test1
    await stakeV2.connect(test1).deposit(500)
    //stake 1000 tokens in the pool from test2
    await stakeV2.connect(test2).deposit(1000)
    //the balanceOf test1 = 860 - 500 = 360
    expect(await erc20TKN.balanceOf(test1.address)).to.equal(360)
    //the balanceOf test1 = 1500 - 1000 = 500
    expect(await erc20TKN.balanceOf(test2.address)).to.equal(500)


    //Total amount of tokens in staking pool should be 150(rest) + 500(test1) + 1000(test2) = 1650
    expect(await stakeV2.total_stake()).to.equal(1650)


    //The reward for test2
    let rewardable_test2 = await stakeV2.connect(test2).compute_reward()
    //The rewardable_test2 should be zero because distribute isn't occured yet.
    expect(rewardable_test2).to.equal(0)


    //Unstake 500 tokens among 1000 tokens
    await stakeV2.connect(test2).withdraw_stake(500)
    //The balance of test2 account should be 500(rest) + 500(unstaked) = 1000
    expect(await erc20TKN.connect(test2).balanceOf(test2.address)).to.equal(
      1000,
    )



    //Then the amount of tokens in the staking pool should be 1650 - 500 = 1150
    expect(await stakeV2.total_stake()).to.equal(1150)


    //The amount of unstakedable tokens in staking pool for test1 should be 650
    expect(await stakeV2.connect(test1).compute_unstakable()).to.equal(650)
    //The amount of unstakedable tokens in staking pool for test2 should be 500
    expect(await stakeV2.connect(test2).compute_unstakable()).to.equal(500)


    //Distribute 50 tokens for test1 according to its staked amount of tokens
    await stakeV2.connect(test1).distribute(50)
    //Distribute 50 tokens for test2 according to its staked amount of tokens
    await stakeV2.connect(test2).distribute(50)


    //The reward for test1
    let rewardable_test1 = await stakeV2.connect(test1).compute_reward()
    console.log('rewardable_test1: ', rewardable_test1)
    //The reward for test2
    rewardable_test2 = await stakeV2.connect(test2).compute_reward()
    console.log('rewardable_test2: ', rewardable_test2)


    //rewardable_test1 & rewardable_test2 should be different
    expect(rewardable_test1).to.not.equal(rewardable_test2)


    //Withdraw reward for teset1
    await stakeV2.connect(test1).withdraw_reward()
    //rewardable amount for test1 should be 0 after taking reward
    expect(await stakeV2.connect(test1).compute_reward()).to.equal(0)
    //after taking reward for test1, the balance of test1's account should be 360 + 56 = 416
    expect(await erc20TKN.connect(test1).balanceOf(test1.address)).to.equal(416)


    //Withdraw reward for teset2
    await stakeV2.connect(test2).withdraw_reward()
    //rewardable amount for test2 should be 0 after taking reward
    expect(await stakeV2.connect(test2).compute_reward()).to.equal(0)
    //after taking reward for test2, the balance of test2's account should be 1000 + 43 = 1043
    expect(await erc20TKN.connect(test2).balanceOf(test2.address)).to.equal(
      1043,
    )
  })
})

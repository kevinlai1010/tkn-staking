// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title StakeV2
 * @dev Main Contract For Updated Scalable Reward Distribution on the Ethereum Blockchain
 */
contract StakeV2 {
    using SafeMath for uint256;

    IERC20 public ERC20Token;
    uint256 public total_stake = 0; //total amount of tokens in the staking pool
    uint256 public reward_per_token = 0; //accumulated amount of reward at the moment t from staking start point
    mapping(address => uint256) public stake; //staking pool
    mapping(address => uint256) public reward_tally; // refer to explanation.docx file

    uint256 private constant precision = 10**18;

    event Withdrawed(address addr, uint256 value);
    event Deposited(address addr, uint256 value);
    event Distributed(uint256 value);

    /**
     * @dev constructor
     * @param _ERC20Token Token Address
     */
    constructor(address _ERC20Token) {
        ERC20Token = IERC20(_ERC20Token);
    }

    /**
     * @dev Staking function for each user
     * @param _amount The amount of Token that will be staked
     */
    function deposit(uint256 _amount) public {
        require(_amount > 0, "Cannot stake nothing");
        stake[msg.sender] = stake[msg.sender].add(_amount);
        reward_tally[msg.sender] = reward_tally[msg.sender].add(
            reward_per_token.mul(_amount).div(precision)
        );
        total_stake = total_stake.add(_amount);
        ERC20Token.transferFrom(msg.sender, address(this), _amount);
        emit Deposited(msg.sender, _amount);
    }

    /**
     * @dev Reward Distributing function according to amount of staked tokens
     * @param _reward reward for distribution
     */
    function distribute(uint256 _reward) public {
        require(
            total_stake != 0,
            "Cannot distribute to staking pool with 0 stake"
        );
        uint256 divident = _reward.mul(precision);
        require(divident > total_stake, "Too small amount of reward to take");

        reward_per_token = reward_per_token.add(
            _reward.mul(precision).div(total_stake)
        );
        emit Distributed(_reward);
    }

    /**
     * @dev Compute the amount of tokens stakeholder can unstake from pool
     */
    function compute_unstakable() public view returns (uint256) {
        uint256 reward = compute_reward();
        uint256 unstakable = stake[msg.sender].add(reward);
        return unstakable;
    }

    /**
     * @dev Compute the total accumulated reward for each stakholder according to staked amount
     */
    function compute_reward() public view returns (uint256) {
        uint256 reward = stake[msg.sender]
            .mul(reward_per_token)
            .div(precision)
            .sub(reward_tally[msg.sender]);
        return reward;
    }

    /**
     * @dev Widthdraw some or total amount of staked tokens from staking pool
     * @param _amount Amount for unstaking
     */
    function withdraw_stake(uint256 _amount) public {
        require(stake[msg.sender] != 0, "Stake not found for given address");
        require(
            stake[msg.sender] >= _amount,
            "Requested amount greater than staked amount"
        );
        stake[msg.sender] = stake[msg.sender].sub(_amount);
        reward_tally[msg.sender] = reward_tally[msg.sender].sub(
            reward_per_token.mul(_amount).div(precision)
        );
        total_stake = total_stake.sub(_amount);
        ERC20Token.transfer(msg.sender, _amount);
        emit Withdrawed(msg.sender, _amount);
    }

    /**
     * @dev Widthdraw the total accumulated reward
     */
    function withdraw_reward() public {
        uint256 reward = compute_reward();
        require(reward > 0, "Nothing to take reward");
        reward_tally[msg.sender] = stake[msg.sender].mul(reward_per_token).div(
            precision
        );
        ERC20Token.transfer(msg.sender, reward);
        emit Withdrawed(msg.sender, reward);
    }
}

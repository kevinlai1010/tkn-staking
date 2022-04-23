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

    uint256 public total_stake = 0; //total amount of tokens in the staking pool
    uint256 public reward_per_token = 0; //accumulated amount of reward at the moment t from staking start point
    mapping(address => uint256) public stake; //staking pool
    mapping(address => uint256) public reward_tally; // refer to explanation.docx file

    /**
     * @dev Staking function for each user
     * @param _address User's Wallet Address
     * @param _amount The amount of Token that will be staked
     */
    function deposit(address _address, uint256 _amount) public {
        stake[_address] = stake[_address].add(_amount);
        reward_tally[_address] = reward_tally[_address].add(
            reward_per_token.mul(_amount)
        );
        total_stake = total_stake.add(_amount);
    }

    /**
     * @dev Reward Distributing function according to amount of staked tokens
     * @param _reward reward rate for distribution
     */
    function distribute(uint256 _reward) public {
        require(
            total_stake != 0,
            "Cannot distribute to staking pool with 0 stake"
        );
        reward_per_token = reward_per_token.add(_reward.div(total_stake));
    }

    /**
     * @dev Compute the total accumulated reward for each stakholder according to staked amount
     * @param _address Stakholder's wallet address
     */
    function compute_reward(address _address) public view returns (uint256) {
        uint256 reward = stake[_address].mul(
            reward_per_token.sub(reward_tally[_address])
        );
        return reward;
    }

    /**
     * @dev Widthdraw some or total amount of staked tokens from staking pool
     * @param _address Stakholder's wallet address
     * @param _amount Amount for unstaking
     */
    function withdraw_stake(address _address, uint256 _amount) public {
        require(stake[_address] != 0, "Stake not found for given address");
        require(
            stake[_address] > _amount,
            "Requested amount greater than staked amount"
        );
        stake[_address] = stake[_address].sub(_amount);
        reward_tally[_address] = reward_tally[_address].sub(
            reward_per_token.mul(_amount)
        );
        total_stake = total_stake.sub(_amount);
    }

    /**
     * @dev Widthdraw the total accumulated reward
     * @param _address Stakholder's wallet address     
     */
    function withdraw_reward(address _address) public returns (uint256) {
        uint256 reward = compute_reward(_address);
        reward_tally[_address] = stake[_address].mul(reward_per_token);
        return reward;
    }
}

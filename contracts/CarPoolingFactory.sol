// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./CarPooling.sol";

contract CarPoolingFactory {
    CarPooling[] deployedCarPools;

    function createCarPool(
        string calldata model,
        uint8 seatsAvailable,
        uint256 seatPrice
    ) public {
        deployedCarPools.push(
            new CarPooling(model, msg.sender, seatsAvailable, seatPrice)
        );
    }

    function getDeployedCarPools() public view returns (CarPooling[] memory) {
        return deployedCarPools;
    }
}

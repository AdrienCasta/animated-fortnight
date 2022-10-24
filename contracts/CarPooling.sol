// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

enum Status {
    Canceled,
    Confirmed
}

contract CarPooling {
    struct CarPooler {
        uint256 amount;
    }

    Status public status;
    address payable public driver;
    string public model;
    uint8 public seatsAvailable;
    uint8 public remainingSeatsAvailable;
    uint256 public seatPrice;
    mapping(address => CarPooler) public carPoolers;
    address[] public carPoolerList;

    error NoRemainingSeatsAvaialble();
    error CarPoolHasBeenCanceled();
    error HasAlreadyJoinCarPool();
    error AmountIsNotAccurate();
    error OnlyCarPoolers();

    constructor(
        string memory _model,
        address _driver,
        uint8 _seatsAvailable,
        uint256 _seatPrice
    ) {
        driver = payable(_driver);
        model = _model;
        seatsAvailable = _seatsAvailable;
        remainingSeatsAvailable = _seatsAvailable;
        seatPrice = _seatPrice;
        status = Status.Confirmed;
    }

    function book() public payable {
        if (msg.sender == driver) {
            revert OnlyCarPoolers();
        }
        if (remainingSeatsAvailable == 0) {
            revert NoRemainingSeatsAvaialble();
        }
        if (status == Status.Canceled) {
            revert CarPoolHasBeenCanceled();
        }
        if (carPoolers[msg.sender].amount > 0) {
            revert HasAlreadyJoinCarPool();
        }
        if (msg.value != seatPrice) {
            revert AmountIsNotAccurate();
        }

        carPoolers[msg.sender].amount = msg.value;
        carPoolerList.push(msg.sender);
        remainingSeatsAvailable--;
    }

    function refund(address carPoolerAddress, CarPooler storage carPooler)
        private
    {
        uint256 amount = carPooler.amount;
        carPooler.amount = 0;
        status = Status.Canceled;
        payable(carPoolerAddress).transfer(amount);
    }

    function cancel() public {
        if (status == Status.Canceled) {
            revert CarPoolHasBeenCanceled();
        }

        if (msg.sender == driver) {
            status = Status.Canceled;
            for (uint256 i = 0; i < carPoolerList.length; i++) {
                address carPoolerAddress = carPoolerList[i];
                CarPooler storage carPooler = carPoolers[carPoolerAddress];
                if (carPooler.amount > 0) {
                    status = Status.Canceled;
                    refund(carPoolerAddress, carPooler);
                }
            }
        } else {
            refund(msg.sender, carPoolers[msg.sender]);
        }
    }
}

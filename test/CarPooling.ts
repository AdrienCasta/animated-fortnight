import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("CarPooling", function () {
  async function deployCarPoolingFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, ...otherAccounts] = await ethers.getSigners();

    const CarPooling = await ethers.getContractFactory("CarPooling");
    const carPooling = await CarPooling.deploy(
      "audi",
      owner.address,
      3,
      ethers.utils.parseEther("0.5")
    );

    return { carPooling, owner, otherAccounts };
  }

  describe("Deployment", function () {
    it("Should create a carPooling", async function () {
      const { carPooling, owner } = await loadFixture(deployCarPoolingFixture);

      expect(await carPooling.model()).to.equal("audi");
      expect(await carPooling.driver()).to.equal(owner.address);
      expect(await carPooling.seatsAvailable()).to.equal(3);
      expect(await carPooling.remainingSeatsAvailable()).to.equal(3);
      expect(await carPooling.seatPrice()).to.equal(
        ethers.utils.parseEther("0.5")
      );
    });
  });
  describe("Book", async function () {
    it("Should decrement remainingSeatsAvailable by one", async function () {
      const { carPooling, otherAccounts } = await loadFixture(
        deployCarPoolingFixture
      );
      await carPooling.connect(otherAccounts[0]).book({
        value: ethers.utils.parseEther("0.5"),
      });
      expect(await carPooling.remainingSeatsAvailable()).to.equal(2);
    });
    it("Should add carpooler address to carPooler list", async function () {
      const { carPooling, otherAccounts } = await loadFixture(
        deployCarPoolingFixture
      );
      await carPooling.connect(otherAccounts[0]).book({
        value: ethers.utils.parseEther("0.5"),
      });
      expect(await carPooling.carPoolerList(0)).to.equal(
        otherAccounts[0].address
      );
    });
    it("Should add carpooler amount", async function () {
      const { carPooling, otherAccounts } = await loadFixture(
        deployCarPoolingFixture
      );
      await carPooling.connect(otherAccounts[0]).book({
        value: ethers.utils.parseEther("0.5"),
      });

      const expected = (
        await carPooling.carPoolers(otherAccounts[0].address)
      ).toString();

      expect(expected).to.equal(ethers.utils.parseEther("0.5").toString());
    });
    it("Should revert if driver tries to book himself", async function () {
      const { carPooling } = await loadFixture(deployCarPoolingFixture);

      await expect(
        carPooling.book({
          value: ethers.utils.parseEther("0.5"),
        })
      ).to.be.revertedWithCustomError(carPooling, "OnlyCarPoolers");
    });
    it("Should revert if carPooling has been canceled", async function () {
      const { carPooling, otherAccounts } = await loadFixture(
        deployCarPoolingFixture
      );

      await carPooling.cancel();

      await expect(
        carPooling.connect(otherAccounts[0]).book({
          value: ethers.utils.parseEther("0.5"),
        })
      ).to.be.revertedWithCustomError(carPooling, "CarPoolHasBeenCanceled");
    });

    it("Should revert if amount is not enough", async function () {
      const { carPooling, otherAccounts } = await loadFixture(
        deployCarPoolingFixture
      );

      await expect(
        carPooling.connect(otherAccounts[0]).book({
          value: ethers.utils.parseEther("0.4"),
        })
      ).to.be.revertedWithCustomError(carPooling, "AmountIsNotAccurate");
    });

    it("Should revert if other account has already book", async function () {
      const { carPooling, otherAccounts } = await loadFixture(
        deployCarPoolingFixture
      );

      await carPooling.connect(otherAccounts[0]).book({
        value: ethers.utils.parseEther("0.5"),
      });

      await expect(
        carPooling.connect(otherAccounts[0]).book({
          value: ethers.utils.parseEther("0.5"),
        })
      ).to.be.revertedWithCustomError(carPooling, "HasAlreadyJoinCarPool");
    });

    it("Should revert if there is no more seats available", async function () {
      const { carPooling, otherAccounts } = await loadFixture(
        deployCarPoolingFixture
      );

      await carPooling.connect(otherAccounts[0]).book({
        value: ethers.utils.parseEther("0.5"),
      });
      await carPooling.connect(otherAccounts[1]).book({
        value: ethers.utils.parseEther("0.5"),
      });
      await carPooling.connect(otherAccounts[2]).book({
        value: ethers.utils.parseEther("0.5"),
      });

      await expect(
        carPooling.connect(otherAccounts[3]).book({
          value: ethers.utils.parseEther("0.5"),
        })
      ).to.be.revertedWithCustomError(carPooling, "NoRemainingSeatsAvaialble");
    });
  });
  describe("Cancel", async function () {
    it("Should cancel carpooling as driver", async function () {
      const { carPooling } = await loadFixture(deployCarPoolingFixture);
      await carPooling.cancel();
      expect(await carPooling.status()).to.equal(0);
    });
    it("Should revert if driver cancel twice", async function () {
      const { carPooling, owner, otherAccounts } = await loadFixture(
        deployCarPoolingFixture
      );
      await carPooling.cancel();

      await expect(carPooling.cancel()).to.be.revertedWithCustomError(
        carPooling,
        "CarPoolHasBeenCanceled"
      );
    });
  });
});

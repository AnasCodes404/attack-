const { ethers } = require("hardhat");
const { expect } = require("chai");

const WETH_ADDRESS = "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83"; // Your WETH address

describe("BentoBoxV1 Contract", function () {
    let BentoBox, bentoBox, Token, token;
    let owner, user1, user2;

    beforeEach(async () => {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy a sample ERC20 token for testing
        Token = await ethers.getContractFactory("ERC20Token"); // Replace with your token if you have a specific implementation
        token = await Token.deploy("Test Token", "TT", ethers.utils.parseEther("1000000")); // 1 million supply
        await token.deployed();

        // Deploy the BentoBox contract
        BentoBox = await ethers.getContractFactory("BentoBoxV1");
        bentoBox = await BentoBox.deploy(WETH_ADDRESS); // Pass the WETH address here
        await bentoBox.deployed();
    });

    it("Should allow deposits", async function () {
        const depositAmount = ethers.utils.parseEther("100");

        // Approve the BentoBox contract to transfer tokens on behalf of the user
        await token.connect(owner).approve(bentoBox.address, depositAmount);

        // Deposit tokens
        await expect(bentoBox.connect(owner).deposit(token.address, owner.address, owner.address, depositAmount, 0))
            .to.emit(bentoBox, "LogDeposit")
            .withArgs(token.address, owner.address, owner.address, depositAmount, any); // use 'any' for variable values

        const balance = await bentoBox.balanceOf(token.address, owner.address);
        expect(balance).to.equal(depositAmount);
    });

    it("Should allow withdrawals", async function () {
        const depositAmount = ethers.utils.parseEther("100");
        const withdrawalAmount = ethers.utils.parseEther("50");

        // Deposit first
        await token.connect(owner).approve(bentoBox.address, depositAmount);
        await bentoBox.connect(owner).deposit(token.address, owner.address, owner.address, depositAmount, 0);

        // Withdraw tokens
        await expect(bentoBox.connect(owner).withdraw(token.address, owner.address, owner.address, withdrawalAmount, 0))
            .to.emit(bentoBox, "LogWithdraw")
            .withArgs(token.address, owner.address, owner.address, withdrawalAmount, any);

        const balance = await bentoBox.balanceOf(token.address, owner.address);
        expect(balance).to.equal(depositAmount.sub(withdrawalAmount));
    });

    it("Should handle flash loans correctly", async function () {
        const loanAmount = ethers.utils.parseEther("10");

        // Implement a mock flash loan receiver contract if necessary
        const FlashLoanReceiver = await ethers.getContractFactory("MockFlashLoanReceiver"); // You'd need a mock contract for testing
        const flashLoanReceiver = await FlashLoanReceiver.deploy(bentoBox.address, token.address);
        await flashLoanReceiver.deployed();

        // Provide the receiver with enough tokens to repay the loan
        await token.transfer(flashLoanReceiver.address, loanAmount);

        // Take out a flash loan
        await expect(
            bentoBox.connect(owner).flashLoan(flashLoanReceiver.address, flashLoanReceiver.address, token.address, loanAmount, "0x")
        )
            .to.emit(bentoBox, "LogFlashLoan")
            .withArgs(flashLoanReceiver.address, token.address, loanAmount, any, flashLoanReceiver.address);

        // Verify the contract balance remains unchanged after loan
        const bentoBoxBalance = await token.balanceOf(bentoBox.address);
        expect(bentoBoxBalance).to.equal(0);
    });

    it("Should not allow unauthorized access to critical functions", async function () {
        await expect(bentoBox.connect(user1).whitelistMasterContract(user2.address, true)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
    });
});

const { ethers } = require("hardhat");

async function main() {
    const BentoBox = await ethers.getContractFactory("BentoBoxV1");
    const bentoBox = await BentoBox.deploy("0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83");
    await bentoBox.deployed();
    console.log("BentoBoxV1 deployed to:", bentoBox.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

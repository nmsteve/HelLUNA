// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  
  const Launchpad = await hre.ethers.getContractFactory("MockBUSDD");
  const launchpad = await Launchpad.deploy();

  await launchpad.deployed();

  //const Marketplace = await hre.ethers.getContractFactory("EmpireMarketplace");
  //const marketplace = await Marketplace.deploy("0x3c84879e6c80178B16C1a570b4EC5Afc1dc9D092");
//
  //await marketplace.deployed();

  console.log("launchpad deployed to:", launchpad.address);
  //console.log("marketplace deployed to:", marketplace.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

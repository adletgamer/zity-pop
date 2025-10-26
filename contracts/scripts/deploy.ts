import { ethers } from "hardhat";

async function main() {
  const baseURI = "https://namiki-api.com/api/tokens/"; // Usaremos Pinata después
  
  const NamikiNFT = await ethers.getContractFactory("NamikiNFT");
  const namikiNFT = await NamikiNFT.deploy(baseURI);

  await namikiNFT.waitForDeployment();

  console.log("NamikiNFT deployed to:", await namikiNFT.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
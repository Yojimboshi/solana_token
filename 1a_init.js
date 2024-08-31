const anchor = require("@project-serum/anchor");
const { Connection, PublicKey, Keypair } = require("@solana/web3.js");
const fs = require("fs");

// Load your local wallet
const wallet = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync("wallet-keypair.json", "utf8")))
);

// Set up the provider and program
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
anchor.setProvider(provider);

const idl = JSON.parse(fs.readFileSync("target/idl/yojimbo_token.json", "utf8"));
const programId = new PublicKey("GovehySW7tKTH2G3GaBFHXsz8cmgodwmrkWSFKSuzHup");
const program = new anchor.Program(idl, programId, provider);

// Load your mint and metadata keypairs
const mintKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync("mint-keypair.json", "utf8")))
);
const metadataKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync("metadata-keypair.json", "utf8")))
);

// Load metadata from file
const metadata = JSON.parse(fs.readFileSync("metadata.json", "utf8"));

// Define the parameters for your mint initialization
const hardCap = new anchor.BN(1000000);  // Example hard cap

(async () => {
  try {
    // Initialize the mint and metadata
    await program.rpc.initializeMint(
      metadata.name,
      metadata.symbol,
      metadata.image,
      hardCap,
      {
        accounts: {
          mint: mintKeypair.publicKey,
          metadata: metadataKeypair.publicKey,
          authority: wallet.publicKey,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [mintKeypair, metadataKeypair],
        instructions: [
          await program.account.mint.createInstruction(mintKeypair),
          await program.account.metadata.createInstruction(metadataKeypair),
        ],
      }
    );
    console.log("Mint and metadata initialized successfully");
  } catch (error) {
    console.error("Failed to initialize mint and metadata:", error);
  }
})();

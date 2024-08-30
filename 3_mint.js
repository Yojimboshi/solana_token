const anchor = require('@project-serum/anchor');
const { PublicKey } = require('@solana/web3.js');
const fs = require('fs');

const wallet = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync('wallet-keypair.json', 'utf8')))
);

const connection = new anchor.web3.Connection('https://api.devnet.solana.com', 'confirmed');
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), {});
anchor.setProvider(provider);

const idl = JSON.parse(fs.readFileSync('target/idl/yojimbo_token.json', 'utf8'));
const programId = new PublicKey('DyDZc7yUV4y8Qbtr1xKeQujBbAi1DTx5J5t5B5vVn441');
const program = new anchor.Program(idl, programId, provider);

const mintPublicKey = new PublicKey('Dr1VgwbkwhhKoFVN7gHpgzCHwRHRgMWHJfKZXbu3JxPB');
const recipientTokenAccountPublicKey = new PublicKey('<RECIPIENT_TOKEN_ACCOUNT>');
const amountToMint = new anchor.BN(1000);

(async () => {
  try {
    const tx = await program.methods.mintTo(amountToMint)
      .accounts({
        mint: mintPublicKey,
        to: recipientTokenAccountPublicKey,
        authority: wallet.publicKey,
      })
      .signers([wallet])
      .rpc();

    console.log("Mint transaction signature:", tx);
  } catch (error) {
    console.error("Failed to mint tokens:", error);
  }
})();

const anchor = require('@project-serum/anchor');
const { PublicKey, Keypair } = require('@solana/web3.js');
const fs = require('fs');

const uri = "https://gist.githubusercontent.com/Yojimboshi/ac4b533e93ea325a405abf53782986fe/raw/e499871ecb3f61e79e214969b42bedf8bb32cdb3/yojimbo.json";

(async () => {
    try {
        const walletKeypair = Keypair.fromSecretKey(
            Uint8Array.from(JSON.parse(fs.readFileSync('./wallet_keypair.json', 'utf8')))
        );

        const provider = new anchor.AnchorProvider(
            new anchor.web3.Connection(anchor.web3.clusterApiUrl('devnet')),
            new anchor.Wallet(walletKeypair),
            { preflightCommitment: 'processed' }
        );
        anchor.setProvider(provider);

        const programId = new PublicKey("6Ncnr6PZ56bZttPL9bW6FHRgwAK3ZxTCAvp8BbxvryHE");
        console.log("Program ID:", programId.toBase58());

        console.log("Loading IDL from file...");
        const idl = JSON.parse(fs.readFileSync('./target/idl/yojimbo_token.json', 'utf8'));
        console.log("IDL loaded.");

        const program = new anchor.Program(idl, programId, provider);
        console.log("Program initialized.");

        const mintKeypair = Keypair.fromSecretKey(
            Uint8Array.from(JSON.parse(fs.readFileSync('./mint-keypair.json', 'utf8')))
        );
        console.log("Mint keypair public key:", mintKeypair.publicKey.toBase58());

        const metadataKeypair = Keypair.fromSecretKey(
            Uint8Array.from(JSON.parse(fs.readFileSync('./metadata-keypair.json', 'utf8')))
        );
        console.log("Metadata keypair public key:", metadataKeypair.publicKey.toBase58());

        const tx = await program.methods
            .initializeMint(
                "YOJIMBO",
                "JIMBO",
                uri,
                new anchor.BN(1000000),
                8,
                walletKeypair.publicKey
            )
            .accounts({
                mint: mintKeypair.publicKey,
                metadata: metadataKeypair.publicKey,
                authority: walletKeypair.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
            })
            .signers([walletKeypair, mintKeypair, metadataKeypair])
            .rpc();

        console.log("Transaction Signature:", tx);

    } catch (error) {
        console.error("An error occurred:");
        if (error.logs) {
            console.error("Transaction logs:", error.logs.join("\n"));
        } else {
            console.error(error.message);
        }
    }
})();

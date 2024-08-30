const anchor = require('@project-serum/anchor');
const { PublicKey, Keypair } = require('@solana/web3.js');
const fs = require('fs');

(async () => {
    try {
        // Load the keypair directly from the wallet-keypair.json file in the project directory
        console.log("Loading wallet keypair...");
        const walletKeypair = Keypair.fromSecretKey(
            Uint8Array.from(JSON.parse(fs.readFileSync('./wallet-keypair.json', 'utf8')))
        );
        console.log("Wallet public key:", walletKeypair.publicKey.toBase58());

        // Configure the client to use the loaded keypair as the wallet
        const provider = new anchor.AnchorProvider(
            new anchor.web3.Connection(anchor.web3.clusterApiUrl('devnet')),
            new anchor.Wallet(walletKeypair),
            { preflightCommitment: 'processed' }
        );
        anchor.setProvider(provider);
        console.log("Provider configured.");

        const programId = new PublicKey("DyDZc7yUV4y8Qbtr1xKeQujBbAi1DTx5J5t5B5vVn441");

        console.log("Loading IDL from file...");
        const idl = JSON.parse(fs.readFileSync('./target/idl/yojimbo_token.json', 'utf8'));
        console.log("IDL loaded.");

        const program = new anchor.Program(idl, programId, provider);
        console.log("Program initialized.");

        const mintKeypair = Keypair.fromSecretKey(
            Uint8Array.from(JSON.parse(fs.readFileSync('./mint-keypair.json', 'utf8')))
        );
        console.log("Mint keypair loaded. Public key:", mintKeypair.publicKey.toBase58());

        const metadataKeypair = Keypair.fromSecretKey(
            Uint8Array.from(JSON.parse(fs.readFileSync('./metadata-keypair.json', 'utf8')))
        );
        console.log("Metadata keypair loaded. Public key:", metadataKeypair.publicKey.toBase58());

        console.log("Calling initializeMint...");
        const tx = await program.methods
            .initializeMint(
                "YOJIMBO",
                "JIMBO",
                "https://img1.yeggi.com/page_images_cache/8155453_3d-file-yojimbo-movie-medallion-yojimbo-3d-model-stl-obj-to-download-",
                new anchor.BN(1000000)
            )
            .accounts({
                mint: mintKeypair.publicKey,
                metadata: metadataKeypair.publicKey,
                authority: walletKeypair.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .signers([walletKeypair, mintKeypair, metadataKeypair])
            .rpc();

        console.log("Transaction Signature:", tx);

    } catch (error) {
        console.error("An error occurred:", error);
    }
})();

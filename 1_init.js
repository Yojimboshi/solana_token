const anchor = require('@project-serum/anchor');
const { PublicKey, Keypair } = require('@solana/web3.js');
const fs = require('fs');

const uri = "https://gist.githubusercontent.com/Yojimboshi/ac4b533e93ea325a405abf53782986fe/raw/e499871ecb3f61e79e214969b42bedf8bb32cdb3/yojimbo.json";

(async () => {
    try {
        // Load the keypair directly from the wallet-keypair.json file in the project directory
        console.log("Loading wallet keypair...");
        const walletKeypair = Keypair.fromSecretKey(
            Uint8Array.from(JSON.parse(fs.readFileSync('./wallet_keypair.json', 'utf8')))
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

        const programId = new PublicKey("GovehySW7tKTH2G3GaBFHXsz8cmgodwmrkWSFKSuzHup");

        console.log("Loading IDL from file...");
        const idl = JSON.parse(fs.readFileSync('./target/idl/yojimbo_token.json', 'utf8'));
        console.log("IDL loaded.");

        const program = new anchor.Program(idl, programId, provider);
        console.log("Program initialized.");

        // Use walletKeypair for mint, metadata, and authority
        const mintKeypair = Keypair.fromSecretKey(
            Uint8Array.from(JSON.parse(fs.readFileSync('./mint-keypair.json', 'utf8')))
        );

        const metadataKeypair = mintKeypair;


        console.log("Calling initializeMint...");
        const tx = await program.methods
            .initializeMint(
                "YOJIMBO",
                "JIMBO",
                uri,  // Metadata URI passed correctly as a string
                new anchor.BN(1000000), // Hard cap of 1 million units
                8, // Decimals
                walletKeypair.publicKey // Freeze authority
            )
            .accounts({
                mint: mintKeypair.publicKey,
                metadata: metadataKeypair.publicKey,
                authority: walletKeypair.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s") // Metaplex Token Metadata program ID
            })
            .signers([walletKeypair,mintKeypair])
            .rpc();

        console.log("Transaction Signature:", tx);

    } catch (error) {
        console.error("An error occurred:", error);
    }
})();
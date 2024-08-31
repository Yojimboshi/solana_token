const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Load the private key array from a JSON file
const PrivKey = [44,150,200,77,60,107,186,229,223,171,230,156,88,88,44,9,226,76,188,89,64,105,89,70,84,251,76,112,177,14,40,247,5,238,168,44,167,52,120,140,82,121,246,86,216,255,185,195,84,204,166,255,219,182,115,229,105,89,13,3,222,16,105,131]
const keypair = Keypair.fromSecretKey(Uint8Array.from(PrivKey));

// Get the public key from the Keypair object
const publicKey = keypair.publicKey.toBase58();

console.log("Public Key:", publicKey);

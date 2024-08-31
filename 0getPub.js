const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Load the private key array from a JSON file
const PrivKey = 
[137,119,159,136,3,210,219,130,101,111,11,178,209,207,188,224,39,195,125,82,169,198,14,3,75,248,100,51,32,225,171,163,92,176,157,250,33,242,141,124,143,131,4,43,95,5,124,4,100,26,78,245,177,156,54,33,64,178,60,235,151,105,216,120]
const keypair = Keypair.fromSecretKey(Uint8Array.from(PrivKey));

// Get the public key from the Keypair object
const publicKey = keypair.publicKey.toBase58();

console.log("Public Key:", publicKey);

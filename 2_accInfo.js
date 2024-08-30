const { Connection, PublicKey } = require('@solana/web3.js');
const connection = new Connection('https://api.devnet.solana.com');

async function fetchAccountData(pubkey) {
    const accountInfo = await connection.getAccountInfo(new PublicKey(pubkey));
    console.log(accountInfo.data.toString('utf8'));  // This prints out raw metadata; you may need to parse it.
}

fetchAccountData('DRaLmFkkZbK2XwwDtxpGx6nRqaJwqKpyuo5MhY3oCeJb');

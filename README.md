# xhashtag-bulk-transfer-script

### Installation

`yarn`

### Generating Pool Keypair

`solana-keygen new --outfile json/pool.json --force`

##### Note1: Please make sure for admin wallet keypair path in `pool/index.ts` and `test/bulk-transfer.ts` line 11.
##### Note2: Admin wallet has to contain some sol and test token amounts.

### Creating Funder

`yarn create-funder`

### Testing


#### NOTE

Replace token addresses in `test/bulk-transfer.ts` line 382.
Replace wallet addresses in `test/bulk-transfer.ts` line 388.

`yarn test`


## Usage

### -- Getting Admin Address
```
    let poolObject = await program.account.vault.fetch(poolPubkey);
    console.log(poolObject.owner);
```

### -- Getting Deposited Balance
```
const [
        _vaultPubkey,
        _vaultNonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolObject.owner.toBuffer(), poolPubkey.toBuffer()],
        program.programId
    );
let vaultObject = await program.account.vault.fetch(_vaultPubkey);
console.log(await provider.connection.getTokenAccountBalance(vaultObject.tokenVaults[0])).value.uiAmount)
```

### -- Getting stored rewards
```
    const [
        _rewardsPubkey,
        _rewardsNonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolPubkey, Buffer.from('rewards')],
        program.programId
    );
    
    const rewardsPubkey = _rewardsPubkey;
    
    let rewardsObject = await program.account.rewards.fetch(rewardsPubkey);
    console.log(rewardsObject.rewards)
    console.log(rewardsObject.addresses)
 ```

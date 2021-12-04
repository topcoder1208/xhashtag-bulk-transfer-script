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

Thank you. :)

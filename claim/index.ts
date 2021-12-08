const assert = require("assert");
import * as anchor from '@project-serum/anchor';
import { Program, web3, Wallet, Provider } from '@project-serum/anchor';
const { TOKEN_PROGRAM_ID, Token, AccountLayout } = require("@solana/spl-token");
import { BulkTransfer } from './types/bulk_transfer';

const fs = require('fs');
const os = require('os');
const path = require('path');

const keypair = path.resolve(__dirname, '../json/add1.json');

//cluster can be became 'devnet' | 'testnet' | 'mainnet-beta'
const env = 'devnet';
const rpcUrl = web3.clusterApiUrl(env);
// const rpcUrl = 'http://127.0.0.1:8899'
const connection = new web3.Connection(rpcUrl);

const rawdata = fs.readFileSync(keypair);
const keyData = JSON.parse(rawdata);
const walletKeyPair = web3.Keypair.fromSecretKey(new Uint8Array(keyData));
console.log(walletKeyPair.publicKey.toBase58())

import idl from '../idl/bulk_transfer.json';
const programID = new web3.PublicKey(idl.metadata.address);

const wallet = new Wallet(walletKeyPair);
const provider = new anchor.Provider(connection, wallet, anchor.Provider.defaultOptions()) 
const program = new Program(idl, programID, provider);
//////////////////////////////////
const poolRawData = fs.readFileSync(path.resolve(__dirname, '../json/pool.json'));
let poolKeypair = web3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(poolRawData)));
let vaultPubkey;
let poolPubkey = poolKeypair.publicKey;
let rewardsPubkey;
let adminPubkey = new web3.PublicKey('QHHrEZ5PjSVfkurnQ1mfkbokfY1cXberVPBKFPrZHMN');
//////////////////////////////////
const setCanClaim = async (address, flag) => {
  if(typeof address == 'string') {
    address = new web3.PublicKey(address);
  }

    const [
        _poolSigner,
        _nonce,
    ] = await web3.PublicKey.findProgramAddress(
        [poolPubkey.toBuffer()],
        program.programId
    );

    const [
        _rewardsPubkey,
        _rewardsNonce,
    ] = await web3.PublicKey.findProgramAddress(
        [poolPubkey.toBuffer(), Buffer.from('rewards')],
        program.programId
    );

    const tx = await program.rpc.setUserCanClaim(
      address,
      flag, {
      accounts: {
        authority: provider.wallet.publicKey,
        rewards: _rewardsPubkey,
      }
    });

  }

const claim = async (address, token, amount) => {
    if(typeof address == 'string') {
      address = new web3.PublicKey(address);
    }

    if(typeof token == 'string') {
      token = new web3.PublicKey(token);
    }

    const ownTokens = await connection.getTokenAccountsByOwner(address, {mint: token});
    if(ownTokens.length == 0 || ownTokens.value.length == 0) {
      console.log("User has not any rewards for this token");
      return;
    }

    const tokenAccount = ownTokens.value[0].pubkey;
    const balanceInfo = (await connection.getTokenAccountBalance(tokenAccount)).value;
    const decimals = balanceInfo.decimals;

    const vaultObject = await program.account.vault.fetch(vaultPubkey);
    const rewardsObject = await program.account.rewards.fetch(rewardsPubkey);
    
    let tokenPoolVault, canClaim;
    for(var i = 0;i < vaultObject.tokenMints.length; i ++) {
      const mint = vaultObject.tokenMints[i];
      if(mint.toBase58() == token.toBase58()) {
        tokenPoolVault = vaultObject.tokenVaults[i];
      }
    }

    if(!tokenPoolVault) {
      console.log("Admin did not deposit this token to pool");
      return;
    }

    for(var i = 0;i < rewardsObject.addresses.length;i ++) {
      const _address = rewardsObject.addresses[i];
      if(_address.toBase58() == address.toBase58()) {
        canClaim = rewardsObject.canClaim[i];
      }
    }
    if(!canClaim) {
      console.log("This user can't claim. Not allowed");
      return;
    }

    const [
        _poolSigner,
        _nonce,
    ] = await web3.PublicKey.findProgramAddress(
        [poolPubkey.toBuffer()],
        program.programId
    );

    const [
        _rewardsPubkey,
        _rewardsNonce,
    ] = await web3.PublicKey.findProgramAddress(
        [poolPubkey.toBuffer(), Buffer.from('rewards')],
        program.programId
    );
console.log(address)
    const tx = await program.rpc.claim(
      _nonce,
      address, 
      new anchor.BN(amount * (10 ** decimals)), {
      accounts: {
        pool: poolPubkey,
        poolSigner: _poolSigner,
        rewards: _rewardsPubkey,
        fromAccount: tokenPoolVault,
        toAccount: tokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      }
    });
  }

describe('bulk-transfer claim', async () => {

  // it('set', async () => {

  //   await setCanClaim(address1, true)
  //   await setCanClaim(address2, true)

  // })

  it('start', async () => {

    const token1 = 'HSxwKQwxqafTSCvFRyEmi8S61PXLHBf3d7xWjkZ3hScP';
    const token2 = '6FzDRNrhR33hmBHf5kwtUr9MxvPFc9dqwEqyzX2CEad1';

    const address1 = '9RnnWGWdjJbu7yCo8hstY71qnwu6TVoCKBGLkJnP3yc2';
    const address2 = 'DGfd7WtGFNSfc7ay1Ydo8mXdgEFecEhvuHovtK1HyYmv';

    const [
        _vaultPubkey,
        _vaultNonce,
    ] = await web3.PublicKey.findProgramAddress(
        [adminPubkey.toBuffer(), poolPubkey.toBuffer()],
        program.programId
    );

    const [
        _rewardsPubkey,
        _rewardsNonce,
    ] = await web3.PublicKey.findProgramAddress(
        [poolPubkey.toBuffer(), Buffer.from('rewards')],
        program.programId
    );

    vaultPubkey = _vaultPubkey;
    rewardsPubkey = _rewardsPubkey;

    await claim(address1, token1, 20)
    await claim(address2, token1, 20)
  })

});
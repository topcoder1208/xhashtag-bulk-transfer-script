const assert = require("assert");
import * as anchor from '@project-serum/anchor';
import { Program, web3, Wallet, Provider } from '@project-serum/anchor';
const { TOKEN_PROGRAM_ID, Token, AccountLayout } = require("@solana/spl-token");
import { BulkTransfer } from './types/bulk_transfer';

const fs = require('fs');
const os = require('os');
const path = require('path');

const keypair = path.resolve(__dirname, '../json/id.json');

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
//////////////////////////////////

const initialize = async () => {
    const [
        _poolSigner,
        _nonce,
    ] = await web3.PublicKey.findProgramAddress(
        [poolPubkey.toBuffer()],
        program.programId
    );
    
    const tx = await program.rpc.initialize(
      _nonce, {
      accounts: {
        authority: provider.wallet.publicKey,
        pool: poolPubkey,
        poolSigner: _poolSigner,
        owner: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      },
      signers: [poolKeypair, ],
      instructions: [
          await program.account.pool.createInstruction(poolKeypair, ),
      ],
    });
    console.log("Your transaction signature", tx);
}

const createFunder = async () => {
    const [
        _poolSigner,
        _nonce,
    ] = await web3.PublicKey.findProgramAddress(
        [poolPubkey.toBuffer()],
        program.programId
    );
    const [
        _vaultPubkey,
        _vaultNonce,
    ] = await web3.PublicKey.findProgramAddress(
        [provider.wallet.publicKey.toBuffer(), poolPubkey.toBuffer()],
        program.programId
    );

    const [
        _rewardsPubkey,
        _rewardsNonce,
    ] = await web3.PublicKey.findProgramAddress(
        [poolPubkey.toBuffer(), Buffer.from('rewards')],
        program.programId
    );

    rewardsPubkey = _rewardsPubkey;
    vaultPubkey = _vaultPubkey;
    
    const tx = await program.rpc.createFunder(
      _vaultNonce,
      _rewardsNonce, {
      accounts: {
        authority: provider.wallet.publicKey,
        pool: poolPubkey,
        vault: vaultPubkey,
        rewards: rewardsPubkey,
        poolSigner: _poolSigner,
        owner: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    });
}

async function getProvider() {
    const opts = {
      preflightCommitment: "processed"
    }
    const provider = new Provider(
        connection, walletKeyPair, opts.preflightCommitment,
    );
    return provider;
}

describe('bulk-transfer', async () => {
  it('start', async () => {
    try {
      await initialize();
    } catch (e) {

    }

    try {
      await createFunder();
    } catch (e) {

    }
  })

});

const assert = require("assert");
import * as anchor from '@project-serum/anchor';
import { Program, web3, Wallet, Provider } from '@project-serum/anchor';
const { TOKEN_PROGRAM_ID, Token, AccountLayout } = require("@solana/spl-token");
import { BulkTransfer } from './types/bulk_transfer';

const fs = require('fs');
const os = require('os');
const path = require('path');

const keypair = os.homedir() + '/.config/solana/id.json';

//cluster can be became 'devnet' | 'testnet' | 'mainnet-beta'
// const env = 'devnet';
// const rpcUrl = web3.clusterApiUrl(env);
const rpcUrl = 'http://127.0.0.1:8899'
const connection = new web3.Connection(rpcUrl);

const rawdata = fs.readFileSync(keypair);
const keyData = JSON.parse(rawdata);
const walletKeyPair = web3.Keypair.fromSecretKey(new Uint8Array(keyData));

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

    const tx = await program.rpc.initialize(
      _nonce, 
      _vaultNonce,
      _rewardsNonce, {
      accounts: {
        authority: provider.wallet.publicKey,
        pool: poolPubkey,
        poolSigner: _poolSigner,
        vault: _vaultPubkey,
        rewards: _rewardsPubkey,
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

const deposit = async (tokenPubkey, amounts, adminWallet) => {
  if(typeof tokenPubkey == 'string') {
    tokenPubkey = new web3.PublicKey(tokenPubkey);
  }

  if(typeof adminWallet == 'string') {
    adminWallet = new web3.PublicKey(adminWallet);
  }

  const tokenObject = new Token(connection, tokenPubkey, TOKEN_PROGRAM_ID, provider.wallet.payer);
  const [
        _poolSigner,
        _nonce,
    ] = await web3.PublicKey.findProgramAddress(
        [poolPubkey.toBuffer()],
        program.programId
    );

  const vaultObject = await program.account.vault.fetch(vaultPubkey);
  let tokenPoolVault;
  vaultObject.tokenMints.find((mint, index) => {
    if(mint.toBase58() == tokenPubkey.toBase58()) {
      tokenPoolVault = vaultObject.tokenVaults[index];
      return true;
    }
  })

  if(!tokenPoolVault) {
    tokenPoolVault = await tokenObject.createAccount(_poolSigner);
  }

  const ownTokens = await connection.getTokenAccountsByOwner(adminWallet, {mint: tokenPubkey});
  if(ownTokens.length == 0 || ownTokens.value.length == 0)
  {
    console.log("Admin has not deposit token");
    return;
  }

  const tokenAccount = ownTokens.value[0];
  const balanceInfo = (await connection.getTokenAccountBalance(tokenAccount.pubkey)).value;
  const balance = balanceInfo.uiAmount;
  if(balance < amounts) {
    console.log("Token amounts is not enough");
    return;
  }

  const decimals = balanceInfo.decimals;
  const tx = await program.rpc.deposit(
    _nonce, 
    new anchor.BN(amounts * (10 ** decimals)), {
    accounts: {
      tokenVault: tokenPoolVault,
      tokenDepositor: tokenAccount.pubkey,
      tokenDepositAuthority: adminWallet,
      authority: provider.wallet.publicKey,
      pool: poolPubkey,
      poolSigner: _poolSigner,
      vault: vaultPubkey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    }
  });
  console.log(tx)
}

const storeSingleRewards = async (address, token, amount) => {
    if(typeof address == 'string') {
      address = new web3.PublicKey(address);
    }

    if(typeof token == 'string') {
      token = new web3.PublicKey(token);
    }

    const tokenObject = new Token(connection, token, TOKEN_PROGRAM_ID, provider.wallet.payer);

    let userAccount = await Token.getAssociatedTokenAddress(
      tokenObject.associatedProgramId,
      tokenObject.programId,
      token,
      address
    );
    const userAccountInfo = await connection.getAccountInfo(userAccount);

    if (userAccountInfo === null) {
        userAccount = await tokenObject.createAssociatedTokenAccount(address);
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

    const balanceInfo = (await connection.getTokenAccountBalance(userAccount)).value;
    const decimals = balanceInfo.decimals;
    const tx = await program.rpc.storeReward(
      _nonce, 
      address,
      token,
      new anchor.BN(amount * (10 ** decimals)), {
      accounts: {
        authority: provider.wallet.publicKey,
        rewards: _rewardsPubkey,
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
      }
    });
  }

const storeMultiRewards = async (addresses, tokens, amounts) => {
    if(addresses.length != tokens.length || tokens.length != amounts.length) {
      console.log("Need to match all length");
      return;
    }

    addresses = addresses.map((address) => {
      if(typeof address == 'string') {
        return new web3.PublicKey(address);
      }
      return address;
    })

    let decimals = {};
    for(var i = 0;i < tokens.length;i ++) {
      if(typeof tokens[i] == 'string') {
        tokens[i] =  new web3.PublicKey(tokens[i]);
      }

      const token = tokens[i];
      if(!decimals[token.toBase58()]) {
        const ownTokens = await connection.getTokenAccountsByOwner(addresses[i], {mint: token});
        let tokenAccount;
        const tokenObject = new Token(connection, token, TOKEN_PROGRAM_ID, provider.wallet.payer);
        if(ownTokens.length == 0 || ownTokens.value.length == 0) {
          tokenAccount = await tokenObject.createAssociatedTokenAccount(addresses[i]);
        } else {
          const oToken = ownTokens.value[0];
          tokenAccount = oToken.pubkey;
        }

        const balanceInfo = (await connection.getTokenAccountBalance(tokenAccount)).value;
        decimals[token.toBase58()] = balanceInfo.decimals;
      }
    }

    amounts = amounts.map((amount, index) => {
      return new anchor.BN(amount * (10 ** decimals[tokens[index].toBase58()]));
    })

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

    const tx = await program.rpc.storeRewards(
      _nonce, 
      addresses,
      tokens,
      amounts, {
      accounts: {
        authority: provider.wallet.publicKey,
        rewards: _rewardsPubkey,
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
      }
    });
  }

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

    const tx = await program.rpc.claim(
      _nonce,
      address, 
      new anchor.BN(amount * decimals), {
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

const getTokenDecimals = async (tokenPubkey, connection, owner) => {
  const walletTokens = await connection.getTokenAccountsByOwner(owner, {mint: tokenPubkey});

  if(mainWalletTokens.value.length == 0)
  {
      console.log("Token does not exists in your wallet");
      return 0;
  }
  
  const token = walletTokens.value[0];
  const value = (await connection.getTokenAccountBalance(token.pubkey)).value;
  return 10 ** value.decimals;
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

describe('bulk-transfer', () => {
  it('start', async () => {
    // await initialize();

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

    vaultPubkey = _vaultPubkey;
    rewardsPubkey = _rewardsPubkey;

    const token1 = 'BCz2HAGrKdyvujmumiSHnuHx2rv9zNAnkyUBsmqgb2pD';
    const token2 = '8GBHsLi9rALSsL9Ty4EEN2HEArBrfjE9R2VnjgUj8Pxa';

    await deposit(token1, 100, walletKeyPair.publicKey)

    const address1 = '9RnnWGWdjJbu7yCo8hstY71qnwu6TVoCKBGLkJnP3yc2';
    const address2 = 'FhdvNwrYMSxMXuYvAsvFVAu7gRUvBNvXzFqv1pfbJkbU';
    await storeSingleRewards(address1, token1, 50);

    await storeMultiRewards([address1, address2], [token1, token1], [10, 50])

    await setCanClaim(address1, true)

    await claim(address1, token1, 20)
    await claim(address2, token1, 20)
  })

});

const assert = require("assert");
import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
const { TOKEN_PROGRAM_ID, Token, AccountLayout } = require("@solana/spl-token");
import { BulkTransfer } from '../types/bulk_transfer';

const getTokenDecimals = async (tokenPubkey, connection, owner) => {
  const walletTokens = await connection.getTokenAccountsByOwner(owner, {mint: new web3.PublicKey(tokenPubkey)});

  if(mainWalletTokens.value.length == 0)
  {
      console.log("Token does not exists in your wallet");
      return 0;
  }
  
  const token = walletTokens.value.pop();
  const value = (await connection.getTokenAccountBalance(token.pubkey)).value;
  return 10 ** value.decimals;
}

async function sendLamports(
    provider,
    destination,
    amount
) {
    const tx = new anchor.web3.Transaction();
    tx.add(
        anchor.web3.SystemProgram.transfer(
            { 
                fromPubkey: provider.wallet.publicKey, 
                lamports: amount, 
                toPubkey: destination
            }
        )
    );
    await provider.send(tx);
}

describe('bulk-transfer', () => {
  anchor.setProvider('devnet');

  const program = anchor.workspace.BulkTransfer as Program<BulkTransfer>;
  const provider = anchor.getProvider();

  let poolKeypair = anchor.web3.Keypair.generate();
  let vaultKeypair = anchor.web3.Keypair.generate();
  let vaultPubkey, rewardsPubkey;

  let mintA, aTokenObject, aTokenAccount, aTokenPoolVault;
  let mintB, bTokenObject, bTokenAccount, bTokenPoolVault, bDecimals = 10 ** 6;

  let user1, user2;
  let user1TokenAAccount, user2TokenAAccount;
  let user1TokenBAccount, user2TokenBAccount;

  it('mint tokens', async () => {
    mintA = await Token.createMint(
        provider.connection,
        provider.wallet.payer,
        provider.wallet.publicKey,
        null,
        9,
        TOKEN_PROGRAM_ID
    );

    aTokenObject = new Token(provider.connection, mintA.publicKey, TOKEN_PROGRAM_ID, provider.wallet.payer);
    aTokenAccount = await aTokenObject.createAssociatedTokenAccount(provider.wallet.publicKey);
    await aTokenObject.mintTo(aTokenAccount, provider.wallet.payer, [], 1000 * anchor.web3.LAMPORTS_PER_SOL);

    mintB = await Token.createMint(
        provider.connection,
        provider.wallet.payer,
        provider.wallet.publicKey,
        null,
        6,
        TOKEN_PROGRAM_ID
    );

    bTokenObject = new Token(provider.connection, mintB.publicKey, TOKEN_PROGRAM_ID, provider.wallet.payer);
    bTokenAccount = await bTokenObject.createAssociatedTokenAccount(provider.wallet.publicKey);
    await bTokenObject.mintTo(bTokenAccount, provider.wallet.payer, [], 1000 * bDecimals);
  })

  it('Is initialized!', async () => {
    const [
        _poolSigner,
        _nonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer()],
        program.programId
    );
    
    aTokenPoolVault = await aTokenObject.createAccount(_poolSigner);
    bTokenPoolVault = await bTokenObject.createAccount(_poolSigner);

    const [
        _vaultPubkey,
        _vaultNonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [provider.wallet.publicKey.toBuffer(), poolKeypair.publicKey.toBuffer()],
        program.programId
    );

    const [
        _rewardsPubkey,
        _rewardsNonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer(), Buffer.from('rewards')],
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
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
        vault: _vaultPubkey,
        rewards: _rewardsPubkey,
        owner: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [poolKeypair, ],
      instructions: [
          await program.account.pool.createInstruction(poolKeypair, ),
      ],
    });
    console.log("Your transaction signature", tx);
  });

  it('deposit aToken', async () => {
    const [
        _poolSigner,
        _nonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer()],
        program.programId
    );

    const tx = await program.rpc.deposit(
      _nonce, 
      new anchor.BN(100 * anchor.web3.LAMPORTS_PER_SOL), {
      accounts: {
        tokenVault: aTokenPoolVault,
        tokenDepositor: aTokenAccount,
        tokenDepositAuthority: provider.wallet.publicKey,
        authority: provider.wallet.publicKey,
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
        vault: vaultPubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    });
  })

  it('deposited a balance check', async () => {
      const balance = (await provider.connection.getTokenAccountBalance(aTokenPoolVault)).value.uiAmount;
      assert.equal(balance, 100);
  })

  it('check stored vault', async () => {
    let vaultObject = await program.account.vault.fetch(vaultPubkey);
    assert.equal(vaultObject.tokenMints.length, 1);
    assert.equal(vaultObject.tokenMints[0].toBase58(), mintA.publicKey.toBase58());
    assert.equal(vaultObject.tokenVaults.length, 1);
    assert.strictEqual(100, (await provider.connection.getTokenAccountBalance(vaultObject.tokenVaults[0])).value.uiAmount);
  })

  it('update aToken amount', async () => {
    const [
        _poolSigner,
        _nonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer()],
        program.programId
    );

    const tx = await program.rpc.deposit(
      _nonce, 
      new anchor.BN(100 * anchor.web3.LAMPORTS_PER_SOL), {
      accounts: {
        tokenVault: aTokenPoolVault,
        tokenDepositor: aTokenAccount,
        tokenDepositAuthority: provider.wallet.publicKey,
        authority: provider.wallet.publicKey,
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
        vault: vaultPubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    });
  })

  it('check stored vault after updated', async () => {
    let vaultObject = await program.account.vault.fetch(vaultPubkey);
    assert.equal(vaultObject.tokenMints.length, 1);
    assert.equal(vaultObject.tokenMints[0].toBase58(), mintA.publicKey.toBase58());
    assert.equal(vaultObject.tokenVaults.length, 1);
    assert.strictEqual(200, (await provider.connection.getTokenAccountBalance(vaultObject.tokenVaults[0])).value.uiAmount);
  })

  it('deposit bToken', async () => {
    const [
        _poolSigner,
        _nonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer()],
        program.programId
    );

    const tx = await program.rpc.deposit(
      _nonce, 
      new anchor.BN(100 * bDecimals), {
      accounts: {
        tokenVault: bTokenPoolVault,
        tokenDepositor: bTokenAccount,
        tokenDepositAuthority: provider.wallet.publicKey,
        authority: provider.wallet.publicKey,
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
        vault: vaultPubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    });
  })

  it('deposited b balance check', async () => {
      const balance = (await provider.connection.getTokenAccountBalance(bTokenPoolVault)).value.uiAmount;
      assert.equal(balance, 100);
  })

  it('check stored vault', async () => {
    let vaultObject = await program.account.vault.fetch(vaultPubkey);
    assert.equal(vaultObject.tokenMints.length, 2);
    assert.equal(vaultObject.tokenMints[0].toBase58(), mintA.publicKey.toBase58());
    assert.equal(vaultObject.tokenMints[1].toBase58(), mintB.publicKey.toBase58());
    assert.equal(vaultObject.tokenVaults.length, 2);
    assert.strictEqual(200, (await provider.connection.getTokenAccountBalance(vaultObject.tokenVaults[0])).value.uiAmount);
    assert.strictEqual(100, (await provider.connection.getTokenAccountBalance(vaultObject.tokenVaults[1])).value.uiAmount);
  })

  it('update bToken amount', async () => {
    const [
        _poolSigner,
        _nonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer()],
        program.programId
    );

    const tx = await program.rpc.deposit(
      _nonce, 
      new anchor.BN(100 * bDecimals), {
      accounts: {
        tokenVault: bTokenPoolVault,
        tokenDepositor: bTokenAccount,
        tokenDepositAuthority: provider.wallet.publicKey,
        authority: provider.wallet.publicKey,
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
        vault: vaultPubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      }
    });
  })

  it('check stored vault after updated', async () => {
    let vaultObject = await program.account.vault.fetch(vaultPubkey);
    assert.equal(vaultObject.tokenMints.length, 2);
    assert.equal(vaultObject.tokenMints[0].toBase58(), mintA.publicKey.toBase58());
    assert.equal(vaultObject.tokenMints[1].toBase58(), mintB.publicKey.toBase58());
    assert.equal(vaultObject.tokenVaults.length, 2);
    assert.strictEqual(200, (await provider.connection.getTokenAccountBalance(vaultObject.tokenVaults[0])).value.uiAmount);
    assert.strictEqual(200, (await provider.connection.getTokenAccountBalance(vaultObject.tokenVaults[1])).value.uiAmount);
  })

  it('store single reward', async () => {
    user1 = anchor.web3.Keypair.generate();

    await sendLamports(provider, user1.publicKey, anchor.web3.LAMPORTS_PER_SOL);

    user1TokenAAccount = await aTokenObject.createAssociatedTokenAccount(user1.publicKey);
    user1TokenBAccount = await bTokenObject.createAssociatedTokenAccount(user1.publicKey);

    const [
        _poolSigner,
        _nonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer()],
        program.programId
    );

    const [
        _rewardsPubkey,
        _rewardsNonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer(), Buffer.from('rewards')],
        program.programId
    );

    const tx = await program.rpc.storeReward(
      _nonce, 
      user1.publicKey,
      mintA.publicKey,
      new anchor.BN(100 * anchor.web3.LAMPORTS_PER_SOL), {
      accounts: {
        authority: provider.wallet.publicKey,
        rewards: _rewardsPubkey,
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
      }
    });

    let rewardsObject = await program.account.rewards.fetch(rewardsPubkey);
    assert.equal(rewardsObject.rewards.length, 1);
    assert.equal(rewardsObject.addresses.length, 1);
    assert.equal(rewardsObject.addresses[0].toBase58(), user1.publicKey.toBase58());
    assert.equal(rewardsObject.rewards[0].address.toBase58(), user1.publicKey.toBase58());
    assert.equal(rewardsObject.rewards[0].mints.length, 1);
    assert.equal(rewardsObject.rewards[0].amounts.length, 1);
    assert.equal(rewardsObject.rewards[0].mints[0].toBase58(), mintA.publicKey.toBase58());
    assert.equal(rewardsObject.rewards[0].amounts[0].toNumber(), 100 * anchor.web3.LAMPORTS_PER_SOL);

    //Update stored amount
    const tx2 = await program.rpc.storeReward(
      _nonce, 
      user1.publicKey,
      mintA.publicKey,
      new anchor.BN(150 * anchor.web3.LAMPORTS_PER_SOL), {
      accounts: {
        authority: provider.wallet.publicKey,
        rewards: _rewardsPubkey,
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
      }
    });

    let rewardsObject2 = await program.account.rewards.fetch(rewardsPubkey);
    assert.equal(rewardsObject2.rewards.length, 1);
    assert.equal(rewardsObject2.addresses.length, 1);
    assert.equal(rewardsObject2.addresses[0].toBase58(), user1.publicKey.toBase58());
    assert.equal(rewardsObject2.rewards[0].address.toBase58(), user1.publicKey.toBase58());
    assert.equal(rewardsObject2.rewards[0].mints.length, 1);
    assert.equal(rewardsObject2.rewards[0].amounts.length, 1);
    assert.equal(rewardsObject2.rewards[0].mints[0].toBase58(), mintA.publicKey.toBase58());
    assert.equal(rewardsObject2.rewards[0].amounts[0].toNumber(), 150 * anchor.web3.LAMPORTS_PER_SOL);

    //Adding new mint rewards
    const tx3 = await program.rpc.storeReward(
      _nonce, 
      user1.publicKey,
      mintB.publicKey,
      new anchor.BN(150 * bDecimals), {
      accounts: {
        authority: provider.wallet.publicKey,
        rewards: _rewardsPubkey,
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
      }
    });

    let rewardsObject3 = await program.account.rewards.fetch(rewardsPubkey);
    assert.equal(rewardsObject3.rewards.length, 1);
    assert.equal(rewardsObject3.addresses.length, 1);
    assert.equal(rewardsObject3.addresses[0].toBase58(), user1.publicKey.toBase58());
    assert.equal(rewardsObject3.rewards[0].address.toBase58(), user1.publicKey.toBase58());
    assert.equal(rewardsObject3.rewards[0].mints.length, 2);
    assert.equal(rewardsObject3.rewards[0].amounts.length, 2);
    assert.equal(rewardsObject3.rewards[0].mints[1].toBase58(), mintB.publicKey.toBase58());
    assert.equal(rewardsObject3.rewards[0].amounts[1].toNumber(), 150 * bDecimals);
  })

  it('store single reward2', async () => {
    user2 = anchor.web3.Keypair.generate();

    await sendLamports(provider, user2.publicKey, anchor.web3.LAMPORTS_PER_SOL);

    user2TokenAAccount = await aTokenObject.createAssociatedTokenAccount(user2.publicKey);
    user2TokenBAccount = await bTokenObject.createAssociatedTokenAccount(user2.publicKey);

    const [
        _poolSigner,
        _nonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer()],
        program.programId
    );

    const [
        _rewardsPubkey,
        _rewardsNonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer(), Buffer.from('rewards')],
        program.programId
    );

    const tx = await program.rpc.storeReward(
      _nonce, 
      user2.publicKey,
      mintA.publicKey,
      new anchor.BN(100 * anchor.web3.LAMPORTS_PER_SOL), {
      accounts: {
        authority: provider.wallet.publicKey,
        rewards: _rewardsPubkey,
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
      }
    });

    let rewardsObject = await program.account.rewards.fetch(rewardsPubkey);
    assert.equal(rewardsObject.rewards.length, 2);
    assert.equal(rewardsObject.addresses.length, 2);
    assert.equal(rewardsObject.addresses[1].toBase58(), user2.publicKey.toBase58());
    assert.equal(rewardsObject.rewards[1].address.toBase58(), user2.publicKey.toBase58());
    assert.equal(rewardsObject.rewards[1].mints.length, 1);
    assert.equal(rewardsObject.rewards[1].amounts.length, 1);
    assert.equal(rewardsObject.rewards[1].mints[0].toBase58(), mintA.publicKey.toBase58());
    assert.equal(rewardsObject.rewards[1].amounts[0].toNumber(), 100 * anchor.web3.LAMPORTS_PER_SOL);

    //Update stored amount
    const tx2 = await program.rpc.storeReward(
      _nonce, 
      user2.publicKey,
      mintA.publicKey,
      new anchor.BN(150 * anchor.web3.LAMPORTS_PER_SOL), {
      accounts: {
        authority: provider.wallet.publicKey,
        rewards: _rewardsPubkey,
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
      }
    });

    let rewardsObject2 = await program.account.rewards.fetch(rewardsPubkey);
    assert.equal(rewardsObject2.rewards.length, 2);
    assert.equal(rewardsObject2.addresses.length, 2);
    assert.equal(rewardsObject2.addresses[1].toBase58(), user2.publicKey.toBase58());
    assert.equal(rewardsObject2.rewards[1].address.toBase58(), user2.publicKey.toBase58());
    assert.equal(rewardsObject2.rewards[1].mints.length, 1);
    assert.equal(rewardsObject2.rewards[1].amounts.length, 1);
    assert.equal(rewardsObject2.rewards[1].mints[0].toBase58(), mintA.publicKey.toBase58());
    assert.equal(rewardsObject2.rewards[1].amounts[0].toNumber(), 150 * anchor.web3.LAMPORTS_PER_SOL);
  })

  it('store multi rewards', async () => {
    const [
        _poolSigner,
        _nonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer()],
        program.programId
    );

    const [
        _rewardsPubkey,
        _rewardsNonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer(), Buffer.from('rewards')],
        program.programId
    );

    const tx = await program.rpc.storeRewards(
      _nonce, 
      [user1.publicKey, user2.publicKey],
      [mintA.publicKey, mintB.publicKey],
      [new anchor.BN(100 * anchor.web3.LAMPORTS_PER_SOL), new anchor.BN(100 * bDecimals)], {
      accounts: {
        authority: provider.wallet.publicKey,
        rewards: _rewardsPubkey,
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
      }
    });

    let rewardsObject = await program.account.rewards.fetch(rewardsPubkey);
    assert.equal(rewardsObject.rewards.length, 2);
    assert.equal(rewardsObject.addresses.length, 2);
    assert.equal(rewardsObject.rewards[1].mints.length, 2);
    assert.equal(rewardsObject.rewards[1].amounts.length, 2);
    assert.equal(rewardsObject.rewards[1].mints[1].toBase58(), mintB.publicKey.toBase58());
    assert.equal(rewardsObject.rewards[1].amounts[1].toNumber(), 100 * bDecimals);

  })

  it('set can claim', async () => {
    const [
        _poolSigner,
        _nonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer()],
        program.programId
    );

    const [
        _rewardsPubkey,
        _rewardsNonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer(), Buffer.from('rewards')],
        program.programId
    );

    const tx = await program.rpc.setUserCanClaim(
      user1.publicKey,
      true, {
      accounts: {
        authority: provider.wallet.publicKey,
        rewards: _rewardsPubkey,
      }
    });

    let rewardsObject = await program.account.rewards.fetch(_rewardsPubkey);
    assert.equal(rewardsObject.canClaim.length, 2);
    assert.equal(rewardsObject.canClaim[0], true);
    assert.equal(rewardsObject.canClaim[1], false);

  })

  it('claim a rewards', async () => {
    let envProvider = anchor.Provider.env();
        envProvider.commitment = 'pending';

    let provider = new anchor.Provider(envProvider.connection, new anchor.Wallet(user1), envProvider.opts);
    let program = anchor.workspace.BulkTransfer as Program<BulkTransfer>;
    program = new anchor.Program(program.idl, program.programId, provider);

    const [
        _poolSigner,
        _nonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer()],
        program.programId
    );

    const [
        _rewardsPubkey,
        _rewardsNonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
        [poolKeypair.publicKey.toBuffer(), Buffer.from('rewards')],
        program.programId
    );

    const tx = await program.rpc.claim(
      _nonce,
      user1.publicKey, 
      new anchor.BN(50 * anchor.web3.LAMPORTS_PER_SOL), {
      accounts: {
        pool: poolKeypair.publicKey,
        poolSigner: _poolSigner,
        rewards: _rewardsPubkey,
        fromAccount: aTokenPoolVault,
        toAccount: user1TokenAAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      }
    });
console.log(tx)
    let vaultObject = await program.account.vault.fetch(vaultPubkey);
    assert.strictEqual(150, (await provider.connection.getTokenAccountBalance(vaultObject.tokenVaults[0])).value.uiAmount);
  })

});

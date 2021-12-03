export type BulkTransfer = {
  "version": "0.0.0",
  "name": "bulk_transfer",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "poolSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewards",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "poolNonce",
          "type": "u8"
        },
        {
          "name": "vaultNonce",
          "type": "u8"
        },
        {
          "name": "rewardsNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenDepositor",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenDepositAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "poolNonce",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "storeReward",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewards",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "poolNonce",
          "type": "u8"
        },
        {
          "name": "address",
          "type": "publicKey"
        },
        {
          "name": "mint",
          "type": "publicKey"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "storeRewards",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewards",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "poolNonce",
          "type": "u8"
        },
        {
          "name": "addresses",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "mints",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "amounts",
          "type": {
            "vec": "u64"
          }
        }
      ]
    },
    {
      "name": "setUserCanClaim",
      "accounts": [
        {
          "name": "rewards",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "address",
          "type": "publicKey"
        },
        {
          "name": "flag",
          "type": "bool"
        }
      ]
    },
    {
      "name": "claim",
      "accounts": [
        {
          "name": "rewards",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fromAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "toAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "poolNonce",
          "type": "u8"
        },
        {
          "name": "address",
          "type": "publicKey"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "nonce",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "tokenMints",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "tokenVaults",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "nonce",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "rewards",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "nonce",
            "type": "u8"
          },
          {
            "name": "rewards",
            "type": {
              "vec": {
                "defined": "UserRewards"
              }
            }
          },
          {
            "name": "addresses",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "canClaim",
            "type": {
              "vec": "bool"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "UserRewards",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "mints",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "amounts",
            "type": {
              "vec": "u64"
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "ArgsNotMatch",
      "msg": "Arguments count is not match."
    },
    {
      "code": 301,
      "name": "NotFoundAddress",
      "msg": "Not found user."
    },
    {
      "code": 302,
      "name": "NotAllowedClaim",
      "msg": "Not allowed claim."
    },
    {
      "code": 303,
      "name": "NotFoundClaimMint",
      "msg": "Not found claim token."
    }
  ]
};

export const IDL: BulkTransfer = {
  "version": "0.0.0",
  "name": "bulk_transfer",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "poolSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewards",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "poolNonce",
          "type": "u8"
        },
        {
          "name": "vaultNonce",
          "type": "u8"
        },
        {
          "name": "rewardsNonce",
          "type": "u8"
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "tokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenDepositor",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenDepositAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "poolNonce",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "storeReward",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewards",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "poolNonce",
          "type": "u8"
        },
        {
          "name": "address",
          "type": "publicKey"
        },
        {
          "name": "mint",
          "type": "publicKey"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "storeRewards",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewards",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "poolNonce",
          "type": "u8"
        },
        {
          "name": "addresses",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "mints",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "amounts",
          "type": {
            "vec": "u64"
          }
        }
      ]
    },
    {
      "name": "setUserCanClaim",
      "accounts": [
        {
          "name": "rewards",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "address",
          "type": "publicKey"
        },
        {
          "name": "flag",
          "type": "bool"
        }
      ]
    },
    {
      "name": "claim",
      "accounts": [
        {
          "name": "rewards",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fromAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "toAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "poolNonce",
          "type": "u8"
        },
        {
          "name": "address",
          "type": "publicKey"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "nonce",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "tokenMints",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "tokenVaults",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "nonce",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "rewards",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "nonce",
            "type": "u8"
          },
          {
            "name": "rewards",
            "type": {
              "vec": {
                "defined": "UserRewards"
              }
            }
          },
          {
            "name": "addresses",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "canClaim",
            "type": {
              "vec": "bool"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "UserRewards",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "mints",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "amounts",
            "type": {
              "vec": "u64"
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "ArgsNotMatch",
      "msg": "Arguments count is not match."
    },
    {
      "code": 301,
      "name": "NotFoundAddress",
      "msg": "Not found user."
    },
    {
      "code": 302,
      "name": "NotAllowedClaim",
      "msg": "Not allowed claim."
    },
    {
      "code": 303,
      "name": "NotFoundClaimMint",
      "msg": "Not found claim token."
    }
  ]
};

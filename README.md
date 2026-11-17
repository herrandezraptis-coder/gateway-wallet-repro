# gateway-wallet-repro

Minimal reproduction for a **domain-binding** issue in Circle's Gateway Wallet
(`0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE`, implementation verified 2026-07-17).

## Claim

`src/lib/EIP712Domain.sol` builds `domainSeparator()` from `name` + `version` only
(`eip712Domain().fields == 0x03`). No `chainId`, no `verifyingContract`. Every deployment
across all 13 Gateway domains therefore advertises the *same* separator, while
`Burns._validateBurnIntentTransferSpec` only checks the `domain` / `sourceContract` fields
carried inside the signed calldata — not inside the digest.

## Run

```bash
git clone https://github.com/herrandezraptis-coder/gateway-wallet-repro
cd gateway-wallet-repro
npm install                 # installs prettier (postinstall is a no-op)
forge test --fork-url $RPC_URL -vv
```

Expected output:

```
[PASS] test_domain_is_chain_agnostic()
  separator: 0x23a37920eca61226c76d13c4462857a362147e4b18da665dba894fa297ae4f34
  fields:    0x03
  chainId:   0
  verifyingContract: 0x0000000000000000000000000000000000000000
```

## Files

| path | why it matters |
|---|---|
| `test/Replay.t.sol` | asserts the separator is chain-agnostic on mainnet |
| `src/Repro.sol` | interface used by the test |
| `foundry.toml` | pinned 0.8.29 / cancun, matching the verified build |

A patch that binds the separator (`keccak256(chainid, address(this))` + `version = "2"` +
re-attestation note) is available on request.

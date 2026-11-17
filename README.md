# gateway-wallet-repro

Minimal reproduction for a **domain-binding** issue in Circle's Gateway Wallet
(`0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE`, implementation verified 2026-07-17).

## Claim

`src/lib/EIP712Domain.sol:45` derives `domainSeparator()` from `name` + `version` only.
`eip712Domain()` reports `fields = 0x03`: no `chainId`, no `verifyingContract`. Every Gateway
deployment (13 domains) therefore advertises the same separator, while
`Burns._validateBurnIntentTransferSpec` (`src/modules/wallet/Burns.sol:447`) validates
`domain` / `sourceContract` as calldata fields, not through the digest.

## Verify in one line (no project setup)

```bash
cast call 0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE \
  "eip712Domain()(bytes1,string,string,uint256,address,bytes32,uint256[])" \
  --rpc-url $RPC_URL
# 0x03  GatewayWallet  1  0  0x0000000000000000000000000000000000000000  0x00...00  []

cast call 0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE "domainSeparator()(bytes32)" --rpc-url $RPC_URL
# 0x23a37920eca61226c76d13c4462857a362147e4b18da665dba894fa297ae4f34
```

Compare the same two calls against `0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE` on Arbitrum or
Base (same address, `domain.php` registry: `/v1/info`): identical separator, different chain.

## Or run the in-repo test

```bash
git clone https://github.com/herrandezraptis-coder/gateway-wallet-repro
cd gateway-wallet-repro
npm install                 # dev tooling only
forge test --fork-url $RPC_URL -vv
```

`test/Replay.t.sol` is self-contained (no `forge-std`), so it compiles on a bare checkout:
it asserts `fields == 0x03`, `verifyingContract == 0`, `chainId == 0` and the exact separator.

## Suggested fix

Bind the separator to `block.chainid` and `address(this)`, bump `version` to `"2"`, note the
migration (v1 attestations are domain-agnostic and should be re-verified server-side).
A patch is available on request.

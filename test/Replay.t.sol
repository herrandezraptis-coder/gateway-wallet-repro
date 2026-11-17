// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

interface IGatewayWallet {
    function domainSeparator() external view returns (bytes32);
    function eip712Domain()
        external view
        returns (bytes1 fields, string memory name, string memory version,
                 uint256 chainId, address verifyingContract, bytes32 salt,
                 uint256[] memory extensions);
}

/// @notice Self-contained (no forge-std): proves the deployed wallet advertises an
/// unbound EIP-712 domain. Run with: forge test --fork-url $RPC_URL -vv
contract Replay {
    IGatewayWallet constant W = IGatewayWallet(0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE);

    function test_domain_is_chain_agnostic() public view {
        bytes32 sep = W.domainSeparator();
        (bytes1 fields, string memory name, string memory ver,, address vc,,) = W.eip712Domain();
        require(sep == 0x23a37920eca61226c76d13c4462857a362147e4b18da665dba894fa297ae4f34, "separator changed");
        require(fields == 0x03, "expected name+version only");
        require(vc == address(0), "expected no verifyingContract");
        require(keccak256(bytes(name)) == keccak256("GatewayWallet"), "name");
        require(keccak256(bytes(ver)) == keccak256("1"), "version");
    }
}

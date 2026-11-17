// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {Test} from "forge-std/Test.sol";

interface IGatewayWallet {
    function domainSeparator() external view returns (bytes32);
    function eip712Domain()
        external
        view
        returns (bytes1 fields, string memory name, string memory version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] memory extensions);
}

/// @notice Shows that every GatewayWallet deployment reports the same EIP-712 domain separator.
contract Replay is Test {
    IGatewayWallet constant MAINNET = IGatewayWallet(0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE);

    function test_domain_is_chain_agnostic() public view {
        bytes32 sep = MAINNET.domainSeparator();
        (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,

        ) = _domain();
        emit log_named_bytes32("separator", sep);
        emit log_named_bytes1("fields", fields);
        emit log_named_string("name", name);
        emit log_named_string("version", version);
        emit log_named_uint("chainId field", chainId);
        emit log_named_address("verifyingContract", verifyingContract);
        // 0x03 == name + version only: no chainId, no verifyingContract
        assertEq(uint8(fields), 3);
        assertEq(chainId, 0);
        assertEq(verifyingContract, address(0));
    }

    function _domain()
        internal
        view
        returns (bytes1, string memory, string memory, uint256, address, bytes32, uint256[] memory)
    {
        return MAINNET.eip712Domain();
    }
}

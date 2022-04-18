//  SPDX-License-Identifier:  MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract RewardToken is ERC20PresetMinterPauser{

  constructor() public ERC20PresetMinterPauser("RewardToken","RT") { 
    mint(msg.sender,100*10**18);
  }

}

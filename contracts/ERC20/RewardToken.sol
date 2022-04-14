//  SPDX-License-Identifier:  MIT
pragma solidity ^0.6.6;
import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

contract RewardToken is ERC20PresetMinterPauser{

  constructor() public ERC20PresetMinterPauser("RewardToken","RT") { 
  }

}

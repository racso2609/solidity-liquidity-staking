//  SPDX-License-Identifier:  UNLICENSE
pragma solidity ^0.6.6;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Token is ERC20{

  constructor(uint256 _totalSupply) ERC20("RACToken","RAC") public{ 
    _mint(msg.sender,_totalSupply);
  }

}

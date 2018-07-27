pragma solidity ^0.4.23;

import "./interfaces/IERC20.sol";
import "./AkyuToken.sol";
import "./SafeMath.sol";
import "./Ownable.sol";

/**
 * @title AKYU token initial distribution
 *
 * @dev Distribute purchasers, airdrop, promotion, and founder tokens
 */
contract AkyuDistribution is Ownable {
  using SafeMath for uint256;

  AkyuToken public AKYU;

  uint256 private constant decimalFactor = 10**uint256(18);
  enum AllocationType { PREORDER, FOUNDER, AIRDROP, ADVISOR, PROMOTION, EMISSION1, EMISSION2, EMISSION3 }
  uint256 public constant INITIAL_SUPPLY = 100000000 * decimalFactor;
  uint256 public AVAILABLE_TOTAL_SUPPLY = 100000000 * decimalFactor;
  uint256 public AVAILABLE_PREORDER_SUPPLY = 1000000 * decimalFactor; // 100% Released at Token Distribution (TD)
  uint256 public AVAILABLE_FOUNDER_SUPPLY = 15000000 * decimalFactor; // 100% Released at TD
  uint256 public AVAILABLE_AIRDROP_SUPPLY = 15000000 * decimalFactor; // 100% Released at TD
  uint256 public AVAILABLE_ADVISOR_SUPPLY = 15000000 * decimalFactor; // 100% Released at TD
  uint256 public AVAILABLE_PROMOTION_SUPPLY = 24000000 * decimalFactor; // 100% at TD
  uint256 public AVAILABLE_EMISSION1_SUPPLY = 10000000 * decimalFactor; // 100% Released at TD +30 days
  uint256 public AVAILABLE_EMISSION2_SUPPLY = 10000000 * decimalFactor; // 100% Released at TD +60 days
  uint256 public AVAILABLE_EMISSION3_SUPPLY = 10000000 * decimalFactor; // 100% Released at TD +90 days

  uint256 public grandTotalClaimed = 0;
  uint256 public startTime;

  // Allocation with vesting information
  struct Allocation {
    uint8 AllocationSupply; // Type of allocation
    uint256 endCliff;       // Tokens are locked until
    uint256 endVesting;     // This is when the tokens are fully unvested
    uint256 totalAllocated; // Total tokens allocated
    uint256 amountClaimed;  // Total tokens claimed
  }
  mapping (address => Allocation) public allocations;

  // List of admins
  mapping (address => bool) public airdropAdmins;

  // Keeps track of whether or not a 250 AKYU airdrop has been made to a particular address
  mapping (address => bool) public airdrops;

  modifier onlyOwnerOrAdmin() {
    require(msg.sender == owner || airdropAdmins[msg.sender]);
    _;
  }

  event LogNewAllocation(address indexed _recipient, AllocationType indexed _fromSupply, uint256 _totalAllocated, uint256 _grandTotalAllocated);
  event LogAkyuClaimed(address indexed _recipient, uint8 indexed _fromSupply, uint256 _amountClaimed, uint256 _totalAllocated, uint256 _grandTotalClaimed);

  /**
    * @dev Constructor function - Set the akyu token address
    * @param _startTime The time when AkyuDistribution goes live
    */
  function AkyuDistribution(uint256 _startTime) public {
    require(_startTime >= now);
    require(AVAILABLE_TOTAL_SUPPLY == AVAILABLE_PREORDER_SUPPLY.add(AVAILABLE_FOUNDER_SUPPLY).add(AVAILABLE_AIRDROP_SUPPLY).add(AVAILABLE_ADVISOR_SUPPLY).add(AVAILABLE_EMISSION1_SUPPLY).add(AVAILABLE_EMISSION2_SUPPLY).add(AVAILABLE_EMISSION3_SUPPLY).add(AVAILABLE_PROMOTION_SUPPLY));
    startTime = _startTime;
    AKYU = new AkyuToken(this);
  }

  /**
    * @dev Allow the owner of the contract to assign a new allocation
    * @param _recipient The recipient of the allocation
    * @param _totalAllocated The total amount of AKYU available to the receipient (after vesting)
    * @param _supply The AKYU supply the allocation will be taken from
    */
  function setAllocation (address _recipient, uint256 _totalAllocated, AllocationType _supply) onlyOwner public {
    require(allocations[_recipient].totalAllocated == 0 && _totalAllocated > 0);
    require(_supply >= AllocationType.PREORDER && _supply <= AllocationType.EMISSION3);
    require(_recipient != address(0));
    if (_supply == AllocationType.PREORDER) {
      AVAILABLE_PREORDER_SUPPLY = AVAILABLE_PREORDER_SUPPLY.sub(_totalAllocated);
      allocations[_recipient] = Allocation(uint8(AllocationType.PREORDER), 0, 0, _totalAllocated, 0);
    } else if (_supply == AllocationType.FOUNDER) {
      AVAILABLE_FOUNDER_SUPPLY = AVAILABLE_FOUNDER_SUPPLY.sub(_totalAllocated);
      allocations[_recipient] = Allocation(uint8(AllocationType.FOUNDER), startTime, 0, _totalAllocated, 0);
    } else if (_supply == AllocationType.ADVISOR) {
      AVAILABLE_ADVISOR_SUPPLY = AVAILABLE_ADVISOR_SUPPLY.sub(_totalAllocated);
      allocations[_recipient] = Allocation(uint8(AllocationType.ADVISOR), startTime, 0, _totalAllocated, 0);
    } else if (_supply == AllocationType.PROMOTION) {
      AVAILABLE_PROMOTION_SUPPLY = AVAILABLE_PROMOTION_SUPPLY.sub(_totalAllocated);
      allocations[_recipient] = Allocation(uint8(AllocationType.PROMOTION), startTime, 0, _totalAllocated, 0);
    } else if (_supply == AllocationType.EMISSION1) {
      AVAILABLE_EMISSION1_SUPPLY = AVAILABLE_EMISSION1_SUPPLY.sub(_totalAllocated);
      allocations[_recipient] = Allocation(uint8(AllocationType.EMISSION1), startTime + 30 days, 0, _totalAllocated, 0);
    } else if (_supply == AllocationType.EMISSION2) {
      AVAILABLE_EMISSION2_SUPPLY = AVAILABLE_EMISSION2_SUPPLY.sub(_totalAllocated);
      allocations[_recipient] = Allocation(uint8(AllocationType.EMISSION2), startTime + 60 days, 0, _totalAllocated, 0);
    } else if (_supply == AllocationType.EMISSION3) {
      AVAILABLE_EMISSION3_SUPPLY = AVAILABLE_EMISSION3_SUPPLY.sub(_totalAllocated);
      allocations[_recipient] = Allocation(uint8(AllocationType.EMISSION3), startTime + 90 days, 0, _totalAllocated, 0);
    }
    AVAILABLE_TOTAL_SUPPLY = AVAILABLE_TOTAL_SUPPLY.sub(_totalAllocated);
    emit LogNewAllocation(_recipient, _supply, _totalAllocated, grandTotalAllocated());
  }

  /**
    * @dev Add an airdrop admin
    */
  function setAirdropAdmin(address _admin, bool _isAdmin) public onlyOwner {
    airdropAdmins[_admin] = _isAdmin;
  }

  /**
    * @dev perform a transfer of allocations
    * @param _recipient is a list of recipients
    */
  function airdropTokens(address[] _recipient) public onlyOwnerOrAdmin {
    require(now >= startTime);
    uint airdropped;
    for(uint256 i = 0; i< _recipient.length; i++)
    {
        if (!airdrops[_recipient[i]]) {
          airdrops[_recipient[i]] = true;
          require(AKYU.transfer(_recipient[i], 250 * decimalFactor));
          airdropped = airdropped.add(250 * decimalFactor);
        }
    }
    AVAILABLE_AIRDROP_SUPPLY = AVAILABLE_AIRDROP_SUPPLY.sub(airdropped);
    AVAILABLE_TOTAL_SUPPLY = AVAILABLE_TOTAL_SUPPLY.sub(airdropped);
    grandTotalClaimed = grandTotalClaimed.add(airdropped);
  }

  /**
    * @dev Transfer a recipients available allocation to their address
    * @param _recipient The address to withdraw tokens for
    */
  function transferTokens (address _recipient) public {
    require(allocations[_recipient].amountClaimed < allocations[_recipient].totalAllocated);
    require(now >= allocations[_recipient].endCliff);
    require(now >= startTime);
    uint256 newAmountClaimed;
    if (allocations[_recipient].endVesting > now) {
      // Transfer available amount based on vesting schedule and allocation
      newAmountClaimed = allocations[_recipient].totalAllocated.mul(now.sub(startTime)).div(allocations[_recipient].endVesting.sub(startTime));
    } else {
      // Transfer total allocated (minus previously claimed tokens)
      newAmountClaimed = allocations[_recipient].totalAllocated;
    }
    uint256 tokensToTransfer = newAmountClaimed.sub(allocations[_recipient].amountClaimed);
    allocations[_recipient].amountClaimed = newAmountClaimed;
    require(AKYU.transfer(_recipient, tokensToTransfer));
    grandTotalClaimed = grandTotalClaimed.add(tokensToTransfer);
    emit LogAkyuClaimed(_recipient, allocations[_recipient].AllocationSupply, tokensToTransfer, newAmountClaimed, grandTotalClaimed);
  }

  // Returns the amount of AKYU allocated
  function grandTotalAllocated() public view returns (uint256) {
    return INITIAL_SUPPLY - AVAILABLE_TOTAL_SUPPLY;
  }

  // Allow transfer of accidentally sent ERC20 tokens
  function refundTokens(address _recipient, address _token) public onlyOwner {
    require(_token != address(AKYU));
    IERC20 token = IERC20(_token);
    uint256 balance = token.balanceOf(this);
    require(token.transfer(_recipient, balance));
  }
}

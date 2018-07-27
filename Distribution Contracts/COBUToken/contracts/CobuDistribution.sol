pragma solidity ^0.4.18;

import "./interfaces/IERC20.sol";
import "./CobuToken.sol";
import "./SafeMath.sol";
import "./Ownable.sol";

/**
 * @title COBU token initial distribution
 *
 * @dev Distribute allocated tokens
 */
contract CobuDistribution is Ownable {
    using SafeMath for uint256;

    CobuToken public COBU;

    uint256 private constant decimalFactor = 10**uint256(0);
    enum AllocationType { CREATOR, AIRDROP, ADVISOR, PROMO }
    uint256 public constant INITIAL_SUPPLY   = 500000000 * decimalFactor;
    uint256 public AVAILABLE_TOTAL_SUPPLY    = 500000000 * decimalFactor;
    uint256 public AVAILABLE_CREATOR_SUPPLY  = 100000000 * decimalFactor; // 100% Released at Token Distribution (TD)
    uint256 public AVAILABLE_AIRDROP_SUPPLY  =  15000000 * decimalFactor; // 100% released at token Distribution (TD)
    uint256 public AVAILABLE_ADVISOR_SUPPLY  =  10000000 * decimalFactor; // 100% Released at TD
    uint256 public AVAILABLE_PROMO_SUPPLY    = 375000000 * decimalFactor; // 100% Released at TD
  //uint256 public AVAILABLE_RESERVE_SUPPLY  =  513116658 * decimalFactor; // 6.8% Released at TD +100 days -> 100% at TD +4 years
  //uint256 public AVAILABLE_BONUS1_SUPPLY  =    39053330 * decimalFactor; // 100% Released at TD +1 year
  //uint256 public AVAILABLE_BONUS2_SUPPLY  =     9354408 * decimalFactor; // 100% Released at TD +2 years
  //uint256 public AVAILABLE_BONUS3_SUPPLY  =    28475604 * decimalFactor; // 100% Released at TD +3 years

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

  // Keeps track of whether or not a COBU airdrop has been made to a particular address
    mapping (address => bool) public airdrops;

    modifier onlyOwnerOrAdmin() {
        require(msg.sender == owner || airdropAdmins[msg.sender]);
        _;
    }

    event LogNewAllocation(address indexed _recipient, AllocationType indexed _fromSupply, uint256 _totalAllocated, uint256 _grandTotalAllocated);
    event LogCobuClaimed(address indexed _recipient, uint8 indexed _fromSupply, uint256 _amountClaimed, uint256 _totalAllocated, uint256 _grandTotalClaimed);

  /**
    * @dev Constructor function - Set the cobu token address
    * @param _startTime The time when CobuDistribution goes live
    */
    function CobuDistribution(uint256 _startTime) public {
        require(_startTime >= now);
        require(AVAILABLE_TOTAL_SUPPLY == AVAILABLE_CREATOR_SUPPLY.add(AVAILABLE_AIRDROP_SUPPLY).add(AVAILABLE_ADVISOR_SUPPLY).add(AVAILABLE_PROMO_SUPPLY));
        startTime = _startTime;
        COBU = new CobuToken(this);
    }

  /**
    * @dev Allow the owner of the contract to assign a new allocation
    * @param _recipient The recipient of the allocation
    * @param _totalAllocated The total amount of COBU available to the receipient (after vesting)
    * @param _supply The COBU supply the allocation will be taken from
    */
    function setAllocation (address _recipient, uint256 _totalAllocated, AllocationType _supply) onlyOwner public {
        require(allocations[_recipient].totalAllocated == 0 && _totalAllocated > 0);
        require(_supply >= AllocationType.CREATOR && _supply <= AllocationType.PROMO);
        require(_recipient != address(0));
        if (_supply == AllocationType.CREATOR) {
            AVAILABLE_CREATOR_SUPPLY = AVAILABLE_CREATOR_SUPPLY.sub(_totalAllocated);
            allocations[_recipient] = Allocation(uint8(AllocationType.CREATOR), 0, 0, _totalAllocated, 0);
    } else if (_supply == AllocationType.ADVISOR) {
        AVAILABLE_ADVISOR_SUPPLY = AVAILABLE_ADVISOR_SUPPLY.sub(_totalAllocated);
        allocations[_recipient] = Allocation(uint8(AllocationType.ADVISOR), 0, 0, _totalAllocated, 0);
    } else if (_supply == AllocationType.PROMO) {
        AVAILABLE_PROMO_SUPPLY = AVAILABLE_PROMO_SUPPLY.sub(_totalAllocated);
        allocations[_recipient] = Allocation(uint8(AllocationType.PROMO), 0, 0, _totalAllocated, 0);
    //} else if (_supply == AllocationType.BONUS1) {
    //  AVAILABLE_BONUS1_SUPPLY = AVAILABLE_BONUS1_SUPPLY.sub(_totalAllocated);
    //  allocations[_recipient] = Allocation(uint8(AllocationType.BONUS1), startTime + 1 years, startTime + 1 years, _totalAllocated, 0);
    //} else if (_supply == AllocationType.BONUS2) {
    //  AVAILABLE_BONUS2_SUPPLY = AVAILABLE_BONUS2_SUPPLY.sub(_totalAllocated);
    //  allocations[_recipient] = Allocation(uint8(AllocationType.BONUS2), startTime + 2 years, startTime + 2 years, _totalAllocated, 0);
    //} else if (_supply == AllocationType.BONUS3) {
    //  AVAILABLE_BONUS3_SUPPLY = AVAILABLE_BONUS3_SUPPLY.sub(_totalAllocated);
     // allocations[_recipient] = Allocation(uint8(AllocationType.BONUS3), startTime + 3 years, startTime + 3 years, _totalAllocated, 0);
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
        for(uint256 i = 0; i<_recipient.length; i++)
    {
            if (!airdrops[_recipient[i]]) {
                airdrops[_recipient[i]] = true;
                require(COBU.transfer(_recipient[i], 1000 * decimalFactor));
                airdropped = airdropped.add(1000 * decimalFactor);
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
        require(COBU.transfer(_recipient, tokensToTransfer));
        grandTotalClaimed = grandTotalClaimed.add(tokensToTransfer);
        emit LogCobuClaimed(_recipient, allocations[_recipient].AllocationSupply, tokensToTransfer, newAmountClaimed, grandTotalClaimed);
    }

  // Returns the amount of COBU allocated
    function grandTotalAllocated() public view returns (uint256) {
        return INITIAL_SUPPLY - AVAILABLE_TOTAL_SUPPLY;
    }

  // Allow transfer of accidentally sent ERC20 tokens
    function refundTokens(address _recipient, address _token) public onlyOwner {
        require(_token != address(COBU));
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(this);
        require(token.transfer(_recipient, balance));
    }
}

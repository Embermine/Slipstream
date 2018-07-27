# Akyu Allocation Scripts

This repo contains the AKYU token allocation addresses for various pools of users. Here they are:

| Supply        | Description           | File  | Num |
| ------------- |:-------------:|:-----:|:----:|
| Preorder | Preorder purchasers | [preorder.csv](/data/preorder.csv) | 0 |
| Founder | Akyu founder | [founder.csv](/data/founder.csv) | 1 |
| Advisors | Akyu advisors | [advisors.csv](/data/advisors.csv)| 3 |
| Promotion | Akyu promotion | [promotion.csv](/data/promotion.csv) | 4 |
| Emission1 | Preorder sale Emission 1 | [emission1.csv](/data/emission1.csv) | 5 |
| Emission2 | Preorder sale Emission 2 | [emission2.csv](/data/emission2.csv) | 6 |
| Emission3 | Preorder sale Emission 3 | [emission3.csv](data/emission3.csv) | 7 |

## Pre contract deploy

To allow participants to check their balances at token.akyumen.io/check, clone the repo, drop the config files into the root folder and call each script in the /database folder.

## Setting the allocations

Once the AkyuDistribution contract is live, the following steps can be taken:

1) Ensure all csv files in /data are correct

2) To set all preorder allocations run `node ./scripts/allocate.js <AkyuDistribution contract address> 0` and `node ./scripts/verify_allocations.js <AkyuDistribution contract address> 0` to verify for correctness.

3) To set all founder allocations run `node ./scripts/allocate.js <AkyuDistribution contract address> 1` and `node ./scripts/verify_allocations.js <AkyuDistribution contract address> 1` to verify for correctness.

4) To set all advisor allocations run `node ./scripts/allocate.js <AkyuDistribution contract address> 3` and `node ./scripts/verify_allocations.js <AkyuDistribution contract address> 3` to verify for correctness.

5) To set all promotion allocations run `node ./scripts/allocate.js <AkyuDistribution contract address> 4` and `node ./scripts/verify_allocations.js <AkyuDistribution contract address> 4` to verify for correctness.

6) To set all emission1 allocations run `node ./scripts/allocate.js <AkyuDistribution contract address> 5` and `node ./scripts/verify_allocations.js <AkyuDistribution contract address> 5` to verify for correctness.

7) To set all emission2 allocations run `node ./scripts/allocate.js <AkyuDistribution contract address> 6` and `node ./scripts/verify_allocations.js <AkyuDistribution contract address> 6` to verify for correctness.

8) To set all emission3 allocations run `node ./scripts/allocate.js <AkyuDistribution contract address> 7` and `node ./scripts/verify_allocations.js <AkyuDistribution contract address> 7` to verify for correctness.

## Distributing the allocations

Once the startTime has passed and tokens become tradeable, the tokens can be distributed by running:

`node ./scripts/distribute.js <AkyuDistribution contract address> <0-8>`

# Running the airdrop

The airdrop can be completed by running `node ./scripts/airdrop.js <AkyuDistribution contract address>` and verified for correctness by running `./node ./scripts/verify_airdrop.js <AkyuDistribution contract address>`.

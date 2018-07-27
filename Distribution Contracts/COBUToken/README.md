# Coinbug Allocation Scripts

This repo contains the COBU token allocation addresses for various pools of users. Here they are:

| Supply        | Description           | File  | Num |
| ------------- |:-------------:|:-----:|:----:|
| Promo | Promo Drop | [promo.csv](/data/promo.csv) | 0 |
| Creators | Coinbug creators | [creators.csv](/data/creators.csv) | 1 |
| Advisors | Coinbug advisors | [advisors.csv](/data/advisors.csv)| 2 |
| Airdrop | Coinbug airdrop | [airdrop.csv](/data/airdrop.csv) | 3 |


## Pre contract deploy

To allow participants to check their balances at token.coinbug.io/check, clone the repo, drop the config files into the root folder and call each script in the /database folder.

## Setting the allocations

Once the CobuDistribution contract is live, the following steps can be taken:

1) Ensure all csv files in /data are correct

2) To set all Promo allocations run `node ./scripts/allocate.js <CobuDistribution contract address> 0` and `node ./scripts/verify_allocations.js <CobuDistribution contract address> 0` to verify for correctness.

3) To set all Creator allocations run `node ./scripts/allocate.js <CobuDistribution contract address> 1` and `node ./scripts/verify_allocations.js <CobuDistribution contract address> 1` to verify for correctness.

4) To set all Advisor allocations run `node ./scripts/allocate.js <CobuDistribution contract address> 3` and `node ./scripts/verify_allocations.js <CobuDistribution contract address> 2` to verify for correctness.

## Distributing the allocations

Once the startTime has passed and tokens become tradeable, the tokens can be distributed by running:

`node ./scripts/distribute.js <CobuDistribution contract address> <0-8>`

# Running the airdrop

The airdrop can be completed by running `node ./scripts/airdrop.js <CobuDistribution contract address>` and verified for correctness by running `./node ./scripts/verify_airdrop.js <CobuDistribution contract address>`.

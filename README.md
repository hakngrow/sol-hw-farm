## Yield Farming Tutorial

Yield farming is the concept of incentivizing users with passive income in exchange for providing liquidity. The first step in yield farming involves adding funds to a liquidity pool, which are essentially smart contracts that contain funds. These pools provide liquidity to a marketplace where users can exchange, borrow, or lend tokens. Once you’ve added your funds to a pool, you’ve officially become a liquidity provider. In return for staking your finds in the pool, you’ll be rewarded with fees generated from the underlying DeFi platform. Reward tokens themselves can also be deposited in liquidity pools, and it’s common practice for people to shift their funds between different protocols to chase higher yields.

### Environment and Dependencies Setup

Open up your code editor (I'm using [Visual Studio Code](https://code.visualstudio.com/)) and create a new directory for this project.
```
mkdir hw-farm
```

Install [Node js](https://nodejs.org/en/) if you have not done so.

In the project directory, install the [Hardhat](https://hardhat.org/) module:
```
npm i --save-dev hardhat
```

Open up Hardhat with `npx hardhat`.

![Create an empty Hardhat project](public/images/hardhat.jpg)

Select the `Create an empty hardhat.config.js` option.

Install dependencies for TypeScript:
```
npm i --save-dev ts-node typescript
```

For testing, install the dependencies for [Chai](https://www.chaijs.com/):
```
npm i --save-dev chai @types/node @types/mocha @types/chai
```

We’ll be using an ERC20 token as both the staking token and as the yield rewarded to users. [OpenZeppelin](https://openzeppelin.com/) offers various contract libraries for developers. They also offer excellent testing tools. Install the dependencies for contracts and testing tools:
```
npm i --save-dev @openzeppelin/contracts @openzeppelin/test-helpers
```

During testing, we’ll need to simulate the passing of time. Install the dependcies needed for OpenZeppelin’s `time.increase()` function:
```
npm i --save-dev @nomiclabs/hardhat-web3 @nomiclabs/hardhat-waffle
```

Change the `hardhat.config` to TypeScript:
```
mv hardhat.config.js hardhat.config.ts
```

Next change the Solidity version and include the `hardhat-waffle` and `hardhat-web3` imports in the `hardhat.config.ts`:
```
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3"

export default {
  solidity: "0.8.4",
};
```

### Contracts

#### 1. ERC20 HWToken Contract

In this tutorial, we will rewards users with HWTokens for staking the MockDai tokens.  The `HW` are just my initials, you can change them to whatever you like.

In the project directory  `hw-farm`, create a `contracts` folder.  In the `contracts` folder, create a new Solidity file `HWToken.sol`.
```
mkdir contracts
```

To build the ERC20 HW token contract, import the `ERC20` contract from OpenZeppelin while also importing OpenZeppelin’s `AccessControl.sol` contract. 

The `AccessControl` contract allows us to implement role-based access control mechanisms.  In our case, we only want users/contracts with the `MINTER` role to be able to mint new tokens.

After declaring the imports, we define the `MINTER` role by using a `bytes32` identifier and exposed it in the external API using a `public constant` hash digest.

In the constructor, we assign the `DEFAULT_ADMIN_ROLE` to the creator of the contract.

We will override the `mint()` function to enforce a check that the caller has the `MINTER` role.
```
require(hasRole(MINTER_ROLE, msg.sender), "Caller is not the minter");
``` 

The mint function allocates a specified number of tokens to a specified user address. Since we want to automate this process, we’re also including the transferOwnership() function to transfer ownership to the farm contract; therefore, only the contract itself can issue tokens.







// SPDX-License-Identifier: MIT

import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { time } from "@openzeppelin/test-helpers";

describe("HWFarm Contract", () => {

    let owner: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let charles: SignerWithAddress;
    let res: any;
    let hwFarm: Contract;
    let hwToken: Contract;
    let mockDai: Contract;

    const daiAmount: BigNumber = ethers.utils.parseEther("25000");

    before(async () => {

        const HWFarm = await ethers.getContractFactory("HWFarm");
        const HWToken = await ethers.getContractFactory("HWToken");
        const MockDai = await ethers.getContractFactory("MockERC20");

        mockDai = await MockDai.deploy("MockDai", "mDAI");


        [owner, alice, bob, charles] = await ethers.getSigners();

        await Promise.all([
            mockDai.mint(owner.address, daiAmount),
            mockDai.mint(alice.address, daiAmount),
            mockDai.mint(bob.address, daiAmount),
            mockDai.mint(charles.address, daiAmount)
        ]);

        hwToken = await HWToken.deploy();
        hwFarm = await HWFarm.deploy(mockDai.address, hwToken.address);
    });

    describe("Init", async () => {
        it("should initialize", async () => {
            expect(hwToken).to.be.ok
            expect(hwFarm).to.be.ok
            expect(mockDai).to.be.ok
        });

        it("should return name", async () => {
            expect(await hwFarm.name())
                .to.eq("HW Farm")
            expect(await mockDai.name())
                .to.eq("MockDai")
            expect(await hwToken.name())
                .to.eq("HWToken")
        })

        it("should show mockDai balance", async () => {
            expect(await mockDai.balanceOf(owner.address))
                .to.eq(daiAmount)
        })
    });

    describe("Staking", async () => {
        it("should stake and update mapping", async () => {
            let toTransfer = ethers.utils.parseEther("100")
            await mockDai.connect(alice).approve(hwFarm.address, toTransfer)

            expect(await hwFarm.isStaking(alice.address))
                .to.eq(false)

            expect(await hwFarm.connect(alice).stake(toTransfer))
                .to.be.ok

            expect(await hwFarm.stakingBalance(alice.address))
                .to.eq(toTransfer)

            expect(await hwFarm.isStaking(alice.address))
                .to.eq(true)
        });

        it("should remove dai from user", async () => {
            let toTransfer = ethers.utils.parseEther("100")
            await mockDai.connect(alice).approve(hwFarm.address, toTransfer)
            await hwFarm.connect(alice).stake(toTransfer)

            res = await mockDai.balanceOf(alice.address)
            expect(Number(res))
                .to.be.lessThan(Number(daiAmount))
        })

        it("should update balance with multiple stakes", async () => {
            let toTransfer = ethers.utils.parseEther("100")
            await mockDai.connect(bob).approve(hwFarm.address, toTransfer)
            await hwFarm.connect(bob).stake(toTransfer)

            await mockDai.connect(bob).approve(hwFarm.address, toTransfer)
            await hwFarm.connect(bob).stake(toTransfer)

            expect(await hwFarm.stakingBalance(bob.address))
                .to.eq(ethers.utils.parseEther("200"))
        })

        it("should revert stake with zero as staked amount", async () => {
            await expect(hwFarm.connect(bob).stake(0))
                .to.be.revertedWith("You cannot stake zero tokens")
        })

        it("should revert stake without allowance", async () => {
            let toTransfer = ethers.utils.parseEther("50")
            await expect(hwFarm.connect(bob).stake(toTransfer))
                .to.be.revertedWith("transfer amount exceeds allowance")
        })

        it("should revert with not enough funds", async () => {
            let toTransfer = ethers.utils.parseEther("1000000")
            await mockDai.connect(bob).approve(hwFarm.address, toTransfer)

            await expect(hwFarm.connect(bob).stake(toTransfer))
                .to.be.revertedWith("You cannot stake zero tokens")
        })
    });

    describe("Unstaking", async () => {
        it("should unstake balance from user", async () => {
            res = await hwFarm.stakingBalance(alice.address)
            expect(Number(res))
                .to.be.greaterThan(0);

            let toTransfer = ethers.utils.parseEther("200")
            await hwFarm.connect(alice).unstake(toTransfer)

            res = await hwFarm.stakingBalance(alice.address)
            expect(Number(res))
                .to.eq(0)
        })

        it("should remove staking status", async () => {
            expect(await hwFarm.isStaking(alice.address))
                .to.eq(false)
        })

        it("should grant minter role", async () => {
            let minter = await hwToken.MINTER_ROLE.call();

            await hwToken.grantRole(minter, hwFarm.address)

            expect(await hwToken.hasRole(minter, hwFarm.address))
                .to.eq(true)
        })

        it("should show the correct balance when unstaking partial staked balance", async () => {
            res = await hwFarm.stakingBalance(bob.address);
            expect(Number(res))
                .to.be.greaterThan(0);

            let toTransfer = ethers.utils.parseEther("120");
            await hwFarm.connect(bob).unstake(toTransfer);

            res = await hwFarm.stakingBalance(bob.address)

            expect(res)
                .to.eq(ethers.utils.parseEther("80"));
        });

        it("isStaking should be true when partially unstaking", async () => {

            res = await hwFarm.isStaking(bob.address);
            expect(res)
                .to.eq(true);
        });
    });


    describe("WithdrawYield", async () => {

        beforeEach(async () => {
            let toTransfer = ethers.utils.parseEther("10")
            await mockDai.connect(charles).approve(hwFarm.address, toTransfer)
            await hwFarm.connect(charles).stake(toTransfer)
        })

        it("should return correct yield time", async () => {
            let timeStart = await hwFarm.startTime(charles.address)
            expect(Number(timeStart))
                .to.be.greaterThan(0)

            // Fast-forward time
            await time.increase(86400)

            expect(await hwFarm.calculateYieldTime(charles.address))
                .to.eq((86400))
        })
    });
});


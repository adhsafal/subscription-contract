import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, fromNano, toNano } from '@ton/core';
import { SubscriptionContract, Withdraw } from '../wrappers/SubscriptionContract';
import '@ton/test-utils';

describe('SubscriptionContract', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let subscriptionContract: SandboxContract<SubscriptionContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        subscriptionContract = blockchain.openContract(await SubscriptionContract.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await subscriptionContract.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: subscriptionContract.address,
            deploy: true,
            success: true,
        });

        // await subscriptionContract.send(
        //     deployer.getSender(),
        //     {
        //         value: toNano('0.001'),
        //     },
        //     null,
        // );
    });

    // it('should deploy and receive ton', async () => {
    //     const balance = await subscriptionContract.getBalance();
    //     // the check is done inside beforeEach
    //     // blockchain and sendTon are ready to use
    // });

    // it('should withdraw all', async () => {
    //     const user = await blockchain.treasury('user');

    //     const balanceBeforeUser = await user.getBalance();

    //     await subscriptionContract.send(
    //         user.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         'withdraw all',
    //     );

    //     const balanceAfterUser = await user.getBalance();

    //     expect(balanceBeforeUser).toBeGreaterThanOrEqual(balanceAfterUser);

    //     const balanceBeforeDeployer = await deployer.getBalance();

    //     await subscriptionContract.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         'withdraw all',
    //     );

    //     const balanceAfterDeployer = await deployer.getBalance();

    //     expect(balanceAfterDeployer).toBeGreaterThan(balanceBeforeDeployer);
    // });

    // it('should withdraw safe', async () => {
    //     const user = await blockchain.treasury('user');

    //     const balanceBeforeUser = await user.getBalance();

    //     await subscriptionContract.send(
    //         user.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         'withdraw safe',
    //     );

    //     const balanceAfterUser = await user.getBalance();

    //     expect(balanceBeforeUser).toBeGreaterThanOrEqual(balanceAfterUser);

    //     const balanceBeforeDeployer = await deployer.getBalance();

    //     await subscriptionContract.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         'withdraw safe',
    //     );

    //     const balanceAfterDeployer = await deployer.getBalance();

    //     expect(balanceAfterDeployer).toBeGreaterThan(balanceBeforeDeployer);

    //     const contractBalance = await subscriptionContract.getBalance();

    //     expect(contractBalance).toBeGreaterThan(0n);
    // });

    // it('should withdraw message', async () => {
    //     const message: Withdraw = {
    //         $$type: 'Withdraw',
    //         amount: toNano('150'),
    //     };

    //     const user = await blockchain.treasury('user');

    //     const balanceBeforeUser = await user.getBalance();

    //     await subscriptionContract.send(
    //         user.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         message,
    //     );

    //     const balanceAfterUser = await user.getBalance();

    //     expect(balanceBeforeUser).toBeGreaterThanOrEqual(balanceAfterUser);

    //     const balanceBeforeDeployer = await deployer.getBalance();

    //     await subscriptionContract.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         message,
    //     );

    //     const balanceAfterDeployer = await deployer.getBalance();

    //     expect(balanceBeforeDeployer + toNano('150')).toBeGreaterThanOrEqual(balanceAfterDeployer);

    //     const contractBalance = await subscriptionContract.getBalance();

    //     expect(contractBalance).toBeGreaterThan(0n);
    // });

    it('should get user balance and expiry', async () => {
        const user = await blockchain.treasury('deployer');

        const userBeforeBalance = await user.getBalance();

        await subscriptionContract.send(
            user.getSender(),
            {
                value: toNano('10'),
            },
            null,
        );
        const userAfterBalance = await user.getBalance();
        const userBalanceAndExpiry = await subscriptionContract.getGetUserBalanceAndExpiryDate(
            Address.parse('EQBGhqLAZseEqRXz4ByFPTGV7SVMlI4hrbs-Sps_Xzx01x8G'),
        );
        console.log(
            'userBalanceAndExpiry',
            userBalanceAndExpiry,
            fromNano(userBeforeBalance),
            fromNano(userAfterBalance),
            user.address,
        );
    });
});

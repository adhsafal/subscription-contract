import { NetworkProvider } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';
import { SubscriptionContract } from '../wrappers/SubscriptionContract';
import { TonClient } from '@ton/ton';
import { argv } from 'process';

const TON_CENTER_API = 'https://testnet.toncenter.com';
const USER_ADDRESS = Address.parse('0QC1VdK9NlxVMHUlAoUiOc3Vum31h-hqCfMh51grbWU3tAki');
const CONTRACT_ADDRESS = Address.parse('EQBSUWkJIYlp_L2N4R22cP6cepDEf0Kz2UvE73utM-C5EQAn');

function getClient(): TonClient {
    return new TonClient({
        endpoint: `${TON_CENTER_API}/api/v2/jsonRPC`,
    });
}

// function getOpenedContract(provider: NetworkProvider) {
//     const contract = new SubscriptionContract(CONTRACT_ADDRESS);
//     return provider.open(contract);
// }

export async function run(provider: NetworkProvider) {
    // await deposit(provider, BigInt(1));
    await withdraw(provider, BigInt(1));
    // const data = await getUserDetails(provider);
    // console.log({ data });
}

async function deposit(provider: NetworkProvider, amount: bigint) {
    console.log('Depositing amount', amount);
    const contract = provider.open(await SubscriptionContract.fromInit());

    // const subsContract = getOpenedContract(provider);
    const depositMsg: {
        $$type: 'Deposit';
        amount: bigint;
    } = {
        $$type: 'Deposit',
        amount: amount,
    };
    const args = {
        value: BigInt(toNano(0.04)) + toNano(amount),
        bounce: false,
    };
    const data = await contract.send(provider.sender(), args, depositMsg);
    console.log('data--->', data);
}

async function withdraw(provider: NetworkProvider, amount: bigint) {
    const contract = provider.open(await SubscriptionContract.fromInit());

    console.log('Withdrawing amount', amount);
    const withdrawMsg: {
        $$type: 'Withdraw';
        amount: bigint;
    } = {
        $$type: 'Withdraw',
        amount: amount,
    };

    const args = {
        value: BigInt(toNano(0.04)) + toNano(amount),
        bounce: false,
    };

    const data = await contract.send(provider.sender(), args, withdrawMsg);
    console.log('withdraw data', data);
}

async function getUserDetails(provider: NetworkProvider) {
    const contract = provider.open(await SubscriptionContract.fromInit());

    // const contract = getOpenedContract(provider);
    await contract.getGetUserBalanceAndExpiryDate(USER_ADDRESS);
}

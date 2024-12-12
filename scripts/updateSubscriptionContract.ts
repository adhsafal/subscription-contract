import { toNano, Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { SubscriptionContract } from '../wrappers/SubscriptionContract';

export async function run(provider: NetworkProvider) {
    const subs = provider.open(
        await SubscriptionContract.fromAddress(Address.parse('EQBSUWkJIYlp_L2N4R22cP6cepDEf0Kz2UvE73utM-C5EQAn')),
    );

    const subsCode = await SubscriptionContract.fromInit();

    await subs.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'UpgradeCode',
            newCode: subsCode.init?.code!!,
        },
    );
}

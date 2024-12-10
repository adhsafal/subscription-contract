import { toNano } from '@ton/core';
import { SubscriptionContract } from '../wrappers/SubscriptionContract';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const subscriptionContract = provider.open(await SubscriptionContract.fromInit());

    await subscriptionContract.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        },
    );

    await provider.waitForDeploy(subscriptionContract.address);

    // run methods on `subscriptionContract`
}

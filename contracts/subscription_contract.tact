import "@stdlib/deploy";


struct UserBalanceAndExpiry{
    balance: Int as uint64;
    expiryDate: Int as uint64;
}

message Withdraw {
    amount: Int as coins;
}

message Deposit {
    amount: Int as coins;
}

message DepositEvent {
    depositAmount: Int as coins;
    depositingAddress: Address;
}

contract SubscriptionContract with Deployable {
    const MIN_TON_FOR_STORAGE: Int = ton("0.01");
    const MIN_SUBSCRIPTION: Int = 30 * 84600; 
    
    owner: Address;
    userBalances: map<Address, Int as uint64>;
    totalBalance: Int as uint64;


    init() {
        self.owner = sender();
        self.userBalances = emptyMap();
        self.totalBalance = 0;

    }

    fun onlyOwner(){
        require(sender() == self.owner,"Only owner is allowed to withdraw.");
    }
      receive(){
    }
 
    receive("withdraw all"){
        self.onlyOwner();
        send(SendParameters{
            to: sender(),
            bounce:true,
            value:0,
            mode: SendRemainingBalance + SendIgnoreErrors,
        })
    }

    receive("withdraw safe"){
        self.onlyOwner();
        send(SendParameters{
            to:sender(),
            bounce:true,
            value: myBalance() - context().value - self.MIN_TON_FOR_STORAGE,
            mode: SendIgnoreErrors + SendRemainingValue
        })
    }

    receive(msg: Withdraw){
        self.onlyOwner();
        let amount: Int = min(msg.amount, myBalance() - context().value - self.MIN_TON_FOR_STORAGE);
        require(amount < 0 ,"Insufficient balance");
        send(SendParameters{
            to:sender(),
            bounce:true,
            value: amount,
            mode: SendIgnoreErrors + SendRemainingValue
        })
    }

    receive(msg: Deposit){
        dump("Token deposit");
        require(context().value >= msg.amount, "Amount too less");
        let userStoredBalance: Int? = self.userBalances.get(sender());
        self.addToUserBalance(msg.amount, sender());


        emit(DepositEvent{
                depositAmount: msg.amount, 
                depositingAddress: sender(), 
            }.toCell());

        let gasToReturn: Int = context().value - msg.amount - self.MIN_TON_FOR_STORAGE;
        if (gasToReturn < 0) {
            send(SendParameters{
                to: sender(),
                value: 0,
                mode: SendIgnoreErrors,
                body: "Deposit completed".asComment()
            });
        } else {
            send(SendParameters{
                to: sender(),
                value: gasToReturn,
                mode: SendIgnoreErrors,
                body: "Deposit completed".asComment()
            });
        }
    }

    get fun balance(): Int{
        return myBalance();
    }

    get fun getUserBalanceAndExpiryDate(userAddress: Address): UserBalanceAndExpiry{
        dump("Get User Balance and Subscription Expiry");

        let userBalance: Int? = self.userBalances.get(userAddress);

        if(userBalance == null){
            userBalance = 0
        }
        let subscriptionExpiry: Int = userBalance!! * self.MIN_SUBSCRIPTION;
        return UserBalanceAndExpiry{balance: userBalance!!, expiryDate: now() + subscriptionExpiry,};  
    }

    fun addToUserBalance(depositedAmount: Int, depositedBy: Address) {
        let userStoredBalance: Int? = self.userBalances.get(depositedBy);

        if (userStoredBalance != null) {
            self.userBalances.set(depositedBy, userStoredBalance!! + depositedAmount);
            self.totalBalance = self.totalBalance + depositedAmount;
        } else {
            self.userBalances.set(depositedBy, depositedAmount);
            self.totalBalance = self.totalBalance + depositedAmount;
        }
    }
}

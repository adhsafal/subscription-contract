import "@stdlib/deploy";

@name(set_code)
native setCode(code: Cell);

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

message UpgradeCode {
    newCode: Cell;
}
contract SubscriptionContract with Deployable {
    const MIN_TON_FOR_STORAGE: Int = ton("0.01");
    const MIN_SUBSCRIPTION: Int = 30 * 84600; 
    
    owner: Address;
    userBalances: map<Address, Int as uint64>;
    totalBalance: Int as uint64;
    userSubscriptionExpiry: map<Address, Int as uint64>;

    init() {
        self.owner = sender();
        self.userBalances = emptyMap();
        self.totalBalance = 0;
        self.userSubscriptionExpiry = emptyMap();
    }

    fun onlyOwner(){
        require(sender() == self.owner, "Only owner is allowed to withdraw.");
    }
      receive(){
    }

    receive(msg: UpgradeCode) {
        self.onlyOwner();
        setCode(msg.newCode);
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
        let userBalance: Int? = self.userBalances.get(sender());
        let userStoredExpiryDate: Int? = self.userSubscriptionExpiry.get(sender());
        
         if (userBalance != null) {
            require(userBalance!! >= msg.amount, "Insufficient balance");
            if (userBalance!! - msg.amount > 0) {
                self.userBalances.set(sender(), userBalance!! - msg.amount);
                self.userSubscriptionExpiry.set(sender(), userStoredExpiryDate!! - msg.amount * self.MIN_SUBSCRIPTION)
            } else {
                self.userBalances.set(sender(), null);
            }
        } else {
            require(false, "Insufficient balance");
        }

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
        self.addToUserBalanceAndExpiryDate(msg.amount, sender());

        let userStoredExpiryDate: Int? = self.userSubscriptionExpiry.get(sender());

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
        let userExpiryDate: Int? = self.userSubscriptionExpiry.get(userAddress);

        if(userBalance == null){
            userBalance = 0;
            userExpiryDate = 0;
        }
        return UserBalanceAndExpiry{balance: userBalance!!, expiryDate: now() + userExpiryDate!!};  
    }

    fun addToUserBalanceAndExpiryDate(depositedAmount: Int, depositedBy: Address) {
        let userStoredBalance: Int? = self.userBalances.get(depositedBy);
        let userStoredExpiryDate: Int? = self.userSubscriptionExpiry.get(depositedBy);

        if (userStoredBalance != null) {
            self.userBalances.set(depositedBy, userStoredBalance!! + depositedAmount);
            self.userSubscriptionExpiry.set(depositedBy, userStoredExpiryDate!! + depositedAmount * self.MIN_SUBSCRIPTION);
            self.totalBalance = self.totalBalance + depositedAmount;
        } else {
            self.userBalances.set(depositedBy, depositedAmount);
            self.userSubscriptionExpiry.set(depositedBy, depositedAmount * self.MIN_SUBSCRIPTION);
            self.totalBalance = self.totalBalance + depositedAmount;
        }
    }
}

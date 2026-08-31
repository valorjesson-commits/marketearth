import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Principal, Types.User>,
  activity : List.List<Types.ActivityEvent>,
  state : Types.State,
) {
  func stakingEnsureUser(caller : Principal) : Types.User {
    switch (users.get(caller)) {
      case (?u) u;
      case null {
        let u : Types.User = { meCoins = 0; weCoins = 0; stakedMeCoins = 0 };
        users.add(caller, u);
        u;
      };
    };
  };

  func stakingRecordActivity(kind : Types.ActivityKind, amount : Nat) {
    activity.add({
      id = state.nextActivityId;
      kind;
      amount;
      createdAt = Time.now();
    });
    state.nextActivityId += 1;
  };

  func stakingSubtract(balance : Nat, amount : Nat, message : Text) : Nat {
    if (amount <= balance) {
      balance - amount;
    } else {
      Runtime.trap(message);
    };
  };

  public shared ({ caller }) func stakeForWeCoins(amount : Nat) : async () {
    ignore AccessControl.getUserRole(accessControlState, caller);
    let user = stakingEnsureUser(caller);
    users.add(caller, {
      meCoins = stakingSubtract(user.meCoins, amount, "Cannot stake more Me-Coins than balance");
      weCoins = user.weCoins + amount;
      stakedMeCoins = user.stakedMeCoins + amount;
    });
    stakingRecordActivity(#staked, amount);
  };

  public shared ({ caller }) func unstakeWeCoins(amount : Nat) : async () {
    ignore AccessControl.getUserRole(accessControlState, caller);
    let user = stakingEnsureUser(caller);
    users.add(caller, {
      meCoins = user.meCoins + amount;
      weCoins = stakingSubtract(user.weCoins, amount, "Cannot unstake more We-Coins than held");
      stakedMeCoins = stakingSubtract(user.stakedMeCoins, amount, "Cannot unstake more We-Coins than held");
    });
    stakingRecordActivity(#unstaked, amount);
  };

  public query ({ caller }) func getStakingInfo() : async Types.StakingInfo {
    ignore AccessControl.getUserRole(accessControlState, caller);
    let user = stakingEnsureUser(caller);
    {
      stakedMeCoins = user.stakedMeCoins;
      weCoins = user.weCoins;
      meCoins = user.meCoins;
    };
  };
};

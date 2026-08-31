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
  workEntries : List.List<Types.WorkEntry>,
  activity : List.List<Types.ActivityEvent>,
  state : Types.State,
) {
  func workEnsureUser(caller : Principal) : Types.User {
    switch (users.get(caller)) {
      case (?u) u;
      case null {
        let u : Types.User = { meCoins = 0; weCoins = 0; stakedMeCoins = 0 };
        users.add(caller, u);
        u;
      };
    };
  };

  func workRecordActivity(kind : Types.ActivityKind, amount : Nat) {
    activity.add({
      id = state.nextActivityId;
      kind;
      amount;
      createdAt = Time.now();
    });
    state.nextActivityId += 1;
  };

  public shared ({ caller }) func performWork(title : Text, description : Text) : async Types.WorkEntry {
    ignore AccessControl.getUserRole(accessControlState, caller);
    if (description.size() < 20) {
      Runtime.trap("Description must be at least 20 characters");
    };
    let user = workEnsureUser(caller);
    let entry : Types.WorkEntry = {
      id = state.nextWorkId;
      title;
      description;
      coinsEarned = 10;
      createdAt = Time.now();
    };
    state.nextWorkId += 1;
    workEntries.add(entry);
    users.add(caller, { user with meCoins = user.meCoins + 10 });
    workRecordActivity(#workEarned, 10);
    entry
  };

  public query ({ caller }) func getWorkHistory() : async [Types.WorkEntry] {
    ignore AccessControl.getUserRole(accessControlState, caller);
    workEntries.toArray();
  };
};

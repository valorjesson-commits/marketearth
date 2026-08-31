import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Principal, Types.User>,
) {
  public query ({ caller }) func getMyProfile() : async ?Types.User {
    ignore AccessControl.getUserRole(accessControlState, caller);
    users.get(caller);
  };
};

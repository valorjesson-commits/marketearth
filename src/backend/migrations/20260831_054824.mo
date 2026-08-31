import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type User = {
    meCoins : Nat;
    weCoins : Nat;
    stakedMeCoins : Nat;
  };

  type WorkEntry = {
    id : Nat;
    title : Text;
    description : Text;
    coinsEarned : Nat;
    createdAt : Int;
  };

  type Proposal = {
    id : Nat;
    title : Text;
    description : Text;
    yesVotes : Nat;
    noVotes : Nat;
    createdAt : Int;
  };

  type Vote = {
    proposalId : Nat;
    voter : Principal;
    inFavor : Bool;
    weight : Nat;
  };

  type ActivityKind = {
    #workEarned;
    #staked;
    #unstaked;
    #voted;
  };

  type ActivityEvent = {
    id : Nat;
    kind : ActivityKind;
    amount : Nat;
    createdAt : Int;
  };

  type State = {
    var nextWorkId : Nat;
    var nextProposalId : Nat;
    var nextActivityId : Nat;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControlState;
    users : Map.Map<Principal, User>;
    workEntries : List.List<WorkEntry>;
    proposals : List.List<Proposal>;
    votes : List.List<Vote>;
    activity : List.List<ActivityEvent>;
    state : State;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      users = Map.empty();
      workEntries = List.empty();
      proposals = List.empty();
      votes = List.empty();
      activity = List.empty();
      state = {
        var nextWorkId = 0;
        var nextProposalId = 0;
        var nextActivityId = 0;
      };
    };
  };
};

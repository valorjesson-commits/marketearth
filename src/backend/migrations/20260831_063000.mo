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

  type ProposalStatus = {
    #active;
    #closed;
  };

  type OldProposal = {
    id : Nat;
    title : Text;
    description : Text;
    yesVotes : Nat;
    noVotes : Nat;
    createdAt : Int;
  };

  type NewProposal = {
    id : Nat;
    title : Text;
    description : Text;
    creator : Principal;
    yesVotes : Nat;
    noVotes : Nat;
    status : ProposalStatus;
    createdAt : Int;
  };

  type OldVote = {
    proposalId : Nat;
    voter : Principal;
    inFavor : Bool;
    weight : Nat;
  };

  type NewVote = {
    proposalId : Nat;
    voter : Principal;
    inFavor : Bool;
    createdAt : Int;
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

  type OldActor = {
    accessControlState : AccessControlState;
    users : Map.Map<Principal, User>;
    workEntries : List.List<WorkEntry>;
    proposals : List.List<OldProposal>;
    votes : List.List<OldVote>;
    activity : List.List<ActivityEvent>;
    state : State;
  };

  type NewActor = {
    accessControlState : AccessControlState;
    users : Map.Map<Principal, User>;
    workEntries : List.List<WorkEntry>;
    proposals : List.List<NewProposal>;
    votes : List.List<NewVote>;
    activity : List.List<ActivityEvent>;
    state : State;
  };

  public func migration(old : OldActor) : NewActor {
    // Old proposals carried no creator and no status. Existing proposals are
    // assigned the anonymous principal as a placeholder creator and default to
    // #active; old votes carried no timestamp, so they get 0.
    let anonymous = Principal.fromText("2vxsx-fae");
    let proposals : List.List<NewProposal> = old.proposals.map(
      func p = {
        id = p.id;
        title = p.title;
        description = p.description;
        creator = anonymous;
        yesVotes = p.yesVotes;
        noVotes = p.noVotes;
        status = #active;
        createdAt = p.createdAt;
      },
    );
    let votes : List.List<NewVote> = old.votes.map(
      func v = {
        proposalId = v.proposalId;
        voter = v.voter;
        inFavor = v.inFavor;
        createdAt = 0;
      },
    );
    {
      accessControlState = old.accessControlState;
      users = old.users;
      workEntries = old.workEntries;
      proposals;
      votes;
      activity = old.activity;
      state = old.state;
    };
  };
};

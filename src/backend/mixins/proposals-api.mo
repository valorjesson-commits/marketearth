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
  proposals : List.List<Types.Proposal>,
  votes : List.List<Types.Vote>,
  activity : List.List<Types.ActivityEvent>,
  state : Types.State,
) {
  func proposalsEnsureUser(caller : Principal) : Types.User {
    switch (users.get(caller)) {
      case (?u) u;
      case null {
        let u : Types.User = { meCoins = 0; weCoins = 0; stakedMeCoins = 0 };
        users.add(caller, u);
        u;
      };
    };
  };

  func proposalsRecordActivity(kind : Types.ActivityKind, amount : Nat) {
    activity.add({
      id = state.nextActivityId;
      kind;
      amount;
      createdAt = Time.now();
    });
    state.nextActivityId += 1;
  };

  public shared ({ caller }) func createProposal(title : Text, description : Text) : async Types.Proposal {
    ignore AccessControl.getUserRole(accessControlState, caller);
    let proposal : Types.Proposal = {
      id = state.nextProposalId;
      title;
      description;
      yesVotes = 0;
      noVotes = 0;
      createdAt = Time.now();
    };
    state.nextProposalId += 1;
    proposals.add(proposal);
    proposal
  };

  public query func getProposals() : async [Types.Proposal] {
    proposals.toArray();
  };

  public query func getProposal(id : Nat) : async ?Types.Proposal {
    proposals.find(func p = p.id == id);
  };

  public shared ({ caller }) func voteOnProposal(proposalId : Nat, inFavor : Bool) : async () {
    ignore AccessControl.getUserRole(accessControlState, caller);
    let user = proposalsEnsureUser(caller);
    if (user.weCoins == 0) {
      Runtime.trap("Voting requires We-Coins");
    };
    if (votes.any(func v = v.proposalId == proposalId and v.voter == caller)) {
      Runtime.trap("Already voted on this proposal");
    };
    let weight = user.weCoins;
    votes.add({
      proposalId;
      voter = caller;
      inFavor;
      weight;
    });
    users.add(caller, { user with weCoins = 0 });
    let snapshot = proposals.toArray();
    proposals.clear();
    for (p in snapshot.values()) {
      if (p.id == proposalId) {
        proposals.add({
          id = p.id;
          title = p.title;
          description = p.description;
          yesVotes = if (inFavor) { p.yesVotes + weight } else { p.yesVotes };
          noVotes = if (inFavor) { p.noVotes } else { p.noVotes + weight };
          createdAt = p.createdAt;
        });
      } else {
        proposals.add(p);
      };
    };
    proposalsRecordActivity(#voted, weight);
  };
};

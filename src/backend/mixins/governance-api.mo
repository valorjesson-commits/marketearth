import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/governance";
import Common "../types/common";
import GovernanceLib "../lib/governance";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Principal, Common.User>,
  proposals : List.List<Types.Proposal>,
  votes : List.List<Types.Vote>,
  activity : List.List<Common.ActivityEvent>,
  state : Common.State,
) {
  func governanceRecordActivity(kind : Common.ActivityKind, amount : Nat) {
    activity.add({
      id = state.nextActivityId;
      kind;
      amount;
      createdAt = Time.now();
    });
    state.nextActivityId += 1;
  };

  // Create a new proposal, defaulting to #active status. The caller must hold
  // at least 1 We-Coin to create a proposal.
  public shared ({ caller }) func createProposal(title : Text, description : Text) : async Result.Result<Types.Proposal, Types.CreateError> {
    ignore AccessControl.getUserRole(accessControlState, caller);
    GovernanceLib.createProposal(proposals, state, users, title, description, caller);
  };

  // List all proposals (publicly readable).
  public query func getProposals() : async [Types.Proposal] {
    GovernanceLib.getProposals(proposals);
  };

  // Fetch a single proposal by id.
  public query func getProposal(id : Nat) : async ?Types.Proposal {
    GovernanceLib.getProposal(proposals, id);
  };

  // Cast a single Yes/No vote on an active proposal, deducting exactly 1
  // We-Coin from the voter's balance. One vote per proposal per voter.
  public shared ({ caller }) func voteOnProposal(proposalId : Nat, inFavor : Bool) : async Result.Result<(), Types.VoteError> {
    ignore AccessControl.getUserRole(accessControlState, caller);
    switch (GovernanceLib.voteOnProposal(proposals, votes, users, proposalId, caller, inFavor)) {
      case (#ok _) {
        governanceRecordActivity(#voted, 1);
        #ok(());
      };
      case (#err e) { #err(e) };
    };
  };

  // Return the caller's already-cast votes as (proposalId, inFavor) pairs,
  // filtered to the caller's principal. Supports the "a voter who already voted
  // sees their cast vote and cannot vote again" UX on page load.
  public query ({ caller }) func getMyVotes() : async [(Nat, Bool)] {
    ignore AccessControl.getUserRole(accessControlState, caller);
    GovernanceLib.getMyVotes(votes, caller);
  };

  // Close a proposal, locking further voting. Only the creator may close it.
  public shared ({ caller }) func closeProposal(proposalId : Nat) : async Result.Result<(), Types.CloseError> {
    ignore AccessControl.getUserRole(accessControlState, caller);
    GovernanceLib.closeProposal(proposals, proposalId, caller);
  };
};

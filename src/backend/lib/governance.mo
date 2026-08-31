import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Time "mo:core/Time";
import Types "../types/governance";
import Common "../types/common";

module {
  // Create a new proposal, defaulting to #active status. The caller must hold
  // at least 1 We-Coin to create a proposal.
  public func createProposal(
    proposals : List.List<Types.Proposal>,
    state : Common.State,
    users : Map.Map<Principal, Common.User>,
    title : Text,
    description : Text,
    creator : Principal,
  ) : Result.Result<Types.Proposal, Types.CreateError> {
    switch (users.get(creator)) {
      case null { #err(#notEnoughWeCoins) };
      case (?user) {
        if (user.weCoins < 1) {
          #err(#notEnoughWeCoins);
        } else {
          let proposal : Types.Proposal = {
            id = state.nextProposalId;
            title;
            description;
            creator;
            yesVotes = 0;
            noVotes = 0;
            status = #active;
            createdAt = Time.now();
          };
          state.nextProposalId += 1;
          proposals.add(proposal);
          #ok(proposal);
        };
      };
    };
  };

  // List all proposals (publicly readable).
  public func getProposals(proposals : List.List<Types.Proposal>) : [Types.Proposal] {
    proposals.toArray();
  };

  // Fetch a single proposal by id.
  public func getProposal(proposals : List.List<Types.Proposal>, id : Nat) : ?Types.Proposal {
    proposals.find(func p = p.id == id);
  };

  // Cast a single Yes/No vote on an active proposal, deducting exactly 1
  // We-Coin from the voter's balance. One vote per proposal per voter.
  public func voteOnProposal(
    proposals : List.List<Types.Proposal>,
    votes : List.List<Types.Vote>,
    users : Map.Map<Principal, Common.User>,
    proposalId : Nat,
    voter : Principal,
    inFavor : Bool,
  ) : Result.Result<(), Types.VoteError> {
    switch (proposals.find(func p = p.id == proposalId)) {
      case null { #err(#proposalNotFound) };
      case (?proposal) {
        if (proposal.status == #closed) {
          #err(#proposalClosed);
        } else if (votes.any(func v = v.proposalId == proposalId and v.voter == voter)) {
          #err(#alreadyVoted);
        } else {
          switch (users.get(voter)) {
            case null { #err(#notEnoughWeCoins) };
            case (?user) {
              if (user.weCoins >= 1) {
                users.add(voter, { user with weCoins = user.weCoins - 1 });
                votes.add({
                  proposalId;
                  voter;
                  inFavor;
                  createdAt = Time.now();
                });
                let updated : Types.Proposal = {
                  id = proposal.id;
                  title = proposal.title;
                  description = proposal.description;
                  creator = proposal.creator;
                  yesVotes = if (inFavor) { proposal.yesVotes + 1 } else { proposal.yesVotes };
                  noVotes = if (inFavor) { proposal.noVotes } else { proposal.noVotes + 1 };
                  status = proposal.status;
                  createdAt = proposal.createdAt;
                };
                let snapshot = proposals.toArray();
                proposals.clear();
                for (p in snapshot.values()) {
                  if (p.id == proposalId) { proposals.add(updated) } else { proposals.add(p) };
                };
                #ok(());
              } else {
                #err(#notEnoughWeCoins);
              };
            };
          };
        };
      };
    };
  };

  // Return the caller's already-cast votes as (proposalId, inFavor) pairs,
  // filtered to the given voter's principal. Supports the "a voter who already
  // voted sees their cast vote and cannot vote again" UX on page load.
  public func getMyVotes(votes : List.List<Types.Vote>, voter : Principal) : [(Nat, Bool)] {
    votes.toArray()
      .filter(func v = v.voter == voter)
      .map(func v = (v.proposalId, v.inFavor));
  };

  // Close a proposal, locking further voting. Only the creator may close it.
  public func closeProposal(
    proposals : List.List<Types.Proposal>,
    proposalId : Nat,
    caller : Principal,
  ) : Result.Result<(), Types.CloseError> {
    switch (proposals.find(func p = p.id == proposalId)) {
      case null { #err(#proposalNotFound) };
      case (?proposal) {
        if (proposal.creator != caller) {
          #err(#notCreator);
        } else if (proposal.status == #closed) {
          #err(#alreadyClosed);
        } else {
          let updated : Types.Proposal = {
            id = proposal.id;
            title = proposal.title;
            description = proposal.description;
            creator = proposal.creator;
            yesVotes = proposal.yesVotes;
            noVotes = proposal.noVotes;
            status = #closed;
            createdAt = proposal.createdAt;
          };
          let snapshot = proposals.toArray();
          proposals.clear();
          for (p in snapshot.values()) {
            if (p.id == proposalId) { proposals.add(updated) } else { proposals.add(p) };
          };
          #ok(());
        };
      };
    };
  };
};

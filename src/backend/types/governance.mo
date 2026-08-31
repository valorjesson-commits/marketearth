module {
  // Lifecycle status of a governance proposal. Proposals default to #active on
  // creation; a creator may close their own proposal, which locks further voting.
  public type ProposalStatus = { #active; #closed };

  // A governance proposal with live yes/no tallies and an Active/Closed status.
  // creator: the principal who created the proposal and may close it.
  public type Proposal = {
    id : Nat;
    title : Text;
    description : Text;
    creator : Principal;
    yesVotes : Nat;
    noVotes : Nat;
    status : ProposalStatus;
    createdAt : Int;
  };

  // A single user's vote on a proposal. Voting deducts exactly 1 We-Coin from
  // the voter's balance and casts a single Yes/No vote; one vote per proposal
  // per voter is enforced.
  public type Vote = {
    proposalId : Nat;
    voter : Principal;
    inFavor : Bool;
    createdAt : Int;
  };

  // Errors returned when creating a proposal. Creating a proposal requires the
  // caller to hold at least 1 We-Coin.
  public type CreateError = {
    #notEnoughWeCoins;
  };

  // Errors returned when casting a vote.
  public type VoteError = {
    #notEnoughWeCoins;
    #alreadyVoted;
    #proposalNotFound;
    #proposalClosed;
  };

  // Errors returned when closing a proposal.
  public type CloseError = {
    #proposalNotFound;
    #notCreator;
    #alreadyClosed;
  };
};

module {
  public type UserId = Principal;
  public type Timestamp = Int;

  // A user's dual-token economy state.
  // meCoins: earned by performing validated work.
  // weCoins: governance power received by staking Me-Coins.
  // stakedMeCoins: Me-Coins currently locked in a stake.
  public type User = {
    meCoins : Nat;
    weCoins : Nat;
    stakedMeCoins : Nat;
  };

  // A completed task submitted by a user; validated entries mint Me-Coins.
  public type WorkEntry = {
    id : Nat;
    title : Text;
    description : Text;
    coinsEarned : Nat;
    createdAt : Timestamp;
  };

  // Lifecycle status of a governance proposal. Proposals default to #active on
  // creation; a creator may close their own proposal, which locks further voting.
  public type ProposalStatus = { #active; #closed };

  // A governance proposal with live yes/no tallies and an Active/Closed status.
  // creator: the principal who created the proposal and may close it.
  public type Proposal = {
    id : Nat;
    title : Text;
    description : Text;
    creator : UserId;
    yesVotes : Nat;
    noVotes : Nat;
    status : ProposalStatus;
    createdAt : Timestamp;
  };

  // A single user's vote on a proposal. Voting deducts exactly 1 We-Coin from
  // the voter's balance and casts a single Yes/No vote; one vote per proposal
  // per voter is enforced.
  public type Vote = {
    proposalId : Nat;
    voter : UserId;
    inFavor : Bool;
    createdAt : Timestamp;
  };

  public type ActivityKind = {
    #workEarned;
    #staked;
    #unstaked;
    #voted;
  };

  // A recent activity feed entry covering work earned, stakes, and votes.
  public type ActivityEvent = {
    id : Nat;
    kind : ActivityKind;
    amount : Nat;
    createdAt : Timestamp;
  };

  // Snapshot of the staking view: current stake, conversion, and balances.
  public type StakingInfo = {
    stakedMeCoins : Nat;
    weCoins : Nat;
    meCoins : Nat;
  };

  // Shared mutable counters used across the economy mixins.
  public type State = {
    var nextWorkId : Nat;
    var nextProposalId : Nat;
    var nextActivityId : Nat;
  };
};

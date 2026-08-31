import type {
  Backend,
  Proposal,
  StakingInfo,
  User,
  WorkEntry,
} from "@/backend";
import { CreateError, ProposalStatus, VoteError } from "@/backend";
import { Principal } from "@icp-sdk/core/principal";

/**
 * A typed in-memory fake of the backend actor, keyed by the same public methods
 * the app's `api` facade calls. Tests mutate `state` to control what the actor
 * returns and to observe what was called.
 *
 * The fake models the accepted governance contract: creating a proposal
 * requires at least 1 We-Coin, voting deducts exactly 1 We-Coin and records a
 * single Yes/No vote per proposal, and the creator may close their own
 * proposal to lock further voting.
 */
export type MockActorState = {
  profile: User | null;
  workHistory: WorkEntry[];
  stakingInfo: StakingInfo;
  proposals: Proposal[];
  myVotes: Array<[bigint, boolean]>;
  nextWorkId: bigint;
  nextProposalId: bigint;
};

/** The principal the signed-in mock identity reports. */
export const MOCK_PRINCIPAL = Principal.fromText("aaaaa-aa");

export function createMockActorState(): MockActorState {
  return {
    profile: null,
    workHistory: [],
    stakingInfo: { meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n },
    proposals: [],
    myVotes: [],
    nextWorkId: 1n,
    nextProposalId: 1n,
  };
}

export function createMockActor(state: MockActorState): Backend {
  return {
    getMyProfile: async () => state.profile,
    getWorkHistory: async () => state.workHistory,
    getStakingInfo: async () => state.stakingInfo,
    getProposals: async () => state.proposals,
    getProposal: async (id: bigint) =>
      state.proposals.find((p) => p.id === id) ?? null,
    getMyVotes: async () => state.myVotes,
    performWork: async (title: string, description: string) => {
      const entry: WorkEntry = {
        id: state.nextWorkId,
        title,
        description,
        coinsEarned: 10n,
        createdAt: 1_700_000_000_000_000_000n,
      };
      state.nextWorkId += 1n;
      state.workHistory = [...state.workHistory, entry];
      state.profile = {
        ...(state.profile ?? { meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n }),
        meCoins: (state.profile?.meCoins ?? 0n) + 10n,
      };
      return entry;
    },
    stakeForWeCoins: async (amount: bigint) => {
      state.stakingInfo = {
        meCoins: state.stakingInfo.meCoins - amount,
        weCoins: state.stakingInfo.weCoins + amount,
        stakedMeCoins: state.stakingInfo.stakedMeCoins + amount,
      };
      state.profile = {
        ...(state.profile ?? { meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n }),
        meCoins: state.stakingInfo.meCoins,
        weCoins: state.stakingInfo.weCoins,
        stakedMeCoins: state.stakingInfo.stakedMeCoins,
      };
    },
    unstakeWeCoins: async (amount: bigint) => {
      state.stakingInfo = {
        meCoins: state.stakingInfo.meCoins + amount,
        weCoins: state.stakingInfo.weCoins - amount,
        stakedMeCoins: state.stakingInfo.stakedMeCoins - amount,
      };
      state.profile = {
        ...(state.profile ?? { meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n }),
        meCoins: state.stakingInfo.meCoins,
        weCoins: state.stakingInfo.weCoins,
        stakedMeCoins: state.stakingInfo.stakedMeCoins,
      };
    },
    createProposal: async (title: string, description: string) => {
      const weCoins = state.profile?.weCoins ?? 0n;
      if (weCoins < 1n) {
        return { __kind__: "err", err: CreateError.notEnoughWeCoins };
      }
      const proposal: Proposal = {
        id: state.nextProposalId,
        title,
        description,
        creator: MOCK_PRINCIPAL,
        yesVotes: 0n,
        noVotes: 0n,
        status: ProposalStatus.active,
        createdAt: 1_700_000_000_000_000_000n,
      };
      state.nextProposalId += 1n;
      state.proposals = [...state.proposals, proposal];
      return { __kind__: "ok", ok: proposal };
    },
    voteOnProposal: async (proposalId: bigint, inFavor: boolean) => {
      const proposal = state.proposals.find((p) => p.id === proposalId);
      if (!proposal) {
        return { __kind__: "err", err: VoteError.proposalNotFound };
      }
      if (proposal.status === ProposalStatus.closed) {
        return { __kind__: "err", err: VoteError.proposalClosed };
      }
      if (state.myVotes.some(([id]) => id === proposalId)) {
        return { __kind__: "err", err: VoteError.alreadyVoted };
      }
      const weCoins = state.profile?.weCoins ?? 0n;
      if (weCoins < 1n) {
        return { __kind__: "err", err: VoteError.notEnoughWeCoins };
      }
      state.profile = {
        ...(state.profile ?? { meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n }),
        weCoins: weCoins - 1n,
      };
      state.myVotes = [...state.myVotes, [proposalId, inFavor]];
      state.proposals = state.proposals.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              yesVotes: inFavor ? p.yesVotes + 1n : p.yesVotes,
              noVotes: inFavor ? p.noVotes : p.noVotes + 1n,
            }
          : p,
      );
      return { __kind__: "ok", ok: null };
    },
    closeProposal: async (proposalId: bigint) => {
      const proposal = state.proposals.find((p) => p.id === proposalId);
      if (!proposal) {
        return { __kind__: "err", err: "proposalNotFound" };
      }
      if (proposal.creator.toText() !== MOCK_PRINCIPAL.toText()) {
        return { __kind__: "err", err: "notCreator" };
      }
      if (proposal.status === ProposalStatus.closed) {
        return { __kind__: "err", err: "alreadyClosed" };
      }
      state.proposals = state.proposals.map((p) =>
        p.id === proposalId ? { ...p, status: ProposalStatus.closed } : p,
      );
      return { __kind__: "ok", ok: null };
    },
  } as Backend;
}

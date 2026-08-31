import "@testing-library/jest-dom/vitest";
import type {
  Backend,
  Proposal,
  StakingInfo,
  User,
  WorkEntry,
} from "@/backend";
import { CreateError, ProposalStatus, VoteError } from "@/backend";
import { Principal } from "@icp-sdk/core/principal";
import { cleanup, configure } from "@testing-library/react";
import * as React from "react";
import { afterEach, vi } from "vitest";

// Generated components use `data-ocid` for test hooks; make it the test id
// attribute so `getByTestId` works alongside semantic queries.
configure({ testIdAttribute: "data-ocid" });

// Vitest globals are not enabled, so @testing-library/react cannot auto-cleanup
// between tests; without this, renders accumulate across tests in a file.
afterEach(() => cleanup());

// The pages render `<Link>` from @tanstack/react-router, which requires a
// RouterProvider. For component tests we render pages in isolation, so mock
// `Link` as a plain anchor carrying the `to` path as its href.
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({
      to,
      children,
      ...props
    }: { to: string; children?: React.ReactNode }) =>
      React.createElement("a", { href: to, ...props }, children),
  };
});

/** The principal the signed-in mock identity reports. */
export const MOCK_PRINCIPAL = Principal.fromText("aaaaa-aa");

/**
 * Shared mutable identity + in-memory actor for the mocked
 * `@caffeineai/core-infrastructure` hooks. `vi.hoisted` keeps the factory
 * self-contained (it runs before imports are available), and the mutable
 * objects let each test set authentication state and actor data.
 *
 * The `vi.mock` lives in the setup file so it is hoisted and applied before
 * any test module imports the pages (which import the real hooks).
 */
const mock = vi.hoisted(() => {
  const identity = {
    isAuthenticated: false,
    isInitializing: false,
    isLoggingIn: false,
    login: vi.fn(),
    clear: vi.fn(),
    getPrincipal: () => MOCK_PRINCIPAL,
  };

  const state = {
    profile: null as User | null,
    workHistory: [] as WorkEntry[],
    stakingInfo: { meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n } as StakingInfo,
    proposals: [] as Proposal[],
    myVotes: [] as Array<[bigint, boolean]>,
    nextWorkId: 1n,
    nextProposalId: 1n,
  };

  const actor = {
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

  return { identity, state, actor };
});

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => mock.identity,
  useActor: () => ({ actor: mock.actor, isFetching: false }),
}));

/** Reset the shared mock state before each test. */
export function resetMocks() {
  mock.identity.isAuthenticated = false;
  mock.identity.isInitializing = false;
  mock.identity.isLoggingIn = false;
  mock.identity.login.mockClear();
  mock.identity.clear.mockClear();
  mock.state.profile = null;
  mock.state.workHistory = [];
  mock.state.stakingInfo = { meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n };
  mock.state.proposals = [];
  mock.state.myVotes = [];
  mock.state.nextWorkId = 1n;
  mock.state.nextProposalId = 1n;
}

export function signIn() {
  mock.identity.isAuthenticated = true;
}

export function setProfile(profile: User) {
  mock.state.profile = profile;
}

export function setStakingInfo(info: StakingInfo) {
  mock.state.stakingInfo = info;
}

export function setWorkHistory(entries: WorkEntry[]) {
  mock.state.workHistory = entries;
}

export function setProposals(proposals: Proposal[]) {
  mock.state.proposals = proposals;
}

export function setMyVotes(votes: Array<[bigint, boolean]>) {
  mock.state.myVotes = votes;
}

export const mockActor = mock.actor;
export const mockIdentity = mock.identity;
export const mockState = mock.state;

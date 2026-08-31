/**
 * Backend API helper — a typed facade over the generated backend actor.
 *
 * Every backend operation flows through this module so page tasks can call
 * the canister through a single, well-typed surface instead of reaching into
 * the generated bindings directly. The actor instance is provided by the
 * `useActor(createActor)` hook (see hooks/useQueries.ts).
 */
import type {
  Backend,
  CreateError,
  Proposal,
  Result,
  Result_1,
  Result_2,
  StakingInfo,
  User,
  WorkEntry,
} from "@/backend";

export type {
  CreateError,
  Proposal,
  Result,
  Result_1,
  Result_2,
  StakingInfo,
  User,
  WorkEntry,
};

export const api = {
  getMyProfile(actor: Backend): Promise<User | null> {
    return actor.getMyProfile();
  },
  getWorkHistory(actor: Backend): Promise<Array<WorkEntry>> {
    return actor.getWorkHistory();
  },
  getStakingInfo(actor: Backend): Promise<StakingInfo> {
    return actor.getStakingInfo();
  },
  getProposals(actor: Backend): Promise<Array<Proposal>> {
    return actor.getProposals();
  },
  getProposal(actor: Backend, id: bigint): Promise<Proposal | null> {
    return actor.getProposal(id);
  },
  getMyVotes(actor: Backend): Promise<Array<[bigint, boolean]>> {
    return actor.getMyVotes();
  },
  performWork(
    actor: Backend,
    title: string,
    description: string,
  ): Promise<WorkEntry> {
    return actor.performWork(title, description);
  },
  stakeForWeCoins(actor: Backend, amount: bigint): Promise<void> {
    return actor.stakeForWeCoins(amount);
  },
  unstakeWeCoins(actor: Backend, amount: bigint): Promise<void> {
    return actor.unstakeWeCoins(amount);
  },
  createProposal(
    actor: Backend,
    title: string,
    description: string,
  ): Promise<Result_1> {
    return actor.createProposal(title, description);
  },
  voteOnProposal(
    actor: Backend,
    proposalId: bigint,
    inFavor: boolean,
  ): Promise<Result> {
    return actor.voteOnProposal(proposalId, inFavor);
  },
  closeProposal(actor: Backend, proposalId: bigint): Promise<Result_2> {
    return actor.closeProposal(proposalId);
  },
};

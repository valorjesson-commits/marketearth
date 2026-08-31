import { createActor } from "@/backend";
import { api } from "@/lib/api";
import { useActor } from "@caffeineai/core-infrastructure";
/**
 * React Query hooks for every MarketEarth backend operation.
 * All reads go through useActor(createActor); writes invalidate the
 * affected query keys on success.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useMyProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return api.getMyProfile(actor);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWorkHistory() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["workHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return api.getWorkHistory(actor);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStakingInfo() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["stakingInfo"],
    queryFn: async () => {
      if (!actor) return null;
      return api.getStakingInfo(actor);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProposals() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["proposals"],
    queryFn: async () => {
      if (!actor) return [];
      return api.getProposals(actor);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProposal(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["proposal", id?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return api.getProposal(actor, id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useMyVotes() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["myVotes"],
    queryFn: async () => {
      if (!actor) return [];
      return api.getMyVotes(actor);
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePerformWork() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
    }: { title: string; description: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return api.performWork(actor, title, description);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workHistory"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useStakeForWeCoins() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return api.stakeForWeCoins(actor, amount);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stakingInfo"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUnstakeWeCoins() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return api.unstakeWeCoins(actor, amount);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stakingInfo"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useCreateProposal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
    }: { title: string; description: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return api.createProposal(actor, title, description);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}

export function useVoteOnProposal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      proposalId,
      inFavor,
    }: { proposalId: bigint; inFavor: boolean }) => {
      if (!actor) throw new Error("Backend is not ready");
      return api.voteOnProposal(actor, proposalId, inFavor);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["proposals"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useCloseProposal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (proposalId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return api.closeProposal(actor, proposalId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}

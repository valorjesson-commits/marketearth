import { ProposalStatus } from "@/backend";
import { Proposals } from "@/pages/Proposals";
import { Principal } from "@icp-sdk/core/principal";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  mockIdentity,
  mockState,
  renderWithProviders,
  resetMocks,
  setProfile,
  setProposals,
  signIn,
} from "./testUtils";

// The signed-in mock identity reports this principal; the creator field must
// match it for the "creator can close" path to render. Defined locally (rather
// than re-exported from setup) to avoid a circular-import TDZ where the value
// is still undefined when this module's `sampleProposal` is evaluated.
const CREATOR = Principal.fromText("aaaaa-aa");

const sampleProposal = {
  id: 1n,
  title: "Fund the garden expansion",
  description: "A proposal description that is long enough to be meaningful.",
  creator: CREATOR,
  yesVotes: 0n,
  noVotes: 0n,
  status: ProposalStatus.active,
  createdAt: 1_700_000_000_000_000_000n,
};

describe("Proposals", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("prompts an unauthenticated user to sign in", () => {
    renderWithProviders(<Proposals />);
    expect(
      screen.getByRole("heading", { name: /sign in to vote on proposals/i }),
    ).toBeInTheDocument();
  });

  it("shows the empty proposals state for a signed-in user", async () => {
    signIn();
    setProfile({ meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n });
    renderWithProviders(<Proposals />);
    expect(await screen.findByText(/no proposals yet/i)).toBeInTheDocument();
  });

  it("lists proposals and shows their yes/no tallies in the detail view", async () => {
    const user = userEvent.setup();
    signIn();
    setProfile({ meCoins: 0n, weCoins: 100n, stakedMeCoins: 0n });
    setProposals([{ ...sampleProposal, yesVotes: 2n, noVotes: 1n }]);
    renderWithProviders(<Proposals />);

    expect(
      await screen.findByText("Fund the garden expansion"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /fund the garden expansion/i }),
    );

    // The VoteBar renders in both the inline detail and the Proposal Detail
    // panel, so the raw tallies and the percentage line appear twice each.
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("66% in favor · 3 total votes").length,
    ).toBeGreaterThan(0);
  });

  it("disables voting when the user holds no We-Coins", async () => {
    const user = userEvent.setup();
    signIn();
    setProfile({ meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n });
    setProposals([sampleProposal]);
    renderWithProviders(<Proposals />);

    await screen.findByText("Fund the garden expansion");
    await user.click(
      screen.getByRole("button", { name: /fund the garden expansion/i }),
    );

    expect(screen.getByRole("button", { name: /vote yes/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /vote no/i })).toBeDisabled();
    expect(screen.getByText(/you need we-coins to vote/i)).toBeInTheDocument();
  });

  it("surfaces the notEnoughWeCoins error when a vote is attempted without We-Coins", async () => {
    const user = userEvent.setup();
    signIn();
    setProfile({ meCoins: 0n, weCoins: 100n, stakedMeCoins: 0n });
    setProposals([sampleProposal]);
    renderWithProviders(<Proposals />);

    await screen.findByText("Fund the garden expansion");
    await user.click(
      screen.getByRole("button", { name: /fund the garden expansion/i }),
    );

    // Simulate a stale profile: the UI still believes the user holds We-Coins
    // (vote buttons enabled) while the backend has already spent them, so the
    // vote attempt returns notEnoughWeCoins and must surface a clear message.
    mockState.profile = { meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n };

    await user.click(screen.getByRole("button", { name: /vote yes/i }));

    expect(
      await screen.findByText(/you need at least 1 we-coin to vote/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Vote not recorded")).toBeInTheDocument();
  });

  it("creates a proposal and adds it to the list", async () => {
    const user = userEvent.setup();
    signIn();
    setProfile({ meCoins: 0n, weCoins: 100n, stakedMeCoins: 0n });
    renderWithProviders(<Proposals />);

    const createButton = screen.getByRole("button", {
      name: /create proposal/i,
    });
    expect(createButton).toBeDisabled();

    await user.type(
      screen.getByLabelText(/^title$/i),
      "Fund the garden expansion",
    );
    await user.type(
      screen.getByLabelText(/^description$/i),
      "A proposal description that is long enough to be meaningful.",
    );
    expect(createButton).toBeEnabled();

    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText("Fund the garden expansion")).toBeInTheDocument();
    });
    expect(mockState.proposals).toHaveLength(1);
    expect(mockState.proposals[0].title).toBe("Fund the garden expansion");
  });

  it("shows the no-votes-cast state for a proposal with zero tallies", async () => {
    const user = userEvent.setup();
    signIn();
    setProfile({ meCoins: 0n, weCoins: 100n, stakedMeCoins: 0n });
    setProposals([sampleProposal]);
    renderWithProviders(<Proposals />);

    await screen.findByText("Fund the garden expansion");
    await user.click(
      screen.getByRole("button", { name: /fund the garden expansion/i }),
    );

    expect(screen.getAllByText("No votes cast yet").length).toBeGreaterThan(0);
  });

  it("votes no on a proposal and records the no tally", async () => {
    const user = userEvent.setup();
    signIn();
    setProfile({ meCoins: 0n, weCoins: 100n, stakedMeCoins: 0n });
    setProposals([sampleProposal]);
    renderWithProviders(<Proposals />);

    await screen.findByText("Fund the garden expansion");
    await user.click(
      screen.getByRole("button", { name: /fund the garden expansion/i }),
    );

    await user.click(screen.getByRole("button", { name: /vote no/i }));

    await waitFor(() => {
      expect(screen.getByText(/you've cast your vote/i)).toBeInTheDocument();
    });
    expect(mockState.proposals[0].noVotes).toBe(1n);
    expect(mockState.proposals[0].yesVotes).toBe(0n);
  });

  it("votes yes on a proposal and records one vote per user", async () => {
    const user = userEvent.setup();
    signIn();
    setProfile({ meCoins: 0n, weCoins: 100n, stakedMeCoins: 0n });
    setProposals([sampleProposal]);
    renderWithProviders(<Proposals />);

    await screen.findByText("Fund the garden expansion");
    await user.click(
      screen.getByRole("button", { name: /fund the garden expansion/i }),
    );

    await user.click(screen.getByRole("button", { name: /vote yes/i }));

    await waitFor(() => {
      expect(screen.getByText(/you've cast your vote/i)).toBeInTheDocument();
    });
    expect(screen.getByText("Voted")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /vote yes/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /vote no/i })).toBeDisabled();
    expect(mockState.proposals[0].yesVotes).toBe(1n);
    // Voting deducts exactly 1 We-Coin from the voter's balance.
    expect(mockState.profile?.weCoins).toBe(99n);
  });

  it("deducts exactly 1 We-Coin per vote and records the vote", async () => {
    const user = userEvent.setup();
    signIn();
    setProfile({ meCoins: 0n, weCoins: 5n, stakedMeCoins: 0n });
    setProposals([sampleProposal]);
    renderWithProviders(<Proposals />);

    await screen.findByText("Fund the garden expansion");
    await user.click(
      screen.getByRole("button", { name: /fund the garden expansion/i }),
    );

    await user.click(screen.getByRole("button", { name: /vote yes/i }));

    await waitFor(() => {
      expect(screen.getByText(/you've cast your vote/i)).toBeInTheDocument();
    });
    // Exactly 1 We-Coin is spent, not the whole balance.
    expect(mockState.profile?.weCoins).toBe(4n);
    expect(mockState.myVotes).toEqual([[1n, true]]);
  });

  it("shows a closed proposal's status and blocks voting on it", async () => {
    const user = userEvent.setup();
    signIn();
    setProfile({ meCoins: 0n, weCoins: 100n, stakedMeCoins: 0n });
    setProposals([
      {
        ...sampleProposal,
        status: ProposalStatus.closed,
        yesVotes: 3n,
        noVotes: 1n,
      },
    ]);
    renderWithProviders(<Proposals />);

    await screen.findByText("Fund the garden expansion");
    expect(screen.getByText("Closed")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /fund the garden expansion/i }),
    );

    // Closed proposals show results without vote buttons.
    expect(
      screen.queryByRole("button", { name: /vote yes/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /vote no/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/this proposal is closed\. voting is locked/i),
    ).toBeInTheDocument();
    // Results are still shown.
    expect(
      screen.getAllByText("75% in favor · 4 total votes").length,
    ).toBeGreaterThan(0);
  });

  it("lets the creator close their own proposal, locking further voting", async () => {
    const user = userEvent.setup();
    signIn();
    setProfile({ meCoins: 0n, weCoins: 100n, stakedMeCoins: 0n });
    setProposals([sampleProposal]);
    renderWithProviders(<Proposals />);

    await screen.findByText("Fund the garden expansion");
    await user.click(
      screen.getByRole("button", { name: /fund the garden expansion/i }),
    );

    await user.click(screen.getByRole("button", { name: /close proposal/i }));

    await waitFor(() => {
      expect(mockState.proposals[0].status).toBe(ProposalStatus.closed);
    });
    // The closed proposal no longer offers vote buttons.
    expect(
      screen.queryByRole("button", { name: /vote yes/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/this proposal is closed\. voting is locked/i),
    ).toBeInTheDocument();
  });
});

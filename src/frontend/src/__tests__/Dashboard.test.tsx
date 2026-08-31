import { ProposalStatus } from "@/backend";
import { Dashboard } from "@/pages/Dashboard";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockIdentity,
  renderWithProviders,
  resetMocks,
  setProfile,
  setProposals,
  setStakingInfo,
  setWorkHistory,
  signIn,
} from "./testUtils";

describe("Dashboard", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("prompts an unauthenticated user to sign in", () => {
    renderWithProviders(<Dashboard />);
    expect(
      screen.getByRole("heading", { name: /sign in to see your economy/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with internet identity/i }),
    ).toBeInTheDocument();
  });

  it("calls login when the sign-in button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);
    await user.click(
      screen.getByRole("button", { name: /sign in with internet identity/i }),
    );
    expect(mockIdentity.login).toHaveBeenCalled();
  });

  it("shows Me-Coins, We-Coins, and staked balances for a signed-in user", async () => {
    signIn();
    setProfile({ meCoins: 1250n, weCoins: 300n, stakedMeCoins: 500n });
    setStakingInfo({ meCoins: 1250n, weCoins: 300n, stakedMeCoins: 500n });

    renderWithProviders(<Dashboard />);

    // Wait for the balances to load before asserting the balance cards render.
    expect(await screen.findByText("12.50")).toBeInTheDocument();
    expect(screen.getByText("Me-Coins")).toBeInTheDocument();
    expect(screen.getByText("We-Coins")).toBeInTheDocument();
    expect(screen.getByText("Staked Me-Coins")).toBeInTheDocument();
    expect(screen.getByText("3.00")).toBeInTheDocument();
    // "5.00" appears in the Staked Me-Coins balance card and in the activity
    // feed's "Active stake" row, so match all occurrences.
    expect(screen.getAllByText("5.00").length).toBeGreaterThan(0);
  });

  it("renders the recent activity feed from work and proposals", async () => {
    signIn();
    setProfile({ meCoins: 10n, weCoins: 0n, stakedMeCoins: 0n });
    setStakingInfo({ meCoins: 10n, weCoins: 0n, stakedMeCoins: 0n });
    setWorkHistory([
      {
        id: 1n,
        title: "Built the garden fence",
        description: "A completed task",
        coinsEarned: 10n,
        createdAt: 1_700_000_000_000_000_000n,
      },
    ]);
    setProposals([
      {
        id: 1n,
        title: "Fund the garden",
        description: "A proposal",
        creator: mockIdentity.getPrincipal(),
        yesVotes: 2n,
        noVotes: 1n,
        status: ProposalStatus.active,
        createdAt: 1_700_000_000_000_000_000n,
      },
    ]);

    renderWithProviders(<Dashboard />);

    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(
      await screen.findByText("Built the garden fence"),
    ).toBeInTheDocument();
    expect(screen.getByText("Fund the garden")).toBeInTheDocument();
  });

  it("shows the active stake row in the activity feed when Me-Coins are staked", async () => {
    signIn();
    setProfile({ meCoins: 500n, weCoins: 500n, stakedMeCoins: 500n });
    setStakingInfo({ meCoins: 500n, weCoins: 500n, stakedMeCoins: 500n });

    renderWithProviders(<Dashboard />);

    expect(await screen.findByText("Active stake")).toBeInTheDocument();
    expect(
      screen.getByText("Me-Coins locked for governance"),
    ).toBeInTheDocument();
  });

  it("shows the empty activity state when there is no activity", async () => {
    signIn();
    setProfile({ meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n });
    setStakingInfo({ meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n });

    renderWithProviders(<Dashboard />);

    expect(
      await screen.findByText(/no activity yet\. log work or vote/i),
    ).toBeInTheDocument();
  });

  it("routes to work, staking, and proposals via quick actions", async () => {
    signIn();
    setProfile({ meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n });
    setStakingInfo({ meCoins: 0n, weCoins: 0n, stakedMeCoins: 0n });

    renderWithProviders(<Dashboard />);

    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /log completed work/i }),
    ).toHaveAttribute("href", "/work");
    expect(
      screen.getByRole("link", { name: /stake me-coins/i }),
    ).toHaveAttribute("href", "/staking");
    expect(
      screen.getByRole("link", { name: /view proposals/i }),
    ).toHaveAttribute("href", "/proposals");
  });
});

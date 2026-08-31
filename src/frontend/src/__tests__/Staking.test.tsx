import { Staking } from "@/pages/Staking";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  mockState,
  renderWithProviders,
  resetMocks,
  setStakingInfo,
  signIn,
} from "./testUtils";

describe("Staking", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("prompts an unauthenticated user to sign in", () => {
    renderWithProviders(<Staking />);
    expect(
      screen.getByRole("heading", { name: /sign in to manage your stake/i }),
    ).toBeInTheDocument();
  });

  it("shows available, staked, and held balances for a signed-in user", async () => {
    signIn();
    setStakingInfo({ meCoins: 1000n, weCoins: 400n, stakedMeCoins: 600n });
    renderWithProviders(<Staking />);

    expect(screen.getByText("Available Me-Coins")).toBeInTheDocument();
    expect(screen.getByText("Staked Me-Coins")).toBeInTheDocument();
    expect(screen.getByText("We-Coins Held")).toBeInTheDocument();
    expect(await screen.findByText("10.00")).toBeInTheDocument();
    expect(screen.getByText("4.00")).toBeInTheDocument();
    expect(screen.getByText("6.00")).toBeInTheDocument();
  });

  it("rejects staking more Me-Coins than the balance", async () => {
    const user = userEvent.setup();
    signIn();
    setStakingInfo({ meCoins: 100n, weCoins: 0n, stakedMeCoins: 0n });
    renderWithProviders(<Staking />);

    // Wait for the balance to load so validation uses the real balance.
    await screen.findByText("1.00");
    await user.type(screen.getByLabelText(/amount to stake/i), "200");
    expect(
      screen.getByText(/you only have 1\.00 me available to stake/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^stake me-coins$/i }),
    ).toBeDisabled();
  });

  it("rejects unstaking more We-Coins than held", async () => {
    const user = userEvent.setup();
    signIn();
    setStakingInfo({ meCoins: 0n, weCoins: 50n, stakedMeCoins: 50n });
    renderWithProviders(<Staking />);

    await screen.findAllByText("0.50");
    await user.type(screen.getByLabelText(/amount to unstake/i), "100");
    expect(
      screen.getByText(/you only hold 0\.50 we to unstake/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^unstake we-coins$/i }),
    ).toBeDisabled();
  });

  it("stakes Me-Coins and updates the balances", async () => {
    const user = userEvent.setup();
    signIn();
    setStakingInfo({ meCoins: 1000n, weCoins: 0n, stakedMeCoins: 0n });
    renderWithProviders(<Staking />);

    await screen.findByText("10.00");
    await user.type(screen.getByLabelText(/amount to stake/i), "5");
    await user.click(screen.getByRole("button", { name: /^stake me-coins$/i }));

    await waitFor(() => {
      expect(screen.getByText(/staked successfully/i)).toBeInTheDocument();
    });
    expect(mockState.stakingInfo.weCoins).toBe(500n);
    expect(mockState.stakingInfo.stakedMeCoins).toBe(500n);
    expect(mockState.stakingInfo.meCoins).toBe(500n);
  });

  it("unstakes We-Coins and reclaims the Me-Coins", async () => {
    const user = userEvent.setup();
    signIn();
    setStakingInfo({ meCoins: 500n, weCoins: 500n, stakedMeCoins: 500n });
    renderWithProviders(<Staking />);

    await screen.findAllByText("5.00");
    await user.type(screen.getByLabelText(/amount to unstake/i), "5");
    await user.click(
      screen.getByRole("button", { name: /^unstake we-coins$/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/unstaked successfully/i)).toBeInTheDocument();
    });
    expect(mockState.stakingInfo.weCoins).toBe(0n);
    expect(mockState.stakingInfo.stakedMeCoins).toBe(0n);
    expect(mockState.stakingInfo.meCoins).toBe(1000n);
  });
});

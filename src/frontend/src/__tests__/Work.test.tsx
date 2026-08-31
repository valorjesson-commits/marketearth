import { Work } from "@/pages/Work";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  mockState,
  renderWithProviders,
  resetMocks,
  setWorkHistory,
  signIn,
} from "./testUtils";

describe("Work", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("prompts an unauthenticated user to sign in", () => {
    renderWithProviders(<Work />);
    expect(
      screen.getByRole("heading", { name: /sign in to earn me-coins/i }),
    ).toBeInTheDocument();
  });

  it("shows the empty work history state for a signed-in user", async () => {
    signIn();
    renderWithProviders(<Work />);
    expect(await screen.findByText(/no work logged yet/i)).toBeInTheDocument();
  });

  it("disables submit until title and a 20+ character description are provided", async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<Work />);

    const submit = screen.getByRole("button", { name: /submit work/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/task title/i), "Built a fence");
    expect(submit).toBeDisabled();

    await user.type(
      screen.getByLabelText(/description/i),
      "A description that is far too short",
    );
    expect(submit).toBeEnabled();
  });

  it("shows a validation error when the title is whitespace only", async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<Work />);

    await user.type(screen.getByLabelText(/task title/i), "   ");
    expect(screen.getByText(/please enter a task title/i)).toBeInTheDocument();
  });

  it("shows a validation error for a description shorter than 20 characters", async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<Work />);

    await user.type(screen.getByLabelText(/description/i), "too short");
    expect(
      screen.getByText(/description must be at least 20 characters/i),
    ).toBeInTheDocument();
  });

  it("submits validated work, mints Me-Coins, and shows the success state", async () => {
    const user = userEvent.setup();
    signIn();
    renderWithProviders(<Work />);

    await user.type(
      screen.getByLabelText(/task title/i),
      "Built the garden fence",
    );
    await user.type(
      screen.getByLabelText(/description/i),
      "A sufficiently long description that clears the minimum length gate.",
    );
    await user.click(screen.getByRole("button", { name: /submit work/i }));

    await waitFor(() => {
      expect(screen.getByText(/work accepted!/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/you earned/i)).toBeInTheDocument();
    expect(mockState.workHistory).toHaveLength(1);
    expect(mockState.workHistory[0].coinsEarned).toBe(10n);
  });

  it("lists past work entries with coins earned", async () => {
    signIn();
    setWorkHistory([
      {
        id: 1n,
        title: "Built the garden fence",
        description: "A completed task description",
        coinsEarned: 10n,
        createdAt: 1_700_000_000_000_000_000n,
      },
    ]);
    renderWithProviders(<Work />);

    expect(
      await screen.findByText("Built the garden fence"),
    ).toBeInTheDocument();
    expect(screen.getByText("+0.10 ME")).toBeInTheDocument();
  });
});

import { generateRandomIdentity, MANAGEMENT_CANISTER_ID, PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM }));
});

afterAll(async () => {
  await pic?.tearDown();
});

describe("MarketEarth backend public API", () => {
  it("answers an empty-state read instead of trapping", async () => {
    await expect(actor.getMyProfile()).resolves.toEqual([]);
    await expect(actor.getWorkHistory()).resolves.toEqual([]);
    await expect(actor.getProposals()).resolves.toEqual([]);
  });

  it("performs work, mints Me-Coins, and records it in history", async () => {
    const entry = await actor.performWork(
      "Built the community garden fence",
      "A sufficiently long description that clears the minimum length gate.",
    );
    expect(entry.title).toBe("Built the community garden fence");
    expect(entry.coinsEarned).toBe(10n);

    const history = await actor.getWorkHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ id: entry.id, coinsEarned: 10n });

    const profile = await actor.getMyProfile();
    expect(profile).toEqual([{ meCoins: 10n, weCoins: 0n, stakedMeCoins: 0n }]);
  });

  it("rejects work whose description is too short", async () => {
    await expect(actor.performWork("Short", "too short")).rejects.toThrow();
  });

  it("stakes Me-Coins to mint We-Coins and unstakes to reclaim them", async () => {
    // Seed a balance by performing work first.
    await actor.performWork(
      "Another completed task",
      "A description long enough to satisfy the minimum length requirement.",
    );

    const before = await actor.getStakingInfo();
    expect(before.meCoins).toBe(20n);

    // stakeForWeCoins returns unit -> null
    await expect(actor.stakeForWeCoins(5n)).resolves.toBeNull();

    const staked = await actor.getStakingInfo();
    expect(staked.meCoins).toBe(15n);
    expect(staked.weCoins).toBe(5n);
    expect(staked.stakedMeCoins).toBe(5n);

    await expect(actor.unstakeWeCoins(5n)).resolves.toBeNull();

    const unstaked = await actor.getStakingInfo();
    expect(unstaked.meCoins).toBe(20n);
    expect(unstaked.weCoins).toBe(0n);
    expect(unstaked.stakedMeCoins).toBe(0n);
  });

  it("rejects staking more Me-Coins than balance", async () => {
    const info = await actor.getStakingInfo();
    await expect(actor.stakeForWeCoins(info.meCoins + 1n)).rejects.toThrow();
  });

  it("creates a proposal and lists it with zero tallies", async () => {
    // Seed We-Coins so the caller can create a proposal.
    await actor.performWork(
      "Earn governance power to create",
      "A description long enough to satisfy the minimum length requirement.",
    );
    await actor.stakeForWeCoins(10n);

    const result = await actor.createProposal(
      "Fund the garden expansion",
      "A proposal description that is long enough to be meaningful.",
    );
    expect(result).toHaveProperty("ok");
    const proposal = result.ok;
    expect(proposal.yesVotes).toBe(0n);
    expect(proposal.noVotes).toBe(0n);
    expect(proposal.status).toEqual({ active: null });

    const proposals = await actor.getProposals();
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ id: proposal.id, title: "Fund the garden expansion" });
  });

  it("rejects creating a proposal without We-Coins", async () => {
    // A fresh caller with no We-Coins cannot create a proposal.
    actor.setIdentity(generateRandomIdentity());
    await actor._initialize_access_control();
    const result = await actor.createProposal(
      "Needs governance power",
      "A proposal description that is long enough to be meaningful.",
    );
    expect(result).toEqual({ err: { notEnoughWeCoins: null } });
  });

  it("votes on a proposal, spending exactly 1 We-Coin as governance power", async () => {
    // A fresh caller with We-Coins to spend.
    actor.setIdentity(generateRandomIdentity());
    await actor._initialize_access_control();
    await actor.performWork(
      "Earn governance power to vote",
      "A description long enough to satisfy the minimum length requirement.",
    );
    await actor.stakeForWeCoins(10n);

    const created = await actor.createProposal(
      "Vote on me",
      "A proposal description that is long enough to be meaningful.",
    );
    const target = created.ok;

    const before = await actor.getMyProfile();
    const weBefore = before[0].weCoins;

    await expect(actor.voteOnProposal(target.id, true)).resolves.toEqual({
      ok: null,
    });

    const updated = await actor.getProposal(target.id);
    expect(updated[0].yesVotes).toBeGreaterThan(0n);

    // Voting deducts exactly 1 We-Coin, not the whole balance.
    const after = await actor.getMyProfile();
    expect(after[0].weCoins).toBe(weBefore - 1n);

    // One vote per user per proposal: a second vote is rejected.
    await expect(actor.voteOnProposal(target.id, false)).resolves.toEqual({
      err: { alreadyVoted: null },
    });
  });

  it("rejects voting without We-Coins", async () => {
    // A QA identity with We-Coins creates its own proposal, so this test is
    // self-contained and does not depend on proposals[0] from a prior test.
    actor.setIdentity(generateRandomIdentity());
    await actor._initialize_access_control();
    await actor.performWork(
      "Earn governance power to create",
      "A description long enough to satisfy the minimum length requirement.",
    );
    await actor.stakeForWeCoins(10n);
    const created = await actor.createProposal(
      "Reject the penniless voter",
      "A proposal description that is long enough to be meaningful.",
    );
    const target = created.ok;

    // A separate registered user with 0 We-Coins (earned Me-Coins but never
    // staked) attempts to vote and is rejected with #notEnoughWeCoins.
    // Registering the voter via performWork exercises the weCoins < 1 branch in
    // voteOnProposal, not just the "user not found" branch.
    actor.setIdentity(generateRandomIdentity());
    await actor._initialize_access_control();
    await actor.performWork(
      "Earn Me-Coins but no governance power",
      "A description long enough to satisfy the minimum length requirement.",
    );
    const penniless = await actor.getMyProfile();
    expect(penniless[0].weCoins).toBe(0n);
    await expect(actor.voteOnProposal(target.id, true)).resolves.toEqual({
      err: { notEnoughWeCoins: null },
    });
  });

  it("lets the creator close their own proposal, locking further voting", async () => {
    // A fresh caller with We-Coins to create a proposal.
    actor.setIdentity(generateRandomIdentity());
    await actor._initialize_access_control();
    await actor.performWork(
      "Earn governance power to close",
      "A description long enough to satisfy the minimum length requirement.",
    );
    await actor.stakeForWeCoins(10n);

    const created = await actor.createProposal(
      "Close me",
      "A proposal description that is long enough to be meaningful.",
    );
    const proposal = created.ok;

    await expect(actor.closeProposal(proposal.id)).resolves.toEqual({
      ok: null,
    });

    const closed = await actor.getProposal(proposal.id);
    expect(closed[0].status).toEqual({ closed: null });

    // Voting on a closed proposal is rejected.
    await expect(actor.voteOnProposal(proposal.id, true)).resolves.toEqual({
      err: { proposalClosed: null },
    });
  });
});

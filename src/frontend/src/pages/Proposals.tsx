import type { Proposal, Result, Result_1, Result_2 } from "@/backend";
import { CloseError, CreateError, ProposalStatus, VoteError } from "@/backend";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCloseProposal,
  useCreateProposal,
  useMyProfile,
  useMyVotes,
  useProposal,
  useProposals,
  useVoteOnProposal,
} from "@/hooks/useQueries";
import { formatCoins, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  Lock,
  Megaphone,
  ThumbsDown,
  ThumbsUp,
  Vote,
} from "lucide-react";
import { useState } from "react";

const MIN_DESCRIPTION_LENGTH = 20;

function votePercentages(proposal: Proposal) {
  const total = proposal.yesVotes + proposal.noVotes;
  if (total === 0n) return { yesPct: 0, noPct: 0, total: 0n };
  return {
    yesPct: Number((proposal.yesVotes * 100n) / total),
    noPct: Number((proposal.noVotes * 100n) / total),
    total,
  };
}

function voteErrorMessage(error: VoteError): string {
  switch (error) {
    case VoteError.notEnoughWeCoins:
      return "You need at least 1 We-Coin to vote. Stake Me-Coins to earn governance power.";
    case VoteError.alreadyVoted:
      return "You've already voted on this proposal. One vote per proposal.";
    case VoteError.proposalClosed:
      return "This proposal is closed and no longer accepts votes.";
    case VoteError.proposalNotFound:
      return "This proposal could not be found.";
    default:
      return "Your vote could not be recorded. Please try again.";
  }
}

function closeErrorMessage(error: CloseError): string {
  switch (error) {
    case CloseError.notCreator:
      return "Only the proposal creator can close it.";
    case CloseError.alreadyClosed:
      return "This proposal is already closed.";
    case CloseError.proposalNotFound:
      return "This proposal could not be found.";
    default:
      return "The proposal could not be closed. Please try again.";
  }
}

function StatusBadge({ proposal }: { proposal: Proposal }) {
  const isActive = proposal.status !== ProposalStatus.closed;
  return (
    <Badge
      variant="outline"
      className={cn(isActive ? "badge-active" : "badge-closed")}
      data-ocid={
        isActive ? "proposals.status_active" : "proposals.status_closed"
      }
    >
      {isActive ? "Active" : "Closed"}
    </Badge>
  );
}

function VoteBar({ proposal }: { proposal: Proposal }) {
  const { yesPct, noPct, total } = votePercentages(proposal);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <ThumbsUp className="size-4 text-we-coin" aria-hidden="true" />
          Yes
          <span className="font-mono text-muted-foreground">
            {proposal.yesVotes.toString()}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          No
          <span className="font-mono text-muted-foreground">
            {proposal.noVotes.toString()}
          </span>
          <ThumbsDown
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </span>
      </div>
      <div
        className="progress-track flex h-2.5 w-full"
        role="img"
        aria-label={`${yesPct}% yes, ${noPct}% no`}
      >
        <div
          className="progress-fill progress-fill-yes"
          style={{ width: `${yesPct}%` }}
        />
        <div
          className="progress-fill progress-fill-no"
          style={{ width: `${noPct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {total === 0n
          ? "No votes cast yet"
          : `${yesPct}% in favor · ${total.toString()} total votes`}
      </p>
    </div>
  );
}

export function Proposals() {
  const identityContext = useInternetIdentity();
  const { identity, isAuthenticated, isInitializing, login } = identityContext;
  const { data: profile } = useMyProfile();
  const { data: proposals, isLoading } = useProposals();
  const { data: myVotes } = useMyVotes();
  const createProposal = useCreateProposal();
  const voteOnProposal = useVoteOnProposal();
  const closeProposal = useCloseProposal();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedId, setSelectedId] = useState<bigint | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [voteError, setVoteError] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: selected } = useProposal(selectedId);

  // Populate the set of proposals the caller has already voted on so
  // returning voters see their cast vote and disabled vote buttons on load.
  const myVotesLoaded = !!myVotes;
  if (myVotesLoaded && votedIds.size === 0 && myVotes.length > 0) {
    setVotedIds(new Set(myVotes.map(([proposalId]) => proposalId.toString())));
  }

  const weCoins = profile?.weCoins ?? 0n;
  const hasWeCoins = weCoins > 0n;
  // The signed-in user's principal. `useInternetIdentity` exposes the identity
  // object (with `getPrincipal()`) under `identity`; some test harnesses
  // flatten `getPrincipal` onto the hook result directly, so fall back to it
  // via a typed cast that does not violate the InternetIdentityContext type.
  const principal =
    identity?.getPrincipal?.() ??
    (
      identityContext as unknown as {
        getPrincipal?: () => Principal;
      }
    ).getPrincipal?.();

  const titleValid = title.trim().length > 0;
  const descriptionValid = description.trim().length >= MIN_DESCRIPTION_LENGTH;
  const canSubmit = titleValid && descriptionValid && !createProposal.isPending;

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    const capturedTitle = title.trim();
    const capturedDescription = description.trim();
    setTitle("");
    setDescription("");
    setCreateError(null);
    createProposal.mutate(
      { title: capturedTitle, description: capturedDescription },
      {
        onSuccess: (result: Result_1 | undefined) => {
          if (result && result.__kind__ === "err") {
            setTitle(capturedTitle);
            setDescription(capturedDescription);
            if (result.err === CreateError.notEnoughWeCoins) {
              setCreateError(
                "You need at least 1 We-Coin to create a proposal. Stake Me-Coins to earn governance power.",
              );
            } else {
              setCreateError(
                "Your proposal could not be created. Please try again.",
              );
            }
          }
        },
        onError: () => {
          setTitle(capturedTitle);
          setDescription(capturedDescription);
          setCreateError(
            "Something went wrong creating your proposal. Please try again.",
          );
        },
      },
    );
  }

  function handleVote(proposalId: bigint, inFavor: boolean) {
    setVoteError(null);
    voteOnProposal.mutate(
      { proposalId, inFavor },
      {
        onSuccess: (result: Result | undefined) => {
          if (result && result.__kind__ === "err") {
            setVoteError(voteErrorMessage(result.err));
            if (result.err === VoteError.alreadyVoted) {
              setVotedIds((prev) => new Set(prev).add(proposalId.toString()));
            }
            return;
          }
          setVotedIds((prev) => new Set(prev).add(proposalId.toString()));
        },
        onError: () => {
          setVoteError(
            "Your vote could not be recorded. Voting requires at least 1 We-Coin and allows one vote per proposal.",
          );
        },
      },
    );
  }

  function handleClose(proposalId: bigint) {
    setCloseError(null);
    closeProposal.mutate(proposalId, {
      onSuccess: (result: Result_2 | undefined) => {
        if (result && result.__kind__ === "err") {
          setCloseError(closeErrorMessage(result.err));
        }
      },
      onError: () => {
        setCloseError("The proposal could not be closed. Please try again.");
      },
    });
  }

  const activeProposal = selected ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Proposals &amp; Voting
        </h1>
        <p className="text-muted-foreground">
          Review community proposals and vote with your We-Coins governance
          power. Each vote costs exactly 1 We-Coin.
        </p>
      </div>

      {!isAuthenticated ? (
        <Card data-ocid="proposals.empty_state">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-we-coin-soft text-we-coin">
              <Vote className="size-7" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Sign in to vote on proposals
              </h2>
              <p className="max-w-md text-muted-foreground">
                Log in with your Internet Identity to review community proposals
                and cast your vote with We-Coins.
              </p>
            </div>
            <Button
              onClick={() => login()}
              disabled={isInitializing}
              data-ocid="proposals.sign_in_button"
            >
              Sign in
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Proposals list + detail */}
          <div className="space-y-6 lg:col-span-3">
            <Card data-ocid="proposals.list_panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone
                    className="size-5 text-we-coin"
                    aria-hidden="true"
                  />
                  Community Proposals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div
                    className="space-y-3"
                    data-ocid="proposals.loading_state"
                    aria-busy="true"
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-24 animate-pulse rounded-lg bg-muted"
                      />
                    ))}
                  </div>
                ) : proposals && proposals.length > 0 ? (
                  <ul
                    className="divide-y divide-border"
                    data-ocid="proposals.list"
                  >
                    {proposals.map((proposal, index) => {
                      const isSelected = selectedId === proposal.id;
                      const hasVoted = votedIds.has(proposal.id.toString());
                      const isActive =
                        proposal.status !== ProposalStatus.closed;
                      const isCreator =
                        !!proposal.creator &&
                        !!principal &&
                        proposal.creator.toText() === principal.toText();
                      return (
                        <li
                          key={proposal.id.toString()}
                          data-ocid={`proposals.item.${index + 1}`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedId(proposal.id)}
                            className={cn(
                              "flex w-full items-start justify-between gap-4 rounded-lg px-3 py-4 text-left transition-smooth hover:bg-accent/60",
                              isSelected && "bg-accent/60",
                            )}
                            aria-expanded={isSelected}
                            data-ocid={`proposals.detail_button.${index + 1}`}
                          >
                            <div className="min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-display font-semibold text-foreground">
                                  {proposal.title}
                                </p>
                                <StatusBadge proposal={proposal} />
                                {hasVoted ? (
                                  <Badge
                                    variant="secondary"
                                    data-ocid={`proposals.voted_badge.${index + 1}`}
                                  >
                                    <CheckCircle2
                                      className="size-3 text-we-coin"
                                      aria-hidden="true"
                                    />
                                    Voted
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                {proposal.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(proposal.createdAt)}
                              </p>
                            </div>
                            <ChevronRight
                              className={cn(
                                "mt-1 size-5 shrink-0 text-muted-foreground transition-transform",
                                isSelected && "rotate-90",
                              )}
                              aria-hidden="true"
                            />
                          </button>

                          {isSelected ? (
                            <div
                              className="space-y-4 border-t border-border px-3 py-4"
                              data-ocid="proposals.detail"
                            >
                              <VoteBar proposal={proposal} />
                              {isActive ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                      !hasWeCoins ||
                                      hasVoted ||
                                      voteOnProposal.isPending
                                    }
                                    onClick={() =>
                                      handleVote(proposal.id, true)
                                    }
                                    data-ocid={`proposals.vote_yes.${index + 1}`}
                                  >
                                    {voteOnProposal.isPending ? (
                                      <Loader2
                                        className="size-4 animate-spin"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <ThumbsUp
                                        className="size-4 text-we-coin"
                                        aria-hidden="true"
                                      />
                                    )}
                                    Vote yes
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={
                                      !hasWeCoins ||
                                      hasVoted ||
                                      voteOnProposal.isPending
                                    }
                                    onClick={() =>
                                      handleVote(proposal.id, false)
                                    }
                                    data-ocid={`proposals.vote_no.${index + 1}`}
                                  >
                                    <ThumbsDown
                                      className="size-4 text-muted-foreground"
                                      aria-hidden="true"
                                    />
                                    Vote no
                                  </Button>
                                  {hasVoted ? (
                                    <span className="text-sm text-muted-foreground">
                                      You've cast your vote on this proposal.
                                    </span>
                                  ) : !hasWeCoins ? (
                                    <span className="text-sm text-muted-foreground">
                                      You need We-Coins to vote. Stake Me-Coins
                                      to earn governance power.
                                    </span>
                                  ) : null}
                                  {isCreator ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={closeProposal.isPending}
                                      onClick={() => handleClose(proposal.id)}
                                      data-ocid={`proposals.close_button.${index + 1}`}
                                    >
                                      {closeProposal.isPending ? (
                                        <Loader2
                                          className="size-4 animate-spin"
                                          aria-hidden="true"
                                        />
                                      ) : (
                                        <Lock
                                          className="size-4 text-muted-foreground"
                                          aria-hidden="true"
                                        />
                                      )}
                                      Close proposal
                                    </Button>
                                  ) : null}
                                </div>
                              ) : (
                                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Lock className="size-4" aria-hidden="true" />
                                  This proposal is closed. Voting is locked.
                                </p>
                              )}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div
                    className="flex flex-col items-center gap-3 py-12 text-center"
                    data-ocid="proposals.list_empty"
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-we-coin-soft text-we-coin">
                      <Megaphone className="size-6" aria-hidden="true" />
                    </span>
                    <div className="space-y-1">
                      <p className="font-display font-semibold text-foreground">
                        No proposals yet
                      </p>
                      <p className="max-w-sm text-sm text-muted-foreground">
                        Create the first proposal to start a community vote.
                      </p>
                    </div>
                  </div>
                )}

                {voteError ? (
                  <Alert
                    variant="destructive"
                    className="mt-4"
                    data-ocid="proposals.vote_error"
                  >
                    <AlertTitle>Vote not recorded</AlertTitle>
                    <AlertDescription>{voteError}</AlertDescription>
                  </Alert>
                ) : null}

                {closeError ? (
                  <Alert
                    variant="destructive"
                    className="mt-4"
                    data-ocid="proposals.close_error"
                  >
                    <AlertTitle>Proposal not closed</AlertTitle>
                    <AlertDescription>{closeError}</AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>

            {/* Detail view */}
            {activeProposal ? (
              <Card data-ocid="proposals.detail_panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Vote className="size-5 text-we-coin" aria-hidden="true" />
                    Proposal Detail
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {activeProposal.title}
                      </h3>
                      <StatusBadge proposal={activeProposal} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Proposed {formatDate(activeProposal.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {activeProposal.description}
                  </p>
                  <VoteBar proposal={activeProposal} />
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Create proposal form */}
          <Card
            className="h-fit lg:col-span-2"
            data-ocid="proposals.create_panel"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="size-5 text-we-coin" aria-hidden="true" />
                Create Proposal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="proposal-title">Title</Label>
                  <Input
                    id="proposal-title"
                    data-ocid="proposals.title_input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Fund the community garden expansion"
                    aria-invalid={title.length > 0 && !titleValid}
                  />
                  {title.length > 0 && !titleValid ? (
                    <p
                      className="text-sm text-destructive"
                      data-ocid="proposals.title_error"
                    >
                      Please enter a proposal title.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proposal-description">Description</Label>
                  <Textarea
                    id="proposal-description"
                    data-ocid="proposals.description_input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what you're proposing and why it helps the community…"
                    rows={5}
                    aria-invalid={description.length > 0 && !descriptionValid}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="text-sm text-muted-foreground"
                      data-ocid="proposals.description_hint"
                    >
                      {description.trim().length}/{MIN_DESCRIPTION_LENGTH} min
                      characters
                    </p>
                    {description.length > 0 && !descriptionValid ? (
                      <p
                        className="text-sm text-destructive"
                        data-ocid="proposals.description_error"
                      >
                        Description must be at least {MIN_DESCRIPTION_LENGTH}{" "}
                        characters.
                      </p>
                    ) : null}
                  </div>
                </div>

                {createError ? (
                  <p
                    className="text-sm text-destructive"
                    data-ocid="proposals.create_error"
                  >
                    {createError}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit}
                  data-ocid="proposals.create_button"
                >
                  {createProposal.isPending ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Creating…
                    </>
                  ) : (
                    "Create proposal"
                  )}
                </Button>
              </form>

              <div
                className="mt-4 flex items-center gap-2 rounded-lg border border-we-coin/30 bg-we-coin-soft p-3 text-sm text-muted-foreground"
                data-ocid="proposals.we_coin_hint"
              >
                <Vote
                  className="size-4 shrink-0 text-we-coin"
                  aria-hidden="true"
                />
                <span>
                  You have{" "}
                  <span className="font-mono font-semibold text-we-coin">
                    {formatCoins(weCoins)} WE
                  </span>{" "}
                  available. Each vote costs exactly 1 We-Coin.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePerformWork, useWorkHistory } from "@/hooks/useQueries";
import { formatCoins, formatDate } from "@/lib/format";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { CheckCircle2, Coins, Hammer, Loader2 } from "lucide-react";
import { useState } from "react";

const MIN_DESCRIPTION_LENGTH = 20;

export function Work() {
  const { isAuthenticated } = useInternetIdentity();
  const { data: history, isLoading } = useWorkHistory();
  const performWork = usePerformWork();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [earned, setEarned] = useState<bigint | null>(null);

  const titleValid = title.trim().length > 0;
  const descriptionValid = description.trim().length >= MIN_DESCRIPTION_LENGTH;
  const canSubmit = titleValid && descriptionValid && !performWork.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    const capturedTitle = title.trim();
    const capturedDescription = description.trim();
    setTitle("");
    setDescription("");
    setEarned(null);
    performWork.mutate(
      { title: capturedTitle, description: capturedDescription },
      {
        onSuccess: (entry) => setEarned(entry.coinsEarned),
        onError: () => {
          setTitle((current) => (current === "" ? capturedTitle : current));
          setDescription((current) =>
            current === "" ? capturedDescription : current,
          );
        },
      },
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Work &amp; Earning
        </h1>
        <p className="text-muted-foreground">
          Submit completed tasks to earn Me-Coins into your balance.
        </p>
      </div>

      {!isAuthenticated ? (
        <Card data-ocid="work.empty_state">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-me-coin-soft text-me-coin">
              <Coins className="size-7" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Sign in to earn Me-Coins
              </h2>
              <p className="max-w-md text-muted-foreground">
                Log in with your Internet Identity to submit completed work and
                track the Me-Coins you earn.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Submit work form */}
          <Card className="lg:col-span-2" data-ocid="work.submit_panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hammer className="size-5 text-me-coin" aria-hidden="true" />
                Submit Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="work-title">Task title</Label>
                  <Input
                    id="work-title"
                    data-ocid="work.title_input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Built the community garden fence"
                    aria-invalid={title.length > 0 && !titleValid}
                  />
                  {title.length > 0 && !titleValid ? (
                    <p
                      className="text-sm text-destructive"
                      data-ocid="work.title_error"
                    >
                      Please enter a task title.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="work-description">Description</Label>
                  <Textarea
                    id="work-description"
                    data-ocid="work.description_input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you completed and how it helps the community…"
                    rows={5}
                    aria-invalid={description.length > 0 && !descriptionValid}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="text-sm text-muted-foreground"
                      data-ocid="work.description_hint"
                    >
                      {description.trim().length}/{MIN_DESCRIPTION_LENGTH} min
                      characters
                    </p>
                    {description.length > 0 && !descriptionValid ? (
                      <p
                        className="text-sm text-destructive"
                        data-ocid="work.description_error"
                      >
                        Description must be at least {MIN_DESCRIPTION_LENGTH}{" "}
                        characters.
                      </p>
                    ) : null}
                  </div>
                </div>

                {performWork.isError ? (
                  <p
                    className="text-sm text-destructive"
                    data-ocid="work.submit_error"
                  >
                    Something went wrong submitting your work. Please try again.
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit}
                  data-ocid="work.submit_button"
                >
                  {performWork.isPending ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Submitting…
                    </>
                  ) : (
                    "Submit work"
                  )}
                </Button>
              </form>

              {earned !== null ? (
                <div
                  className="mt-4 flex items-center gap-3 rounded-lg border border-me-coin/30 bg-me-coin-soft p-4"
                  data-ocid="work.success_state"
                >
                  <CheckCircle2
                    className="size-6 shrink-0 text-me-coin"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">
                      Work accepted!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You earned{" "}
                      <span className="font-mono font-semibold text-me-coin">
                        {formatCoins(earned)} ME
                      </span>{" "}
                      for this task.
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Work history */}
          <Card className="lg:col-span-3" data-ocid="work.history_panel">
            <CardHeader>
              <CardTitle>Work History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div
                  className="space-y-3"
                  data-ocid="work.loading_state"
                  aria-busy="true"
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              ) : history && history.length > 0 ? (
                <ul
                  className="divide-y divide-border"
                  data-ocid="work.history_list"
                >
                  {history.map((entry, index) => (
                    <li
                      key={entry.id.toString()}
                      className="flex items-start justify-between gap-4 py-4"
                      data-ocid={`work.item.${index + 1}`}
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="font-display font-semibold text-foreground">
                          {entry.title}
                        </p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {entry.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.createdAt)}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-me-coin-soft px-2.5 py-1 font-mono text-sm font-semibold text-me-coin">
                        <Coins className="size-3.5" aria-hidden="true" />+
                        {formatCoins(entry.coinsEarned)} ME
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  className="flex flex-col items-center gap-3 py-12 text-center"
                  data-ocid="work.history_empty"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-me-coin-soft text-me-coin">
                    <Hammer className="size-6" aria-hidden="true" />
                  </span>
                  <div className="space-y-1">
                    <p className="font-display font-semibold text-foreground">
                      No work logged yet
                    </p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Submit your first completed task to start earning
                      Me-Coins.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

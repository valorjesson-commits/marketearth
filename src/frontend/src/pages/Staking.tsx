import { BalanceCard } from "@/components/BalanceCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useStakeForWeCoins,
  useStakingInfo,
  useUnstakeWeCoins,
} from "@/hooks/useQueries";
import { formatCoins } from "@/lib/format";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Coins,
  Landmark,
  Vote,
} from "lucide-react";
import { useState } from "react";

function parseAmount(raw: string): bigint | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  return BigInt(Math.round(value * 100));
}

export function Staking() {
  const { isAuthenticated } = useInternetIdentity();
  const { data: staking, isLoading } = useStakingInfo();

  const [stakeRaw, setStakeRaw] = useState("");
  const [unstakeRaw, setUnstakeRaw] = useState("");

  const stakeMutation = useStakeForWeCoins();
  const unstakeMutation = useUnstakeWeCoins();

  const meCoins = staking?.meCoins ?? 0n;
  const weCoins = staking?.weCoins ?? 0n;
  const staked = staking?.stakedMeCoins ?? 0n;

  const stakeAmount = parseAmount(stakeRaw);
  const unstakeAmount = parseAmount(unstakeRaw);

  const stakeError =
    stakeAmount === null
      ? "Enter a valid amount of Me-Coins to stake."
      : stakeAmount > meCoins
        ? `You only have ${formatCoins(meCoins)} ME available to stake.`
        : stakeAmount === 0n
          ? "Enter an amount greater than zero."
          : null;

  const unstakeError =
    unstakeAmount === null
      ? "Enter a valid amount of We-Coins to unstake."
      : unstakeAmount > weCoins
        ? `You only hold ${formatCoins(weCoins)} WE to unstake.`
        : unstakeAmount === 0n
          ? "Enter an amount greater than zero."
          : null;

  const handleStake = (e: React.FormEvent) => {
    e.preventDefault();
    if (stakeAmount === null || stakeError) return;
    const amount = stakeAmount;
    setStakeRaw("");
    stakeMutation.mutate(amount, {
      onError: () =>
        setStakeRaw((current) =>
          current === "" ? String(amount / 100n) : current,
        ),
    });
  };

  const handleUnstake = (e: React.FormEvent) => {
    e.preventDefault();
    if (unstakeAmount === null || unstakeError) return;
    const amount = unstakeAmount;
    setUnstakeRaw("");
    unstakeMutation.mutate(amount, {
      onError: () =>
        setUnstakeRaw((current) =>
          current === "" ? String(amount / 100n) : current,
        ),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        <div className="mb-8 space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Staking
          </h1>
          <p className="text-muted-foreground">
            Stake Me-Coins to receive We-Coins governance power, and unstake to
            reclaim them.
          </p>
        </div>
        <Card data-ocid="staking.empty_state">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-we-coin-soft text-we-coin">
              <Landmark className="size-7" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Sign in to manage your stake
              </h2>
              <p className="max-w-md text-muted-foreground">
                Your staked Me-Coins and We-Coins governance power live on the
                blockchain behind your Internet Identity.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Staking
        </h1>
        <p className="text-muted-foreground">
          Stake Me-Coins to receive We-Coins governance power, and unstake to
          reclaim them.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 md:gap-6">
        <BalanceCard
          label="Available Me-Coins"
          value={formatCoins(meCoins)}
          unit="ME"
          kind="me"
          icon={<Coins className="size-5" aria-hidden="true" />}
          hint="Earned for completed work"
        />
        <BalanceCard
          label="Staked Me-Coins"
          value={formatCoins(staked)}
          unit="ME"
          kind="staked"
          icon={<Landmark className="size-5" aria-hidden="true" />}
          hint="Locked to back your We-Coins"
        />
        <BalanceCard
          label="We-Coins Held"
          value={formatCoins(weCoins)}
          unit="WE"
          kind="we"
          icon={<Vote className="size-5" aria-hidden="true" />}
          hint="Governance power from staking"
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-6">
        <Card data-ocid="staking.stake_panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-gold text-primary-foreground">
                <ArrowDownToLine className="size-4" aria-hidden="true" />
              </span>
              Stake Me-Coins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Lock Me-Coins to mint We-Coins governance power. You can reclaim
              them anytime by unstaking.
            </p>
            <form onSubmit={handleStake} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="stake-amount">Amount to stake (ME)</Label>
                <Input
                  id="stake-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={stakeRaw}
                  onChange={(e) => setStakeRaw(e.target.value)}
                  aria-invalid={stakeError ? true : undefined}
                  data-ocid="staking.stake_input"
                />
                {stakeError ? (
                  <p
                    className="text-sm text-destructive"
                    data-ocid="staking.stake_error"
                  >
                    {stakeError}
                  </p>
                ) : null}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  stakeMutation.isPending ||
                  stakeAmount === null ||
                  stakeError !== null
                }
                data-ocid="staking.stake_button"
              >
                {stakeMutation.isPending ? "Staking…" : "Stake Me-Coins"}
              </Button>
              {stakeMutation.isError ? (
                <p
                  className="text-sm text-destructive"
                  data-ocid="staking.stake_submit_error"
                >
                  Could not stake. Please try again.
                </p>
              ) : null}
              {stakeMutation.isSuccess ? (
                <p
                  className="text-sm text-success"
                  data-ocid="staking.stake_success"
                >
                  Staked successfully. Your We-Coins have been updated.
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card data-ocid="staking.unstake_panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                <ArrowUpFromLine className="size-4" aria-hidden="true" />
              </span>
              Unstake We-Coins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Redeem We-Coins to reclaim the Me-Coins you staked. You can only
              unstake what you currently hold.
            </p>
            <form onSubmit={handleUnstake} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="unstake-amount">Amount to unstake (WE)</Label>
                <Input
                  id="unstake-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={unstakeRaw}
                  onChange={(e) => setUnstakeRaw(e.target.value)}
                  aria-invalid={unstakeError ? true : undefined}
                  data-ocid="staking.unstake_input"
                />
                {unstakeError ? (
                  <p
                    className="text-sm text-destructive"
                    data-ocid="staking.unstake_error"
                  >
                    {unstakeError}
                  </p>
                ) : null}
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={
                  unstakeMutation.isPending ||
                  unstakeAmount === null ||
                  unstakeError !== null
                }
                data-ocid="staking.unstake_button"
              >
                {unstakeMutation.isPending ? "Unstaking…" : "Unstake We-Coins"}
              </Button>
              {unstakeMutation.isError ? (
                <p
                  className="text-sm text-destructive"
                  data-ocid="staking.unstake_submit_error"
                >
                  Could not unstake. Please try again.
                </p>
              ) : null}
              {unstakeMutation.isSuccess ? (
                <p
                  className="text-sm text-success"
                  data-ocid="staking.unstake_success"
                >
                  Unstaked successfully. Your Me-Coins have been reclaimed.
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p
          className="mt-6 text-sm text-muted-foreground"
          data-ocid="staking.loading_state"
        >
          Loading your staking balances…
        </p>
      ) : null}
    </div>
  );
}

import { BalanceCard } from "@/components/BalanceCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyProfile,
  useProposals,
  useStakingInfo,
  useWorkHistory,
} from "@/hooks/useQueries";
import { formatCoins, formatDate } from "@/lib/format";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Coins, Hammer, Landmark, Vote } from "lucide-react";

type ActivityItem = {
  id: string;
  kind: "work" | "vote" | "stake";
  title: string;
  detail: string;
  timestamp: bigint;
  amount: bigint;
};

export function Dashboard() {
  const { isAuthenticated, isInitializing, login } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: staking, isLoading: stakingLoading } = useStakingInfo();
  const { data: workHistory, isLoading: workLoading } = useWorkHistory();
  const { data: proposals, isLoading: proposalsLoading } = useProposals();

  const meCoins = profile?.meCoins ?? 0n;
  const weCoins = profile?.weCoins ?? 0n;
  const staked = staking?.stakedMeCoins ?? profile?.stakedMeCoins ?? 0n;

  const balancesLoading = profileLoading || stakingLoading;

  const activity: ActivityItem[] = [
    ...(workHistory ?? []).map((entry) => ({
      id: `work-${entry.id.toString()}`,
      kind: "work" as const,
      title: entry.title,
      detail: "Work completed",
      timestamp: entry.createdAt,
      amount: entry.coinsEarned,
    })),
    ...(proposals ?? []).map((proposal) => ({
      id: `vote-${proposal.id.toString()}`,
      kind: "vote" as const,
      title: proposal.title,
      detail: `${proposal.yesVotes.toString()} yes · ${proposal.noVotes.toString()} no`,
      timestamp: proposal.createdAt,
      amount: proposal.yesVotes,
    })),
  ];

  if (staking && staking.stakedMeCoins > 0n) {
    activity.push({
      id: "stake-current",
      kind: "stake",
      title: "Active stake",
      detail: "Me-Coins locked for governance",
      timestamp: 0n,
      amount: staking.stakedMeCoins,
    });
  }

  activity.sort((a, b) => Number(b.timestamp - a.timestamp));

  const activityLoading = workLoading || proposalsLoading;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Personal Economy
        </h1>
        <p className="text-muted-foreground">
          Earn Me-Coins for work, stake them for We-Coins, and govern your
          community.
        </p>
      </div>

      {!isAuthenticated ? (
        <Card data-ocid="dashboard.empty_state">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-me-coin-soft text-me-coin">
              <Coins className="size-7" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Sign in to see your economy
              </h2>
              <p className="max-w-md text-muted-foreground">
                Your Me-Coins, We-Coins, and staking balances live on the
                blockchain behind your Internet Identity.
              </p>
            </div>
            <Button
              onClick={() => login()}
              disabled={isInitializing}
              data-ocid="dashboard.sign_in_button"
            >
              <Coins className="size-4" aria-hidden="true" />
              Sign in with Internet Identity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            {balancesLoading ? (
              <>
                <Skeleton
                  className="h-40 rounded-xl"
                  data-ocid="dashboard.loading_state"
                />
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </>
            ) : (
              <>
                <BalanceCard
                  label="Me-Coins"
                  value={formatCoins(meCoins)}
                  unit="ME"
                  kind="me"
                  icon={<Coins className="size-5" aria-hidden="true" />}
                  hint="Earned for completed work"
                />
                <BalanceCard
                  label="We-Coins"
                  value={formatCoins(weCoins)}
                  unit="WE"
                  kind="we"
                  icon={<Vote className="size-5" aria-hidden="true" />}
                  hint="Governance power from staking"
                />
                <BalanceCard
                  label="Staked Me-Coins"
                  value={formatCoins(staked)}
                  unit="ME"
                  kind="staked"
                  icon={<Landmark className="size-5" aria-hidden="true" />}
                  hint="Locked to back your We-Coins"
                />
              </>
            )}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-6">
            <Card
              className="md:col-span-2"
              data-ocid="dashboard.activity_panel"
            >
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div
                    className="space-y-3"
                    data-ocid="dashboard.loading_state"
                  >
                    <Skeleton className="h-14 rounded-lg" />
                    <Skeleton className="h-14 rounded-lg" />
                    <Skeleton className="h-14 rounded-lg" />
                  </div>
                ) : activity.length === 0 ? (
                  <div
                    className="flex flex-col items-center gap-2 py-10 text-center"
                    data-ocid="dashboard.activity_empty"
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Hammer className="size-6" aria-hidden="true" />
                    </span>
                    <p className="text-sm text-muted-foreground">
                      No activity yet. Log work or vote on a proposal to get
                      started.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {activity.map((item) => (
                      <ActivityRow key={item.id} item={item} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card data-ocid="dashboard.quick_actions">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="justify-between"
                  data-ocid="dashboard.work_link"
                >
                  <Link to="/work">
                    Log completed work
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="justify-between"
                  data-ocid="dashboard.staking_link"
                >
                  <Link to="/staking">
                    Stake Me-Coins
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="justify-between"
                  data-ocid="dashboard.proposals_link"
                >
                  <Link to="/proposals">
                    View proposals
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

const activityMeta = {
  work: {
    icon: Hammer,
    badge: "bg-me-coin-soft text-me-coin",
    label: "Earned",
    unit: "ME",
  },
  vote: {
    icon: Vote,
    badge: "bg-we-coin-soft text-we-coin",
    label: "Votes",
    unit: "WE",
  },
  stake: {
    icon: Landmark,
    badge: "bg-muted text-muted-foreground",
    label: "Staked",
    unit: "ME",
  },
} as const;

function ActivityRow({ item }: { item: ActivityItem }) {
  const meta = activityMeta[item.kind];
  const Icon = meta.icon;
  return (
    <li className="flex items-center gap-4 py-3.5">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${meta.badge}`}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{item.title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {item.detail}
          {item.timestamp > 0n ? ` · ${formatDate(item.timestamp)}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="outline" className={meta.badge}>
          {meta.label}
        </Badge>
        <span className="font-mono text-sm font-semibold text-foreground">
          {formatCoins(item.amount)}
          <span className="ml-1 text-xs font-medium text-muted-foreground">
            {meta.unit}
          </span>
        </span>
      </div>
    </li>
  );
}

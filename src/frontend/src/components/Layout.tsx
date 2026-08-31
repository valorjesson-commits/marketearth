import { Button } from "@/components/ui/button";
import { useMyProfile } from "@/hooks/useQueries";
import { formatCoins } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, Outlet } from "@tanstack/react-router";
import { Check, Copy, Landmark, LogOut, UserRound } from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/work", label: "Work" },
  { to: "/staking", label: "Staking" },
  { to: "/proposals", label: "Proposals" },
] as const;

export function Layout() {
  const {
    identity,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    login,
    clear,
  } = useInternetIdentity();
  const { data: profile } = useMyProfile();
  const [copied, setCopied] = useState(false);

  const principalText = identity?.getPrincipal().toText() ?? "";
  const truncatedPrincipal =
    principalText.length > 13
      ? `${principalText.slice(0, 5)}…${principalText.slice(-4)}`
      : principalText;

  const copyPrincipal = async () => {
    if (!principalText) return;
    try {
      await navigator.clipboard.writeText(principalText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — ignore.
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-subtle">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-foreground"
            data-ocid="brand_link"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
              <Landmark className="size-5" aria-hidden="true" />
            </span>
            MarketEarth
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary navigation"
            data-ocid="nav"
          >
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-accent hover:text-accent-foreground",
                  "data-[status=active]:bg-accent data-[status=active]:text-accent-foreground",
                )}
                activeOptions={{ exact: item.to === "/" }}
                data-ocid={`nav.${item.label.toLowerCase()}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="hidden items-center gap-2 lg:flex">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-me-coin-soft px-3 py-1 text-xs font-semibold text-me-coin"
                    data-ocid="balance_me"
                  >
                    <span
                      className="size-1.5 rounded-full bg-me-coin"
                      aria-hidden="true"
                    />
                    {profile ? formatCoins(profile.meCoins) : "—"} Me
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-we-coin-soft px-3 py-1 text-xs font-semibold text-we-coin"
                    data-ocid="balance_we"
                  >
                    <span
                      className="size-1.5 rounded-full bg-we-coin"
                      aria-hidden="true"
                    />
                    {profile ? formatCoins(profile.weCoins) : "—"} We
                  </span>
                </div>

                <button
                  type="button"
                  onClick={copyPrincipal}
                  className="principal-chip inline-flex items-center gap-1.5 transition-smooth hover:text-foreground"
                  aria-label="Copy full Principal ID"
                  data-ocid="principal_chip"
                >
                  {truncatedPrincipal}
                  {copied ? (
                    <Check className="size-3 text-success" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3" aria-hidden="true" />
                  )}
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clear()}
                  data-ocid="sign_out_button"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => login()}
                disabled={isInitializing || isLoggingIn}
                data-ocid="sign_in_button"
              >
                <UserRound className="size-4" aria-hidden="true" />
                {isLoggingIn ? "Signing in…" : "Sign in"}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <nav
          className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden"
          aria-label="Primary navigation"
          data-ocid="nav"
        >
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-accent hover:text-accent-foreground data-[status=active]:bg-accent data-[status=active]:text-accent-foreground"
              activeOptions={{ exact: item.to === "/" }}
              data-ocid={`nav.${item.label.toLowerCase()}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1 bg-background">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row md:px-6">
          <span>MarketEarth — your personal community economy.</span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="transition-smooth hover:text-foreground"
          >
            © {new Date().getFullYear()}. Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}

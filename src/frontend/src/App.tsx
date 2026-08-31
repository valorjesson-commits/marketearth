import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Proposals } from "@/pages/Proposals";
import { Staking } from "@/pages/Staking";
import { Work } from "@/pages/Work";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const workRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/work",
  component: Work,
});

const stakingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/staking",
  component: Staking,
});

const proposalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/proposals",
  component: Proposals,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  workRoute,
  stakingRoute,
  proposalsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}

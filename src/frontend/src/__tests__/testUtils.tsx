import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

export {
  MOCK_PRINCIPAL,
  mockActor,
  mockIdentity,
  mockState,
  resetMocks,
  setMyVotes,
  setProfile,
  setProposals,
  setStakingInfo,
  setWorkHistory,
  signIn,
} from "./setup";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(ui: ReactElement) {
  const queryClient = makeQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

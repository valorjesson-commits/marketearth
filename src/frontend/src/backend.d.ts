import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface WorkEntry {
    id: bigint;
    title: string;
    createdAt: Timestamp;
    description: string;
    coinsEarned: bigint;
}
export type Result_2 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: CloseError;
};
export interface User {
    weCoins: bigint;
    stakedMeCoins: bigint;
    meCoins: bigint;
}
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Proposal {
    id: bigint;
    status: ProposalStatus;
    noVotes: bigint;
    title: string;
    creator: Principal;
    yesVotes: bigint;
    createdAt: bigint;
    description: string;
}
export type Result_1 = {
    __kind__: "ok";
    ok: Proposal;
} | {
    __kind__: "err";
    err: CreateError;
};
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: VoteError;
};
export type Result_3 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Cell {
    value: Value;
    name: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface StakingInfo {
    weCoins: bigint;
    stakedMeCoins: bigint;
    meCoins: bigint;
}
export enum CloseError {
    proposalNotFound = "proposalNotFound",
    alreadyClosed = "alreadyClosed",
    notCreator = "notCreator"
}
export enum CreateError {
    notEnoughWeCoins = "notEnoughWeCoins"
}
export enum ProposalStatus {
    closed = "closed",
    active = "active"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VoteError {
    proposalNotFound = "proposalNotFound",
    alreadyVoted = "alreadyVoted",
    notEnoughWeCoins = "notEnoughWeCoins",
    proposalClosed = "proposalClosed"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    closeProposal(proposalId: bigint): Promise<Result_2>;
    createProposal(title: string, description: string): Promise<Result_1>;
    execute(qJson: string): Promise<Result__1>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getMyProfile(): Promise<User | null>;
    getMyVotes(): Promise<Array<[bigint, boolean]>>;
    getProposal(id: bigint): Promise<Proposal | null>;
    getProposals(): Promise<Array<Proposal>>;
    getStakingInfo(): Promise<StakingInfo>;
    getWorkHistory(): Promise<Array<WorkEntry>>;
    isCallerAdmin(): Promise<boolean>;
    performWork(title: string, description: string): Promise<WorkEntry>;
    schema(): Promise<string>;
    stakeForWeCoins(amount: bigint): Promise<void>;
    unstakeWeCoins(amount: bigint): Promise<void>;
    voteOnProposal(proposalId: bigint, inFavor: boolean): Promise<Result>;
}

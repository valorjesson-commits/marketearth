import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import ListEntity "mo:caffeineai-oql/ListEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import ActivityKindValue "values/ActivityKindValue";
import ProposalStatusValue "values/ProposalStatusValue";
import Types "types/common";
import ProfileApi "mixins/profile-api";
import WorkApi "mixins/work-api";
import StakingApi "mixins/staking-api";
import GovernanceApi "mixins/governance-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  let users : Map.Map<Principal, Types.User>;
  let workEntries : List.List<Types.WorkEntry>;
  let proposals : List.List<Types.Proposal>;
  let votes : List.List<Types.Vote>;
  let activity : List.List<Types.ActivityEvent>;
  let state : Types.State;

  include ProfileApi(accessControlState, users);
  include WorkApi(accessControlState, users, workEntries, activity, state);
  include StakingApi(accessControlState, users, activity, state);
  include GovernanceApi(accessControlState, users, proposals, votes, activity, state);

  include Expose({
    entities = [
      // Per-user economy state. The owner is the Map key (a Principal), so it
      // is promoted from the key via manual mode and used as both the primary
      // key and the owner column. The controller reads all rows; a signed-in
      // caller reads only their own.
      OQL.Entity.manual<(Principal, Types.User)>("user", func () = users.entries(), "User", "id")
        .sample((Principal.fromText("aaaaa-aa"), { meCoins = 0; weCoins = 0; stakedMeCoins = 0 }))
        .payload("id", func ((p, _)) = p)
        .payload("meCoins", func ((_, u)) = u.meCoins)
        .payload("weCoins", func ((_, u)) = u.weCoins)
        .payload("stakedMeCoins", func ((_, u)) = u.stakedMeCoins)
        .ownedBy("id")
        .controllerOrScoped()
        .build(),
      // Work history. No owner column, so it is controller-only: private to
      // end users, readable by the platform controller.
      workEntries.toEntity("workEntry", "WorkEntry", "id")
        .sample({ id = 0; title = ""; description = ""; coinsEarned = 0; createdAt = 0 })
        .controllerOnly()
        .build(),
      // Governance proposals. Publicly readable (getProposals has no caller
      // check), so it is world-readable.
      proposals.toEntity("proposal", "Proposal", "id")
        .sample({ id = 0; title = ""; description = ""; creator = Principal.fromText("aaaaa-aa"); yesVotes = 0; noVotes = 0; status = #active; createdAt = 0 })
        .public_()
        .build(),
      // Votes. Per-user data with a voter owner column: the controller reads
      // all, a signed-in caller reads only their own votes.
      votes.toEntity("vote", "Vote", "proposalId")
        .sample({ proposalId = 0; voter = Principal.fromText("aaaaa-aa"); inFavor = false; createdAt = 0 })
        .ownedBy("voter")
        .controllerOrScoped()
        .build(),
      // Activity feed. No owner column, so it is controller-only.
      activity.toEntity("activity", "ActivityEvent", "id")
        .sample({ id = 0; kind = #workEarned; amount = 0; createdAt = 0 })
        .controllerOnly()
        .build(),
    ];
  });

  include ApiDocMixin();
};

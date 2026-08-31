import Types "../types/common";
import OQL "mo:caffeineai-oql";

module {
  public func _toRow(self : Types.ActivityKind) : OQL.Value =
    #text(switch self {
      case (#workEarned) "workEarned";
      case (#staked) "staked";
      case (#unstaked) "unstaked";
      case (#voted) "voted";
    });
};

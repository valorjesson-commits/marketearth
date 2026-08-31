import Types "../types/common";
import OQL "mo:caffeineai-oql";

module {
  public func _toRow(self : Types.ProposalStatus) : OQL.Value =
    #text(switch self {
      case (#active) "active";
      case (#closed) "closed";
    });
};

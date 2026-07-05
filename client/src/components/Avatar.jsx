import { memo } from "react";
import { getAvatarBackground, getInitials } from "../utils/chat";

const SIZE_CLASS = {
  small:   "avatar avatar--small",
  large:   "avatar avatar--large",
  default: "avatar",
};

/**
 * Pure presentational component — memoised so parent re-renders that pass
 * the same name/seed/size don't trigger a DOM update.
 */
const Avatar = memo(function Avatar({ name, seed, size = "default" }) {
  return (
    <div
      className={SIZE_CLASS[size] ?? SIZE_CLASS.default}
      style={{ background: getAvatarBackground(seed || name) }}
      aria-hidden="true"
      title={name}
    >
      {getInitials(name)}
    </div>
  );
});

export default Avatar;

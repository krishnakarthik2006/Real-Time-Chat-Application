import { getAvatarBackground, getInitials } from "../utils/chat";

export default function Avatar({ name, seed, small = false }) {
  return (
    <div
      className={`avatar ${small ? "avatar--small" : ""}`}
      style={{ background: getAvatarBackground(seed || name) }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}

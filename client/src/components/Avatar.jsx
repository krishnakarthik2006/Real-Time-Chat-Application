import { getAvatarBackground, getInitials } from "../utils/chat";

export default function Avatar({ name, seed, size = "default" }) {
  const cls = ["avatar", size === "small" ? "avatar--small" : size === "large" ? "avatar--large" : ""].filter(Boolean).join(" ");
  return (
    <div
      className={cls}
      style={{ background: getAvatarBackground(seed || name) }}
      aria-hidden="true"
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

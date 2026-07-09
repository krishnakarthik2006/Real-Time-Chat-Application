import { memo, useState } from "react";
import { Eye } from "lucide-react";
import Avatar from "./Avatar";

const ReadByList = memo(function ReadByList({ readBy, participants }) {
  const [open, setOpen] = useState(false);
  if (!readBy?.length) return null;

  const readers = readBy
    .map((id) => participants?.find((p) => p.id === id))
    .filter(Boolean);

  if (!readers.length) return null;

  return (
    <div className="read-by">
      <button
        type="button"
        className="read-by__trigger"
        onClick={() => setOpen((o) => !o)}
        title="Seen by"
      >
        <Eye size={11} />
        <span>{readers.length}</span>
      </button>
      {open && (
        <div className="read-by__list" role="tooltip">
          <p className="read-by__heading">Seen by</p>
          {readers.map((r) => (
            <div key={r.id} className="read-by__row">
              <Avatar name={r.name} seed={r.avatarSeed} size="small" />
              <span>{r.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ReadByList;

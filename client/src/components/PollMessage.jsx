import { memo } from "react";
import { BarChart2 } from "lucide-react";

const PollMessage = memo(function PollMessage({ poll, messageId, currentUserId, onVote, isOwn }) {
  if (!poll?.question) return null;

  const totalVotes = poll.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
  const userVotedIds = poll.options
    .filter((o) => o.votes?.includes(currentUserId))
    .map((o) => o.id);
  const hasVoted = userVotedIds.length > 0;
  const isClosed = poll.closedAt && new Date() > new Date(poll.closedAt);

  function handleVote(optionId) {
    if (isClosed) return;
    onVote?.(messageId, [optionId]);
  }

  return (
    <div className="poll-card">
      <div className="poll-card__header">
        <BarChart2 size={14} />
        <span className="poll-card__label">Poll</span>
        {isClosed && <span className="poll-card__closed">Closed</span>}
      </div>
      <p className="poll-card__question">{poll.question}</p>
      <div className="poll-card__options">
        {poll.options.map((opt) => {
          const count = opt.votes?.length || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const voted = userVotedIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              className={`poll-option${voted ? " poll-option--voted" : ""}${isClosed ? " poll-option--closed" : ""}`}
              onClick={() => handleVote(opt.id)}
              disabled={isClosed}
              aria-pressed={voted}
            >
              <div className="poll-option__bar" style={{ width: `${pct}%` }} aria-hidden="true" />
              <div className="poll-option__content">
                <span className="poll-option__text">{opt.text}</span>
                {(hasVoted || isClosed) && (
                  <span className="poll-option__pct">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="poll-card__total">
        {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        {!isClosed && !hasVoted && <span style={{ opacity: 0.6 }}> · tap to vote</span>}
      </p>
    </div>
  );
});

export default PollMessage;

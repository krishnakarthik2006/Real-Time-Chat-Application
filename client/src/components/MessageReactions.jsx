import { useState, useCallback } from "react";

const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '👎'];

export default function MessageReactions({ message, currentUser, onAddReaction, onRemoveReaction }) {
  const [showPicker, setShowPicker] = useState(false);
  
  const reactions = message.reactions || [];
  const userReactions = reactions.filter(r => r.userId === currentUser.id);

  const handleAddReaction = useCallback((emoji) => {
    if (onAddReaction) {
      onAddReaction(message.id, emoji);
    }
    setShowPicker(false);
  }, [message.id, onAddReaction]);

  const handleRemoveReaction = useCallback((emoji) => {
    if (onRemoveReaction) {
      onRemoveReaction(message.id, emoji);
    }
  }, [message.id, onRemoveReaction]);

  const getReactionCount = useCallback((emoji) => {
    return reactions.filter(r => r.emoji === emoji).length;
  }, [reactions]);

  const hasUserReacted = useCallback((emoji) => {
    return userReactions.some(r => r.emoji === emoji);
  }, [userReactions]);

  const getReactionUsers = useCallback((emoji) => {
    return reactions
      .filter(r => r.emoji === emoji)
      .map(r => r.userName)
      .slice(0, 3)
      .join(', ');
  }, [reactions]);

  if (reactions.length === 0 && !showPicker) {
    return (
      <div className="message-reactions">
        <button 
          className="reaction-button reaction-add"
          onClick={() => setShowPicker(true)}
          title="Add reaction"
        >
          😊
        </button>
      </div>
    );
  }

  return (
    <div className="message-reactions">
      {/* Existing reactions */}
      {reactions.length > 0 && (
        <div className="reactions-list">
          {REACTIONS.map(emoji => {
            const count = getReactionCount(emoji);
            if (count === 0) return null;
            
            const userReacted = hasUserReacted(emoji);
            const users = getReactionUsers(emoji);
            
            return (
              <button
                key={emoji}
                className={`reaction-item ${userReacted ? 'user-reacted' : ''}`}
                onClick={() => userReacted ? handleRemoveReaction(emoji) : handleAddReaction(emoji)}
                title={`${users}${count > 3 ? ` and ${count - 3} others` : ''}`}
              >
                <span className="reaction-emoji">{emoji}</span>
                <span className="reaction-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}
      
      {/* Reaction picker */}
      {showPicker && (
        <div className="reaction-picker">
          <div className="reaction-picker-header">
            <span>Add reaction</span>
            <button 
              className="reaction-picker-close"
              onClick={() => setShowPicker(false)}
            >
              ×
            </button>
          </div>
          <div className="reaction-picker-emojis">
            {REACTIONS.map(emoji => (
              <button
                key={emoji}
                className="reaction-picker-emoji"
                onClick={() => handleAddReaction(emoji)}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Add reaction button */}
      {!showPicker && (
        <button 
          className="reaction-button reaction-add"
          onClick={() => setShowPicker(true)}
          title="Add reaction"
        >
          +
        </button>
      )}

      <style jsx>{`
        .message-reactions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
          position: relative;
        }

        .reactions-list {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .reaction-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 1rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .reaction-item:hover {
          background: #e9ecef;
          transform: translateY(-1px);
        }

        .reaction-item.user-reacted {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .reaction-item.user-reacted:hover {
          background: #0056b3;
        }

        .reaction-emoji {
          font-size: 1rem;
          line-height: 1;
        }

        .reaction-count {
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 1rem;
          text-align: center;
        }

        .reaction-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          border: 1px solid #dee2e6;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .reaction-button:hover {
          background: #f8f9fa;
          transform: scale(1.1);
        }

        .reaction-add {
          font-size: 1rem;
          font-weight: bold;
        }

        .reaction-picker {
          position: absolute;
          bottom: 100%;
          left: 0;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          min-width: 200px;
        }

        .reaction-picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #dee2e6;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .reaction-picker-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0;
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.25rem;
        }

        .reaction-picker-close:hover {
          background: #f8f9fa;
        }

        .reaction-picker-emojis {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.25rem;
          padding: 0.5rem;
        }

        .reaction-picker-emoji {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border: none;
          background: none;
          cursor: pointer;
          border-radius: 0.25rem;
          font-size: 1.25rem;
          transition: background 0.2s ease;
        }

        .reaction-picker-emoji:hover {
          background: #f8f9fa;
        }

        .reaction-picker-emoji:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}

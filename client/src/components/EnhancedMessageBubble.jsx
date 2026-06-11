import { useState, useCallback, memo } from "react";
import Avatar from "./Avatar";
import MessageReactions from "./MessageReactions";
import { formatMessageTime, formatFileSize } from "../utils/chat";

const EnhancedMessageBubble = memo(function EnhancedMessageBubble({
  message,
  currentUser,
  isOwn,
  isEditing,
  onEdit,
  onDelete,
  onReply,
  onAddReaction,
  onRemoveReaction,
  highlighted = false,
  showAvatar = true,
  showTimestamp = true,
}) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleEdit = useCallback(() => {
    if (onEdit) onEdit(message);
  }, [message, onEdit]);

  const handleDelete = useCallback(() => {
    if (onDelete) onDelete(message);
  }, [message, onDelete]);

  const handleReply = useCallback(() => {
    if (onReply) onReply(message);
  }, [message, onReply]);

  const handleAddReaction = useCallback((messageId, emoji) => {
    if (onAddReaction) onAddReaction(messageId, emoji);
  }, [onAddReaction]);

  const handleRemoveReaction = useCallback((messageId, emoji) => {
    if (onRemoveReaction) onRemoveReaction(messageId, emoji);
  }, [onRemoveReaction]);

  const renderContent = useCallback(() => {
    if (message.isDeleted) {
      return (
        <div className="message-content deleted">
          <em>This message was deleted</em>
        </div>
      );
    }

    if (message.messageType === "file" && message.attachment) {
      return (
        <div className="message-content file-content">
          <div className="file-attachment">
            <div className="file-icon">
              {getFileIcon(message.attachment.type)}
            </div>
            <div className="file-info">
              <div className="file-name">{message.attachment.name}</div>
              <div className="file-size">{formatFileSize(message.attachment.size)}</div>
            </div>
            <a 
              href={message.attachment.url} 
              download={message.attachment.name}
              className="file-download"
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇️
            </a>
          </div>
          {message.content && (
            <div className="file-caption">{message.content}</div>
          )}
        </div>
      );
    }

    if (message.replyTo) {
      return (
        <div className="message-content reply-content">
          <div className="reply-preview">
            <span className="reply-author">
              {message.replyTo.sender?.name || "Unknown"}
            </span>
            <span className="reply-text">
              {message.replyTo.content || "Attachment"}
            </span>
          </div>
          <div className="reply-message">{message.content}</div>
        </div>
      );
    }

    return (
      <div className="message-content">
        {message.content}
      </div>
    );
  }, [message]);

  const getFileIcon = useCallback((type) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word')) return '📝';
    if (type?.includes('excel') || type?.includes('spreadsheet')) return '📊';
    if (type?.includes('text')) return '📄';
    return '📎';
  }, []);

  const getStatusIcon = useCallback(() => {
    if (!isOwn) return null;
    
    switch (message.status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return <span className="read-receipt">✓✓</span>;
      default:
        return null;
    }
  }, [isOwn, message.status]);

  return (
    <div 
      className={`message-bubble ${isOwn ? 'own' : 'other'} ${highlighted ? 'highlighted' : ''} ${isEditing ? 'editing' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwn && showAvatar && (
        <Avatar 
          name={message.sender?.name} 
          seed={message.sender?.avatarSeed}
          size="small"
        />
      )}
      
      <div className="message-wrapper">
        {/* Sender name for group messages */}
        {!isOwn && message.conversationType === "group" && (
          <div className="message-sender">
            {message.sender?.name}
          </div>
        )}
        
        {/* Message content */}
        <div className="message-container">
          {renderContent()}
          
          {/* Message status and timestamp */}
          {(showTimestamp || isOwn) && (
            <div className="message-meta">
              {showTimestamp && (
                <span className="message-time">
                  {formatMessageTime(message.createdAt)}
                </span>
              )}
              {getStatusIcon() && (
                <span className="message-status">
                  {getStatusIcon()}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Message actions */}
        {showActions && !message.isDeleted && (
          <div className="message-actions">
            <button 
              onClick={handleReply}
              className="action-button"
              title="Reply"
            >
              ↩️
            </button>
            {isOwn && (
              <>
                <button 
                  onClick={handleEdit}
                  className="action-button"
                  title="Edit"
                  disabled={!!message.editHistory}
                >
                  ✏️
                </button>
                <button 
                  onClick={handleDelete}
                  className="action-button"
                  title="Delete"
                >
                  🗑️
                </button>
              </>
            )}
            <button 
              onClick={() => setShowReactions(!showReactions)}
              className="action-button"
              title="Add reaction"
            >
              😊
            </button>
          </div>
        )}
        
        {/* Message reactions */}
        <MessageReactions
          message={message}
          currentUser={currentUser}
          onAddReaction={handleAddReaction}
          onRemoveReaction={handleRemoveReaction}
        />
        
        {/* Edit history indicator */}
        {message.editHistory && (
          <div className="edit-indicator">
            <small>edited {formatMessageTime(message.updatedAt)}</small>
          </div>
        )}
      </div>

      <style jsx>{`
        .message-bubble {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: background-color 0.2s ease;
        }

        .message-bubble.own {
          flex-direction: row-reverse;
          background: #f8f9fa;
        }

        .message-bubble.other {
          background: transparent;
        }

        .message-bubble.highlighted {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
        }

        .message-bubble.editing {
          background: #e7f3ff;
          border: 1px solid #b3d9ff;
        }

        .message-wrapper {
          max-width: 70%;
          min-width: 0;
        }

        .message-bubble.own .message-wrapper {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .message-sender {
          font-size: 0.875rem;
          font-weight: 600;
          color: #495057;
          margin-bottom: 0.25rem;
        }

        .message-container {
          background: white;
          border-radius: 0.75rem;
          padding: 0.75rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .message-bubble.own .message-container {
          background: #007bff;
          color: white;
        }

        .message-content {
          word-wrap: break-word;
          white-space: pre-wrap;
          line-height: 1.4;
        }

        .message-content.deleted {
          font-style: italic;
          opacity: 0.7;
        }

        .file-content {
          min-width: 200px;
        }

        .file-attachment {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .message-bubble.own .file-attachment {
          background: rgba(255, 255, 255, 0.2);
        }

        .file-icon {
          font-size: 1.5rem;
        }

        .file-info {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 0.875rem;
          opacity: 0.7;
        }

        .file-download {
          text-decoration: none;
          padding: 0.25rem 0.5rem;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 0.25rem;
          transition: background 0.2s ease;
        }

        .file-download:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .file-caption {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .reply-content {
          border-left: 3px solid #007bff;
          padding-left: 0.75rem;
        }

        .message-bubble.own .reply-content {
          border-left-color: rgba(255, 255, 255, 0.5);
        }

        .reply-preview {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }

        .message-bubble.own .reply-preview {
          background: rgba(255, 255, 255, 0.2);
        }

        .reply-author {
          font-weight: 600;
        }

        .reply-text {
          opacity: 0.8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .reply-message {
          margin-top: 0.5rem;
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .message-bubble.own .message-meta {
          justify-content: flex-end;
        }

        .message-time {
          color: inherit;
        }

        .message-status {
          display: flex;
          align-items: center;
        }

        .read-receipt {
          color: #28a745;
        }

        .message-actions {
          display: flex;
          gap: 0.25rem;
          margin-top: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .message-bubble:hover .message-actions {
          opacity: 1;
        }

        .action-button {
          background: rgba(0, 0, 0, 0.1);
          border: none;
          border-radius: 0.25rem;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .action-button:hover {
          background: rgba(0, 0, 0, 0.2);
          transform: translateY(-1px);
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .edit-indicator {
          margin-top: 0.25rem;
          opacity: 0.6;
          font-size: 0.75rem;
        }

        @media (max-width: 768px) {
          .message-wrapper {
            max-width: 85%;
          }
        }
      `}</style>
    </div>
  );
});

export default EnhancedMessageBubble;

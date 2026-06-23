import { useState, useCallback, useMemo } from "react";
import { formatMessageTime } from "../utils/chat";

export default function EnhancedSearch({ 
  conversations, 
  messages, 
  currentUser, 
  onResultSelect,
  placeholder = "Search conversations and messages..."
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all, conversations, messages
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [showFilters, setShowFilters] = useState(false);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const now = new Date();
    
    const getDateFilter = (date) => {
      if (!date) return false;
      const messageDate = new Date(date);
      
      switch (dateFilter) {
        case "today":
          return messageDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return messageDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return messageDate >= monthAgo;
        default:
          return true;
      }
    };

    const results = [];

    // Search conversations
    if (filter === "all" || filter === "conversations") {
      conversations.forEach(conversation => {
        const title = conversation.name || "";
        const participants = conversation.participants || [];
        const lastMessage = conversation.lastMessage;
        
        const matchesTitle = title.toLowerCase().includes(searchTerm);
        const matchesParticipants = participants.some(p => 
          p.name.toLowerCase().includes(searchTerm)
        );
        const matchesLastMessage = lastMessage?.content?.toLowerCase().includes(searchTerm);
        
        if (matchesTitle || matchesParticipants || matchesLastMessage) {
          results.push({
            type: 'conversation',
            id: conversation.id,
            conversation,
            title: conversation.name,
            preview: lastMessage?.content || "No messages",
            timestamp: lastMessage?.createdAt,
            relevance: matchesTitle ? 3 : matchesParticipants ? 2 : 1
          });
        }
      });
    }

    // Search messages
    if (filter === "all" || filter === "messages") {
      Object.entries(messages).forEach(([conversationId, conversationMessages]) => {
        const conversation = conversations.find(c => c.id === conversationId);
        
        conversationMessages.forEach(message => {
          if (!getDateFilter(message.createdAt)) return;
          
          const matchesContent = message.content?.toLowerCase().includes(searchTerm);
          const matchesSender = message.sender?.name?.toLowerCase().includes(searchTerm);
          
          if (matchesContent || matchesSender) {
            results.push({
              type: 'message',
              id: message.id,
              conversationId,
              conversation,
              message,
              title: message.sender?.name || "Unknown",
              preview: message.content || "",
              timestamp: message.createdAt,
              relevance: matchesContent ? 3 : matchesSender ? 2 : 1
            });
          }
        });
      });
    }

    // Sort by relevance and timestamp
    return results.sort((a, b) => {
      if (a.relevance !== b.relevance) {
        return b.relevance - a.relevance;
      }
      return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    });
  }, [query, filter, dateFilter, conversations, messages]);

  const handleResultClick = useCallback((result) => {
    if (onResultSelect) {
      onResultSelect(result);
    }
  }, [onResultSelect]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setFilter("all");
    setDateFilter("all");
  }, []);

  const highlightText = useCallback((text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index}>{part}</mark> : part
    );
  }, []);

  return (
    <div className="enhanced-search">
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="search-input"
          />
          {query && (
            <button onClick={clearSearch} className="search-clear">
              ×
            </button>
          )}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`search-filters-toggle ${showFilters ? 'active' : ''}`}
          >
            ⚙️
          </button>
        </div>

        {showFilters && (
          <div className="search-filters">
            <div className="filter-group">
              <label>Search in:</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="conversations">Conversations</option>
                <option value="messages">Messages</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Date:</label>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {query && (
        <div className="search-results">
          <div className="search-results-header">
            <span>{filteredResults.length} results</span>
            {filteredResults.length > 0 && (
              <span className="search-results-info">
                {filter === "all" ? "All" : filter === "conversations" ? "Conversations" : "Messages"} • 
                {dateFilter === "all" ? "All time" : dateFilter === "today" ? "Today" : dateFilter === "week" ? "This week" : "This month"}
              </span>
            )}
          </div>
          
          {filteredResults.length === 0 ? (
            <div className="search-no-results">
              <div className="no-results-icon">🔍</div>
              <div>No results found</div>
              <div className="no-results-hint">Try different keywords or filters</div>
            </div>
          ) : (
            <div className="search-results-list">
              {filteredResults.map(result => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="search-result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="result-icon">
                    {result.type === 'conversation' ? '💬' : '📄'}
                  </div>
                  
                  <div className="result-content">
                    <div className="result-title">
                      {result.type === 'conversation' ? (
                        highlightText(result.title, query)
                      ) : (
                        <>
                          {highlightText(result.title, query)} 
                          <span className="result-conversation">
                            in {result.conversation?.name || 'Unknown'}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="result-preview">
                      {highlightText(result.preview, query)}
                    </div>
                    
                    {result.timestamp && (
                      <div className="result-timestamp">
                        {formatMessageTime(result.timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .enhanced-search {
          position: relative;
          width: 100%;
        }

        .search-container {
          position: relative;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          flex: 1;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          border: 1px solid #dee2e6;
          border-radius: 0.5rem;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .search-input:focus {
          border-color: #007bff;
        }

        .search-clear {
          position: absolute;
          right: 2.5rem;
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.25rem;
          color: #6c757d;
        }

        .search-clear:hover {
          color: #dc3545;
        }

        .search-filters-toggle {
          position: absolute;
          right: 0.5rem;
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.25rem;
          transition: background 0.2s ease;
        }

        .search-filters-toggle:hover,
        .search-filters-toggle.active {
          background: #f8f9fa;
        }

        .search-filters {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-top: none;
          border-radius: 0 0 0.5rem 0.5rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .filter-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #495057;
        }

        .filter-group select {
          padding: 0.25rem 0.5rem;
          border: 1px solid #ced4da;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #dee2e6;
          border-top: none;
          border-radius: 0 0 0.5rem 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
        }

        .search-results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #dee2e6;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .search-results-info {
          font-weight: normal;
          color: #6c757d;
        }

        .search-no-results {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
        }

        .no-results-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          opacity: 0.5;
        }

        .no-results-hint {
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .search-results-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .search-result-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: background 0.2s ease;
          border-bottom: 1px solid #f8f9fa;
        }

        .search-result-item:hover {
          background: #f8f9fa;
        }

        .result-icon {
          font-size: 1.25rem;
          margin-top: 0.125rem;
        }

        .result-content {
          flex: 1;
          min-width: 0;
        }

        .result-title {
          font-weight: 600;
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .result-conversation {
          font-weight: normal;
          color: #6c757d;
          font-size: 0.875rem;
        }

        .result-preview {
          color: #6c757d;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .result-timestamp {
          font-size: 0.75rem;
          color: #adb5bd;
        }

        :global(mark) {
          background: #fff3cd;
          color: #856404;
          padding: 0.125rem;
          border-radius: 0.125rem;
        }
      `}</style>
    </div>
  );
}

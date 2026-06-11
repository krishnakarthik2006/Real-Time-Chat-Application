import { useState, useCallback, useRef } from "react";
import { formatFileSize } from "../utils/chat";

export default function FileShare({ onFileSelect, disabled = false }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [disabled]);

  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = useCallback((file) => {
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('File type not supported');
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewFile({
          file,
          preview: e.target.result,
          name: file.name,
          size: file.size,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewFile({
        file,
        preview: null,
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  }, []);

  const handleSend = useCallback(() => {
    if (previewFile && onFileSelect) {
      onFileSelect(previewFile.file);
      setPreviewFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [previewFile, onFileSelect]);

  const handleCancel = useCallback(() => {
    setPreviewFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const getFileIcon = useCallback((type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('text')) return '📄';
    return '📎';
  }, []);

  if (previewFile) {
    return (
      <div className="file-preview">
        <div className="file-preview-content">
          {previewFile.preview ? (
            <img 
              src={previewFile.preview} 
              alt={previewFile.name}
              className="file-preview-image"
            />
          ) : (
            <div className="file-preview-icon">
              <span className="file-icon">{getFileIcon(previewFile.type)}</span>
            </div>
          )}
          <div className="file-preview-info">
            <div className="file-name">{previewFile.name}</div>
            <div className="file-size">{formatFileSize(previewFile.size)}</div>
          </div>
        </div>
        <div className="file-preview-actions">
          <button 
            className="primary-button"
            onClick={handleSend}
            disabled={disabled}
          >
            Send
          </button>
          <button 
            className="secondary-button"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
        
        <style jsx>{`
          .file-preview {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1rem;
          }
          
          .file-preview-content {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          
          .file-preview-image {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 0.25rem;
          }
          
          .file-preview-icon {
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #e9ecef;
            border-radius: 0.25rem;
          }
          
          .file-icon {
            font-size: 1.5rem;
          }
          
          .file-preview-info {
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
            color: #6c757d;
            font-size: 0.875rem;
          }
          
          .file-preview-actions {
            display: flex;
            gap: 0.5rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="file-share">
      <div
        className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          disabled={disabled}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          style={{ display: 'none' }}
        />
        
        <div className="file-drop-content">
          <div className="file-drop-icon">📎</div>
          <div className="file-drop-text">
            <div>Drag & drop a file here or</div>
            <button 
              className="file-select-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              browse
            </button>
          </div>
          <div className="file-drop-hint">
            Images, PDFs, Documents (Max 10MB)
          </div>
        </div>
      </div>

      <style jsx>{`
        .file-share {
          margin: 1rem 0;
        }

        .file-drop-zone {
          border: 2px dashed #dee2e6;
          border-radius: 0.5rem;
          padding: 2rem;
          text-align: center;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .file-drop-zone:hover {
          border-color: #007bff;
          background: #f8f9ff;
        }

        .file-drop-zone.drag-active {
          border-color: #007bff;
          background: #e7f3ff;
          transform: scale(1.02);
        }

        .file-drop-zone.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .file-drop-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .file-drop-icon {
          font-size: 2rem;
          opacity: 0.7;
        }

        .file-drop-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .file-select-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.875rem;
          text-decoration: underline;
        }

        .file-select-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .file-select-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .file-drop-hint {
          font-size: 0.75rem;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
}

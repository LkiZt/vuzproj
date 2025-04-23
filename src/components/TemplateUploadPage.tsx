import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import '../styles/App.css';

interface HighlightedText {
  id: string;
  text: string;
  name: string;
  range: {
    start: number;
    end: number;
  };
}

interface TemplateUploadResponse {
  htmlURL: string;
  templateName: string;
}

const ErrorModal: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <h3 style={{ color: '#d32f2f', marginTop: 0 }}>Ошибка</h3>
        <p>{message}</p>
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            float: 'right',
          }}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

const TemplateUploadPage: React.FC = () => {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [highlightedTexts, setHighlightedTexts] = useState<HighlightedText[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [templateName, setTemplateName] = useState<string>('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  const getTextNodes = (node: Node | null): Node[] => {
    if (!node) return [];
    const textNodes: Node[] = [];
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      if (currentNode.textContent?.trim()) {
        textNodes.push(currentNode);
      }
    }
    return textNodes;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    // Проверка типа файла
    const validTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Неподдерживаемый формат файла. Пожалуйста, загрузите DOCX или PDF.');
      setShowErrorModal(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://85.159.226.224:5000/api/template/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Ошибка HTTP: ${response.status}`);
      }

      const data: TemplateUploadResponse = await response.json();

      if (data && data.htmlURL) {
        const htmlResponse = await fetch(data.htmlURL);
        const html = await htmlResponse.text();
        setUploadedUrl(data.htmlURL);
        setFileUploaded(true);
        setHighlightedTexts([]);
        setTemplateName(data.templateName);
        setTimeout(() => setHtmlContent(html), 0);
      } else {
        throw new Error('Не удалось получить ссылку на HTML');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке файла');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === '') return;
  
      const range = selection.getRangeAt(0);
      if (!contentRef.current?.contains(range.commonAncestorContainer)) return;
  
      const selectedText = range.toString();
      const textNodes = getTextNodes(contentRef.current);
      let charCount = 0;
      let startOffset = -1;
      let endOffset = -1;
  
      for (const node of textNodes) {
        const nodeLength = node.textContent?.length || 0;
  
        if (node === range.startContainer) startOffset = charCount + range.startOffset;
        if (node === range.endContainer) endOffset = charCount + range.endOffset;
  
        charCount += nodeLength;
  
        if (startOffset !== -1 && endOffset !== -1) break;
      }
  
      if (startOffset !== -1 && endOffset !== -1) {
        const isTextAlreadyHighlighted = highlightedTexts.some(
          (h) =>
            h.text === selectedText &&
            h.range.start === startOffset &&
            h.range.end === endOffset
        );
  
        if (isTextAlreadyHighlighted) {
          return;
        }
  
        const id = `highlight-${Date.now()}`;
        setHighlightedTexts((prev) => [
          ...prev,
          {
            id,
            text: selectedText,
            name: 'Не задано',
            range: { start: startOffset, end: endOffset },
          },
        ]);
      }
    };
  
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [highlightedTexts]);

  const handleNameChange = (id: string, newName: string) => {
    setHighlightedTexts(prev =>
      prev.map(text => text.id === id ? { ...text, name: newName } : text)
    );
    setEditingId(null);
    setTempName('');
  };

  const handleDelete = (id: string) => {
    setHighlightedTexts(prev => prev.filter(text => text.id !== id));
  };

  const handleSaveReport = async () => {
    if (!templateName) {
      setError('Не получено имя шаблона');
      setShowErrorModal(true);
      return;
    }

    if (highlightedTexts.length === 0) {
      setError('Нет выделенных полей для сохранения');
      setShowErrorModal(true);
      return;
    }

    const invalidField = highlightedTexts.find(text => text.name.trim() === 'Не задано');
    if (invalidField) {
      setError('У всех выделенных полей должно быть задано название');
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const metadataJson = highlightedTexts.reduce((acc, text) => {
        if (text.name.trim() && text.name !== 'Не задано') {
          acc[text.name] = text.text;
        }
        return acc;
      }, {} as Record<string, string>);

      const formData = new FormData();
      formData.append('templateName', templateName);
      formData.append('metadataJson', JSON.stringify(metadataJson));

      const response = await fetch('http://85.159.226.224:5000/api/template/submit-data', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.title || errorData.message || `Ошибка HTTP: ${response.status}`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при сохранении отчета');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  return (
    <div className="upload-page">
      {showErrorModal && error && (
        <ErrorModal 
          message={error} 
          onClose={() => setShowErrorModal(false)} 
        />
      )}
      
      <div className="upload-container">
        {!fileUploaded && (
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''}`}
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border 0.3s ease, background-color 0.3s ease',
              backgroundColor: '#f9f9f9',
            }}
          >
            <input {...getInputProps()} />
            <p
              style={{
                backgroundColor: 'black',
                color: 'white',
                fontSize: '48px',
                width: '50px',
                height: '50px',
                borderRadius: '15px',
                paddingTop: '5px',
                margin: '0 auto 20px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                transition: 'transform 0.2s ease',
              }}
            >
              +
            </p>
            <p
              style={{
                fontSize: '20px',
                color: '#777',
                marginBottom: '20px',
                fontWeight: '700',
              }}
            >
              Перетащите DOCX файл сюда или кликните для выбора
            </p>
          </div>
        )}

        {loading && <div className="loading-indicator">Загрузка...</div>}

        {fileUploaded && (
          <div className="content-container">
            <div
              className="html-content"
              ref={contentRef}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        )}
      </div>

      {highlightedTexts.length > 0 && (
        <div className="highlights-list" style={{ marginTop: '20px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>
            Выделенные поля:
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {highlightedTexts.map(h => (
              <li
                key={h.id}
                style={{
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '10px',
                    flexGrow: 1,
                    marginRight: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    wordBreak: 'break-word',
                  }}
                >
                  {editingId === h.id ? (
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      autoFocus
                      onBlur={(e) => {
                        const newName = e.currentTarget.textContent || 'Не задано';
                        handleNameChange(h.id, newName.trim());
                        setEditingId(null);
                      }}
                      style={{
                        fontWeight: 'bold',
                        color: h.name === 'Не задано' ? 'gray' : 'black',
                        borderBottom: '1px dashed #aaa',
                        outline: 'none',
                        padding: '2px',
                        cursor: 'text'
                      }}
                    >
                      {h.name}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        color: h.name === 'Не задано' ? 'gray' : 'black',
                      }}
                      onClick={() => setEditingId(h.id)}
                    >
                      {h.name}
                    </span>
                  )}
                  <span style={{ marginLeft: '5px', width: '500px' }}>: {h.text}</span>
                </div>

                <button
                  onClick={() => handleDelete(h.id)}
                  title="Удалить"
                  style={{
                    width: '42px',
                    height: '46px',
                    borderRadius: '8px',
                    backgroundColor: '#f2f2f2',
                    border: '1px solid #ccc',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    marginTop: '0',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#e6e6e6';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#f2f2f2';
                  }}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={handleSaveReport}
            disabled={loading}
            className="save-report-button"
            style={{
              display: 'block',
              margin: '20px auto 0',
              backgroundColor: loading ? '#d3d3d3' : '#4CAF50',
              color: 'white',
              padding: '12px 24px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              transition: 'background-color 0.3s ease, transform 0.1s ease',
              fontWeight: 500,
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#45a049';
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#4CAF50';
            }}
            onMouseDown={(e) => {
              if (!loading) e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              if (!loading) e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {loading ? 'Сохранение...' : 'Сохранить отчет'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateUploadPage;
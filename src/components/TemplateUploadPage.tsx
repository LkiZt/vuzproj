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
  isTable: boolean;
  isDefault: boolean;
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

const TemplateNameModal: React.FC<{ 
  onConfirm: (name: string) => void, 
  onCancel: () => void 
}> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');

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
        <h3 style={{ marginTop: 0 }}>Введите название шаблона</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            width: '100%',
            marginBottom: '15px'
          }}
          placeholder="Название шаблона"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f5f5f5',
              color: '#333',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
          <button
            onClick={() => onConfirm(name)}
            disabled={!name.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Подтвердить
          </button>
        </div>
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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [docType, setDocType] = useState<string>('отчет');
  const [taxPercent, setTaxPercent] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState<string>('');
  const [showTemplateNameModal, setShowTemplateNameModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const isInTable = (node: Node): boolean => {
    let parent = node.parentNode;
    while (parent) {
      if (parent.nodeName === 'TABLE') {
        return true;
      }
      parent = parent.parentNode;
    }
    return false;
  };

  const handleTemplateNameConfirm = async (name: string) => {
    setTemplateName(name);
    setShowTemplateNameModal(false);
    
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('templateName', name);

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
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    const validTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Неподдерживаемый формат файла. Пожалуйста, загрузите DOCX или PDF.');
      setShowErrorModal(true);
      return;
    }

    setSelectedFile(file);
    setShowTemplateNameModal(true);
  }, []);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === '') return;
  
      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;
      if (!contentRef.current?.contains(commonAncestor)) return;
  
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
            isTable: isInTable(commonAncestor),
            isDefault: false
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

  const toggleDefault = (id: string) => {
    setHighlightedTexts(prev =>
      prev.map(text => 
        text.id === id ? { ...text, isDefault: !text.isDefault } : text
      )
    );
  };

  const handleNoTax = () => {
    setTaxPercent(0);
  };

  const handleSaveReport = async () => {
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
          let fieldName = text.name;
          if (text.isTable) fieldName = `[t]${fieldName}`;
          if (text.isDefault) fieldName = `[d]${fieldName}`;
          acc[fieldName] = text.text;
        }
        return acc;
      }, {} as Record<string, string>);

      const formData = new FormData();
      formData.append('templateName', templateName);
      formData.append('docType', docType);
      formData.append('metadataJson', JSON.stringify(metadataJson));
      formData.append('taxPercent', taxPercent?.toString() || '0');

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
      
      {showTemplateNameModal && (
        <TemplateNameModal
          onConfirm={handleTemplateNameConfirm}
          onCancel={() => {
            setShowTemplateNameModal(false);
            setSelectedFile(null);
          }}
        />
      )}
      
      <div className="upload-container">
        {!fileUploaded && (
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Отпустите файл, чтобы загрузить его</p>
            ) : (
              <p>Перетащите сюда файл DOCX или PDF, или кликните для выбора</p>
            )}
          </div>
        )}

        {loading && <p>Загрузка...</p>}

        {fileUploaded && (
          <>
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>Параметры документа</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Название шаблона:
                </label>
                <div style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #eee',
                  backgroundColor: '#fafafa',
                  width: '100%',
                  maxWidth: '300px'
                }}>
                  {templateName}
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Тип документа:
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    width: '100%',
                    maxWidth: '300px'
                  }}
                >
                  <option value="акт">Акт</option>
                  <option value="отчет">Отчет</option>
                  <option value="заявка">Заявка</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Процент налога:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    value={taxPercent || ''}
                    onChange={(e) => setTaxPercent(e.target.value ? Number(e.target.value) : null)}
                    min="0"
                    max="100"
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      width: '100px'
                    }}
                    placeholder="Введите %"
                  />
                  <button
                    onClick={handleNoTax}
                    style={{
                      padding: '8px 15px',
                      backgroundColor: taxPercent === 0 ? '#4caf50' : '#f5f5f5',
                      color: taxPercent === 0 ? 'white' : '#333',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Нет процента налога {taxPercent === 0 ? '✓' : ''}
                  </button>
                </div>
              </div>
            </div>

            <div 
              ref={contentRef} 
              className="html-content" 
              dangerouslySetInnerHTML={{ __html: htmlContent }} 
              style={{ border: '1px solid #ccc', padding: '10px', maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}
            />
            
            <h3>Выделенные поля</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {highlightedTexts.map(({ id, text, name, isTable, isDefault }) => (
                <li key={id} style={{ 
                  marginBottom: '15px', 
                  padding: '15px', 
                  border: '1px solid #eee', 
                  borderRadius: '8px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ marginBottom: '5px' }}><b>Текст:</b> {text}</div>
                  <div style={{ marginBottom: '5px' }}><b>Тип:</b> {isTable ? 'Таблица' : 'Обычный текст'}</div>
                  {editingId === id ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                      <input 
                        value={tempName} 
                        onChange={(e) => setTempName(e.target.value)} 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tempName.trim()) {
                            handleNameChange(id, tempName.trim());
                          }
                          if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        autoFocus
                        style={{
                          padding: '5px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          flexGrow: 1
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (tempName.trim()) {
                            handleNameChange(id, tempName.trim());
                          }
                        }}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Сохранить
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: '5px' }}><b>Название:</b> {name}</div>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <button 
                          onClick={() => toggleDefault(id)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: isDefault ? '#4caf50' : '#f5f5f5',
                            color: isDefault ? 'white' : '#333',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Базовые значения {isDefault ? '✓' : ''}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => {
                            setEditingId(id);
                            setTempName(name === 'Не задано' ? '' : name);
                          }}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Изменить
                        </button>
                        <button 
                          onClick={() => handleDelete(id)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Удалить
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <button 
              onClick={handleSaveReport} 
              disabled={loading}
              style={{
                backgroundColor: '#1976d2',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                marginTop: '20px'
              }}
            >
              Сохранить отчет
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateUploadPage;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Executor {
  companyName: string;
}

interface Customer {
  companyName: string;
}

interface TemplateItem {
  id: number;
  fileName: string;
  docType: string;
  uploadedAt: string;
}

type DropdownName = 'organization' | 'legalEntity' | 'documentTitle' | 'documentType';

interface ApiResponse {
  message: string;
  documentName: string;
  url: string;
  tableRowFormat: string;
  defaultFields: Record<string, string>;
  remainingFields: string[];
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [remainingFields, setRemainingFields] = useState<string[]>([]);
  const [tableFields, setTableFields] = useState<string[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [tableRows, setTableRows] = useState<number[]>([0]);
  const [defaultFields, setDefaultFields] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);

  const [executors, setExecutors] = useState<Executor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);

  const [organization, setOrganization] = useState('');
  const [legalEntity, setLegalEntity] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentType, setDocumentType] = useState('');

  const [openDropdown, setOpenDropdown] = useState<DropdownName | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFor, setModalFor] = useState<DropdownName | null>(null);
  const [modalInput, setModalInput] = useState('');

  const dropdownData = {
    organization: {
      label: 'Юр. лицо организации',
      options: executors.map((e) => e.companyName),
      onSelect: setOrganization,
    },
    legalEntity: {
      label: 'Юр. лицо заказчика',
      options: customers.map((c) => c.companyName),
      onSelect: setLegalEntity,
    },
    documentTitle: {
      label: 'Название',
      options: templates.map((t) => t.fileName),
      onSelect: setDocumentTitle,
    },
    documentType: {
      label: 'Тип документа',
      options: ['Акт', 'Отчёт', 'Заявка'],
      onSelect: setDocumentType,
    },
  } as const;

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
      navigate('/');
      return;
    }
    setToken(storedToken);

    fetch('http://85.159.226.224:5000/api/document/pre-info')
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка при загрузке данных');
        return res.json();
      })
      .then((data) => {
        setExecutors(data.executors || []);
        setCustomers(data.customers || []);
        setTemplates(data.templates || []);
      })
      .catch((err) => {
        console.error('Ошибка запроса:', err);
        setExecutors([]);
        setCustomers([]);
        setTemplates([]);
      })
      .finally(() => setLoading(false));

    const handleDocumentClick = () => setOpenDropdown(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [navigate]);

  const toggleDropdown = (name: DropdownName) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const handleSelectOption = (name: DropdownName, value: string) => {
    dropdownData[name].onSelect(value);
    setOpenDropdown(null);
    setGeneratedUrl(null);
    setRemainingFields([]);
    setTableFields([]);
    setTableRows([0]);
  };

  const openAddModal = (name: DropdownName) => {
    setModalFor(name);
    setModalInput('');
    setModalOpen(true);
    setOpenDropdown(null);
  };

  const registerExecutor = async (companyName: string) => {
    if (!companyName.trim()) {
      throw new Error('Название компании не может быть пустым.');
    }

    const formData = new FormData();
    formData.append('CompanyName', companyName);

    const response = await fetch('http://85.159.226.224:5000/api/executor/register', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Ошибка при регистрации исполнителя: ${errorData.title || 'Неизвестная ошибка'}`);
    }

    return response.json();
  };

  const registerCustomer = async (companyName: string) => {
    if (!companyName.trim()) {
      throw new Error('Название компании не может быть пустым.');
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('Токен не найден. Пожалуйста, выполните вход.');
    }

    const formData = new FormData();
    formData.append('CompanyName', companyName);

    const response = await fetch('http://85.159.226.224:5000/api/customer/register', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Ошибка при регистрации заказчика: ${errorData.title || 'Неизвестная ошибка'}`);
    }

    return response.json();
  };

  const handleModalSubmit = async () => {
    const trimmedInput = modalInput.trim();
    if (!trimmedInput) {
      alert('Название компании не может быть пустым.');
      return;
    }

    try {
      if (modalFor === 'organization') {
        await registerExecutor(trimmedInput);
        setExecutors((prev) => [...prev, { companyName: trimmedInput }]);
        setOrganization(trimmedInput);
      } else if (modalFor === 'legalEntity') {
        await registerCustomer(trimmedInput);
        setCustomers((prev) => [...prev, { companyName: trimmedInput }]);
        setLegalEntity(trimmedInput);
      }
      setModalOpen(false);
    } catch (error: any) {
      alert(error.message || 'Ошибка при добавлении.');
      console.error(error);
    }
  };

  const addTableRow = () => {
    setTableRows(prev => [...prev, prev.length]);
  };

  const removeTableRow = (index: number) => {
    if (tableRows.length > 1) {
      setTableRows(prev => prev.filter(i => i !== index));
      
      const newFieldValues = {...fieldValues};
      tableFields.forEach(field => {
        delete newFieldValues[`${field}_${index}`];
      });
      setFieldValues(newFieldValues);
    }
  };

  const generateDocument = async () => {
  if (!organization || !legalEntity || !documentTitle || !documentType) {
    alert('Пожалуйста, заполните все поля');
    return;
  }

  try {
    const params = new URLSearchParams({
      executorCompany: organization,
      customerCompany: legalEntity,
      templateName: documentTitle,
      docType: documentType,
    });

    const response = await fetch(`http://85.159.226.224:5000/api/document/generate?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Ошибка при генерации документа');
    }

    const data: ApiResponse = await response.json();
    setGeneratedUrl(data.url);
    setDocumentName(data.documentName); // Сохраняем имя документа
    setDefaultFields(data.defaultFields || {});
    
    const newFieldValues: Record<string, string> = {};
    
    if (data.remainingFields && Array.isArray(data.remainingFields)) {
      setRemainingFields(data.remainingFields);
      data.remainingFields.forEach(field => {
        newFieldValues[field] = fieldValues[field] || '';
      });
    } else {
      setRemainingFields([]);
    }

    if (data.tableRowFormat) {
      const tableFields = data.tableRowFormat.split(',');
      setTableFields(tableFields);
      setTableRows([0]);
      tableFields.forEach(field => {
        newFieldValues[`${field}_0`] = fieldValues[`${field}_0`] || '';
      });
    } else {
      setTableFields([]);
      setTableRows([0]);
    }

    setFieldValues(newFieldValues);

  } catch (error) {
    console.error('Ошибка при генерации документа:', error);
    alert('Произошла ошибка при генерации документа');
  }
};

  const handleFieldValueChange = (field: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDefaultFieldEdit = (field: string) => {
    setEditingField(field);
  };

  const handleDefaultFieldSave = (field: string, value: string) => {
    setDefaultFields(prev => ({
      ...prev,
      [field]: value
    }));
    setEditingField(null);
  };

const submitAndDownloadDocument = async () => {
  try {
    if (!documentName) {
      alert('Документ не сгенерирован');
      return;
    }

    // Создаем объект метаданных
    const metadata: Record<string, string> = {};

    // Добавляем дефолтные поля
    Object.entries(defaultFields).forEach(([key, value]) => {
      metadata[key] = value;
    });

    // Добавляем дополнительные поля
    remainingFields.forEach(field => {
      metadata[field] = fieldValues[field] || '';
    });

    // Добавляем табличные данные (без суффиксов)
    tableRows.forEach(rowIndex => {
      tableFields.forEach(field => {
        const fieldKey = `${field}_${rowIndex}`;
        metadata[field] = fieldValues[fieldKey] || ''; // Используем оригинальное имя поля
      });
    });

    // Формируем FormData
    const formData = new FormData();
    formData.append('documentName', documentName);
    formData.append('metadataJson', JSON.stringify(metadata));

    console.log('Отправляемые данные:', {
      documentName,
      metadata
    });

    // Отправляем запрос на обновление
    const updateResponse = await fetch('http://85.159.226.224:5000/api/document/update', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(errorData.message || 'Ошибка при обновлении документа');
    }

    // Скачиваем документ
    const downloadResponse = await fetch(`http://85.159.226.224:5000/api/document/download?documentName=${encodeURIComponent(documentName)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!downloadResponse.ok) {
      throw new Error('Ошибка при скачивании документа');
    }

    // Создаем ссылку для скачивания
    const blob = await downloadResponse.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = documentName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

  } catch (error) {
    console.error('Ошибка:', error);
    alert(`Произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
};

  const allFieldsFilled = organization && legalEntity && documentTitle && documentType;

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!token) return null;

  return (
    <div className="page-container" style={{ fontFamily: "'Istok Web', sans-serif" }}>
      <div
        className="home-content"
        style={{ maxWidth: 1520, margin: '0 auto', padding: 20 }}
      >
        <header className="header">
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>Панель управления</h1>
        </header>
        <h2 className="title" style={{ fontSize: '24px', fontWeight: '600', color: '#444', marginBottom: '30px' }}>Создание отчета</h2>

        {/* Форма выбора параметров документа */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 35,
          padding: '30px 0',
          marginBottom: 30,
          borderTop: '2px solid #8a8a8a',
          borderBottom: '2px solid #8a8a8a',
          borderRadius: '8px 8px 0 0',
          width: '1520px',
          boxSizing: 'border-box',
          userSelect: 'none',
          backgroundColor: '#f8f9fa',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          {(Object.keys(dropdownData) as DropdownName[]).map((name) => {
            const { label, options } = dropdownData[name];
            const selectedValue =
              name === 'organization'
                ? organization
                : name === 'legalEntity'
                ? legalEntity
                : name === 'documentTitle'
                ? documentTitle
                : documentType;

            return (
              <div
                key={name}
                className="custom-dropdown"
                style={{
                  border: '2px solid #6c757d',
                  borderRadius: 8,
                  width: 210,
                  height: 55,
                  padding: '0 15px',
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor: 'white',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  userSelect: 'none',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown(name);
                }}
              >
                <span
                  style={{
                    flexGrow: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    pointerEvents: 'none',
                    color: selectedValue ? 'black' : '#6c757d',
                    fontWeight: selectedValue ? '500' : '400'
                  }}
                >
                  {selectedValue || label}
                </span>

                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    marginLeft: 10,
                    userSelect: 'none',
                    pointerEvents: 'none',
                    transition: 'transform 0.2s ease',
                    transform: openDropdown === name ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <path
                    d="M1 1L6 6L11 1"
                    stroke="#495057"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                {openDropdown === name && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 5px)',
                      left: 0,
                      right: 0,
                      border: '1px solid #dee2e6',
                      backgroundColor: 'white',
                      zIndex: 1000,
                      borderRadius: 8,
                      maxHeight: 220,
                      overflowY: 'auto',
                      fontSize: 16,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {options.length === 0 ? (
                      <div style={{ padding: '10px 15px', color: '#6c757d', fontStyle: 'italic' }}>Нет данных</div>
                    ) : (
                      options.map((option, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 15px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f1f1',
                            userSelect: 'none',
                            transition: 'background-color 0.2s',
                          }}
                          onClick={() => handleSelectOption(name, option)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {option}
                        </div>
                      ))
                    )}
                    {(name === 'organization' || name === 'legalEntity') && (
                      <div
                        style={{
                          padding: '12px 15px',
                          cursor: 'pointer',
                          color: '#0d6efd',
                          fontWeight: '500',
                          userSelect: 'none',
                          borderTop: '1px solid #f1f1f1',
                          backgroundColor: '#f8f9fa',
                        }}
                        onClick={() => openAddModal(name)}
                      >
                        + Добавить...
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={() => navigate('/upload')}
            style={{
              border: '2px solid #6c757d',
              borderRadius: 8,
              width: 210,
              height: 55,
              padding: '0 15px',
              cursor: 'pointer',
              backgroundColor: 'white',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '500',
              flexShrink: 0,
              margin: 0,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          >
            Создать отчет
          </button>

          {allFieldsFilled && (
            <button
              onClick={generateDocument}
              style={{
                border: '2px solid #28a745',
                borderRadius: 8,
                width: 210,
                height: 55,
                padding: '0 15px',
                cursor: 'pointer',
                backgroundColor: '#28a745',
                color: 'white',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '500',
                flexShrink: 0,
                margin: 0,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              }}
            >
              Сгенерировать
            </button>
          )}
        </div>

        {/* Компактная таблица полей */}
        {tableFields.length > 0 && (
          <div style={{ 
            marginBottom: 30,
            padding: '25px', 
            border: '1px solid #dee2e6', 
            borderRadius: '10px',
            backgroundColor: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            {/* Шапка с заголовком и кнопкой */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid #eee'
            }}>
              <h3 style={{ 
                fontSize: '20px',
                fontWeight: '600', 
                color: '#495057',
                margin: 0
              }}>Табличные данные</h3>
              <button 
                onClick={addTableRow}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 1V13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M1 7H13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Добавить строку
              </button>
            </div>
            
            {/* Строки таблицы */}
            {tableRows.map((rowIndex) => (
              <div key={rowIndex} style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '20px',
                backgroundColor: rowIndex % 2 === 0 ? '#f8f9fa' : 'white',
                borderRadius: '6px',
                border: '1px solid #eee',
                position: 'relative'
              }}>
                {tableFields.map((field, fieldIndex) => (
                  <div key={`${rowIndex}-${field}`} style={{ 
                    flex: '1 0 calc(33.333% - 25px)',
                    minWidth: '250px',
                    marginRight: '25px',
                    marginBottom: '15px',
                    boxSizing: 'border-box'
                  }}>
                    <label style={{ 
                      fontSize: '16px',
                      marginBottom: '12px',
                      display: 'block',
                      fontWeight: '500',
                      color: '#495057'
                    }}>
                      {field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </label>
                    <input
                      type="text"
                      value={fieldValues[`${field}_${rowIndex}`] || ''}
                      onChange={(e) => handleFieldValueChange(`${field}_${rowIndex}`, e.target.value)}
                      style={{ 
                        width: '100%',
                        padding: '12px 15px',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        fontSize: '15px',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ))}
                
                {/* Кнопка удаления строки */}
                {tableRows.length > 1 && (
                  <button 
                    onClick={() => removeTableRow(rowIndex)}
                    style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '20px',
                      flexShrink: 0,
                      alignSelf: 'center'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4L12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M12 4L4 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Основной контент - дополнительные поля и документ */}
        {(remainingFields.length > 0 || generatedUrl) && (
          <div style={{ 
            display: 'flex', 
            gap: '25px',
            alignItems: 'flex-start'
          }}>
            {/* Блок с полями слева */}
            <div style={{ 
              flex: 1,
              maxWidth: '600px',
              display: 'flex',
              flexDirection: 'column',
              gap: '25px'
            }}>
              {/* Дополнительные поля */}
              {remainingFields.length > 0 && (
                <div style={{ 
                  padding: '25px', 
                  border: '1px solid #dee2e6', 
                  borderRadius: '10px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                  <h3 style={{ 
                    marginBottom: '20px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#495057',
                    paddingBottom: '15px',
                    borderBottom: '1px solid #eee'
                  }}>Дополнительные поля</h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr', 
                    gap: '20px'
                  }}>
                    {remainingFields.map((field) => (
                      <div key={field} style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ 
                          marginBottom: '8px', 
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#495057'
                        }}>
                          {field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </label>
                        <input
                          type="text"
                          value={fieldValues[field] || ''}
                          onChange={(e) => handleFieldValueChange(field, e.target.value)}
                          style={{ 
                            padding: '10px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '6px',
                            fontSize: '14px',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Default Fields таблица */}
              {Object.keys(defaultFields).length > 0 && (
                <div style={{ 
                  padding: '25px', 
                  border: '1px solid #dee2e6', 
                  borderRadius: '10px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                  <h3 style={{ 
                    marginBottom: '20px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#495057',
                    paddingBottom: '15px',
                    borderBottom: '1px solid #eee'
                  }}>Базовые поля</h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr', 
                    gap: '20px'
                  }}>
                    {Object.entries(defaultFields).map(([field, value]) => (
                      <div key={field} style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: '8px'
                        }}>
                          <label style={{ 
                            fontSize: '14px', 
                            fontWeight: '500',
                            color: '#495057',
                            flexGrow: 1
                          }}>
                            {field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                          </label>
                          {editingField !== field && (
                            <button
                              onClick={() => handleDefaultFieldEdit(field)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '5px',
                                marginLeft: '5px',
                                color: '#6c757d',
                                transition: 'color 0.2s',
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          )}
                        </div>
                        {editingField === field ? (
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleDefaultFieldSave(field, e.target.value)}
                              style={{ 
                                flexGrow: 1,
                                padding: '10px 12px',
                                border: '1px solid #ced4da',
                                borderRadius: '6px',
                                fontSize: '14px',
                                transition: 'border-color 0.2s, box-shadow 0.2s',
                              }}
                            />
                            <button
                              onClick={() => setEditingField(null)}
                              style={{
                                width: '36px',
                                height: '36px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 0.2s',
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4L12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12 4L4 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={value}
                            readOnly
                            style={{ 
                              padding: '10px 12px',
                              border: '1px solid #ced4da',
                              borderRadius: '6px',
                              fontSize: '14px',
                              backgroundColor: '#f8f9fa',
                              color: '#495057'
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Документ - справа */}
            {generatedUrl && (
              <div style={{ 
                flex: 2,
                boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                borderRadius: '10px',
                overflow: 'hidden',
                maxWidth: '920px',
                backgroundColor: 'white',
                border: '1px solid #dee2e6'
              }}>
                <iframe 
                  src={generatedUrl}
                  style={{
                    width: '100%',
                    height: '925px',
                    border: 'none'
                  }}
                  title="Generated Document"
                />
              </div>
            )}
          </div>
        )}

        {/* Кнопка обновления документа */}
        {(remainingFields.length > 0 || tableFields.length > 0) && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #eee'
          }}>
            <button
              onClick={submitAndDownloadDocument}
              style={{
                padding: '12px 30px',
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 14V17C19 18.1046 18.1046 19 17 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M17 5H21V9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 14L21 3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Внести изменения и скачать
            </button>
          </div>
        )}

        {/* Модальное окно */}
        {modalOpen && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2000,
            }}
            onClick={() => setModalOpen(false)}
          >
            <div
              className="modal-content"
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 8,
                minWidth: 300,
                maxWidth: 500,
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: 20 }}>
                Добавить новое {modalFor === 'organization' ? 'юр. лицо организации' : 'юр. лицо заказчика'}
              </h3>
              <input
                type="text"
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 16,
                  marginBottom: 20,
                  boxSizing: 'border-box',
                  border: '1px solid #ddd',
                  borderRadius: 4
                }}
                placeholder="Введите название"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button 
                  onClick={() => setModalOpen(false)} 
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#f1f1f1',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Отмена
                </button>
                <button 
                  onClick={handleModalSubmit} 
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
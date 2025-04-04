import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css'; // Подключаем стили

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [organization, setOrganization] = useState('');
    const [legalEntity, setLegalEntity] = useState('');
    const [documentType, setDocumentType] = useState('');

    // Рефы для управления состоянием
    const dropdownStates = useRef({
        organization: false,
        legalEntity: false,
        documentType: false,
    });

    const selectRefs = {
        organization: useRef<HTMLSelectElement>(null),
        legalEntity: useRef<HTMLSelectElement>(null),
        documentType: useRef<HTMLSelectElement>(null),
    };

    // Закрытие всех дропдаунов
    const closeAllDropdowns = () => {
        Object.keys(selectRefs).forEach(key => {
            const name = key as keyof typeof selectRefs;
            selectRefs[name].current?.classList.remove('open');
            dropdownStates.current[name] = false;
        });
    };

    // Обработчик выбора значения
    const handleSelectChange = (
        e: React.ChangeEvent<HTMLSelectElement>,
        name: keyof typeof dropdownStates.current,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        setter(e.target.value);
        closeAllDropdowns();
    };

    // Обработчик клика по селекту
    const handleSelectClick = (name: keyof typeof dropdownStates.current, e: React.MouseEvent) => {
        e.stopPropagation();
        const currentState = dropdownStates.current[name];
        closeAllDropdowns();
        selectRefs[name].current?.classList.toggle('open', !currentState);
        dropdownStates.current[name] = !currentState;
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (!storedToken) {
            navigate('/');
        } else {
            setToken(storedToken);
        }
        setLoading(false);

        const handleDocumentClick = () => closeAllDropdowns();
        document.addEventListener('click', handleDocumentClick);
        return () => document.removeEventListener('click', handleDocumentClick);
    }, [navigate]);

    if (loading) return <div className="loading">Загрузка...</div>;
    if (!token) return null;

    return (
        <div className="page-container">
            <div className="home-content">
                <header className="header">
                    <h1>Панель управления</h1>
                </header>
                <h2 className="title">Создание отчета</h2>
                <div className="dropdown-container">
                    <div className="dropdown">
                        <select
                            ref={selectRefs.organization}
                            value={organization}
                            onChange={(e) => handleSelectChange(e, 'organization', setOrganization)}
                            onClick={(e) => handleSelectClick('organization', e)}
                            onBlur={closeAllDropdowns}
                            className="dropdown-select"
                            required
                        >
                            <option value="" disabled hidden>Юр. лицо организации</option>
                            <option value="org1">Добавить</option>
                        </select>
                    </div>
                    <div className="dropdown">
                        <select
                            ref={selectRefs.legalEntity}
                            value={legalEntity}
                            onChange={(e) => handleSelectChange(e, 'legalEntity', setLegalEntity)}
                            onClick={(e) => handleSelectClick('legalEntity', e)}
                            onBlur={closeAllDropdowns}
                            className="dropdown-select"
                            required
                        >
                            <option value="" disabled hidden>Юр. лицо заказчика</option>
                            <option value="org1">Добавить</option>
                        </select>
                    </div>
                    <div className="dropdown">
                        <select
                            ref={selectRefs.documentType}
                            value={documentType}
                            onChange={(e) => handleSelectChange(e, 'documentType', setDocumentType)}
                            onClick={(e) => handleSelectClick('documentType', e)}
                            onBlur={closeAllDropdowns}
                            className="dropdown-select"
                            required
                        >
                            <option value="" disabled hidden>Тип документа</option>
                            <option value="doc1">Акт</option>
                            <option value="doc1">Отчёт</option>
                            <option value="doc1">Заявка</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
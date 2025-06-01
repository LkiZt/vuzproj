import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';
import RegistrationForm from './components/RegistrationForm';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import Zaglushka from './components/Zaglushka';
import TemplateUploadPage from './components/TemplateUploadPage';
import { ProtectedRoute } from './components/ProtectedRoute';

const App: React.FC = () => {
    return (
        <Routes>
            {/* Корневой маршрут с перенаправлением */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Открытые маршруты (доступны без авторизации) */}
            <Route path="/login" element={<LoginPage />} />

            {/* Защищённые маршруты (только для авторизованных) */}
            <Route element={<ProtectedRoute />}>
                <Route path="/register" element={<RegistrationForm />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/upload" element={<TemplateUploadPage />} />
                <Route path="/navigator" element={<Zaglushka />} />
            </Route>

            {/* Обработка несуществующих маршрутов */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default App;

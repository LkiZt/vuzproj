import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';
import RegistrationForm from './components/RegistrationForm';
import LoginPage from './components/LoginPage';

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/register" element={<RegistrationForm />} />
            <Route path="/login" element={<LoginPage />} />
        </Routes>
    );
};

export default App;

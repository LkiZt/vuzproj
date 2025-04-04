import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';
import RegistrationForm from './components/RegistrationForm';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import Zaglushka from './components/Zaglushka';
import { ProtectedRoute } from './components/ProtectedRoute';

const App: React.FC = () => {
    return (
        <Routes>
            {/* Открытые маршруты (доступны без авторизации) */}
            <Route path="/login" element={<LoginPage />} />

            {/* Защищённые маршруты (только для авторизованных) */}
            <Route element={<ProtectedRoute />}>
            <Route path="/register" element={<RegistrationForm />} />
            <Route path="/home" element={<Zaglushka />} />
            {/* <Route path="/home2" element={<HomePage />} /> */}
            </Route>
        </Routes>
    );
};

export default App;

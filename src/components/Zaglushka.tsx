import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutButton: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };
    const handleRegister = () => {
        navigate('/register');
    };

    return (
        <div className="logout-container">
            <button onClick={handleLogout} className="logout-button">
                Выйти
            </button>
            <button onClick={handleRegister} className="register-button">
                Регистрация
            </button>
        </div>
    );
};

export default LogoutButton;
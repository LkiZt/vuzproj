import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutButton: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    return (
        <div className="logout-container">
            <button onClick={handleLogout} className="logout-button">
                Выйти
            </button>
        </div>
    );
};

export default LogoutButton;
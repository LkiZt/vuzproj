import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';

const LoginPage: React.FC = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('authToken') !== null;
        if (isAuthenticated) {
          navigate('/home'); // Перенаправляем, если уже авторизован
        }
      }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
    
        try {
            const response = await fetch('http://85.159.226.224:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(formData)
            });
    
            if (!response.ok) {
                setFormData(prev => ({ ...prev, password: '' }));
                throw new Error('Ошибка входа, проверьте email и пароль');
            }
    
            const data = await response.json();
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                navigate('/home');
            } else {
                throw new Error('Не получен токен');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className='page-container'>
            <div className="registration">
                <h2 className='reg-title'>Вход</h2>
                <div className="login-form">
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Введите email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label>Пароль</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Введите пароль"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {error && <p className="error">{error}</p>}
                        <div className='login-buttons'>
                            <button type="submit">Войти</button>
                            <button 
                                type="button" 
                                className="register-button"
                                onClick={() => navigate('/register')}
                            >
                                Регистрация
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
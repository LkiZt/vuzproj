import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsModalOpen(true);
    };
    // const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    // useEffect(() => {
    //         const handleResize = () => {
    //             setWindowWidth(window.innerWidth);
    //         };

    //         window.addEventListener('resize', handleResize);
    
    //         return () => {
    //             window.removeEventListener('resize', handleResize);
    //         };
    //     }, []);
    // if (windowWidth < 1560) {
    //     return (
    //         <div className="page-container">
    //             <div className="width-message">
    //                 <p>Для использования сайта необходима ширина экрана более 1560 пикселей.</p>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className='page-container'>
            <div className="registration">
                <h2 className='reg-title'>Вход</h2>
                <div className="login-form">
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label>Логин</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Введите логин"
                                value={formData.username}
                                onChange={handleChange}
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
                            />
                        </div>
                        <div className='login-buttons'>
                            <button type="submit">Войти</button>
                            <button type="button" onClick={() => navigate('/register')}>Зарегистрироваться</button>
                        </div>
                    </form>
                </div>
                {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <p>Нет метода на бэке</p>
                        <button onClick={() => setIsModalOpen(false)} className="btn">Закрыть</button>
                    </div>
                </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;

export {};

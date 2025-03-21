import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RegistrationForm: React.FC = () => {
    const navigate = useNavigate(); // Хук для навигации
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        patronymic: '',
        username: '',
        password: ''
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        patronymic: '',
        username: '',
        password: ''
    });
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        validateForm(name, value);
    };

    const validateForm = (name: string, value: string) => {
        let formErrors = { ...errors };
        let isValid = true;

        const nameRegex = /^[а-яА-ЯёЁ]+$/;
        if (name === 'firstName' && !nameRegex.test(value)) {
            formErrors.firstName = 'Имя должно содержать только русские буквы';
            isValid = false;
        } else if (name === 'firstName') {
            formErrors.firstName = '';
        }

        if (name === 'lastName' && !nameRegex.test(value)) {
            formErrors.lastName = 'Фамилия должна содержать только русские буквы';
            isValid = false;
        } else if (name === 'lastName') {
            formErrors.lastName = '';
        }

        if (name === 'patronymic' && !nameRegex.test(value)) {
            formErrors.patronymic = 'Отчество должно содержать только русские буквы';
            isValid = false;
        } else if (name === 'patronymic') {
            formErrors.patronymic = '';
        }

        const emailRegex = /\S+@\S+\.\S+/;
        if (name === 'username' && !emailRegex.test(value)) {
            formErrors.username = 'Логин должен содержать почту (например, example@domain.com)';
            isValid = false;
        } else if (name === 'username') {
            formErrors.username = '';
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (name === 'password' && !passwordRegex.test(value)) {
            formErrors.password = 'Пароль должен содержать минимум 8 символов, большую букву, цифру и специальный знак';
            isValid = false;
        } else if (name === 'password') {
            formErrors.password = '';
        }

        setErrors(formErrors);
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm('firstName', formData.firstName) &&
            validateForm('lastName', formData.lastName) &&
            validateForm('patronymic', formData.patronymic) &&
            validateForm('username', formData.username) &&
            validateForm('password', formData.password)) {
            console.log(formData);
            setIsModalOpen(true);
        }
    };

    const handleBackToLogin = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate('/login');
    };

    if (windowWidth < 1560) {
        return (
            <div className="page-container">
                <div className="width-message">
                    <p>Для использования сайта необходима ширина экрана более 1560 пикселей.</p>
                </div>
            </div>
        );
    }

    return (
        <div className='page-container'>
            <div className="registration">
                <h2 className='reg-title'>Регистрация</h2>
                <div className="registration-form">
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label>Имя</label>
                            <input
                                type="text"
                                name="firstName"
                                placeholder="Поле для ввода текста"
                                value={formData.firstName}
                                onChange={handleChange}
                            />
                            {errors.firstName && <div className="error">{errors.firstName}</div>}
                        </div>
                        <div>
                            <label>Фамилия</label>
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Поле для ввода текста"
                                value={formData.lastName}
                                onChange={handleChange}
                            />
                            {errors.lastName && <div className="error">{errors.lastName}</div>}
                        </div>
                        <div>
                            <label>Отчество</label>
                            <input
                                type="text"
                                name="patronymic"
                                placeholder="Поле для ввода текста"
                                value={formData.patronymic}
                                onChange={handleChange}
                            />
                            {errors.patronymic && <div className="error">{errors.patronymic}</div>}
                        </div>
                        <div>
                            <label>Логин</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Поле для ввода текста"
                                value={formData.username}
                                onChange={handleChange}
                            />
                            {errors.username && <div className="error">{errors.username}</div>}
                        </div>
                        <div>
                            <label>Пароль</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Поле для ввода текста"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            {errors.password && <div className="error">{errors.password}</div>}
                        </div>
                        <div className='registration-buttons'>
                            <button type="submit">Зарегистрироваться</button>
                            <button className="back-to-login" onClick={handleBackToLogin}>Вернуться ко входу</button>
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

export default RegistrationForm;

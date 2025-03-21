import React, { useState } from 'react';
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Валидация при изменении данных
        validateForm(name, value);
    };

    const validateForm = (name: string, value: string) => {
        let formErrors = { ...errors };
        let isValid = true;

        // Имя/Фамилия/Отчество - только русские буквы
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

        // Логин - обязательно содержит почту
        const emailRegex = /\S+@\S+\.\S+/;
        if (name === 'username' && !emailRegex.test(value)) {
            formErrors.username = 'Логин должен содержать почту (например, example@domain.com)';
            isValid = false;
        } else if (name === 'username') {
            formErrors.username = '';
        }

        // Пароль должен содержать большую букву, цифру, специальный знак и быть не менее 8 символов
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
        e.preventDefault(); // Предотвратить отправку формы при нажатии "Вернуться ко входу"
        navigate('/login');
    };

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

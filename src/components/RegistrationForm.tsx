import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CheckIcon = () => (
  <span style={{ color: '#2e7d32', marginRight: '8px' }}>✓</span>
);

const RegistrationForm: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        password: ''
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [errors, setErrors] = useState({
        fullname: '',
        username: '',
        password: ''
    });
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleBackClick = () => {
        navigate('/home');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (value === '') {
            setErrors({ ...errors, [name]: '' });
            if (name === 'password') {
                setPasswordRequirements({
                    length: false,
                    uppercase: false,
                    lowercase: false,
                    number: false,
                    specialChar: false
                });
            }
        } else {
            validateForm(name, value);
        }
    };

    const validateForm = (name: string, value: string) => {
        let formErrors = { ...errors };
        let isValid = true;

        if (name === 'username') {
            const emailRegex = /\S+@\S+\.\S+/;
            if (!emailRegex.test(value)) {
                formErrors.username = 'Логин должен содержать почту (например, example@domain.com)';
                isValid = false;
            } else {
                formErrors.username = '';
            }
        }

        if (name === 'password') {
            const hasUppercase = /[\p{Lu}]/u.test(value);
            const hasLowercase = /[\p{Ll}]/u.test(value);
            
            const requirements = {
                length: value.length >= 6,
                uppercase: hasUppercase,
                lowercase: hasLowercase,
                number: /\d/.test(value),
                specialChar: /[!@#$%^&*]/.test(value)
            };
            setPasswordRequirements(requirements);

            if (!requirements.length || !requirements.uppercase || 
                !requirements.lowercase || !requirements.number || 
                !requirements.specialChar) {
                formErrors.password = 'Пароль не соответствует требованиям:';
                isValid = false;
            } else {
                formErrors.password = '';
            }
        }

        setErrors(formErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!validateForm('username', formData.username) || 
            !validateForm('password', formData.password)) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://85.159.226.224:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullname: formData.fullname,
                    email: formData.username,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                setModalMessage('Пользователь успешно зарегистрирован');
                setIsModalOpen(true);
            } else {
                setModalMessage(data.message || 'Ошибка при регистрации');
                setIsModalOpen(true);
            }
        } catch (error) {
            setModalMessage('Ошибка сети. Попробуйте позже.');
            setIsModalOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className='page-container' style={{ fontSize: '18px', position: 'relative' }}>
            {/* Кнопка назад */}
            <button 
                onClick={handleBackClick}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#f0f0f0',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
            >
                ←
            </button>
            
            <div className="registration">
                <h2 className='reg-title'>Регистрация</h2>
                <div className="registration-form">
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label>ФИО</label>
                            <input
                                type="text"
                                name="fullname"
                                placeholder="Поле для ввода текста"
                                value={formData.fullname}
                                onChange={handleChange}
                                style={{ fontSize: '18px' }}
                                required
                            />
                            {errors.fullname && <div className="error">{errors.fullname}</div>}
                        </div>
                        <div>
                            <label>Email</label>
                            <input
                                type="email"
                                name="username"
                                placeholder="example@domain.com"
                                value={formData.username}
                                onChange={handleChange}
                                style={{ fontSize: '18px' }}
                                required
                            />
                            {errors.username && <div className="error">{errors.username}</div>}
                        </div>
                        <div>
                            <label>Пароль</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Пароль"
                                value={formData.password}
                                onChange={handleChange}
                                style={{ fontSize: '18px' }}
                                required
                            />
                            {errors.password && (
                                <div className="password-requirements">
                                    <div className="error">{errors.password}</div>
                                    <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                                        <li style={{ display: 'flex', alignItems: 'center' }}>
                                            {passwordRequirements.length && <CheckIcon />}
                                            <span>Минимум 6 символов</span>
                                        </li>
                                        <li style={{ display: 'flex', alignItems: 'center' }}>
                                            {passwordRequirements.uppercase && <CheckIcon />}
                                            <span>Хотя бы одна заглавная буква</span>
                                        </li>
                                        <li style={{ display: 'flex', alignItems: 'center' }}>
                                            {passwordRequirements.lowercase && <CheckIcon />}
                                            <span>Хотя бы одна строчная буква</span>
                                        </li>
                                        <li style={{ display: 'flex', alignItems: 'center' }}>
                                            {passwordRequirements.number && <CheckIcon />}
                                            <span>Хотя бы одна цифра</span>
                                        </li>
                                        <li style={{ display: 'flex', alignItems: 'center' }}>
                                            {passwordRequirements.specialChar && <CheckIcon />}
                                            <span>Хотя бы один спецсимвол</span>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className='registration-buttons'>
                            <button 
                                type="submit" 
                                style={{ fontSize: '18px', width: '240px' }}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                            </button>
                        </div>
                    </form>
                </div>
                {isModalOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '5px',
                            maxWidth: '400px',
                            width: '100%',
                            textAlign: 'center'
                        }}>
                            <p>{modalMessage}</p>
                            <button 
                                onClick={closeModal}
                                style={{ 
                                    fontSize: '18px', 
                                    padding: '8px 16px',
                                    marginTop: '15px'
                                }}
                            >
                                ОК
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegistrationForm;
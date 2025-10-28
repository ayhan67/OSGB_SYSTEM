import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, register } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  // Password strength validation
  const validatePasswordStrength = (password: string) => {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Contains number
    if (/\d/.test(password)) strength += 1;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(validatePasswordStrength(newPassword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Password validation for registration
    if (!isLogin) {
      if (passwordStrength < 4) {
        setError('Şifre en az 8 karakter uzunluğunda olmalı ve büyük harf, küçük harf, rakam ve özel karakter içermelidir');
        setLoading(false);
        return;
      }
    }
    
    try {
      if (isLogin) {
        // Login
        const response = await login(username, password);
        localStorage.setItem('authToken', response.token);
        authLogin({
          id: response.user.id,
          username: response.user.username,
          fullName: response.user.fullName,
          role: response.user.role,
          organizationId: response.user.organizationId
        });
        navigate('/');
      } else {
        // Register
        const response = await register({ username, password, fullName });
        localStorage.setItem('authToken', response.token);
        authLogin({
          id: response.user.id,
          username: response.user.username,
          fullName: response.user.fullName,
          role: response.user.role,
          organizationId: response.user.organizationId
        });
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || (isLogin ? 'Giriş başarısız' : 'Kayıt başarısız'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-window">
        <div className="login-content">
          <div className="login-logo">
            <h2 className="login-title">OSGB Yönetim Sistemi</h2>
            
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-group">
              <label htmlFor="username">Kullanıcı Adı</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="login-input"
              />
            </div>
            
            <div className="login-input-group">
              <label htmlFor="password">Şifre</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                required
                className="login-input"
              />
              {!isLogin && (
                <div className="password-strength">
                  <div className="strength-meter">
                    <div 
                      className="strength-fill"
                      style={{
                        width: `${passwordStrength * 20}%`,
                        backgroundColor: passwordStrength < 3 ? '#ff4d4d' : 
                                        passwordStrength < 4 ? '#ff9900' : '#00cc66'
                      }}
                    ></div>
                  </div>
                  <div className="strength-text">
                    {passwordStrength === 0 && 'Şifre girin'}
                    {passwordStrength === 1 && 'Çok zayıf'}
                    {passwordStrength === 2 && 'Zayıf'}
                    {passwordStrength === 3 && 'Orta'}
                    {passwordStrength === 4 && 'Güçlü'}
                    {passwordStrength === 5 && 'Çok güçlü'}
                  </div>
                </div>
              )}
            </div>
            
            {!isLogin && (
              <div className="login-input-group">
                <label htmlFor="fullName">Ad Soyad</label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="login-input"
                />
              </div>
            )}
            
            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Yükleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
            </button>
          </form>
          
          <div className="toggle-form">
            <p>
              {isLogin ? "Hesabınız yok mu? " : "Zaten bir hesabınız var mı? "}
              <button 
                type="button" 
                onClick={() => setIsLogin(!isLogin)}
                className="link-button"
              >
                {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
              </button>
            </p>
          </div>
          
          {isLogin && (
            <div className="toggle-form">
              <p>
                Yeni bir OSGB mi kaydetmek istiyorsunuz?{' '}
                <button 
                  type="button" 
                  onClick={() => navigate('/register-organization')}
                  className="link-button"
                >
                  OSGB Kaydı Oluştur
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
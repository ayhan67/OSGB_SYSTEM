import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerOrganization } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const OrganizationRegisterPage = () => {
  const [organizationName, setOrganizationName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [success, setSuccess] = useState('');
  
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
    setAdminPassword(newPassword);
    setPasswordStrength(validatePasswordStrength(newPassword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Password validation
    if (passwordStrength < 4) {
      setError('Şifre en az 8 karakter uzunluğunda olmalı ve büyük harf, küçük harf, rakam ve özel karakter içermelidir');
      setLoading(false);
      return;
    }
    
    try {
      const response = await registerOrganization({
        organizationName,
        adminUsername,
        adminPassword,
        adminFullName,
        adminEmail
      });
      
      // Store token and login user
      localStorage.setItem('authToken', response.token);
      authLogin({
        id: response.user.id,
        username: response.user.username,
        fullName: response.user.fullName,
        role: response.user.role,
        organizationId: response.user.organizationId
      });
      
      setSuccess('OSGB kaydı başarıyla oluşturuldu! Sisteme yönlendiriliyorsunuz...');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'OSGB kaydı oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-window">
        <div className="login-content">
          <div className="login-logo">
            <h2 className="login-title">Yeni OSGB Kaydı</h2>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-group">
              <label htmlFor="organizationName">OSGB Adı</label>
              <input
                type="text"
                id="organizationName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                className="login-input"
                placeholder="Örn: İstanbul OSGB A.Ş."
              />
            </div>
            
            <div className="login-input-group">
              <label htmlFor="adminFullName">Yönetici Adı Soyadı</label>
              <input
                type="text"
                id="adminFullName"
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                required
                className="login-input"
              />
            </div>
            
            <div className="login-input-group">
              <label htmlFor="adminEmail">E-posta (İsteğe bağlı)</label>
              <input
                type="email"
                id="adminEmail"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="login-input"
                placeholder="yonetici@osgb.com"
              />
            </div>
            
            <div className="login-input-group">
              <label htmlFor="adminUsername">Yönetici Kullanıcı Adı</label>
              <input
                type="text"
                id="adminUsername"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
                className="login-input"
                placeholder="yonetici"
              />
            </div>
            
            <div className="login-input-group">
              <label htmlFor="adminPassword">Yönetici Şifresi</label>
              <input
                type="password"
                id="adminPassword"
                value={adminPassword}
                onChange={handlePasswordChange}
                required
                className="login-input"
              />
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
            </div>
            
            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Kayıt Oluşturuluyor...' : 'OSGB Kaydı Oluştur'}
            </button>
          </form>
          
          <div className="toggle-form">
            <p>
              Zaten bir OSGB hesabınız var mı?{' '}
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                className="link-button"
              >
                Giriş Yap
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationRegisterPage;
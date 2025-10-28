import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/api';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Şifre değiştirme işlemi için şifre alanlarını kontrol et
    if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        setError('Mevcut şifrenizi girmelisiniz');
        setLoading(false);
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Yeni şifreler eşleşmiyor');
        setLoading(false);
        return;
      }
      
      if (formData.newPassword.length < 8) {
        setError('Yeni şifre en az 8 karakter uzunluğunda olmalıdır');
        setLoading(false);
        return;
      }
    }
    
    try {
      const updateData: any = {};
      
      // Ad soyad güncelleniyorsa ekle
      if (formData.fullName !== user?.fullName) {
        updateData.fullName = formData.fullName;
      }
      
      // Şifre değiştirme işlemi varsa ekle
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      // Eğer güncellenecek bir şey yoksa hata ver
      if (Object.keys(updateData).length === 0) {
        setError('Güncellenecek bir bilgi bulunamadı');
        setLoading(false);
        return;
      }
      
      const response = await updateUserProfile(updateData);
      
      // Kullanıcı bilgilerini güncelle
      if (user) {
        const updatedUser = {
          ...user,
          fullName: response.fullName || user.fullName
        };
        login(updatedUser);
      }
      
      setSuccess('Profil başarıyla güncellendi!');
      
      // Formu sıfırla
      setFormData({
        fullName: response.fullName || formData.fullName,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      setError(err.message || 'Profil güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="profile-page-container">
      <div className="profile-page-content">
        <div className="page-header">
          <h2>Profil Ayarları</h2>
        </div>
        
        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="fullName">Ad Soyad:</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="username">Kullanıcı Adı:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={user?.username || ''}
              className="form-input"
              readOnly
            />
          </div>
          
          <div className="form-section">
            <h3>Şifre Değiştir</h3>
            
            <div className="form-group">
              <label htmlFor="currentPassword">Mevcut Şifre:</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">Yeni Şifre:</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="form-input"
                minLength={8}
              />
              <small>En az 8 karakter uzunluğunda olmalıdır</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Yeni Şifre (Tekrar):</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleBack}
              disabled={loading}
            >
              Geri
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
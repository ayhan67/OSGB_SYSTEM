import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestAuthPage = () => {
  const { user, isAuthenticated, organizationId } = useAuth();
  
  return (
    <div>
      <h1>Kimlik Doğrulama Test Sayfası</h1>
      <p>Oturum Açık: {isAuthenticated ? 'Evet' : 'Hayır'}</p>
      {user && (
        <div>
          <p>Kullanıcı ID: {user.id}</p>
          <p>Kullanıcı Adı: {user.username}</p>
          <p>Ad Soyad: {user.fullName}</p>
          <p>Rol: {user.role}</p>
          <p>Organizasyon ID: {user.organizationId || 'Yok'}</p>
        </div>
      )}
      <p>Bağlam Organizasyon ID: {organizationId || 'Yok'}</p>
    </div>
  );
};

export default TestAuthPage;
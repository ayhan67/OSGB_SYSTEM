import React, { useState, useEffect } from 'react';
import { createDsp, getAllDsps, deleteDsp, updateDsp, getDspAssignedWorkplaces } from '../services/api';
import './DspCardPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import AssignedWorkplacesModal from './AssignedWorkplacesModal';

// Define interface for form data
interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  assignedMinutes: number;
}

// Define interface for DSP data
interface DspData extends FormData {
  id: number;
  usedMinutes?: number;
}

const DspCardPage = () => {
  // DSP Card Page Component
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    assignedMinutes: 11900
  });
  const [dsps, setDsps] = useState<DspData[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Validation functions
  const isValidName = (name: string) => {
    return /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(name);
  };

  const isValidPhone = (phone: string) => {
    return /^5\d{2}\s\d{3}\s\d{2}\s\d{2}$/.test(phone);
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedDigits = digits.substring(0, 10);
    
    // Format as 5xx xxx xx xx
    let formatted = '';
    for (let i = 0; i < limitedDigits.length; i++) {
      if (i === 3 || i === 6 || i === 8) {
        formatted += ' ';
      }
      formatted += limitedDigits[i];
    }
    
    return formatted;
  };

  // Function to handle clicking on a DSP row
  const handleDspClick = (dsp: DspData) => {
    openDspDetails(dsp);
  };

  useEffect(() => {
    fetchDsps();
  }, []);

  // Add useEffect to refresh data when location changes (navigation)
  useEffect(() => {
    console.log('DspCardPage: Location changed to:', location.pathname, 'at:', new Date().toISOString());
    fetchDsps();
  }, [location.pathname]);

  // Add useEffect to refresh data when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('DspCardPage: Window focused, refreshing DSPs...');
      fetchDsps();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Add useEffect to refresh data when workplace is created
  useEffect(() => {
    const handleWorkplaceCreated = () => {
      console.log('DspCardPage: Workplace created, refreshing DSPs...');
      fetchDsps();
    };

    window.addEventListener('workplaceCreated', handleWorkplaceCreated);
    return () => {
      window.removeEventListener('workplaceCreated', handleWorkplaceCreated);
    };
  }, []);

  const fetchDsps = async () => {
    try {
      const data = await getAllDsps();
      setDsps(data);
    } catch (err: any) {
      console.error('DSP\'ler getirilirken hata oluştu:', err);
      setError(err.message || 'DSP\'ler getirilirken hata oluştu');
    }
  };

  // Calculate statistics for DSPs
  const calculateDspStats = () => {
    const stats = {
      totalCount: dsps.length,
      totalMinutes: 0,
      usedMinutes: 0,
      remainingMinutes: 0
    };

    dsps.forEach(dsp => {
      stats.totalMinutes += dsp.assignedMinutes || 0;
      stats.usedMinutes += dsp.usedMinutes || 0;
      stats.remainingMinutes += (dsp.assignedMinutes || 0) - (dsp.usedMinutes || 0);
    });

    return stats;
  };

  const dspStats = calculateDspStats();

  // Function to get assigned workplace names for a DSP
  const getAssignedWorkplaceNames = (dspId: number) => {
    // This would require a new endpoint to get workplaces assigned to a DSP
    // For now, we'll return a placeholder
    return 'Atanmamış';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special handling for name fields - prevent numbers
    if (name === 'firstName' || name === 'lastName') {
      // Remove any numeric characters
      const cleanValue = value.replace(/\d/g, '');
      setFormData((prev: FormData) => ({
        ...prev,
        [name]: cleanValue
      }));
    }
    // Special handling for phone number formatting
    else if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setFormData((prev: FormData) => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setFormData((prev: FormData) => ({
        ...prev,
        [name]: name === 'assignedMinutes' ? (value === '' ? 0 : parseInt(value) || 0) : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation checks
    if (!isValidName(formData.firstName)) {
      setError('Ad sadece harf içermelidir');
      clearNotifications();
      return;
    }
    
    if (!isValidName(formData.lastName)) {
      setError('Soyad sadece harf içermelidir');
      clearNotifications();
      return;
    }
    
    if (!isValidPhone(formData.phone)) {
      setError('Telefon numarası 5xx xxx xx xx formatında olmalıdır');
      clearNotifications();
      return;
    }
    
    if (formData.assignedMinutes > 11900) {
      setError('Atanan dakika 11.900\'ü geçemez');
      clearNotifications();
      return;
    }
    
    try {
      await createDsp(formData);
      setSuccess('DSP başarıyla oluşturuldu!');
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        assignedMinutes: 11900
      });
      fetchDsps();
    } catch (err: any) {
      console.error('DSP oluşturulurken hata oluştu:', err);
      setError(err.message || 'DSP oluşturulurken hata oluştu');
    }
  };

  // Clear notifications after timeout
  const clearNotifications = () => {
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 3000);
  };

  const handleDelete = async (id: number) => {
    // Show confirmation dialog before deleting
    const confirmed = window.confirm('Bu DSP kaydını silmek istediğinize emin misiniz?');
    if (!confirmed) {
      return; // User cancelled the deletion
    }
    
    try {
      await deleteDsp(id);
      setSuccess('DSP başarıyla silindi!');
      fetchDsps();
      
      // Close modal if it was open for this DSP
      if (selectedDsp && selectedDsp.id === id) {
        setIsModalOpen(false);
        setSelectedDsp(null);
      }
      
      clearNotifications();
    } catch (err: any) {
      console.error('DSP silinirken hata oluştu:', err);
      const errorMessage = err.message || 'DSP silinirken hata oluştu';
      setError(errorMessage);
      clearNotifications();
    }
  };

  const handleClose = () => {
    // Redirect to dashboard
    navigate('/');
  };

  // State for modal dialog
  const [selectedDsp, setSelectedDsp] = useState<DspData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // State for edit form data
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    assignedMinutes: 11900
  });
  
  const handleEditFormDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special handling for name fields in edit form - prevent numbers
    if (name === 'firstName' || name === 'lastName') {
      // Remove any numeric characters
      const cleanValue = value.replace(/\d/g, '');
      setEditFormData(prev => ({
        ...prev,
        [name]: cleanValue
      }));
    }
    // Special handling for phone number formatting in edit form
    else if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setEditFormData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: name === 'assignedMinutes' ? (value === '' ? 0 : parseInt(value) || 0) : value
      }));
    }
  };
  
  const handleUpdateDsp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDsp) return;
    
    // Validation checks for edit form
    if (!isValidName(editFormData.firstName)) {
      setError('Ad sadece harf içermelidir');
      clearNotifications();
      return;
    }
    
    if (!isValidName(editFormData.lastName)) {
      setError('Soyad sadece harf içermelidir');
      clearNotifications();
      return;
    }
    
    if (!isValidPhone(editFormData.phone)) {
      setError('Telefon numarası 5xx xxx xx xx formatında olmalıdır');
      clearNotifications();
      return;
    }
    
    if (editFormData.assignedMinutes > 11900) {
      setError('Atanan dakika 11.900\'ü geçemez');
      clearNotifications();
      return;
    }
    
    try {
      await updateDsp(selectedDsp.id, editFormData);
      setSuccess('DSP başarıyla güncellendi!');
      closeModal();
      fetchDsps(); // Refresh the DSPs list
      
      clearNotifications();
    } catch (err: any) {
      console.error('DSP güncellenirken hata oluştu:', err);
      const errorMessage = err.message || 'DSP güncellenirken hata oluştu';
      setError(errorMessage);
      clearNotifications();
    }
  };

  const handleEdit = async (id: number) => {
    // Find the DSP by id
    const dsp = dsps.find(d => d.id === id);
    if (dsp) {
      setSelectedDsp(dsp);
      setEditFormData({
        firstName: dsp.firstName,
        lastName: dsp.lastName,
        phone: dsp.phone,
        assignedMinutes: dsp.assignedMinutes || 11900
      });
      setIsEditMode(true);
      setIsModalOpen(true);
    } else {
      setError('DSP bulunamadı');
    }
  };

  // Function to open modal with DSP details
  const openDspDetails = async (dsp: DspData) => {
    // Fetch assigned workplaces when opening the DSP details modal
    try {
      const workplaces = await getDspAssignedWorkplaces(dsp.id);
      setAssignedWorkplaces(workplaces);
      setSelectedDspForWorkplaces(dsp);
    } catch (error) {
      console.error('Error fetching assigned workplaces:', error);
      setAssignedWorkplaces([]);
    }
    
    setSelectedDsp(dsp);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Function to open modal in edit mode
  const openEditDsp = (dsp: DspData) => {
    setSelectedDsp(dsp);
    setEditFormData({
      firstName: dsp.firstName,
      lastName: dsp.lastName,
      phone: dsp.phone,
      assignedMinutes: dsp.assignedMinutes || 11900
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDsp(null);
    setIsEditMode(false);
  };

  // State for assigned workplaces modal
  const [isAssignedWorkplacesModalOpen, setIsAssignedWorkplacesModalOpen] = useState(false);
  const [assignedWorkplaces, setAssignedWorkplaces] = useState<any[]>([]);
  const [selectedDspForWorkplaces, setSelectedDspForWorkplaces] = useState<DspData | null>(null);
  
  // Function to close assigned workplaces modal
  const closeAssignedWorkplacesModal = () => {
    setIsAssignedWorkplacesModalOpen(false);
    setAssignedWorkplaces([]);
    setSelectedDspForWorkplaces(null);
  };

  // Function to clear form data
  const clearFormData = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      assignedMinutes: 11900
    });
  };

  return (
    <div className="dsp-card-page">
      {/* Popup notifications */}
      {success && (
        <div className="popup-notification alert alert-info">
          {success}
        </div>
      )}
      {error && (
        <div className="popup-notification alert alert-warning">
          {error}
        </div>
      )}
      
      <div className="dsp-page-layout">
        {/* New DSP Card - Left */}
        <div className="new-dsp-section">
          <div className="draggable-card new-dsp-card">
            <div className="window">
              <div className="window-header">
                <span>Yeni DSP Kayıt</span>
              </div>
              <div className="window-content">
                <form onSubmit={handleSubmit} className="dsp-form">
                  <div className="form-row">
                    <div className="form-col">
                      <div className="form-group">
                        <label className="form-label">Ad:</label>
                        <input
                          type="text"
                          name="firstName"
                          className="form-input"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-col">
                      <div className="form-group">
                        <label className="form-label">Soyad:</label>
                        <input
                          type="text"
                          name="lastName"
                          className="form-input"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Telefon:</label>
                    <input
                      type="text"
                      name="phone"
                      className="form-input"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="5xx xxx xx xx"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Atanan Dakika:</label>
                    <input
                      type="number"
                      name="assignedMinutes"
                      className="form-input"
                      value={formData.assignedMinutes}
                      onChange={handleChange}
                      min="0"
                      max="11900"
                      required
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      Kaydet
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setFormData({
                      firstName: '',
                      lastName: '',
                      phone: '',
                      assignedMinutes: 11900
                    })}>
                      Temizle
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        
        {/* Statistics Card - Right */}
        <div className="statistics-section">
          <div className="draggable-card statistics-card">
            <div className="window">
              <div className="window-header">
                <span>İstatistikler</span>
              </div>
              <div className="window-content">
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-label">Toplam DSP</div>
                    <div className="stat-value">{dspStats.totalCount}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Toplam Atanan Dakika</div>
                    <div className="stat-value">{dspStats.totalMinutes}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Toplam Kullanılan Dakika</div>
                    <div className="stat-value">{dspStats.usedMinutes}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Toplam Kalan Dakika</div>
                    <div className="stat-value">{dspStats.remainingMinutes}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Registered DSPs List - Center */}
      <div className="dsps-list-section">
        <div className="dsps-container">
          <div className="header-row">
            <div className="header-cell">Ad</div>
            <div className="header-cell">Soyad</div>
            <div className="header-cell">Toplam DK</div>
            <div className="header-cell">Atana DK</div>
          </div>
          <div className="dsps-list">
            {dsps.map((dsp) => (
              <div 
                key={dsp.id} 
                className="dsp-row"
                onClick={() => handleDspClick(dsp)}
              >
                <div className="dsp-cell">{dsp.firstName}</div>
                <div className="dsp-cell">{dsp.lastName}</div>
                <div className="dsp-cell">{dsp.assignedMinutes}</div>
                <div className="dsp-cell">{dsp.usedMinutes || 0}</div>
              </div>
            ))}
            {dsps.length === 0 && (
              <div className="no-dsps">Kayıtlı DSP bulunmamaktadır</div>
            )}
          </div>
        </div>
      </div>
      
      {/* DSP Details Modal */}
      {isModalOpen && selectedDsp && (
        <div 
          className="modal-overlay" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div 
            className="modal-content draggable-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '50%',
              height: 500,
              maxWidth: '90vw',
              maxHeight: '90vh',
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              margin: 0,
              zIndex: 2001
            }}
          >
            <div className="window" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div 
                className="window-header"
                style={{ userSelect: 'none' }}
              >
                <span>{isEditMode ? 'DSP Düzenle' : 'DSP Detayları'}</span>
                <div className="window-controls">
                  <button className="window-button" onClick={closeModal} aria-label="Kapat">×</button>
                </div>
              </div>
              <div className="window-content">
                {isEditMode ? (
                  // Edit form
                  <form onSubmit={handleUpdateDsp} className="edit-form">
                    <div className="form-row">
                      <div className="form-col">
                        <div className="form-group">
                          <label className="form-label">Ad:</label>
                          <input
                            type="text"
                            name="firstName"
                            className="form-input"
                            value={editFormData.firstName}
                            onChange={handleEditFormDataChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-col">
                        <div className="form-group">
                          <label className="form-label">Soyad:</label>
                          <input
                            type="text"
                            name="lastName"
                            className="form-input"
                            value={editFormData.lastName}
                            onChange={handleEditFormDataChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Telefon:</label>
                      <input
                        type="text"
                        name="phone"
                        className="form-input"
                        value={editFormData.phone}
                        onChange={handleEditFormDataChange}
                        placeholder="5xx xxx xx xx"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Atanan Dakika:</label>
                      <input
                        type="number"
                        name="assignedMinutes"
                        className="form-input"
                        value={editFormData.assignedMinutes}
                        onChange={handleEditFormDataChange}
                        min="0"
                        max="11900"
                        required
                      />
                    </div>
                    
                    <div className="modal-actions">
                      <button type="submit" className="btn btn-primary">Güncelle</button>
                      <button type="button" className="btn" onClick={closeModal}>İptal</button>
                    </div>
                  </form>
                ) : (
                  // View mode
                  <>
                    <div className="dsp-detail-info">
                      <div className="dsp-detail-row">
                        <strong>Ad:</strong> {selectedDsp.firstName}
                      </div>
                      <div className="dsp-detail-row">
                        <strong>Soyad:</strong> {selectedDsp.lastName}
                      </div>
                      <div className="dsp-detail-row">
                        <strong>Telefon:</strong> {selectedDsp.phone}
                      </div>
                      <div className="dsp-detail-row">
                        <strong>Toplam Dakika:</strong> {selectedDsp.assignedMinutes}
                      </div>
                      <div className="dsp-detail-row">
                        <strong>Atanan Dakika:</strong> {selectedDsp.usedMinutes || 0}
                      </div>
                      <div className="dsp-detail-row">
                        <strong>Kalan Dakika:</strong> {selectedDsp.assignedMinutes - (selectedDsp.usedMinutes || 0)}
                      </div>
                      
                      {/* Workplace assignment information - show "atandı" and "gör" button if assigned */}
                      <div className="dsp-detail-row">
                        <strong>Atandığı İş Yeri:</strong> 
                        {assignedWorkplaces.length > 0 ? (
                          <>
                            <span>atandı</span>
                            <button 
                              className="btn btn-primary" 
                              style={{ marginTop: '22px' , marginLeft: '10px', padding: '1px 14px', fontSize: '15px' }}
                              onClick={() => setIsAssignedWorkplacesModalOpen(true)}
                            >
                              gör
                            </button>
                          </>
                        ) : (
                          <span>Atanmamış</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="modal-actions">
                      <button className="btn btn-primary" onClick={() => openEditDsp(selectedDsp)}>Düzenle</button>
                      <button className="btn btn-danger" onClick={() => {
                        const confirmed = window.confirm('Bu DSP kaydını silmek istediğinize emin misiniz?');
                        if (confirmed) {
                          handleDelete(selectedDsp.id);
                        }
                      }}>Sil</button>
                      <button className="btn btn-close" onClick={closeModal}>Kapat</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Workplaces Modal */}
      <AssignedWorkplacesModal
        isOpen={isAssignedWorkplacesModalOpen}
        onClose={closeAssignedWorkplacesModal}
        workplaces={assignedWorkplaces}
        personnelName={selectedDspForWorkplaces ? `${selectedDspForWorkplaces.firstName} ${selectedDspForWorkplaces.lastName}` : ''}
        personnelType="DSP"
      />
    </div>
  );
};

export default DspCardPage;
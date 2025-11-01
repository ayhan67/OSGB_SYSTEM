import React, { useState, useEffect } from 'react';
import { createDoctor, getAllDoctors, deleteDoctor, updateDoctor, getDoctorAssignedWorkplaces } from '../services/api';
import './DoctorCardPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import AssignedWorkplacesModal from './AssignedWorkplacesModal';

// Define interface for form data
interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  assignedMinutes: number;
}

// Define interface for doctor data
interface Doctor {
  id: number;

  firstName: string;
  lastName: string;
  phone: string;
  assignedMinutes: number;
  usedMinutes?: number;
  assignedWorkplace?: string;
}

const DoctorCardPage = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    assignedMinutes: 11900
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
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

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Add useEffect to refresh data when location changes (navigation)
  useEffect(() => {
    console.log('DoctorCardPage: Location changed to:', location.pathname, 'at:', new Date().toISOString());
    fetchDoctors();
  }, [location.pathname]);

  // Add useEffect to refresh data when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('DoctorCardPage: Window focused, refreshing doctors...');
      fetchDoctors();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Add useEffect to refresh data when workplace is created
  useEffect(() => {
    const handleWorkplaceCreated = () => {
      console.log('DoctorCardPage: Workplace created, refreshing doctors...');
      fetchDoctors();
    };

    window.addEventListener('workplaceCreated', handleWorkplaceCreated);
    return () => {
      window.removeEventListener('workplaceCreated', handleWorkplaceCreated);
    };
  }, []);

  const fetchDoctors = async () => {
    try {
      const data = await getAllDoctors();
      setDoctors(data);
    } catch (err) {
      console.error('Hekimler getirilirken hata oluştu:', err);
    }
  };

  // Calculate statistics for doctors
  const calculateDoctorStats = () => {
    const stats = {
      totalCount: doctors.length,
      totalMinutes: 0,
      usedMinutes: 0,
      remainingMinutes: 0
    };

    doctors.forEach(doctor => {
      stats.totalMinutes += doctor.assignedMinutes || 0;
      stats.usedMinutes += doctor.usedMinutes || 0;
      stats.remainingMinutes += (doctor.assignedMinutes || 0) - (doctor.usedMinutes || 0);
    });

    return stats;
  };

  const doctorStats = calculateDoctorStats();

  // Function to get assigned workplace names for a doctor
  const getAssignedWorkplaceNames = (doctorId: number) => {
    // This would require a new endpoint to get workplaces assigned to a doctor
    // For now, we'll return a placeholder
    return 'Atanmamış';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for name fields - prevent numbers
    if (name === 'firstName' || name === 'lastName') {
      // Remove any numeric characters
      const cleanValue = value.replace(/\d/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: cleanValue
      }));
    }
    // Special handling for phone number formatting
    else if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setFormData(prev => ({
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
      await createDoctor(formData);
      setSuccess('Hekim başarıyla oluşturuldu!');
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        assignedMinutes: 11900
      });
      fetchDoctors();
    } catch (err: any) {
      console.error('Hekim oluşturulurken hata oluştu:', err);
      setError(err.message || 'Hekim oluşturulurken hata oluştu');
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
    const confirmed = window.confirm('Bu hekim kaydını silmek istediğinize emin misiniz?');
    if (!confirmed) {
      return; // User cancelled the deletion
    }
    
    try {
      await deleteDoctor(id);
      setSuccess('Hekim başarıyla silindi!');
      fetchDoctors();
      
      // Close modal if it was open for this doctor
      if (selectedDoctor && selectedDoctor.id === id) {
        setIsModalOpen(false);
        setSelectedDoctor(null);
      }
      
      clearNotifications();
    } catch (err: any) {
      console.error('Hekim silinirken hata oluştu:', err);
      const errorMessage = err.message || 'Hekim silinirken hata oluştu';
      setError(errorMessage);
      clearNotifications();
    }
  };

  const handleClose = () => {
    // Redirect to dashboard
    navigate('/');
  };

  // State for modal dialog
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
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
  
  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    
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
      await updateDoctor(selectedDoctor.id, editFormData);
      setSuccess('Hekim başarıyla güncellendi!');
      closeModal();
      fetchDoctors(); // Refresh the doctors list
      
      // Emit an event to notify other components that doctor data has changed
      window.dispatchEvent(new CustomEvent('doctorUpdated', { detail: { doctorId: selectedDoctor.id } }));
      
      clearNotifications();
    } catch (err: any) {
      console.error('Hekim güncellenirken hata oluştu:', err);
      const errorMessage = err.message || 'Hekim güncellenirken hata oluştu';
      setError(errorMessage);
      clearNotifications();
    }
  };

  const handleEdit = async (id: number) => {
    // Find the doctor by id
    const doctor = doctors.find(doc => doc.id === id);
    if (doctor) {
      setSelectedDoctor(doctor);
      setEditFormData({
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        phone: doctor.phone,
        assignedMinutes: doctor.assignedMinutes || 11900
      });
      setIsEditMode(true);
      setIsModalOpen(true);
    } else {
      setError('Hekim bulunamadı');
    }
  };

  // Function to open modal with doctor details
  const openDoctorDetails = async (doctor: Doctor) => {
    // Fetch assigned workplaces when opening the doctor details modal
    try {
      const workplaces = await getDoctorAssignedWorkplaces(doctor.id);
      setAssignedWorkplaces(workplaces);
      setSelectedDoctorForWorkplaces(doctor);
    } catch (error) {
      console.error('Error fetching assigned workplaces:', error);
      setAssignedWorkplaces([]);
    }
    
    setSelectedDoctor(doctor);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Function to open modal in edit mode
  const openEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    // Populate edit form with existing doctor data
    // Phone number is retained from existing data and not automatically cleared
    setEditFormData({
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      phone: doctor.phone,  // Retain existing phone number
      assignedMinutes: doctor.assignedMinutes || 11900
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDoctor(null);
    setIsEditMode(false);
  };

  // State for assigned workplaces modal
  const [isAssignedWorkplacesModalOpen, setIsAssignedWorkplacesModalOpen] = useState(false);
  const [assignedWorkplaces, setAssignedWorkplaces] = useState<any[]>([]);
  const [selectedDoctorForWorkplaces, setSelectedDoctorForWorkplaces] = useState<Doctor | null>(null);
  
  // Function to close assigned workplaces modal
  const closeAssignedWorkplacesModal = () => {
    setIsAssignedWorkplacesModalOpen(false);
    setAssignedWorkplaces([]);
    setSelectedDoctorForWorkplaces(null);
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
    <div className="doctor-card-page">
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
      
      <div className="doctor-page-layout">
        {/* New Doctor Card - Left */}
        <div className="new-doctor-section">
          <div className="draggable-card new-doctor-card">
            <div className="window">
              <div className="window-header">
                <span>Yeni Hekim Kayıt</span>
              </div>
              <div className="window-content">
                <form onSubmit={handleSubmit} className="doctor-form">
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
                    <div className="stat-label">Toplam Hekim</div>
                    <div className="stat-value">{doctorStats.totalCount}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Toplam Atanan Dakika</div>
                    <div className="stat-value">{doctorStats.totalMinutes}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Toplam Kullanılan Dakika</div>
                    <div className="stat-value">{doctorStats.usedMinutes}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Toplam Kalan Dakika</div>
                    <div className="stat-value">{doctorStats.remainingMinutes}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Registered Doctors List - Center */}
      <div className="doctors-list-section">
        <div className="doctors-container">
          <div className="header-row">
            <div className="header-cell">Ad</div>
            <div className="header-cell">Soyad</div>
            <div className="header-cell">Toplam DK</div>
            <div className="header-cell">Atana DK</div>
          </div>
          <div className="doctors-list">
            {doctors.map((doctor) => (
              <div 
                key={doctor.id} 
                className="doctor-row"
                onClick={() => openDoctorDetails(doctor)}
              >
                <div className="doctor-cell">{doctor.firstName}</div>
                <div className="doctor-cell">{doctor.lastName}</div>
                <div className="doctor-cell">{doctor.assignedMinutes}</div>
                <div className="doctor-cell">{doctor.usedMinutes || 0}</div>
              </div>
            ))}
            {doctors.length === 0 && (
              <div className="no-doctors">Kayıtlı hekim bulunmamaktadır</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Doctor Details Modal */}
      {isModalOpen && selectedDoctor && (
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
                <span>{isEditMode ? 'Hekim Düzenle' : 'Hekim Detayları'}</span>
                <div className="window-controls">
                  <button className="window-button" onClick={closeModal}>×</button>
                </div>
              </div>
              <div className="window-content">
                {isEditMode ? (
                  <form onSubmit={handleUpdateDoctor} className="edit-form">
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
                    <div className="doctor-detail-info">
                      <div className="doctor-detail-row">
                        <strong>Ad:</strong> {selectedDoctor.firstName}
                      </div>
                      <div className="doctor-detail-row">
                        <strong>Soyad:</strong> {selectedDoctor.lastName}
                      </div>
                      <div className="doctor-detail-row">
                        <strong>Telefon:</strong> {selectedDoctor.phone}
                      </div>
                      <div className="doctor-detail-row">
                        <strong>Toplam Dakika:</strong> {selectedDoctor.assignedMinutes}
                      </div>
                      <div className="doctor-detail-row">
                        <strong>Atanan Dakika:</strong> {selectedDoctor.usedMinutes || 0}
                      </div>
                      <div className="doctor-detail-row">
                        <strong>Kalan Dakika:</strong> {selectedDoctor.assignedMinutes - (selectedDoctor.usedMinutes || 0)}
                      </div>
                      
                      {/* Workplace assignment information - show "atandı" and "gör" button if assigned */}
                      <div className="doctor-detail-row">
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
                      <button 
                        className="btn btn-primary" 
                        onClick={() => openEditDoctor(selectedDoctor)}
                      >
                        Düzenle
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => {
                          const confirmed = window.confirm('Bu hekim kaydını silmek istediğinize emin misiniz?');
                          if (confirmed) {
                            handleDelete(selectedDoctor.id);
                          }
                        }}
                      >
                        Sil
                      </button>
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
        personnelName={selectedDoctorForWorkplaces ? `${selectedDoctorForWorkplaces.firstName} ${selectedDoctorForWorkplaces.lastName}` : ''}
        personnelType="Hekim"
      />
    </div>
  );
};

export default DoctorCardPage;
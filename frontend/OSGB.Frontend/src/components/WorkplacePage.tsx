import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import './WorkplacePage.css';
import { getAllWorkplaces, getAllExperts, getAllDoctors, getAllDsps, updateWorkplace, deleteWorkplace } from '../services/api';

// Define types
interface Workplace {
  id: number;
  name: string;
  sskRegistrationNo: string;
  riskLevel: string;
  assignedExpertId: string;
  assignedDoctorId: string;
  assignedDspId: string;
  approvalStatus: string;
  // Add optional personnel objects that will be included from backend
  Expert?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  Doctor?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  Dsp?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

const WorkplacePage: React.FC = () => {
  console.log('WorkplacePage component rendered at:', new Date().toISOString());
  const location = useLocation();
  
  // State declarations
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [allExperts, setAllExperts] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [allDsps, setAllDsps] = useState<any[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalFormData, setModalFormData] = useState<Partial<Workplace>>({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const workplacesPerPage = 10;

  // Function to fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      console.log('Fetching all data from backend...');
      
      // Fetch all data in parallel
      const [workplacesData, expertsData, doctorsData, dspsData] = await Promise.all([
        getAllWorkplaces(),
        getAllExperts(),
        getAllDoctors(),
        getAllDsps()
      ]);
      
      console.log('Received all data:', { 
        workplacesCount: workplacesData.length, 
        expertsCount: expertsData.length, 
        doctorsCount: doctorsData.length, 
        dspsCount: dspsData.length 
      });
      
      // Filter only approved workplaces (onaylandi)
      const approvedWorkplaces = workplacesData.filter((workplace: Workplace) => 
        workplace.approvalStatus === 'onaylandi'
      );
      
      console.log('Approved workplaces count:', approvedWorkplaces.length);
      
      // Update all state
      setWorkplaces(approvedWorkplaces);
      setAllExperts(expertsData);
      setAllDoctors(doctorsData);
      setAllDsps(dspsData);
      console.log('State updated after data fetch');
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Veri alınırken hata oluştu');
    }
  }, []);

  // Load all data from backend on component mount
  useEffect(() => {
    console.log('WorkplacePage useEffect running - fetching all data at:', new Date().toISOString());
    fetchAllData();
  }, []);

  // Refresh data when location changes
  useEffect(() => {
    console.log('Location changed to:', location.pathname, 'at:', new Date().toISOString());
    fetchAllData();
  }, [location.pathname]);

  // Refresh data when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused, refreshing all data...');
      fetchAllData();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  // Function to handle success message timeout
  const handleSuccessTimeout = () => {
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  // Function to handleError message timeout
  const handleErrorTimeout = () => {
    setTimeout(() => {
      setError('');
    }, 3000);
  };

  // Function to format risk level in Turkish
  const formatRiskLevel = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'low':
        return 'Az Tehlikeli';
      case 'dangerous':
        return 'Tehlikeli';
      case 'veryDangerous':
        return 'Çok Tehlikeli';
      default:
        return 'Belirtilmemiş';
    }
  };
  
  // Function to get expert name by ID
  const getExpertName = (expertId: string, workplace?: Workplace) => {
    // First try to get name from included data in workplace
    if (workplace && workplace.Expert) {
      console.log('Using included Expert data:', workplace.Expert);
      // Check if firstName and lastName exist
      if (workplace.Expert.firstName && workplace.Expert.lastName) {
        return `${workplace.Expert.firstName} ${workplace.Expert.lastName}`;
      }
    }
    
    // Fallback to lookup in allExperts array
    if (!expertId) return 'Atanmamış';
    const expert = allExperts.find(expert => expert.id === parseInt(expertId));
    if (expert && expert.firstName && expert.lastName) {
      return `${expert.firstName} ${expert.lastName}`;
    }
    return 'Bilinmeyen Uzman';
  };
  
  // Function to get doctor name by ID
  const getDoctorName = (doctorId: string, workplace?: Workplace) => {
    // First try to get name from included data in workplace
    if (workplace && workplace.Doctor) {
      console.log('Using included Doctor data:', workplace.Doctor);
      // Check if firstName and lastName exist
      if (workplace.Doctor.firstName && workplace.Doctor.lastName) {
        return `${workplace.Doctor.firstName} ${workplace.Doctor.lastName}`;
      }
    }
    
    // Fallback to lookup in allDoctors array
    if (!doctorId) return 'Atanmamış';
    const doctor = allDoctors.find(doctor => doctor.id === parseInt(doctorId));
    if (doctor && doctor.firstName && doctor.lastName) {
      return `${doctor.firstName} ${doctor.lastName}`;
    }
    return 'Bilinmeyen Hekim';
  };
  
  // Function to get DSP name by ID
  const getDspName = (dspId: string, workplace?: Workplace) => {
    // First try to get name from included data in workplace
    if (workplace && workplace.Dsp) {
      console.log('Using included Dsp data:', workplace.Dsp);
      // Check if firstName and lastName exist
      if (workplace.Dsp.firstName && workplace.Dsp.lastName) {
        return `${workplace.Dsp.firstName} ${workplace.Dsp.lastName}`;
      }
    }
    
    // Fallback to lookup in allDsps array
    if (!dspId) return 'Atanmamış';
    const dsp = allDsps.find(dsp => dsp.id === parseInt(dspId));
    if (dsp && dsp.firstName && dsp.lastName) {
      return `${dsp.firstName} ${dsp.lastName}`;
    }
    return 'Bilinmeyen DSP';
  };
  
  const handleRowClick = (workplace: Workplace) => {
    setModalFormData(workplace);
    setIsModalOpen(true);
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };
  
  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setModalFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (modalFormData.id) {
        // Ensure all required fields are included and handle null values for assigned IDs
        const workplaceData = {
          ...modalFormData,
          // Handle null values for assigned IDs
          assignedExpertId: modalFormData.assignedExpertId || null,
          assignedDoctorId: modalFormData.assignedDoctorId || null,
          assignedDspId: modalFormData.assignedDspId || null
        };
        
        // Update existing workplace
        const updatedWorkplace = await updateWorkplace(modalFormData.id, workplaceData);
        
        // Show success message
        setSuccess('başarı ile güncellendi');
        
        // Close modal first
        setIsModalOpen(false);
        
        // Refresh all data from backend to ensure consistency
        await fetchAllData();
        
        // Clear success notification after 3 seconds
        handleSuccessTimeout();
      }
    } catch (error: any) {
      console.error('Error updating workplace:', error);
      // Provide more specific error message
      if (error.message) {
        setError(`İş yeri güncellenirken hata oluştu: ${error.message}`);
      } else {
        setError('İş yeri güncellenirken hata oluştu');
      }
      // Clear error notification after 3 seconds
      handleErrorTimeout();
    }
  };

  const handleDeleteWorkplace = () => {
    // Show confirmation dialog before deleting
    setShowDeleteConfirmation(true);
  };

  // Function to confirm deletion
  const confirmDeleteWorkplace = async () => {
    try {
      if (modalFormData.id) {
        // Delete from backend
        await deleteWorkplace(modalFormData.id);
        
        // Show success message
        setSuccess('İş yeri başarıyla silindi!');
        
        // Close confirmation dialog and modal
        setShowDeleteConfirmation(false);
        closeModal();
        
        // Refresh all data from backend to ensure consistency
        await fetchAllData();
        
        // Clear success notification after 3 seconds
        handleSuccessTimeout();
      } else {
        setShowDeleteConfirmation(false);
        closeModal();
      }
    } catch (error: any) {
      console.error('Error deleting workplace:', error);
      // Provide more specific error message
      if (error.message) {
        setError(`İş yeri silinirken hata oluştu: ${error.message}`);
      } else {
        setError('İş yeri silinirken hata oluştu');
      }
      // Clear error notification after 3 seconds
      handleErrorTimeout();
    }
  };

  // Function to cancel deletion
  const cancelDeleteWorkplace = () => {
    setShowDeleteConfirmation(false);
  };

  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setModalFormData({});
    // Allow background scrolling when modal is closed
    document.body.style.overflow = 'auto';
  };
  
  // Pagination functions
  const indexOfLastWorkplace = currentPage * workplacesPerPage;
  const indexOfFirstWorkplace = indexOfLastWorkplace - workplacesPerPage;
  const currentWorkplaces = workplaces.slice(indexOfFirstWorkplace, indexOfLastWorkplace);
  const totalPages = Math.ceil(workplaces.length / workplacesPerPage);
  
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="workplace-page-container">
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
      
      {/* Delete Confirmation Popup */}
      {showDeleteConfirmation && (
        <div className="popup-overlay" onClick={cancelDeleteWorkplace}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Kayıt Silme Onayı</h3>
              <button className="popup-close" onClick={cancelDeleteWorkplace}>×</button>
            </div>
            <div className="popup-body">
              <p>Kayıdı gerçekten silmek istiyor musunuz?</p>
            </div>
            <div className="popup-footer">
              <button className="btn btn-secondary" onClick={cancelDeleteWorkplace}>İptal</button>
              <button className="btn btn-danger" onClick={confirmDeleteWorkplace}>Sil</button>
            </div>
          </div>
        </div>
      )}

      <div className="workplace-page-content">
        {/* Workplaces list */}
        <div className="workplaces-container">
          <div className="header-row">
            <div className="header-cell">İş Yeri Adı</div>
            <div className="header-cell">Sicil No</div>
            <div className="header-cell">Tehlike Sınıfı</div>
            <div className="header-cell">Atanan Uzman</div>
          </div>
          
          <div className="workplaces-list">
            {currentWorkplaces.map(workplace => (
              <div 
                key={workplace.id} 
                className="workplace-row"
                onClick={() => handleRowClick(workplace)}
              >
                <div className="workplace-cell">{workplace.name}</div>
                <div className="workplace-cell">{workplace.sskRegistrationNo}</div>
                <div className="workplace-cell">
                  <span className={`risk-level-${workplace.riskLevel}`}>
                    {formatRiskLevel(workplace.riskLevel)}
                  </span>
                </div>
                <div className="workplace-cell">{getExpertName(workplace.assignedExpertId, workplace)}</div>
              </div>
            ))}
            
            {workplaces.length === 0 && (
              <div className="no-workplaces">
                Onaylanmış iş yeri bulunmamaktadır.
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-button"
                onClick={() => handlePageChange(currentPage > 1 ? currentPage - 1 : 1)}
                disabled={currentPage === 1}
              >
                Önceki
              </button>
              <span className="pagination-info">
                Sayfa {currentPage} / {totalPages}
              </span>
              <button 
                className="pagination-button"
                onClick={() => handlePageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
                disabled={currentPage === totalPages}
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal for viewing/editing workplace */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Kayıtlı İş Yeri Kartı</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleModalSubmit}>
                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label className="form-label">İş Yeri Adı:</label>
                      <input
                        type="text"
                        name="name"
                        value={modalFormData.name || ''}
                        onChange={handleModalChange}
                        className="form-input"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="form-col">
                    <div className="form-group">
                      <label className="form-label">SGK İşyeri Sicil No:</label>
                      <input
                        type="text"
                        name="sskRegistrationNo"
                        value={modalFormData.sskRegistrationNo || ''}
                        onChange={handleModalChange}
                        className="form-input"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label className="form-label">Tehlike Sınıfı:</label>
                      <input
                        type="text"
                        name="riskLevel"
                        value={modalFormData.riskLevel ? formatRiskLevel(modalFormData.riskLevel) : ''}
                        onChange={handleModalChange}
                        className="form-input"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label className="form-label">Atanan Uzman:</label>
                      <select
                        name="assignedExpertId"
                        value={modalFormData.assignedExpertId || ''}
                        onChange={handleModalChange}
                        className="form-select"
                      >
                        <option value="">Seçiniz</option>
                        {allExperts.map(expert => (
                          <option key={expert.id} value={expert.id}>
                            {expert.firstName} {expert.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-col">
                    <div className="form-group">
                      <label className="form-label">Atanan Hekim:</label>
                      <select
                        name="assignedDoctorId"
                        value={modalFormData.assignedDoctorId || ''}
                        onChange={handleModalChange}
                        className="form-select"
                      >
                        <option value="">Seçiniz</option>
                        {allDoctors.map(doctor => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.firstName} {doctor.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label className="form-label">Atanan DSP:</label>
                      <select
                        name="assignedDspId"
                        value={modalFormData.assignedDspId || ''}
                        onChange={handleModalChange}
                        className="form-select"
                      >
                        <option value="">Seçiniz</option>
                        {allDsps.map(dsp => (
                          <option key={dsp.id} value={dsp.id}>
                            {dsp.firstName} {dsp.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn btn-danger" onClick={handleDeleteWorkplace}>
                    Sil
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Güncelle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkplacePage;
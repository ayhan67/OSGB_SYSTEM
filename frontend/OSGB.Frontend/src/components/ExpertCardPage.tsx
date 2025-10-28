import React, { useState, useEffect } from 'react';
import { createExpert, getAllExperts, deleteExpert, updateExpert, getExpertAssignedWorkplaces } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './ExpertCardPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import AssignedWorkplacesModal from './AssignedWorkplacesModal';

const ExpertCardPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    expertiseClass: 'A',
    assignedMinutes: 11900
  });
  const [editingExpert, setEditingExpert] = useState<any>(null);
  const [experts, setExperts] = useState<any[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const { organizationId } = useAuth();
  
  // Load saved positions from localStorage or use defaults
  const getSavedCardState = (cardType: 'new' | 'list') => {
    try {
      const savedState = localStorage.getItem(`expertCard_${cardType}_state`);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Validate that the parsed state has the required properties
        if (typeof parsedState === 'object' && parsedState !== null &&
            'x' in parsedState && 'y' in parsedState && 
            'width' in parsedState && 'height' in parsedState) {
          return {
            ...parsedState,
            isDragging: false,
            isResizing: false,
            resizeDirection: '',
            dragStartX: 0,
            dragStartY: 0,
            resizeStartX: 0,
            resizeStartY: 0
          };
        }
      }
    } catch (e) {
      // If there's an error parsing, we'll use the default state
      console.warn(`Failed to parse saved state for ${cardType} card, using defaults`);
    }
    
    // Default positions
    if (cardType === 'new') {
      return {
        x: 50,
        y: 50,  // Changed from -175 to 50 to avoid covering navbar
        width: 400,
        height: 500,
        isDragging: false,
        isResizing: false,
        resizeDirection: '',
        dragStartX: 0,
        dragStartY: 0,
        resizeStartX: 0,
        resizeStartY: 0,
        originalX: 50,
        originalY: 50,  // Changed from -175 to 50 to avoid covering navbar
        originalWidth: 400,
        originalHeight: 500
      };
    } else {
      return {
        x: 500,
        y: 50,  // Changed from -175 to 50 to avoid covering navbar
        width: 500,
        height: 500,
        isDragging: false,
        isResizing: false,
        resizeDirection: '',
        dragStartX: 0,
        dragStartY: 0,
        resizeStartX: 0,
        resizeStartY: 0,
        originalX: 500,
        originalY: 50,  // Changed from -175 to 50 to avoid covering navbar
        originalWidth: 500,
        originalHeight: 500
      };
    }
  };

  // Get saved modal state or use defaults
  const getSavedModalState = () => {
    try {
      const savedState = localStorage.getItem('expertModal_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Validate that the parsed state has the required properties
        if (typeof parsedState === 'object' && parsedState !== null &&
            'width' in parsedState && 'height' in parsedState) {
          return {
            ...parsedState,
            isResizing: false,
            resizeDirection: '',
            resizeStartX: 0,
            resizeStartY: 0,
            originalWidth: parsedState.width,
            originalHeight: parsedState.height
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved modal state, using defaults');
    }
    
    // Default modal size with centered position
    const defaultWidth = '50%';
    const defaultHeight = 500;
    return {
      width: defaultWidth,
      height: defaultHeight,
      originalX: (window.innerWidth - 400) / 2,
      originalY: (window.innerHeight - defaultHeight) / 2,
      isResizing: false,
      resizeDirection: '',
      resizeStartX: 0,
      resizeStartY: 0,
      originalWidth: defaultWidth,
      originalHeight: defaultHeight
    };
  };

  // State for Expert Modal
  const [modalState, setModalState] = useState(getSavedModalState());
  
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
        [name]: name === 'assignedMinutes' ? parseInt(value) : value
      }));
    }
  };

  // Function to handle clicking on an expert row
  // This function opens the expert details modal when an expert row is clicked
  const handleExpertClick = (expert: any) => {
    openExpertDetails(expert);
  };

  useEffect(() => {
    fetchExperts();
  }, [organizationId]);

  // Add useEffect to refresh data when location changes (navigation)
  useEffect(() => {
    console.log('ExpertCardPage: Location changed to:', location.pathname, 'at:', new Date().toISOString());
    fetchExperts();
  }, [location.pathname]);

  // Add useEffect to refresh data when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('ExpertCardPage: Window focused, refreshing experts...');
      fetchExperts();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Add useEffect to refresh data when workplace is created
  useEffect(() => {
    const handleWorkplaceCreated = () => {
      console.log('ExpertCardPage: Workplace created, refreshing experts...');
      fetchExperts();
    };

    window.addEventListener('workplaceCreated', handleWorkplaceCreated);
    return () => {
      window.removeEventListener('workplaceCreated', handleWorkplaceCreated);
    };
  }, []);

  const fetchExperts = async () => {
    try {
      const data = await getAllExperts();
      setExperts(data);
      setError('');
    } catch (err: any) {
      setError('Uzmanlar alınırken hata oluştu: ' + err.message);
      console.error('Fetch experts error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Ad ve soyad alanları zorunludur');
      return;
    }
    
    if (!isValidName(formData.firstName) || !isValidName(formData.lastName)) {
      setError('Ad ve soyad sadece harf ve Türkçe karakter içerebilir');
      return;
    }
    
    if (!formData.phone.trim()) {
      setError('Telefon numarası zorunludur');
      return;
    }
    
    if (!isValidPhone(formData.phone)) {
      setError('Telefon numarası şu formatta olmalıdır: 5xx xxx xx xx');
      return;
    }
    
    try {
      if (editingExpert) {
        await updateExpert(editingExpert.id, formData);
        setSuccess('Uzman başarıyla güncellendi!');
      } else {
        await createExpert(formData);
        setSuccess('Uzman başarıyla oluşturuldu!');
      }
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        expertiseClass: 'A',
        assignedMinutes: 11900
      });
      
      setEditingExpert(null);
      setError('');
      
      // Refresh experts list
      fetchExperts();
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('expertCreated'));
      
    } catch (err: any) {
      setError(err.message || 'Uzman kaydedilirken hata oluştu');
      console.error('Save expert error:', err);
    }
  };

  // Function to clear form data
  const clearFormData = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      expertiseClass: 'A',
      assignedMinutes: 11900
    });
    setEditingExpert(null);
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
    const confirmed = window.confirm('Bu uzman kaydını silmek istediğinize emin misiniz?');
    if (!confirmed) {
      return; // User cancelled the deletion
    }
    
    try {
      await deleteExpert(id);
      setSuccess('Uzman başarıyla silindi!');
      // Refresh the experts list
      fetchExperts();
      
      // Close modal if it was open for this expert
      if (selectedExpert && selectedExpert.id === id) {
        setIsModalOpen(false);
        setSelectedExpert(null);
      }
      
      clearNotifications();
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMessage = err.message || 'Uzman silinirken hata oluştu';
      setError(errorMessage);
      clearNotifications();
    }
  };

  const handleClose = () => {
    // Redirect to dashboard
    navigate('/');
  };

  // Function to open modal with expert details
  const openExpertDetails = async (expert: any) => {
    // Fetch assigned workplaces when opening the expert details modal
    try {
      const workplaces = await getExpertAssignedWorkplaces(expert.id);
      setAssignedWorkplaces(workplaces);
      setSelectedExpertForWorkplaces(expert);
    } catch (error) {
      console.error('Error fetching assigned workplaces:', error);
      setAssignedWorkplaces([]);
    }
    
    setSelectedExpert(expert);
    setIsEditMode(false);
    setIsModalOpen(true);
    // Reset modal position to center when opening
    const defaultWidth = 100;
    const defaultHeight = 500;
    setModalState((prev: typeof modalState) => ({
      ...prev,
      width: defaultWidth,
      height: defaultHeight,
      originalX: (window.innerWidth - defaultWidth) / 2,
      originalY: (window.innerHeight - defaultHeight) / 2,
      originalWidth: defaultWidth,
      originalHeight: defaultHeight
    }));
  };

  // Function to open modal in edit mode
  const openEditExpert = (expert: any) => {
    setSelectedExpert(expert);
    setEditFormData({
      firstName: expert.firstName || '',
      lastName: expert.lastName || '',
      phone: expert.phone || '',
      expertiseClass: expert.expertiseClass || 'A',
      assignedMinutes: expert.assignedMinutes || 11900
    });
    setIsEditMode(true);
    setIsModalOpen(true);
    // Reset modal position to center when opening
    const defaultWidth = 100;
    const defaultHeight = 500;
    setModalState((prev: typeof modalState) => ({
      ...prev,
      width: defaultWidth,
      height: defaultHeight,
      originalX: (window.innerWidth - defaultWidth) / 2,
      originalY: (window.innerHeight - defaultHeight) / 2,
      originalWidth: defaultWidth,
      originalHeight: defaultHeight
    }));
  };

  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedExpert(null);
    setIsEditMode(false);
  };

  // Function to handle edit action from modal
  const handleEditExpert = async (expert: any) => {
    // This function was a placeholder, but we'll keep it for consistency
    // The actual update is handled by handleUpdateExpert
    console.log('Edit expert called for:', expert);
  };

  // State for modal dialog
  const [selectedExpert, setSelectedExpert] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // State for edit form data
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    expertiseClass: 'A',
    assignedMinutes: 11900
  });
  
  const handleEditFormDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for name fields in edit form - prevent numbers
    if (name === 'firstName' || name === 'lastName') {
      // Remove any numeric characters
      const cleanValue = value.replace(/\d/g, '');
      setEditFormData((prev: typeof editFormData) => ({
        ...prev,
        [name]: cleanValue
      }));
    }
    // Special handling for phone number formatting in edit form
    else if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setEditFormData((prev: typeof editFormData) => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setEditFormData((prev: typeof editFormData) => ({
        ...prev,
        [name]: name === 'assignedMinutes' ? parseInt(value) : value
      }));
    }
  };
  
  const handleUpdateExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpert) return;
    
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
    
    try {
      await updateExpert(selectedExpert.id, editFormData);
      setSuccess('Uzman başarıyla güncellendi!');
      closeModal();
      fetchExperts(); // Refresh the experts list
      
      clearNotifications();
    } catch (err: any) {
      console.error('Update error:', err);
      const errorMessage = err.message || 'Uzman güncellenirken hata oluştu';
      setError(errorMessage);
      clearNotifications();
    }
  };

  const handleEdit = async (id: number) => {
    // Find the expert by id
    const expert = experts.find(exp => exp.id === id);
    if (expert) {
      openEditExpert(expert);
    } else {
      setError('Uzman bulunamadı');
    }
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent, cardType: 'new' | 'list' | 'modal', action: 'drag' | 'resize', direction: string = '') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only support drag and resize for modal since main cards are fixed
    if (cardType === 'modal') {
      if (action === 'drag') {
        // For modal dragging, we need to get the current position
        setModalState((prev: typeof modalState) => ({
          ...prev,
          isDragging: true,
          dragStartX: e.clientX - (prev.originalX || 0),
          dragStartY: e.clientY - (prev.originalY || 0)
        }));
      } else if (action === 'resize') {
        // Get the current modal position relative to the viewport
        const modalElement = e.currentTarget.closest('.modal-content');
        if (modalElement) {
          const rect = modalElement.getBoundingClientRect();
          const currentX = rect.left;
          const currentY = rect.top;
          
          setModalState((prev: typeof modalState) => ({
            ...prev,
            isResizing: true,
            resizeDirection: direction,
            resizeStartX: e.clientX,
            resizeStartY: e.clientY,
            originalX: currentX,
            originalY: currentY,
            originalWidth: prev.width,
            originalHeight: prev.height
          }));
        }
      }
      
      // Ensure global event listeners are attached
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    // Ignore drag and resize for 'new' and 'list' cards since they are fixed
  };

  const handleMouseMove = (e: MouseEvent) => {
    // Handle resizing for Expert Modal
    if (modalState.isResizing) {
      const deltaX = e.clientX - modalState.resizeStartX;
      const deltaY = e.clientY - modalState.resizeStartY;
      
      let newWidth = modalState.originalWidth;
      let newHeight = modalState.originalHeight;
      let newX = modalState.originalX || 0;
      let newY = modalState.originalY || 0;
      
      // Handle different resize directions
      if (modalState.resizeDirection.includes('right')) {
        newWidth = Math.max(300, modalState.originalWidth + deltaX);
      }
      if (modalState.resizeDirection.includes('left')) {
        newWidth = Math.max(300, modalState.originalWidth - deltaX);
        newX = modalState.originalX + deltaX;
      }
      if (modalState.resizeDirection.includes('bottom')) {
        newHeight = Math.max(200, modalState.originalHeight + deltaY);
      }
      if (modalState.resizeDirection.includes('top')) {
        newHeight = Math.max(200, modalState.originalHeight - deltaY);
        newY = modalState.originalY + deltaY;
      }
      
      setModalState((prev: typeof modalState) => ({
        ...prev,
        width: newWidth,
        height: newHeight,
        originalWidth: newWidth,
        originalHeight: newHeight,
        originalX: newX,
        originalY: newY
      }));
    }
    
    // Handle dragging for Expert Modal
    if (modalState.isDragging) {
      const newX = e.clientX - modalState.dragStartX;
      const newY = e.clientY - modalState.dragStartY;
      setModalState((prev: typeof modalState) => ({
        ...prev,
        originalX: newX,
        originalY: newY
      }));
    }
  };

  const handleMouseUp = () => {
    setModalState((prev: typeof modalState) => {
      const newState = { ...prev, isDragging: false, isResizing: false, resizeDirection: '' };
      // Save the modal state to localStorage
      localStorage.setItem('expertModal_state', JSON.stringify(newState));
      return newState;
    });
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // State for assigned workplaces modal
  const [isAssignedWorkplacesModalOpen, setIsAssignedWorkplacesModalOpen] = useState(false);
  const [assignedWorkplaces, setAssignedWorkplaces] = useState<any[]>([]);
  const [selectedExpertForWorkplaces, setSelectedExpertForWorkplaces] = useState<any>(null);
  
  // Function to close assigned workplaces modal
  const closeAssignedWorkplacesModal = () => {
    setIsAssignedWorkplacesModalOpen(false);
    setAssignedWorkplaces([]);
    setSelectedExpertForWorkplaces(null);
  };

  // Calculate statistics
  const calculateStatistics = () => {
    // Ensure experts is an array
    const expertsArray = Array.isArray(experts) ? experts : [];
    
    const totalExperts = expertsArray.length;
    const totalAssignedMinutes = expertsArray.reduce((sum, expert) => sum + (expert.assignedMinutes || 0), 0);
    const totalUsedMinutes = expertsArray.reduce((sum, expert) => sum + (expert.usedMinutes || 0), 0);
    const totalRemainingMinutes = totalAssignedMinutes - totalUsedMinutes;
    
    // Count experts by class
    const classCounts = {
      A: expertsArray.filter(e => e.expertiseClass === 'A').length,
      B: expertsArray.filter(e => e.expertiseClass === 'B').length,
      C: expertsArray.filter(e => e.expertiseClass === 'C').length
    };
    
    return {
      totalExperts,
      totalAssignedMinutes,
      totalUsedMinutes,
      totalRemainingMinutes,
      classCounts
    };
  };

  const stats = calculateStatistics();

  return (
    <div className="expert-card-page">
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
      
      <div className="expert-page-layout">
        {/* New Expert Card - Left */}
        <div className="new-expert-section">
          <div className="draggable-card new-expert-card">
            <div className="window">
              <div className="window-header">
                <span>Yeni Uzman Kayıt</span>
              </div>
              <div className="window-content">
                <form onSubmit={handleSubmit} className="expert-form">
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
                  
                  <div className="form-row">
                    <div className="form-col">
                      <div className="form-group">
                        <label className="form-label">Uzmanlık Sınıfı:</label>
                        <select
                          name="expertiseClass"
                          className="form-select"
                          value={formData.expertiseClass}
                          onChange={handleChange}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-col">
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
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      {editingExpert ? 'Güncelle' : 'Kaydet'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={clearFormData}>
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
                    <div className="stat-label">Toplam Uzman</div>
                    <div className="stat-value">{stats.totalExperts}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Toplam Atanan Dakika</div>
                    <div className="stat-value">{stats.totalAssignedMinutes}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Toplam Kullanılan Dakika</div>
                    <div className="stat-value">{stats.totalUsedMinutes}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Toplam Kalan Dakika</div>
                    <div className="stat-value">{stats.totalRemainingMinutes}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">A Sınıfı</div>
                    <div className="stat-value">{stats.classCounts.A}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">B Sınıfı</div>
                    <div className="stat-value">{stats.classCounts.B}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">C Sınıfı</div>
                    <div className="stat-value">{stats.classCounts.C}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Registered Experts List - Center */}
      <div className="experts-list-section">
        <div className="experts-container">
          <div className="header-row">
            <div className="header-cell">Ad</div>
            <div className="header-cell">Soyad</div>
            <div className="header-cell">Sınıfı</div>
            <div className="header-cell">Toplam DK</div>
            <div className="header-cell">Atana DK</div>
          </div>
          <div className="experts-list">
            {experts.map((expert) => (
              <div 
                key={expert.id} 
                className="expert-row"
                onClick={() => handleExpertClick(expert)}
              >
                <div className="expert-cell">{expert.firstName}</div>
                <div className="expert-cell">{expert.lastName}</div>
                <div className="expert-cell">{expert.expertiseClass}</div>
                <div className="expert-cell">{expert.assignedMinutes}</div>
                <div className="expert-cell">{expert.usedMinutes || 0}</div>
              </div>
            ))}
            {experts.length === 0 && (
              <div className="no-experts">Kayıtlı uzman bulunmamaktadır</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Expert Details Modal */}
      {isModalOpen && (
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
              height: modalState.height,
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
                onMouseDown={(e) => handleMouseDown(e, 'modal', 'drag')}
                style={{ cursor: 'move', userSelect: 'none' }}
              >
                <span>{isEditMode ? 'Uzmanı Düzenle' : 'Uzman Detayları'}</span>
                <div className="window-controls">
                  <button className="window-button" onClick={closeModal} aria-label="Kapat">×</button>
                </div>
              </div>
              <div className="window-content">
                {isEditMode ? (
                  // Edit form
                  <form onSubmit={handleUpdateExpert} className="edit-form">
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
                    
                    <div className="form-row">
                      <div className="form-col">
                        <div className="form-group">
                          <label className="form-label">Uzmanlık Sınıfı:</label>
                          <select
                            name="expertiseClass"
                            className="form-select"
                            value={editFormData.expertiseClass}
                            onChange={handleEditFormDataChange}
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-col">
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
                      </div>
                    </div>
                    
                    <div className="modal-actions">
                      <button type="submit" className="btn btn-primary">Güncelle</button>
                      <button type="button" className="btn" onClick={closeModal}>İptal</button>
                    </div>
                  </form>
                ) : (
                  // View mode
                  <>
                    <div className="expert-detail-info">
                      <div className="expert-detail-row">
                        <strong>Ad:</strong> {selectedExpert.firstName}
                      </div>
                      <div className="expert-detail-row">
                        <strong>Soyad:</strong> {selectedExpert.lastName}
                      </div>
                      <div className="expert-detail-row">
                        <strong>Telefon:</strong> {selectedExpert.phone}
                      </div>
                      <div className="expert-detail-row">
                        <strong>Uzmanlık Sınıfı:</strong> {selectedExpert.expertiseClass}
                      </div>
                      <div className="expert-detail-row">
                        <strong>Toplam Dakika:</strong> {selectedExpert.assignedMinutes}
                      </div>
                      <div className="expert-detail-row">
                        <strong>Kullanılan Dakika:</strong> {selectedExpert.usedMinutes || 0}
                      </div>
                      <div className="expert-detail-row">
                        <strong>Kalan Dakika:</strong> {selectedExpert.assignedMinutes - (selectedExpert.usedMinutes || 0)}
                      </div>
                      
                      {/* Workplace assignment information - show "atandı" and "gör" button if assigned */}
                      <div className="expert-detail-row">
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
                      <button className="btn btn-primary" onClick={() => openEditExpert(selectedExpert)}>Düzenle</button>
                      <button className="btn btn-danger" onClick={() => {
                        const confirmed = window.confirm('Bu uzman kaydını silmek istediğinize emin misiniz?');
                        if (confirmed) {
                          handleDelete(selectedExpert.id);
                        }
                      }}>Sil</button>
                      <button className="btn btn-close" onClick={closeModal}>Kapat</button>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Resize handles for modal */}
            <div 
              className="resize-handle resize-nw"
              onMouseDown={(e) => handleMouseDown(e, 'modal', 'resize', 'top-left')}
            />
            <div 
              className="resize-handle resize-ne"
              onMouseDown={(e) => handleMouseDown(e, 'modal', 'resize', 'top-right')}
            />
            <div 
              className="resize-handle resize-sw"
              onMouseDown={(e) => handleMouseDown(e, 'modal', 'resize', 'bottom-left')}
            />
            <div 
              className="resize-handle resize-se"
              onMouseDown={(e) => handleMouseDown(e, 'modal', 'resize', 'bottom-right')}
            />
            <div 
              className="resize-handle resize-n"
              onMouseDown={(e) => handleMouseDown(e, 'modal', 'resize', 'top')}
            />
            <div 
              className="resize-handle resize-s"
              onMouseDown={(e) => handleMouseDown(e, 'modal', 'resize', 'bottom')}
            />
            <div 
              className="resize-handle resize-w"
              onMouseDown={(e) => handleMouseDown(e, 'modal', 'resize', 'left')}
            />
            <div 
              className="resize-handle resize-e"
              onMouseDown={(e) => handleMouseDown(e, 'modal', 'resize', 'right')}
            />
          </div>
        </div>
      )}
      
      {/* Assigned Workplaces Modal */}
      {isAssignedWorkplacesModalOpen && selectedExpertForWorkplaces && (
        <AssignedWorkplacesModal
          isOpen={isAssignedWorkplacesModalOpen}
          onClose={closeAssignedWorkplacesModal}
          workplaces={assignedWorkplaces}
          personnelName={`${selectedExpertForWorkplaces.firstName} ${selectedExpertForWorkplaces.lastName}`}
          personnelType="Uzman"
        />
      )}
    </div>
  );
};

export default ExpertCardPage;
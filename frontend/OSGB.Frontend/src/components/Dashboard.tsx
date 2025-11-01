import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllExperts, getAllDoctors, getAllDsps, getAllWorkplaces, createWorkplace, updateWorkplace, deleteWorkplace } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [experts, setExperts] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [dsps, setDsps] = useState<any[]>([]);
  const [workplaces, setWorkplaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>(null);
  const [selectedWorkplace, setSelectedWorkplace] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editingStatusWorkplaceId, setEditingStatusWorkplaceId] = useState<number | null>(null);
  const [showApprovalStatusPopup, setShowApprovalStatusPopup] = useState(false);
  const [selectedWorkplaceForStatus, setSelectedWorkplaceForStatus] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const workplacesPerPage = 10;

  // Form state - removed approvalStatus since we're no longer using it in the form
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    sskRegistrationNo: '',
    phone: '',
    taxOffice: '',
    taxNumber: '',
    price: '',
    kdvType: 'excluded',
    riskLevel: 'low',
    employeeCount: '',
    assignedExpertId: '',
    assignedDoctorId: '',
    assignedDspId: '',
    trackingExpertId: '',
    trackingDoctorId: '', // Add this line
    notes: '', // Add this line
    registrationDate: new Date().toISOString().split('T')[0],
    kimden: '' // Add this new field
  });
  
  // Form error state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // DSP selection state
  const [isDspEnabled, setIsDspEnabled] = useState(false);

  useEffect(() => {
    fetchAllData();
    
    // Add event listeners for personnel updates
    const handleExpertUpdate = () => {
      console.log('Dashboard: Received expertUpdated event, refreshing data...');
      fetchAllData();
    };
    
    const handleDoctorUpdate = () => {
      console.log('Dashboard: Received doctorUpdated event, refreshing data...');
      fetchAllData();
    };
    
    const handleDspUpdate = () => {
      console.log('Dashboard: Received dspUpdated event, refreshing data...');
      fetchAllData();
    };
    
    window.addEventListener('expertUpdated', handleExpertUpdate);
    window.addEventListener('doctorUpdated', handleDoctorUpdate);
    window.addEventListener('dspUpdated', handleDspUpdate);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('expertUpdated', handleExpertUpdate);
      window.removeEventListener('doctorUpdated', handleDoctorUpdate);
      window.removeEventListener('dspUpdated', handleDspUpdate);
    };
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [expertsData, doctorsData, dspsData, workplacesData] = await Promise.all([
        getAllExperts(),
        getAllDoctors(),
        getAllDsps(),
        getAllWorkplaces()
      ]);
      
      // Debug logging to check if usedMinutes is present
      console.log('Experts data:', expertsData);
      console.log('Doctors data:', doctorsData);
      console.log('DSPs data:', dspsData);
      
      // Additional debug logging for REMZİYE ÇAĞCI specifically
      const remziye = expertsData.find((expert: any) => expert.firstName === 'REMZİYE' && expert.lastName === 'ÇAĞCI');
      if (remziye) {
        console.log('REMZİYE ÇAĞCI data:', remziye);
        console.log('REMZİYE ÇAĞCI assigned minutes:', remziye.assignedMinutes);
        console.log('REMZİYE ÇAĞCI used minutes:', remziye.usedMinutes);
        console.log('REMZİYE ÇAĞCI calculated remaining:', remziye.assignedMinutes - (remziye.usedMinutes || 0));
      }
      
      setExperts(expertsData);
      setDoctors(doctorsData);
      setDsps(dspsData);
      setWorkplaces(workplacesData);
      setError('');
    } catch (err: any) {
      setError('Veriler alınamadı: ' + err.message);
      console.error('Veri hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format phone numbers as user types
  const formatSskRegistrationNo = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Limit to 17 digits (based on format: x xxxx 0101 xxxxx xxx xx xx xxx)
    const limitedDigits = digits.substring(0, 17);
    
    // Format as x xxxx 0101 xxxxx xxx xx xx xxx
    let formatted = '';
    for (let i = 0; i < limitedDigits.length; i++) {
      if (i === 1 || i === 6 || i === 10 || i === 13 || i === 15 || i === 17) {
        formatted += ' ';
      }
      formatted += limitedDigits[i];
    }
    
    return formatted;
  };

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

  // Format price with thousand separators and TL symbol
  const formatPrice = (value: string): string => {
    if (!value) return '';
    
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format with thousand separators (dots)
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 === 0) {
        formatted += '.';
      }
      formatted += digits[i];
    }
    
    return formatted;
  };

  // Parse formatted price back to number
  const parsePrice = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    // Remove dots and convert to number
    return parseInt(formattedValue.replace(/\./g, ''), 10) || 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for phone numbers
    if (name === 'sskRegistrationNo') {
      const formattedValue = formatSskRegistrationNo(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else if (name === 'phone') {
      const formattedValue = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else if (name === 'taxOffice') {
      // Prevent numeric input for tax office field
      const textOnlyValue = value.replace(/\d/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: textOnlyValue
      }));
    } else if (name === 'taxNumber') {
      // Allow only numeric input for tax number field
      const numericOnlyValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericOnlyValue
      }));
    } else if (name === 'price') {
      // Format price with thousand separators
      const formattedValue = formatPrice(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Enable/disable DSP based on risk level and employee count
    if (name === 'riskLevel' || name === 'employeeCount') {
      const newRiskLevel = name === 'riskLevel' ? value : formData.riskLevel;
      const newEmployeeCount = name === 'employeeCount' ? value : formData.employeeCount;
      
      // DSP is enabled only for very dangerous workplaces with 10+ employees
      const dspEnabled = newRiskLevel === 'veryDangerous' && 
                         parseInt(newEmployeeCount) >= 10;
      setIsDspEnabled(dspEnabled);
      
      // Clear DSP selection if disabled
      if (!dspEnabled) {
        setFormData(prev => ({
          ...prev,
          assignedDspId: ''
        }));
      }
    }
  };

  // Filter experts based on risk level
  const getFilteredExperts = () => {
    const { riskLevel } = formData;
    
    // For demo purposes, we'll return all experts
    // In a real implementation, you would filter based on expertise class and available minutes
    switch (riskLevel) {
      case 'low':
        // All experts for low risk
        return experts;
      case 'dangerous':
        // Only B and A class experts for dangerous
        return experts.filter(expert => expert.expertiseClass === 'B' || expert.expertiseClass === 'A');
      case 'veryDangerous':
        // Only A class experts for very dangerous
        return experts.filter(expert => expert.expertiseClass === 'A');
      default:
        return experts;
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'İş yeri adı zorunludur';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Adres zorunludur';
    }
    
    if (!formData.sskRegistrationNo.trim()) {
      errors.sskRegistrationNo = 'SGK sicil no zorunludur';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Telefon no zorunludur';
    }
    
    if (!formData.taxOffice.trim()) {
      errors.taxOffice = 'Vergi dairesi zorunludur';
    } else if (/\d/.test(formData.taxOffice)) {
      // Check if taxOffice contains any digits
      errors.taxOffice = 'Vergi dairesi sadece harf içermelidir';
    }
    
    if (!formData.taxNumber.trim()) {
      errors.taxNumber = 'Vergi no zorunludur';
    } else if (/\D/.test(formData.taxNumber)) {
      // Check if taxNumber contains any non-digit characters
      errors.taxNumber = 'Vergi no sadece rakam içermelidir';
    }
    
    if (formData.price && isNaN(parseInt(formData.price))) {
      errors.price = 'Fiyat bilgisi sayı olmalıdır';
    }
    
    if (!formData.employeeCount.trim()) {
      errors.employeeCount = 'Çalışan sayısı zorunludur';
    } else if (isNaN(parseInt(formData.employeeCount))) {
      errors.employeeCount = 'Çalışan sayısı sayı olmalıdır';
    }
    
    // Atanacak uzman, hekim veya DSP isteğe bağlıdır
    // Kullanıcı bunlardan birini veya ikisini seçerse kayıt kabul edilir
    // Zorunluluk kaldırıldı
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if selected personnel have enough minutes
  const checkPersonnelMinutes = async () => {
    const errors: Record<string, string> = {};
    
    // Check expert
    if (formData.assignedExpertId) {
      const selectedExpert = experts.find(expert => expert.id === parseInt(formData.assignedExpertId));
      if (selectedExpert) {
        const employeeCount = parseInt(formData.employeeCount) || 0;
        const requiredMinutes = calculateRequiredMinutes('expert', formData.riskLevel, employeeCount);
        
        if (selectedExpert.assignedMinutes < requiredMinutes) {
          errors.assignedExpertId = `Seçilen uzmanın bu iş yeri için yeterli dakikası bulunmamaktadır. Gerekli: ${requiredMinutes} dakika, Mevcut: ${selectedExpert.assignedMinutes} dakika`;
        }
      }
    }
    
    // Check doctor
    if (formData.assignedDoctorId) {
      const selectedDoctor = doctors.find(doctor => doctor.id === parseInt(formData.assignedDoctorId));
      if (selectedDoctor) {
        const employeeCount = parseInt(formData.employeeCount) || 0;
        const requiredMinutes = calculateRequiredMinutes('doctor', formData.riskLevel, employeeCount);
        
        if (selectedDoctor.assignedMinutes < requiredMinutes) {
          errors.assignedDoctorId = `Seçilen hekimin bu iş yeri için yeterli dakikası bulunmamaktadır. Gerekli: ${requiredMinutes} dakika, Mevcut: ${selectedDoctor.assignedMinutes} dakika`;
        }
      }
    }
    
    // Check DSP
    if (formData.assignedDspId && isDspEnabled) {
      const selectedDsp = dsps.find(dsp => dsp.id === parseInt(formData.assignedDspId));
      if (selectedDsp) {
        const employeeCount = parseInt(formData.employeeCount) || 0;
        const requiredMinutes = calculateRequiredMinutes('dsp', formData.riskLevel, employeeCount);
        
        if (selectedDsp.assignedMinutes < requiredMinutes) {
          errors.assignedDspId = `Seçilen DSP'nin bu iş yeri için yeterli dakikası bulunmamaktadır. Gerekli: ${requiredMinutes} dakika, Mevcut: ${selectedDsp.assignedMinutes} dakika`;
        }
      }
    }
    
    return errors;
  };

  // Calculate required minutes based on personnel type, risk level and employee count
  const calculateRequiredMinutes = (personnelType: string, riskLevel: string, employeeCount: number): number => {
    switch (personnelType) {
      case 'expert':
        switch (riskLevel) {
          case 'low': return employeeCount * 10;
          case 'dangerous': return employeeCount * 20;
          case 'veryDangerous': return employeeCount * 40;
          default: return 0;
        }
      case 'doctor':
        switch (riskLevel) {
          case 'low': return employeeCount * 5;
          case 'dangerous': return employeeCount * 10;
          case 'veryDangerous': return employeeCount * 15;
          default: return 0;
        }
      case 'dsp':
        // DSP only works with very dangerous workplaces with more than 10 employees
        if (riskLevel === 'veryDangerous' && employeeCount > 10) {
          return employeeCount * 5;
        }
        return 0;
      default:
        return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate basic form fields
    if (!validateForm()) {
      return;
    }
    
    // Check if selected personnel have enough minutes
    const minuteErrors = await checkPersonnelMinutes();
    if (Object.keys(minuteErrors).length > 0) {
      setFormErrors(prevErrors => ({ ...prevErrors, ...minuteErrors }));
      return;
    }
    
    try {
      // Prepare data for submission
      const submitData = {
        name: formData.name,
        address: formData.address,
        sskRegistrationNo: formData.sskRegistrationNo,
        phone: formData.phone,
        taxOffice: formData.taxOffice,
        taxNumber: formData.taxNumber,
        price: parsePrice(formData.price), // Parse formatted price back to number
        kdvType: formData.kdvType,
        riskLevel: formData.riskLevel,
        employeeCount: parseInt(formData.employeeCount),
        assignedExpertId: formData.assignedExpertId || null,
        assignedDoctorId: formData.assignedDoctorId || null,
        assignedDspId: formData.assignedDspId || null,
        trackingExpertId: formData.trackingExpertId || null,
        trackingDoctorId: formData.trackingDoctorId || null, // Add this line
        notes: formData.notes || null, // Add this line
        registrationDate: formData.registrationDate,
        source: 'Yeni Kayıt', // Set a default source
        approvalStatus: 'atama', // Set default approval status since we removed the form field
        kimden: formData.kimden || null // Add the new field
      };
      
      console.log('=== Form Submission Debug Info ===');
      console.log('Form data:', formData);
      console.log('Submit data:', submitData);
      
      await createWorkplace(submitData);
      setSuccess('İş yeri başarıyla kaydedildi!');
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        sskRegistrationNo: '',
        phone: '',
        taxOffice: '',
        taxNumber: '',
        price: '',
        kdvType: 'excluded',
        riskLevel: 'low',
        employeeCount: '',
        assignedExpertId: '',
        assignedDoctorId: '',
        assignedDspId: '',
        trackingExpertId: '',
        trackingDoctorId: '', // Add this line
        notes: '', // Add this line
        registrationDate: new Date().toISOString().split('T')[0],
        kimden: '' // Add this line
        // Removed approvalStatus from reset since it's no longer in the form
      });
      
      // Refresh workplaces list
      await fetchAllData();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError('İş yeri kaydedilirken hata oluştu: ' + err.message);
      console.error('Kayıt hatası:', err);
    }
  };;

  const handleClear = () => {
    setFormData({
      name: '',
      address: '',
      sskRegistrationNo: '',
      phone: '',
      taxOffice: '',
      taxNumber: '',
      price: '',
      kdvType: 'excluded',
      riskLevel: 'low',
      employeeCount: '',
      assignedExpertId: '',
      assignedDoctorId: '',
      assignedDspId: '',
      trackingExpertId: '',
      trackingDoctorId: '', // Add this line
      notes: '', // Add this line
      registrationDate: new Date().toISOString().split('T')[0],
      kimden: '' // Add this line
    });
    
    // Clear any existing errors
    setFormErrors({});
    
    // Clear success and error messages
    setSuccess('');
    setError('');
  };

  const handleSort = (key: string) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  const sortedWorkplaces = React.useMemo(() => {
    if (!sortConfig) {
      // Default sort by registrationDate descending (newest first)
      return [...workplaces].sort((a, b) => 
        new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
      );
    }
    
    return [...workplaces].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [workplaces, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(sortedWorkplaces.length / workplacesPerPage);
  
  const currentWorkplaces = React.useMemo(() => {
    const indexOfLastWorkplace = currentPage * workplacesPerPage;
    const indexOfFirstWorkplace = indexOfLastWorkplace - workplacesPerPage;
    return sortedWorkplaces.slice(indexOfFirstWorkplace, indexOfLastWorkplace);
  }, [sortedWorkplaces, currentPage, workplacesPerPage]);

  // Function to change page
  const paginate = (pageNumber: number) => {
    // Ensure page number is within valid range
    const newPage = Math.min(Math.max(1, pageNumber), totalPages);
    setCurrentPage(newPage);
  };

  const handleRowClick = (workplace: any) => {
    // 1. Önceki workplace'i temizle, böylece içeriğin temiz render edilmesi sağlanır
    setSelectedWorkplace(null);
    // 2. Modalı hemen kapat, temiz state'e geri dön
    setIsModalOpen(false);
    
    // 3. Kısa bir gecikme ekleyerek React'in state güncellemelerini işlemesine izin ver
    // Bu gecikme, bir sonraki işleme (rendering) geçişi sağlar
    setTimeout(() => {
      // 4. Yeni workplace verilerini ayarla
      setSelectedWorkplace(workplace);
      // 5. Modalı aç
      setIsModalOpen(true);
      
      // !!! BURADAN SONRAKİ GEREKSİZ KODLARI SİLİNİZ:
      // window.dispatchEvent(new Event('resize')); 
      // const modalElement = document.querySelector('.modal-content') as HTMLElement | null;
      // if (modalElement) { /* ... gereksiz stil zorlaması ... */ }
      
    }, 10); // 10ms genellikle yeterlidir, hatta 0ms'lik bir `setTimeout` bile bazen işe yarar (event loop'a bırakmak için)
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWorkplace(null);
    // Force a window resize event to ensure proper cleanup
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 0);
  };

  const getSortIcon = (columnName: string) => {
    if (!sortConfig || sortConfig.key !== columnName) {
      return (
        <span>
          <span style={{ color: 'green', cursor: 'pointer' }}>▲</span>
          <span style={{ color: 'red', cursor: 'pointer' }}>▼</span>
        </span>
      );
    }
    
    if (sortConfig.direction === 'ascending') {
      return <span style={{ color: 'green', cursor: 'pointer' }}>▲</span>;
    } else {
      return <span style={{ color: 'red', cursor: 'pointer' }}>▼</span>;
    }
  };

  const getRiskLevelText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'Az Tehlikeli';
      case 'dangerous': return 'Tehlikeli';
      case 'veryDangerous': return 'Çok Tehlikeli';
      default: return riskLevel;
    }
  };

  const getRiskLevelValue = (riskLevelText: string) => {
    switch (riskLevelText) {
      case 'Az Tehlikeli': return 'low';
      case 'Tehlikeli': return 'dangerous';
      case 'Çok Tehlikeli': return 'veryDangerous';
      default: return riskLevelText;
    }
  };

  const getApprovalStatusText = (status: string) => {
    switch (status) {
      case 'atama': return 'Atama yapılacak';
      case 'bekliyor': return 'Onay bekleniyor';
      case 'onaylandi': return 'Onaylandı';
      default: return status;
    }
  };

  // Component for approval status buttons
  const ApprovalStatusButtons = ({ workplaceId, currentStatus }: { workplaceId: number, currentStatus: string }) => {
    const statusOptions = [
      { value: 'atama', label: 'Atama yapılacak' },
      { value: 'bekliyor', label: 'Onay bekleniyor' },
      { value: 'onaylandi', label: 'Onaylandı' }
    ];

    return (
      <div className="approval-status-buttons-container">
        {statusOptions.map(option => (
          <button
            key={option.value}
            onClick={() => updateApprovalStatus(workplaceId, option.value)}
            className={`approval-status-button ${currentStatus === option.value ? 'active' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSelectedWorkplace((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedWorkplace && selectedWorkplace.id) {
        // Check if selected personnel have enough minutes
        const errors: Record<string, string> = {};
        
        // Check expert
        if (selectedWorkplace.assignedExpertId) {
          const selectedExpert = experts.find(expert => expert.id === parseInt(selectedWorkplace.assignedExpertId));
          if (selectedExpert) {
            const employeeCount = parseInt(selectedWorkplace.employeeCount) || 0;
            const requiredMinutes = calculateRequiredMinutes('expert', selectedWorkplace.riskLevel, employeeCount);
            
            if (selectedExpert.assignedMinutes < requiredMinutes) {
              setError(`Seçilen uzmanın bu iş yeri için yeterli dakikası bulunmamaktadır. Gerekli: ${requiredMinutes} dakika, Mevcut: ${selectedExpert.assignedMinutes} dakika`);
              // Clear error message after 3 seconds
              setTimeout(() => {
                setError('');
              }, 3000);
              return;
            }
          }
        }
        
        // Check doctor
        if (selectedWorkplace.assignedDoctorId) {
          const selectedDoctor = doctors.find(doctor => doctor.id === parseInt(selectedWorkplace.assignedDoctorId));
          if (selectedDoctor) {
            const employeeCount = parseInt(selectedWorkplace.employeeCount) || 0;
            const requiredMinutes = calculateRequiredMinutes('doctor', selectedWorkplace.riskLevel, employeeCount);
            
            if (selectedDoctor.assignedMinutes < requiredMinutes) {
              setError(`Seçilen hekimin bu iş yeri için yeterli dakikası bulunmamaktadır. Gerekli: ${requiredMinutes} dakika, Mevcut: ${selectedDoctor.assignedMinutes} dakika`);
              // Clear error message after 3 seconds
              setTimeout(() => {
                setError('');
              }, 3000);
              return;
            }
          }
        }
        
        // Check DSP
        if (selectedWorkplace.assignedDspId) {
          const selectedDsp = dsps.find(dsp => dsp.id === parseInt(selectedWorkplace.assignedDspId));
          if (selectedDsp) {
            const employeeCount = parseInt(selectedWorkplace.employeeCount) || 0;
            const requiredMinutes = calculateRequiredMinutes('dsp', selectedWorkplace.riskLevel, employeeCount);
            
            if (selectedDsp.assignedMinutes < requiredMinutes) {
              setError(`Seçilen DSP'nin bu iş yeri için yeterli dakikası bulunmamaktadır. Gerekli: ${requiredMinutes} dakika, Mevcut: ${selectedDsp.assignedMinutes} dakika`);
              // Clear error message after 3 seconds
              setTimeout(() => {
                setError('');
              }, 3000);
              return;
            }
          }
        }
        
        // Create a clean object with only the fields we want to update
        const workplaceData = {
          name: selectedWorkplace.name,
          address: selectedWorkplace.address,
          sskRegistrationNo: selectedWorkplace.sskRegistrationNo,
          phone: selectedWorkplace.phone,
          taxOffice: selectedWorkplace.taxOffice,
          taxNumber: selectedWorkplace.taxNumber,
          price: selectedWorkplace.price,
          riskLevel: selectedWorkplace.riskLevel,
          employeeCount: selectedWorkplace.employeeCount,
          assignedExpertId: selectedWorkplace.assignedExpertId || null,
          assignedDoctorId: selectedWorkplace.assignedDoctorId || null,
          assignedDspId: selectedWorkplace.assignedDspId || null,
          trackingExpertId: selectedWorkplace.trackingExpertId || null,
          source: selectedWorkplace.source,
          approvalStatus: selectedWorkplace.approvalStatus,
          registrationDate: selectedWorkplace.registrationDate
        };
        
        await updateWorkplace(selectedWorkplace.id, workplaceData);
        setSuccess('durum başarı ile güncellendi');
        
        // Refresh workplaces list
        await fetchAllData();
        
        // Hide success message after 3 seconds and close modal
        setTimeout(() => {
          setSuccess('');
          closeModal();
        }, 3000);
      }
    } catch (err: any) {
      setError('İş yeri güncellenirken hata oluştu: ' + err.message);
      console.error('Güncelleme hatası:', err);
    }
  };

  const handleDeleteWorkplace = () => {
    // Show confirmation dialog before deleting
    setShowDeleteConfirmation(true);
  };

  // Function to confirm deletion
  const confirmDeleteWorkplace = async () => {
    try {
      if (selectedWorkplace && selectedWorkplace.id) {
        // Delete from backend
        await deleteWorkplace(selectedWorkplace.id);
        
        // Show success message
        setSuccess('İş yeri başarıyla silindi!');
        
        // Close confirmation dialog and modal
        setShowDeleteConfirmation(false);
        closeModal();
        
        // Refresh all data from backend to ensure consistency
        await fetchAllData();
        
        // Clear notifications
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setShowDeleteConfirmation(false);
        closeModal();
      }
    } catch (err: any) {
      console.error('Error deleting workplace:', err);
      // Provide more specific error message
      if (err.message) {
        setError(`İş yeri silinirken hata oluştu: ${err.message}`);
      } else {
        setError('İş yeri silinirken hata oluştu');
      }
      
      // Clear notifications
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  // Function to cancel deletion
  const cancelDeleteWorkplace = () => {
    setShowDeleteConfirmation(false);
  };

  // Function to start editing approval status for a workplace
  const startEditingStatus = (workplaceId: number) => {
    setEditingStatusWorkplaceId(workplaceId);
  };

  // Function to cancel editing approval status
  const cancelEditingStatus = () => {
    setEditingStatusWorkplaceId(null);
  };

  // Function to handle approval status button click
  const handleApprovalStatusClick = (workplace: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkplaceForStatus(workplace);
    setShowApprovalStatusPopup(true);
  };

  // Function to close the approval status popup
  const closeApprovalStatusPopup = () => {
    setShowApprovalStatusPopup(false);
    setSelectedWorkplaceForStatus(null);
  };

  // Function to update approval status
  const updateApprovalStatus = async (workplaceId: number, newStatus: string) => {
    try {
      // Find the workplace in the sortedWorkplaces array
      const workplace = sortedWorkplaces.find(w => w.id === workplaceId);
      if (!workplace) {
        throw new Error('Workplace not found');
      }

      // Update the workplace with the new status
      const updatedWorkplace = {
        ...workplace,
        approvalStatus: newStatus
      };

      // Call the update API
      await updateWorkplace(workplaceId, updatedWorkplace);
      
      // Refresh the workplaces list
      await fetchAllData();
      
      // Close the popup
      closeApprovalStatusPopup();
      
      // Show success message
      setSuccess('Durum başarıyla güncellendi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Durum güncellenirken hata oluştu: ' + err.message);
      console.error('Durum güncelleme hatası:', err);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Function to update approval status from popup
  const updateApprovalStatusFromPopup = async (workplaceId: number, newStatus: string) => {
    try {
      // Find the workplace in the sortedWorkplaces array
      const workplace = sortedWorkplaces.find(w => w.id === workplaceId);
      if (!workplace) {
        throw new Error('Workplace not found');
      }

      // Update the workplace with the new status
      const updatedWorkplace = {
        ...workplace,
        approvalStatus: newStatus
      };

      // Call the update API
      await updateWorkplace(workplaceId, updatedWorkplace);
      
      // Refresh the workplaces list
      await fetchAllData();
      
      // Close the popup
      closeApprovalStatusPopup();
      
      // Show success message
      setSuccess('Durum başarıyla güncellendi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Durum güncellenirken hata oluştu: ' + err.message);
      console.error('Durum güncelleme hatası:', err);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Add the toggle function for KDV type
  const toggleKdvType = () => {
    setFormData(prev => ({
      ...prev,
      kdvType: prev.kdvType === 'excluded' ? 'included' : 'excluded'
    }));
  };
  
  // Function to handle KDV type selection from dropdown
  const handleKdvTypeSelect = (type: string) => {
    setFormData(prev => ({
      ...prev,
      kdvType: type
    }));
    setShowKdvDropdown(false);
  };
  
  // Function to toggle dropdown visibility
  const toggleKdvDropdown = () => {
    setShowKdvDropdown(!showKdvDropdown);
  };
  
  // Add state variable for KDV dropdown
  const [showKdvDropdown, setShowKdvDropdown] = useState(false);

  // Add useEffect to handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showKdvDropdown) {
        // Check if click is outside the dropdown
        const dropdown = document.querySelector('.kdv-dropdown');
        const button = document.querySelector('.kdv-toggle-button');
        
        if (dropdown && !dropdown.contains(event.target as Node) && 
            button && !button.contains(event.target as Node)) {
          setShowKdvDropdown(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showKdvDropdown]);

  if (loading) {
    return <div className="dashboard">Yükleniyor...</div>;
  }

  return (
    <div className="dashboard-container">
      {error && (
        <div className="error-message" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          padding: '20px',
          backgroundColor: '#f44336',
          color: 'white',
          borderRadius: '4px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          minWidth: '300px'
        }}>
          {error}
        </div>
      )}
      {success && (
        <div className="success-message" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          padding: '20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          borderRadius: '4px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          minWidth: '300px'
        }}>
          {success}
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
      
      {/* Approval Status Popup */}
      {showApprovalStatusPopup && selectedWorkplaceForStatus && (
        <div className="popup-overlay" onClick={closeApprovalStatusPopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()} style={{ width: '300px' }}>
            <div className="popup-header">
              <h3>Durum Seçimi</h3>
              <button className="popup-close" onClick={closeApprovalStatusPopup}>×</button>
            </div>
            <div className="popup-body" style={{ padding: '20px' }}>
              <p><strong>{selectedWorkplaceForStatus.name}</strong> için yeni durumu seçin:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                <button
                  className={`dashboard-approval-status atama ${selectedWorkplaceForStatus.approvalStatus === 'atama' ? 'active' : ''}`}
                  onClick={() => updateApprovalStatusFromPopup(selectedWorkplaceForStatus.id, 'atama')}
                  style={{ 
                    width: '100%', 
                    height: '30px',
                    cursor: 'pointer',
                    opacity: selectedWorkplaceForStatus.approvalStatus === 'atama' ? 0.7 : 1
                  }}
                >
                  Atama yapılacak
                </button>
                <button
                  className={`dashboard-approval-status bekliyor ${selectedWorkplaceForStatus.approvalStatus === 'bekliyor' ? 'active' : ''}`}
                  onClick={() => updateApprovalStatusFromPopup(selectedWorkplaceForStatus.id, 'bekliyor')}
                  style={{ 
                    width: '100%', 
                    height: '30px',
                    cursor: 'pointer',
                    opacity: selectedWorkplaceForStatus.approvalStatus === 'bekliyor' ? 0.7 : 1
                  }}
                >
                  Onay bekleniyor
                </button>
                <button
                  className={`dashboard-approval-status onaylandi ${selectedWorkplaceForStatus.approvalStatus === 'onaylandi' ? 'active' : ''}`}
                  onClick={() => updateApprovalStatusFromPopup(selectedWorkplaceForStatus.id, 'onaylandi')}
                  style={{ 
                    width: '100%', 
                    height: '30px',
                    cursor: 'pointer',
                    opacity: selectedWorkplaceForStatus.approvalStatus === 'onaylandi' ? 0.7 : 1
                  }}
                >
                  Onaylandı
                </button>
              </div>
            </div>
            <div className="popup-footer" style={{ padding: '15px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={closeApprovalStatusPopup} style={{ width: '100%' }}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="dashboard-content">
        <div className="workplace-form-container">
          <div className="form-card">
            <h2 style={{ color: 'red', fontWeight: 'bold', fontSize: '1.8em', marginTop: '-50px' }}>Yeni İş Yeri Kayıt Kartı</h2>
            <form onSubmit={handleSubmit} className="workplace-form">
              <div className="workplace-info-row">
                <div className="form-group">
                  <label htmlFor="name">İş Yeri Adı:</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={formErrors.name ? 'error' : ''}
                  />
                  {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="address">Adres:</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={formErrors.address ? 'error' : ''}
                    rows={3}
                  />
                  {formErrors.address && <span className="error-text">{formErrors.address}</span>}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Telefon No:</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="5xx xxx xx xx"
                    className={formErrors.phone ? 'error' : ''}
                  />
                  {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="sskRegistrationNo">SGK Sicil No:</label>
                  <input
                    type="text"
                    id="sskRegistrationNo"
                    name="sskRegistrationNo"
                    value={formData.sskRegistrationNo}
                    onChange={handleChange}
                    placeholder="x xxxx 0101 xxxxx xxx xx xx xxx"
                    className={formErrors.sskRegistrationNo ? 'error' : ''}
                  />
                  {formErrors.sskRegistrationNo && <span className="error-text">{formErrors.sskRegistrationNo}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="registrationDate">Tarih:</label>
                  <input
                    type="date"
                    id="registrationDate"
                    name="registrationDate"
                    value={formData.registrationDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="form-row sgk-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="taxOffice">Vergi Dairesi:</label>
                  <input
                    type="text"
                    id="taxOffice"
                    name="taxOffice"
                    value={formData.taxOffice}
                    onChange={handleChange}
                    className={formErrors.taxOffice ? 'error' : ''}
                  />
                  {formErrors.taxOffice && <span className="error-text">{formErrors.taxOffice}</span>}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="taxNumber">Vergi No:</label>
                  <input
                    type="text"
                    id="taxNumber"
                    name="taxNumber"
                    value={formData.taxNumber}
                    onChange={handleChange}
                    className={formErrors.taxNumber ? 'error' : ''}
                  />
                  {formErrors.taxNumber && <span className="error-text">{formErrors.taxNumber}</span>}
                </div>
                <div className="form-group price-container" style={{ flex: 1 }}>
                  <label htmlFor="price">Fiyat:</label>
                  <div className="price-input-container">
                    <input
                      type="text"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={formErrors.price ? 'error' : ''}
                    />
                    <button 
                      type="button"
                      className={`kdv-toggle-button ${formData.kdvType || 'included'}`}
                      onClick={toggleKdvDropdown}
                    >
                      {formData.kdvType === 'excluded' ? 'KDV HARİÇ' : 'KDV DAHİL'}
                    </button>
                    
                    {/* KDV Dropdown */}
                    {showKdvDropdown && (
                      <div className="kdv-dropdown">
                        <div 
                          className="kdv-dropdown-option excluded"
                          onClick={() => handleKdvTypeSelect('excluded')}
                        >
                          KDV HARİÇ
                        </div>
                        <div 
                          className="kdv-dropdown-option included"
                          onClick={() => handleKdvTypeSelect('included')}
                        >
                          KDV DAHİL
                        </div>
                      </div>
                    )}
                  </div>
                  {formErrors.price && <span className="error-text">{formErrors.price}</span>}
                </div>
              </div>
              
              <div className="form-row risk-level-row">
                <div className="form-group">
                  <label htmlFor="riskLevel">Tehlike Sınıfı:</label>
                  <select
                    id="riskLevel"
                    name="riskLevel"
                    value={formData.riskLevel}
                    onChange={handleChange}
                  >
                    <option value="low">Az Tehlikeli</option>
                    <option value="dangerous">Tehlikeli</option>
                    <option value="veryDangerous">Çok Tehlikeli</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="employeeCount">Çalışan Sayısı:</label>
                  <input
                    type="number"
                    id="employeeCount"
                    name="employeeCount"
                    value={formData.employeeCount}
                    onChange={handleChange}
                    min="0"
                    className={formErrors.employeeCount ? 'error' : ''}
                  />
                  {formErrors.employeeCount && <span className="error-text">{formErrors.employeeCount}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="trackingExpertId">Takip Edecek Uzman:</label>
                  <select
                    id="trackingExpertId"
                    name="trackingExpertId"
                    value={formData.trackingExpertId}
                    onChange={handleChange}
                  >
                    <option value="">Seçiniz</option>
                    {experts.map(expert => (
                      <option key={expert.id} value={expert.id}>
                        {expert.firstName} {expert.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Assignment row with expert, doctor, and DSP selection */}
              <div className="form-row assignment-row">
                <div className="form-group">
                  <label htmlFor="assignedExpertId">Atanacak Uzman:</label>
                  <select
                    id="assignedExpertId"
                    name="assignedExpertId"
                    value={formData.assignedExpertId}
                    onChange={handleChange}
                    className={formErrors.assignedExpertId ? 'error' : ''}
                  >
                    <option value="">Seçiniz</option>
                    {getFilteredExperts().map(expert => (
                      <option key={expert.id} value={expert.id}>
                        {expert.firstName} {expert.lastName} ({expert.expertiseClass}) - {expert.assignedMinutes} dk
                      </option>
                    ))}
                  </select>
                  {formErrors.assignedExpertId && <span className="error-text">{formErrors.assignedExpertId}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="assignedDoctorId">Atanacak Hekim:</label>
                  <select
                    id="assignedDoctorId"
                    name="assignedDoctorId"
                    value={formData.assignedDoctorId}
                    onChange={handleChange}
                    className={formErrors.assignedDoctorId ? 'error' : ''}
                  >
                    <option value="">Seçiniz</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.firstName} {doctor.lastName} - {doctor.assignedMinutes} dk
                      </option>
                    ))}
                  </select>
                  {formErrors.assignedDoctorId && <span className="error-text">{formErrors.assignedDoctorId}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="kimden">Kimden:</label>
                  <input
                    type="text"
                    id="kimden"
                    name="kimden"
                    value={formData.kimden}
                    onChange={handleChange}
                    className={formErrors.kimden ? 'error' : ''}
                    placeholder="Kaynağı giriniz"
                  />
                  {formErrors.kimden && <span className="error-text">{formErrors.kimden}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="assignedDspId">Atanacak DSP:</label>
                  <select
                    id="assignedDspId"
                    name="assignedDspId"
                    value={formData.assignedDspId}
                    onChange={handleChange}
                    disabled={!isDspEnabled}
                    className={formErrors.assignedDspId ? 'error' : ''}
                  >
                    <option value="">Seçiniz</option>
                    {isDspEnabled && dsps.map(dsp => {
                      const remainingMinutes = dsp.assignedMinutes - (dsp.usedMinutes || 0);
                      console.log(`DSP (main form): ${dsp.firstName} ${dsp.lastName}, Assigned: ${dsp.assignedMinutes}, Used: ${dsp.usedMinutes}, Remaining: ${remainingMinutes}`);
                      return (
                        <option key={dsp.id} value={dsp.id}>
                          {dsp.firstName} {dsp.lastName} - {remainingMinutes} dk
                        </option>
                      );
                    })}
                  </select>
                  {formErrors.assignedDspId && <span className="error-text">{formErrors.assignedDspId}</span>}
                </div>
              </div>
              
              {/* New fields for tracking doctor and notes - positioned side by side and moved upward */}
              <div className="form-row tracking-notes-row">
                <div className="form-group">
                  <label htmlFor="trackingDoctorId">Takip Edecek Hekim:</label>
                  <select
                    id="trackingDoctorId"
                    name="trackingDoctorId"
                    value={formData.trackingDoctorId}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Seçiniz</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.firstName} {doctor.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="notes">Not:</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-button small-button">
                  Kaydet
                </button>
                <button type="button" id="clear-button" className="clear-button small-button" onClick={handleClear}>
                  Temizle
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Registered Workplaces Section */}
        <div className="workplaces-container">
          <div className="header-row">
            <div className="header-cell" style={{ flex: 2, cursor: 'pointer', marginRight: '5px' }} onClick={() => handleSort('name')}>
              İş Yeri Adı {getSortIcon('name')}
            </div>
            <div className="header-cell" style={{ flex: 1, cursor: 'pointer', marginLeft: '-30px' }} onClick={() => handleSort('riskLevel')}>
              Tehlike {getSortIcon('riskLevel')}
            </div>
            <div className="header-cell" style={{ flex: 1, cursor: 'pointer', marginLeft: '-30px' }} onClick={() => handleSort('Expert.lastName')}>
              Uzman {getSortIcon('Expert.lastName')}
            </div>
            <div className="header-cell" style={{ flex: 1, cursor: 'pointer', marginLeft: '-30px' }} onClick={() => handleSort('registrationDate')}>
              Tarih {getSortIcon('registrationDate')}
            </div>
            <div className="header-cell" style={{ flex: 1, cursor: 'pointer', marginLeft: '-30px' }} onClick={() => handleSort('trackingExpertId')}>
              Takip {getSortIcon('trackingExpertId')}
            </div>
            <div className="header-cell" style={{ flex: 1, cursor: 'pointer', marginLeft: '-30px' }} onClick={() => handleSort('approvalStatus')}>
              Durum {getSortIcon('approvalStatus')}
            </div>
          </div>
          
          <div className="workplaces-list">
            {currentWorkplaces.map((workplace) => (
              <div 
                key={workplace.id} 
                className="workplace-row"
                onClick={() => handleRowClick(workplace)}
              >
                <div className="workplace-cell" style={{ flex: 2, marginRight: '5px' }}>{workplace.name}</div>
                <div className="workplace-cell" style={{ flex: 1, marginLeft: '-30px' }}>
                  <span className={`risk-level-${workplace.riskLevel}`}>
                    {getRiskLevelText(workplace.riskLevel)}
                  </span>
                </div>
                <div className="workplace-cell" style={{ flex: 1, marginLeft: '-30px' }}>
                  {workplace.Expert ? `${workplace.Expert.firstName} ${workplace.Expert.lastName}` : '-'}
                </div>
                <div className="workplace-cell" style={{ flex: 1, marginLeft: '-30px' }}>
                  {workplace.registrationDate ? new Date(workplace.registrationDate).toLocaleDateString('tr-TR') : '-'}
                </div>
                <div className="workplace-cell" style={{ flex: 1, marginLeft: '-30px' }}>
                  {workplace.TrackingExpert ? `${workplace.TrackingExpert.firstName} ${workplace.TrackingExpert.lastName}` : '-'}
                </div>
                <div className="workplace-cell" style={{ flex: 1, marginLeft: '-30px' }}>
                  <div 
                    className={`dashboard-approval-status ${workplace.approvalStatus}`}
                    onClick={(e) => handleApprovalStatusClick(workplace, e)}
                    style={{ cursor: 'pointer' }}
                  >
                    {getApprovalStatusText(workplace.approvalStatus)}
                  </div>
                </div>
              </div>
            ))}
            
            {sortedWorkplaces.length === 0 && (
              <div className="no-workplaces">Henüz kayıtlı iş yeri bulunmamaktadır.</div>
            )}
            
            {/* Pagination Controls */}
            {sortedWorkplaces.length > workplacesPerPage && (
              <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', gap: '10px' }}>
                <button 
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ 
                    padding: '5px 10px', 
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    backgroundColor: currentPage === 1 ? '#ccc' : '#0078d7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  ← Önceki
                </button>
                <span style={{ margin: '0 10px' }}>
                  Sayfa {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ 
                    padding: '5px 10px', 
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    backgroundColor: currentPage === totalPages ? '#ccc' : '#0078d7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  Sonraki →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal for workplace details */}
      {isModalOpen && selectedWorkplace && (
        <div className="dashboard-modal-overlay" onClick={closeModal}>
          <div className="dashboard-modal-content" key={`modal-${selectedWorkplace.id}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedWorkplace.name} - Detaylar</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              {error && (
                <>
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 9999
                  }} />
                  <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10000,
                    padding: '20px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    borderRadius: '4px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    minWidth: '300px'
                  }}>
                    {error}
                  </div>
                </>
              )}
              <form onSubmit={handleModalSubmit}>
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">İş Yeri Adı:</label>
                    <input
                      type="text"
                      name="name"
                      value={selectedWorkplace.name || ''}
                      onChange={handleModalChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-col">
                    <label className="form-label">Tehlike Sınıfı:</label>
                    <select
                      name="riskLevel"
                      value={selectedWorkplace.riskLevel || 'low'}
                      onChange={handleModalChange}
                      className="form-input"
                    >
                      <option value="low">Az Tehlikeli</option>
                      <option value="dangerous">Tehlikeli</option>
                      <option value="veryDangerous">Çok Tehlikeli</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">Atanan Uzman:</label>
                    <select
                      name="assignedExpertId"
                      value={selectedWorkplace.assignedExpertId || ''}
                      onChange={handleModalChange}
                      className="form-input"
                    >
                      <option value="">Seçiniz</option>
                      {experts.map(expert => {
                        const remainingMinutes = expert.assignedMinutes - (expert.usedMinutes || 0);
                        console.log(`Expert: ${expert.firstName} ${expert.lastName}, Assigned: ${expert.assignedMinutes}, Used: ${expert.usedMinutes}, Remaining: ${remainingMinutes}`);
                        return (
                          <option key={expert.id} value={expert.id}>
                            {expert.firstName} {expert.lastName} - {remainingMinutes} dk
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="form-col">
                    <label className="form-label">Hekim:</label>
                    <select
                      name="assignedDoctorId"
                      value={selectedWorkplace.assignedDoctorId || ''}
                      onChange={handleModalChange}
                      className="form-input"
                    >
                      <option value="">Seçiniz</option>
                      {doctors.map(doctor => {
                        const remainingMinutes = doctor.assignedMinutes - (doctor.usedMinutes || 0);
                        console.log(`Doctor: ${doctor.firstName} ${doctor.lastName}, Assigned: ${doctor.assignedMinutes}, Used: ${doctor.usedMinutes}, Remaining: ${remainingMinutes}`);
                        return (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.firstName} {doctor.lastName} - {remainingMinutes} dk
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">DSP:</label>
                    <select
                      name="assignedDspId"
                      value={selectedWorkplace.assignedDspId || ''}
                      onChange={handleModalChange}
                      className="form-input"
                    >
                      <option value="">Seçiniz</option>
                      {dsps.map(dsp => {
                        const remainingMinutes = dsp.assignedMinutes - (dsp.usedMinutes || 0);
                        console.log(`DSP: ${dsp.firstName} ${dsp.lastName}, Assigned: ${dsp.assignedMinutes}, Used: ${dsp.usedMinutes}, Remaining: ${remainingMinutes}`);
                        return (
                          <option key={dsp.id} value={dsp.id}>
                            {dsp.firstName} {dsp.lastName} - {remainingMinutes} dk
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="form-col">
                    <label className="form-label">Tarih:</label>
                    <input
                      type="date"
                      name="registrationDate"
                      value={selectedWorkplace.registrationDate || ''}
                      onChange={handleModalChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">Takip Eden:</label>
                    <select
                      name="trackingExpertId"
                      value={selectedWorkplace.trackingExpertId || ''}
                      onChange={handleModalChange}
                      className="form-input"
                    >
                      <option value="">Seçiniz</option>
                      {experts.map(expert => (
                        <option key={expert.id} value={expert.id}>
                          {expert.firstName} {expert.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-col">
                    <label className="form-label">Durumu:</label>
                    <select
                      name="approvalStatus"
                      value={selectedWorkplace.approvalStatus || 'atama'}
                      onChange={handleModalChange}
                      className="form-input"
                    >
                      <option value="atama">Atama yapılacak</option>
                      <option value="bekliyor">Onay bekleniyor</option>
                      <option value="onaylandi">Onaylandı</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">Adres:</label>
                    <textarea
                      name="address"
                      value={selectedWorkplace.address || ''}
                      onChange={handleModalChange}
                      className="form-textarea"
                      style={{ minHeight: '55px' }}
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">Telefon:</label>
                    <input
                      type="text"
                      name="phone"
                      value={selectedWorkplace.phone || ''}
                      onChange={handleModalChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-col">
                    <label className="form-label">SGK Sicil No:</label>
                    <input
                      type="text"
                      name="sskRegistrationNo"
                      value={selectedWorkplace.sskRegistrationNo || ''}
                      onChange={handleModalChange}
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">Vergi Dairesi:</label>
                    <input
                      type="text"
                      name="taxOffice"
                      value={selectedWorkplace.taxOffice || ''}
                      onChange={handleModalChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-col">
                    <label className="form-label">Vergi No:</label>
                    <input
                      type="text"
                      name="taxNumber"
                      value={selectedWorkplace.taxNumber || ''}
                      onChange={handleModalChange}
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">Fiyat:</label>
                    <input
                      type="text"
                      name="price"
                      value={selectedWorkplace.price || ''}
                      onChange={handleModalChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-col">
                    <label className="form-label">Çalışan Sayısı:</label>
                    <input
                      type="number"
                      name="employeeCount"
                      value={selectedWorkplace.employeeCount || ''}
                      onChange={handleModalChange}
                      className="form-input"
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">Takip Edecek Hekim:</label>
                    <select
                      name="trackingDoctorId"
                      value={selectedWorkplace.trackingDoctorId || ''}
                      onChange={handleModalChange}
                      className="form-input"
                    >
                      <option value="">Seçiniz</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.firstName} {doctor.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-col">
                    <label className="form-label">KDV Durumu:</label>
                    <div className={`kdv-display ${selectedWorkplace.kdvType || 'excluded'}`}>
                      {selectedWorkplace.kdvType === 'excluded' ? 'KDV HARİÇ' : 'KDV DAHİL'}
                    </div>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">Notlar:</label>
                    <textarea
                      name="notes"
                      value={selectedWorkplace.notes || ''}
                      onChange={handleModalChange}
                      className="form-textarea"
                      rows={3}
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeModal}>Kapat</button>
              <button className="btn btn-primary" onClick={handleModalSubmit}>Kaydet</button>
              <button className="btn btn-danger" onClick={handleDeleteWorkplace}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
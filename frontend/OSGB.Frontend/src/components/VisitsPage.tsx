import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { getAllExperts, getExpertAssignedWorkplaces, getVisitsForExpert } from '../services/api';
import './VisitsPage.css';

interface Expert {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  expertiseClass: string;
  assignedMinutes: number;
  usedMinutes: number;
}

interface ExpertStats {
  expert: Expert;
  assignedWorkplaceCount: number;
  trackedWorkplaceCount: number;
  totalWorkplaceCount: number;
  currentMonthVisitCount: number;
  remainingWorkplaceCount: number;
}

interface Workplace {
  id: number;
  name: string;
  approvalStatus: string;
  // Add other workplace properties as needed
}

interface VisitStatus {
  [workplaceId: number]: {
    [month: string]: boolean; // true if visited, false if not
  };
}

// Function to get the current month name in Turkish
const getCurrentMonthName = () => {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  const currentMonthIndex = new Date().getMonth();
  return months[currentMonthIndex];
};

// Function to get the current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Function to get all 12 months of a year
const getAllYearMonths = (year: number) => {
  const months = [];
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  
  for (let i = 1; i <= 12; i++) {
    const month = String(i).padStart(2, '0');
    months.push({
      value: `${year}-${month}`,
      label: monthNames[i - 1]
    });
  }
  
  return months;
};

const VisitsPage: React.FC = () => {
  const navigate = useNavigate();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [expertStats, setExpertStats] = useState<ExpertStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const socketRef = useRef<Socket | null>(null);
  const currentMonthName = getCurrentMonthName();

  // State for expert popup modal
  const [isExpertModalOpen, setIsExpertModalOpen] = useState<boolean>(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [trackedWorkplaces, setTrackedWorkplaces] = useState<Workplace[]>([]);
  const [workplacesLoading, setWorkplacesLoading] = useState<boolean>(false);
  const [visitStatus, setVisitStatus] = useState<VisitStatus>({});
  const [currentYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchExpertsWithStats();
    
    // Initialize WebSocket connection
    socketRef.current = io('http://localhost:5001');
    
    // Listen for visit updates
    if (socketRef.current) {
      socketRef.current.on('visitUpdate', (data) => {
        // Update visit status in real-time
        setVisitStatus(prev => {
          const newStatus = { ...prev };
          if (!newStatus[data.workplaceId]) {
            newStatus[data.workplaceId] = {};
          }
          newStatus[data.workplaceId][data.visitMonth] = data.visited;
          return newStatus;
        });
      });
    }
    
    // Clean up WebSocket connection
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (isExpertModalOpen && selectedExpert) {
      fetchTrackedWorkplaces(selectedExpert.id);
    }
  }, [isExpertModalOpen, selectedExpert]);

  const fetchExpertsWithStats = async () => {
    try {
      setLoading(true);
      const expertsData = await getAllExperts();
      setExperts(expertsData);
      
      // Fetch stats for each expert
      const statsPromises = expertsData.map(async (expert: Expert) => {
        try {
          // Get assigned workplaces
          const assignedWorkplaces = await getExpertAssignedWorkplaces(expert.id);
          
          // For demo purposes, we'll use placeholder values since we don't have real data
          // In a real implementation, you would calculate these values based on actual data
          return {
            expert,
            assignedWorkplaceCount: assignedWorkplaces.length,
            trackedWorkplaceCount: Math.floor(assignedWorkplaces.length * 0.8), // 80% for demo
            totalWorkplaceCount: assignedWorkplaces.length,
            currentMonthVisitCount: Math.floor(assignedWorkplaces.length * 0.6), // 60% for demo
            remainingWorkplaceCount: Math.ceil(assignedWorkplaces.length * 0.4) // 40% for demo
          };
        } catch (err) {
          // Return default values if there's an error fetching stats
          return {
            expert,
            assignedWorkplaceCount: 0,
            trackedWorkplaceCount: 0,
            totalWorkplaceCount: 0,
            currentMonthVisitCount: 0,
            remainingWorkplaceCount: 0
          };
        }
      });
      
      const statsData = await Promise.all(statsPromises);
      setExpertStats(statsData);
      setError('');
    } catch (err: any) {
      console.error('Error fetching experts:', err);
      setError('Uzmanlar getirilirken hata oluştu: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackedWorkplaces = async (expertId: number) => {
    try {
      setWorkplacesLoading(true);
      const workplacesData = await getExpertAssignedWorkplaces(expertId);
      // Show all workplaces (not just approved ones) for debugging
      setTrackedWorkplaces(workplacesData);
      
      // Fetch visit data for all workplaces
      await fetchVisitData(expertId, workplacesData);
    } catch (err: any) {
      console.error('Error fetching tracked workplaces:', err);
      setError('İş yerleri getirilirken hata oluştu: ' + (err.message || ''));
    } finally {
      setWorkplacesLoading(false);
    }
  };

  const fetchVisitData = async (expertId: number, workplaces: Workplace[]) => {
    try {
      const visitData = await getVisitsForExpert(expertId);
      
      // Initialize visit status from backend data
      const initialStatus: VisitStatus = {};
      workplaces.forEach((workplace) => {
        initialStatus[workplace.id] = {};
        getAllYearMonths(currentYear).forEach(month => {
          // Check if we have visit data for this workplace and month
          if (visitData[workplace.id] && visitData[workplace.id].visits && visitData[workplace.id].visits[month.value]) {
            initialStatus[workplace.id][month.value] = visitData[workplace.id].visits[month.value].visited;
          } else {
            // Default to not visited if no data exists
            initialStatus[workplace.id][month.value] = false;
          }
        });
      });
      
      setVisitStatus(initialStatus);
    } catch (err: any) {
      console.error('Error fetching visit data:', err);
      setError('Ziyaret verileri getirilirken hata oluştu: ' + (err.message || ''));
    }
  };

  // Function to open expert modal
  const openExpertModal = (expert: Expert) => {
    setSelectedExpert(expert);
    setIsExpertModalOpen(true);
  };

  // Function to close expert modal
  const closeExpertModal = () => {
    setIsExpertModalOpen(false);
    setSelectedExpert(null);
    setTrackedWorkplaces([]);
    setVisitStatus({});
  };

  // Calculate total statistics
  const calculateTotalStats = () => {
    return expertStats.reduce((totals, stat) => {
      return {
        totalWorkplaces: totals.totalWorkplaces + stat.totalWorkplaceCount,
        visitedWorkplaces: totals.visitedWorkplaces + stat.currentMonthVisitCount,
        remainingWorkplaces: totals.remainingWorkplaces + stat.remainingWorkplaceCount
      };
    }, { totalWorkplaces: 0, visitedWorkplaces: 0, remainingWorkplaces: 0 });
  };

  const totalStats = calculateTotalStats();

  if (loading) {
    return (
      <div className="visits-page-container">
        <div className="page-header">
          <h2>Ziyaretler</h2>
        </div>
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="visits-page-container">
        <div className="page-header">
          <h2>Ziyaretler</h2>
        </div>
        <div className="error">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <div className="visits-page-container">
      <div className="page-header">
        <h2>Ziyaretler</h2>
      </div>

      {/* Header row with proper alignment */}
      <div className="expert-header">
        <div className="expert-header-item">Ad Soyad</div>
        <div className="expert-header-item class-shifted">Sınıfı</div>
        <div className="expert-header-item assigned-vertical">
          <span>Atanan</span>
          <span>İşyerleri</span>
        </div>
        <div className="expert-header-item">
          <span>Takip edilecek</span>
          <span>  İşyerleri</span>
        </div>
        <div className="expert-header-item minutes-vertical">
          <span>Gerçekleşen</span>
          <span>  Ziyaretler</span>
        </div>
        <div className="expert-header-item minutes-vertical">
          <span>Kalan</span>
          <span>  Ziyaretler</span>
        </div>
      </div>

      {/* Expert rows with proper alignment */}
      <div className="expert-list">
        {expertStats.map((stat) => (
          <div 
            key={stat.expert.id} 
            className="expert-row"
            onClick={() => openExpertModal(stat.expert)}
          >
            <div className="expert-info">
              <div className="expert-name">{stat.expert.firstName} {stat.expert.lastName}</div>
              <div className={`expert-class ${stat.expert.expertiseClass.toLowerCase()}`}>
                {stat.expert.expertiseClass}
              </div>
              <div className="expert-assigned">{stat.assignedWorkplaceCount}</div>
              <div className="expert-remaining">{stat.trackedWorkplaceCount}</div>
              <div className="expert-minutes">{stat.currentMonthVisitCount}</div>
              <div className="expert-minutes">{stat.remainingWorkplaceCount}</div>
            </div>
          </div>
        ))}
      </div>

      {expertStats.length === 0 && (
        <div className="no-workplaces">Kayıtlı uzman bulunamadı</div>
      )}

      {/* Statistics panel */}
      <div className="statistics-panel">
        <h3 className="statistics-header">Ziyaret İstatistikleri</h3>
        <div className="statistics-content">
          <div className="stat-item">
            <span className="stat-label">{currentMonthName} ayında ziyaret edilmesi gereken</span>
            <span className="stat-value">{totalStats.totalWorkplaces}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{currentMonthName} ayından ziyareti yapılan işletme sayısı:</span>
            <span className="stat-value">{totalStats.visitedWorkplaces}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{currentMonthName} ayında ziyareti kalan işletme sayısı:</span>
            <span className="stat-value">{totalStats.remainingWorkplaces}</span>
          </div>
        </div>
      </div>

      {/* Expert Modal Popup */}
      {isExpertModalOpen && selectedExpert && (
        <div className="expert-modal-overlay" onClick={closeExpertModal}>
          <div className="expert-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="expert-modal-header">
              <h2 className="expert-name-display">{selectedExpert.firstName} {selectedExpert.lastName}</h2>
              <button className="expert-modal-close" onClick={closeExpertModal}>×</button>
            </div>
            <div className="expert-modal-body">
              <div className="year-calendar-section">
                <h3>{currentYear} Yılı Ziyaret Takvimi</h3>
                {workplacesLoading ? (
                  <p>Yükleniyor...</p>
                ) : error ? (
                  <p className="error">{error}</p>
                ) : trackedWorkplaces.length > 0 ? (
                  <div className="workplaces-calendar">
                    {trackedWorkplaces.map((workplace) => (
                      <div key={workplace.id} className="workplace-calendar">
                        <div className="workplace-name">{workplace.name}</div>
                        <div className="months-grid">
                          {getAllYearMonths(currentYear).map((month) => {
                            const isVisited = visitStatus[workplace.id]?.[month.value] || false;
                            return (
                              <div 
                                key={month.value} 
                                className={`month-box ${isVisited ? 'visited' : 'not-visited'}`}
                                title={`${month.label} ${currentYear}: ${isVisited ? 'Ziyaret Edildi' : 'Ziyaret Edilmedi'}`}
                              >
                                <span className="month-label">{month.label.charAt(0)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Seçilen uzmanın takip edeceği iş yeri bulunamadı.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitsPage;
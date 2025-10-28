import React from 'react';
import './AssignedWorkplacesModal.css';

interface Workplace {
  id: number;
  name: string;
  sskRegistrationNo: string;
  address: string;
  price: string;
  taxOffice: string;
  taxNumber: string;
  riskLevel: string;
  employeeCount: string;
  source: string;
  assignedExpertId: string | null;
  assignedDoctorId: string | null;
  assignedDspId: string | null;
  registrationDate: string;
  approvalStatus: string;
}

interface AssignedWorkplacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  workplaces: Workplace[];
  personnelName: string;
  personnelType: string;
}

const AssignedWorkplacesModal: React.FC<AssignedWorkplacesModalProps> = ({
  isOpen,
  onClose,
  workplaces,
  personnelName,
  personnelType
}) => {
  if (!isOpen) return null;

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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="window">
          <div className="window-header">
            <span>{personnelName} - Atandığı İş Yerleri</span>
            <button className="window-button" onClick={onClose}>×</button>
          </div>
          <div className="window-content" style={{ padding: 0, margin: 0 }}>
            {workplaces.length === 0 ? (
              <p>Henüz atanmış iş yeri bulunmamaktadır.</p>
            ) : (
              <div className="workplaces-table">
                <div className="table-header">
                  <div className="table-cell" style={{ marginRight: '5px' }}>İş Yeri Adı</div>
                  <div className="table-cell" style={{ marginLeft: '-30px' }}>SGK Sicil No</div>
                  <div className="table-cell" style={{ marginLeft: '-30px' }}>Tehlike Sınıfı</div>
                  <div className="table-cell" style={{ marginLeft: '-30px' }}>Çalışan Sayısı</div>
                  <div className="table-cell" style={{ marginLeft: '-30px' }}>Kayıt Tarihi</div>
                  <div className="table-cell" style={{ marginLeft: '-30px' }}>Onay Durumu</div>
                </div>
                {workplaces.map((workplace) => (
                  <div key={workplace.id} className="table-row">
                    <div className="table-cell" title={workplace.name} style={{ marginRight: '5px' }}>
                      {workplace.name}
                    </div>
                    <div className="table-cell" title={workplace.sskRegistrationNo} style={{ marginLeft: '-30px' }}>
                      {workplace.sskRegistrationNo}
                    </div>
                    <div className="table-cell" style={{ marginLeft: '-30px' }}>
                      <span className={`risk-level-${workplace.riskLevel}`}>
                        {formatRiskLevel(workplace.riskLevel)}
                      </span>
                    </div>
                    <div className="table-cell" style={{ marginLeft: '-30px' }}>{workplace.employeeCount}</div>
                    <div className="table-cell" style={{ marginLeft: '-30px' }}>{formatDate(workplace.registrationDate)}</div>
                    <div className="table-cell" style={{ marginLeft: '-30px' }}>
                      <span className={`status-badge status-${workplace.approvalStatus}`}>
                        {workplace.approvalStatus === 'atama' && 'Atama yapılacak'}
                        {workplace.approvalStatus === 'bekliyor' && 'Onay bekleniyor'}
                        {workplace.approvalStatus === 'onaylandi' && 'Onaylandı'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-actions" style={{ padding: '15px', margin: 0 }}>
            <button className="btn btn-close" onClick={onClose}>Kapat</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignedWorkplacesModal;
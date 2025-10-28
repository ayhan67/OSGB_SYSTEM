import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSystemConfig, upsertSystemConfig, deleteSystemConfig } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const AdminPanel = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newConfig, setNewConfig] = useState({ key: '', value: '', description: '' });
  const [editingConfig, setEditingConfig] = useState<any>(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchConfigs();
  }, [user, navigate]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await getAllSystemConfig();
      setConfigs(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertSystemConfig(newConfig);
      setSuccess('Configuration created successfully');
      setNewConfig({ key: '', value: '', description: '' });
      fetchConfigs();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create configuration');
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertSystemConfig(editingConfig);
      setSuccess('Configuration updated successfully');
      setEditingConfig(null);
      fetchConfigs();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update configuration');
    }
  };

  const handleDeleteConfig = async (key: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete configuration "${key}"?`);
    if (!confirmed) return;
    
    try {
      await deleteSystemConfig(key);
      setSuccess('Configuration deleted successfully');
      fetchConfigs();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete configuration');
    }
  };

  if (user?.role !== 'admin') {
    return <div>Access denied. Admin only.</div>;
  }

  return (
    <div className="login-container">
      <div className="login-window" style={{ width: '800px', maxWidth: '90%' }}>
        <div className="login-content">
          <div className="login-logo">
            <h2 className="login-title">Admin Panel</h2>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="toggle-form">
            <button 
              type="button" 
              onClick={() => navigate('/')}
              className="link-button"
            >
              ← Dashboard
            </button>
          </div>
          
          {/* Create new configuration form */}
          <div style={{ marginTop: '20px' }}>
            <h3>Create New Configuration</h3>
            <form onSubmit={handleCreateConfig} className="login-form">
              <div className="login-input-group">
                <label htmlFor="newKey">Key</label>
                <input
                  type="text"
                  id="newKey"
                  value={newConfig.key}
                  onChange={(e) => setNewConfig({...newConfig, key: e.target.value})}
                  required
                  className="login-input"
                />
              </div>
              
              <div className="login-input-group">
                <label htmlFor="newValue">Value</label>
                <textarea
                  id="newValue"
                  value={newConfig.value}
                  onChange={(e) => setNewConfig({...newConfig, value: e.target.value})}
                  required
                  className="login-input"
                  rows={3}
                />
              </div>
              
              <div className="login-input-group">
                <label htmlFor="newDescription">Description (Optional)</label>
                <input
                  type="text"
                  id="newDescription"
                  value={newConfig.description}
                  onChange={(e) => setNewConfig({...newConfig, description: e.target.value})}
                  className="login-input"
                />
              </div>
              
              <button type="submit" className="login-button">
                Create Configuration
              </button>
            </form>
          </div>
          
          {/* Existing configurations list */}
          <div style={{ marginTop: '30px' }}>
            <h3>Existing Configurations</h3>
            
            {loading ? (
              <div>Loading configurations...</div>
            ) : configs.length === 0 ? (
              <div>No configurations found</div>
            ) : (
              <div className="config-list">
                {configs.map((config) => (
                  <div key={config.key} className="config-item" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
                    {editingConfig?.key === config.key ? (
                      // Edit form
                      <form onSubmit={handleUpdateConfig}>
                        <div className="login-input-group">
                          <label>Key</label>
                          <input
                            type="text"
                            value={editingConfig.key}
                            onChange={(e) => setEditingConfig({...editingConfig, key: e.target.value})}
                            required
                            className="login-input"
                            readOnly
                          />
                        </div>
                        
                        <div className="login-input-group">
                          <label>Value</label>
                          <textarea
                            value={editingConfig.value}
                            onChange={(e) => setEditingConfig({...editingConfig, value: e.target.value})}
                            required
                            className="login-input"
                            rows={3}
                          />
                        </div>
                        
                        <div className="login-input-group">
                          <label>Description</label>
                          <input
                            type="text"
                            value={editingConfig.description || ''}
                            onChange={(e) => setEditingConfig({...editingConfig, description: e.target.value})}
                            className="login-input"
                          />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button type="submit" className="login-button">Save</button>
                          <button 
                            type="button" 
                            onClick={() => setEditingConfig(null)}
                            className="btn btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      // Display config
                      <>
                        <div><strong>Key:</strong> {config.key}</div>
                        <div><strong>Value:</strong> {config.value}</div>
                        {config.description && <div><strong>Description:</strong> {config.description}</div>}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button 
                            type="button" 
                            onClick={() => setEditingConfig(config)}
                            className="btn btn-primary"
                          >
                            Edit
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteConfig(config.key)}
                            className="btn btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
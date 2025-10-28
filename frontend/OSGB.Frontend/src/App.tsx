import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import './App.css';

// Lazy load components
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const ExpertCardPage = React.lazy(() => import('./components/ExpertCardPage'));
const DoctorCardPage = React.lazy(() => import('./components/DoctorCardPage'));
const DspCardPage = React.lazy(() => import('./components/DspCardPage'));
const WorkplacePage = React.lazy(() => import('./components/WorkplacePage'));
const VisitsPage = React.lazy(() => import('./components/VisitsPage'));
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const OrganizationRegisterPage = React.lazy(() => import('./components/OrganizationRegisterPage'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
const TestAuthPage = React.lazy(() => import('./components/TestAuthPage'));
const ProfilePage = React.lazy(() => import('./components/ProfilePage'));

// Wrapper components to include Navbar with proper routing context
const DashboardPage = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Navbar />
      <Dashboard />
    </Suspense>
  );
};

const ExpertPage = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Navbar />
      <ExpertCardPage />
    </Suspense>
  );
};

const DoctorPage = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Navbar />
      <DoctorCardPage />
    </Suspense>
  );
};

const DspPage = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Navbar />
      <DspCardPage />
    </Suspense>
  );
};

const WorkplacePageWrapper = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Navbar />
      <WorkplacePage />
    </Suspense>
  );
};

// Added VisitsPage wrapper
const VisitsPageWrapper = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Navbar />
      <VisitsPage />
    </Suspense>
  );
};

// Profile page wrapper
const ProfilePageWrapper = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Navbar />
      <ProfilePage />
    </Suspense>
  );
};

// Login page wrapper
const LoginPageWrapper = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" />;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
};

// Organization registration page wrapper
const OrganizationRegisterPageWrapper = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" />;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrganizationRegisterPage />
    </Suspense>
  );
};

// Admin panel wrapper
const AdminPanelWrapper = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'admin') return <Navigate to="/" />;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPanel />
    </Suspense>
  );
};

// Test auth page wrapper
const TestAuthPageWrapper = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Navbar />
      <TestAuthPage />
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<LoginPageWrapper />} />
            <Route path="/register-organization" element={<OrganizationRegisterPageWrapper />} />
            <Route path="/admin" element={<AdminPanelWrapper />} />
            <Route path="/test-auth" element={<TestAuthPageWrapper />} />
            <Route path="/" element={<DashboardPage />} />
            <Route path="/experts" element={<ExpertPage />} />
            <Route path="/doctors" element={<DoctorPage />} />
            <Route path="/dsps" element={<DspPage />} />
            <Route path="/workplaces" element={<WorkplacePageWrapper />} />
            <Route path="/visits" element={<VisitsPageWrapper />} />
            <Route path="/profile" element={<ProfilePageWrapper />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { VendorProvider, useVendor } from './context/VendorContext';
import VendorLogin from './components/VendorLogin';
import VendorRegister from './components/VendorRegister';
import VendorHeader from './components/VendorHeader';
import VendorSidebar from './components/VendorSidebar';
import VendorDashboard from './components/VendorDashboard';
import VendorRequests from './components/VendorRequests';
import VendorJobs from './components/VendorJobs';
import VendorProfile from './components/VendorProfile';
import PendingApproval from './components/PendingApproval';
import ProtectedVendorRoute from './components/ProtectedVendorRoute';

import './App.css';

const AppLayout = () => {
  const { vendor, loading } = useVendor();
  const location = useLocation();

  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(location.pathname);
  const isPendingPage = location.pathname === '/pending';

  if (loading) {
    return (
      <div className="app-loader">
        <div className="app-spinner"></div>
        <p>Preparing your workspace...</p>
      </div>
    );
  }

  // Auth pages — no header/sidebar
  if (isAuthPage || isPendingPage) {
    return (
      <Routes>
        <Route path="/login" element={vendor ? <Navigate to={vendor.status === 'approved' ? '/dashboard' : '/pending'} /> : <VendorLogin />} />
        <Route path="/register" element={vendor ? <Navigate to="/pending" /> : <VendorRegister />} />
        <Route path="/pending" element={vendor ? <PendingApproval /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Protected pages — with header/sidebar
  return (
    <>
      <VendorHeader />
      <div className="app-body">
        <VendorSidebar />
        <main className="app-main">
          <Routes>
            <Route path="/dashboard" element={
              <ProtectedVendorRoute><VendorDashboard /></ProtectedVendorRoute>
            } />
            <Route path="/requests" element={
              <ProtectedVendorRoute><VendorRequests /></ProtectedVendorRoute>
            } />
            <Route path="/jobs" element={
              <ProtectedVendorRoute><VendorJobs /></ProtectedVendorRoute>
            } />
            <Route path="/profile" element={
              <ProtectedVendorRoute><VendorProfile /></ProtectedVendorRoute>
            } />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </>
  );
};

const App = () => {
  return (
    <VendorProvider>
      <Router>
        <div className="vendor-app">
          <AppLayout />
          <ToastContainer
            position="bottom-right"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable={false}
            theme="dark"
            toastClassName="vendor-toast"
          />
        </div>
      </Router>
    </VendorProvider>
  );
};

export default App;

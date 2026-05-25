import React from 'react';
import { Navigate } from 'react-router-dom';
import { useVendor } from '../context/VendorContext';

const ProtectedVendorRoute = ({ children }) => {
  const { vendor, loading } = useVendor();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!vendor) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedVendorRoute;

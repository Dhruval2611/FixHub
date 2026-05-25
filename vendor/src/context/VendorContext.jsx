import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const VendorContext = createContext(null);

export const useVendor = () => useContext(VendorContext);

export const VendorProvider = ({ children }) => {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVendor = async () => {
      const token = localStorage.getItem('vendorToken');
      const stored = localStorage.getItem('vendor');

      if (token && stored) {
        try {
          const res = await api.get('/vendor/profile');
          const vendorData = res.data;
          setVendor(vendorData);
          localStorage.setItem('vendor', JSON.stringify(vendorData));
        } catch (err) {
          console.error('Failed to load vendor profile:', err);
          localStorage.removeItem('vendorToken');
          localStorage.removeItem('vendor');
          setVendor(null);
        }
      }
      setLoading(false);
    };

    loadVendor();
  }, []);

  const loginVendor = (token, vendorData) => {
    localStorage.setItem('vendorToken', token);
    localStorage.setItem('vendor', JSON.stringify(vendorData));
    setVendor(vendorData);
  };

  const logoutVendor = () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendor');
    setVendor(null);
  };

  const updateVendor = (updatedData) => {
    setVendor(updatedData);
    localStorage.setItem('vendor', JSON.stringify(updatedData));
  };

  return (
    <VendorContext.Provider value={{ vendor, loading, loginVendor, logoutVendor, updateVendor }}>
      {children}
    </VendorContext.Provider>
  );
};

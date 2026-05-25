import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useUser, useClerk, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';

import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Eagerly loaded — used on every page (app shell)
import Header from './components/Header';
import CardNav from './components/CardNav';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from './components/CartContext';
import SkeletonLoader from './components/SkeletonLoader';
import CompleteProfile from './components/CompleteProfile';
import './App.css';

// Lazy-loaded route components — only fetched when navigated to
const Home = lazy(() => import('./components/Home'));
const Services = lazy(() => import('./components/Services'));
const Pricing = lazy(() => import('./components/Pricing'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const ProviderProfile = lazy(() => import('./components/ProviderProfile'));
const AssetVault = lazy(() => import('./components/AssetVault'));
const Admin = lazy(() => import('./components/Admin'));
const AccountSettings = lazy(() => import('./components/AccountSettings'));
const YourBookings = lazy(() => import('./components/YourBookings'));
const SelectVendor = lazy(() => import('./components/SelectVendor'));
const VendorSelection = lazy(() => import('./components/VendorSelection'));
const Cart = lazy(() => import('./components/Cart'));
const Checkout = lazy(() => import('./components/Checkout'));
const Login = lazy(() => import('./components/Login'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const Register = lazy(() => import('./components/Register'));
const GetSupport = lazy(() => import('./components/GetSupport'));
const ServiceDetail = lazy(() => import('./components/ServiceDetail'));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { isSignedIn, user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerk();

  // Sync Clerk user with backend
  useEffect(() => {
    let cancelled = false;

    const syncUser = async () => {
      if (!clerkLoaded) return;

      if (isSignedIn && clerkUser) {
        // Try cached token first for instant load
        const existingToken = localStorage.getItem('token');
        if (existingToken && !user) {
          try {
            const response = await axios.get('http://localhost:5000/api/auth/me', {
              headers: { 'x-auth-token': existingToken }
            });
            if (!cancelled) {
              setUser(response.data);
              setLoading(false);
            }
            // Token is valid — skip the full clerk-sync for this session
            return;
          } catch {
            localStorage.removeItem('token');
          }
        }

        // Only do full Clerk sync if no valid cached token
        if (!user) {
          try {
            const res = await axios.post('http://localhost:5000/api/auth/clerk-sync', {
              clerkUserId: clerkUser.id,
            });
            if (!cancelled) {
              localStorage.setItem('token', res.data.token);
              setUser(res.data.user);
              if (!sessionStorage.getItem('loginToastShown')) {
                toast.success(`Welcome, ${res.data.user.name || 'User'}!`);
                sessionStorage.setItem('loginToastShown', 'true');
              }
              const pendingKey = `pendingProfileSetup_${res.data.user.id}`;
              const finishedKey = `profileSetup_${res.data.user.id}`;
              
              if (res.data.isNewUser) {
                localStorage.setItem(pendingKey, 'true');
              }

              if (
                window.location.pathname === '/' &&
                localStorage.getItem(pendingKey) === 'true' && 
                !localStorage.getItem(finishedKey)
              ) {
                setShowProfileModal(true);
              }
            }
          } catch (error) {
            console.error('Clerk sync failed:', error);
          }
        }
      } else {
        localStorage.removeItem('token');
        sessionStorage.removeItem('loginToastShown');
        if (!cancelled) setUser(null);
      }
      if (!cancelled) setLoading(false);
    };

    syncUser();
    return () => { cancelled = true; };
  }, [isSignedIn, clerkUser, clerkLoaded]);

  const handleSetUser = (newUser) => {
    if (!newUser) {
      // Logout: also sign out from Clerk
      localStorage.removeItem('token');
      sessionStorage.removeItem('loginToastShown');
      signOut();
    }
    setUser(newUser);
  };

  if (loading || !clerkLoaded || (isSignedIn && !user)) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#fff', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '20px'
      }}>
        <div className="workspace-spinner" style={{ 
          width: '32px', 
          height: '32px', 
          borderWidth: '3px',
          borderColor: '#E5E7EB',
          borderTopColor: '#111827'
        }}></div>
        <p style={{ 
          color: '#6B7280', 
          fontSize: '14px', 
          fontWeight: 500,
          margin: 0,
          animation: 'pulse 2s infinite'
        }}>
          Preparing your workspace...
        </p>
        <ToastContainer
          position="bottom-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable={false}
          theme="light"
          toastClassName="fixhub-toast"
        />
      </div>
    );
  }

  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <div className="App">
          {/* Hide Header when user is admin */}
          {(!user || user.role !== 'admin') && <Header user={user} setUser={handleSetUser} />}
          {(!user || user.role !== 'admin') && <CardNav user={user} setUser={handleSetUser} />}
          {showProfileModal && user && (
            <CompleteProfile
              user={user}
              onComplete={(updatedUser) => {
                setUser({
                  ...user,
                  name: updatedUser.name,
                  phone: updatedUser.phone,
                  profilePicture: updatedUser.profilePicture,
                });
                setShowProfileModal(false);
                const userId = user.id || user._id;
                localStorage.setItem(`profileSetup_${userId}`, 'done');
                localStorage.removeItem(`pendingProfileSetup_${userId}`);
              }}
              onSkip={() => {
                setShowProfileModal(false);
                const userId = user.id || user._id;
                localStorage.setItem(`profileSetup_${userId}`, 'done');
                localStorage.removeItem(`pendingProfileSetup_${userId}`);
              }}
            />
          )}
          <div className="main-content">
            <Suspense fallback={<SkeletonLoader />}>
              <Routes>
                {/* Admin Routes - Only accessible by admins */}
                {user && user.role === 'admin' ? (
                  <>
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/login" element={<Navigate to="/admin" />} />
                    <Route path="*" element={<Navigate to="/admin" />} />
                  </>
                ) : (
                  <>
                    {/* Regular User Routes */}
                    <Route path="/admin" element={<Navigate to="/login" />} />
                    <Route path="/" element={<Home />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/services/:id" element={<ServiceDetail />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/provider-profile" element={<ProviderProfile />} />
                    <Route path="/asset-vault" element={<AssetVault />} />
                    <Route path="/account-settings" element={<AccountSettings user={user} setUser={handleSetUser} />} />
                    <Route path="/your-bookings" element={<YourBookings />} />
                    <Route path="/vendor-selection" element={<VendorSelection />} />
                    <Route path="/bookings/:id/select-vendor" element={<SelectVendor />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
                    <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />
                    <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
                    <Route path="/sso-callback" element={
                      <>
                        <div className="sso-loading">
                          <div className="sso-spinner"></div>
                          <p>Signing you in...</p>
                        </div>
                        <AuthenticateWithRedirectCallback
                          signInForceRedirectUrl="/"
                          signUpForceRedirectUrl="/"
                        />
                      </>
                    } />
                    <Route path="/get-support" element={<GetSupport />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </>
                )}
              </Routes>
            </Suspense>
          </div>
          {/* Hide Footer when user is admin */}
          {(!user || user.role !== 'admin') && <Footer />}
          <ToastContainer
            position="bottom-right"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable={false}
            theme="light"
            toastClassName="fixhub-toast"
          />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;

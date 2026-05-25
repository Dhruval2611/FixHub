import React from 'react';
import { NavLink } from 'react-router-dom';
import { HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineBriefcase, HiOutlineUser } from 'react-icons/hi';
import './VendorSidebar.css';

const VendorSidebar = () => {
  return (
    <aside className="vendor-sidebar">
      <nav className="vs-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `vs-link ${isActive ? 'active' : ''}`}>
          <HiOutlineViewGrid className="vs-icon" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/requests" className={({ isActive }) => `vs-link ${isActive ? 'active' : ''}`}>
          <HiOutlineClipboardList className="vs-icon" />
          <span>Requests</span>
        </NavLink>
        <NavLink to="/jobs" className={({ isActive }) => `vs-link ${isActive ? 'active' : ''}`}>
          <HiOutlineBriefcase className="vs-icon" />
          <span>My Jobs</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `vs-link ${isActive ? 'active' : ''}`}>
          <HiOutlineUser className="vs-icon" />
          <span>Profile</span>
        </NavLink>
      </nav>

      <div className="vs-footer">
        <p>FixHub Vendor Portal</p>
        <p className="vs-version">v1.0.0</p>
      </div>
    </aside>
  );
};

export default VendorSidebar;

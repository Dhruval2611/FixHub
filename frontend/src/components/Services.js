import React, { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt, faBroom, faPaintRoller, faSnowflake,
  faWrench, faCar, faCouch, faGear,
  faBorderAll, faPlus, faMagnifyingGlass
} from '@fortawesome/free-solid-svg-icons';

const CATEGORY_FILTERS = [
  { label: 'All', icon: faBorderAll },
  { label: 'Electrician', icon: faBolt },
  { label: 'AC Technician', icon: faSnowflake },
  { label: 'Plumber', icon: faWrench },
  { label: 'Mechanic', icon: faCar },
  { label: 'Home Cleaner', icon: faBroom },
  { label: 'Sofa Cleaner', icon: faCouch },
  { label: 'Home Painter', icon: faPaintRoller },
];
import { cachedGet } from '../utils/cachedApi';
import './Services.css';

const CATEGORY_ICONS = {
  'Electrician': faBolt,
  'AC Technician': faSnowflake,
  'Plumber': faWrench,
  'Mechanic': faCar,
  'Home Cleaner': faBroom,
  'Sofa Cleaner': faCouch,
  'Home Painter': faPaintRoller,
};

const getServiceIcon = (name = '', category = '') => {
  return CATEGORY_ICONS[category] || faGear;
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [userPlan, setUserPlan] = useState('Basic');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'x-auth-token': token } : {};
        
        const response = await axios.get('http://localhost:5000/api/services', { headers });
        
        if (response.data.success && Array.isArray(response.data.services)) {
          setServices(response.data.services);
          setUserPlan(response.data.userPlan || 'Basic');
          setDiscountApplied(response.data.discountApplied || 0);
        }
      } catch (err) {
        console.error("Error fetching services", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    let result = services;
    if (selectedCategory !== 'All') {
      result = result.filter(s => s.category === selectedCategory);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.description && s.description.toLowerCase().includes(q))
      );
    }
    setFilteredServices(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [services, selectedCategory, searchQuery]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const { addToCart } = useCart();

  // Pagination Logic
  const itemsPerPage = 9;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentServices = filteredServices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleAddToCart = async (service) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to add services to cart');
      navigate('/login');
      return;
    }
    const status = await addToCart(service);
    if (status === 'already') {
      toast.warning(`${service.name} is already in your cart!`);
    } else if (status === 'added') {
      toast.success(`${service.name} added to cart!`);
    } else {
      toast.error('Failed to add to cart. Please try again.');
    }
  };



  if (loading) return <div className="full-page-loader"><span>Loading Services...</span></div>;

  return (
    <div className="full-services-wrapper">
      <div className="content-container">
        {/* Header Section - No Box */}
        {/* Header Section - No Box */}
        <header className="main-header">
          <div className="text-content">
            <h1>Our Services</h1>
            <p>Premium maintenance solutions for your home and vehicle</p>
          </div>

          <div className="header-controls">
            <div className="search-shelf">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="search-shelf-icon" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-dropdown-wrap">
              <select
                className="filter-dropdown"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {CATEGORY_FILTERS.map(({ label }) => (
                  <option key={label} value={label}>{label === 'All' ? 'All Categories' : label}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Discount Banner */}
        {discountApplied > 0 && (
          <div className="discount-banner">
            <div className="discount-banner-content">
              <span className="discount-badge-large">{discountApplied}% OFF</span>
              <span className="discount-text">
                Active with {userPlan} Plan! You're saving on every service.
              </span>
            </div>
          </div>
        )}

        {/* Services Grid - No Box */}
        <section className="services-full-grid">
          {currentServices.map((service, index) => (
            <div
              key={service._id}
              className="premium-service-card"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => navigate(`/services/${service._id}`)}
            >
              <div className="card-top">
                <div className="icon-badge">
                  <FontAwesomeIcon icon={getServiceIcon(service.name, service.category)} />
                </div>
                <div className="category-tag">{service.category}</div>
              </div>
              <div className="card-body">
                <h3>{service.name}</h3>
                <p>{service.description}</p>
              </div>
              <div className="card-bottom">
                <div className="price-section">
                  {service.hasDiscount || (discountApplied > 0) ? (
                    <>
                      <div className="original-price">
                        ₹{service.originalPrice || Math.round(service.price / (1 - (discountApplied / 100)))}
                      </div>
                      <div className="price-row">
                        <span className="discounted-price">₹{service.price}</span>
                        <span className="discount-tag-modern">
                          -{service.discountPercentage || discountApplied}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="price">₹{service.price}</span>
                  )}
                </div>
                <button
                  className="add-to-cart-minimal"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(service);
                  }}
                  title="Add to Cart"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button 
              className="pagination-btn" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            
            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  className={`pagination-number ${currentPage === num ? 'active' : ''}`}
                  onClick={() => handlePageChange(num)}
                >
                  {num}
                </button>
              ))}
            </div>

            <button 
              className="pagination-btn" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
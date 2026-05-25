import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from './CartContext';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faPlus, faWrench, faBolt, faBroom, faPaintRoller,
  faBug, faSnowflake, faShower, faCar, faOilCan, faScrewdriverWrench,
  faFire, faLeaf, faLightbulb, faGear, faCircleCheck, faShieldHalved,
  faClock, faUserTie, faStar, faHandshakeSimple, faListCheck, faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import './ServiceDetail.css';

const getServiceIcon = (name = '', category = '') => {
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  if (n.includes('plumb') || n.includes('pipe') || n.includes('tap') || n.includes('leak')) return faWrench;
  if (n.includes('electric') || n.includes('wiring') || n.includes('switch') || n.includes('power')) return faBolt;
  if (n.includes('clean') || n.includes('sweep') || n.includes('mop') || n.includes('wash')) return faBroom;
  if (n.includes('paint') || n.includes('colour') || n.includes('color')) return faPaintRoller;
  if (n.includes('pest') || n.includes('termite') || n.includes('cockroach') || n.includes('mosquito')) return faBug;
  if (n.includes('ac') || n.includes('air con') || n.includes('cooling') || n.includes('hvac') || n.includes('refriger')) return faSnowflake;
  if (n.includes('bath') || n.includes('shower') || n.includes('toilet') || n.includes('sanit')) return faShower;
  if (n.includes('oil') || n.includes('lube')) return faOilCan;
  if (n.includes('tyre') || n.includes('tire') || n.includes('wheel')) return faCar;
  if (n.includes('car') || n.includes('vehicle') || n.includes('auto')) return faCar;
  if (n.includes('repair') || n.includes('fix') || n.includes('mainte')) return faScrewdriverWrench;
  if (n.includes('gas') || n.includes('boiler') || n.includes('heat')) return faFire;
  if (n.includes('garden') || n.includes('lawn') || n.includes('plant')) return faLeaf;
  if (n.includes('light') || n.includes('lamp') || n.includes('fan') || n.includes('applian')) return faLightbulb;
  if (c.includes('car')) return faCar;
  return faGear;
};

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'x-auth-token': token } : {};
        const response = await axios.get(`http://localhost:5000/api/services/${id}`, { headers });
        if (response.data.success) {
          setService(response.data.service);
        }
      } catch (err) {
        console.error("Error fetching service details", err);
        toast.error("Failed to load service details");
        navigate('/services');
      } finally {
        setLoading(false);
      }
    };
    fetchServiceDetail();
  }, [id, navigate]);

  const handleAddToCart = async () => {
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

  if (loading) return (
    <div className="service-detail-loading">
      <div className="spinner"></div>
      <p>Loading details...</p>
    </div>
  );

  if (!service) return null;

  return (
    <div className="compact-detail-container">
      <div className="compact-detail-wrapper">
        <nav className="breadcrumb">
          <span onClick={() => navigate('/services')}>Services</span>
          <FontAwesomeIcon icon={faArrowRight} className="crumb-sep" />
          <span className="current">{service.name}</span>
        </nav>

        <div className="main-grid">
          {/* Left Column: Core Info */}
          <div className="core-info-card">
            <div className="header-row">
              <div className="compact-icon-box">
                <FontAwesomeIcon icon={getServiceIcon(service.name, service.category)} />
              </div>
              <div className="title-area">
                <h1>{service.name}</h1>
                <span className="category-pill">{service.category}</span>
              </div>
            </div>

            <p className="description-text">{service.description}</p>

            <div className="stats-row">
              <div className="stat-item">
                <FontAwesomeIcon icon={faClock} />
                <span>{service.duration || 'Flexible'}</span>
              </div>
              <div className="stat-item">
                <FontAwesomeIcon icon={faShieldHalved} />
                <span>Verified</span>
              </div>
              <div className="stat-item">
                <FontAwesomeIcon icon={faStar} />
                <span>4.8 Rating</span>
              </div>
            </div>

            <div className="detail-tabs">
              <div className="tab-section">
                <h3>What's Included</h3>
                <div className="inclusion-grid">
                  {(service.inclusions?.length ? service.inclusions : ['Expert consultation', 'Equipment setup', 'Quality check']).map((item, i) => (
                    <div key={i} className="inclusion-badge">
                      <FontAwesomeIcon icon={faCircleCheck} /> {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="tab-section">
                <h3>Service Highlights</h3>
                <div className="highlight-pill-container">
                  {(service.highlights?.length ? service.highlights : ['Safety First', 'Certified Team', 'Quality Guaranteed']).map((tag, i) => (
                    <span key={i} className="highlight-pill">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout & Extras */}
          <div className="sidebar-container">
            <div className="booking-card">
              <div className="price-tag">
                <span className="label">Service Fee</span>
                <div className="price-display">
                  <span className="amount">₹{service.price}</span>
                  {service.hasDiscount && <span className="original">₹{service.originalPrice}</span>}
                </div>
                {service.hasDiscount && (
                  <div className="savings-msg">Saved ₹{service.originalPrice - service.price} with {service.planName} Plan</div>
                )}
              </div>

              <button className="book-now-btn" onClick={handleAddToCart}>
                <FontAwesomeIcon icon={faPlus} /> Add to Cart
              </button>
              <p className="guarantee-note">100% Satisfaction Guaranteed</p>
            </div>

            <div className="team-instruction-card">
              <h3><FontAwesomeIcon icon={faUserTie} /> From the Team</h3>
              <p>Our professionals will reach your doorstep within 90 minutes. We ensure a clean and hassle-free experience.</p>
              <div className="checklist-small">
                <div><FontAwesomeIcon icon={faListCheck} /> Area inspection</div>
                <div><FontAwesomeIcon icon={faListCheck} /> Post-service cleanup</div>
              </div>
            </div>

            <div className="why-us-card">
              <h3><FontAwesomeIcon icon={faHandshakeSimple} /> Why FixHub?</h3>
              <ul>
                <li>Equipped & Skilled team</li>
                <li>No Hidden Charges</li>
                <li>Instant Support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Process Section */}
        <section className="process-section">
          <h2>Our 3-Step Process</h2>
          <div className="process-grid">
            <div className="process-step">
              <div className="step-num">01</div>
              <h4>Inspection</h4>
              <p>Thorough assessment of your requirements on-site.</p>
            </div>
            <div className="process-step">
              <div className="step-num">02</div>
              <h4>Execution</h4>
              <p>Professional service delivery using premium equipment.</p>
            </div>
            <div className="process-step">
              <div className="step-num">03</div>
              <h4>Verification</h4>
              <p>Final quality check and cleanup of the workspace.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ServiceDetail;

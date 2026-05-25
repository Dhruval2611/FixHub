import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ProviderProfile.css';

const ProviderProfile = () => {
  const { providerId } = useParams();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        // Fetch provider details
        const providerResponse = await axios.get(`http://localhost:5000/api/providers/${providerId}`);
        setProvider(providerResponse.data);

        // Fetch provider's services
        const servicesResponse = await axios.get(`http://localhost:5000/api/services/provider/${providerId}`);
        setServices(servicesResponse.data);

        // Fetch provider reviews
        const reviewsResponse = await axios.get(`http://localhost:5000/api/reviews/provider/${providerId}`);
        setReviews(reviewsResponse.data);
      } catch (error) {
        console.error('Error fetching provider data:', error);
        // For demo purposes, show sample data
        setProvider({
          _id: providerId,
          name: 'Rajesh Kumar',
          businessName: 'RK Home Services',
          rating: 4.8,
          totalReviews: 156,
          experience: '8 years',
          specialization: ['Home Cleaning', 'Electrical', 'Plumbing'],
          location: 'Delhi, India',
          phone: '+91 9876543210',
          email: 'rajesh@rkservices.com',
          description: 'Professional home service provider with 8+ years of experience. We provide reliable and affordable services for all your home maintenance needs.',
          certifications: ['Licensed Electrician', 'Certified Plumber', 'Home Service Certified'],
          workingHours: 'Mon-Sat: 9AM-7PM',
          responseTime: '< 2 hours',
          completedJobs: 450,
          profileImage: '👨‍🔧'
        });

        setServices([
          { _id: '1', name: 'Home Cleaning', price: 800, rating: 4.9 },
          { _id: '2', name: 'Electrical Repair', price: 500, rating: 4.7 },
          { _id: '3', name: 'Plumbing Service', price: 600, rating: 4.8 }
        ]);

        setReviews([
          {
            _id: '1',
            customerName: 'Priya Sharma',
            rating: 5,
            comment: 'Excellent service! Rajesh was professional and completed the work on time.',
            date: '2024-01-15',
            service: 'Home Cleaning'
          },
          {
            _id: '2',
            customerName: 'Amit Patel',
            rating: 4,
            comment: 'Good work, but arrived 30 minutes late. Overall satisfied.',
            date: '2024-01-10',
            service: 'Electrical Repair'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [providerId]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }

    return stars;
  };

  if (loading) {
    return <div className="provider-loading">Loading provider profile...</div>;
  }

  if (!provider) {
    return <div className="provider-error">Provider not found</div>;
  }

  return (
    <div className="provider-profile">
      {/* Provider Header */}
      <div className="provider-header">
        <div className="provider-avatar">
          <span className="avatar-emoji">{provider.profileImage || '👨‍🔧'}</span>
        </div>
        <div className="provider-info">
          <h1>{provider.name}</h1>
          <p className="business-name">{provider.businessName}</p>
          <div className="rating-summary">
            <div className="stars">{renderStars(provider.rating)}</div>
            <span className="rating-number">{provider.rating}</span>
            <span className="review-count">({provider.totalReviews || reviews.length} reviews)</span>
          </div>
          <div className="provider-meta">
            <span className="meta-item">📍 {provider.location}</span>
            <span className="meta-item">⏰ {provider.experience} experience</span>
            <span className="meta-item">✅ {provider.completedJobs || 0} jobs completed</span>
          </div>
        </div>
        <div className="provider-actions">
          <button className="contact-btn">📞 Contact Provider</button>
          <button className="favorite-btn">❤️ Save Provider</button>
        </div>
      </div>

      {/* Provider Details */}
      <div className="provider-details">
        <div className="details-grid">
          <div className="detail-card">
            <h3>About</h3>
            <p>{provider.description}</p>
          </div>

          <div className="detail-card">
            <h3>Specializations</h3>
            <div className="specializations">
              {provider.specialization?.map((spec, index) => (
                <span key={index} className="specialization-tag">{spec}</span>
              ))}
            </div>
          </div>

          <div className="detail-card">
            <h3>Service Details</h3>
            <div className="service-details">
              <p><strong>Working Hours:</strong> {provider.workingHours}</p>
              <p><strong>Response Time:</strong> {provider.responseTime}</p>
              <p><strong>Phone:</strong> {provider.phone}</p>
              <p><strong>Email:</strong> {provider.email}</p>
            </div>
          </div>

          <div className="detail-card">
            <h3>Certifications</h3>
            <div className="certifications">
              {provider.certifications?.map((cert, index) => (
                <div key={index} className="certification-item">
                  <span className="cert-icon">🏆</span>
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services Offered */}
      <div className="provider-services">
        <h2>Services Offered</h2>
        <div className="services-grid">
          {services.map(service => (
            <div key={service._id} className="service-item">
              <h4>{service.name}</h4>
              <div className="service-rating">
                {renderStars(service.rating)}
                <span>({service.rating})</span>
              </div>
              <div className="service-price">₹{service.price} onwards</div>
              <button className="book-service-btn">Book Now</button>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="provider-reviews">
        <h2>Customer Reviews ({reviews.length})</h2>
        <div className="reviews-list">
          {reviews.map(review => (
            <div key={review._id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-name">{review.customerName}</span>
                  <span className="review-service">{review.service}</span>
                </div>
                <div className="review-rating">
                  {renderStars(review.rating)}
                  <span className="review-date">{new Date(review.date).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="review-comment">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;

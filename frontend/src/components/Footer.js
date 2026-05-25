import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faInstagram, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section about">
                        <h3>FixHub</h3>
                        <p>
                            FixHub is your one-stop solution for all home and car maintenance needs.
                            We connect you with verified professionals for quality service.
                        </p>
                    </div>

                    <div className="footer-section links">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/services">Services</Link></li>
                            <li><Link to="/login">Login</Link></li>
                            <li><Link to="/register">Register</Link></li>
                        </ul>
                    </div>

                    <div className="footer-section contact">
                        <h3>Contact Us</h3>
                        <div className="contact-item">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="footer-icon" />
                            <span>123 Service Street, Tech City</span>
                        </div>
                        <div className="contact-item">
                            <FontAwesomeIcon icon={faPhone} className="footer-icon" />
                            <span>+1 (555) 123-4567</span>
                        </div>
                        <div className="contact-item">
                            <FontAwesomeIcon icon={faEnvelope} className="footer-icon" />
                            <span>support@fixhub.com</span>
                        </div>
                    </div>

                    <div className="footer-section social">
                        <h3>Follow Us</h3>
                        <div className="social-icons">
                            <a href="#" className="social-link"><FontAwesomeIcon icon={faFacebook} /></a>
                            <a href="#" className="social-link"><FontAwesomeIcon icon={faTwitter} /></a>
                            <a href="#" className="social-link"><FontAwesomeIcon icon={faInstagram} /></a>
                            <a href="#" className="social-link"><FontAwesomeIcon icon={faLinkedin} /></a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} FixHub. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

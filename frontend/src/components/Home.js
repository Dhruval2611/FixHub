import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBroom, faBolt, faWrench, faPaintRoller, faBug, faSpa,
    faShieldHalved, faUserCheck, faGem, faMobileScreen,
    faPaperPlane, faComment, faCar, faHouse, faLock
} from '@fortawesome/free-solid-svg-icons';
import { faGooglePlay, faApple } from '@fortawesome/free-brands-svg-icons';
import SplitText from './SplitText';
import CircularText from './CircularText';
import CountUp from './CountUp';
// import SplashCursor from './SplashCursor';
import InfiniteLoop from './InfiniteLoop';
import BorderGlow from './BorderGlow';
import './Home.css';

const Home = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [queryForm, setQueryForm] = useState({ subject: '', message: '' });
    const [queryStatus, setQueryStatus] = useState({ type: '', message: '' });
    const [isSending, setIsSending] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const isLoggedIn = !!localStorage.getItem('token');

    const handleQueryChange = (e) => {
        const { name, value } = e.target;
        setQueryForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
        if (queryStatus.message) setQueryStatus({ type: '', message: '' });
    };

    const handleQuerySubmit = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!queryForm.subject.trim()) errors.subject = 'Subject is required';
        if (!queryForm.message.trim()) errors.message = 'Message is required';
        else if (queryForm.message.trim().length < 10) errors.message = 'At least 10 characters';
        if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
        if (isSending) return;

        setIsSending(true);
        setQueryStatus({ type: '', message: '' });
        setFormErrors({});

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/contact/send', queryForm, {
                headers: { 'x-auth-token': token }
            });
            setQueryStatus({ type: 'success', message: response.data.message });
            setQueryForm({ subject: '', message: '' });
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to send. Please try again.';
            setQueryStatus({ type: 'error', message: errorMessage });
        } finally {
            setIsSending(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/services');
                setServices(res.data.slice(0, 6));
            } catch (err) {
                setServices([
                    { _id: '1', name: 'Home Cleaning', price: 999, rating: 4.9, category: 'Home Services', description: 'Professional deep cleaning solutions' },
                    { _id: '2', name: 'Car Wash', price: 599, rating: 4.8, category: 'Car Services', description: 'Premium car wash and detailing' },
                    { _id: '3', name: 'Plumbing', price: 399, rating: 4.7, category: 'Home Services', description: 'Expert repairs & installations' },
                    { _id: '4', name: 'Painting', price: 1299, rating: 4.6, category: 'Home Services', description: 'Premium interior & exterior painting' },
                    { _id: '5', name: 'Pest Control', price: 799, rating: 4.8, category: 'Home Services', description: 'Safe & effective pest treatments' },
                    { _id: '6', name: 'Detailing', price: 499, rating: 4.9, category: 'Car Services', description: 'Complete interior & exterior detailing' }
                ]);
            } finally {
                setLoading(false);
            }
        };
        loadData();

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        const sections = document.querySelectorAll('.categories-section, .features, .app-promo, .newsletter, .cta-section');
        sections.forEach(section => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="home">
            {/* <SplashCursor /> */}

            {/* HERO SECTION */}
            <section className="hero">
                <div className="hero-content container">
                    <div className="circular-text-wrapper">
                        <CircularText
                            text="FIXHUB  ⬡  FIXHUB  ⬡  FIXHUB  ⬡  FIXHUB  ⬡  FIXHUB  ⬡  "
                            spinDuration={15}
                            onHover="speedUp"
                            className="hero-circular-text"
                        />
                    </div>
                    <SplitText
                        text="PREMIUM SERVICE EXCELLENCE"
                        tag="h1"
                        splitType="chars"
                        delay={30}
                        duration={0.8}
                        ease="power3.out"
                        from={{ opacity: 0, y: 50, rotationX: -90 }}
                        to={{ opacity: 1, y: 0, rotationX: 0 }}
                        threshold={0.3}
                        rootMargin="0px"
                        textAlign="center"
                    />
                    <p>Exceptional professionals delivering unparalleled quality to your doorstep</p>
                </div>

                <div className="stats-bar container">
                    <div className="stat-item">
                        <h2>
                            <CountUp
                                from={0}
                                to={15}
                                separator=","
                                direction="up"
                                duration={1.5}
                                className="count-up-text"
                            />
                            K+
                        </h2>
                        <p>Clients</p>
                    </div>
                    <div className="stat-item">
                        <h2>
                            <CountUp
                                from={0}
                                to={500}
                                separator=","
                                direction="up"
                                duration={1.5}
                                className="count-up-text"
                            />
                            +
                        </h2>
                        <p>Experts</p>
                    </div>
                    <div className="stat-item">
                        <h2>
                            <CountUp
                                from={0}
                                to={4.9}
                                separator=","
                                direction="up"
                                duration={1.5}
                                className="count-up-text"
                            />
                            /5
                        </h2>
                        <p>Rating</p>
                    </div>
                    <div className="stat-item">
                        <h2>
                            <CountUp
                                from={0}
                                to={24}
                                separator=","
                                direction="up"
                                duration={1.5}
                                className="count-up-text"
                            />
                            /7
                        </h2>
                        <p>Support</p>
                    </div>
                </div>
            </section>

            {/* SERVICES */}
            {/* SERVICES */}
            <section className="categories-section">
                <div className="container" style={{ overflow: 'hidden' }}>
                    <div className="section-header">
                        <h2 className="section-title">Our Services</h2>
                    </div>

                    <InfiniteLoop
                        items={services}
                        speed={60} // Adjust speed as needed
                        direction="left"
                        gap={20}
                        pauseOnHover={true}
                        renderItem={(service) => (
                            <Link to={`/services`} className="category-card service-card-loop" key={service._id}>
                                <div className="icon-container">
                                    <FontAwesomeIcon icon={
                                        service.category === 'Home Services' ? faHouse :
                                            service.category === 'Car Services' ? faCar :
                                                service.category === 'Cleaning' ? faBroom :
                                                    service.category === 'Electrical' ? faBolt :
                                                        service.category === 'Plumbing' ? faWrench :
                                                            service.category === 'Painting' ? faPaintRoller :
                                                                service.category === 'Pest Control' ? faBug :
                                                                    faSpa
                                    } className="category-icon" />
                                </div>
                                <h3>{service.name}</h3>
                                <p>{service.description || 'Premium service satisfaction guaranteed.'}</p>
                            </Link>
                        )}
                        className="services-loop"
                    />
                </div>
            </section>

            {/* FEATURES */}
            <section className="features features-glow-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Why Choose Us</h2>
                    </div>
                    <div className="features-grid">
                        <BorderGlow
                            edgeSensitivity={25}
                            glowColor="40 80 75"
                            backgroundColor="#1C1917"
                            borderRadius={20}
                            glowRadius={35}
                            glowIntensity={1.2}
                            coneSpread={30}
                            animated={false}
                            colors={['#D4AF37', '#F5D680', '#B8860B']}
                        >
                            <div className="feature-box feature-box-glow">
                                <div className="feature-icon-wrapper">
                                    <FontAwesomeIcon icon={faShieldHalved} className="feature-icon" />
                                </div>
                                <h3>Fully Insured</h3>
                                <p>Comprehensive coverage ensuring complete protection for your property and peace of mind.</p>
                            </div>
                        </BorderGlow>
                        <BorderGlow
                            edgeSensitivity={25}
                            glowColor="220 70 70"
                            backgroundColor="#1C1917"
                            borderRadius={20}
                            glowRadius={35}
                            glowIntensity={1.2}
                            coneSpread={30}
                            animated={false}
                            colors={['#38bdf8', '#818cf8', '#c084fc']}
                        >
                            <div className="feature-box feature-box-glow">
                                <div className="feature-icon-wrapper">
                                    <FontAwesomeIcon icon={faUserCheck} className="feature-icon" />
                                </div>
                                <h3>Verified Experts</h3>
                                <p>Rigorously vetted professionals with proven credentials and exceptional track records.</p>
                            </div>
                        </BorderGlow>
                        <BorderGlow
                            edgeSensitivity={25}
                            glowColor="340 75 70"
                            backgroundColor="#1C1917"
                            borderRadius={20}
                            glowRadius={35}
                            glowIntensity={1.2}
                            coneSpread={30}
                            animated={false}
                            colors={['#f472b6', '#fb923c', '#facc15']}
                        >
                            <div className="feature-box feature-box-glow">
                                <div className="feature-icon-wrapper">
                                    <FontAwesomeIcon icon={faGem} className="feature-icon" />
                                </div>
                                <h3>Quality Guaranteed</h3>
                                <p>100% satisfaction promise with complimentary re-service if expectations aren't exceeded.</p>
                            </div>
                        </BorderGlow>
                    </div>
                </div>
            </section>

            {/* BENTO GRID: App, Newsletter, CTA */}
            <section className="bottom-grid-section">
                <div className="container">
                    <div className="bento-grid">

                        {/* 1. App Promo Card (Large Left) */}
                        <div className="bento-card app-card">
                            <div className="bento-content">
                                <span className="bento-tag">Mobile Experience</span>
                                <h2>Download<br />The App</h2>
                                <p>Seamless booking, live tracking, and exclusive premium offers at your fingertips.</p>
                                <div className="app-buttons">
                                    <button className="store-btn dark-btn" onClick={() => toast.info('Our Android app is currently in development. We’ll notify you when it’s live.', { icon: false })}>
                                        <FontAwesomeIcon icon={faGooglePlay} className="store-icon" />
                                        <div className="store-text">
                                            <span>GET IT ON</span>
                                            <strong>Google Play</strong>
                                        </div>
                                    </button>
                                    <button className="store-btn dark-btn" onClick={() => toast.info('Our iOS app is currently in development. We’ll notify you when it’s live.', { icon: false })}>
                                        <FontAwesomeIcon icon={faApple} className="store-icon" />
                                        <div className="store-text">
                                            <span>Download on the</span>
                                            <strong>App Store</strong>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            <div className="app-gradient-overlay"></div>
                        </div>

                        {/* 2. Newsletter Card (Top Right) */}
                        <div className="bento-card newsletter">
                            <div className="bento-content">
                                <span className="bento-tag">Updates</span>
                                <h2>Join Our<br />Newsletter</h2>
                                <p>Get exclusive premium offers and expert maintenance tips delivered to you.</p>
                                <form className="newsletter-form-compact" onSubmit={(e) => {
                                    e.preventDefault();
                                    const email = e.target.email.value;
                                    if (email) {
                                        axios.post('http://localhost:5000/api/newsletter/subscribe', { email })
                                            .then(() => {
                                                toast.success('Subscribed successfully!');
                                                e.target.reset();
                                            })
                                            .catch((err) => toast.error(err.response?.data?.message || 'Subscription failed.'));
                                    }
                                }}>
                                    <div className="input-group">
                                        <FontAwesomeIcon icon={faPaperPlane} className="input-icon" />
                                        <input type="email" name="email" placeholder="Email address" required />
                                    </div>
                                    <button type="submit" className="subscribe-btn">Subscribe</button>
                                </form>
                            </div>
                        </div>

                        {/* 3. Query Card (Top Right - Row 2) */}
                        <div className="bento-card contact-card">
                            <div className="bento-content">
                                <span className="bento-tag">Support</span>
                                <h2>Raise a Query</h2>
                                {isLoggedIn ? (
                                    <>
                                        <form className="contact-form-compact" onSubmit={handleQuerySubmit}>
                                            <div className={`input-group ${formErrors.subject ? 'input-error' : ''}`}>
                                                <FontAwesomeIcon icon={faComment} className="input-icon" />
                                                <input
                                                    type="text"
                                                    name="subject"
                                                    placeholder="Subject"
                                                    value={queryForm.subject}
                                                    onChange={handleQueryChange}
                                                    disabled={isSending}
                                                />
                                            </div>
                                            {formErrors.subject && <span className="field-error">{formErrors.subject}</span>}
                                            <div className={`input-group textarea-group ${formErrors.message ? 'input-error' : ''}`}>
                                                <textarea
                                                    name="message"
                                                    placeholder="Describe your issue or question..."
                                                    value={queryForm.message}
                                                    onChange={handleQueryChange}
                                                    disabled={isSending}
                                                    rows="3"
                                                />
                                            </div>
                                            {formErrors.message && <span className="field-error">{formErrors.message}</span>}
                                            <button type="submit" className="send-btn" disabled={isSending}>
                                                <FontAwesomeIcon icon={faPaperPlane} className="send-icon" />
                                                {isSending ? 'Submitting...' : 'Submit Query'}
                                            </button>
                                        </form>
                                        {queryStatus.message && (
                                            <p className={`contact-status ${queryStatus.type}`}>
                                                {queryStatus.message}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="query-login-prompt">
                                        <FontAwesomeIcon icon={faLock} className="lock-icon" />
                                        <p>Please log in to raise a query with our team.</p>
                                        <Link to="/login" className="query-login-btn">Log In</Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. CTA Card (Bottom Right) */}
                        <div className="bento-card cta-card">
                            <div className="bento-content">
                                <span className="bento-tag">Get Started</span>
                                <h2>Ready to upgrade your lifestyle?</h2>
                                <p>Book the industry's highest-certifed professionals today and experience unparalleled peace of mind.</p>
                                <Link to="/services" className="cta-button-featured">
                                    Book Premium Service
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
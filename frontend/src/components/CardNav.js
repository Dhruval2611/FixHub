import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { useCart } from './CartContext';
import './CardNav.css';

const CardNav = ({ user, setUser }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { getCartItemCount } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    if (isExpanded) {
      const tl = tlRef.current;
      if (tl) {
        tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
        tl.reverse();
      }
    }
  }, [location.pathname]);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 300;
    const contentEl = navEl.querySelector('.card-nav-content');
    if (contentEl) {
      const wasVis = contentEl.style.visibility;
      const wasPos = contentEl.style.position;
      const wasH = contentEl.style.height;
      contentEl.style.visibility = 'hidden';
      contentEl.style.position = 'static';
      contentEl.style.height = 'auto';
      contentEl.offsetHeight;
      const topBar = 56;
      const padding = 20;
      const contentHeight = contentEl.scrollHeight;
      contentEl.style.visibility = wasVis;
      contentEl.style.position = wasPos;
      contentEl.style.height = wasH;
      return topBar + contentHeight + padding;
    }
    return 300;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;
    gsap.set(navEl, { height: 56, overflow: 'hidden' });
    gsap.set(cardsRef.current.filter(Boolean), { y: 40, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.45, ease: 'power3.out' });
    tl.to(cardsRef.current.filter(Boolean), { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.06 }, '-=0.15');
    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => { tl?.kill(); tlRef.current = null; };
  }, [user]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) { newTl.progress(1); tlRef.current = newTl; }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) tlRef.current = newTl;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsExpanded(true);
      tl.play(0);
    } else {
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = i => el => { if (el) cardsRef.current[i] = el; };

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (!confirmed) return;
    localStorage.removeItem('token');
    localStorage.removeItem('fixhub_cart');
    setUser(null);
    navigate('/');
  };

  // Navigation card items
  const navItems = [
    {
      label: 'Browse',
      bgColor: '#111827',
      textColor: '#fff',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/services' },
        { label: 'Pricing', href: '/pricing' },
      ]
    },
    ...(user ? [{
      label: 'Account',
      bgColor: '#F9FAFB',
      textColor: '#111827',
      links: [
        { label: 'Settings', href: '/account-settings' },
        { label: 'Bookings', href: '/your-bookings' },
        { label: 'Support', href: '/get-support' },
      ]
    }] : [{
      label: 'Get Started',
      bgColor: '#F9FAFB',
      textColor: '#111827',
      links: [
        { label: 'Login', href: '/login' },
        { label: 'Register', href: '/register' },
      ]
    }]),
  ];

  return (
    <div className={`card-nav-container ${isScrolled ? 'scrolled' : ''}`}>
      {/* Backdrop */}
      {isExpanded && <div className="card-nav-backdrop" onClick={toggleMenu} />}

      <nav ref={navRef} className={`card-nav ${isExpanded ? 'open' : ''}`}>
        <div className="card-nav-top">
          {/* Hamburger */}
          <div
            className={`card-hamburger ${isExpanded ? 'open' : ''}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
          >
            <div className="card-hamburger-line" />
            <div className="card-hamburger-line" />
          </div>

          {/* Logo */}
          <Link to="/" className="card-nav-logo" onClick={() => isExpanded && toggleMenu()}>
            F<span className="card-logo-i">
              <span className="card-i-body">ı</span>
              <FontAwesomeIcon icon={faGear} className="card-i-gear" />
            </span>xHub
          </Link>

          {/* Right actions */}
          <div className="card-nav-actions">
            <div className="card-nav-cart" onClick={() => navigate('/cart')}>
              <FontAwesomeIcon icon={faShoppingCart} />
              {user && getCartItemCount() > 0 && (
                <span className="card-nav-cart-count">{getCartItemCount()}</span>
              )}
            </div>
          </div>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {navItems.map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <Link
                    key={`${lnk.label}-${i}`}
                    className={`nav-card-link ${location.pathname === lnk.href ? 'active' : ''}`}
                    to={lnk.href}
                    onClick={toggleMenu}
                    style={{ color: item.textColor }}
                  >
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {lnk.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Logout card */}
          {user && (
            <div
              className="nav-card nav-card-logout"
              ref={setCardRef(navItems.length)}
            >
              <button className="card-nav-logout-btn" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;

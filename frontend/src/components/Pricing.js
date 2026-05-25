import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheck, faStar, faCrown, faRocket, faShieldHalved,
    faHeadset, faBolt, faGem
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { toast } from 'react-toastify';
import PlanUpgradeModal from './PlanUpgradeModal';
import './Pricing.css';

const Pricing = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [upgradePriceData, setUpgradePriceData] = useState(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [isYearly, setIsYearly] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const response = await axios.get('http://localhost:5000/api/auth/me', {
                    headers: { 'x-auth-token': token }
                });
                setCurrentUser(response.data);
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };
        fetchUser();
    }, []);

    const handlePlanSelect = async (planDef) => {
        const token = localStorage.getItem('token');

        if (!token) {
            toast.info('Please login to purchase a plan');
            navigate('/login');
            return;
        }

        const planApiName = planDef.apiName || planDef.name;

        // Don't open modal for Basic (free plan)
        if (planDef.name === 'Basic') {
            toast.info('You are already on the Basic plan — it\'s free!');
            return;
        }

        try {
            const userResponse = await axios.get('http://localhost:5000/api/auth/me', {
                headers: { 'x-auth-token': token }
            });
            const userData = userResponse.data;

            const currentSub = userData?.subscription;
            if (currentSub?.planStatus === 'active') {
                const currentName = currentSub.planName;
                
                if (currentName === planApiName) {
                    toast.info(`You're already subscribed to the ${planDef.name} plan!`);
                    return;
                }
                
                // Block downgrading from Elite to Premium
                if (currentName.startsWith('Elite') && planApiName.startsWith('Premium')) {
                    toast.error(`You have already subscribed to the ${currentName} plan`);
                    return;
                }
                
                // Block downgrading from Yearly to Monthly
                if (currentName.endsWith('Yearly') && !planApiName.endsWith('Yearly')) {
                    toast.error(`You have already subscribed to the ${currentName} plan`);
                    return;
                }
            }

            // Fetch plan pricing
            const planResponse = await axios.get(`http://localhost:5000/api/subscriptions/plan/${planApiName}`);
            const planData = planResponse.data.plan;

            setCurrentUser(userData);
            setSelectedPlan(planApiName);
            setUpgradePriceData({
                upgradePrice: planData.price,
                originalPrice: planData.originalPrice || planData.price,
                isFirstTime: !userData.hasUsedTrial
            });
            setShowUpgradeModal(true);
        } catch (error) {
            console.error('Error opening plan modal:', error);
            toast.error('Failed to load plan details. Please try again.');
        }
    };

    const handleRequestOtp = async () => {
        const token = localStorage.getItem('token');
        await axios.post(
            'http://localhost:5000/api/subscriptions/request-otp',
            { action: 'purchase', planName: selectedPlan },
            { headers: { 'x-auth-token': token } }
        );
    };

    const handleConfirmUpgrade = async (otp) => {
        const token = localStorage.getItem('token');
        setProcessingPayment(true);
        try {
            // Pre-check: Verify OTP before processing payment
            await axios.post(
                'http://localhost:5000/api/subscriptions/verify-otp',
                { otp },
                { headers: { 'x-auth-token': token } }
            );

            // Initiate payment record
            const { data: initiated } = await axios.post(
                'http://localhost:5000/api/payments/initiate',
                {
                    amount: upgradePriceData?.upgradePrice,
                    paymentMethod: 'Plan Purchase',
                    customerInfo: { name: currentUser?.name, email: currentUser?.email }
                },
                { headers: { 'x-auth-token': token } }
            );

            await axios.post(
                'http://localhost:5000/api/payments/process',
                { paymentId: initiated.paymentId, success: true },
                { headers: { 'x-auth-token': token } }
            );

            // Purchase with OTP verification
            const res = await axios.post(
                'http://localhost:5000/api/subscriptions/purchase',
                {
                    planName: selectedPlan,
                    paymentId: initiated.paymentId,
                    planType: currentUser?.subscription?.planName !== 'Basic' ? 'upgrade' : 'new',
                    otp,
                },
                { headers: { 'x-auth-token': token } }
            );

            toast.success(res.data.message || `${selectedPlan} plan activated!`);
            setShowUpgradeModal(false);
            // Refresh user data
            const updated = await axios.get('http://localhost:5000/api/auth/me', { headers: { 'x-auth-token': token } });
            setCurrentUser(updated.data);
            setTimeout(() => navigate('/account-settings'), 1200);
        } catch (error) {
            console.error('Purchase error:', error);
            if (error.response?.data?.message && error.response.data.message.toLowerCase().includes('verification code')) {
                throw error; // Rethrow for modal inline display
            }
            toast.error(error.response?.data?.message || 'Purchase failed. Please try again.');
        } finally {
            setProcessingPayment(false);
        }
    };

    const plans = [
        {
            name: 'Basic',
            icon: faStar,
            price: '0',
            period: 'Free Forever',
            description: 'Perfect for trying out our services',
            features: [
                'Access to all basic services',
                'Standard booking priority',
                'Email support',
                'Service history tracking',
                'Basic warranty coverage'
            ],
            color: '#E0F2FE', // Light blue
            buttonText: 'Get Started',
            popular: false
        },
        {
            name: 'Premium',
            apiName: isYearly ? 'Premium Yearly' : 'Premium',
            icon: faCrown,
            price: isYearly ? '499' : '49',
            period: isYearly ? 'per year' : 'per month',
            description: 'Most popular for regular users',
            features: [
                'Everything in Basic',
                'Priority booking & scheduling',
                '15% discount on all services',
                '24/7 phone support',
                'Extended warranty coverage',
                'Free emergency callouts',
                'Dedicated account manager'
            ],
            color: '#F5E871', // Yellow accent
            buttonText: 'Choose Premium',
            popular: true
        },
        {
            name: 'Elite',
            apiName: isYearly ? 'Elite Yearly' : 'Elite',
            icon: faRocket,
            price: isYearly ? '999' : '99',
            period: isYearly ? 'per year' : 'per month',
            description: 'Ultimate experience for power users',
            features: [
                'Everything in Premium',
                'VIP priority service',
                '25% discount on all services',
                'Concierge support',
                'Lifetime warranty on all work',
                'Unlimited free emergency visits',
                'Personal service coordinator',
                'Exclusive access to new services'
            ],
            color: '#FCE7F3', // Light pink
            buttonText: 'Go Elite',
            popular: false
        }
    ];

    return (
        <>
        <div className="pricing-page">
            <section className="pricing-hero">
                <div className="container">
                    <h1 className="pricing-title">Simple, transparent pricing</h1>
                    <p className="pricing-subtitle">
                        Choose the perfect plan for your home service needs.
                    </p>
                    
                    <div className="pricing-controls-row">
                        {(!currentUser || !currentUser.hasUsedTrial) && (
                            <div className="trial-highlight">
                                All new subscribers get a 7-day free trial!
                            </div>
                        )}
                        
                        <div className="billing-segmented-control">
                            <button 
                                className={`segment-btn ${!isYearly ? 'active' : ''}`} 
                                onClick={() => setIsYearly(false)}
                            >
                                Monthly
                            </button>
                            <button 
                                className={`segment-btn ${isYearly ? 'active' : ''}`} 
                                onClick={() => setIsYearly(true)}
                            >
                                Yearly
                                <span className="save-badge">Save 15%</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pricing-cards-section">
                <div className="container">
                    <div className="pricing-grid">
                        {plans.map((plan, index) => (
                            <div
                                key={index}
                                className={`pricing-card ${plan.popular ? 'popular' : ''}`}
                                style={{ '--card-color': plan.color }}
                            >
                                {plan.popular && (
                                    <div className="popular-badge">
                                        <FontAwesomeIcon icon={faCrown} /> Most Popular
                                    </div>
                                )}

                                <div className="pricing-header">
                                    <div className="plan-icon-wrapper">
                                        <FontAwesomeIcon icon={plan.icon} className="plan-icon" />
                                    </div>
                                    <h3>{plan.name}</h3>
                                    <p className="plan-description">{plan.description}</p>
                                </div>

                                <div className="pricing-price">
                                    <span className="currency">₹</span>
                                    <span className="amount">{plan.price}</span>
                                    <span className="period">/{plan.period}</span>
                                </div>

                                <ul className="features-list">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx}>
                                            <FontAwesomeIcon icon={faCheck} className="check-icon" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className="pricing-button"
                                    onClick={() => handlePlanSelect(plan)}
                                    disabled={processingPayment}
                                >
                                    {processingPayment ? (
                                        <>
                                            <span className="spinner"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        plan.buttonText
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="pricing-trust">
                <div className="container">
                    <h2>Why Choose FixHub?</h2>
                    <div className="trust-grid">
                        <div className="trust-item">
                            <div className="trust-icon-wrapper">
                                <FontAwesomeIcon icon={faShieldHalved} className="trust-icon" />
                            </div>
                            <h3>Money-Back Guarantee</h3>
                            <p>Not satisfied? Get a full refund within 30 days, no questions asked.</p>
                        </div>
                        <div className="trust-item">
                            <div className="trust-icon-wrapper">
                                <FontAwesomeIcon icon={faHeadset} className="trust-icon" />
                            </div>
                            <h3>24/7 Support</h3>
                            <p>Our dedicated support team is always here to help you.</p>
                        </div>
                        <div className="trust-item">
                            <div className="trust-icon-wrapper">
                                <FontAwesomeIcon icon={faBolt} className="trust-icon" />
                            </div>
                            <h3>Instant Activation</h3>
                            <p>Start using your plan immediately after signup.</p>
                        </div>
                        <div className="trust-item">
                            <div className="trust-icon-wrapper">
                                <FontAwesomeIcon icon={faGem} className="trust-icon" />
                            </div>
                            <h3>Premium Quality</h3>
                            <p>All our professionals are verified and highly rated.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="pricing-faq">
                <div className="container">
                    <h2>Frequently Asked Questions</h2>
                    <div className="faq-grid">
                        <div className="faq-item">
                            <h3>Can I cancel anytime?</h3>
                            <p>Yes! You can cancel your subscription at any time with no penalties or hidden fees.</p>
                        </div>
                        <div className="faq-item">
                            <h3>What payment methods do you accept?</h3>
                            <p>We accept all major credit cards, debit cards, UPI, and digital wallets.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Can I upgrade or downgrade my plan?</h3>
                            <p>Absolutely! You can change your plan at any time from your account settings.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Is there a contract or commitment?</h3>
                            <p>No contracts required. Pay month-to-month and cancel whenever you want.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="pricing-cta">
                <div className="container">
                    <h2>Ready to Get Started?</h2>
                    <p>Join thousands of happy customers who trust FixHub for their home services</p>
                    <button 
                        className="cta-button"
                        onClick={() => handlePlanSelect('Premium')}
                        disabled={processingPayment}
                    >
                        {processingPayment ? 'Processing...' : 'Start Your Free Trial'}
                    </button>
                </div>
            </section>
        </div>

        {/* Plan Upgrade Modal */}
        {showUpgradeModal && selectedPlan && (
            <PlanUpgradeModal
                currentPlan={currentUser?.subscription?.planName || 'Basic'}
                targetPlan={selectedPlan}
                upgradePrice={upgradePriceData?.upgradePrice}
                originalPrice={upgradePriceData?.originalPrice}
                isFirstTime={upgradePriceData?.isFirstTime}
                onClose={() => setShowUpgradeModal(false)}
                onConfirm={handleConfirmUpgrade}
                loading={processingPayment}
                onRequestOtp={handleRequestOtp}
            />
        )}
        </>
    );
};

export default Pricing;

const Service = require('../models/Service');
const User = require('../models/User');

exports.getAllServices = async (req, res) => {
    try {
        let services = await Service.find();

        // Force re-seed if empty OR if we want to update (for development)
        if (services.length === 0 || process.env.FORCE_SEED === 'true') {
            if (services.length > 0) await Service.deleteMany({});
            const initialServices = [
                {
                    name: 'Home Cleaning',
                    category: 'Home Services',
                    description: 'Full home cleaning service including kitchen, bathrooms, and living areas.',
                    price: 1500,
                    icon: '🧹',
                    duration: '4-5 Hours',
                    inclusions: ['Kitchen Cleaning', 'Bathroom Deep Clean', 'Floor Mopping', 'Dusting'],
                    highlights: ['Eco-friendly chemicals', 'Background verified staff', 'Equipment included']
                },
                {
                    name: 'AC Repair',
                    category: 'Home Services',
                    description: 'Expert AC repair and maintenance service.',
                    price: 500,
                    icon: '❄️',
                    duration: '1-2 Hours',
                    inclusions: ['Gas Leak Check', 'Filter Cleaning', 'Performance Check'],
                    highlights: ['30-day warranty', 'Certified technicians']
                },
                {
                    name: 'Plumbing',
                    category: 'Home Services',
                    description: 'Fixing leaks, installing pipes, and other plumbing needs.',
                    price: 350,
                    icon: '🔧',
                    duration: 'Varies',
                    inclusions: ['Leak Detection', 'Pipe Repair', 'Tap Installation'],
                    highlights: ['Quick response', 'Standardized pricing']
                },
                {
                    name: 'Electrician',
                    category: 'Home Services',
                    description: 'Wiring repair, switch installation, and electrical troubleshooting.',
                    price: 300,
                    icon: '⚡',
                    duration: '1-2 Hours',
                    inclusions: ['Wiring Check', 'Switch Replacement', 'Fault Detection'],
                    highlights: ['Licensed electricians', 'Safety first approach']
                },
                {
                    name: 'Pest Control',
                    category: 'Home Services',
                    description: 'Complete pest control treatment for cockroaches, ants, and termites.',
                    price: 1200,
                    icon: '🐛',
                    duration: '2-3 Hours',
                    inclusions: ['Full Inspection', 'Chemical Treatment', 'Follow-up Visit'],
                    highlights: ['Safe chemicals', '90-day warranty', 'Odorless treatment']
                },
                {
                    name: 'Painting',
                    category: 'Home Services',
                    description: 'Interior and exterior wall painting with premium paints.',
                    price: 3500,
                    icon: '🎨',
                    duration: '1-2 Days',
                    inclusions: ['Wall Preparation', 'Primer Coat', 'Two Finish Coats', 'Cleanup'],
                    highlights: ['Branded paints', 'Color consultation', 'Clean finish']
                },
                {
                    name: 'Bathroom Cleaning',
                    category: 'Home Services',
                    description: 'Deep cleaning of bathroom tiles, fixtures, and fittings.',
                    price: 600,
                    icon: '🚿',
                    duration: '1-2 Hours',
                    inclusions: ['Tile Scrubbing', 'Fixture Polish', 'Drain Cleaning'],
                    highlights: ['Anti-bacterial treatment', 'Stain removal']
                },
                {
                    name: 'Appliance Repair',
                    category: 'Home Services',
                    description: 'Repair service for washing machines, refrigerators, and other home appliances.',
                    price: 450,
                    icon: '🔌',
                    duration: '1-3 Hours',
                    inclusions: ['Diagnosis', 'Part Replacement', 'Testing'],
                    highlights: ['Multi-brand expertise', 'Genuine spare parts']
                },
                {
                    name: 'Garden Maintenance',
                    category: 'Home Services',
                    description: 'Lawn mowing, plant trimming, and garden upkeep.',
                    price: 800,
                    icon: '🌿',
                    duration: '2-3 Hours',
                    inclusions: ['Lawn Mowing', 'Hedge Trimming', 'Weeding', 'Watering'],
                    highlights: ['Professional gardeners', 'Monthly plans available']
                },
                {
                    name: 'Car Wash',
                    category: 'Car Services',
                    description: 'Exterior wash and interior vacuuming.',
                    price: 400,
                    icon: '🚗',
                    duration: '45 Mins',
                    inclusions: ['Pressure Wash', 'Vacuuming', 'Dashboard Polish'],
                    highlights: ['Premium shampoo used', 'Doorstep service']
                },
                {
                    name: 'Oil Change',
                    category: 'Car Services',
                    description: 'Full synthetic oil change and filter replacement.',
                    price: 2500,
                    icon: '🛢️',
                    duration: '1 Hour',
                    inclusions: ['Synthetic Oil', 'New Filter', 'Multi-point Check'],
                    highlights: ['Quality guarantee', 'Disposal included']
                },
                {
                    name: 'Car Detailing',
                    category: 'Car Services',
                    description: 'Complete interior and exterior detailing for a showroom finish.',
                    price: 3000,
                    icon: '✨',
                    duration: '3-4 Hours',
                    inclusions: ['Exterior Polish', 'Interior Shampoo', 'Engine Bay Clean', 'Wax Coating'],
                    highlights: ['Premium products', 'Scratch removal', 'Ceramic option']
                },
                {
                    name: 'Tyre Replacement',
                    category: 'Car Services',
                    description: 'Tyre fitting, balancing, and alignment service.',
                    price: 1800,
                    icon: '🛞',
                    duration: '1-2 Hours',
                    inclusions: ['Tyre Fitting', 'Wheel Balancing', 'Alignment Check'],
                    highlights: ['All brands available', 'Roadside assistance']
                },
                {
                    name: 'Car AC Service',
                    category: 'Car Services',
                    description: 'Complete car AC gas refill, leak check, and cooling performance tune-up.',
                    price: 1500,
                    icon: '❄️',
                    duration: '1-2 Hours',
                    inclusions: ['Gas Refill', 'Leak Detection', 'Cooling Check', 'Filter Clean'],
                    highlights: ['OEM-grade refrigerant', 'Cooling guarantee']
                },
                {
                    name: 'Battery Replacement',
                    category: 'Car Services',
                    description: 'Car battery testing, replacement, and terminal cleaning.',
                    price: 3500,
                    icon: '🔋',
                    duration: '30-45 Mins',
                    inclusions: ['Battery Test', 'New Battery', 'Terminal Cleaning', 'Old Battery Pickup'],
                    highlights: ['Warranty included', 'Doorstep service', 'All car brands']
                }
            ];

            services = await Service.insertMany(initialServices);
            console.log('Seeded initial services');
        }

        // Get user's discount if authenticated
        let discountPercentage = 0;
        let planName = 'Basic';
        
        if (req.user && req.user.id) {
            const user = await User.findById(req.user.id);
            
            if (user && user.subscription) {
                // Check if subscription is still active
                const now = new Date();
                const isStatusActive = user.subscription.planStatus === 'active';
                const isNotExpired = !user.subscription.planExpiryDate || now <= user.subscription.planExpiryDate;
                
                if (isStatusActive && isNotExpired) {
                    discountPercentage = user.subscription.planName === 'Premium' ? 15 : 
                                        user.subscription.planName === 'Elite' ? 25 : 0;
                    planName = user.subscription.planName;
                }
            }
        }

        // Apply discount to service prices
        const servicesWithDiscount = services.map(service => {
            const originalPrice = service.price;
            const discountedPrice = originalPrice - (originalPrice * discountPercentage / 100);
            
            return {
                ...service.toObject(),
                originalPrice,
                price: Math.round(discountedPrice),
                discountPercentage,
                planName,
                hasDiscount: discountPercentage > 0
            };
        });

        res.json({
            success: true,
            services: servicesWithDiscount,
            userPlan: planName,
            discountApplied: discountPercentage
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Get user's discount if authenticated
        let discountPercentage = 0;
        let planName = 'Basic';
        
        if (req.user && req.user.id) {
            const user = await User.findById(req.user.id);
            
            if (user && user.subscription) {
                // Check if subscription is still active
                const now = new Date();
                const isStatusActive = user.subscription.planStatus === 'active';
                const isNotExpired = !user.subscription.planExpiryDate || now <= user.subscription.planExpiryDate;
                
                if (isStatusActive && isNotExpired) {
                    discountPercentage = user.subscription.planName === 'Premium' ? 15 : 
                                        user.subscription.planName === 'Elite' ? 25 : 0;
                    planName = user.subscription.planName;
                }
            }
        }

        const originalPrice = service.price;
        const discountedPrice = originalPrice - (originalPrice * discountPercentage / 100);

        res.json({
            success: true,
            service: {
                ...service.toObject(),
                originalPrice,
                price: Math.round(discountedPrice),
                discountPercentage,
                planName,
                hasDiscount: discountPercentage > 0
            }
        });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

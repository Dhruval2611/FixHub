const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Service = require('../models/Service');

const SERVICES = [
  // ── Electrician ──
  {
    name: 'Fan Installation & Repair',
    description: 'Expert installation and repair of ceiling fans, exhaust fans, and table fans. Includes wiring check and speed regulator setup.',
    price: 349,
    category: 'Electrician',
    duration: '1-2 Hours',
    inclusions: ['Fan mounting', 'Wiring inspection', 'Speed regulator check', 'Cleanup'],
    highlights: ['Certified electricians', 'Same-day service', '30-day warranty'],
  },
  {
    name: 'Light & Lamp Fixing',
    description: 'Installation and repair of all types of lights — LED panels, chandeliers, tube lights, and decorative lamps.',
    price: 249,
    category: 'Electrician',
    duration: '30-60 Mins',
    inclusions: ['Light mounting', 'Switch wiring', 'Dimmer setup', 'Bulb replacement'],
    highlights: ['All light types covered', 'Clean installation', 'Safety tested'],
  },
  {
    name: 'Switchboard & Socket Repair',
    description: 'Repair and replacement of faulty switchboards, sockets, MCBs, and modular fittings for safe electrical operation.',
    price: 299,
    category: 'Electrician',
    duration: '30-60 Mins',
    inclusions: ['Board inspection', 'Switch replacement', 'MCB check', 'Earthing test'],
    highlights: ['ISI-certified parts', 'Fire-safety compliant', 'Quick turnaround'],
  },
  {
    name: 'Home Wiring & Rewiring',
    description: 'Complete home wiring or selective rewiring with high-quality copper wires and conduits for long-term safety.',
    price: 1499,
    category: 'Electrician',
    duration: '3-6 Hours',
    inclusions: ['Wire routing', 'Conduit laying', 'DB board setup', 'Full testing'],
    highlights: ['ISI copper wiring', 'Up to 5-year warranty', 'Government-compliant'],
  },
  {
    name: 'Appliance Installation',
    description: 'Installation of home appliances — geysers, water purifiers, kitchen chimneys, and exhaust systems.',
    price: 499,
    category: 'Electrician',
    duration: '1-2 Hours',
    inclusions: ['Mounting', 'Electrical connection', 'Testing', 'Demo walkthrough'],
    highlights: ['All brands supported', 'Includes hardware', 'Warranty-safe installation'],
  },

  // ── AC Technician ──
  {
    name: 'AC Repair & Troubleshooting',
    description: 'Diagnosis and repair of all AC issues — gas leaks, compressor faults, PCB errors, and cooling problems.',
    price: 599,
    category: 'AC Technician',
    duration: '1-2 Hours',
    inclusions: ['Full diagnosis', 'Component repair', 'Pressure check', 'Trial run'],
    highlights: ['All brands', 'Genuine spare parts', '30-day repair warranty'],
  },
  {
    name: 'AC Deep Clean & Wash',
    description: 'Thorough foam-jet cleaning of indoor and outdoor AC units. Removes dust, mould, and bacteria for better airflow.',
    price: 499,
    category: 'AC Technician',
    duration: '45-60 Mins',
    inclusions: ['Filter wash', 'Coil foam cleaning', 'Drain flush', 'Anti-fungal spray'],
    highlights: ['Improves cooling 30%', 'Eco-friendly chemicals', 'No wall stains'],
  },
  {
    name: 'AC Gas Refill',
    description: 'Top-up or full recharge of refrigerant gas (R22/R32/R410A) to restore optimal cooling performance.',
    price: 1299,
    category: 'AC Technician',
    duration: '30-45 Mins',
    inclusions: ['Leak detection', 'Gas recharge', 'Pressure calibration', 'Cooling test'],
    highlights: ['Original refrigerant', 'Leak-free guarantee', 'Digital pressure log'],
  },
  {
    name: 'AC Installation & Uninstallation',
    description: 'Professional split or window AC installation with copper piping, brackets, and drainage setup.',
    price: 1499,
    category: 'AC Technician',
    duration: '2-3 Hours',
    inclusions: ['Bracket mounting', 'Copper piping', 'Drain line setup', 'Gas charge check'],
    highlights: ['Free 3ft copper pipe', 'Clean drilling', 'Warranty-safe'],
  },

  // ── Plumber ──
  {
    name: 'Pipe Repair & Replacement',
    description: 'Fix leaking, burst, or corroded pipes. Includes CPVC, PVC, and GI pipe replacements.',
    price: 399,
    category: 'Plumber',
    duration: '1-2 Hours',
    inclusions: ['Leak detection', 'Pipe cutting', 'Joint sealing', 'Pressure test'],
    highlights: ['ISI-grade pipes', 'Leak-proof guarantee', 'Clean work area'],
  },
  {
    name: 'Tap & Faucet Installation',
    description: 'Install or replace kitchen and bathroom taps, mixers, and sensor faucets of all brands.',
    price: 299,
    category: 'Plumber',
    duration: '30-60 Mins',
    inclusions: ['Old tap removal', 'New tap fitting', 'Washer replacement', 'Leak check'],
    highlights: ['All brands supported', 'Includes basic hardware', 'Tidy finish'],
  },
  {
    name: 'Drainage & Blockage Cleaning',
    description: 'Clear clogged drains in kitchen sinks, bathrooms, and floor traps using machine or manual methods.',
    price: 449,
    category: 'Plumber',
    duration: '30-60 Mins',
    inclusions: ['Snake machine cleaning', 'Chemical treatment', 'Trap cleaning', 'Flow test'],
    highlights: ['Heavy-duty equipment', 'No breakage risk', 'Odour elimination'],
  },
  {
    name: 'Water Tank Cleaning',
    description: 'Complete overhead and underground tank cleaning with UV treatment and anti-bacterial wash.',
    price: 799,
    category: 'Plumber',
    duration: '1-2 Hours',
    inclusions: ['Tank draining', 'Scrub cleaning', 'UV treatment', 'Refill & test'],
    highlights: ['Safe drinking water', 'Eco-friendly agents', 'Quarterly reminders'],
  },
  {
    name: 'Toilet & Commode Repair',
    description: 'Fix flush issues, seat replacements, cistern leaks, and jet spray installations.',
    price: 349,
    category: 'Plumber',
    duration: '30-60 Mins',
    inclusions: ['Flush mechanism fix', 'Seat replacement', 'Leak sealing', 'Jet spray fitting'],
    highlights: ['All brands', 'Hygienic work', 'Same-day fix'],
  },

  // ── Mechanic ──
  {
    name: 'Bike Service & Repair',
    description: 'Comprehensive bike servicing — engine oil change, chain lubrication, brake adjustment, and general checkup.',
    price: 599,
    category: 'Mechanic',
    duration: '1-2 Hours',
    inclusions: ['Oil change', 'Chain lube', 'Brake tuning', 'Air filter clean'],
    highlights: ['All bike brands', 'Genuine oils', 'Doorstep service'],
  },
  {
    name: 'Car Service & Repair',
    description: 'Complete car servicing including oil change, filter replacement, brake inspection, and multi-point checkup.',
    price: 1499,
    category: 'Mechanic',
    duration: '2-4 Hours',
    inclusions: ['Engine oil change', 'Oil filter', 'Brake check', '20-point inspection'],
    highlights: ['All car brands', 'OEM-grade parts', 'Service log updated'],
  },
  {
    name: 'Engine Diagnostics',
    description: 'OBD-II scanner diagnostics for check-engine light, sensor failures, and performance issues.',
    price: 499,
    category: 'Mechanic',
    duration: '30-60 Mins',
    inclusions: ['OBD scan', 'Error code analysis', 'Sensor check', 'Report & advisory'],
    highlights: ['Latest scanner tech', 'All car/bike brands', 'Transparent report'],
  },
  {
    name: 'Oil Change & Lube',
    description: 'Quick engine oil change and lubrication service for cars and bikes at your doorstep.',
    price: 399,
    category: 'Mechanic',
    duration: '30-45 Mins',
    inclusions: ['Old oil drain', 'New oil fill', 'Filter check', 'Lube points'],
    highlights: ['Branded oils only', 'Used oil disposed safely', 'Quick service'],
  },

  // ── Home Cleaner ──
  {
    name: 'Full Home Deep Cleaning',
    description: 'Room-by-room deep cleaning covering floors, walls, fans, windows, kitchen, and bathrooms.',
    price: 2499,
    category: 'Home Cleaner',
    duration: '4-6 Hours',
    inclusions: ['Floor scrubbing', 'Wall wiping', 'Fan cleaning', 'Kitchen degreasing', 'Bathroom sanitizing'],
    highlights: ['Professional team', 'Eco-friendly products', 'Move-in/out ready'],
  },
  {
    name: 'Kitchen Deep Clean',
    description: 'Intensive kitchen cleaning — chimney degreasing, slab polishing, sink scrubbing, and appliance wipe-down.',
    price: 999,
    category: 'Home Cleaner',
    duration: '2-3 Hours',
    inclusions: ['Chimney clean', 'Slab polish', 'Sink & drain clean', 'Appliance exterior wipe'],
    highlights: ['Food-safe products', 'Grease removal', 'Sparkling finish'],
  },
  {
    name: 'Bathroom Deep Clean',
    description: 'Complete bathroom sanitization — tile scrubbing, grout cleaning, fixture polishing, and anti-bacterial treatment.',
    price: 699,
    category: 'Home Cleaner',
    duration: '1-2 Hours',
    inclusions: ['Tile scrub', 'Grout cleaning', 'Fixture polish', 'Floor disinfection'],
    highlights: ['Anti-bacterial spray', 'Mould removal', 'Fresh fragrance'],
  },
  {
    name: 'Floor Scrubbing & Mopping',
    description: 'Machine scrubbing and mopping for marble, tile, granite, and wooden floors to restore shine.',
    price: 799,
    category: 'Home Cleaner',
    duration: '1-3 Hours',
    inclusions: ['Vacuum sweep', 'Machine scrub', 'Chemical mop', 'Dry polish'],
    highlights: ['Floor-safe chemicals', 'Restores shine', 'Pet & child safe'],
  },

  // ── Sofa Cleaner ──
  {
    name: 'Sofa Dry Cleaning',
    description: 'Chemical-free dry cleaning for fabric sofas — removes stains, dust mites, and allergens without wetting.',
    price: 699,
    category: 'Sofa Cleaner',
    duration: '1-2 Hours',
    inclusions: ['Vacuuming', 'Dry chemical treatment', 'Stain spot removal', 'Deodorizing'],
    highlights: ['No water damage risk', 'Allergy-safe', 'Ready to use in 1 hour'],
  },
  {
    name: 'Sofa Shampoo Wash',
    description: 'Deep shampoo wash for heavily soiled sofas. Extracts embedded dirt, food stains, and pet hair.',
    price: 899,
    category: 'Sofa Cleaner',
    duration: '2-3 Hours',
    inclusions: ['Pre-treatment spray', 'Shampoo extraction', 'Rinse cycle', 'Speed drying'],
    highlights: ['Removes deep stains', 'Eco-friendly shampoo', 'Fabric-safe process'],
  },
  {
    name: 'Carpet & Rug Cleaning',
    description: 'Professional carpet cleaning with hot-water extraction or dry cleaning, depending on material type.',
    price: 799,
    category: 'Sofa Cleaner',
    duration: '1-2 Hours',
    inclusions: ['Dust removal', 'Stain treatment', 'Shampoo/dry clean', 'Anti-odour spray'],
    highlights: ['All materials', 'Colour-safe', 'Anti-bacterial treated'],
  },
  {
    name: 'Curtain Cleaning',
    description: 'On-site or pickup curtain cleaning service — steam or dry clean for all fabric types.',
    price: 599,
    category: 'Sofa Cleaner',
    duration: '1-2 Hours',
    inclusions: ['Dust shake', 'Steam/dry clean', 'Iron press', 'Re-hanging'],
    highlights: ['No shrinkage', 'Colour preserved', 'Pick & drop available'],
  },

  // ── Home Painter ──
  {
    name: 'Single Room Painting',
    description: 'Professional painting for one room — includes sanding, primer coat, and two finish coats with premium paint.',
    price: 2999,
    category: 'Home Painter',
    duration: '1-2 Days',
    inclusions: ['Wall prep & sanding', 'Primer coat', '2 finish coats', 'Furniture covering', 'Cleanup'],
    highlights: ['Premium paints', 'Colour consultation', 'Clean edges'],
  },
  {
    name: 'Full House Painting',
    description: 'End-to-end house painting — all rooms, hallways, and ceilings with your choice of colours and finishes.',
    price: 14999,
    category: 'Home Painter',
    duration: '3-5 Days',
    inclusions: ['Full wall prep', 'Putty & primer', '2 coats all rooms', 'Ceiling paint', 'Post-paint cleanup'],
    highlights: ['Free colour consultation', 'Asian/Berger paints', '1-year warranty'],
  },
  {
    name: 'Wall Texture & Design',
    description: 'Decorative textured wall finishes — stucco, metallic, rustic, and custom patterns for accent walls.',
    price: 3999,
    category: 'Home Painter',
    duration: '1-2 Days',
    inclusions: ['Surface prep', 'Texture application', 'Pattern design', 'Sealant coat'],
    highlights: ['50+ design options', 'Imported textures', 'Durable finish'],
  },
  {
    name: 'Waterproofing & Sealant',
    description: 'Waterproofing treatment for terrace, bathroom, and exterior walls to prevent seepage and dampness.',
    price: 2499,
    category: 'Home Painter',
    duration: '1-2 Days',
    inclusions: ['Crack filling', 'Primer treatment', 'Waterproof coating', 'Drainage check'],
    highlights: ['5-year protection', 'Stops seepage', 'Mould prevention'],
  },
];

const seedServices = async () => {
  try {
    const dbUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!dbUri) {
      console.error('❌ No MONGO_URI found in .env');
      process.exit(1);
    }

    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing services
    const deleted = await Service.deleteMany({});
    console.log(`🗑️  Deleted ${deleted.deletedCount} existing services`);

    // Insert new services
    const created = await Service.insertMany(SERVICES);
    console.log(`✅ Seeded ${created.length} services across 7 categories:\n`);

    // Summary
    const categories = [...new Set(SERVICES.map(s => s.category))];
    categories.forEach(cat => {
      const count = SERVICES.filter(s => s.category === cat).length;
      console.log(`   ${cat}: ${count} services`);
    });

    console.log('\n🎉 Done!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seedServices();

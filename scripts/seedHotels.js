/**
 * scripts/seedHotels.js
 *
 * Seeds approximately 350 demo Indian hotel / homestay records into MongoDB.
 *
 * SAFETY RULES:
 *  - Never deletes any user.
 *  - Never deletes the admin account.
 *  - Uses upsert on the `slug` field so re-running the script is safe.
 *  - Only touches the Hotel collection.
 *
 * Usage:
 *   npm run seed:hotels
 */

import 'dotenv/config';
import connectDB from '../config/db.js';
import Hotel from '../models/Hotel.js';

await connectDB();

// =============================================================================
// Indian city + state data
// =============================================================================

const cities = [
  { city: 'Bengaluru',        state: 'Karnataka',           lat: 12.9716,  lng: 77.5946  },
  { city: 'Mysuru',           state: 'Karnataka',           lat: 12.2958,  lng: 76.6394  },
  { city: 'Mangaluru',        state: 'Karnataka',           lat: 12.9141,  lng: 74.8560  },
  { city: 'Coorg',            state: 'Karnataka',           lat: 12.3375,  lng: 75.8069  },
  { city: 'Chikmagalur',      state: 'Karnataka',           lat: 13.3161,  lng: 75.7720  },
  { city: 'Hyderabad',        state: 'Telangana',           lat: 17.3850,  lng: 78.4867  },
  { city: 'Chennai',          state: 'Tamil Nadu',          lat: 13.0827,  lng: 80.2707  },
  { city: 'Ooty',             state: 'Tamil Nadu',          lat: 11.4102,  lng: 76.6950  },
  { city: 'Kochi',            state: 'Kerala',              lat: 9.9312,   lng: 76.2673  },
  { city: 'Munnar',           state: 'Kerala',              lat: 10.0889,  lng: 77.0595  },
  { city: 'Thiruvananthapuram', state: 'Kerala',            lat: 8.5241,   lng: 76.9366  },
  { city: 'Goa',              state: 'Goa',                 lat: 15.2993,  lng: 74.1240  },
  { city: 'Mumbai',           state: 'Maharashtra',         lat: 19.0760,  lng: 72.8777  },
  { city: 'Pune',             state: 'Maharashtra',         lat: 18.5204,  lng: 73.8567  },
  { city: 'Nashik',           state: 'Maharashtra',         lat: 19.9975,  lng: 73.7898  },
  { city: 'Jaipur',           state: 'Rajasthan',           lat: 26.9124,  lng: 75.7873  },
  { city: 'Udaipur',          state: 'Rajasthan',           lat: 24.5854,  lng: 73.7125  },
  { city: 'Jodhpur',          state: 'Rajasthan',           lat: 26.2389,  lng: 73.0243  },
  { city: 'New Delhi',        state: 'Delhi',               lat: 28.6139,  lng: 77.2090  },
  { city: 'Agra',             state: 'Uttar Pradesh',       lat: 27.1767,  lng: 78.0081  },
  { city: 'Varanasi',         state: 'Uttar Pradesh',       lat: 25.3176,  lng: 82.9739  },
  { city: 'Amritsar',         state: 'Punjab',              lat: 31.6340,  lng: 74.8723  },
  { city: 'Shimla',           state: 'Himachal Pradesh',    lat: 31.1048,  lng: 77.1734  },
  { city: 'Manali',           state: 'Himachal Pradesh',    lat: 32.2432,  lng: 77.1892  },
  { city: 'Dharamshala',      state: 'Himachal Pradesh',    lat: 32.2190,  lng: 76.3234  },
  { city: 'Rishikesh',        state: 'Uttarakhand',         lat: 30.0869,  lng: 78.2676  },
  { city: 'Dehradun',         state: 'Uttarakhand',         lat: 30.3165,  lng: 78.0322  },
  { city: 'Kolkata',          state: 'West Bengal',         lat: 22.5726,  lng: 88.3639  },
  { city: 'Darjeeling',       state: 'West Bengal',         lat: 27.0360,  lng: 88.2627  },
  { city: 'Gangtok',          state: 'Sikkim',              lat: 27.3389,  lng: 88.6065  },
  { city: 'Bhubaneswar',      state: 'Odisha',              lat: 20.2961,  lng: 85.8245  },
  { city: 'Pondicherry',      state: 'Puducherry',          lat: 11.9416,  lng: 79.8083  },
  { city: 'Visakhapatnam',    state: 'Andhra Pradesh',      lat: 17.6868,  lng: 83.2185  },
  { city: 'Port Blair',       state: 'Andaman and Nicobar', lat: 11.6234,  lng: 92.7265  },
  { city: 'Ahmedabad',        state: 'Gujarat',             lat: 23.0225,  lng: 72.5714  },
  { city: 'Surat',            state: 'Gujarat',             lat: 21.1702,  lng: 72.8311  },
  { city: 'Vadodara',         state: 'Gujarat',             lat: 22.3072,  lng: 73.1812  },
  { city: 'Bhopal',           state: 'Madhya Pradesh',      lat: 23.2599,  lng: 77.4126  },
  { city: 'Indore',           state: 'Madhya Pradesh',      lat: 22.7196,  lng: 75.8577  },
  { city: 'Lucknow',          state: 'Uttar Pradesh',       lat: 26.8467,  lng: 80.9462  },
  { city: 'Chandigarh',       state: 'Punjab',              lat: 30.7333,  lng: 76.7794  },
  { city: 'Srinagar',         state: 'Jammu & Kashmir',     lat: 34.0837,  lng: 74.7973  },
  { city: 'Leh',              state: 'Ladakh',              lat: 34.1526,  lng: 77.5771  },
  { city: 'Aurangabad',       state: 'Maharashtra',         lat: 19.8762,  lng: 75.3433  },
  { city: 'Madurai',          state: 'Tamil Nadu',          lat: 9.9252,   lng: 78.1198  },
  { city: 'Tirupati',         state: 'Andhra Pradesh',      lat: 13.6288,  lng: 79.4192  },
  { city: 'Hampi',            state: 'Karnataka',           lat: 15.3350,  lng: 76.4600  },
  { city: 'Alleppey',         state: 'Kerala',              lat: 9.4981,   lng: 76.3388  },
  { city: 'Varkala',          state: 'Kerala',              lat: 8.7379,   lng: 76.7163  },
  { city: 'Puri',             state: 'Odisha',              lat: 19.8135,  lng: 85.8312  },
];

// =============================================================================
// Hotel name parts
// =============================================================================

const prefixes = [
  'The', 'Grand', 'Royal', 'Heritage', 'Classic', 'Green', 'Blue', 'White',
  'Golden', 'Silver', 'Sunrise', 'Sunset', 'Mountain', 'Lakeside', 'Garden',
  'Cozy', 'Tranquil', 'Serene', 'Bliss', 'Harmony', 'Azure', 'Mystic',
  'Amber', 'Crimson', 'Emerald', 'Pearl', 'Ivory', 'Sacred', 'Ancient',
  'Modern', 'Urban', 'Nature', 'Forest', 'Valley', 'River', 'Ocean',
  'Hilltop', 'Meadow', 'Palm', 'Lotus', 'Jasmine', 'Marigold', 'Tulip',
];

const suffixes = [
  'Homestay', 'Stay', 'Retreat', 'Inn', 'Lodge', 'Villa', 'Cottage',
  'Residency', 'Manor', 'Abode', 'Nest', 'Haven', 'Sanctuary', 'Escape',
  'House', 'Bungalow', 'Chalet', 'Cabin', 'Farmhouse', 'Guesthouse',
  'Suites', 'Rooms', 'Quarters', 'Terrace', 'Pavilion', 'Palace',
  'Garden Stay', 'Hillside Stay', 'Lakefront', 'Riverside', 'Hilltop Stay',
];

// =============================================================================
// Property types per city characteristic
// =============================================================================

const getPropertyType = (city) => {
  const beach  = ['Goa', 'Kochi', 'Thiruvananthapuram', 'Pondicherry', 'Visakhapatnam', 'Port Blair', 'Varkala', 'Puri'];
  const hill   = ['Coorg', 'Chikmagalur', 'Ooty', 'Munnar', 'Shimla', 'Manali', 'Dharamshala', 'Darjeeling', 'Gangtok', 'Rishikesh', 'Leh', 'Srinagar'];
  const heritage = ['Jaipur', 'Udaipur', 'Jodhpur', 'Agra', 'Varanasi', 'Amritsar', 'Mysuru', 'Hampi', 'Tirupati'];

  if (beach.includes(city)) return ['Homestay', 'Villa', 'Resort'];
  if (hill.includes(city)) return ['Homestay', 'Cottage', 'Boutique'];
  if (heritage.includes(city)) return ['Heritage', 'Boutique', 'Hotel'];
  return ['Hotel', 'Homestay', 'Boutique'];
};

const propertyTypeMap = {
  Homestay: 'Homestay',
  Villa: 'Villa',
  Resort: 'Resort',
  Cottage: 'Homestay',
  Boutique: 'Boutique',
  Heritage: 'Heritage',
  Hotel: 'Hotel',
};

// =============================================================================
// Amenity pools
// =============================================================================

const allAmenities = [
  'Wi-Fi', 'Air Conditioning', 'Parking', 'Breakfast', 'Restaurant',
  'Swimming Pool', 'Gym', 'Spa', 'Hot Water', 'Room Service', 'Laundry',
  'Airport Transfer', 'CCTV', 'Garden', 'Terrace', 'Bonfire', 'Cycling',
  'Hiking Trails', 'Yoga Classes', 'Kitchenette', 'Library', 'Kids Play Area',
  'Bar', 'Conference Room', 'EV Charging', '24-hour Front Desk', 'Pet Friendly',
  'Beachfront', 'Mountain View', 'Lake View', 'Heritage Tour', 'Ayurveda',
];

const pickAmenities = (n = 6) => {
  const shuffled = [...allAmenities].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

// =============================================================================
// Unsplash image pool (free-to-use demo images)
// =============================================================================

const images = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1537726235470-8504e3beef77?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1609766857520-5e1c3e5a1e5e?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1506059612708-99d6128a0451?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?auto=format&fit=crop&w=800&q=70',
];

// =============================================================================
// Descriptions
// =============================================================================

const descriptionTemplates = [
  (name, city) => `${name} is a charming stay tucked in the heart of ${city}, offering a peaceful retreat from the hustle of everyday life. Guests enjoy spacious, well-furnished rooms, friendly hosts, and authentic local experiences.`,
  (name, city) => `Nestled in the scenic surroundings of ${city}, ${name} provides comfortable accommodation with modern amenities. Perfect for families, couples, and solo travellers looking for a relaxing getaway.`,
  (name, city) => `Experience the warmth of Indian hospitality at ${name} in ${city}. Our thoughtfully designed rooms and attentive service ensure a memorable stay at a great value.`,
  (name, city) => `${name} offers a perfect blend of comfort and culture in ${city}. Enjoy curated local experiences, home-cooked breakfasts, and easy access to top attractions.`,
  (name, city) => `A boutique escape in ${city}, ${name} is ideal for travellers who appreciate character, comfort, and convenience. Discover local flavours and hidden gems with our knowledgeable hosts.`,
  (name, city) => `Set against the stunning backdrop of ${city}, ${name} is your home away from home. Relax in thoughtfully appointed rooms and wake up to scenic views every morning.`,
  (name, city) => `${name} brings you closer to the best of ${city}. Whether you are here for adventure, heritage, or leisure, our property offers everything you need for a comfortable and enriching stay.`,
];

// =============================================================================
// Address templates
// =============================================================================

const addressTemplates = [
  (city) => `Near ${city} Bus Stand, ${city}`,
  (city) => `Opposite ${city} Railway Station, ${city}`,
  (city) => `MG Road, ${city}`,
  (city) => `Old Town Area, ${city}`,
  (city) => `Tourist Zone, ${city}`,
  (city) => `Hill View Road, ${city}`,
  (city) => `Lake Road, ${city}`,
  (city) => `Market Street, ${city}`,
  (city) => `Riverside Lane, ${city}`,
  (city) => `Heritage Walk, ${city}`,
  (city) => `Sunset Point Road, ${city}`,
  (city) => `Main Bazaar Area, ${city}`,
  (city) => `Backwater View, ${city}`,
  (city) => `Garden Colony, ${city}`,
  (city) => `Rock Garden Road, ${city}`,
];

// =============================================================================
// Room type configurations
// =============================================================================

const roomConfigs = {
  budget: [
    { type: 'Single', capacity: 1, priceRange: [700, 1200] },
    { type: 'Double', capacity: 2, priceRange: [1000, 1800] },
  ],
  standard: [
    { type: 'Single', capacity: 1, priceRange: [1200, 2200] },
    { type: 'Double', capacity: 2, priceRange: [1800, 3500] },
    { type: 'Deluxe', capacity: 3, priceRange: [2500, 4500] },
  ],
  premium: [
    { type: 'Double', capacity: 2, priceRange: [3000, 5500] },
    { type: 'Deluxe', capacity: 3, priceRange: [4500, 7500] },
    { type: 'Suite',  capacity: 4, priceRange: [7000, 12000] },
  ],
  luxury: [
    { type: 'Deluxe', capacity: 3, priceRange: [6000, 9000] },
    { type: 'Suite',  capacity: 4, priceRange: [9000, 15000] },
  ],
};

// =============================================================================
// Utility helpers
// =============================================================================

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, decimals = 1) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

const tier = () => {
  const n = Math.random();
  if (n < 0.25) return 'budget';
  if (n < 0.55) return 'standard';
  if (n < 0.85) return 'premium';
  return 'luxury';
};

const slug = (name, city, index) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`;

// =============================================================================
// Build hotel records
// =============================================================================

const buildHotels = () => {
  const hotels = [];
  let index = 0;

  // Distribute ~7 hotels per city across 50 cities = 350 hotels
  for (const location of cities) {
    const count = rand(6, 9); // 6–9 properties per city

    for (let i = 0; i < count; i++) {
      const prefix    = pick(prefixes);
      const suffix    = pick(suffixes);
      const name      = `${prefix} ${location.city} ${suffix}`;
      const propTypes = getPropertyType(location.city);
      const rawType   = pick(propTypes);
      const propType  = propertyTypeMap[rawType] || 'Hotel';
      const hotelTier = tier();
      const rooms     = (roomConfigs[hotelTier] || roomConfigs.standard).map((cfg, ri) => ({
        roomNumber:  `${(i + 1) * 100 + ri + 1}`,
        type:        cfg.type,
        capacity:    cfg.capacity,
        basePrice:   rand(cfg.priceRange[0], cfg.priceRange[1]),
        amenities:   pickAmenities(3),
        images:      [pick(images)],
        isAvailable: Math.random() > 0.1, // 90 % available
      }));

      const rating      = randFloat(3.4, 4.9);
      const reviewCount = rand(8, 820);
      const descFn      = pick(descriptionTemplates);
      const addrFn      = pick(addressTemplates);
      const img         = pick(images);

      hotels.push({
        slug:        slug(name, location.city, index++),
        name,
        description: descFn(name, location.city),
        location: {
          city:    location.city,
          state:   location.state,
          address: addrFn(location.city),
          coordinates: {
            lat: location.lat + (Math.random() - 0.5) * 0.05,
            lng: location.lng + (Math.random() - 0.5) * 0.05,
          },
        },
        propertyType: propType,
        rating,
        reviewCount,
        amenities: pickAmenities(rand(4, 8)),
        images: [img, pick(images)],
        rooms,
      });
    }
  }

  return hotels;
};

// =============================================================================
// Seed
// =============================================================================

const hotelsToSeed = buildHotels();
console.log(`\nPreparing to upsert ${hotelsToSeed.length} demo hotel records…`);

let created = 0;
let updated = 0;

for (const hotelData of hotelsToSeed) {
  const result = await Hotel.findOneAndUpdate(
    { slug: hotelData.slug },
    { $set: hotelData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  // If it was newly created the _id won't exist in the original document
  if (result.createdAt && Math.abs(Date.now() - result.createdAt.getTime()) < 5000) {
    created++;
  } else {
    updated++;
  }
}

console.log(`\n✅ Hotel seed complete!`);
console.log(`   Created : ${created}`);
console.log(`   Updated : ${updated}`);
console.log(`   Total   : ${hotelsToSeed.length}\n`);

process.exit(0);

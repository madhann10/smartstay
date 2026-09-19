export const mockHotels = [
  { _id: 'grand-orchid', name: 'Grand Orchid Hotel', location: { city: 'Mumbai', address: 'Marine Drive' }, rating: 4.7, amenities: ['Pool', 'Spa', 'Breakfast', 'Wi‑Fi'], images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'], description: 'A serene coastal stay with city views, thoughtful service, and spacious rooms.', rooms: [{ _id: 'g1', roomNumber: '301', type: 'Deluxe', capacity: 2, basePrice: 4800, isAvailable: true }, { _id: 'g2', roomNumber: '401', type: 'Suite', capacity: 3, basePrice: 7900, isAvailable: true }] },
  { _id: 'terrace-house', name: 'The Terrace House', location: { city: 'Bengaluru', address: 'Indiranagar' }, rating: 4.5, amenities: ['Gym', 'Restaurant', 'Wi‑Fi'], images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80'], description: 'Contemporary rooms in the heart of Bengaluru, designed for business and leisure.', rooms: [{ _id: 't1', roomNumber: '204', type: 'Double', capacity: 2, basePrice: 3200, isAvailable: true }, { _id: 't2', roomNumber: '508', type: 'Deluxe', capacity: 2, basePrice: 4200, isAvailable: false }] },
  { _id: 'saffron-retreat', name: 'Saffron Retreat', location: { city: 'Jaipur', address: 'Amer Road' }, rating: 4.8, amenities: ['Pool', 'Parking', 'Restaurant', 'Breakfast'], images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80'], description: 'A warm, heritage-inspired escape close to Jaipur’s most celebrated sights.', rooms: [{ _id: 's1', roomNumber: '112', type: 'Single', capacity: 1, basePrice: 2800, isAvailable: true }, { _id: 's2', roomNumber: '206', type: 'Suite', capacity: 4, basePrice: 6800, isAvailable: true }] },
];

export const bookingRows = [
  { id: 'BK-10482', customer: 'Aarav Sharma', hotel: 'Grand Orchid Hotel', room: 'Deluxe · 301', dates: '18–21 Sep', amount: 17280, payment: 'Paid', status: 'Confirmed' },
  { id: 'BK-10481', customer: 'Meera Iyer', hotel: 'The Terrace House', room: 'Double · 204', dates: '19–20 Sep', amount: 3840, payment: 'Pending', status: 'Pending' },
  { id: 'BK-10480', customer: 'Kabir Singh', hotel: 'Saffron Retreat', room: 'Suite · 206', dates: '22–25 Sep', amount: 24480, payment: 'Paid', status: 'Confirmed' },
  { id: 'BK-10479', customer: 'Nisha Patel', hotel: 'Grand Orchid Hotel', room: 'Suite · 401', dates: '17–18 Sep', amount: 9480, payment: 'Refunded', status: 'Cancelled' },
];

export const analyticsData = [
  { name: 'Mon', bookings: 18, revenue: 62000, occupancy: 58 }, { name: 'Tue', bookings: 24, revenue: 78000, occupancy: 63 }, { name: 'Wed', bookings: 21, revenue: 69000, occupancy: 61 }, { name: 'Thu', bookings: 31, revenue: 106000, occupancy: 72 }, { name: 'Fri', bookings: 42, revenue: 148000, occupancy: 84 }, { name: 'Sat', bookings: 48, revenue: 176000, occupancy: 89 }, { name: 'Sun', bookings: 36, revenue: 120000, occupancy: 75 },
];

export const pricingRows = [
  { hotel: 'Grand Orchid Hotel', room: 'Deluxe', base: 4800, dynamic: 5760, demand: 'High', occupancy: 85, status: 'Active' },
  { hotel: 'The Terrace House', room: 'Double', base: 3200, dynamic: 3520, demand: 'Medium', occupancy: 61, status: 'Active' },
  { hotel: 'Saffron Retreat', room: 'Suite', base: 6800, dynamic: 6120, demand: 'Low', occupancy: 32, status: 'Active' },
];

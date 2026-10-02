import 'dotenv/config';
import axios from 'axios';

const baseUrl = 'http://localhost:5000/api';

async function runTests() {
  console.log('=============================================');
  console.log('=== PHASE 21: AUTOMATED E2E VERIFICATION  ===');
  console.log('=============================================\n');

  // 1. Admin Login
  console.log('1. Testing Admin Authentication...');
  const loginRes = await axios.post(`${baseUrl}/auth/login`, {
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  });
  if (!loginRes.data.success || !loginRes.data.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginRes.data));
  }
  const token = loginRes.data.token;
  console.log('   ✓ Admin login successful. Role:', loginRes.data.user.role);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // 2. Admin Profile
  console.log('\n2. Testing Admin Profile API...');
  const profileRes = await axios.get(`${baseUrl}/admin/profile`, authHeaders);
  console.log('   ✓ Admin Profile loaded:', profileRes.data.admin.name, `(${profileRes.data.admin.email})`);

  // 3. Admin Overview
  console.log('\n3. Testing Admin Overview Stats...');
  const overviewRes = await axios.get(`${baseUrl}/admin/overview`, authHeaders);
  const stats = overviewRes.data.stats;
  console.log('   ✓ Real Database Stats:');
  console.log('     • Total Hotels:', stats.totalHotels);
  console.log('     • Available Rooms:', stats.availableRooms);
  console.log('     • Today Bookings:', stats.todaysBookings);
  console.log('     • Total Revenue: ₹' + stats.totalRevenue.toLocaleString('en-IN'));
  console.log('     • Recent Bookings returned:', overviewRes.data.recentBookings.length);

  // 4. Admin Hotels CRUD
  console.log('\n4. Testing Hotels CRUD...');
  const hotelsRes = await axios.get(`${baseUrl}/admin/hotels?page=1&limit=5`, authHeaders);
  console.log('   ✓ Loaded hotels list. Total count in DB:', hotelsRes.data.pagination.total);

  // Create test hotel
  const createHotelRes = await axios.post(
    `${baseUrl}/admin/hotels`,
    {
      name: 'E2E Test Boutique Resort',
      city: 'Bengaluru',
      state: 'Karnataka',
      address: '100 Feet Road, Indiranagar',
      propertyType: 'Boutique',
      basePrice: 4200,
      rating: 4.8,
      description: 'Temporary automated test hotel',
      amenities: ['Wi-Fi', 'Pool', 'Breakfast'],
    },
    authHeaders
  );
  const testHotelId = createHotelRes.data.hotel._id;
  console.log('   ✓ Test Hotel created with ID:', testHotelId);

  // Update test hotel
  const updateHotelRes = await axios.put(
    `${baseUrl}/admin/hotels/${testHotelId}`,
    {
      name: 'E2E Test Boutique Resort Updated',
      rating: 4.9,
    },
    authHeaders
  );
  console.log(
    '   ✓ Test Hotel updated. New name:',
    updateHotelRes.data.hotel.name,
    'Rating:',
    updateHotelRes.data.hotel.rating
  );

  // 5. Admin Rooms CRUD
  console.log('\n5. Testing Rooms CRUD...');
  const createRoomRes = await axios.post(
    `${baseUrl}/admin/rooms`,
    {
      hotelId: testHotelId,
      roomNumber: '999',
      type: 'Suite',
      capacity: 3,
      basePrice: 5500,
      amenities: ['Wi-Fi', 'Jacuzzi'],
      isAvailable: true,
    },
    authHeaders
  );
  const testRoomId = createRoomRes.data.room._id;
  console.log('   ✓ Test Room created. Room #:', createRoomRes.data.room.roomNumber, 'ID:', testRoomId);

  // Update room
  const updateRoomRes = await axios.put(
    `${baseUrl}/admin/rooms/${testHotelId}/${testRoomId}`,
    {
      basePrice: 6000,
      isAvailable: false,
    },
    authHeaders
  );
  console.log(
    '   ✓ Test Room updated. New base price:',
    updateRoomRes.data.room.basePrice,
    'Available:',
    updateRoomRes.data.room.isAvailable
  );

  // 6. Admin Pricing
  console.log('\n6. Testing Dynamic Pricing...');
  const pricingRes = await axios.get(`${baseUrl}/admin/pricing?limit=5`, authHeaders);
  console.log('   ✓ Loaded pricing rows. Total rooms priced:', pricingRes.data.pagination.total);

  // Update price test
  const updatePriceRes = await axios.put(
    `${baseUrl}/admin/pricing/${testHotelId}/${testRoomId}`,
    {
      basePrice: 6500,
    },
    authHeaders
  );
  console.log(
    '   ✓ Room price updated in MongoDB. New base:',
    updatePriceRes.data.room.basePrice,
    'Dynamic:',
    updatePriceRes.data.room.dynamicPrice
  );

  // Clean up test room and hotel
  console.log('\n7. Cleaning up test records...');
  await axios.delete(`${baseUrl}/admin/rooms/${testHotelId}/${testRoomId}`, authHeaders);
  console.log('   ✓ Test Room deleted successfully.');
  await axios.delete(`${baseUrl}/admin/hotels/${testHotelId}`, authHeaders);
  console.log('   ✓ Test Hotel deleted successfully.');

  // 8. Admin Bookings
  console.log('\n8. Testing Bookings API...');
  const bookingsRes = await axios.get(`${baseUrl}/admin/bookings?limit=5`, authHeaders);
  console.log('   ✓ Loaded bookings list. Total count in DB:', bookingsRes.data.pagination.total);
  if (bookingsRes.data.bookings.length > 0) {
    const firstBooking = bookingsRes.data.bookings[0];
    const singleBookingRes = await axios.get(
      `${baseUrl}/admin/bookings/${firstBooking.bookingId}`,
      authHeaders
    );
    console.log(
      '   ✓ Single booking fetched by ID:',
      singleBookingRes.data.booking.bookingId,
      'Status:',
      singleBookingRes.data.booking.bookingStatus
    );
  }

  // 9. Admin Analytics
  console.log('\n9. Testing Database Analytics API...');
  const analyticsRes = await axios.get(`${baseUrl}/admin/analytics`, authHeaders);
  const a = analyticsRes.data.analytics;
  console.log('   ✓ Real Database Analytics:');
  console.log('     • Total bookings:', a.totalBookings);
  console.log('     • Total revenue: ₹' + a.totalRevenue.toLocaleString('en-IN'));
  console.log('     • Occupancy rate:', a.occupancyRate + '%');
  console.log('     • Booking trend points:', a.bookingTrend.length);
  console.log('     • Top performing hotels:', a.topHotels.map((h) => h.name).join(', '));

  // 10. Login Activity
  console.log('\n10. Testing Login Activity API...');
  const loginActivityRes = await axios.get(`${baseUrl}/admin/login-activity?limit=5`, authHeaders);
  console.log('   ✓ Login activity records loaded. Total in DB:', loginActivityRes.data.pagination.total);

  // 11. Users API
  console.log('\n11. Testing Users API...');
  const usersRes = await axios.get(`${baseUrl}/admin/users?limit=5`, authHeaders);
  console.log('   ✓ Users list loaded. Total users in DB:', usersRes.data.pagination.total);

  console.log('\n=============================================');
  console.log('🎉 ALL END-TO-END TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('=============================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err.response?.data || err.message);
  process.exit(1);
});

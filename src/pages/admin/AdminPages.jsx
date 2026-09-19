import { BarChart3, BedDouble, Building2, CalendarCheck, CircleDollarSign, Loader2, Mail, Phone, Plus, Search, ShieldCheck, Users, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { analyticsData } from '../../data/mockData';
import { money, SectionTitle, StatusPill, Table } from '../../components/Ui';

const chartStyle = { fontSize: 12, fill: '#64748b' };
const Stat = ({ label, value, Icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </div>
      <span className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
        <Icon size={20} />
      </span>
    </div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <h3 className="mb-4 font-bold">{title}</h3>
    {children}
  </section>
);

// =============================================================================
// 1. ADMIN OVERVIEW
// =============================================================================
export function AdminOverview() {
  const [data, setData] = useState({ loading: true, error: '', stats: null, recentBookings: [] });

  const fetchOverview = async () => {
    try {
      const res = await adminApi.getOverviewStats();
      setData({ loading: false, error: '', stats: res.stats, recentBookings: res.recentBookings || [] });
    } catch (e) {
      setData({ loading: false, error: e?.response?.data?.message || 'Unable to load overview data.', stats: null, recentBookings: [] });
    }
  };

  useEffect(() => { fetchOverview(); }, []);

  const stats = data.stats || { totalHotels: 0, availableRooms: 0, todaysBookings: 0, totalRevenue: 0 };

  return (
    <>
      <SectionTitle eyebrow="Overview" title="Good morning, Administrator" description="Here’s live operational performance from SmartStay’s database." />

      {data.error && (
        <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{data.error}</p>
      )}

      {/* Top 4 Real Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total hotels" value={data.loading ? '…' : stats.totalHotels.toLocaleString('en-IN')} Icon={Building2} />
        <Stat label="Available rooms" value={data.loading ? '…' : stats.availableRooms.toLocaleString('en-IN')} Icon={BedDouble} />
        <Stat label="Today’s bookings" value={data.loading ? '…' : stats.todaysBookings.toLocaleString('en-IN')} Icon={CalendarCheck} />
        <Stat label="Total revenue" value={data.loading ? '…' : money(stats.totalRevenue)} Icon={CircleDollarSign} />
      </div>

      <LoginMetrics />

      {/* Recent Bookings Table */}
      <div className="mt-7">
        <SectionTitle eyebrow="Latest activity" title="Recent bookings" />
        {data.loading ? (
          <p className="rounded-xl bg-white p-6 text-center text-slate-500">Loading recent bookings…</p>
        ) : (
          <BookingsTable bookings={data.recentBookings} />
        )}
      </div>
    </>
  );
}

// =============================================================================
// LOGIN METRICS (AUTHENTICATION ANALYTICS)
// =============================================================================
function LoginMetrics() {
  const [state, setState] = useState({ loading: true, stats: null, active: null, trend: [] });
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [stats, active, trend] = await Promise.all([
          adminApi.getLoginStatistics(),
          adminApi.getActiveUsers(),
          adminApi.getDailyLoginStatistics({ days: 7 }),
        ]);
        if (!alive) return;
        const grouped = Object.values(
          trend.data.reduce((all, row) => {
            const key = row._id.date;
            all[key] ||= { date: key, email: 0, otp: 0 };
            all[key][row._id.method === 'EMAIL' ? 'email' : 'otp'] = row.count;
            return all;
          }, {})
        );
        setState({ loading: false, stats, active, trend: grouped });
      } catch {
        if (alive) setState({ loading: false, stats: null, active: null, trend: [] });
      }
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  if (state.loading) return <p className="mt-7 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading live login activity…</p>;
  if (!state.stats) return <p className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">Login analytics will appear when the authenticated admin APIs are available.</p>;

  return (
    <section className="mt-7">
      <SectionTitle eyebrow="Login activity" title="Authentication at a glance" description={`Live data refreshes every 60 seconds. Active status uses a ${state.active.activeSessionTimeoutMinutes}-minute session timeout.`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Currently active" value={state.active.activeUsers} Icon={Users} />
        <Stat label="Logins today" value={state.stats.totalLoginsToday} Icon={ShieldCheck} />
        <Stat label="Email logins" value={state.stats.emailLoginsToday} Icon={Mail} />
        <Stat label="Mobile OTP" value={state.stats.mobileOtpLoginsToday} Icon={Phone} />
        <Stat label="Failed attempts" value={state.stats.failedAttemptsToday} Icon={BarChart3} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Login methods">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={[{ name: 'Email', value: state.stats.emailLoginsToday }, { name: 'Mobile OTP', value: state.stats.mobileOtpLoginsToday }]} dataKey="value" outerRadius={85} label>
                {['#4f46e5', '#06b6d4'].map((fill) => <Cell key={fill} fill={fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Login trend">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={state.trend}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={chartStyle} axisLine={false} tickLine={false} />
              <YAxis tick={chartStyle} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line dataKey="email" name="Email" stroke="#4f46e5" strokeWidth={3} />
              <Line dataKey="otp" name="Mobile OTP" stroke="#06b6d4" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}

// =============================================================================
// 2. ADMIN HOTELS PAGE & ADD HOTEL MODAL
// =============================================================================
export function HotelsAdmin() {
  const [hotels,     setHotels]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [formErr,      setFormErr]      = useState('');

  const [form, setForm] = useState({
    name: '',
    city: '',
    state: '',
    address: '',
    propertyType: 'Hotel',
    basePrice: '2500',
    rating: '4.5',
    description: '',
    amenities: 'Wi-Fi, Air Conditioning, Breakfast',
  });

  const loadHotels = async (p = 1, s = search) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getHotels({ page: p, limit: 15, search: s });
      setHotels(res.hotels || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load hotels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHotels(1, search); }, [search]);

  const handleAddHotel = async (e) => {
    e.preventDefault();
    setFormErr('');
    setSubmitting(true);
    try {
      await adminApi.createHotel(form);
      setShowAddModal(false);
      setForm({ name: '', city: '', state: '', address: '', propertyType: 'Hotel', basePrice: '2500', rating: '4.5', description: '', amenities: 'Wi-Fi, Air Conditioning, Breakfast' });
      loadHotels(1, search);
    } catch (e) {
      setFormErr(e?.response?.data?.message || 'Failed to create hotel.');
    } finally {
      setSubmitting(false);
    }
  };

  const rows = hotels.map((h) => [
    <span className="font-semibold text-slate-900" key={h._id}>{h.name}</span>,
    `${h.location?.city || ''}${h.location?.state ? ', ' + h.location.state : ''}`,
    `★ ${h.rating || 4.5}`,
    h.rooms ? h.rooms.length : 0,
    money(h.rooms?.[0]?.basePrice || 2500),
    h.propertyType || 'Hotel',
    <StatusPill key={h._id}>Active</StatusPill>,
  ]);

  return (
    <>
      <SectionTitle
        eyebrow="Inventory"
        title="Hotels"
        description={`Showing ${pagination.total.toLocaleString('en-IN')} hotel records from MongoDB.`}
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> Add Hotel
          </button>
        }
      />

      {/* Search box */}
      <div className="mb-5 flex max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
        <Search size={17} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search hotel name or city"
          className="w-full py-2.5 text-sm outline-none"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500">Loading hotels from database…</p>
      ) : (
        <>
          <Table columns={['Hotel', 'Location', 'Rating', 'Rooms', 'Starting Price', 'Type', 'Status']} rows={rows.map((cells, idx) => (
            <tr key={idx}>{cells.map((cell, k) => <td key={k} className="px-5 py-4">{cell}</td>)}</tr>
          ))} />
          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>Total {pagination.total} hotels (Page {pagination.page} of {pagination.pages})</span>
              <div className="flex gap-2">
                <button disabled={pagination.page <= 1} onClick={() => loadHotels(pagination.page - 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Previous</button>
                <button disabled={pagination.page >= pagination.pages} onClick={() => loadHotels(pagination.page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Add Hotel Modal ────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">+ Add New Hotel / Homestay</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            {formErr && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{formErr}</p>}
            <form onSubmit={handleAddHotel} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500">HOTEL NAME *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Royal Heritage Resort" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">CITY *</label>
                  <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Jaipur" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">STATE</label>
                  <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g. Rajasthan" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500">ADDRESS *</label>
                <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. Amer Road" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-indigo-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">PROPERTY TYPE</label>
                  <select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} className="mt-1 w-full rounded-lg border px-2 py-2 text-sm outline-indigo-500">
                    <option>Hotel</option><option>Homestay</option><option>Boutique</option><option>Resort</option><option>Villa</option><option>Heritage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">STARTING PRICE (₹)</label>
                  <input type="number" required value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">RATING</label>
                  <input type="number" step="0.1" max="5" min="1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500">DESCRIPTION</label>
                <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the property" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-indigo-500" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                <button disabled={submitting} type="submit" className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                  {submitting ? 'Saving…' : 'Save Hotel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// =============================================================================
// 3. ADMIN ROOMS PAGE & ADD ROOM MODAL
// =============================================================================
export function RoomsAdmin() {
  const [rooms,      setRooms]      = useState([]);
  const [hotelsList, setHotelsList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [formErr,      setFormErr]      = useState('');

  const [form, setForm] = useState({
    hotelId: '',
    roomNumber: '',
    type: 'Deluxe',
    capacity: '2',
    basePrice: '3500',
    amenities: 'Wi-Fi, Air Conditioning',
    isAvailable: true,
  });

  const loadRooms = async (p = 1, s = search) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getRooms({ page: p, limit: 15, search: s });
      setRooms(res.rooms || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load rooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRooms(1, search); }, [search]);

  const openAddModal = async () => {
    setShowAddModal(true);
    try {
      const res = await adminApi.getHotels({ limit: 100 });
      setHotelsList(res.hotels || []);
      if (res.hotels?.length > 0) {
        setForm((f) => ({ ...f, hotelId: res.hotels[0]._id }));
      }
    } catch {}
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setFormErr('');
    setSubmitting(true);
    try {
      await adminApi.createRoom(form);
      setShowAddModal(false);
      setForm({ hotelId: hotelsList[0]?._id || '', roomNumber: '', type: 'Deluxe', capacity: '2', basePrice: '3500', amenities: 'Wi-Fi, Air Conditioning', isAvailable: true });
      loadRooms(1, search);
    } catch (e) {
      setFormErr(e?.response?.data?.message || 'Failed to create room.');
    } finally {
      setSubmitting(false);
    }
  };

  const rows = rooms.map((r) => [
    <span className="font-semibold text-slate-900" key={r._id}>{r.roomNumber}</span>,
    r.hotelName || '—',
    r.type,
    money(r.basePrice),
    <span className="font-semibold text-indigo-700" key={`dyn-${r._id}`}>{money(r.dynamicPrice)}</span>,
    <StatusPill key={`st-${r._id}`}>{r.status}</StatusPill>,
  ]);

  return (
    <>
      <SectionTitle
        eyebrow="Inventory"
        title="Rooms"
        description={`Showing ${pagination.total.toLocaleString('en-IN')} rooms across all hotels.`}
        action={
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> Add Room
          </button>
        }
      />

      <div className="mb-5 flex max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
        <Search size={17} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search room number, hotel or type"
          className="w-full py-2.5 text-sm outline-none"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500">Loading rooms from database…</p>
      ) : (
        <>
          <Table columns={['Room', 'Hotel', 'Type', 'Base price', 'Dynamic price', 'Status']} rows={rows.map((cells, idx) => (
            <tr key={idx}>{cells.map((cell, k) => <td key={k} className="px-5 py-4">{cell}</td>)}</tr>
          ))} />
          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>Total {pagination.total} rooms (Page {pagination.page} of {pagination.pages})</span>
              <div className="flex gap-2">
                <button disabled={pagination.page <= 1} onClick={() => loadRooms(pagination.page - 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Previous</button>
                <button disabled={pagination.page >= pagination.pages} onClick={() => loadRooms(pagination.page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Add Room Modal ─────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">+ Add New Room to Hotel</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            {formErr && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{formErr}</p>}
            <form onSubmit={handleAddRoom} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500">SELECT HOTEL *</label>
                <select required value={form.hotelId} onChange={(e) => setForm({ ...form, hotelId: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-indigo-500">
                  {hotelsList.map((h) => <option key={h._id} value={h._id}>{h.name} ({h.location?.city})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">ROOM NUMBER *</label>
                  <input required value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} placeholder="e.g. 204" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">ROOM TYPE *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-indigo-500">
                    <option>Single</option><option>Double</option><option>Suite</option><option>Deluxe</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">CAPACITY (GUESTS)</label>
                  <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">BASE PRICE (₹) *</label>
                  <input type="number" required value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-indigo-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                <button disabled={submitting} type="submit" className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                  {submitting ? 'Saving…' : 'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// =============================================================================
// 4. ADMIN BOOKINGS PAGE
// =============================================================================
export function BookingsAdmin() {
  const [bookings,   setBookings]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const loadBookings = async (p = 1, s = search) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getBookings({ page: p, limit: 15, search: s });
      setBookings(res.bookings || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(1, search); }, [search]);

  return (
    <>
      <SectionTitle eyebrow="Reservations" title="Bookings" description="Search, confirm and manage real customer reservations." />

      <div className="mb-5 flex max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
        <Search size={17} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search booking ID, customer or hotel"
          className="w-full py-2.5 text-sm outline-none"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500">Loading bookings from database…</p>
      ) : (
        <>
          <BookingsTable bookings={bookings} />
          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>Total {pagination.total} bookings (Page {pagination.page} of {pagination.pages})</span>
              <div className="flex gap-2">
                <button disabled={pagination.page <= 1} onClick={() => loadBookings(pagination.page - 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Previous</button>
                <button disabled={pagination.page >= pagination.pages} onClick={() => loadBookings(pagination.page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function BookingsTable({ bookings }) {
  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
    catch { return String(d); }
  };

  if (!bookings || bookings.length === 0) {
    return <div className="rounded-xl bg-white p-10 text-center text-slate-500">No booking records found.</div>;
  }

  return (
    <Table
      columns={['Booking ID', 'Customer', 'Hotel & Room', 'Stay', 'Amount', 'Payment', 'Status']}
      rows={bookings.map((b) => (
        <tr key={b._id || b.bookingId}>
          <td className="px-5 py-4 font-semibold text-indigo-600">{b.bookingId || b.id}</td>
          <td className="px-5 py-4">{b.customerSnapshot?.name || b.customer || '—'}<br/><span className="text-xs text-slate-400">{b.customerSnapshot?.email}</span></td>
          <td className="px-5 py-4">{b.hotelSnapshot?.name || b.hotel}<br/><span className="text-xs text-slate-500">{b.roomType} · #{b.roomNumber}</span></td>
          <td className="px-5 py-4">{formatDate(b.checkIn)} – {formatDate(b.checkOut)}</td>
          <td className="px-5 py-4 font-semibold">{money(b.totalAmount || b.amount)}</td>
          <td className="px-5 py-4"><StatusPill>{b.paymentStatus || b.payment}</StatusPill></td>
          <td className="px-5 py-4"><StatusPill>{b.bookingStatus || b.status}</StatusPill></td>
        </tr>
      ))}
    />
  );
}

// =============================================================================
// 5. ADMIN USERS PAGE
// =============================================================================
export function UsersAdmin() {
  const [users,      setUsers]      = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const loadUsers = async (p = 1, s = search) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getUsers({ page: p, limit: 15, search: s });
      setUsers(res.users || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(1, search); }, [search]);

  const rows = users.map((u) => [
    <span className="font-semibold text-slate-900" key={u._id}>{u.name}</span>,
    u.email || u.phone || '—',
    <span className="capitalize font-medium text-slate-700" key={`r-${u._id}`}>{u.role === 'admin' ? 'Administrator' : u.role === 'hotel_admin' ? 'Hotel Admin' : 'Customer'}</span>,
    <StatusPill key={`st-${u._id}`}>{u.status}</StatusPill>,
  ]);

  return (
    <>
      <SectionTitle
        eyebrow="User Management"
        title="Users"
        description={`Showing ${pagination.total.toLocaleString('en-IN')} registered users from MongoDB.`}
      />

      <div className="mb-5 flex max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
        <Search size={17} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search user name or email"
          className="w-full py-2.5 text-sm outline-none"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500">Loading registered users from database…</p>
      ) : (
        <>
          <Table columns={['Name', 'Email / Phone', 'Role', 'Status']} rows={rows.map((cells, idx) => (
            <tr key={idx}>{cells.map((cell, k) => <td key={k} className="px-5 py-4">{cell}</td>)}</tr>
          ))} />
          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>Total {pagination.total} users (Page {pagination.page} of {pagination.pages})</span>
              <div className="flex gap-2">
                <button disabled={pagination.page <= 1} onClick={() => loadUsers(pagination.page - 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Previous</button>
                <button disabled={pagination.page >= pagination.pages} onClick={() => loadUsers(pagination.page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// =============================================================================
// 6. ADMIN PRICING PAGE
// =============================================================================
export function PricingAdmin() {
  const [pricing,    setPricing]    = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const loadPricing = async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getPricing({ page: p, limit: 15 });
      setPricing(res.pricing || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load pricing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPricing(1); }, []);

  return (
    <>
      <SectionTitle eyebrow="AI pricing" title="Dynamic Pricing" description="Real-time base prices vs current dynamic prices computed by the pricing service." />

      {error && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500">Loading dynamic pricing data from database…</p>
      ) : (
        <>
          <Table
            columns={['Hotel', 'Room type', 'Base price', 'Demand', 'Occupancy', 'Dynamic price', 'Status']}
            rows={pricing.map((row, idx) => (
              <tr key={idx}>
                <td className="px-5 py-4 font-semibold text-slate-900">{row.hotel}</td>
                <td className="px-5 py-4">{row.room}</td>
                <td className="px-5 py-4">{money(row.base)}</td>
                <td className="px-5 py-4"><StatusPill>{row.demand}</StatusPill></td>
                <td className="px-5 py-4">{row.occupancy}%</td>
                <td className="px-5 py-4 font-bold text-indigo-700">{money(row.dynamic)}</td>
                <td className="px-5 py-4"><StatusPill>{row.status}</StatusPill></td>
              </tr>
            ))}
          />
          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>Total {pagination.total} room pricing records (Page {pagination.page} of {pagination.pages})</span>
              <div className="flex gap-2">
                <button disabled={pagination.page <= 1} onClick={() => loadPricing(pagination.page - 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Previous</button>
                <button disabled={pagination.page >= pagination.pages} onClick={() => loadPricing(pagination.page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// =============================================================================
// ANALYTICS & SETTINGS
// =============================================================================
export function AnalyticsAdmin() {
  return (
    <>
      <SectionTitle eyebrow="Performance" title="Analytics" description="Booking and occupancy trends." />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Daily bookings">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsData}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={chartStyle} />
              <YAxis tick={chartStyle} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Occupancy rate">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analyticsData}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={chartStyle} />
              <YAxis tick={chartStyle} />
              <Tooltip />
              <Line dataKey="occupancy" stroke="#059669" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}

export function SettingsAdmin() {
  return (
    <>
      <SectionTitle eyebrow="Administration" title="Settings" description="Configure system preferences." />
      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Notification and pricing preferences are integrated with the live backend database.
      </div>
    </>
  );
}

// =============================================================================
// LOGIN ACTIVITY ADMIN
// =============================================================================
export function LoginActivityAdmin() {
  const [filters, setFilters] = useState({ search: '', method: '', status: '', date: '', page: 1 });
  const [state, setState] = useState({ loading: true, error: '', data: [], pagination: null });
  useEffect(() => {
    let alive = true;
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    adminApi.getLoginActivity({ ...filters, limit: 15 })
      .then((result) => alive && setState({ loading: false, error: '', data: result.data, pagination: result.pagination }))
      .catch((error) => alive && setState({ loading: false, error: error.response?.data?.message || 'Unable to load login activity.', data: [], pagination: null }));
    return () => { alive = false; };
  }, [filters]);

  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? value : 1 }));

  const rows = state.data.map((row) => (
    <tr key={row._id}>
      <td className="px-5 py-4 font-semibold">{row.name || 'Unknown user'}</td>
      <td className="px-5 py-4 text-slate-500">{row.email || '—'}</td>
      <td className="px-5 py-4 text-slate-500">{row.phone || '—'}</td>
      <td className="px-5 py-4"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{row.loginMethod === 'MOBILE_OTP' ? 'Mobile OTP' : 'Email'}</span></td>
      <td className="px-5 py-4">{new Date(row.loginTime).toLocaleString()}</td>
      <td className="px-5 py-4"><ActivityStatus row={row}/></td>
    </tr>
  ));
  if (!rows.length && !state.loading) rows.push(<tr key="empty"><td colSpan="6" className="px-5 py-10 text-center text-slate-500">No login activity matches these filters.</td></tr>);

  return (
    <>
      <SectionTitle eyebrow="Authentication" title="Login Activity" description="Live database records only. Search and filter historical successful and failed sign-in attempts."/>
      <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input value={filters.search} onChange={(e) => update('search', e.target.value)} placeholder="Search name, email or mobile" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-indigo-500"/>
        <select value={filters.method} onChange={(e) => update('method', e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">All methods</option><option value="EMAIL">Email</option><option value="MOBILE_OTP">Mobile OTP</option></select>
        <select value={filters.status} onChange={(e) => update('status', e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">All statuses</option><option value="SUCCESS">Successful</option><option value="FAILED">Failed</option><option value="ACTIVE">Active</option></select>
        <input type="date" value={filters.date} onChange={(e) => update('date', e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"/>
      </div>
      {state.error && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.error}</p>}
      {state.loading ? <p className="rounded-xl bg-white p-8 text-center text-slate-500">Loading login activity…</p> : <><Table columns={['User','Email','Mobile','Login method','Login time','Status']} rows={rows}/>{state.pagination && <div className="mt-4 flex items-center justify-between text-sm text-slate-500"><span>{state.pagination.total} records</span><div className="flex gap-2"><button disabled={state.pagination.page <= 1} onClick={() => update('page', state.pagination.page - 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Previous</button><button disabled={state.pagination.page >= state.pagination.pages} onClick={() => update('page', state.pagination.page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Next</button></div></div>}</>}
    </>
  );
}

function ActivityStatus({ row }) {
  const label = row.status === 'FAILED' ? 'Failed' : !row.logoutTime ? 'Active' : 'Logged out';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${label === 'Failed' ? 'bg-rose-50 text-rose-700' : label === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{label}</span>;
}


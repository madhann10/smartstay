import {
  AlertCircle,
  BarChart3,
  BedDouble,
  Building2,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Edit2,
  Eye,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { money, SectionTitle, StatusPill, Table } from '../../components/Ui';

const chartStyle = { fontSize: 12, fill: '#64748b' };

const Stat = ({ label, value, Icon, color = 'indigo' }) => {
  const bgClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className={`rounded-lg p-2.5 ${bgClasses[color] || bgClasses.indigo}`}>
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h3 className="font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </section>
);

// =============================================================================
// 1. ADMIN OVERVIEW
// =============================================================================
export function AdminOverview() {
  const [data, setData] = useState({ loading: true, error: '', stats: null, recentBookings: [] });

  const fetchOverview = async () => {
    setData((d) => ({ ...d, loading: true, error: '' }));
    try {
      const res = await adminApi.getOverviewStats();
      setData({
        loading: false,
        error: '',
        stats: res.stats,
        recentBookings: res.recentBookings || [],
      });
    } catch (e) {
      console.error('Failed to load overview data:', e);
      const isNetworkErr = !e.response;
      const isAuthErr = e.response?.status === 401 || e.response?.status === 403;
      const msg = isAuthErr
        ? 'Admin authentication required or session expired. Please sign in.'
        : isNetworkErr
        ? 'Unable to connect to the server. Please check that the backend is running.'
        : (e.response?.data?.message || 'Server error loading operational overview.');
      setData({ loading: false, error: msg, stats: null, recentBookings: [] });
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const stats = data.stats;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <SectionTitle
          eyebrow="Overview"
          title="Good morning, Administrator"
          description="Live operational performance and real-time statistics from SmartStay's MongoDB database."
        />
        <button
          onClick={fetchOverview}
          disabled={data.loading}
          className="self-start sm:self-center flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={data.loading ? 'animate-spin' : ''} />
          Refresh Stats
        </button>
      </div>

      {data.error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold text-rose-900">Unable to load live overview</p>
                <p className="mt-1 text-rose-700">{data.error}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchOverview}
                className="rounded-lg bg-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-800"
              >
                Retry
              </button>
              <a
                href="/login"
                className="rounded-lg border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
              >
                Sign In Again
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Top 4 Real Statistics Cards */}
      {data.loading && !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
              <div className="mt-3 h-8 w-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Total hotels"
            value={stats.totalHotels.toLocaleString('en-IN')}
            Icon={Building2}
            color="indigo"
          />
          <Stat
            label="Available rooms"
            value={stats.availableRooms.toLocaleString('en-IN')}
            Icon={BedDouble}
            color="emerald"
          />
          <Stat
            label="Today’s bookings"
            value={stats.todaysBookings.toLocaleString('en-IN')}
            Icon={CalendarCheck}
            color="blue"
          />
          <Stat
            label="Total revenue"
            value={money(stats.totalRevenue)}
            Icon={CircleDollarSign}
            color="violet"
          />
        </div>
      ) : null}

      <LoginMetrics />

      {/* Recent Bookings Table */}
      <div className="mt-8">
        <SectionTitle eyebrow="Latest activity" title="Recent bookings" description="Latest customer reservations recorded in MongoDB." />
        {data.loading && !data.recentBookings.length ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            <Loader2 className="mx-auto mb-2 animate-spin text-indigo-600" size={24} />
            Loading recent bookings…
          </div>
        ) : (
          <BookingsTable bookings={data.recentBookings} onRefresh={fetchOverview} />
        )}
      </div>
    </>
  );
}

// =============================================================================
// LOGIN METRICS (AUTHENTICATION ANALYTICS)
// =============================================================================
function LoginMetrics() {
  const [state, setState] = useState({ loading: true, error: '', stats: null, active: null, trend: [] });

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const [stats, active, trend] = await Promise.all([
        adminApi.getLoginStatistics(),
        adminApi.getActiveUsers(),
        adminApi.getDailyLoginStatistics({ days: 7 }),
      ]);
      const grouped = Object.values(
        (trend?.data || []).reduce((all, row) => {
          const key = row._id.date;
          all[key] ||= { date: key, email: 0, otp: 0 };
          all[key][row._id.method === 'EMAIL' ? 'email' : 'otp'] = row.count;
          return all;
        }, {})
      );
      setState({ loading: false, error: '', stats, active, trend: grouped });
    } catch (err) {
      console.error('LoginMetrics error:', err);
      const isAuth = err?.response?.status === 401;
      setState({
        loading: false,
        error: isAuth
          ? 'Login analytics require authenticated admin session.'
          : 'Unable to connect to live authentication analytics.',
        stats: null,
        active: null,
        trend: [],
      });
    }
  };

  useEffect(() => {
    let alive = true;
    load();
    const timer = setInterval(() => {
      if (alive) load();
    }, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  if (state.loading && !state.stats) {
    return (
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 flex items-center gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={18} />
        <span>Loading live authentication analytics…</span>
      </div>
    );
  }

  if (state.error || !state.stats) {
    return (
      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span>{state.error || 'Login analytics will appear when the authenticated admin APIs are available.'}</span>
        <button
          onClick={load}
          className="self-start sm:self-center rounded-lg bg-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="mt-8">
      <SectionTitle
        eyebrow="Login activity"
        title="Authentication at a glance"
        description={`Live data refreshes every 60 seconds. Active status uses a ${state.active?.activeSessionTimeoutMinutes || 30}-minute session timeout.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Currently active" value={state.active?.activeUsers ?? 0} Icon={Users} color="emerald" />
        <Stat label="Logins today" value={state.stats.totalLoginsToday} Icon={ShieldCheck} color="indigo" />
        <Stat label="Email logins" value={state.stats.emailLoginsToday} Icon={Mail} color="blue" />
        <Stat label="Mobile OTP" value={state.stats.mobileOtpLoginsToday} Icon={Phone} color="violet" />
        <Stat label="Failed attempts" value={state.stats.failedAttemptsToday} Icon={BarChart3} color="indigo" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Login methods" subtitle="Proportion of email vs mobile OTP logins today">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Email', value: state.stats.emailLoginsToday || (state.stats.totalLoginsToday ? 0 : 1) },
                  { name: 'Mobile OTP', value: state.stats.mobileOtpLoginsToday },
                ]}
                dataKey="value"
                outerRadius={85}
                label
              >
                {['#4f46e5', '#06b6d4'].map((fill) => (
                  <Cell key={fill} fill={fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Login trend (Last 7 Days)" subtitle="Daily successful authentication count">
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
// 2. ADMIN HOTELS PAGE & CRUD MODALS
// =============================================================================
export function HotelsAdmin() {
  const [hotels, setHotels] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add / Edit Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState('');

  // Delete Confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // View Details Modal
  const [detailHotel, setDetailHotel] = useState(null);

  const initialForm = {
    name: '',
    city: '',
    state: '',
    address: '',
    propertyType: 'Hotel',
    basePrice: '2500',
    rating: '4.5',
    description: '',
    amenities: 'Wi-Fi, Air Conditioning, Breakfast',
  };

  const [form, setForm] = useState(initialForm);

  const loadHotels = async (p = 1, s = search) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getHotels({ page: p, limit: 15, search: s });
      setHotels(res.hotels || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load hotels from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels(1, search);
  }, [search]);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setForm(initialForm);
    setFormErr('');
    setShowModal(true);
  };

  const openEditModal = (hotel) => {
    setIsEditing(true);
    setCurrentId(hotel._id);
    setForm({
      name: hotel.name || '',
      city: hotel.location?.city || '',
      state: hotel.location?.state || '',
      address: hotel.location?.address || '',
      propertyType: hotel.propertyType || 'Hotel',
      basePrice: hotel.rooms?.[0]?.basePrice ? String(hotel.rooms[0].basePrice) : '2500',
      rating: hotel.rating ? String(hotel.rating) : '4.5',
      description: hotel.description || '',
      amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join(', ') : hotel.amenities || '',
    });
    setFormErr('');
    setShowModal(true);
  };

  const handleSaveHotel = async (e) => {
    e.preventDefault();
    setFormErr('');
    setSubmitting(true);
    try {
      if (isEditing) {
        await adminApi.updateHotel(currentId, form);
      } else {
        await adminApi.createHotel(form);
      }
      setShowModal(false);
      loadHotels(pagination.page, search);
    } catch (e) {
      setFormErr(e?.response?.data?.message || 'Failed to save hotel.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHotel = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteHotel(deleteTarget._id);
      setDeleteTarget(null);
      loadHotels(pagination.page, search);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete hotel.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <SectionTitle
        eyebrow="Inventory"
        title="Hotels"
        description={`Showing ${pagination.total.toLocaleString('en-IN')} hotel records from MongoDB.`}
        action={
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus size={16} /> Add Hotel
          </button>
        }
      />

      {/* Search box */}
      <div className="mb-5 flex max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm">
        <Search size={17} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search hotel name, city or location"
          className="w-full py-2.5 text-sm outline-none"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          <Loader2 className="mx-auto mb-2 animate-spin text-indigo-600" size={24} />
          Loading hotels from database…
        </div>
      ) : (
        <>
          <Table
            columns={['Hotel', 'Location', 'Rating', 'Rooms', 'Starting Price', 'Type', 'Actions']}
            rows={hotels.map((h) => (
              <tr key={h._id} className="hover:bg-slate-50/60 transition">
                <td className="px-5 py-4 font-semibold text-slate-900">{h.name}</td>
                <td className="px-5 py-4 text-slate-600">
                  {h.location?.city || ''}
                  {h.location?.state ? `, ${h.location.state}` : ''}
                </td>
                <td className="px-5 py-4 text-amber-600 font-medium">★ {h.rating || 4.5}</td>
                <td className="px-5 py-4">{h.rooms ? h.rooms.length : 0} rooms</td>
                <td className="px-5 py-4 font-semibold">{money(h.rooms?.[0]?.basePrice || 2500)}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {h.propertyType || 'Hotel'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDetailHotel(h)}
                      title="View Details"
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => openEditModal(h)}
                      title="Edit Hotel"
                      className="rounded p-1.5 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(h)}
                      title="Delete Hotel"
                      className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          />

          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>
                Total {pagination.total} hotels (Page {pagination.page} of {pagination.pages})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadHotels(pagination.page - 1)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 shadow-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadHotels(pagination.page + 1)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 shadow-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Hotel Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Hotel Details' : '+ Add New Hotel / Homestay'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            {formErr && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{formErr}</p>}
            <form onSubmit={handleSaveHotel} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500">HOTEL NAME *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Royal Heritage Resort"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">CITY *</label>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Jaipur"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">STATE</label>
                  <input
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="e.g. Rajasthan"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500">ADDRESS *</label>
                <input
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. Amer Road"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">PROPERTY TYPE</label>
                  <select
                    value={form.propertyType}
                    onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-indigo-500"
                  >
                    <option>Hotel</option>
                    <option>Homestay</option>
                    <option>Boutique</option>
                    <option>Resort</option>
                    <option>Villa</option>
                    <option>Heritage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">STARTING PRICE (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">RATING</label>
                  <input
                    type="number"
                    step="0.1"
                    max="5"
                    min="1"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500">AMENITIES (COMMA-SEPARATED)</label>
                <input
                  value={form.amenities}
                  onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                  placeholder="Wi-Fi, Air Conditioning, Swimming Pool"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500">DESCRIPTION</label>
                <textarea
                  rows="2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the property"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Hotel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Hotel</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <span className="font-semibold">{deleteTarget.name}</span>? This will also remove its rooms from MongoDB.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDeleteHotel}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete Hotel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Hotel Details Modal */}
      {detailHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{detailHotel.name}</h3>
                <p className="text-xs text-slate-500">
                  {detailHotel.location?.city}, {detailHotel.location?.state} · {detailHotel.propertyType}
                </p>
              </div>
              <button onClick={() => setDetailHotel(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="font-semibold text-slate-700">Address: </span>
                <span className="text-slate-600">{detailHotel.location?.address}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Rating: </span>
                <span className="text-amber-600 font-bold">★ {detailHotel.rating}</span> ({detailHotel.reviewCount || 0} reviews)
              </div>
              <div>
                <span className="font-semibold text-slate-700">Total Rooms: </span>
                <span className="text-slate-600">{detailHotel.rooms?.length || 0}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Amenities: </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(detailHotel.amenities || []).map((a, i) => (
                    <span key={i} className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              {detailHotel.description && (
                <div>
                  <span className="font-semibold text-slate-700">Description: </span>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{detailHotel.description}</p>
                </div>
              )}
            </div>
            <div className="mt-5 border-t pt-3 flex justify-end">
              <button
                onClick={() => setDetailHotel(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// =============================================================================
// 3. ADMIN ROOMS PAGE & CRUD MODALS
// =============================================================================
export function RoomsAdmin() {
  const [rooms, setRooms] = useState([]);
  const [hotelsList, setHotelsList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add / Edit Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const initialForm = {
    hotelId: '',
    roomNumber: '',
    type: 'Deluxe',
    capacity: '2',
    basePrice: '3500',
    amenities: 'Wi-Fi, Air Conditioning',
    isAvailable: true,
  };

  const [form, setForm] = useState(initialForm);

  const loadRooms = async (p = 1, s = search) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getRooms({ page: p, limit: 15, search: s });
      setRooms(res.rooms || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load rooms from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms(1, search);
  }, [search]);

  const openAddModal = async () => {
    setIsEditing(false);
    setCurrentRoom(null);
    setForm(initialForm);
    setFormErr('');
    setShowModal(true);
    try {
      const res = await adminApi.getHotels({ limit: 100 });
      setHotelsList(res.hotels || []);
      if (res.hotels?.length > 0) {
        setForm((f) => ({ ...f, hotelId: res.hotels[0]._id }));
      }
    } catch {}
  };

  const openEditModal = (room) => {
    setIsEditing(true);
    setCurrentRoom(room);
    setForm({
      hotelId: room.hotelId,
      roomNumber: room.roomNumber,
      type: room.type,
      capacity: String(room.capacity || 2),
      basePrice: String(room.basePrice),
      amenities: 'Wi-Fi, Air Conditioning',
      isAvailable: room.isAvailable,
    });
    setFormErr('');
    setShowModal(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setFormErr('');
    setSubmitting(true);
    try {
      if (isEditing) {
        await adminApi.updateRoom(currentRoom.hotelId, currentRoom._id, form);
      } else {
        await adminApi.createRoom(form);
      }
      setShowModal(false);
      loadRooms(pagination.page, search);
    } catch (e) {
      setFormErr(e?.response?.data?.message || 'Failed to save room.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteRoom(deleteTarget.hotelId, deleteTarget._id);
      setDeleteTarget(null);
      loadRooms(pagination.page, search);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete room.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleAvailability = async (room) => {
    try {
      await adminApi.updateRoom(room.hotelId, room._id, { isAvailable: !room.isAvailable });
      loadRooms(pagination.page, search);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to toggle room availability.');
    }
  };

  return (
    <>
      <SectionTitle
        eyebrow="Inventory"
        title="Rooms"
        description={`Showing ${pagination.total.toLocaleString('en-IN')} rooms across all hotels.`}
        action={
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus size={16} /> Add Room
          </button>
        }
      />

      <div className="mb-5 flex max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm">
        <Search size={17} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search room number, hotel or type"
          className="w-full py-2.5 text-sm outline-none"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          <Loader2 className="mx-auto mb-2 animate-spin text-indigo-600" size={24} />
          Loading rooms from database…
        </div>
      ) : (
        <>
          <Table
            columns={['Room #', 'Hotel', 'Type', 'Base Price', 'Dynamic Price', 'Availability', 'Actions']}
            rows={rooms.map((r) => (
              <tr key={r._id} className="hover:bg-slate-50/60 transition">
                <td className="px-5 py-4 font-semibold text-slate-900">{r.roomNumber}</td>
                <td className="px-5 py-4 text-slate-600">{r.hotelName || '—'}</td>
                <td className="px-5 py-4">{r.type}</td>
                <td className="px-5 py-4 font-medium">{money(r.basePrice)}</td>
                <td className="px-5 py-4 font-semibold text-indigo-700">{money(r.dynamicPrice)}</td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggleAvailability(r)}
                    title="Click to toggle availability"
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      r.isAvailable
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${r.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {r.isAvailable ? 'Available' : 'Occupied'}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(r)}
                      title="Edit Room"
                      className="rounded p-1.5 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(r)}
                      title="Delete Room"
                      className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          />

          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>
                Total {pagination.total} rooms (Page {pagination.page} of {pagination.pages})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadRooms(pagination.page - 1)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 shadow-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadRooms(pagination.page + 1)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 shadow-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Room Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? `Edit Room ${currentRoom?.roomNumber}` : '+ Add New Room to Hotel'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            {formErr && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{formErr}</p>}
            <form onSubmit={handleSaveRoom} className="mt-4 space-y-3">
              {!isEditing && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500">SELECT HOTEL *</label>
                  <select
                    required
                    value={form.hotelId}
                    onChange={(e) => setForm({ ...form, hotelId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                  >
                    {hotelsList.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.name} ({h.location?.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">ROOM NUMBER *</label>
                  <input
                    required
                    value={form.roomNumber}
                    onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                    placeholder="e.g. 204"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">ROOM TYPE *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                  >
                    <option>Single</option>
                    <option>Double</option>
                    <option>Suite</option>
                    <option>Deluxe</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500">CAPACITY (GUESTS)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">BASE PRICE (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                  />
                </div>
              </div>
              <div className="pt-1">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>Mark as currently available for bookings</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Room</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete Room #{deleteTarget.roomNumber} from {deleteTarget.hotelName}? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDeleteRoom}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete Room'}
              </button>
            </div>
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
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookings = async (p = 1, s = search) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getBookings({ page: p, limit: 15, search: s });
      setBookings(res.bookings || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load bookings from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings(1, search);
  }, [search]);

  return (
    <>
      <SectionTitle
        eyebrow="Reservations"
        title="Bookings"
        description={`Showing ${pagination.total.toLocaleString('en-IN')} customer bookings recorded in MongoDB.`}
      />

      <div className="mb-5 flex max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm">
        <Search size={17} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search booking ID, customer or hotel"
          className="w-full py-2.5 text-sm outline-none"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          <Loader2 className="mx-auto mb-2 animate-spin text-indigo-600" size={24} />
          Loading bookings from database…
        </div>
      ) : (
        <>
          <BookingsTable bookings={bookings} onRefresh={() => loadBookings(pagination.page, search)} />
          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>
                Total {pagination.total} bookings (Page {pagination.page} of {pagination.pages})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadBookings(pagination.page - 1)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 shadow-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadBookings(pagination.page + 1)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 shadow-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function BookingsTable({ bookings, onRefresh }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return String(d);
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    setActionLoading(true);
    try {
      await adminApi.updateBookingStatus(bookingId, status);
      if (onRefresh) onRefresh();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to update booking status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setActionLoading(true);
    try {
      await adminApi.cancelBooking(cancellingBooking.bookingId || cancellingBooking._id);
      setCancellingBooking(null);
      if (onRefresh) onRefresh();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!bookings || bookings.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        No booking records found.
      </div>
    );
  }

  return (
    <>
      <Table
        columns={['Booking ID', 'Customer', 'Hotel & Room', 'Stay', 'Amount', 'Payment', 'Status', 'Actions']}
        rows={bookings.map((b) => (
          <tr key={b._id || b.bookingId} className="hover:bg-slate-50/60 transition">
            <td className="px-5 py-4 font-semibold text-indigo-600">{b.bookingId || b.id}</td>
            <td className="px-5 py-4">
              <span className="font-medium text-slate-900">{b.customerSnapshot?.name || b.customer || '—'}</span>
              <br />
              <span className="text-xs text-slate-400">{b.customerSnapshot?.email}</span>
            </td>
            <td className="px-5 py-4">
              <span className="font-medium text-slate-900">{b.hotelSnapshot?.name || b.hotel}</span>
              <br />
              <span className="text-xs text-slate-500">
                {b.roomType} · #{b.roomNumber}
              </span>
            </td>
            <td className="px-5 py-4 text-xs font-medium text-slate-600">
              {formatDate(b.checkIn)} – {formatDate(b.checkOut)}
            </td>
            <td className="px-5 py-4 font-semibold text-slate-900">{money(b.totalAmount || b.amount)}</td>
            <td className="px-5 py-4">
              <StatusPill>{b.paymentStatus || b.payment}</StatusPill>
            </td>
            <td className="px-5 py-4">
              <StatusPill>{b.bookingStatus || b.status}</StatusPill>
            </td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedBooking(b)}
                  title="View Invoice & Details"
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  <Eye size={16} />
                </button>
                {b.bookingStatus !== 'Cancelled' && (
                  <button
                    onClick={() => setCancellingBooking(b)}
                    title="Cancel Booking"
                    className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      />

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Booking #{selectedBooking.bookingId}</h3>
                <p className="text-xs text-slate-500">Invoice: {selectedBooking.invoiceNumber || '—'}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 pb-2 border-b">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Guest</span>
                  <p className="font-semibold text-slate-900">{selectedBooking.customerSnapshot?.name || '—'}</p>
                  <p className="text-xs text-slate-500">{selectedBooking.customerSnapshot?.email}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Hotel</span>
                  <p className="font-semibold text-slate-900">{selectedBooking.hotelSnapshot?.name || '—'}</p>
                  <p className="text-xs text-slate-500">
                    {selectedBooking.roomType} · Room #{selectedBooking.roomNumber}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pb-2 border-b">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Dates</span>
                  <p className="text-xs text-slate-700">Check-in: {formatDate(selectedBooking.checkIn)}</p>
                  <p className="text-xs text-slate-700">Check-out: {formatDate(selectedBooking.checkOut)}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Stay Info</span>
                  <p className="text-xs text-slate-700">
                    {selectedBooking.nights || 1} nights · {selectedBooking.guests || 1} guests
                  </p>
                </div>
              </div>
              <div className="pb-2 border-b">
                <span className="text-xs font-semibold text-slate-400 uppercase">Payment Summary</span>
                <div className="mt-1 flex justify-between text-xs text-slate-600">
                  <span>Subtotal:</span>
                  <span>{money(selectedBooking.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Tax (12%):</span>
                  <span>{money(selectedBooking.tax)}</span>
                </div>
                <div className="mt-1 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Amount:</span>
                  <span>{money(selectedBooking.totalAmount)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Status</span>
                  <div className="mt-1">
                    <StatusPill>{selectedBooking.bookingStatus}</StatusPill>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Update status:</span>
                  <select
                    value={selectedBooking.bookingStatus}
                    onChange={(e) => {
                      handleUpdateStatus(selectedBooking.bookingId || selectedBooking._id, e.target.value);
                      setSelectedBooking({ ...selectedBooking, bookingStatus: e.target.value });
                    }}
                    className="rounded border border-slate-200 px-2 py-1 text-xs outline-indigo-500"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Checked In">Checked In</option>
                    <option value="Checked Out">Checked Out</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Cancel Reservation</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to cancel booking #{cancellingBooking.bookingId} for{' '}
              {cancellingBooking.customerSnapshot?.name}? This status change will persist in MongoDB.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                disabled={actionLoading}
                onClick={handleCancelBooking}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling…' : 'Cancel Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// =============================================================================
// 5. ADMIN USERS PAGE
// =============================================================================
export function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async (p = 1, s = search) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getUsers({ page: p, limit: 15, search: s });
      setUsers(res.users || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load users from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1, search);
  }, [search]);

  return (
    <>
      <SectionTitle
        eyebrow="User Management"
        title="Users"
        description={`Showing ${pagination.total.toLocaleString('en-IN')} registered users from MongoDB.`}
      />

      <div className="mb-5 flex max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm">
        <Search size={17} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search user name, email or phone"
          className="w-full py-2.5 text-sm outline-none"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          <Loader2 className="mx-auto mb-2 animate-spin text-indigo-600" size={24} />
          Loading registered users from database…
        </div>
      ) : (
        <>
          <Table
            columns={['Name', 'Email / Contact', 'Role', 'Status', 'Registered Date']}
            rows={users.map((u) => (
              <tr key={u._id} className="hover:bg-slate-50/60 transition">
                <td className="px-5 py-4 font-semibold text-slate-900">{u.name}</td>
                <td className="px-5 py-4 text-slate-600">
                  <span>{u.email || '—'}</span>
                  {u.phone && <span className="block text-xs text-slate-400">{u.phone}</span>}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      u.role === 'admin'
                        ? 'bg-purple-50 text-purple-700'
                        : u.role === 'hotel_admin'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {u.role === 'admin' ? 'Administrator' : u.role === 'hotel_admin' ? 'Hotel Admin' : 'Customer'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      u.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {u.status || 'Offline'}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                </td>
              </tr>
            ))}
          />

          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>
                Total {pagination.total} users (Page {pagination.page} of {pagination.pages})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadUsers(pagination.page - 1)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 shadow-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadUsers(pagination.page + 1)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 shadow-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// =============================================================================
// 6. ADMIN PRICING PAGE & EDIT PRICE MODAL
// =============================================================================
export function PricingAdmin() {
  const [pricing, setPricing] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Price modal state
  const [editPriceTarget, setEditPriceTarget] = useState(null);
  const [newBasePrice, setNewBasePrice] = useState('');
  const [submittingPrice, setSubmittingPrice] = useState(false);
  const [priceErr, setPriceErr] = useState('');

  const loadPricing = async (p = 1, s = search) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getPricing({ page: p, limit: 15, search: s });
      setPricing(res.pricing || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load dynamic pricing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricing(1, search);
  }, [search]);

  const openPriceModal = (item) => {
    setEditPriceTarget(item);
    setNewBasePrice(String(item.base));
    setPriceErr('');
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!editPriceTarget) return;
    setSubmittingPrice(true);
    setPriceErr('');
    try {
      await adminApi.updateRoomPrice(editPriceTarget.hotelId, editPriceTarget.roomId, {
        basePrice: Number(newBasePrice),
      });
      setEditPriceTarget(null);
      loadPricing(pagination.page, search);
    } catch (err) {
      setPriceErr(err?.response?.data?.message || 'Failed to update room price.');
    } finally {
      setSubmittingPrice(false);
    }
  };

  return (
    <>
      <SectionTitle
        eyebrow="Dynamic pricing"
        title="Dynamic Pricing Management"
        description="Real-time base prices vs dynamic prices computed from demand factors. Pricing changes persist to MongoDB."
      />

      <div className="mb-5 flex max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm">
        <Search size={17} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search hotel, room type or demand"
          className="w-full py-2.5 text-sm outline-none"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          <Loader2 className="mx-auto mb-2 animate-spin text-indigo-600" size={24} />
          Loading dynamic pricing data from database…
        </div>
      ) : (
        <>
          <Table
            columns={['Hotel', 'Room # / Type', 'Base Price', 'Demand', 'Occupancy', 'Dynamic Price', 'Status', 'Action']}
            rows={pricing.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition">
                <td className="px-5 py-4 font-semibold text-slate-900">{row.hotel}</td>
                <td className="px-5 py-4 text-slate-700">
                  {row.room} {row.roomNumber ? `(#${row.roomNumber})` : ''}
                </td>
                <td className="px-5 py-4 font-medium text-slate-700">{money(row.base)}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      row.demand === 'High'
                        ? 'bg-rose-50 text-rose-700'
                        : row.demand === 'Medium'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {row.demand}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-600">{row.occupancy}%</td>
                <td className="px-5 py-4 font-bold text-indigo-700">{money(row.dynamic)}</td>
                <td className="px-5 py-4">
                  <StatusPill>{row.status}</StatusPill>
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => openPriceModal(row)}
                    className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 shadow-sm"
                  >
                    <Edit2 size={13} /> Edit Price
                  </button>
                </td>
              </tr>
            ))}
          />

          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>
                Total {pagination.total} room pricing records (Page {pagination.page} of {pagination.pages})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadPricing(pagination.page - 1)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 shadow-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => loadPricing(pagination.page + 1)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 shadow-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Room Base Price Modal */}
      {editPriceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Adjust Base Room Price</h3>
              <button onClick={() => setEditPriceTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            {priceErr && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{priceErr}</p>}
            <form onSubmit={handleSavePrice} className="mt-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{editPriceTarget.hotel}</p>
                <p className="text-xs text-slate-500">
                  {editPriceTarget.room} {editPriceTarget.roomNumber ? `(#${editPriceTarget.roomNumber})` : ''}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Current Base Price:</span>
                  <span className="font-semibold">{money(editPriceTarget.base)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Dynamic Price:</span>
                  <span className="font-semibold text-indigo-600">{money(editPriceTarget.dynamic)}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500">NEW BASE PRICE (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newBasePrice}
                  onChange={(e) => setNewBasePrice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
                />
                <p className="mt-1 text-xs text-slate-400">Dynamic price will recalculate automatically with taxes and multipliers.</p>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditPriceTarget(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={submittingPrice}
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingPrice ? 'Saving…' : 'Save Price to DB'}
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
// 7. REAL DATABASE ANALYTICS
// =============================================================================
export function AnalyticsAdmin() {
  const [data, setData] = useState({ loading: true, error: '', analytics: null });

  const loadAnalytics = async () => {
    setData((d) => ({ ...d, loading: true, error: '' }));
    try {
      const res = await adminApi.getAnalytics();
      setData({ loading: false, error: '', analytics: res.analytics });
    } catch (e) {
      setData({ loading: false, error: e?.response?.data?.message || 'Failed to load live database analytics.', analytics: null });
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const a = data.analytics;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <SectionTitle
          eyebrow="Performance"
          title="Analytics"
          description="Real-time reservation trends, occupancy rates, and revenue metrics calculated directly from MongoDB."
        />
        <button
          onClick={loadAnalytics}
          disabled={data.loading}
          className="self-start sm:self-center flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={data.loading ? 'animate-spin' : ''} />
          Refresh Metrics
        </button>
      </div>

      {data.error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex justify-between items-center">
          <span>{data.error}</span>
          <button onClick={loadAnalytics} className="rounded bg-rose-200 px-3 py-1 font-semibold hover:bg-rose-300">
            Retry
          </button>
        </div>
      )}

      {data.loading && !a ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          <Loader2 className="mx-auto mb-2 animate-spin text-indigo-600" size={24} />
          Aggregating analytics from MongoDB…
        </div>
      ) : a ? (
        <>
          {/* Key Metric Highlights */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <Stat label="Total Bookings" value={a.totalBookings.toLocaleString('en-IN')} Icon={CalendarCheck} color="indigo" />
            <Stat label="Total Paid Revenue" value={money(a.totalRevenue)} Icon={CircleDollarSign} color="emerald" />
            <Stat label="Average Booking Value" value={money(a.avgBookingValue)} Icon={BarChart3} color="blue" />
            <Stat label="Overall Occupancy Rate" value={`${a.occupancyRate}%`} Icon={BedDouble} color="violet" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Daily Booking Volume" subtitle="Number of bookings created by date in MongoDB">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={a.bookingTrend}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={chartStyle} />
                  <YAxis tick={chartStyle} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="bookings" name="Bookings" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Daily Revenue Trend" subtitle="Revenue generated in ₹ from confirmed bookings">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={a.bookingTrend}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={chartStyle} />
                  <YAxis tick={chartStyle} />
                  <Tooltip formatter={(value) => [money(value), 'Revenue']} />
                  <Line dataKey="revenue" name="Revenue (₹)" stroke="#059669" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Top Performing Hotels & Room Types */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-1">Top Performing Hotels</h3>
              <p className="text-xs text-slate-500 mb-4">Ranked by actual customer bookings and revenue</p>
              <div className="space-y-3">
                {(a.topHotels || []).map((h, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2.5 last:border-b-0 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-slate-900">{h.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-indigo-700">{money(h.revenue)}</span>
                      <span className="block text-xs text-slate-400">{h.bookings} bookings</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-1">Room Types Inventory</h3>
              <p className="text-xs text-slate-500 mb-4">Total rooms breakdown across all registered properties</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {(a.roomTypes || []).map((rt, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">{rt.type}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{rt.count.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Rooms available in database</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </>
  );
}

// =============================================================================
// 8. ADMIN SETTINGS PAGE
// =============================================================================
export function SettingsAdmin() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getProfile()
      .then((res) => {
        setProfile(res.admin);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <SectionTitle eyebrow="Administration" title="Settings" description="System configurations and operational parameters." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-600" />
            Administrator Profile
          </h3>
          {loading ? (
            <p className="text-sm text-slate-400">Loading admin profile…</p>
          ) : profile ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Name</span>
                <span className="font-semibold text-slate-900">{profile.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Email Address</span>
                <span className="font-semibold text-slate-900">{profile.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Role</span>
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 uppercase">
                  {profile.role}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Account ID</span>
                <span className="font-mono text-xs text-slate-600">{profile._id}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Administrator profile active.</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-emerald-600" />
            Database &amp; Platform Status
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Database Engine</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                MongoDB Atlas (hotel_booking)
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Active Session Timeout</span>
              <span className="font-semibold text-slate-900">30 minutes</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">OTP Policy Expiry</span>
              <span className="font-semibold text-slate-900">60 seconds</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Pricing Engine</span>
              <span className="font-semibold text-indigo-700">Dynamic AI / ML Integrated</span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// =============================================================================
// 9. LOGIN ACTIVITY ADMIN
// =============================================================================
export function LoginActivityAdmin() {
  const [filters, setFilters] = useState({ search: '', method: '', status: '', date: '', page: 1 });
  const [state, setState] = useState({ loading: true, error: '', data: [], pagination: null });

  useEffect(() => {
    let alive = true;
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    adminApi
      .getLoginActivity({ ...filters, limit: 15 })
      .then((result) => alive && setState({ loading: false, error: '', data: result.data, pagination: result.pagination }))
      .catch(
        (error) =>
          alive &&
          setState({
            loading: false,
            error: error.response?.data?.message || 'Unable to load login activity from database.',
            data: [],
            pagination: null,
          })
      );
    return () => {
      alive = false;
    };
  }, [filters]);

  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? value : 1 }));

  const rows = state.data.map((row) => (
    <tr key={row._id} className="hover:bg-slate-50/60 transition">
      <td className="px-5 py-4 font-semibold text-slate-900">{row.name || 'Unknown user'}</td>
      <td className="px-5 py-4 text-slate-600">{row.email || '—'}</td>
      <td className="px-5 py-4 text-slate-500">{row.phone || '—'}</td>
      <td className="px-5 py-4">
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          {row.loginMethod === 'MOBILE_OTP' ? 'Mobile OTP' : 'Email'}
        </span>
      </td>
      <td className="px-5 py-4 text-xs text-slate-600">{new Date(row.loginTime).toLocaleString('en-IN')}</td>
      <td className="px-5 py-4">
        <ActivityStatus row={row} />
      </td>
    </tr>
  ));

  if (!rows.length && !state.loading) {
    rows.push(
      <tr key="empty">
        <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
          No login activity matches these filters.
        </td>
      </tr>
    );
  }

  return (
    <>
      <SectionTitle
        eyebrow="Authentication"
        title="Login Activity"
        description="Live database records only. Search and filter historical successful and failed sign-in attempts."
      />
      <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <input
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Search name, email or mobile"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-indigo-500"
        />
        <select
          value={filters.method}
          onChange={(e) => update('method', e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All methods</option>
          <option value="EMAIL">Email</option>
          <option value="MOBILE_OTP">Mobile OTP</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => update('status', e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="SUCCESS">Successful</option>
          <option value="FAILED">Failed</option>
          <option value="ACTIVE">Active</option>
        </select>
        <input
          type="date"
          value={filters.date}
          onChange={(e) => update('date', e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      {state.error && <p className="mb-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{state.error}</p>}

      {state.loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          <Loader2 className="mx-auto mb-2 animate-spin text-indigo-600" size={24} />
          Loading login activity from database…
        </div>
      ) : (
        <>
          <Table columns={['User', 'Email', 'Mobile', 'Login method', 'Login time', 'Status']} rows={rows} />
          {state.pagination && state.pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>{state.pagination.total} records</span>
              <div className="flex gap-2">
                <button
                  disabled={state.pagination.page <= 1}
                  onClick={() => update('page', state.pagination.page - 1)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 shadow-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={state.pagination.page >= state.pagination.pages}
                  onClick={() => update('page', state.pagination.page + 1)}
                  className="rounded border border-slate-200 bg-white px-3 py-1.5 shadow-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function ActivityStatus({ row }) {
  const label = row.status === 'FAILED' ? 'Failed' : !row.logoutTime ? 'Active' : 'Logged out';
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        label === 'Failed'
          ? 'bg-rose-50 text-rose-700'
          : label === 'Active'
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {label}
    </span>
  );
}

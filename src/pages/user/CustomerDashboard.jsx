import { CalendarCheck, CreditCard, FileText, Loader2, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '../../components/AppShell';
import { money, SectionTitle, StatusPill, Table } from '../../components/Ui';
import { bookingApi } from '../../services/api';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState('');

  useEffect(() => {
    bookingApi.getBookings()
      .then((data) => { setBookings(data.bookings || []); setLoading(false); })
      .catch((e) => {
        setErr(e?.response?.data?.message || 'Could not load bookings.');
        setLoading(false);
      });
  }, []);

  const upcoming = bookings.filter((b) => b.bookingStatus !== 'Cancelled');
  const next     = upcoming[0];

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <>
      <PublicNav />
      <main className="bg-slate-50 py-10">
        <div className="mx-auto max-w-7xl px-5">

          <SectionTitle
            eyebrow="Welcome back"
            title="My Stays"
            description="Manage your upcoming trips and review past booking activity."
            action={
              <button
                onClick={() => navigate('/profile')}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Edit profile
              </button>
            }
          />

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[
              ['Total bookings',  bookings.length,                             CalendarCheck],
              ['Upcoming stays',  upcoming.length,                             MapPin],
              ['Payment status',  bookings.some((b) => b.paymentStatus === 'Pending') ? 'Action needed' : 'All clear', CreditCard],
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-5">
                <Icon size={20} className="text-indigo-600" />
                <p className="mt-4 text-2xl font-bold">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Next upcoming */}
          {next && (
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-semibold text-slate-500">NEXT UP</p>
              <div className="mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-bold">{next.hotelSnapshot?.name || '—'}</h2>
                  <p className="text-sm text-slate-500">
                    {next.roomType} room · {formatDate(next.checkIn)} – {formatDate(next.checkOut)} · {next.guests} guest{next.guests !== 1 ? 's' : ''}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Booking ID: {next.bookingId}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill>{next.bookingStatus}</StatusPill>
                  <Link
                    to={`/booking/invoice/${next.bookingId}`}
                    className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    <FileText size={13} /> Invoice
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-3 rounded-xl bg-white p-10 text-slate-500">
              <Loader2 size={20} className="animate-spin text-indigo-600" /> Loading bookings…
            </div>
          )}

          {/* Error */}
          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              {err}
            </div>
          )}

          {/* Booking history table */}
          {!loading && !err && (
            <>
              <h2 className="mb-4 text-xl font-bold">Booking history</h2>
              {bookings.length === 0 ? (
                <div className="rounded-xl bg-white p-10 text-center text-slate-500">
                  <p>No bookings yet.</p>
                  <Link to="/hotels" className="mt-3 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white">
                    Browse Hotels
                  </Link>
                </div>
              ) : (
                <Table
                  columns={['Booking ID', 'Hotel', 'Dates', 'Nights', 'Amount', 'Payment', 'Status', 'Invoice']}
                  rows={bookings.map((b) => (
                    <tr key={b._id}>
                      <td className="px-5 py-4 font-semibold text-indigo-600">{b.bookingId}</td>
                      <td className="px-5 py-4">
                        {b.hotelSnapshot?.name || '—'}
                        <br />
                        <span className="text-xs text-slate-500">
                          {b.roomType} · #{b.roomNumber}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {formatDate(b.checkIn)} – {formatDate(b.checkOut)}
                      </td>
                      <td className="px-5 py-4 text-center">{b.nights}</td>
                      <td className="px-5 py-4 font-semibold">{money(b.totalAmount)}</td>
                      <td className="px-5 py-4"><StatusPill>{b.paymentStatus}</StatusPill></td>
                      <td className="px-5 py-4"><StatusPill>{b.bookingStatus}</StatusPill></td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/booking/invoice/${b.bookingId}`}
                          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          <FileText size={13} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                />
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

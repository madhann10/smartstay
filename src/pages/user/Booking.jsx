import { AlertTriangle, CalendarDays, CreditCard, Hotel, Loader2, MapPin, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicNav } from '../../components/AppShell';
import { money } from '../../components/Ui';
import { bookingApi, hotelApi } from '../../services/api';

export default function Booking() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();

  const hotelId = params.get('hotel');
  const roomId  = params.get('room');

  const [hotel,    setHotel]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchErr, setFetchErr] = useState('');
  const [bookErr,  setBookErr]  = useState('');

  const [form, setForm] = useState({
    checkIn:  params.get('checkIn')  || '',
    checkOut: params.get('checkOut') || '',
    guests:   params.get('guests')   || '2',
    name:     '',
  });

  // Fetch hotel from API
  useEffect(() => {
    if (!hotelId) { setFetchErr('No hotel selected.'); setLoading(false); return; }
    hotelApi.getHotelById(hotelId)
      .then((h) => { setHotel(h); setLoading(false); })
      .catch(() => { setFetchErr('Could not load hotel details. Please try again.'); setLoading(false); });
  }, [hotelId]);

  // Select the requested room (or first available)
  const room = useMemo(() => {
    if (!hotel) return null;
    return hotel.rooms?.find((r) => r._id === roomId || r._id?.toString() === roomId)
      || hotel.rooms?.find((r) => r.isAvailable !== false)
      || hotel.rooms?.[0];
  }, [hotel, roomId]);

  // Price calculation (matches backend: pricePerNight × nights + 12% tax)
  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 1;
    const diff = new Date(form.checkOut) - new Date(form.checkIn);
    return Math.max(1, Math.ceil(diff / 86400000));
  }, [form.checkIn, form.checkOut]);

  const nightly  = room ? room.basePrice : 0;
  const subtotal = nightly * nights;
  const tax      = Math.round(subtotal * 0.12);
  const total    = subtotal + tax;

  // Date validation
  const today        = new Date(); today.setHours(0, 0, 0, 0);
  const checkInDate  = new Date(form.checkIn);
  const checkOutDate = new Date(form.checkOut);
  const dateError    = form.checkIn && form.checkOut && checkOutDate <= checkInDate
    ? 'Check-out must be after check-in.'
    : form.checkIn && checkInDate < today
    ? 'Check-in cannot be in the past.'
    : '';

  const submit = async (e) => {
    e.preventDefault();
    if (dateError) return;
    setBookErr('');
    setSubmitting(true);

    try {
      const result = await bookingApi.createBooking({
        hotelId,
        roomId: room._id,
        checkIn:  form.checkIn,
        checkOut: form.checkOut,
        guests:   Number(form.guests),
        guestName: form.name,
      });

      const b = result.booking;
      navigate(
        `/booking/confirmation?bookingId=${b.bookingId}&hotel=${encodeURIComponent(b.hotelSnapshot?.name || hotel.name)}&room=${encodeURIComponent(b.roomType)}&total=${b.totalAmount}&checkIn=${form.checkIn}&checkOut=${form.checkOut}&guests=${form.guests}&nights=${b.nights}`
      );
    } catch (err) {
      setBookErr(err?.response?.data?.message || 'Booking failed. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) return (
    <><PublicNav /><main className="grid min-h-[60vh] place-items-center bg-slate-50"><Loader2 size={32} className="animate-spin text-indigo-600" /></main></>
  );

  if (fetchErr || !hotel) return (
    <><PublicNav /><main className="grid min-h-[60vh] place-items-center bg-slate-50 px-5 text-center">
      <div><AlertTriangle size={32} className="mx-auto mb-3 text-amber-500" /><p className="text-slate-600">{fetchErr || 'Hotel not found.'}</p><Link to="/hotels" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white">Browse Hotels</Link></div>
    </main></>
  );

  if (!room) return (
    <><PublicNav /><main className="grid min-h-[60vh] place-items-center bg-slate-50 px-5 text-center">
      <div><p className="text-slate-600">No available rooms in this hotel.</p><Link to="/hotels" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white">Browse Hotels</Link></div>
    </main></>
  );

  return (
    <>
      <PublicNav />
      <main className="bg-slate-50 py-12">
        <div className="mx-auto grid max-w-5xl gap-7 px-5 lg:grid-cols-[1fr_360px]">

          {/* ── Booking form ─────────────────────────────────────────── */}
          <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Secure your stay</p>
            <h1 className="mt-2 text-2xl font-bold">Review and confirm</h1>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <BookingInput label="Guest name" value={form.name} change={(v) => setForm({ ...form, name: v })} required />
              <BookingInput label="Number of guests" type="number" min="1" max="10" value={form.guests} change={(v) => setForm({ ...form, guests: v })} required />
              <BookingInput label="Check-in date" type="date" value={form.checkIn} change={(v) => setForm({ ...form, checkIn: v })} required />
              <BookingInput label="Check-out date" type="date" value={form.checkOut} change={(v) => setForm({ ...form, checkOut: v })} required />
            </div>

            {dateError && (
              <p className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">⚠ {dateError}</p>
            )}

            {bookErr && (
              <p className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">⚠ {bookErr}</p>
            )}

            <div className="mt-6 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900">
              <p className="flex items-center gap-2">
                <CreditCard size={16} className="text-indigo-600" />
                <strong>DEMO Payment</strong> — This is a college project demo. No real payment is processed.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !!dateError || !form.checkIn || !form.checkOut}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {submitting ? 'Confirming…' : `Confirm Booking · ${money(total)}`}
            </button>
          </form>

          {/* ── Price summary ─────────────────────────────────────────── */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
            {hotel.images?.[0] && (
              <img src={hotel.images[0]} alt={hotel.name} className="h-40 w-full rounded-xl object-cover" />
            )}
            <h2 className="mt-4 font-bold text-slate-900">{hotel.name}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin size={13} /> {hotel.location?.city}{hotel.location?.state ? `, ${hotel.location.state}` : ''}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              <Hotel size={13} className="inline mr-1" />{room.type} room · #{room.roomNumber}
            </p>

            <div className="mt-5 space-y-3 border-y border-slate-100 py-4 text-sm">
              <p className="flex items-center gap-2 text-slate-600">
                <CalendarDays size={15} /> {nights} night{nights !== 1 ? 's' : ''}
                {form.checkIn && form.checkOut && ` · ${form.checkIn} → ${form.checkOut}`}
              </p>
              <p className="flex items-center gap-2 text-slate-600">
                <Users size={15} /> {form.guests} guest{form.guests !== '1' ? 's' : ''}
              </p>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{money(nightly)} × {nights} night{nights !== 1 ? 's' : ''}</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (12%)</span>
                <span>{money(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                <span>Total</span>
                <span className="text-indigo-700">{money(total)}</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Price is calculated by the backend from our database and cannot be changed by the browser.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}

function BookingInput({ label, value, change, type = 'text', min, max, required }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        required={required}
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(e) => change(e.target.value)}
        className="mt-0.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-indigo-500"
      />
    </label>
  );
}

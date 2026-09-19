import { CheckCircle2, FileText, Home, Printer } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicNav } from '../../components/AppShell';
import { money } from '../../components/Ui';

export default function Confirmation() {
  const [params] = useSearchParams();

  const bookingId = params.get('bookingId') || params.get('id') || 'STY-00000';
  const hotel     = params.get('hotel')    || 'SmartStay Hotel';
  const room      = params.get('room')     || 'Deluxe';
  const total     = params.get('total')    || '0';
  const checkIn   = params.get('checkIn')  || '';
  const checkOut  = params.get('checkOut') || '';
  const guests    = params.get('guests')   || '1';
  const nights    = params.get('nights')   || '1';

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return d; }
  };

  const details = [
    ['Booking ID',    bookingId],
    ['Hotel',         hotel],
    ['Room type',     room],
    ['Check-in',      formatDate(checkIn)],
    ['Check-out',     formatDate(checkOut)],
    ['Nights',        nights],
    ['Guests',        guests],
    ['Total paid',    money(total)],
    ['Payment',       'DEMO — Confirmed'],
    ['Status',        'Confirmed ✓'],
  ];

  return (
    <>
      <PublicNav />
      <main className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-5 py-12">
        <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

          {/* Success icon */}
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={34} />
          </span>

          <p className="mt-5 text-center text-xs font-bold uppercase tracking-widest text-emerald-600">
            Booking Confirmed
          </p>
          <h1 className="mt-2 text-center text-2xl font-bold text-slate-900">
            Your stay is reserved!
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            A demo invoice has been generated for your booking.
          </p>

          {/* Booking details */}
          <div className="mt-7 divide-y divide-slate-100 rounded-xl bg-slate-50 px-5 text-left text-sm">
            {details.map(([label, value]) => (
              <p key={label} className="flex justify-between gap-4 py-3">
                <span className="text-slate-500">{label}</span>
                <span className="text-right font-semibold text-slate-800">{value}</span>
              </p>
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to={`/booking/invoice/${bookingId}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <FileText size={16} /> View Invoice
            </Link>
            <Link
              to="/dashboard"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Home size={16} /> My Stays
            </Link>
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"
              title="Print confirmation"
            >
              <Printer size={18} />
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

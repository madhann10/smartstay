import { AlertTriangle, ArrowLeft, Building2, CheckCircle, Download, Loader2, Mail, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicNav } from '../../components/AppShell';
import { money } from '../../components/Ui';
import { bookingApi } from '../../services/api';

export default function Invoice() {
  const { bookingId } = useParams();
  const [invoice,     setInvoice]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [err,         setErr]         = useState('');

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMsg,     setEmailMsg]     = useState({ type: '', text: '' });

  useEffect(() => {
    if (!bookingId) { setErr('No booking ID provided.'); setLoading(false); return; }
    bookingApi.getInvoice(bookingId)
      .then((data) => { setInvoice(data.invoice); setLoading(false); })
      .catch((e) => { setErr(e?.response?.data?.message || 'Could not load invoice.'); setLoading(false); });
  }, [bookingId]);

  const handleResendEmail = async () => {
    setSendingEmail(true);
    setEmailMsg({ type: '', text: '' });
    try {
      const res = await bookingApi.resendInvoice(bookingId);
      setEmailMsg({ type: 'success', text: res.message || `Invoice sent successfully to ${res.emailRecipient || invoice.customer.email}` });
    } catch (e) {
      setEmailMsg({ type: 'error', text: e?.response?.data?.message || 'Failed to send invoice email.' });
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) return (
    <><PublicNav /><main className="grid min-h-[70vh] place-items-center bg-slate-50"><Loader2 size={32} className="animate-spin text-indigo-600" /></main></>
  );

  if (err || !invoice) return (
    <><PublicNav />
    <main className="grid min-h-[70vh] place-items-center bg-slate-50 px-5 text-center">
      <div>
        <AlertTriangle size={32} className="mx-auto mb-3 text-amber-500" />
        <p className="text-slate-600">{err || 'Invoice not found.'}</p>
        <Link to="/dashboard" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white">My Stays</Link>
      </div>
    </main></>
  );

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <>
      <PublicNav />
      <main className="bg-slate-50 py-10">
        <div className="mx-auto max-w-3xl px-5">

          {/* Nav row */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Link to="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeft size={16} /> Back to My Stays
            </Link>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleResendEmail}
                disabled={sendingEmail}
                className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
              >
                {sendingEmail ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                {sendingEmail ? 'Sending…' : 'Resend Email Invoice'}
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Printer size={15} /> Print
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Download size={15} /> Download PDF
              </button>
            </div>
          </div>

          {/* Resend email status message */}
          {emailMsg.text && (
            <div className={`mb-4 flex items-center gap-2 rounded-xl p-4 text-sm ${emailMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {emailMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span>{emailMsg.text}</span>
            </div>
          )}

          {/* Invoice card */}
          <div id="invoice-print" className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:shadow-none print:border-0">

            {/* Header */}
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Building2 size={24} />
                </span>
                <div>
                  <p className="text-xl font-bold text-slate-900">SmartStay</p>
                  <p className="text-xs text-slate-500">Hotel Booking & Dynamic Pricing System</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-700">INVOICE</p>
                <p className="mt-1 text-sm text-slate-500">{invoice.invoiceNumber}</p>
                <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${invoice.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {invoice.paymentStatus}
                </span>
              </div>
            </div>

            {/* Booking & customer info */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Billed To (Registered Email)</p>
                <p className="font-semibold text-slate-900">{invoice.customer.name || '—'}</p>
                <p className="text-sm text-slate-500">{invoice.customer.email || '—'}</p>
                {invoice.customer.phone && <p className="text-sm text-slate-500">{invoice.customer.phone}</p>}
              </div>
              <div className="text-left sm:text-right">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Booking Details</p>
                <p className="text-sm text-slate-700"><span className="font-medium">Booking ID:</span> {invoice.bookingId}</p>
                <p className="text-sm text-slate-700"><span className="font-medium">Invoice No:</span> {invoice.invoiceNumber}</p>
                <p className="text-sm text-slate-700"><span className="font-medium">Booked on:</span> {formatDate(invoice.bookingDate)}</p>
                <p className="text-sm text-slate-700"><span className="font-medium">Payment ID:</span> {invoice.paymentId || '—'}</p>
              </div>
            </div>

            {/* Property details */}
            <div className="mt-6 rounded-xl bg-indigo-50 p-5">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-400">Property</p>
              <p className="text-lg font-bold text-slate-900">{invoice.hotel.name}</p>
              <p className="text-sm text-slate-600">{invoice.hotel.address}</p>
              <p className="text-sm text-slate-600">{invoice.hotel.city}{invoice.hotel.state ? `, ${invoice.hotel.state}` : ''}, India</p>
            </div>

            {/* Stay details */}
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Description</th>
                    <th className="px-5 py-3 text-center">Nights</th>
                    <th className="px-5 py-3 text-right">Rate / night</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{invoice.roomType} Room #{invoice.roomNumber}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(invoice.checkIn)} → {formatDate(invoice.checkOut)} · {invoice.guests} guest{invoice.guests !== 1 ? 's' : ''}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-center">{invoice.nights}</td>
                    <td className="px-5 py-4 text-right">{money(invoice.pricePerNight)}</td>
                    <td className="px-5 py-4 text-right font-semibold">{money(invoice.subtotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Price breakdown */}
            <div className="ml-auto mt-4 max-w-xs space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Room subtotal</span>
                <span>{money(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (12%)</span>
                <span>{money(invoice.tax)}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-indigo-600 px-4 py-3 text-base font-bold text-white">
                <span>Total Paid</span>
                <span>{money(invoice.totalAmount)}</span>
              </div>
            </div>

            {/* Payment & Email Status info */}
            <div className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-400">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="font-semibold text-slate-500">Payment Method</p>
                  <p>{invoice.paymentMethod}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Payment Date</p>
                  <p>{formatDate(invoice.paymentDate)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Email Status</p>
                  <p className="capitalize font-medium text-slate-700">
                    {invoice.invoiceEmailed ? 'Sent to registered email' : (invoice.emailDeliveryStatus || 'Sent')}
                  </p>
                </div>
              </div>
              <p className="mt-6 text-center text-slate-400">
                Thank you for choosing SmartStay — this is a demo invoice for a college project.<br />
                No real financial transaction was processed.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(main) { display: none !important; }
          nav, header { display: none !important; }
          main { padding: 0 !important; background: white !important; }
          #invoice-print { margin: 0; padding: 20px; }
        }
      `}</style>
    </>
  );
}

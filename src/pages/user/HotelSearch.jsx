import { ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicNav } from '../../components/AppShell';
import { HotelCard, SectionTitle } from '../../components/Ui';
import { hotelApi } from '../../services/api';

const SORT_OPTIONS = [
  { value: '',             label: 'Recommended' },
  { value: 'price_asc',   label: 'Price: Low to High' },
  { value: 'price_desc',  label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Rating: High to Low' },
  { value: 'rating_asc',  label: 'Rating: Low to High' },
  { value: 'location_asc',  label: 'Location: A to Z' },
  { value: 'location_desc', label: 'Location: Z to A' },
  { value: 'name_asc',  label: 'Hotel Name: A to Z' },
  { value: 'name_desc', label: 'Hotel Name: Z to A' },
];

const LIMIT = 20;

export default function HotelSearch() {
  const [params, setParams] = useSearchParams();

  // Filter form state (controlled inputs — not yet applied)
  const [draft, setDraft] = useState({
    location: params.get('city') || params.get('location') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    sort:     params.get('sort') || '',
  });

  // Active (applied) filters
  const [active, setActive] = useState({ ...draft });

  // Pagination
  const [page, setPage] = useState(1);

  // Results
  const [result,  setResult]  = useState({ hotels: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Validation error shown inline
  const [validErr, setValidErr] = useState('');

  // Fetch when active filters or page change
  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const data = await hotelApi.getHotels({
        location: active.location || undefined,
        minPrice: active.minPrice || undefined,
        maxPrice: active.maxPrice || undefined,
        sort:     active.sort    || undefined,
        page,
        limit: LIMIT,
      });
      setResult({
        hotels: data.hotels || [],
        total:  data.total  || 0,
        pages:  data.pages  || 1,
      });
    } catch (e) {
      setApiError(e?.response?.data?.message || 'Failed to load hotels. Make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, [active, page]);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  // Apply filters
  const apply = (e) => {
    e.preventDefault();
    setValidErr('');

    const min = draft.minPrice ? Number(draft.minPrice) : null;
    const max = draft.maxPrice ? Number(draft.maxPrice) : null;

    if (min !== null && isNaN(min)) { setValidErr('Minimum price must be a number.'); return; }
    if (max !== null && isNaN(max)) { setValidErr('Maximum price must be a number.'); return; }
    if (min !== null && min < 0)   { setValidErr('Minimum price cannot be negative.'); return; }
    if (max !== null && max < 0)   { setValidErr('Maximum price cannot be negative.'); return; }
    if (min !== null && max !== null && min > max) {
      setValidErr('Minimum price cannot be greater than maximum price.');
      return;
    }

    setActive({ ...draft });
    setPage(1);

    // Sync URL params
    const next = {};
    if (draft.location) next.city    = draft.location;
    if (draft.minPrice) next.minPrice = draft.minPrice;
    if (draft.maxPrice) next.maxPrice = draft.maxPrice;
    if (draft.sort)     next.sort     = draft.sort;
    setParams(next);
  };

  // Clear all filters
  const clear = () => {
    const blank = { location: '', minPrice: '', maxPrice: '', sort: '' };
    setDraft(blank);
    setActive(blank);
    setValidErr('');
    setPage(1);
    setParams({});
  };

  const hasActiveFilters = active.location || active.minPrice || active.maxPrice || active.sort;

  return (
    <>
      <PublicNav />
      <main className="bg-slate-50 py-10">
        <div className="mx-auto max-w-7xl px-5">

          <SectionTitle
            eyebrow="Find your stay"
            title={active.location ? `Stays in ${active.location}` : 'Explore all stays'}
            description="Search, filter, and sort hundreds of Indian homestays and hotels."
          />

          {/* ── Filter panel ──────────────────────────────────────────── */}
          <form
            onSubmit={apply}
            className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <SlidersHorizontal size={16} className="text-indigo-600" />
              Search & Filter
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Location */}
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                LOCATION
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    value={draft.location}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    placeholder="City or destination"
                    className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm text-slate-800 outline-indigo-500"
                  />
                </div>
              </label>

              {/* Min price */}
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                MIN PRICE (₹ / night)
                <input
                  type="number"
                  min="0"
                  value={draft.minPrice}
                  onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
                  placeholder="e.g. 500"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-indigo-500"
                />
              </label>

              {/* Max price */}
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                MAX PRICE (₹ / night)
                <input
                  type="number"
                  min="0"
                  value={draft.maxPrice}
                  onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
                  placeholder="e.g. 5000"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-indigo-500"
                />
              </label>

              {/* Sort */}
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                SORT BY
                <select
                  value={draft.sort}
                  onChange={(e) => setDraft({ ...draft, sort: e.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-indigo-500"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Validation error */}
            {validErr && (
              <p className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">
                ⚠ {validErr}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Filter size={15} />
                Apply Filters
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clear}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <X size={15} />
                  Clear Filters
                </button>
              )}
            </div>
          </form>

          {/* ── Results count ─────────────────────────────────────────── */}
          {!loading && !apiError && (
            <p className="mb-5 text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{result.total.toLocaleString('en-IN')}</span>{' '}
              {result.total === 1 ? 'stay' : 'stays'} found
              {active.location ? ` in ${active.location}` : ''}
              {active.minPrice || active.maxPrice
                ? ` · ₹${active.minPrice || 0}–${active.maxPrice || '∞'} / night`
                : ''}
            </p>
          )}

          {/* ── Loading ───────────────────────────────────────────────── */}
          {loading && (
            <div className="rounded-2xl bg-white p-12 text-center text-slate-500 shadow-sm">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              Loading stays…
            </div>
          )}

          {/* ── API error ─────────────────────────────────────────────── */}
          {apiError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              <strong>Error:</strong> {apiError}
            </div>
          )}

          {/* ── No results ────────────────────────────────────────────── */}
          {!loading && !apiError && result.hotels.length === 0 && (
            <div className="rounded-2xl bg-white p-12 text-center text-slate-500 shadow-sm">
              <p className="text-lg font-semibold">No stays found</p>
              <p className="mt-2 text-sm">Try adjusting your filters or broadening your search.</p>
              {hasActiveFilters && (
                <button onClick={clear} className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white">
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* ── Hotel grid ────────────────────────────────────────────── */}
          {!loading && !apiError && result.hotels.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.hotels.map((hotel) => (
                <HotelCard key={hotel._id} hotel={hotel} search={params.toString()} />
              ))}
            </div>
          )}

          {/* ── Pagination ────────────────────────────────────────────── */}
          {!loading && !apiError && result.pages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} /> Previous
              </button>

              {Array.from({ length: result.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === result.pages || Math.abs(p - page) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '…' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                        page === item
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                disabled={page >= result.pages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}

        </div>
      </main>
    </>
  );
}

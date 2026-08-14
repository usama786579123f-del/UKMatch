import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  Armchair,
  Calendar,
  MapPin,
  Minus,
  Plus,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatEventDate } from '../../utils/formatDate';
import CheckoutSummary from '../../components/buyer/CheckoutSummary';
import StripeCheckoutForm from '../../components/buyer/StripeCheckoutForm';
import PriceEstimate from '../../components/public/PriceEstimate';
import { useSEO } from '../../hooks/useSEO';
import { DEMO_MODE } from '../../utils/demoMode';
import mockData from '../../services/mockData';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const TICKET_TYPE_LABELS = {
  'e-ticket': 'E-ticket',
  'mobile-transfer': 'Mobile transfer',
  physical: 'Physical ticket',
  'season-card': 'Season card',
};

const ListingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const [checkoutStep, setCheckoutStep] = useState('view'); // view | paying | success
  const [clientSecret, setClientSecret] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useSEO({
    title: listing ? `${listing.event.homeTeam} vs ${listing.event.awayTeam} - ${listing.section}` : 'Listing',
    description: listing
      ? `${listing.section} tickets for ${listing.event.homeTeam} vs ${listing.event.awayTeam}, from £${listing.pricePerTicket}. Escrow protected purchase.`
      : undefined,
    jsonLd: listing
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: `${listing.event.homeTeam} vs ${listing.event.awayTeam} - ${listing.section}`,
          offers: {
            '@type': 'Offer',
            price: listing.pricePerTicket,
            priceCurrency: 'GBP',
            availability: listing.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
          },
        }
      : null,
  });

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await api.get('/listings/' + id);
        setListing(response.data.data.listing);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleBuyClick = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/listings/' + id } } });
      return;
    }
    if (user.role !== 'buyer') {
      toast.error('Only buyer accounts can purchase tickets.');
      return;
    }

    setCheckoutLoading(true);
    try {
      // Demo mode: skip Stripe entirely, create a fake order instantly
      // and jump straight to the success screen.
      if (DEMO_MODE) {
        mockData.createOrder(listing._id, quantity);
        setCheckoutStep('success');
        return;
      }

      const response = await api.post('/orders/checkout', {
        listingId: listing._id,
        quantity,
      });
      setClientSecret(response.data.data.clientSecret);
      setOrderNumber(response.data.data.orderNumber);
      setCheckoutStep('paying');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-page py-16">
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="font-display text-display-sm text-ink">Listing not found</h1>
        <p className="text-slate-500">This listing may have been sold or removed.</p>
        <Link to="/events" className="btn-primary mt-2">
          Browse events
        </Link>
      </div>
    );
  }

  if (checkoutStep === 'success') {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <CheckCircle2 size={32} />
        </span>
        <h1 className="font-display text-display-sm text-ink">Payment successful!</h1>
        <p className="max-w-sm text-slate-500">
          Your funds are held securely in escrow. The seller will upload your
          ticket shortly - we'll notify you the moment it's ready.
        </p>
        <Link to="/buyer/orders" className="btn-primary mt-2">
          View my orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Link
        to={'/events/' + listing.event.slug}
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink"
      >
        <ChevronLeft size={15} />
        <span>
          Back to {listing.event.homeTeam} vs {listing.event.awayTeam}
        </span>
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left - details */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <span className="badge bg-primary-50 text-primary-700">{listing.event.league}</span>
            <h1 className="mt-3 font-display text-display-sm text-ink">
              {listing.event.homeTeam} <span className="text-slate-400">vs</span> {listing.event.awayTeam}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> {formatEventDate(listing.event.eventDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {listing.event.venue?.name}, {listing.event.venue?.city}
              </span>
            </div>

            <div className="ticket-stub-divider my-6" />

            <h2 className="mb-3 text-sm font-semibold text-ink">Ticket details</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-xs text-slate-400">Section</p>
                <p className="mt-0.5 font-semibold text-ink">{listing.section}</p>
              </div>
              {listing.row ? (
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="text-xs text-slate-400">Row</p>
                  <p className="mt-0.5 font-semibold text-ink">{listing.row}</p>
                </div>
              ) : null}
              <div className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-xs text-slate-400">Ticket type</p>
                <p className="mt-0.5 font-semibold text-ink">
                  {TICKET_TYPE_LABELS[listing.ticketType] || listing.ticketType}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-xs text-slate-400">Available</p>
                <p className="mt-0.5 font-semibold text-ink">{listing.quantity} tickets</p>
              </div>
            </div>

            {listing.description ? (
              <>
                <h2 className="mb-2 mt-6 text-sm font-semibold text-ink">Seller notes</h2>
                <p className="text-sm text-slate-600">{listing.description}</p>
              </>
            ) : null}

            <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-100 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-secondary-600">
                <Armchair size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  Sold by {listing.seller?.name}
                  {listing.seller?.sellerTier === 'trusted' ? (
                    <span className="badge-success ml-2 !px-1.5 !py-0.5 align-middle">
                      Trusted seller
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500">Identity verified · KYC complete</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right - purchase / checkout panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 flex flex-col gap-5">
            {checkoutStep === 'view' ? (
              <div className="card p-5">
                <p className="text-xs text-slate-400">Price per ticket</p>
                <p className="price-mono text-3xl text-ink">
                  {formatCurrency(listing.pricePerTicket)}
                </p>
                <PriceEstimate amountGBP={listing.pricePerTicket} />

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">Quantity</span>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-2 py-1.5">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-4 text-center text-sm font-semibold text-ink">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(listing.quantity, q + 1))}
                      disabled={quantity >= listing.quantity}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleBuyClick}
                  disabled={checkoutLoading}
                  className="btn-primary mt-5 w-full justify-center"
                >
                  {checkoutLoading
                    ? 'Starting checkout...'
                    : 'Buy ' + (quantity > 1 ? quantity + ' tickets' : 'ticket')}
                </button>

                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck size={13} /> Protected by MatchPass escrow
                </p>
              </div>
            ) : (
              <>
                <CheckoutSummary listing={listing} quantity={quantity} />
                <div className="card p-5">
                  <h3 className="mb-4 font-display text-sm font-semibold text-ink">
                    Payment details
                  </h3>
                  <Elements stripe={stripePromise} options={{ clientSecret: clientSecret }}>
                    <StripeCheckoutForm
                      orderNumber={orderNumber}
                      onSuccess={() => setCheckoutStep('success')}
                    />
                  </Elements>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
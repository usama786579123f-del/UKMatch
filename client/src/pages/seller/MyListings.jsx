import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Ticket, Upload, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import ListingCard from '../../components/seller/ListingCard';
import { DEMO_MODE } from '../../utils/demoMode';

const DEMO_STATUS_COPY = {
  paid_escrow_held: {
    label: 'Awaiting your delivery',
    tone: 'text-gold-600',
  },
  proof_uploaded: {
    label: 'Waiting for buyer to confirm receipt',
    tone: 'text-slate-500',
  },
  completed: {
    label: 'Payment released to you',
    tone: 'text-primary-700',
  },
};

const MyListings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  // Demo-mode only: the single fake order tied to the demo listing, so the
  // seller can walk through "upload ticket" without a real backend.
  const [demoOrder, setDemoOrder] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const fetchListings = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const { data } = await api.get(`/listings/my-listings${params}`);
      setListings(data.data.listings || []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDemoOrder = async () => {
    if (!DEMO_MODE) return;
    try {
      const { data } = await api.get('/orders/my-sales');
      setDemoOrder(data.data.orders?.[0] || null);
    } catch {
      setDemoOrder(null);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [filter]);

  useEffect(() => {
    fetchDemoOrder();
  }, []);

  const handleWithdraw = async (listingId) => {
    if (!confirm('Withdraw this listing? It will no longer be visible to buyers.')) return;
    try {
      await api.patch(`/listings/${listingId}/withdraw`);
      toast.success('Listing withdrawn.');
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not withdraw listing.');
    }
  };

  const handleDemoUploadProof = async () => {
    if (!demoOrder) return;
    setUploadingProof(true);
    try {
      await api.post(`/orders/${demoOrder._id}/upload-proof`, {
        proofFileUrl: 'https://example.com/demo-ticket.pdf',
      });
      toast.success('Ticket uploaded (demo). Buyer has been notified.');
      fetchDemoOrder();
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload ticket.');
    } finally {
      setUploadingProof(false);
    }
  };

  const kycVerified = user?.kycStatus === 'verified';

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-display-sm text-ink">My listings</h1>
          <p className="mt-1 text-slate-500">Manage your active and past ticket listings.</p>
        </div>
        {kycVerified ? (
          <Link to="/seller/listings/new" className="btn-primary">
            <Plus size={16} /> New listing
          </Link>
        ) : (
          <Link to="/seller/kyc" className="btn-secondary text-sm">
            Complete verification to list
          </Link>
        )}
      </div>

      {/* Demo-mode order fulfillment card */}
      {DEMO_MODE && demoOrder ? (
        <div className="card mb-6 flex flex-col gap-3 border border-primary-100 bg-primary-50/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
              Demo order · {demoOrder.orderNumber}
            </p>
            <p className="mt-1 font-semibold text-ink">
              {demoOrder.event?.homeTeam} <span className="text-slate-400">vs</span>{' '}
              {demoOrder.event?.awayTeam}
            </p>
            <p className={`mt-1 flex items-center gap-1.5 text-sm ${DEMO_STATUS_COPY[demoOrder.status]?.tone || 'text-slate-500'}`}>
              {demoOrder.status === 'completed' ? (
                <CheckCircle2 size={14} />
              ) : (
                <Clock size={14} />
              )}
              {DEMO_STATUS_COPY[demoOrder.status]?.label || demoOrder.status}
            </p>
          </div>

          {demoOrder.status === 'paid_escrow_held' ? (
            <button
              onClick={handleDemoUploadProof}
              disabled={uploadingProof}
              className="btn-primary shrink-0"
            >
              <Upload size={15} />
              {uploadingProof ? 'Uploading...' : 'Upload ticket (demo)'}
            </button>
          ) : demoOrder.status === 'proof_uploaded' ? (
            <span className="shrink-0 text-sm text-slate-500">
              Ask the buyer to confirm delivery from their orders page.
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        {['', 'active', 'sold', 'withdrawn', 'expired'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === s ? 'bg-ink text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-slate-50" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Ticket className="text-slate-300" size={32} />
          <p className="font-semibold text-ink">No listings yet</p>
          <p className="text-sm text-slate-500">Create your first listing to start selling.</p>
          {kycVerified && (
            <Link to="/seller/listings/new" className="btn-primary mt-2 text-sm">Create listing</Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} onWithdraw={handleWithdraw} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
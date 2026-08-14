import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import DisputeTable from '../../components/admin/DisputeTable';
import { formatCurrency } from '../../utils/formatCurrency';

const RESOLUTIONS = [
  { value: 'full_refund', label: 'Full refund to buyer' },
  { value: 'partial_refund', label: 'Partial refund' },
  { value: 'no_refund', label: 'No refund — release to seller' },
];

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const Disputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = async (status) => {
    setLoading(true);
    try {
      const params = status ? `?status=${status}` : '';
      const { data } = await api.get(`/disputes/admin/all${params}`);
      setDisputes(data.data.disputes || []);
    } catch {
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes(statusFilter);
  }, [statusFilter]);

  const openReview = (dispute) => {
    setSelected(dispute);
    setResolution('');
    setPartialAmount('');
    setNote('');
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/disputes/${selected._id}/resolve`, {
        resolution,
        resolutionAmount: resolution === 'partial_refund' ? parseFloat(partialAmount) : undefined,
        resolutionNote: note,
      });
      toast.success('Dispute resolved.');
      setSelected(null);
      fetchDisputes(statusFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resolve dispute.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <h1 className="font-display text-display-sm text-ink">Dispute resolution</h1>
      <p className="mt-1 text-slate-500">Review and resolve buyer disputes within 48 hours.</p>

      {/* Status filter tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
              statusFilter === s.value
                ? 'bg-ink text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="card mt-6 overflow-x-auto p-5">
        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-slate-50" />
        ) : disputes.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No disputes to review.</p>
        ) : (
          <DisputeTable disputes={disputes} onSelect={openReview} />
        )}
      </div>

      {/* Resolution modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elevated animate-scale-in">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Resolve dispute</h2>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 p-3.5 text-sm">
              <p className="font-medium text-ink">Order {selected.order?.orderNumber}</p>
              <p className="text-slate-500">{selected.description}</p>
            </div>

            <form onSubmit={handleResolve} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {RESOLUTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setResolution(r.value)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                      resolution === r.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-ink hover:border-slate-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {resolution === 'partial_refund' && (
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selected.order?.totalAmount}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder={`Amount (max ${formatCurrency(selected.order?.totalAmount)})`}
                  className="input-field"
                  required
                />
              )}

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (shared with both parties)"
                rows={3}
                className="input-field resize-none"
              />

              <button type="submit" disabled={!resolution || submitting} className="btn-primary justify-center">
                {submitting ? 'Resolving...' : 'Confirm resolution'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Disputes;
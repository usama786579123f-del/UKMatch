const STORAGE_KEY = 'mp_demo_order';

const DEMO_VENUE = {
  _id: 'demo-venue-1',
  name: 'Emirates Stadium',
  city: 'London',
};

const eventDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

const DEMO_EVENT = {
  _id: 'demo-event-1',
  slug: 'demo-arsenal-vs-manchester-city',
  title: 'Arsenal vs Manchester City',
  league: 'Premier League',
  homeTeam: 'Arsenal',
  awayTeam: 'Manchester City',
  venue: DEMO_VENUE,
  eventDate,
  imageUrl:
    'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1200&auto=format&fit=crop',
  isFeatured: true,
  status: 'upcoming',
  lowestPrice: 65,
};

const DEMO_SELLER = {
  _id: 'demo-seller-1',
  name: 'Demo Seller',
  sellerTier: 'trusted',
};

const DEMO_LISTING = {
  _id: 'demo-listing-1',
  event: DEMO_EVENT,
  seller: DEMO_SELLER,
  section: 'Shortside Lower',
  row: '12',
  seats: '',
  quantity: 2,
  ticketType: 'e-ticket',
  pricePerTicket: 65,
  currency: 'GBP',
  status: 'active',
  moderationStatus: 'approved',
  description: "Great seats, selling because I can't make it to the match.",
  viewCount: 24,
};

const readOrder = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeOrder = (order) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  return order;
};

const clearOrder = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const isListingSold = () => {
  const order = readOrder();
  return !!order && !['cancelled', 'refunded'].includes(order.status);
};

const getListingForDisplay = () => ({
  ...DEMO_LISTING,
  status: isListingSold() ? 'sold' : 'active',
});

const createOrder = (quantity) => {
  const subtotal = DEMO_LISTING.pricePerTicket * quantity;
  const platformFee = Math.round(subtotal * 0.1 * 100) / 100;
  const totalAmount = subtotal + platformFee;

  const order = {
    _id: 'demo-order-1',
    orderNumber: 'MP-DEMO-0001',
    buyer: { _id: 'demo-buyer-1', name: 'Demo Buyer', email: 'buyer@demo.com' },
    seller: DEMO_SELLER,
    listing: DEMO_LISTING,
    event: DEMO_EVENT,
    quantity,
    pricePerTicket: DEMO_LISTING.pricePerTicket,
    subtotal,
    platformFee,
    totalAmount,
    currency: 'GBP',
    status: 'paid_escrow_held',
    deliveryDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    proofFileUrl: null,
    matchDate: DEMO_EVENT.eventDate,
    graceReleaseAt: null,
    disputeRaised: false,
    createdAt: new Date().toISOString(),
  };

  return writeOrder(order);
};

const markProofUploaded = () => {
  const order = readOrder();
  if (!order) return null;
  order.status = 'proof_uploaded';
  order.proofFileUrl = 'https://example.com/demo-ticket.pdf';
  order.proofUploadedAt = new Date().toISOString();
  order.graceReleaseAt = new Date(
    new Date(order.matchDate).getTime() + 24 * 60 * 60 * 1000
  ).toISOString();
  return writeOrder(order);
};

const confirmDelivery = () => {
  const order = readOrder();
  if (!order) return null;
  order.status = 'completed';
  order.buyerConfirmedAt = new Date().toISOString();
  order.fundsReleasedAt = new Date().toISOString();
  return writeOrder(order);
};

export default {
  DEMO_EVENT,
  DEMO_LISTING,
  DEMO_SELLER,
  readOrder,
  writeOrder,
  clearOrder,
  isListingSold,
  getListingForDisplay,
  createOrder,
  markProofUploaded,
  confirmDelivery,
};
const ORDERS_KEY = 'mp_demo_orders';   // ab array of orders
const TOTAL_QTY = 15;

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
  quantity: TOTAL_QTY,          // 👈 ab 15
  ticketType: 'e-ticket',
  pricePerTicket: 65,
  currency: 'GBP',
  status: 'active',
  moderationStatus: 'approved',
  description: "Great seats, selling because I can't make it to the match.",
  viewCount: 24,
};

// ---------- orders (ab multiple) ----------

const readOrders = () => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeOrders = (orders) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return orders;
};

const clearOrders = () => {
  localStorage.removeItem(ORDERS_KEY);
};

// kitni tickets ab tak becheen ja chuki hain (cancelled/refunded na ginain)
const getSoldQty = () => {
  const orders = readOrders();
  return orders
    .filter((o) => !['cancelled', 'refunded'].includes(o.status))
    .reduce((sum, o) => sum + o.quantity, 0);
};

const getRemainingQty = () => Math.max(0, TOTAL_QTY - getSoldQty());

const isListingSold = () => getRemainingQty() <= 0;

const getListingForDisplay = () => ({
  ...DEMO_LISTING,
  quantity: getRemainingQty(),
  status: isListingSold() ? 'sold' : 'active',
});

// naya order banata hai — sirf tab jab stock available ho
const createOrder = (quantity) => {
  const remaining = getRemainingQty();
  const qty = Math.min(quantity, remaining);
  if (qty <= 0) return null;

  const subtotal = DEMO_LISTING.pricePerTicket * qty;
  const platformFee = Math.round(subtotal * 0.1 * 100) / 100;
  const totalAmount = subtotal + platformFee;

  const orders = readOrders();
  const orderId = `demo-order-${orders.length + 1}`;

  const order = {
    _id: orderId,
    orderNumber: `MP-DEMO-${String(orders.length + 1).padStart(4, '0')}`,
    buyer: { _id: 'demo-buyer-1', name: 'Demo Buyer', email: 'buyer@demo.com' },
    seller: DEMO_SELLER,
    listing: DEMO_LISTING,
    event: DEMO_EVENT,
    quantity: qty,
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

  orders.push(order);
  writeOrders(orders);
  return order;
};

const getOrderById = (id) => readOrders().find((o) => o._id === id) || null;

const markProofUploaded = (orderId) => {
  const orders = readOrders();
  const order = orders.find((o) => o._id === orderId);
  if (!order) return null;
  order.status = 'proof_uploaded';
  order.proofFileUrl = 'https://example.com/demo-ticket.pdf';
  order.proofUploadedAt = new Date().toISOString();
  order.graceReleaseAt = new Date(
    new Date(order.matchDate).getTime() + 24 * 60 * 60 * 1000
  ).toISOString();
  writeOrders(orders);
  return order;
};

const confirmDelivery = (orderId) => {
  const orders = readOrders();
  const order = orders.find((o) => o._id === orderId);
  if (!order) return null;
  order.status = 'completed';
  order.buyerConfirmedAt = new Date().toISOString();
  order.fundsReleasedAt = new Date().toISOString();
  writeOrders(orders);
  return order;
};

export default {
  DEMO_EVENT,
  DEMO_LISTING,
  DEMO_SELLER,
  TOTAL_QTY,
  readOrders,
  writeOrders,
  clearOrders,
  isListingSold,
  getRemainingQty,
  getListingForDisplay,
  createOrder,
  getOrderById,
  markProofUploaded,
  confirmDelivery,
};
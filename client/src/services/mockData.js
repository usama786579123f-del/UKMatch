const ORDERS_KEY = 'mp_demo_orders';

const DEMO_SELLER = {
  _id: 'demo-seller-1',
  name: 'Demo Seller',
  sellerTier: 'trusted',
};

const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

const DEMO_EVENTS = [
  {
    _id: 'demo-event-1',
    slug: 'demo-arsenal-vs-manchester-city',
    title: 'Arsenal vs Manchester City',
    league: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Manchester City',
    venue: { _id: 'demo-venue-1', name: 'Emirates Stadium', city: 'London' },
    eventDate: daysFromNow(10),
    imageUrl:
      'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1200&auto=format&fit=crop',
    isFeatured: true,
    status: 'upcoming',
    lowestPrice: 65,
  },
  {
    _id: 'demo-event-2',
    slug: 'demo-liverpool-vs-chelsea',
    title: 'Liverpool vs Chelsea',
    league: 'Premier League',
    homeTeam: 'Liverpool',
    awayTeam: 'Chelsea',
    venue: { _id: 'demo-venue-2', name: 'Anfield', city: 'Liverpool' },
    eventDate: daysFromNow(13),
    imageUrl:
      'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=1200&auto=format&fit=crop',
    isFeatured: true,
    status: 'upcoming',
    lowestPrice: 48,
  },
  {
    _id: 'demo-event-3',
    slug: 'demo-manchester-united-vs-bayern-munich',
    title: 'Manchester United vs Bayern Munich',
    league: 'Champions League',
    homeTeam: 'Manchester United',
    awayTeam: 'Bayern Munich',
    venue: { _id: 'demo-venue-3', name: 'Old Trafford', city: 'Manchester' },
    eventDate: daysFromNow(18),
    imageUrl:
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    isFeatured: true,
    status: 'upcoming',
    lowestPrice: 110,
  },
  {
    _id: 'demo-event-4',
    slug: 'demo-tottenham-hotspur-vs-real-madrid',
    title: 'Tottenham Hotspur vs Real Madrid',
    league: 'Champions League',
    homeTeam: 'Tottenham Hotspur',
    awayTeam: 'Real Madrid',
    venue: { _id: 'demo-venue-4', name: 'Tottenham Hotspur Stadium', city: 'London' },
    eventDate: daysFromNow(22),
    imageUrl:
      'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=1200&auto=format&fit=crop',
    isFeatured: false,
    status: 'upcoming',
    lowestPrice: 92,
  },
  {
    _id: 'demo-event-5',
    slug: 'demo-newcastle-united-vs-aston-villa',
    title: 'Newcastle United vs Aston Villa',
    league: 'FA Cup',
    homeTeam: 'Newcastle United',
    awayTeam: 'Aston Villa',
    venue: { _id: 'demo-venue-5', name: "St James' Park", city: 'Newcastle' },
    eventDate: daysFromNow(26),
    imageUrl:
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=1200&auto=format&fit=crop',
    isFeatured: false,
    status: 'upcoming',
    lowestPrice: 35,
  },
];

const DEMO_LISTINGS = [
  {
    _id: 'demo-listing-1',
    event: DEMO_EVENTS[0],
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
  },
  {
    _id: 'demo-listing-2',
    event: DEMO_EVENTS[1],
    seller: DEMO_SELLER,
    section: 'Main Stand',
    row: '5',
    seats: '',
    quantity: 1,
    ticketType: 'mobile-transfer',
    pricePerTicket: 48,
    currency: 'GBP',
    status: 'active',
    moderationStatus: 'approved',
    description: 'Single ticket, great view of the pitch.',
    viewCount: 11,
  },
  {
    _id: 'demo-listing-3',
    event: DEMO_EVENTS[2],
    seller: DEMO_SELLER,
    section: 'Sir Bobby Charlton Stand',
    row: '3',
    seats: '',
    quantity: 2,
    ticketType: 'e-ticket',
    pricePerTicket: 110,
    currency: 'GBP',
    status: 'active',
    moderationStatus: 'approved',
    description: 'Champions League night atmosphere, unmissable.',
    viewCount: 37,
  },
  {
    _id: 'demo-listing-4',
    event: DEMO_EVENTS[3],
    seller: DEMO_SELLER,
    section: 'East Stand Upper',
    row: '20',
    seats: '',
    quantity: 4,
    ticketType: 'physical',
    pricePerTicket: 92,
    currency: 'GBP',
    status: 'active',
    moderationStatus: 'approved',
    description: 'Group of 4, happy to split.',
    viewCount: 8,
  },
  {
    _id: 'demo-listing-5',
    event: DEMO_EVENTS[4],
    seller: DEMO_SELLER,
    section: 'Gallowgate End',
    row: '',
    seats: 'GA',
    quantity: 2,
    ticketType: 'e-ticket',
    pricePerTicket: 35,
    currency: 'GBP',
    status: 'active',
    moderationStatus: 'approved',
    description: 'Standing area, great atmosphere.',
    viewCount: 15,
  },
];

// ---- orders storage (array, keyed by listing so multiple can co-exist) ----

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

const findListing = (listingId) => DEMO_LISTINGS.find((l) => l._id === listingId) || null;

const findEventBySlug = (slug) => DEMO_EVENTS.find((e) => e.slug === slug) || null;

const listingsForEvent = (eventId) => DEMO_LISTINGS.filter((l) => l.event._id === eventId);

const isListingSold = (listingId) => {
  const orders = readOrders();
  return orders.some(
    (o) => o.listing._id === listingId && !['cancelled', 'refunded'].includes(o.status)
  );
};

const getListingForDisplay = (listingId) => {
  const listing = findListing(listingId);
  if (!listing) return null;
  return { ...listing, status: isListingSold(listingId) ? 'sold' : 'active' };
};

const getAllListingsForDisplay = () =>
  DEMO_LISTINGS.map((l) => ({ ...l, status: isListingSold(l._id) ? 'sold' : 'active' }));

const getListingsForEventDisplay = (eventId) =>
  listingsForEvent(eventId)
    .map((l) => ({ ...l, status: isListingSold(l._id) ? 'sold' : 'active' }))
    .filter((l) => l.status === 'active');

const createOrder = (listingId, quantity) => {
  const listing = findListing(listingId);
  if (!listing) return null;

  const subtotal = listing.pricePerTicket * quantity;
  const platformFee = Math.round(subtotal * 0.1 * 100) / 100;
  const totalAmount = subtotal + platformFee;

  const orders = readOrders();
  const order = {
    _id: `demo-order-${listingId}`,
    orderNumber: `MP-DEMO-${listingId.slice(-1).padStart(4, '0')}`,
    buyer: { _id: 'demo-buyer-1', name: 'Demo Buyer', email: 'buyer@demo.com' },
    seller: DEMO_SELLER,
    listing,
    event: listing.event,
    quantity,
    pricePerTicket: listing.pricePerTicket,
    subtotal,
    platformFee,
    totalAmount,
    currency: 'GBP',
    status: 'paid_escrow_held',
    deliveryDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    proofFileUrl: null,
    matchDate: listing.event.eventDate,
    graceReleaseAt: null,
    disputeRaised: false,
    createdAt: new Date().toISOString(),
  };

  const next = [...orders.filter((o) => o.listing._id !== listingId), order];
  writeOrders(next);
  return order;
};

const findOrder = (orderId) => readOrders().find((o) => o._id === orderId) || null;

const updateOrder = (orderId, updates) => {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o._id === orderId);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...updates };
  writeOrders(orders);
  return orders[idx];
};

const markProofUploaded = (orderId) => {
  const order = findOrder(orderId);
  if (!order) return null;
  return updateOrder(orderId, {
    status: 'proof_uploaded',
    proofFileUrl: 'https://example.com/demo-ticket.pdf',
    proofUploadedAt: new Date().toISOString(),
    graceReleaseAt: new Date(
      new Date(order.matchDate).getTime() + 24 * 60 * 60 * 1000
    ).toISOString(),
  });
};

const confirmDelivery = (orderId) =>
  updateOrder(orderId, {
    status: 'completed',
    buyerConfirmedAt: new Date().toISOString(),
    fundsReleasedAt: new Date().toISOString(),
  });

export default {
  DEMO_EVENTS,
  DEMO_LISTINGS,
  DEMO_SELLER,
  findListing,
  findEventBySlug,
  listingsForEvent,
  readOrders,
  writeOrders,
  clearOrders,
  isListingSold,
  getListingForDisplay,
  getAllListingsForDisplay,
  getListingsForEventDisplay,
  createOrder,
  findOrder,
  markProofUploaded,
  confirmDelivery,
};
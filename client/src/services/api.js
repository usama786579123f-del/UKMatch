import axios from 'axios';
import { DEMO_MODE } from '../utils/demoMode';
import mockData from './mockData';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('matchpass_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !DEMO_MODE) {
      localStorage.removeItem('matchpass_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const ok = (data, meta) => ({
  data: { success: true, message: 'OK', data, ...(meta ? { meta } : {}) },
  status: 200,
});

const getPath = (url) => url.split('?')[0];
const getQuery = (url) => {
  const q = url.split('?')[1];
  return q ? Object.fromEntries(new URLSearchParams(q)) : {};
};

const applyEventFilters = (events, query) => {
  let filtered = [...events];

  if (query.league) {
    filtered = filtered.filter((e) => e.league === query.league);
  }
  if (query.q) {
    const term = query.q.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.homeTeam.toLowerCase().includes(term) || e.awayTeam.toLowerCase().includes(term)
    );
  }
  if (query.dateFrom) {
    filtered = filtered.filter((e) => new Date(e.eventDate) >= new Date(query.dateFrom));
  }
  if (query.dateTo) {
    filtered = filtered.filter((e) => new Date(e.eventDate) <= new Date(query.dateTo));
  }
  if (query.priceMin) {
    filtered = filtered.filter((e) => e.lowestPrice >= parseFloat(query.priceMin));
  }
  if (query.priceMax) {
    filtered = filtered.filter((e) => e.lowestPrice <= parseFloat(query.priceMax));
  }

  if (query.sort === 'price_asc') filtered.sort((a, b) => a.lowestPrice - b.lowestPrice);
  else if (query.sort === 'price_desc') filtered.sort((a, b) => b.lowestPrice - a.lowestPrice);
  else filtered.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

  return filtered;
};

const mockGet = (url) => {
  const path = getPath(url);
  const query = getQuery(url);

  if (path === '/events/featured') {
    return ok({ events: mockData.DEMO_EVENTS.filter((e) => e.isFeatured) });
  }
  if (path === '/events') {
    return ok({ events: applyEventFilters(mockData.DEMO_EVENTS, query) });
  }
  if (path.startsWith('/events/')) {
    const slug = path.split('/events/')[1];
    const event = mockData.findEventBySlug(slug);
    if (!event) return ok({ event: null, listings: [] });
    return ok({ event, listings: mockData.getListingsForEventDisplay(event._id) });
  }
  if (path === '/listings/my-listings') {
    return ok({ listings: mockData.getAllListingsForDisplay() });
  }
  if (path.startsWith('/listings/') && !path.includes('price-suggestion')) {
    const listingId = path.split('/listings/')[1];
    const listing = mockData.getListingForDisplay(listingId);
    return ok({ listing });
  }
  if (path === '/orders/my-orders') {
    return ok({ orders: mockData.readOrders() });
  }
  if (path === '/orders/my-sales') {
    return ok({ orders: mockData.readOrders() });
  }
  if (path.startsWith('/orders/')) {
    const orderId = path.split('/orders/')[1];
    const order = mockData.findOrder(orderId);
    return order ? ok({ order }) : null;
  }
  if (path.startsWith('/reviews/user/')) {
    return ok({ reviews: [], summary: { averageRating: null, totalReviews: 0 } });
  }
  if (path === '/payouts/my-payouts') {
    return ok({ payouts: [] }, { totalEarned: 0 });
  }

  return null;
};

const mockPost = (url, data) => {
  const path = getPath(url);

  if (path === '/orders/checkout') {
    // Not used directly in demo mode (ListingDetail creates the order via
    // mockData.createOrder before this would ever be called), but kept as
    // a safety net in case something calls it.
    const order = mockData.createOrder(data?.listingId, data?.quantity || 1);
    return order ? ok({ orderId: order._id, orderNumber: order.orderNumber }) : null;
  }
  if (/^\/orders\/[^/]+\/confirm-delivery$/.test(path)) {
    const orderId = path.split('/orders/')[1].split('/')[0];
    const order = mockData.confirmDelivery(orderId);
    return order ? ok({ order }) : null;
  }
  if (/^\/orders\/[^/]+\/upload-proof$/.test(path)) {
    const orderId = path.split('/orders/')[1].split('/')[0];
    const order = mockData.markProofUploaded(orderId);
    return order ? ok({ order }) : null;
  }
  return null;
};

if (DEMO_MODE) {
  const realGet = api.get.bind(api);
  const realPost = api.post.bind(api);

  api.get = async (url, config) => {
    const mocked = mockGet(url);
    if (mocked) return mocked;
    return realGet(url, config);
  };

  api.post = async (url, data, config) => {
    const mocked = mockPost(url, data);
    if (mocked) return mocked;
    return realPost(url, data, config);
  };
}

export default api;
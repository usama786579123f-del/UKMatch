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

const mockGet = (url) => {
  const path = getPath(url);

  if (path === '/events/featured') {
    return ok({ events: [mockData.DEMO_EVENT] });
  }
  if (path === '/events') {
    return ok({ events: [mockData.DEMO_EVENT] });
  }
  if (path.startsWith('/events/')) {
    const listing = mockData.getListingForDisplay();
    const listings = listing.status === 'active' ? [listing] : [];
    return ok({ event: mockData.DEMO_EVENT, listings });
  }
  if (path === '/listings/my-listings') {
    return ok({ listings: [mockData.getListingForDisplay()] });
  }
  if (path.startsWith('/listings/') && !path.includes('price-suggestion')) {
    return ok({ listing: mockData.getListingForDisplay() });
  }
  if (path === '/orders/my-orders') {
    const order = mockData.readOrder();
    return ok({ orders: order ? [order] : [] });
  }
  if (path === '/orders/my-sales') {
    const order = mockData.readOrder();
    return ok({ orders: order ? [order] : [] });
  }
  if (path.startsWith('/orders/')) {
    const order = mockData.readOrder();
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

const mockPost = (url) => {
  const path = getPath(url);
  if (/^\/orders\/[^/]+\/confirm-delivery$/.test(path)) {
    const order = mockData.confirmDelivery();
    return order ? ok({ order }) : null;
  }
  if (/^\/orders\/[^/]+\/upload-proof$/.test(path)) {
    const order = mockData.markProofUploaded();
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
    const mocked = mockPost(url);
    if (mocked) return mocked;
    return realPost(url, data, config);
  };
}

export default api;
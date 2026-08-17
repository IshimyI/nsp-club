import axios from "axios";

const api = axios.create({ baseURL: "/api/v1" });

const TOKEN_KEY = "nsp-club-token";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// There's no refresh-token flow here — a 401 on an authenticated call
// (not just the initial /auth/me on mount) means the token is gone/expired.
// Clear it and let AuthContext know so the whole app drops back to a
// logged-out state instead of every call site silently failing forever.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("nsp-auth-expired"));
    }
    return Promise.reject(error);
  }
);

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const register = (payload) => api.post("/auth/register", payload).then((r) => r.data);
export const login = (payload) => api.post("/auth/login", payload).then((r) => r.data);
export const fetchMe = () => api.get("/auth/me").then((r) => r.data);
export const fetchMyOrders = () => api.get("/orders/mine").then((r) => r.data);

const productCache = new Map();

export const fetchProducts = () => api.get("/products").then((r) => r.data);

export const fetchProduct = (slug) => {
  if (productCache.has(slug)) return productCache.get(slug);
  const promise = api.get(`/products/${slug}`).then((r) => r.data);
  productCache.set(slug, promise);
  promise.catch(() => productCache.delete(slug));
  return promise;
};

// Fire-and-forget: warms the cache so navigating to the product is instant.
export const prefetchProduct = (slug) => {
  if (!productCache.has(slug)) fetchProduct(slug);
};

export const submitOrder = (payload) =>
  api.post("/order", payload).then((r) => r.data);

let ratePromise = null;
export const fetchRate = () => {
  if (!ratePromise) ratePromise = api.get("/rate").then((r) => r.data);
  return ratePromise;
};

export default api;

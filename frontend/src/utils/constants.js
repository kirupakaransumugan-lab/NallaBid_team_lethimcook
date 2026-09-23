export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const ROLES = {
  BUYER: 'buyer',
  SUPPLIER: 'supplier',
};

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  BUYER_DASHBOARD: '/buyer/dashboard',
  SUPPLIER_DASHBOARD: '/supplier/dashboard',
};

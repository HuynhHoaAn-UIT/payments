// Payment API path from the original ShopSphere PaymentController: /api/v1/payments
import axios from 'axios';
export const PAYMENT_API = axios.create({ baseURL: process.env.REACT_APP_PAYMENT_API_BASE || '/api', timeout: 20000 });

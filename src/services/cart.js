// Browser-local demo cart: Order Service is deliberately NOT used.
const KEY = 'shopsphere-payment-only-cart';
export function getCart() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
export function saveCart(items) { localStorage.setItem(KEY, JSON.stringify(items)); window.dispatchEvent(new Event('cart-updated')); }
export function addItem(product) { const items = getCart(); const found = items.find(x => x.id === product.id); if(found) found.quantity++; else items.push({...product, quantity: 1}); saveCart(items); }

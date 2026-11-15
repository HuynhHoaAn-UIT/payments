// Simplified from original ShopSphere Frontend/src/App.js and Navbar.js
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import { getCart } from './services/cart';
function Navbar() {
 const [count,setCount] = useState(0); const [search,setSearch] = useState(''); const nav=useNavigate();
 useEffect(()=>{ const refresh=()=>setCount(getCart().reduce((a,x)=>a+x.quantity,0)); refresh();window.addEventListener('cart-updated',refresh);return()=>window.removeEventListener('cart-updated',refresh);},[]);
 return <nav className="navbar navbar-dark bg-dark shadow-sm"><div className="container d-flex flex-wrap align-items-center gap-3 py-2">
 <Link className="navbar-brand fw-bold fs-3" to="/products">🛒 ShopSphere</Link>
 <form className="d-flex flex-grow-1 mx-lg-5" style={{maxWidth:560}} onSubmit={e=>{e.preventDefault();nav('/products?search='+encodeURIComponent(search));}}><input className="form-control" placeholder="Search Products..." value={search} onChange={e=>setSearch(e.target.value)}/><button className="btn btn-primary ms-2">Search</button></form>
 <div className="d-flex gap-3 align-items-center"><Link className="text-light text-decoration-none" to="/products">Products</Link><Link className="text-light text-decoration-none" to="/cart">🛒 Cart <span className="badge bg-danger">{count}</span></Link><span className="text-info">👋 Demo</span></div>
 </div></nav>
}
export default function App(){return <BrowserRouter><Navbar/><Routes><Route path="/" element={<Products/>}/><Route path="/products" element={<Products/>}/><Route path="/cart" element={<Cart/>}/><Route path="/checkout" element={<Checkout/>}/></Routes><ToastContainer position="top-right" autoClose={2500}/></BrowserRouter>}

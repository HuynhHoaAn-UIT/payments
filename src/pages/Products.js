// Based on original ShopSphere Products.js and ProductCard.js; local catalog replaces Product Service.
import { useLocation,useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductCard from '../components/ProductCard';
import { products } from '../services/catalog';
import { addItem } from '../services/cart';
export default function Products(){const nav=useNavigate();const q=new URLSearchParams(useLocation().search).get('search')||'';const filtered=products.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()));return <main className="container mt-4"><h2 className="text-center mb-4">🛍️ Our Products</h2><p className="text-muted text-center small">Danh mục mẫu để demo frontend; không gọi Product Service.</p><div className="row">{filtered.map(p=><ProductCard key={p.id} product={p} addToCart={x=>{addItem(x);toast.success('🛒 Product Added Successfully');}}/>)}</div><div className="text-center"><button className="btn btn-outline-primary" onClick={()=>nav('/cart')}>View Cart</button></div></main>}

import React, { useEffect } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { AnnouncementBar } from './components/layout/AnnouncementBar.js';
import { Navbar } from './components/layout/Navbar.js';
import { Footer } from './components/layout/Footer.js';
import { HomePage } from './pages/home/HomePage.js';
import { ProductsPage } from './pages/products/ProductsPage.js';
import { useAuthStore } from './store/authStore.js';
import { useCartStore } from './store/cartStore.js';

const PendingPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">{title}</h1>
    <p className="text-stone-600">
      This part of the storefront has not been built yet.
    </p>
    <Link
      to="/"
      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-800 text-white text-sm font-semibold hover:bg-amber-900 transition-colors"
    >
      Back to Home
    </Link>
  </div>
);

const App: React.FC = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const fetchCart = useCartStore((state) => state.fetchCart);

  useEffect(() => {
    void checkAuth();
    void fetchCart();
  }, [checkAuth, fetchCart]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<PendingPage title="Product Details" />} />
          <Route path="/cart" element={<PendingPage title="Shopping Cart" />} />
          <Route path="/checkout" element={<PendingPage title="Checkout" />} />
          <Route path="/login" element={<PendingPage title="Sign In" />} />
          <Route path="/register" element={<PendingPage title="Create Account" />} />
          <Route path="/orders" element={<PendingPage title="My Orders" />} />
          <Route path="*" element={<PendingPage title="Page Not Found" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from '../pages/home/HomePage.js';
import { ProductsPage } from '../pages/products/ProductsPage.js';
import { ProductDetailPage } from '../pages/products/ProductDetailPage.js';
import { CartPage } from '../pages/cart/CartPage.js';
import { CheckoutPage } from '../pages/checkout/CheckoutPage.js';
import { OrderSuccessPage } from '../pages/orders/OrderSuccessPage.js';
import { MyOrdersPage } from '../pages/orders/MyOrdersPage.js';
import { WishlistPage } from '../pages/wishlist/WishlistPage.js';
import { AccountPage } from '../pages/account/AccountPage.js';
import { LoginPage } from '../pages/auth/LoginPage.js';
import { RegisterPage } from '../pages/auth/RegisterPage.js';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:slug" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/orders/:orderNumber" element={<OrderSuccessPage />} />
      <Route path="/orders" element={<MyOrdersPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
};

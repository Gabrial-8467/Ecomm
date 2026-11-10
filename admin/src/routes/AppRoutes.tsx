import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout.js';
import { LoginPage } from '../pages/auth/LoginPage.js';
import { DashboardPage } from '../pages/dashboard/DashboardPage.js';
import { ProductsListPage } from '../pages/products/ProductsListPage.js';
import { CreateProductPage } from '../pages/products/CreateProductPage.js';
import { EditProductPage } from '../pages/products/EditProductPage.js';
import { InventoryPage } from '../pages/inventory/InventoryPage.js';
import { OrdersListPage } from '../pages/orders/OrdersListPage.js';
import { OrderDetailPage } from '../pages/orders/OrderDetailPage.js';
import { DeliveryZonesPage } from '../pages/delivery/DeliveryZonesPage.js';
import { CouponsPage } from '../pages/coupons/CouponsPage.js';
import { CustomersPage } from '../pages/customers/CustomersPage.js';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/products/create" element={<CreateProductPage />} />
        <Route path="/products/:id" element={<EditProductPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/orders" element={<OrdersListPage />} />
        <Route path="/orders/:orderNumber" element={<OrderDetailPage />} />
        <Route path="/delivery-zones" element={<DeliveryZonesPage />} />
        <Route path="/coupons" element={<CouponsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

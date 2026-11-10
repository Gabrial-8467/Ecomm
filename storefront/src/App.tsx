import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AnnouncementBar } from './components/layout/AnnouncementBar.js';
import { Navbar } from './components/layout/Navbar.js';
import { Footer } from './components/layout/Footer.js';
import { CompareFloatingBar } from './components/product/CompareFloatingBar.js';
import { AppRoutes } from './routes/AppRoutes.js';
import { useAuthStore } from './store/authStore.js';
import { useCartStore } from './store/cartStore.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});

export const App: React.FC = () => {
  const { checkAuth, isAuthenticated } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans">
            <AnnouncementBar />
            <Navbar />
            <main className="flex-1">
              <AppRoutes />
            </main>
            <Footer />
            <CompareFloatingBar />
            <Toaster position="top-right" richColors closeButton />
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

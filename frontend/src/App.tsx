import React from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { Container } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import themeOptions from './Theme';
import { CustomLinearProgress } from './components/CustomLinearProgress';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Admin } from './pages/Admin';
import { Blocked } from './pages/Blocked';
import Checkout from './pages/Checkout';
import { Customer } from './pages/Customer';
import { Homepage } from './pages/Homepage';
import { Login } from './pages/Login';
import { Products } from './pages/Products';
import { SignUp } from './pages/SignUp';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const App = () => (
  <>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <SnackbarProvider
        key="notification-snackbar"
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        maxSnack={3}
        autoHideDuration={3000}
      >
        <ThemeProvider theme={themeOptions}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Homepage />} />

              <Route path="/login" element={<Login />} />

              <Route path="/signup" element={<SignUp />} />

              <Route path="/blocked" element={<Blocked />} />

              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Container>
                      <Checkout />
                    </Container>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/account/*"
                element={
                  <ProtectedRoute>
                    <Customer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="/products/*" element={<Products />} />
            </Routes>
          </BrowserRouter>
          <CustomLinearProgress />
        </ThemeProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  </>
);

export default App;

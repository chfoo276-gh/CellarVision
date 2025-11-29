import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CellarDetail from './pages/CellarDetail';
import AddBottle from './pages/AddBottle';
import BottleDetail from './pages/BottleDetail';
import History from './pages/History';
import CreateCellar from './pages/CreateCellar';
import EditCellar from './pages/EditCellar';
import Settings from './pages/Settings';
import Import from './pages/Import';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Wrapper
const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null; 
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="cellars/new" element={<CreateCellar />} />
            <Route path="cellars/:id" element={<CellarDetail />} />
            <Route path="cellars/:id/edit" element={<EditCellar />} />
            <Route path="add-bottle" element={<AddBottle />} />
            <Route path="bottle/:id" element={<BottleDetail />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
            <Route path="import" element={<Import />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
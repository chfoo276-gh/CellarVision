
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cellars/new" element={<CreateCellar />} />
          <Route path="cellars/:id" element={<CellarDetail />} />
          <Route path="cellars/:id/edit" element={<EditCellar />} />
          <Route path="add-bottle" element={<AddBottle />} />
          <Route path="bottle/:id" element={<BottleDetail />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
          <Route path="import" element={<Import />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;

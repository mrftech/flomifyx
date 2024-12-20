import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ItemList from './components/ItemList';
import ItemDetails from './components/ItemDetails';
import ItemSubmission from './components/ItemSubmission';
import './styles/ItemCard.css';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ItemList />} />
              <Route path="/item/:id" element={<ItemDetails />} />
              <Route path="/submit" element={<ItemSubmission />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 
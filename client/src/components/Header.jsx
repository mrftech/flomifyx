import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import '../styles/Header.css';

function Header() {
  const { user, isModalOpen, setIsModalOpen } = useAuth();

  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__title">Component Library</h1>
      </div>
      <div className="header__right">
        {user ? (
          <div className="user-info">
            <span className="user-email">{user.email}</span>
            <button className="auth-button" onClick={() => useAuth().signOut()}>
              Sign Out
            </button>
          </div>
        ) : (
          <button 
            className="auth-button" 
            onClick={() => setIsModalOpen(true)}
          >
            Sign In
          </button>
        )}
      </div>
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </header>
  );
}

export default Header; 
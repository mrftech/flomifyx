import React from 'react';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__section">
          <h3>About</h3>
          <p>A curated collection of UI components and templates</p>
        </div>
        <div className="footer__section">
          <h3>Links</h3>
          <ul>
            <li><a href="/about">About</a></li>
            <li><a href="/terms">Terms</a></li>
            <li><a href="/privacy">Privacy</a></li>
          </ul>
        </div>
        <div className="footer__section">
          <h3>Contact</h3>
          <ul>
            <li><a href="mailto:support@example.com">Support</a></li>
            <li><a href="/submit">Submit Component</a></li>
          </ul>
        </div>
      </div>
      <div className="footer__bottom">
        <p>&copy; {new Date().getFullYear()} Component Library. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer; 
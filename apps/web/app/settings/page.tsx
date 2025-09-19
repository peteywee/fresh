'use client';

import React from 'react';

export default function SettingsPage() {
  // Temporarily simplified settings page to prevent build errors
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Settings
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Settings page is temporarily unavailable while we fix some issues. Please check back later.
      </p>
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Available Soon</h2>
        <ul style={{ marginLeft: '1rem' }}>
          <li>Profile settings</li>
          <li>Theme customization</li>
          <li>Notification preferences</li>
          <li>Industry-specific configurations</li>
        </ul>
      </div>
    </div>
  );
}

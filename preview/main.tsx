import React from 'react';
import { createRoot } from 'react-dom/client';
import Landing from '../app/page';
import Workspace from '../components/workspace';
import PreviewAuth from './auth';
import { installPreviewTransport } from './storage';
import '../app/globals.css';
import './fonts.css';
installPreviewTransport();
const path = location.pathname;
if (path === '/signout-with-chatgpt') {
  sessionStorage.removeItem('tradovia.preview.session');
  location.replace('/auth');
}
const personal = path === '/workspace';
const auth =
  path === '/auth' ||
  (personal && sessionStorage.getItem('tradovia.preview.session') !== 'active');
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div
      style={{
        padding: '7px 16px',
        background: '#e5eee8',
        color: '#183e32',
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      UI/UX Preview · ข้อมูลเดโมเก็บในเบราว์เซอร์นี้เท่านั้น · No live login, payments or
      broker sync
    </div>
    {path === '/' ? (
      <Landing />
    ) : auth ? (
      <PreviewAuth />
    ) : (
      <Workspace mode={personal ? 'real' : 'demo'} />
    )}
  </React.StrictMode>,
);

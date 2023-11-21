import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

let root = createRoot(document.querySelector('#root'));
root.render(<App />);

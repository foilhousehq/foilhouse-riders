import React from 'react';
import {createRoot} from 'react-dom/client';
import Riders from './app/riders/page';
import Login from './app/rider-login/page';
import {authReady} from './lib/api';
import './app/globals.css';
async function start(){await authReady;if(/rider-login|auth\//.test(location.pathname))createRoot(document.getElementById('root')!).render(<Login/>);else if(/\/riders\/?$/.test(location.pathname))createRoot(document.getElementById('root')!).render(<Riders/>);else location.replace('/foilhouse-riders/calendar.html'+location.search+location.hash)}
start().catch(()=>{document.getElementById('root')!.textContent='Could not load the site. Please reload.'});

import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { getKey } from './lib/api/http';
import { library } from './lib/data/library.svelte';

// TEMPORARY debug (remove after Phase 3 testing): `npm run dev` + `?devkey` signs in with API_KEY_OVERRIDE from .env.
if (import.meta.env.DEV && __DEV_API_KEY__ && location.search.includes('devkey') && !getKey()) void library.connect(__DEV_API_KEY__);

mount(App, { target: document.getElementById('app')! });

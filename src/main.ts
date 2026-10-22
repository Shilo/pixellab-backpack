import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { agentKey } from './lib/api/http';
import { library } from './lib/data/library.svelte';

mount(App, { target: document.getElementById('app')! });

// AI-agent testing only (AGENTS.md "Agent testing"): `npm run dev:agent` serves the .env token, which takes the same
// verify-then-keep path as a pasted key, kept in memory only (never in either store). A compile-time constant: no other mode
// or build contains this.
if (import.meta.env.DEV && import.meta.env.MODE === 'agent' && !library.hasKey) void agentKey().then((k) => k && library.connect(k, { memoryOnly: true }));

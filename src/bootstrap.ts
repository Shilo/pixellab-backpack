import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { agentKey, getKeyRevision } from './lib/api/http';
import { library } from './lib/data/library.svelte';

mount(App, { target: document.getElementById('app')! });

// AI-agent testing only (AGENTS.md "Agent testing"): `npm run dev:agent` serves the .env token, which takes the same
// verify-then-keep path as a pasted key, kept in memory only (never in either store). A compile-time constant: no other mode
// or build contains this. Never when framed: another page could embed and clickjack the app.
if (import.meta.env.DEV && import.meta.env.MODE === 'agent' && window.top === window && !library.hasKey) {
  const revision = getKeyRevision();
  void agentKey().then((key) => {
    // A delayed agent response must not replace a manual connection or undo Forget, even while still keyless.
    if (key && revision === getKeyRevision() && !library.hasKey) return library.connect(key, { memoryOnly: true });
  });
}

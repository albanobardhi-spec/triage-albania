// frontend/js/config.js or api-client.js
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'
  : 'https://triage-backend.onrender.com/api'; // Your Render URL
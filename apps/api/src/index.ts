import 'dotenv/config';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 4000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`[api] Health Tracker API listening on http://localhost:${PORT}`);
});

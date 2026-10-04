import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

router.get('/auth', (req, res) => {
  if (!CLIENT_ID) {
    return res.status(500).json({ error: "Google integration not configured." });
  }
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly`;
  res.redirect(url);
});

router.get('/callback', (req, res) => {
  // Mock callback for MVP testing
  const code = req.query.code;
  if (!code) {
    return res.send('Authorization failed.');
  }
  res.send(`
    <html><body>
      <h2>Google Calendar Connected Successfully!</h2>
      <p>You can close this window.</p>
      <script>
        setTimeout(() => window.close(), 2000);
      </script>
    </body></html>
  `);
});

export default router;

# Municipal Frontend

## Vercel deployment

1. Push this `frontend` repository to GitHub.
2. Import project in Vercel.
3. Set environment variable in Vercel:
   - `VITE_API_BASE_URL` = `https://<your-render-backend>.onrender.com/api`
4. Deploy.

This project is a Vite SPA and `vercel.json` handles SPA route fallback.

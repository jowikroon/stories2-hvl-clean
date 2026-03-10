# Google login — auth test checklist

Use this to verify Google sign-in works locally and in production.

---

## 1. Prerequisites

- **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs** must include:
  - `http://localhost:8080/auth/callback`
  - `http://127.0.0.1:8080/auth/callback`
  - `https://hansvanleeuwen.com/auth/callback`
- **Supabase → Authentication → Providers → Google**: enabled, with valid Client ID and Secret from Google Cloud Console.
- **Google Cloud Console → Credentials → OAuth 2.0 Client**: Authorized redirect URI =  
  `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`  
  (Supabase shows the exact URL in the Google provider settings.)

---

## 2. Local test (dev server on port 8080)

1. Start dev: `npm run dev` (app at http://localhost:8080).
2. Open **http://localhost:8080** (or http://127.0.0.1:8080 — use the same host you added in Supabase).
3. Go to a page that requires login (e.g. **/portal**).
4. Click **Sign in with Google** (or equivalent).
5. **Expected URL flow:**
   - You leave the app → Google sign-in page.
   - After consent → redirect to  
     `https://<supabase-project>.supabase.co/auth/v1/callback?code=...`  
     (handled by Supabase).
   - Then redirect to  
     `http://localhost:8080/auth/callback#access_token=...`  
     (or same with `127.0.0.1` if you used that host).
   - App shows "Signing you in…" briefly, then redirects back to the page you came from (e.g. /portal).
6. **Success:** You are logged in; Navbar/UI shows your account.
7. **Failure:** Stuck on "Signing you in…", blank page, or redirect to an error:
   - Confirm the **exact** redirect URL in the address bar when you land on `/auth/callback` (including host: `localhost` vs `127.0.0.1`, port `8080`) is in the Supabase Redirect URLs list.
   - Check browser DevTools → Console and Network for errors.

---

## 3. Production test (hansvanleeuwen.com)

1. Open **https://hansvanleeuwen.com/portal** (or any protected page).
2. Click **Sign in with Google**.
3. **Expected URL flow:**
   - Google sign-in → Supabase callback →  
     `https://hansvanleeuwen.com/auth/callback#access_token=...`
   - Then redirect back to the page you came from.
4. **Success:** Logged in on production.
5. **Failure:** Check that `https://hansvanleeuwen.com/auth/callback` is in Supabase Redirect URLs (no trailing slash).

---

## 4. What to check in Supabase

- **Authentication → Logs:** After a sign-in attempt, look for "User signed in" or an error (e.g. "Redirect URL not allowed").
- **Authentication → URL Configuration:** Site URL can be `https://hansvanleeuwen.com`; Redirect URLs must list every callback URL you use (see section 1).

---

## 5. Quick reference: callback URLs by environment

| Environment | App URL | Redirect URL to add in Supabase |
|-------------|--------|----------------------------------|
| Local (localhost) | http://localhost:8080 | `http://localhost:8080/auth/callback` |
| Local (127.0.0.1) | http://127.0.0.1:8080 | `http://127.0.0.1:8080/auth/callback` |
| Production | https://hansvanleeuwen.com | `https://hansvanleeuwen.com/auth/callback` |

The app uses `window.location.origin` for the callback, so it always sends the correct URL for the current host/port; the only requirement is that this exact URL is allowed in Supabase.

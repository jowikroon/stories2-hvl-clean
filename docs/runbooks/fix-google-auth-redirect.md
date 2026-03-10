# Runbook: Fix Google auth redirect (marketplacegrowth → hansvanleeuwen.com)

When Google sign-in redirects users to `marketplacegrowth.vercel.app` instead of `hansvanleeuwen.com`, the cause is **Supabase project auth URL settings**, not app code. The app already sends `redirectTo: window.location.origin + "/auth/callback"`.

**Supabase project:** `pesfakewujjwkyybwaom`

---

## Step 1: Change Site URL

1. Open **URL configuration**:  
   [https://supabase.com/dashboard/project/pesfakewujjwkyybwaom/auth/url-configuration](https://supabase.com/dashboard/project/pesfakewujjwkyybwaom/auth/url-configuration)
2. Set **Site URL** to:
   ```text
   https://hansvanleeuwen.com
   ```
3. Remove any `marketplacegrowth.vercel.app` value.
4. Save.

---

## Step 2: Update Redirect URLs

In the same **Redirect URLs** section:

1. **Remove** any `marketplacegrowth` entries.
2. **Add** these three (one per line):
   - `https://hansvanleeuwen.com/auth/callback`
   - `http://localhost:8080/auth/callback`
   - `http://127.0.0.1:8080/auth/callback`
3. Save.

---

## Step 3: Verify Google provider

1. In Supabase: **Authentication → Providers → Google**
   - Confirm Google is **enabled**.
   - Confirm **Client ID** and **Client Secret** are set (from Google Cloud Console).
2. Note the **Authorized redirect URI** Supabase shows (e.g. `https://pesfakewujjwkyybwaom.supabase.co/auth/v1/callback`).
3. In **Google Cloud Console → APIs & Services → Credentials**:
   - Open your **OAuth 2.0 Client ID** used by Supabase.
   - Under **Authorized redirect URIs**, ensure the Supabase callback above is listed.
   - Save if you made changes.

---

## Step 4: Test login

1. **Production:** Open [https://hansvanleeuwen.com/portal](https://hansvanleeuwen.com/portal) → Sign in with Google.  
   After consent you should land on `https://hansvanleeuwen.com/auth/callback#access_token=...` then redirect to `/portal` logged in.
2. **Local:** Run `npm run dev --workspace=apps/personal`, open [http://localhost:8080/portal](http://localhost:8080/portal) → Sign in with Google.  
   You should land on `http://localhost:8080/auth/callback#...` then `/portal`.

If either flow still redirects to marketplacegrowth.vercel.app, re-check Steps 1 and 2 (Site URL and Redirect URLs).

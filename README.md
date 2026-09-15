# Impact Water — Stock & Orders

Mobile-friendly stock and purchase-order tracker, backed by Firebase Firestore
so all 7 of you see the same live data from your own phones.

## 1. Before you push to GitHub

- The PIN is set in `src/App.jsx` near the top: `const TEAM_PIN = "1234";`
  Change it to whatever passcode you want the team to use.
- The Firebase config in `src/firebase.js` is already filled in with your
  project's details. That's fine to commit — it's meant to be public.

## 2. Lock down Firestore

Right now your database is in "test mode," which means **anyone** who finds
your `projectId` can read/write it, PIN or no PIN (the PIN only gates this
app's UI, not the database itself). Go to Firebase Console → Firestore
Database → Rules, and paste this in:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /impact_water/{docId} {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

This restricts all access to just the two documents this app uses
(`impact_water/inventory` and `impact_water/purchase_orders`) and blocks
everything else in the database. It's still open access to those two
documents to anyone with your projectId — good enough for an internal tool
with an unlisted URL, not true security. If you ever want real protection,
the next step up is adding Firebase Authentication (sign-in) and rules that
check `request.auth`.

## 3. Run it locally (optional, to test first)

```
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## 4. Deploy to GitHub Pages

1. Create a GitHub repo and push this folder to it.
2. In `vite.config.js`, set `base` to `/<your-repo-name>/` (already set to
   `/impact-water-stock/` — change it if your repo name is different).
3. Install the deploy helper and run it:
   ```
   npm install
   npm run build
   npm run deploy
   ```
   This publishes the `dist` folder to a `gh-pages` branch.
4. In your GitHub repo → Settings → Pages, set the source to the `gh-pages`
   branch.
5. Your app will be live at `https://<your-username>.github.io/<repo-name>/`.

Share that link and the PIN with your team.

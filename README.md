# Peace Action Network Website

This version:
- Removes "Get Help" from the navigation and footer.
- Makes Events a dropdown with Upcoming Events and Past Events.
- Gives Past Events a responsive event-card/gallery layout.
- Adds a private `/admin.html` event manager.
- Lets an administrator add, edit, and delete events.
- Lets an administrator upload and delete photos for individual events.
- Stores event information in `data/events.json` and uploaded images in `public/uploads/`.

## Run locally

1. Install Node.js (18+ recommended).
2. Open a terminal in this folder.
3. Run:

```bash
npm install
```

4. Set an administrator password.

Windows PowerShell:
```powershell
$env:ADMIN_PASSWORD="your-secure-password"
$env:SESSION_SECRET="a-long-random-secret"
npm start
```

macOS/Linux:
```bash
export ADMIN_PASSWORD="your-secure-password"
export SESSION_SECRET="a-long-random-secret"
npm start
```

5. Open:
- Website: http://localhost:3000
- Admin page: http://localhost:3000/admin.html

## Important before publishing

Do NOT leave the default password `change-this-password`.

This uses local JSON storage and local image uploads, so the hosting service must support a persistent Node.js server and persistent storage. A static host such as ordinary GitHub Pages cannot run this admin backend.

If the website is going on a hosting service that does not provide persistent files, move the events/images to a database and object-storage service such as Supabase or another hosted backend.

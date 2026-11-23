# BusBooks — money tracking for school bus owners

BusBooks helps people who rent their buses to schools see where their money goes:
diesel, repairs, tyres, staff salaries, school rent, and the **profit and profit margin**
for each bus, each month and each year.

**One app works everywhere.** The same files are both the **website** (on a computer)
and the **mobile app** (people tap "Add to Home screen" and it opens like a normal app,
with its own icon and no browser bar).

---

## What's in this folder

| File | What it is | Do you edit it? |
|---|---|---|
| `index.html` | The page that loads the app | No |
| `app.js` | All the screens and buttons | Only to change features |
| `store.js` | Saves the data (on the device, or online) | No |
| `styles.css` | Colours and look | Only to change colours |
| `config.js` | **App name and your online-account keys** | **Yes** |
| `supabase-schema.sql` | Sets up the online database (Step 3) | No, just copy and paste it |
| `manifest.json`, `sw.js`, `icon.svg` | Make it installable on phones | No |

---

## Step 1 — Try it on your computer (2 minutes)

Double-click **`index.html`**. It opens in your browser.

1. Click **Create account**, type any email and password.
2. On the home screen, click **"Fill with sample data"** to see the app with example buses.
3. Try **Add Expense**, **Add Income**, the **Monthly checklist**, and **Reports**.

Right now the app is in **Demo mode** (you'll see a yellow bar at the top).
Demo mode saves everything only inside that one browser, so it's for testing and showing
the app to people. Before you sell it, do Step 3.

---

## Step 2 — Put it on the internet (free, about 5 minutes)

This gives you a web address like `https://busbooks.netlify.app` that works on any phone.

1. Go to **https://app.netlify.com/drop** and make a free account.
2. Drag this whole folder onto the page.
3. Netlify gives you a link. Open it on your phone.
4. On your phone, tap **⋮ → Add to Home screen** (Android) or **Share → Add to Home Screen** (iPhone).
   It now has an icon and opens like an app.

Each time you change something, drag the folder onto your Netlify site again to update it.

---

## Step 3 — Switch on real online accounts (needed before you sell, about 15 minutes)

This lets your customers log in from any phone or computer. Each customer only ever
sees **their own** buses and money. We use **Supabase**, which is free to start.

1. Go to **https://supabase.com**, sign up, and click **New project**.
   Choose a name and a strong database password (save the password somewhere safe), then wait about 2 minutes.
2. In the left menu, open **SQL Editor** → **New query**.
   Open `supabase-schema.sql` from this folder, copy **everything**, paste it in, and click **Run**.
   You should see "Success". This also creates private storage for document photos.
   (If you update the app later and the SQL file has changed, just run the whole file again. It's safe to re-run.)
3. In the left menu, open **Project Settings → API** (it may be called **Data API** or **API Keys**). Copy two things:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (a long piece of text)
4. Open `config.js` in Notepad and paste them in, keeping the quote marks:
   ```js
   supabaseUrl: "https://abcdefgh.supabase.co",
   supabaseAnonKey: "eyJhbGciOi...your long key..."
   ```
   Save the file.
5. In Supabase, open **Authentication → URL Configuration**:
   - **Site URL**: paste your Netlify link from Step 2.
   - **Redirect URLs**: add the same link.
   This makes the "confirm your email" and "forgot password" emails link back to your app.
6. Upload the folder to Netlify again (Step 2). The yellow "Demo mode" bar is gone, and logins are now real.

> **Is it safe to put the anon key in config.js?** Yes. That key is meant to be public.
> Your customers' data is protected by the security rules the SQL file set up
> ("Row Level Security"), which only let each logged-in person see their own records.
> **Never** paste the `service_role` key into the app. That one is secret.

**Email confirmation:** by default Supabase sends each new user a "confirm your email"
link before they can log in. The app handles this automatically. Supabase's built-in
email service only sends a few emails per hour, which is fine for testing. Before you
have many customers, connect your own email sender under **Authentication → Emails → SMTP Settings**
(Resend, Brevo, or similar; many are free for small volumes).

---

## What your customers can do

- **Home:** this month's Money In, Money Out, Profit and margin, explained in plain words
  ("you keep 32 of every 100 earned"). Big **Add Expense** and **Add Income** buttons.
- **Monthly checklist:** one tap to record school rent for every bus, pay every staff member's salary, or pay bus loan EMIs.
- **Loan EMI:** an expense type of its own. Set a bus's monthly EMI and the checklist reminds you to pay it.
- **Documents:** for each bus, Insurance, PUC, Road Tax, Fitness and Permit. For each staff member, Aadhaar, PAN,
  Light Bill and CV (plus Driving License for drivers). Each one can have a number, an expiry date and a photo or PDF
  (taken with the phone camera). When renewing a bus document, you can type the cost and it's added to expenses automatically.
- **Expiry reminders:** documents that are expired or expiring soon show at the top of Home, with a red count on the 🔔 bell.
  The warning period (7 to 90 days, default 30) is set in Settings.
- **Phone notifications:** after tapping **Turn on**, the app sends a notification once a day when it's opened and
  something needs renewing. Tapping the notification opens the Documents screen.
- **Where your money went:** diesel vs repairs vs salaries, plus litres bought and average price per litre.
- **Profit by bus:** shows which bus earns the most and which one costs too much.
- **History:** every entry, filtered by month, money in or out, and bus. Tap any entry to edit or delete it.
- **Buses / Staff:** add buses (with the school's monthly rent) and staff (with salary and which bus they work on).
- **Reports:** monthly and yearly, with charts and tables. **Download for Excel** and **Print / Save as PDF**.
- **Settings:** business name, currency (rupee, dollar, dirham and 12 more), log out, delete all data.

---

## Changing the name or colours

- **App name:** change `appName` in `config.js`. Also change the `name` and `short_name` in `manifest.json`, and `<title>` in `index.html`.
- **Main colour:** in `styles.css`, change `--primary` (currently `#0f766e`, a teal). Also change `theme_color` in `manifest.json`.
- **Icon:** replace `icon.svg` with your own logo (keep the same file name).

---

## To start selling: what's still needed

The app is ready to use, but to charge money for it you'll still want:

1. **Payments / subscriptions.** For example, a monthly fee per business through Razorpay (India) or Stripe,
   with the app checking that the customer has paid before letting them in.
2. **Play Store / App Store listing (optional).** Customers can already install it from the website.
   If you want it in the Play Store, **https://www.pwabuilder.com** turns this website into a Play Store package.
3. **A Privacy Policy and Terms page.** App stores require one, and you are storing other businesses' financial data.
4. **Your own web address** (like `busbooks.in`), which you connect in Netlify under **Domain settings**.
5. **Reminders when the app is closed.** Right now notifications only come when the app is opened (once a day).
   Notifications that arrive even when nobody opens the app need a small server job: a Supabase scheduled function
   that checks expiry dates every morning and sends a push notification or email/WhatsApp message.
6. **Backups.** Supabase's paid plan includes daily backups. Customers can also download all their records from Settings.

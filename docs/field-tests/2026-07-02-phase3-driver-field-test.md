# CareVan field test — Phase 3 DRIVER flow (real devices)

**Date:** 2026-07-02
**Build under test:** Phase 3 mobile DRIVER flow (Expo SDK 54 dev-client)
**Devices:** Oppo F21 Pro (ColorOS — the reliability bar) + iPhone (iOS 16+ dev build)
**Run by:** Founder, standing at the school gate, holding both phones.

---

## How to use this sheet

Every line is: `[ ] Step → Expected → Pass / Fail / Notes`. Do **one action per line**, in order.
Tick `[x]` when it matches Expected; write `FAIL` and a short note if it doesn't.

A missed **BOARDED** push is a **critical failure**, not a minor bug — circle any BOARDED/push
failure in red.

### What is NOT built yet in Phase 3 — do NOT record these as failures

- **Parent screens don't exist yet.** The parent side is a placeholder ("Parent app is coming
  next"). A BOARDED/SOS **push still arrives** on the parent phone — that is what we test. But
  **tapping the push opens the placeholder screen, not a child-status screen.** The deep-link to a
  child-status screen is Phase 4. Record push _arrival_ as the pass; note the deep-link as "not
  built."
- **Battery banner + whitelist screen are Android-only** (they detect Oppo/Realme/OnePlus/Xiaomi
  etc.). The iPhone will never show them. That is correct, not a bug.
- **The app cannot detect OS whitelisting.** Tapping "I've enabled it" only records that you said
  you did it; it clears the banner but can't verify the phone setting. The real proof is the
  survival tests below.

### Roles for the two phones

- **Primary setup:** Oppo F21 Pro = **DRIVER**, iPhone = **PARENT**. This covers ColorOS survival
  and the parent-alert moment together.
- **iOS driver block (Section H):** you will log the **iPhone in as the DRIVER** to test iOS
  background. During that block use the **Oppo as the PARENT** (or just confirm the alert fired on
  the admin panel). There is no in-app role switch — you log out and log back in with the other
  account.

---

## Section 0 — Device & environment setup (do this first, both phones)

- [ ] Open the **admin web panel** on a laptop and go to the **live map** for the test van → Expected: map loads, van's last-known position shows → Pass / Fail / Notes:
- [ ] Confirm the backend the phones point at is running and reachable on the LAN (not `localhost`) → Expected: the login step below succeeds; if login hangs, the API URL is wrong → Pass / Fail / Notes:
- [ ] On the **Oppo**, confirm the installed app name is **CareVan** (`com.aamirtech.carevan`) and it is the **dev-client / preview** build, not Expo Go → Expected: CareVan icon opens the dev build → Pass / Fail / Notes:
- [ ] On the **iPhone**, confirm the installed app is **CareVan** dev build (iOS 16+) → Expected: CareVan opens → Pass / Fail / Notes:
- [ ] Fully charge or note starting battery on **both** phones and enable **mobile data** (turn Wi-Fi OFF so this mirrors a real driver on cellular) → Expected: both on cellular, battery noted → Pass / Fail / Notes:
- [ ] Have ready the **driver** account (phone + PIN) and a **parent** account whose child is on this van's roster → Expected: both credentials on hand → Pass / Fail / Notes:
- [ ] On the **iPhone (parent)**, log in with the **parent** account → Expected: reaches "Parent app is coming next" placeholder → Pass / Fail / Notes:
- [ ] With the parent logged in, **grant the notification permission prompt** if it appears → Expected: permission granted so the push token registers (this is required for parent pushes to arrive) → Pass / Fail / Notes:

---

## Section A — Fresh-install battery-whitelist onboarding (Oppo only)

> If CareVan was already installed on the Oppo, uninstall it first so this is a genuine fresh install.

- [ ] On the **Oppo**, open the freshly installed CareVan and log in with the **driver** account → Expected: reaches the driver home ("Today") screen → Pass / Fail / Notes:
- [ ] Look at the top of the Today screen → Expected: an **amber warning banner** "Action needed to keep alerts working" is visible → Pass / Fail / Notes:
- [ ] **Skip it for now:** leave the banner, go back to the phone home screen, reopen CareVan → Expected: the amber banner is **still there** (it persists until whitelisting is acknowledged) → Pass / Fail / Notes:
- [ ] **Tap the amber banner** → Expected: opens the "Keep CareVan running" screen with **Oppo-specific numbered steps** (Battery → App Battery Management; turn off Optimize/Sleep; allow Auto-start; lock in recents) → Pass / Fail / Notes:
- [ ] Tap **"Open phone settings"** → Expected: the phone's system Settings for CareVan opens → Pass / Fail / Notes:
- [ ] In ColorOS settings, set CareVan battery usage to **unrestricted / don't optimize / don't sleep** → Expected: setting applied → Pass / Fail / Notes:
- [ ] In ColorOS settings, turn **Auto-start / Startup ON** for CareVan → Expected: enabled → Pass / Fail / Notes:
- [ ] Open **recent apps**, pull down on the CareVan card and tap the **lock icon** → Expected: CareVan is locked in recents → Pass / Fail / Notes:
- [ ] Return to CareVan and tap **"I've enabled it"** → Expected: returns to Today screen and the **amber banner is gone** → Pass / Fail / Notes:
- [ ] Reopen CareVan once more → Expected: banner **stays gone** on reopen (acknowledgement persisted) → Pass / Fail / Notes:

---

## Section B — Start a trip & location permission (Oppo, driver)

- [ ] On the **Oppo (driver)**, on Today, tap **"Start morning pickup"** → Expected: a location permission prompt appears → Pass / Fail / Notes:
- [ ] Grant location as **"Allow all the time" / Always** (foreground + background) → Expected: prompt(s) accepted; if you only grant "While using", the app warns location is needed → Pass / Fail / Notes:
- [ ] Observe after granting → Expected: the **Active Trip** screen opens showing the student roster → Pass / Fail / Notes:
- [ ] Pull down the notification shade → Expected: a persistent **"CareVan trip in progress"** notification is present (foreground service running) → Pass / Fail / Notes:
- [ ] Look at the **admin live map** → Expected: the van marker starts updating (advances roughly every 10-20 seconds while the phone moves) → Pass / Fail / Notes:
- [ ] Look at the Active Trip header sync line → Expected: shows **"All synced"** (green) once pings/events are uploaded → Pass / Fail / Notes:

---

## Section C — ColorOS survival: battery saver on, backgrounded, screen locked (Oppo)

> This is the reliability bar. Keep the trip from Section B running. Walk/drive the route so the
> phone is actually moving. **Do NOT kill the app in this section** — that is Section D.

- [ ] Turn **Battery Saver ON** on the Oppo (from Quick Settings) → Expected: battery saver active, trip still running → Pass / Fail / Notes:
- [ ] Record the current time and the van's position on the admin map → Expected: baseline noted → Pass / Fail / Notes:
- [ ] Press the phone power button to **lock the screen** and put the phone in your pocket → Expected: screen off, "CareVan trip in progress" notification still listed → Pass / Fail / Notes:
- [ ] Leave CareVan **backgrounded with the screen locked for 15 minutes** while moving (open another app first if you want it truly backgrounded, then lock) → Expected: you can walk away and do the demo pitch → Pass / Fail / Notes:
- [ ] After ~15 min, check the **admin live map without touching the Oppo** → Expected: the van marker **kept moving the whole time** — new pings arrived roughly every 10-20 s throughout, no long gap → Pass / Fail / Notes:
- [ ] Wake the Oppo and reopen CareVan → Expected: still on the Active Trip screen, roster intact, sync line green → Pass / Fail / Notes:
- [ ] Turn **Battery Saver OFF** again → Expected: trip unaffected → Pass / Fail / Notes:

---

## Section D — App killed from recents mid-trip: kill recovery (Oppo)

> Keep the same trip running. This proves a crash/OEM-kill loses nothing.

- [ ] While the trip is active, tap **"On board"** for the **first** student on the roster → Expected: that student flips to a Boarded status and the action buttons disappear for them → Pass / Fail / Notes:
- [ ] Open **recent apps** and **swipe CareVan away** (force kill) → Expected: app closes; "CareVan trip in progress" notification disappears (service killed) → Pass / Fail / Notes:
- [ ] Reopen CareVan from the home screen → Expected: it opens on Today and shows a **"Resume active trip"** button (kill recovery detected the in-progress trip) → Pass / Fail / Notes:
- [ ] Tap **"Resume active trip"** → Expected: Active Trip screen reappears; the first student **still shows Boarded** (recovered from server + local queue) → Pass / Fail / Notes:
- [ ] Check the notification shade → Expected: **"CareVan trip in progress"** notification is back (tracking resumed automatically) → Pass / Fail / Notes:
- [ ] Check the **admin live map** → Expected: van pings resume; check the admin event/alert log shows the first student's BOARDED **exactly once** (no duplicate from the kill/resume) → Pass / Fail / Notes:

---

## Section E — Network drop mid-trip: offline queue, in-order sync, no duplicates (Oppo)

> Still the same trip. This is the offline-first heart of the driver app.

- [ ] Turn **Airplane mode ON** on the Oppo (fully offline) → Expected: no signal; trip screen still usable → Pass / Fail / Notes:
- [ ] Tap **"On board"** for **student #2** → Expected: student #2 flips to Boarded instantly (written locally first), buttons disappear → Pass / Fail / Notes:
- [ ] Tap **"On board"** for **student #3** → Expected: student #3 flips to Boarded instantly → Pass / Fail / Notes:
- [ ] Look at the Active Trip header sync line → Expected: shows **"Syncing 2 updates…"** (amber) — the taps are queued, not lost → Pass / Fail / Notes:
- [ ] Try to double-tap an already-boarded student → Expected: **no action buttons remain** on boarded students, so a second BOARDED cannot be created → Pass / Fail / Notes:
- [ ] Leave airplane mode ON for **5 minutes**, keep walking the route → Expected: app stays responsive, still shows queued count → Pass / Fail / Notes:
- [ ] Turn **Airplane mode OFF** → Expected: within ~30 seconds the sync line flips to **"All synced"** (green) → Pass / Fail / Notes:
- [ ] On the **admin event/alert log**, check students #2 and #3 → Expected: both BOARDED events present, **in the order tapped**, each **exactly once** (no duplicates) → Pass / Fail / Notes:
- [ ] On the **iPhone (parent)**, check for the parent whose child is #2 or #3 → Expected: the **BOARDED push arrived** after reconnect, and **only one** push per child (no duplicate alerts) → Pass / Fail / Notes:
- [ ] Confirm the queued **pings** from the offline window also uploaded → Expected: admin map back-fills the route travelled while offline; no permanent gap → Pass / Fail / Notes:

---

## Section F — The parent-alert moment: BOARDED push (iPhone as parent)

> The hero feature. Test the push with the parent phone locked AND the parent app killed.

- [ ] On the **iPhone (parent)**, confirm it is logged in as the parent, then **force-quit** the CareVan app (swipe up from app switcher) → Expected: parent app fully closed → Pass / Fail / Notes:
- [ ] **Lock** the iPhone screen → Expected: screen off, app killed → Pass / Fail / Notes:
- [ ] On the **Oppo (driver)**, tap **"On board"** for a **not-yet-boarded** student belonging to this parent → Expected: driver sees the student flip to Boarded → Pass / Fail / Notes:
- [ ] Watch the **locked iPhone** → Expected: a **BOARDED push notification arrives on the lock screen** even though the parent app was killed (this is the critical pass) → Pass / Fail / Notes:
- [ ] Note the delay from driver tap to push arrival → Expected: a few seconds (record actual seconds) → Pass / Fail / Notes:
- [ ] **Tap the BOARDED push** → Expected (Phase 3 reality): CareVan opens to the **"Parent app is coming next" placeholder**. The child-status deep-link is **Phase 4 — not built**; do not mark this a failure, just note "deep-link not built" → Pass / Fail / Notes:
- [ ] Cross-check the **admin alert log** → Expected: an AlertLog row exists for this BOARDED (no alert is sent without a log row) → Pass / Fail / Notes:

---

## Section G — SOS (Oppo driver → parent alert)

- [ ] On the **Oppo (driver)** Active Trip screen, tap the red **SOS** button → Expected: a confirmation dialog appears ("Send SOS?") — it does **not** fire on a single tap → Pass / Fail / Notes:
- [ ] Tap **Cancel** → Expected: dialog closes, no SOS sent → Pass / Fail / Notes:
- [ ] Tap **SOS** again, then **"Send SOS"** to confirm → Expected: a confirmation "SOS sent — N parents were alerted" appears with a real count → Pass / Fail / Notes:
- [ ] On the **iPhone (parent)** → Expected: an **SOS push arrives** (lock screen / notification) → Pass / Fail / Notes:
- [ ] Check the **admin alert log** → Expected: an SOS AlertLog row exists for this trip → Pass / Fail / Notes:

---

## Section H — iOS background location + kill recovery (iPhone as DRIVER)

> Now swap roles on the iPhone. Log the parent out and log the **driver** account in. During this
> block, if you want to see the parent push, log the **Oppo** in as the parent; otherwise verify
> alerts on the admin panel.

- [ ] On the **iPhone**, log out of the parent account and log in with the **driver** account → Expected: reaches the driver Today screen (no battery banner — correct, iOS is not an aggressive OEM) → Pass / Fail / Notes:
- [ ] Tap **"Start morning pickup"** → Expected: iOS location prompt appears offering **"Allow While Using App"** → Pass / Fail / Notes:
- [ ] Choose **"Allow While Using App"** → Expected: the app then requests the upgrade to **"Always Allow"** (the While-Using → Always flow) → Pass / Fail / Notes:
- [ ] Choose **"Change to Always Allow"** → Expected: Active Trip screen opens; trip starts → Pass / Fail / Notes:
- [ ] Check the **admin live map** → Expected: van pings from the iPhone start appearing → Pass / Fail / Notes:
- [ ] **Lock** the iPhone and pocket it; walk/drive for ~10 minutes → Expected: on the admin map, pings **keep flowing with the screen locked** (a blue location indicator may show on iOS) → Pass / Fail / Notes:
- [ ] Tap **"On board"** for one student, then **force-quit** CareVan on the iPhone from the app switcher → Expected: app closes → Pass / Fail / Notes:
- [ ] Reopen CareVan on the iPhone → Expected: Today shows **"Resume active trip"**; tapping it restores the roster with that student still Boarded (iOS kill recovery) → Pass / Fail / Notes:
- [ ] (Optional, if a parent device is logged in) Tap BOARDED for a student while the parent phone is locked/killed → Expected: BOARDED push arrives on the parent phone → Pass / Fail / Notes:
- [ ] Confirm on the admin log the iPhone-side BOARDED appears **exactly once** across the kill/resume → Expected: no duplicate → Pass / Fail / Notes:

---

## Section I — Battery & data budget (one full trip, per phone)

> Measure over **one complete trip** (start → drive the route → end). Do this on the Oppo, and
> ideally repeat on the iPhone.

- [ ] **Before starting** the measured trip, note the exact **battery %** → Expected: value recorded (Oppo: ____ %, iPhone: ____ %) → Pass / Fail / Notes:
- [ ] **Before starting**, note CareVan's **mobile-data baseline** (Oppo: Settings → Mobile data usage → CareVan; iPhone: Settings → Cellular → CareVan — reset statistics for a clean number) → Expected: baseline recorded → Pass / Fail / Notes:
- [ ] Run a **full real trip** start-to-end (target a normal route length, ~15-30 min) with the screen mostly locked → Expected: trip completes normally → Pass / Fail / Notes:
- [ ] **After ending** the trip, note battery % again and compute the drop → Expected: **battery used ≤ 3%**; **FLAG if > 3%** (Oppo: ____ %, iPhone: ____ %) → Pass / Fail / Notes:
- [ ] **After ending**, note CareVan data used and compute the delta → Expected: **data used ≤ 5 MB**; **FLAG if > 5 MB** (Oppo: ____ MB, iPhone: ____ MB) → Pass / Fail / Notes:

---

## Section J — End trip & teardown (both phones)

- [ ] On the driver phone, tap **"End trip"** and confirm **"End trip"** → Expected: confirmation dialog, then returns to Today; trip closed → Pass / Fail / Notes:
- [ ] Check the notification shade → Expected: **"CareVan trip in progress"** notification is **gone** (tracking stopped immediately on trip end) → Pass / Fail / Notes:
- [ ] Check the **admin live map** → Expected: the van's pings **stop** after trip end (no tracking outside an active trip) → Pass / Fail / Notes:
- [ ] Confirm the Today screen shows **"Start a trip"** again (not "Resume active trip") → Expected: no lingering active trip → Pass / Fail / Notes:

---

## Sign-off

- **Critical (BOARDED/SOS push + ColorOS survival) all passed?** Yes / No — if No, this build is **not** field-ready.
- **Battery budget (≤ 3%):** Oppo ____ % · iPhone ____ % · Flagged? Yes / No
- **Data budget (≤ 5 MB):** Oppo ____ MB · iPhone ____ MB · Flagged? Yes / No
- **Any duplicate events or duplicate pushes observed?** Yes / No (must be No)
- **Overall go / no-go for founder demos:** ______________
- **Tester / date:** ______________

# Field test — DRIVER app on Oppo F21 Pro (ColorOS)

**Date:** 2026-07-03
**Device under test:** Oppo F21 Pro — ColorOS (the reliability bar: ColorOS aggressively kills
background apps).
**Build:** CareVan Expo **dev-client** APK (NOT Expo Go — background location will not work in
Expo Go). App id `com.aamirtech.carevan`, display name "CareVan".
**Backend:** NestJS at `http://localhost:3005`, reached from the phone over the USB adb-reverse
tunnel. The app's `extra.apiUrl` is already `http://localhost:3005`, so the tunnel is what makes it
work.

**Driver login (this is a REAL van, not the demo van):**
- Phone `+923004561122` — PIN `1122` — Muhammad Akram
- Owns van **LEB-2341**, school **Gulberg Grammar School**, **5 students** on the roster
  (stop order): 1 Zara Khan, 2 Hamza Khan, 3 Ibrahim Ahmed, 4 Ali Siddiqui, 5 Fatima Tariq.

**What the 2nd phone / admin is for — you cannot confirm an alert from the driver phone alone:**
- **2nd phone (the parent, "the alert moment"):** log in as **Ayesha Khan `+923331234501` / PIN
  `3344`**. Ayesha is the parent of **Zara and Hamza**, so tapping either of those two on the
  driver produces a push to this one phone. Keep it beside you.
- **Admin audit log (source of truth for delivery):** log in to the admin web tool as **Haris
  `+923214000001` / PIN `7788`** and open the **alert audit log** and the **live map**. Every
  alert appears there as CREATED -> SENT -> DELIVERED (or FAILED), even if a push is slow. When the
  parent phone and the audit log disagree, believe the audit log.

**Read this before you start — three things that WILL confuse a field test if you don't know them:**
1. **REACHED SCHOOL / REACHED HOME only fire at the seeded Lahore coordinates.** The geofence is a
   200 m circle around fixed seeded points (Gulberg school = 31.5102, 74.3441; each student's seeded
   home). Standing at a random gate you are NOT inside those circles, so those two alerts will NOT
   fire — that is expected, not a failure. BOARDED / DROPPED / ABSENT / SOS / OVERSPEED do NOT
   depend on location and are testable anywhere. To actually see REACHED alerts, either drive to the
   seeded coordinates or use Demo Mode (separate demo checklist).
2. **The live map moves about every ~30 seconds, not instantly.** Pings are recorded every ~12 s but
   uploaded in a ~30 s batch to save battery/data. A 30–40 s lag on the map is correct behaviour.
3. **The battery-whitelist "I've enabled it" button is self-reported.** The app cannot read
   ColorOS's actual whitelist state, so the button clears the warning banner whether or not you
   really changed the setting. You must verify the *real* protection by the background-survival test
   (Section 4 / 11), not by the banner disappearing.

**How to fill each line:** `[ ] Step -> Expected -> Pass / Fail / Notes`. Do one action, watch,
mark it, move on. You are outdoors holding two phones — take it one line at a time.

**Make-or-break sections (if you only have 15 minutes, run these):** 4 (background survival),
5 (BOARDED push), 6 (offline queue), 7 (app-kill recovery), 11 (ColorOS auto-kill).

---

## 0. Device & backend setup (do these first, at the desk, before the van)

- [ ] Start the backend on the laptop and confirm it is seeded -> terminal shows it listening on
      port 3005; the seeded driver/parents exist -> Pass / Fail / Notes: ____
- [ ] Connect the Oppo by USB, then run `adb reverse tcp:3005 tcp:3005` on the laptop -> command
      returns with no error (this is what lets the phone reach localhost:3005) -> Pass / Fail /
      Notes: ____
- [ ] Confirm the installed app is the dev-client CareVan build (icon + name "CareVan"), NOT Expo
      Go -> app opens to the CareVan login, no Expo Go shell -> Pass / Fail / Notes: ____
- [ ] On the 2nd phone, open CareVan and log in as Ayesha `+923331234501` / `3344`; accept the
      notification permission prompt -> lands on the parent child-status screen; notifications
      allowed -> Pass / Fail / Notes: ____
- [ ] On the laptop, open the admin tool as Haris `+923214000001` / `7788`; open the alert audit
      log and the live map in two tabs -> both load -> Pass / Fail / Notes: ____
- [ ] Note the driver phone's starting **battery %** and reset/note its **mobile-data** counter for
      CareVan -> baseline written down -> Pass / Fail / Notes: ____

---

## 1. Driver login -> Today screen with the correct van

- [ ] Open CareVan on the Oppo -> the login screen shows the CareVan logo and phone + PIN fields ->
      Pass / Fail / Notes: ____
- [ ] Enter phone `03004561122` (or `+923004561122`) and PIN `1122`, tap **Sign in** -> signs in,
      no error banner -> Pass / Fail / Notes: ____
- [ ] Read the Today header -> greeting + first name "Akram" shown -> Pass / Fail / Notes: ____
- [ ] Read the van card -> shows **Gulberg Grammar School** and "**5 students on your route**" ->
      Pass / Fail / Notes: ____
- [ ] Confirm the bottom tabs -> two tabs only, **Today** and **Profile** (no role-switch UI) ->
      Pass / Fail / Notes: ____

---

## 2. Battery-whitelist screen (CRITICAL for ColorOS)

- [ ] On the Today screen look for the amber banner near the top -> a "**Keep alerts working /
      Allow CareVan to run in the background**" banner is shown (ColorOS/Oppo was detected) ->
      Pass / Fail / Notes: ____
- [ ] Tap the banner -> the "Background permission / Keep CareVan running" screen opens ->
      Pass / Fail / Notes: ____
- [ ] Read the numbered steps -> they are **Oppo/ColorOS-specific** (Battery -> App Battery
      Management, turn OFF Optimize/Sleep; Apps -> CareVan -> allow Auto-start; lock CareVan in
      recent apps) -> Pass / Fail / Notes: ____
- [ ] Tap **Open phone settings** -> the system Settings app opens (CareVan's app-settings page or
      Settings home) -> Pass / Fail / Notes: ____
- [ ] Actually perform the steps in ColorOS: set CareVan battery usage to **Don't
      optimize / Allow background**, enable **Auto-start**, and **lock** CareVan in the recent-apps
      card -> each toggle sticks -> Pass / Fail / Notes: ____
- [ ] Return to CareVan and tap **I've enabled it** -> returns to Today and the amber banner is now
      **gone** -> Pass / Fail / Notes: ____
- [ ] Fully close and reopen CareVan (from the launcher) -> Today loads and the banner **stays
      gone** (the acknowledgement persisted) -> Pass / Fail / Notes: ____
- [ ] (Sanity) Remember: the banner clearing only records that you *said* you did it. The real proof
      is Section 4/11 -> note whether you genuinely completed the ColorOS toggles -> Pass / Fail /
      Notes: ____

---

## 3. Start a PICKUP trip -> foreground service + tracking begin (CRITICAL)

- [ ] On Today, tap **Morning pickup** -> a location permission prompt appears -> Pass / Fail /
      Notes: ____
- [ ] Grant location, choosing **Allow all the time** (on ColorOS this may require opening
      Settings -> Location -> Allow all the time; "While using the app" is NOT enough) -> permission
      granted as *all the time* -> Pass / Fail / Notes: ____
      - If you only see "Only this time / While using", the trip may refuse to start with a
        "Location needed" alert. Go to Settings and pick Allow all the time, then retry.
- [ ] After granting -> the app moves to the **Active trip** screen titled "Morning pickup" with the
      5 students listed in stop order -> Pass / Fail / Notes: ____
- [ ] Pull down the ColorOS notification shade -> a persistent notification "**CareVan trip in
      progress — Sharing the van location so parents get alerts**" is present and cannot be swiped
      away -> Pass / Fail / Notes: ____
- [ ] Look at the sync chip at the top of the Active trip screen -> shows "**All synced**" (green)
      or briefly "Syncing" while the first pings upload -> Pass / Fail / Notes: ____
- [ ] On the admin **live map**, wait ~30–40 s -> van LEB-2341 appears / updates its position ->
      Pass / Fail / Notes: ____

---

## 4. Background tracking survives (CRITICAL — the ColorOS bar)

- [ ] With the trip active, press the home button to background CareVan, then **lock the screen**
      and put the Oppo in your pocket -> phone locked, app in background -> Pass / Fail / Notes: ____
- [ ] Walk / drive for **at least 5 minutes** -> (nothing to watch on the phone yet) -> Pass / Fail
      / Notes: ____
- [ ] On the admin live map during those 5 minutes -> van position keeps updating roughly every
      ~30 s the whole time (it does NOT freeze) -> Pass / Fail / Notes: ____
- [ ] Turn on ColorOS **battery saver**, keep the screen locked, wait another 5 minutes -> pings
      still keep arriving on the live map -> Pass / Fail / Notes: ____
- [ ] Unlock and reopen CareVan -> still on the Active trip, sync chip returns to "All synced" ->
      Pass / Fail / Notes: ____
- [ ] (If pings stopped) Note exactly when they stopped and whether battery saver / screen-lock
      triggered it -> recorded for engineering -> Pass / Fail / Notes: ____

---

## 5. Boarding taps -> parent gets the push (CRITICAL — a missed BOARDED alert is a product failure)

- [ ] Have the 2nd phone (Ayesha) **locked**. On the driver Active trip, tap **On board** on **Zara
      Khan** (stop 1) -> Zara's row switches to a green "**On board**" chip and the tap buttons
      disappear from her row -> Pass / Fail / Notes: ____
- [ ] Watch the 2nd phone (Ayesha) -> a **BOARDED push** arrives ("Zara …") within a few seconds ->
      Pass / Fail / Notes: ____
- [ ] Tap that push on the 2nd phone -> it deep-links to Zara's child-status screen -> Pass / Fail
      / Notes: ____
- [ ] On the admin audit log -> a **BOARDED** AlertLog row for Zara/Ayesha shows, moving CREATED ->
      SENT -> DELIVERED -> Pass / Fail / Notes: ____
- [ ] Tap **On board** on **Hamza Khan** (stop 2, also Ayesha's child) -> 2nd phone gets a second
      BOARDED push; audit log shows a second row -> Pass / Fail / Notes: ____
- [ ] Tap **Absent** on **Ali Siddiqui** (stop 4) -> Ali's row shows an amber "**Absent**" chip;
      buttons disappear -> Pass / Fail / Notes: ____
- [ ] Confirm the re-tap guard -> once a student is marked, that row shows only a status chip with
      **no** tap buttons (you cannot double-fire the same event) -> Pass / Fail / Notes: ____
- [ ] Usability check (one hand, standing at the van door): are the roster **On board / Absent**
      buttons easy to hit without mis-taps? -> tappable comfortably -> Pass / Fail / Notes: ____
      - Note for engineering: these roster buttons render ~40 px tall, below the 56 px touch-target
        guideline; the full-width **End trip** button at the bottom is the large primary target.
        Flag if the small buttons cause mis-taps.

---

## 6. Offline resilience — airplane mode mid-trip (CRITICAL)

- [ ] With the trip still active, turn ON **airplane mode** on the driver phone -> no network ->
      Pass / Fail / Notes: ____
- [ ] Tap **On board** on **Ibrahim Ahmed** (stop 3) -> his row instantly shows "On board" even
      with no signal (the tap is saved locally first) -> Pass / Fail / Notes: ____
- [ ] Tap **On board** on **Fatima Tariq** (stop 5) -> her row shows "On board" too -> Pass / Fail /
      Notes: ____
- [ ] Look at the sync chip -> it now reads "**Syncing N updates**" (amber) and the count does not
      go away while offline -> Pass / Fail / Notes: ____
- [ ] Confirm the 2nd phone / audit log got **nothing yet** for Ibrahim & Fatima (still offline) ->
      no premature push -> Pass / Fail / Notes: ____
- [ ] Wait ~5 minutes offline, keep walking -> app stays responsive, no crash, pending count holds
      -> Pass / Fail / Notes: ____
- [ ] Turn OFF airplane mode -> within ~30 s the sync chip returns to "**All synced**" (green) ->
      Pass / Fail / Notes: ____
- [ ] On reconnect, watch the 2nd phone / audit log -> BOARDED pushes for Ibrahim and Fatima arrive
      (in order), and **exactly one** alert each — no duplicates -> Pass / Fail / Notes: ____
- [ ] Confirm the map back-filled the pings recorded while offline -> the offline stretch of the
      route appears once network is back -> Pass / Fail / Notes: ____

---

## 7. App-killed recovery (CRITICAL)

- [ ] With the trip active, open recent-apps and **force-kill CareVan** (swipe it away) -> app is
      gone from memory; the "trip in progress" notification disappears -> Pass / Fail / Notes: ____
- [ ] Reopen CareVan from the launcher -> it opens straight into the **Active trip** screen (the
      in-progress trip rehydrated) — you are NOT dumped back to Today with no trip -> Pass / Fail /
      Notes: ____
- [ ] Check the notification shade -> the "CareVan trip in progress" foreground notification is back
      (tracking restarted) -> Pass / Fail / Notes: ____
- [ ] Confirm earlier statuses survived -> Zara/Hamza still "On board", Ali still "Absent",
      Ibrahim/Fatima still "On board" -> Pass / Fail / Notes: ____
- [ ] On the admin live map -> pings resume within ~30–40 s of reopening -> Pass / Fail /
      Notes: ____
- [ ] (If any queued tap had not synced before the kill) -> it still syncs after reopen; audit log
      shows one alert, no duplicate -> Pass / Fail / Notes: ____

---

## 8. Overspeed alert — throttled (do this SAFELY)

**Safety first:** never operate the phone while driving and never speed with children aboard. Do
this with a second person driving on a clear road, phone mounted, no kids in the van. The trigger is
GPS speed above **60 km/h**.

- [ ] With the trip active, have the driver briefly exceed **60 km/h** on a safe open stretch (GPS
      speed, not speedometer) -> (continue) -> Pass / Fail / Notes: ____
- [ ] Watch the 2nd phone / audit log -> **one** OVERSPEED alert fires to on-board parents ->
      Pass / Fail / Notes: ____
- [ ] Stay above 60 for another minute or two -> **no** second OVERSPEED alert (throttled to one per
      trip per ~5 min — parents are not spammed) -> Pass / Fail / Notes: ____
- [ ] On the admin side, confirm a SafetyEvent / overspeed record exists for the trip -> overspeed
      logged for the driver safety score even though only one alert was sent -> Pass / Fail /
      Notes: ____
- [ ] Slow back below 60 -> no further alerts -> Pass / Fail / Notes: ____

---

## 9. SOS button

- [ ] On the Active trip header, tap the red **SOS** button -> a confirmation dialog appears ("Send
      SOS? This alerts all parents on your van…") — it does NOT send on the first tap -> Pass / Fail
      / Notes: ____
- [ ] Tap **Send SOS** in the dialog -> a success alert shows "SOS sent — N parents were alerted" ->
      Pass / Fail / Notes: ____
- [ ] Watch the 2nd phone (Ayesha) -> an **SOS push** arrives -> Pass / Fail / Notes: ____
- [ ] On the admin audit log -> an **SOS** alert row appears for the trip (admin sees the
      emergency), status progressing to DELIVERED -> Pass / Fail / Notes: ____
- [ ] Confirm red is used only here -> SOS is the only red element on the driver screen ->
      Pass / Fail / Notes: ____

---

## 10. End trip -> service + tracking stop, queue flushed

- [ ] Tap **End trip** at the bottom of the Active trip screen -> a confirm dialog ("End this trip?
      Location tracking will stop…") appears -> Pass / Fail / Notes: ____
- [ ] Tap **End trip** to confirm -> returns to the Today screen -> Pass / Fail / Notes: ____
- [ ] Pull down the notification shade -> the "CareVan trip in progress" notification is **gone**
      (foreground service stopped immediately) -> Pass / Fail / Notes: ____
- [ ] On the admin live map -> the van stops sending new pings shortly after end -> Pass / Fail /
      Notes: ____
- [ ] Confirm the outbox flushed -> before ending, any pending taps/pings synced; the trip shows the
      full set of events in the audit log with no leftovers -> Pass / Fail / Notes: ____
- [ ] Today now offers to start a fresh trip (no "Resume active trip" button) -> trip fully closed
      -> Pass / Fail / Notes: ____

---

## 11. ColorOS edge — system auto-kill while backgrounded (CRITICAL)

This is the real ColorOS failure mode: the OS kills the app on its own while it is in the
background, without you touching it.

- [ ] Start a fresh PICKUP trip, mark one student **On board**, then background the app and lock the
      screen -> foreground notification present, one BOARDED queued/sent -> Pass / Fail /
      Notes: ____
- [ ] Leave the Oppo untouched and locked for **15–20 minutes** with battery saver ON (let ColorOS
      decide to kill it) -> waiting -> Pass / Fail / Notes: ____
- [ ] During that window, watch the admin live map -> pings ideally keep flowing; note the exact
      time they stop if they do -> Pass / Fail / Notes: ____
- [ ] After the wait, unlock and reopen CareVan -> it rehydrates into the **Active trip** with the
      earlier "On board" status intact, and tracking + the foreground notification restart ->
      Pass / Fail / Notes: ____
- [ ] Confirm no queued event was lost -> the earlier BOARDED is present exactly once in the audit
      log; any ping backlog uploads on reopen -> Pass / Fail / Notes: ____
- [ ] Verdict: did background tracking survive the system without needing you to reopen the app? ->
      YES = the whitelist steps held; NO = ColorOS killed it (re-do Section 2 more thoroughly and
      retest) -> Pass / Fail / Notes: ____

---

## 12. Battery & data budget (record over one full trip)

- [ ] Compare battery % now vs the Section 0 baseline over one full trip -> record the drain -> Pass
      / Fail / Notes: ____  (**Flag if > 3% for the trip.**)
- [ ] Check CareVan's mobile-data usage for the trip -> record MB used -> Pass / Fail / Notes: ____
      (**Flag if > 5 MB for the trip.**)
- [ ] Overall: did the app stay responsive and drama-free for the whole trip one-handed at the van
      door? -> note anything that felt slow, small, or confusing -> Pass / Fail / Notes: ____

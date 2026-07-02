# Field test — Driver flow (Phase 3)

Target devices: **Oppo F21 Pro (ColorOS)** — the reliability bar — and **iPhone (iOS 16+)** dev
build. Run outdoors, one-handed, as if at a school gate. Format: `[ ] Step → Expected → Pass/Fail/Notes`.

Prereqs: backend reachable from the phone (set `EXPO_PUBLIC_API_URL` / app.json `extra.apiUrl` to
the dev machine's LAN IP, not localhost); dev-client build installed (`eas build --profile
development`); seeded Lahore data; a second phone (or the admin web) logged in as a parent of a
student on this van to watch alerts.

## A. Device setup (do first)

- [ ] Fresh install, open app → login screen shows → **Expected:** CareVan brand + phone/PIN form.
- [ ] Log in as driver `+923004561122` / PIN `1122` → **Expected:** Today screen with school name + student count.
- [ ] On the Oppo, Today screen shows the amber "Action needed" battery banner → **Expected:** banner visible (aggressive-OEM detected).
- [ ] Tap banner → BatteryWhitelist screen → follow ColorOS steps → tap "Open phone settings" → **Expected:** system settings open on the CareVan app page.
- [ ] Disable battery optimization + enable Auto-start for CareVan, lock it in recent apps → back in app tap "I've enabled it" → **Expected:** returns to Today, banner gone.
- [ ] iPhone: no battery banner (not an aggressive OEM) → **Expected:** banner absent.

## B. Permissions

- [ ] Tap "Start morning pickup" → OS location prompt → choose **Allow all the time** (iOS: While Using → then upgrade to Always) → **Expected:** trip starts, ActiveTrip screen opens.
- [ ] Decline location instead → **Expected:** alert explaining "Allow all the time" is required; trip does NOT start.

## C. The alert moment (core)

- [ ] On ActiveTrip, tap "On board" for the first student → **Expected:** row shows "On board" pill, action buttons disappear; parent phone gets a **"<name> boarded the van"** push within ~10s.
- [ ] Parent phone locked + parent app killed when you tap → **Expected:** push still arrives on the lock screen.
- [ ] Tap "On board" again is impossible (no button) → **Expected:** cannot create a duplicate boarding; parent gets exactly ONE push.
- [ ] Drive the van toward school (or simulate) → within the school geofence → **Expected:** parent gets **"<name> reached school"** ~ once, roughly a minute after boarding.

## D. ColorOS survival (the Oppo bar)

- [ ] Battery saver ON. Start a pickup, tap 2 students boarded, lock the screen, put phone in pocket 15 min while "driving" → **Expected:** persistent "CareVan trip in progress" notification stays; admin live view keeps receiving pings; no crash.
- [ ] After 15 min backgrounded, unlock → **Expected:** ActiveTrip still shows correct per-student statuses; "All synced ✓".
- [ ] Kill CareVan from recent apps mid-trip → reopen → **Expected:** app reopens to a recoverable state (Today shows "Resume active trip"); tapping it restores the roster + statuses; tracking resumes (notification returns).

## E. Network drop (offline queue)

- [ ] Airplane mode ON mid-trip. Tap "On board" for 2 students and "Absent" for 1 → **Expected:** rows update instantly; header shows "⟳ Syncing N updates…".
- [ ] Keep tapping / wait 2 min offline → **Expected:** no errors, taps persist, statuses correct.
- [ ] Airplane mode OFF → wait ~30s → **Expected:** header flips to "✓ All synced"; parent receives the boarded pushes (in order), and NO duplicate pushes.
- [ ] Force-kill while still offline, reopen with network on → **Expected:** queued taps from before the kill still sync (outbox survived the kill).

## F. SOS

- [ ] Tap the red **SOS** button (top-right of ActiveTrip) → confirm dialog → **Expected:** two-step confirm; on confirm, "SOS sent — N parents alerted"; every parent on the van gets an EMERGENCY push.
- [ ] Cancel the SOS dialog → **Expected:** nothing sent.

## G. iOS background

- [ ] Start a trip, lock the iPhone, "drive" 10 min → **Expected:** pings keep flowing (check admin live view); trip survives.
- [ ] Kill the app on iOS mid-trip → reopen → **Expected:** "Resume active trip" recovery works.
- [ ] Boarded push arrives with the app killed → **Expected:** yes, tapping it opens CareVan.

## H. Budget

- [ ] Note battery % before/after one full ~30 min trip on the Oppo → **Expected:** < 3% drain.
- [ ] Note mobile data used by CareVan for one trip (Settings → data usage) → **Expected:** < 5 MB.
- [ ] End the trip → **Expected:** "CareVan trip in progress" notification disappears; tracking stops (battery/data flat afterward).

---

Log failures with the step letter+number, device, ColorOS/iOS version, and whether battery saver
was on. A failed **C** or **E** item is a release blocker (missed/duplicated alert). A failed **D**
item on the Oppo is a release blocker for Android.

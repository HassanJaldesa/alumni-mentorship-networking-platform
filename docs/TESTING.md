# Running and testing the platform

All commands are for Windows PowerShell, from the project folder
`alumni-mentorship-networking-platform`.

## 1. Start the system

Three terminals:

| Terminal | Commands | Wait for |
|---|---|---|
| A: recommendation service | `cd ml-service` then `.\venv\Scripts\Activate.ps1` then `uvicorn app.main:app --port 8000` | `Application startup complete` |
| B: web app (development) | `cd frontend` then `npm run dev` | `Ready` |
| C: commands | `cd ml-service` then `.\venv\Scripts\Activate.ps1` | |

For the load test, run the web app as a production build instead:
`npm run build` then `npm start` (still on port 3000).

## 2. Data and accounts

| Task | Command (terminal C unless stated) |
|---|---|
| Load the synthetic dataset (30 students, 70 mentors) | `python -m synthetic.load` |
| Remove the synthetic dataset (before the pilot) | `python -m synthetic.load --remove` |
| Create the first administrator (from `frontend`) | `node --env-file=.env.local scripts/create-admin.mjs First Last email@example.com` |

Every synthetic account uses an `@synthetic.test` email and the password `Synthetic2026`.
Further administrators are created from **Users → Create administrator**.

## 3. Automated tests

| What | Command | Requirement |
|---|---|---|
| Unit and integration tests of the recommendation service | `python -m pytest -v` | FR-06, DR-03, DR-05, IR-03 |
| Engine evaluation on the 20 scenarios (Table 5.4) | `python -m synthetic.evaluate` | DR-04 |
| Test cases TC-01 to TC-13 and TC-15 | `python -m synthetic.test_cases --admin-email ... --admin-password ...` | Table of test cases |
| Load test TC-14 (production build of the web app) | `python -m synthetic.load_test` | NFR-01 |
| Fault injection | `python -m synthetic.fault_test` | NFR-07 |

The test-case run writes `synthetic/test_case_results.md` and the load test writes
`synthetic/load_test_results.json`. Both are kept out of Git; record the figures in the report.

## 4. TC-16: browsers (by hand)

In each browser (Chrome, Edge, and a phone-sized window), log in as a synthetic student and
a synthetic mentor and check:

- [ ] Login and registration page displays correctly
- [ ] Onboarding questionnaire saves and the profile page shows the answers
- [ ] Student dashboard shows recommendations with "Matched on" details
- [ ] Mentor profile opens and a mentorship request can be sent
- [ ] Mentor can accept the request from the dashboard
- [ ] A session can be scheduled, rescheduled, completed and given feedback
- [ ] Administrator dashboard, Users and Reports pages display correctly
- [ ] No sideways scrolling on a phone-sized window

## 5. Before the pilot

1. `python -m synthetic.load --remove` so no synthetic accounts remain (DR-04).
2. Create the administrator account(s).
3. Reports exclude `@synthetic.test` accounts by default; use the "Include them" link only for testing.
4. The local deployment runs on HTTP. NFR-04 requires HTTPS, so either deploy behind HTTPS
   for the pilot or state this as a limitation.

## Known limitations

- Deactivating a user blocks new logins immediately; a session that is already open stays
  valid until its 12-hour token expires.
- Accepted mentorships count against a mentor's capacity until they are removed; there is no
  "end mentorship" action.

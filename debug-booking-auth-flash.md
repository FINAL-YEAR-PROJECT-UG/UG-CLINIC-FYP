# Debug Session: booking-auth-flash
- **Status**: [OPEN]
- **Issue**: Unauthenticated users navigating to the booking flow briefly see the authenticated service-selection booking screen before being redirected to the login screen.
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: .dbg/trae-debug-log-booking-auth-flash.ndjson

## Reproduction Steps
1. Open a public page such as Home, Contact, Resources, or About.
2. Navigate to the booking flow.
3. Observe that the booking service-selection screen flashes briefly.
4. The app then redirects to the sign-in screen.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | The booking page is using a persisted authenticated snapshot before the current unauthenticated state is validated. | High | Low | Pending |
| B | The booking page paints protected UI before the guard resolves and redirects. | High | Low | Pending |
| C | Logout or public navigation leaves stale auth data in the store on first paint. | Medium | Medium | Pending |
| D | The redirect to login happens in an effect after the booking form has already rendered once. | High | Low | Pending |
| E | Another navigation path pushes to the booking form route first, then a later auth check corrects it back to login. | Medium | Medium | Pending |

## Log Evidence
- Pending

## Instrumentation
- `frontend/src/components/shared/Header.tsx`: logs the resolved booking target from public navigation clicks.
- `frontend/src/app/demo-booking/page.tsx`: logs first-paint auth snapshot, guard evaluation, and redirect/resolve decisions.

## Verification Conclusion
- Pending

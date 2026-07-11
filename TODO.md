- [x] Create new page: public/resume.html
- [x] Update resume link in src/App.jsx to /resume.html
- [x] Add resume link footer to all app views (login/tasks/notes/profile)
- [ ] Verify navigation flow (main page -> resume page -> drive link)
- [x] Add floating language/theme controls to login/register screen
- [x] Mark task complete after updating App.jsx

## Password reset/API fix
- [x] Add POST /api/forgot-password endpoint in api/index.js
- [x] Align forgot-password payload/UX in src/App.jsx
- [x] Add accessibility improvement for auth username/password fields
- [ ] Verify forgot-password flow end-to-end

## Auth error localization
- [x] Add centralized auth error message mapper in src/App.jsx (he/en)
- [x] Apply mapper to register/login/forgot-password flows
- [ ] Verify localized messages for common API errors (400/401/404/409)

## Tasks ordering
- [x] Show newest tasks first (latest created -> oldest)

## Security-question password reset
- [ ] Add security question + answer to register flow (backend + frontend)
- [ ] Add forgot-password question fetch endpoint
- [ ] Require correct security answer before password reset
- [ ] Validate full auth flow (register -> forgot -> reset -> login)

import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { loadUserTasks, saveUserTasks, loadUserNotes, saveUserNotes } from './userTasksStore'
import StatsPanel from './StatsPanel'

import { getUserByEmail, setSessionEmail, getSessionEmail, clearSession } from './db'
import { apiRegister, apiLogin, apiForgotPassword } from './api'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function App() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('taskease_lang')
    return saved === 'en' ? 'en' : 'he'
  })

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('taskease_theme')
    return saved === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    localStorage.setItem('taskease_lang', lang)
  }, [lang])

  useEffect(() => {
    localStorage.setItem('taskease_theme', theme)
  }, [theme])

  const t = useMemo(() => {
    const dict = {
      he: {
        authModeLabel: 'מצב אימות',
        loginTitle: 'התחברות',
        registerTitle: 'יצירת חשבון',
        login: 'התחברות',
        register: 'הרשמה',
        email: 'אימייל',
        name: 'שם',
        password: 'סיסמה',
        signInButton: 'התחברות',
        createAccountButton: 'צור חשבון',
        logout: 'התנתקות',
        myTasks: 'המשימות שלי',
        all: 'הכל',
        active: 'פעילות',
        done: 'הושלם',
        typeTask: 'כתוב משימה...',
        dueOptional: 'תאריך יעד (לא חובה)',
        create: 'צור',
        noTasksTitle: 'אין משימות כאן.',
        noTasksSub: 'צור משימה למעלה והיא תופיע.',
        markDone: 'סמן כמושלם',
        markNotDone: 'סמן כלא מושלם',
        deleteTask: 'מחק משימה',
        tip: 'טיפ: Enter להוספה. Toggle להשלמה.',
        builtFooter: 'נבנה עם React + Vite',
        demoAuth: 'דמו של אימות באמצעות localStorage.',
      },
      en: {
        loginTitle: 'Sign in',
        registerTitle: 'Create account',
        login: 'Login',
        register: 'Register',
        email: 'Email',
        name: 'Name',
        password: 'Password',
        signInButton: 'Login',
        createAccountButton: 'Create account',
        logout: 'Logout',
        myTasks: 'My tasks',
        all: 'All',
        active: 'Active',
        done: 'Done',
        typeTask: 'Type a task…',
        dueOptional: 'Due (optional)',
        create: 'Create',
        noTasksTitle: 'No tasks here.',
        noTasksSub: 'Create one above and it will show up.',
        markDone: 'Mark as done',
        markNotDone: 'Mark as not done',
        deleteTask: 'Delete task',
        tip: 'Tip: Enter to add tasks. Toggle to complete.',
        builtFooter: 'Built with React + Vite',
        demoAuth: 'Demo auth using localStorage.',
      },
    }
    return dict[lang]
  }, [lang])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const [user, setUser] = useState(() => getUserByEmail(getSessionEmail())?.name || null)
  const [tasks, setTasks] = useState(() => loadUserTasks(getSessionEmail()))
  const [notes, setNotes] = useState(() => loadUserNotes(getSessionEmail()))
  const [selectedNoteId, setSelectedNoteId] = useState(() => loadUserNotes(getSessionEmail())?.[0]?.id || null)

  const [draft, setDraft] = useState('')
  const [timeDraft, setTimeDraft] = useState('')
  const [filter, setFilter] = useState('active') // active | done

  // Auth UI state
  const [authMode, setAuthMode] = useState('login') // login | register | forgot
  const [authEmail, setAuthEmail] = useState('')
  const [authName, setAuthName] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [view, setView] = useState('tasks') // tasks | notes | profile
  const [taskToast, setTaskToast] = useState('')

  useEffect(() => {
    if (!user) return
    saveUserTasks(getSessionEmail(), tasks)
  }, [tasks, user])

  useEffect(() => {
    if (!user) return
    saveUserNotes(getSessionEmail(), notes)
  }, [notes, user])

  const filtered = useMemo(() => {
    if (filter === 'done') return tasks.filter((t) => t.done)
    return tasks.filter((t) => !t.done)
  }, [filter, tasks])

  function addTask() {
    const text = draft.trim()
    const timeText = timeDraft.trim()

    if (!text) return

    const dueAt = timeText ? timeText : null

    setTasks((prev) => [
      { id: crypto.randomUUID(), text, done: false, dueAt },
      ...prev,
    ])
    setDraft('')
    setTimeDraft('')
  }

  function toggleTask(id) {
    setTasks((prev) => {
      let shouldCelebrate = false

      const nextTasks = prev.map((t) => {
        if (t.id !== id) return t
        const nextDone = !t.done
        if (!t.done && nextDone) shouldCelebrate = true
        return { ...t, done: nextDone }
      })

      if (shouldCelebrate) {
        window.requestAnimationFrame(() => {
          document.documentElement.classList.add('gold-flash-now')
          window.setTimeout(() => {
            document.documentElement.classList.remove('gold-flash-now')
          }, 2000)
          setTaskToast(lang === 'en' ? 'Great job! Task completed.' : 'כל הכבוד! המשימה הושלמה')
        })
      }

      return nextTasks
    })
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  function addNote() {
    const id = crypto.randomUUID()
    setNotes((prev) => [{ id, text: '' }, ...prev])
    setSelectedNoteId(id)
    setView('notes')
  }

  function updateNote(id, text) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)))
  }

  function deleteNote(id) {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id)
      if (selectedNoteId === id) {
        setSelectedNoteId(next[0]?.id || null)
      }
      return next
    })
  }

  function createNoteAfter(noteId) {
    const newNote = { id: crypto.randomUUID(), text: '' }
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === noteId)
      if (idx === -1) return [newNote, ...prev]
      return [...prev.slice(0, idx + 1), newNote, ...prev.slice(idx + 1)]
    })
    setSelectedNoteId(newNote.id)
  }

  function handleNoteKeyDown(e, noteId) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      createNoteAfter(noteId)
    }
  }

  function logout() {
    clearSession()
    setUser(null)
    setTasks([])
    setNotes([])
    setDraft('')
    setTimeDraft('')
    setFilter('active')
    setAuthMode('login')
    setAuthEmail('')
    setAuthName('')
    setAuthPassword('')
    setAuthError('')
    setView('tasks')
  }

  async function register() {
    setAuthError('')
    setAuthSuccess('')

    const email = normalizeEmail(authEmail)
    const name = String(authName || '').trim()
    const password = String(authPassword || '')

    if (!email) return setAuthError('Please enter email.')
    if (!name) return setAuthError('Please enter name.')
    if (!password || password.length < 4)
      return setAuthError('Password must be at least 4 characters.')

    try {
      const data = await apiRegister({ email, name, password })
      setSessionEmail(email)
      setUser(data.user?.name || name)
      setTasks([])
      setNotes([])
    } catch (err) {
      setAuthError(err.message || 'Failed to register user.')
    }
  }

  async function login() {
    setAuthError('')
    setAuthSuccess('')

    const email = normalizeEmail(authEmail)
    const password = String(authPassword || '')

    if (!email) return setAuthError('Please enter email.')
    if (!password) return setAuthError('Please enter password.')

    try {
      const data = await apiLogin({ email, password })
      setSessionEmail(email)
      setUser(data.user?.name || null)
      setTasks(loadUserTasks(email))
      setNotes(loadUserNotes(email))
      setView('tasks')
    } catch (err) {
      setAuthError(err.message || 'Invalid email or password.')
    }
  }

  async function forgotPassword() {
    setAuthError('')
    setAuthSuccess('')

    const email = normalizeEmail(authEmail)
    const newPassword = String(resetPassword || '')

    if (!email) return setAuthError('Please enter email.')
    if (!newPassword || newPassword.length < 4)
      return setAuthError('Password must be at least 4 characters.')

    try {
      const data = await apiForgotPassword({ email, newPassword })
      setResetPassword('')
      setAuthPassword('')
      setAuthName('')
      setAuthMode('login')
      setAuthSuccess(data.message || 'Password updated successfully. Please login.')
    } catch (err) {
      setAuthError(err.message || 'Failed to update password.')
    }
  }

  useEffect(() => {
    if (!taskToast) return
    const timer = window.setTimeout(() => setTaskToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [taskToast])

  const activeCount = tasks.filter((t) => !t.done).length
  const doneCount = tasks.filter((t) => t.done).length
  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null
  const sessionEmail = getSessionEmail() || ''
  const userInitial = (user || sessionEmail || '?').trim().charAt(0).toUpperCase() || '?'

  if (!user) {
    return (
      <div className="page">
        <header className="topbar">
          <div className="brand" aria-label="Task management">
            <span className="brandMark" aria-hidden="true" />
            <div className="brandText">
              <div className="brandName">TaskEase</div>
              <div className="brandSub">Login / Register</div>
            </div>
          </div>
          <div className="topActions" />
        </header>

        <main className="main">
          <section className="authCard" aria-label="Authentication">
            <div className="panelHeader">
              <h2>
                {authMode === 'login'
                  ? t.loginTitle
                  : authMode === 'register'
                    ? t.registerTitle
                    : lang === 'en'
                      ? 'Forgot password'
                      : 'שכחתי סיסמה'}
              </h2>
              <div className="segmented" role="tablist" aria-label={lang === 'en' ? 'Auth mode' : 'מצב אימות'}>
                <button
                  type="button"
                  className={authMode === 'login' ? 'seg active' : 'seg'}
                  onClick={() => {
                    setAuthMode('login')
                    setAuthError('')
                    setAuthSuccess('')
                  }}
                >
                  {t.login}
                </button>
                <button
                  type="button"
                  className={authMode === 'register' ? 'seg active' : 'seg'}
                  onClick={() => {
                    setAuthMode('register')
                    setAuthError('')
                    setAuthSuccess('')
                  }}
                >
                  {t.register}
                </button>
              </div>
            </div>

            <div className="authForm">
              <label className="field">
                <span>{t.email}</span>
                <input
                  className="authInput"
                  value={authEmail}
                  placeholder="you@example.com"
                  onChange={(e) => setAuthEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                />
              </label>

              {authMode === 'register' ? (
                <label className="field">
                  <span>{t.name}</span>
                  <input
                    className="authInput"
                    value={authName}
                    placeholder={lang === 'en' ? 'Your name' : 'השם שלך'}
                    onChange={(e) => setAuthName(e.target.value)}
                    type="text"
                    autoComplete="name"
                  />
                </label>
              ) : null}

              {authMode !== 'forgot' ? (
                <label className="field">
                  <span>{t.password}</span>
                  <input
                    className="authInput"
                    value={authPassword}
                    placeholder="••••"
                    onChange={(e) => setAuthPassword(e.target.value)}
                    type="password"
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  />
                </label>
              ) : null}

              {authMode === 'forgot' ? (
                <label className="field">
                  <span>{lang === 'en' ? 'New password' : 'סיסמה חדשה'}</span>
                  <input
                    className="authInput"
                    value={resetPassword}
                    placeholder="••••"
                    onChange={(e) => setResetPassword(e.target.value)}
                    type="password"
                    autoComplete="new-password"
                  />
                </label>
              ) : null}

              {authError ? <div className="authError">{authError}</div> : null}
              {authSuccess ? <div className="authSuccess">{authSuccess}</div> : null}

              <button
                type="button"
                className="primaryBtn authSubmit"
                onClick={authMode === 'login' ? login : authMode === 'register' ? register : forgotPassword}
              >
                {authMode === 'login'
                  ? t.signInButton
                  : authMode === 'register'
                    ? t.createAccountButton
                    : lang === 'en'
                      ? 'Update password'
                      : 'עדכן סיסמה'}
              </button>

              {authMode === 'login' ? (
                <button
                  type="button"
                  className="ghostBtn"
                  onClick={() => {
                    setAuthMode('forgot')
                    setAuthError('')
                    setAuthSuccess('')
                  }}
                >
                  {lang === 'en' ? 'Forgot password?' : 'שכחתי סיסמה'}
                </button>
              ) : null}
            </div>

            <div className="panelFooter">
              <div className="hint">Demo auth using localStorage.</div>
            </div>
          </section>
        </main>

        <footer className="footer">
          <span>@tifaret 2026 -</span>
          <a
            href="https://drive.google.com/file/d/1nkHSB4BHNLffNERGIiypv-eaLLHDqyAW/view?usp=drive_link"
            target="_blank"
            rel="noopener noreferrer"
            className="resume-btn"
            aria-label="View My Resume"
            title="View My Resume"
          >
            View My Resume
          </a>
        </footer>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand" aria-label="Task management">
          <span className="brandMark" aria-hidden="true" />
          <div className="brandText">
            <div className="brandName">TaskEase</div>
            <div className="brandSub">Task management</div>
          </div>
        </div>

        <div className="topActions">
          <button
            type="button"
            className={view === 'tasks' ? 'ghostBtn activeViewBtn' : 'ghostBtn'}
            onClick={() => setView('tasks')}
          >
            {lang === 'en' ? 'Tasks' : 'משימות'}
          </button>

          <button
            type="button"
            className={view === 'notes' ? 'ghostBtn activeViewBtn' : 'ghostBtn'}
            onClick={() => setView('notes')}
          >
            {lang === 'en' ? 'Notes' : 'הערות'}
          </button>

          <button type="button" className="ghostBtn" onClick={logout}>
            {t.logout}
          </button>

          <button
            type="button"
            className={view === 'profile' ? 'userAvatarBtn active' : 'userAvatarBtn'}
            onClick={() => setView((p) => (p === 'profile' ? 'tasks' : 'profile'))}
            aria-label={lang === 'en' ? 'Open profile' : 'פתח פרופיל'}
            title={lang === 'en' ? 'Profile' : 'פרופיל'}
          >
            <span className="userAvatarText">{userInitial}</span>
          </button>
        </div>
      </header>

      {taskToast ? (
        <div className="taskDoneToast" role="status" aria-live="polite">
          {taskToast}
        </div>
      ) : null}

      <div className="floatingControls" aria-label={lang === 'en' ? 'Display controls' : 'בקרות תצוגה'}>
        <button
          type="button"
          className="controlPill"
          onClick={() => setLang((p) => (p === 'he' ? 'en' : 'he'))}
          aria-label="Toggle language"
          title={lang === 'en' ? 'Switch language' : 'החלפת שפה'}
        >
          <span className="controlIcon" aria-hidden="true">A</span>
          <span>{lang === 'he' ? 'EN' : 'עברית'}</span>
        </button>

        <button
          type="button"
          className="controlPill"
          onClick={() => setTheme((p) => (p === 'dark' ? 'light' : 'dark'))}
          aria-label="Toggle brightness"
          title={lang === 'en' ? 'Switch theme' : 'החלפת ערכת נושא'}
        >
          <span className="controlIcon" aria-hidden="true">{theme === 'dark' ? '◑' : '◐'}</span>
          <span>{theme === 'dark' ? 'כהה' : 'בהיר'}</span>
        </button>
      </div>

      <main className="main">
        {view === 'tasks' ? (
          <section className="hero" aria-label="Intro">
            <div className="heroCopy">
              <h1>
                {lang === 'en' ? (
                  <>
                    The <span className="accent">clean</span> way
                    <br /> to manage tasks.
                  </>
                ) : (
                  <>
                    הדרך <span className="accent">הנקייה</span>
                    <br /> לנהל משימות.
                  </>
                )}
              </h1>
              <p>
                {lang === 'en'
                  ? 'Create a list, mark done, and keep moving. Modern UI in black/white with a pink twist.'
                  : 'צרו רשימה, סמנו כמושלם והמשיכו קדימה. ממשק מודרני בשחור/לבן עם נגיעה ורודה.'}
              </p>

              <div className="heroStats">
                <StatsPanel tasks={tasks} lang={lang} />
              </div>
            </div>

            <div className="heroPanel" role="region" aria-label="Create tasks">
              <div className="panelHeader">
                <h2>
                  My tasks{user ? <span className="userName"> · {user}</span> : null}
                </h2>

                <div className="segmented" role="tablist" aria-label={lang === 'en' ? 'Filter tasks' : 'סינון משימות'}>
                  <button
                    type="button"
                    className={filter === 'active' ? 'seg active' : 'seg'}
                    onClick={() => setFilter('active')}
                  >
                    <span>{t.active}</span>
                    <span className="segCount">{activeCount}</span>
                  </button>
                  <button
                    type="button"
                    className={filter === 'done' ? 'seg active' : 'seg'}
                    onClick={() => setFilter('done')}
                  >
                    <span>{t.done}</span>
                    <span className="segCount">{doneCount}</span>
                  </button>
                </div>
              </div>

              <div className="composer">
                <input
                  className="taskInput"
                  value={draft}
                  placeholder={t.typeTask}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTask()
                  }}
                  aria-label={lang === 'en' ? 'New task' : 'משימה חדשה'}
                />

                <input
                  className="timeInput"
                  value={timeDraft}
                  placeholder={t.dueOptional}
                  onChange={(e) => setTimeDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTask()
                  }}
                  aria-label={lang === 'en' ? 'Due time' : 'שעת יעד'}
                />

                <button
                  type="button"
                  className="primaryBtn"
                  onClick={addTask}
                  disabled={!draft.trim()}
                >
                  {t.create}
                </button>
              </div>

              <div className="list" role="list" aria-label="Tasks list">
                {filtered.length === 0 ? (
                  <div className="empty">
                    <div className="emptyIcon" aria-hidden="true" />
                    <div className="emptyTitle">{t.noTasksTitle}</div>
                    <div className="emptySub">{t.noTasksSub}</div>
                  </div>
                ) : (
                  <ul className="tasksUl">
                    {filtered.map((t) => (
                      <li key={t.id} className={t.done ? 'task done' : 'task'} role="listitem">
                        <button
                          type="button"
                          className="check"
                          onClick={() => toggleTask(t.id)}
                          aria-label={t.done ? t.markNotDone : t.markDone}
                          aria-pressed={t.done}
                        >
                          <span className="checkInner" aria-hidden="true" />
                        </button>

                        <div className="taskText">
                          <span className="taskMain">{t.text}</span>
                          {t.dueAt ? <span className="taskDue">Due: {t.dueAt}</span> : null}
                        </div>

                        <button
                          type="button"
                          className="delete"
                          onClick={() => deleteTask(t.id)}
                          aria-label={t.deleteTask}
                          title={t.deleteTask}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="panelFooter">
                <div className="hint">{t.tip}</div>
              </div>
            </div>
          </section>
        ) : view === 'notes' ? (
          <section className="notesPage" aria-label={lang === 'en' ? 'Notes page' : 'עמוד הערות'}>
            <div className="notesShell">
              <aside className="notesSidebar">
                <div className="notesSidebarTop">
                  <h2>{lang === 'en' ? 'Notes' : 'הערות'}</h2>
                  <button type="button" className="primaryBtn notesAddBtn" onClick={addNote}>
                    {lang === 'en' ? '+ New note' : '+ פתק חדש'}
                  </button>
                </div>

                <div className="notesSidebarList" role="list" aria-label={lang === 'en' ? 'Notes list' : 'רשימת פתקים'}>
                  {notes.length === 0 ? (
                    <div className="notesEmptyLarge">
                      {lang === 'en' ? 'No notes yet. Create your first note.' : 'אין פתקים עדיין. צרו את הפתק הראשון.'}
                    </div>
                  ) : (
                    notes.map((note, idx) => {
                      const line = note.text.trim().split('\n')[0] || (lang === 'en' ? 'New note' : 'פתק חדש')
                      return (
                        <button
                          key={note.id}
                          type="button"
                          className={selectedNoteId === note.id ? 'noteCard active' : 'noteCard'}
                          onClick={() => setSelectedNoteId(note.id)}
                          role="listitem"
                        >
                          <span className="noteCardTitle">{line.slice(0, 44)}</span>
                          <span className="noteCardMeta">
                            {lang === 'en' ? 'Note' : 'פתק'} #{notes.length - idx}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </aside>

              <section className="notesEditorPane" aria-label={lang === 'en' ? 'Note editor' : 'עורך פתק'}>
                {selectedNote ? (
                  <div className="notesEditorCard">
                    <div className="notesEditorTop">
                      <div className="notesEditorTitle">{lang === 'en' ? 'Selected note' : 'פתק נבחר'}</div>
                      <button type="button" className="deleteNoteBtn" onClick={() => deleteNote(selectedNote.id)}>
                        {lang === 'en' ? 'Delete' : 'מחיקה'}
                      </button>
                    </div>

                    <textarea
                      className="notesInput notesInputApple"
                      value={selectedNote.text}
                      onChange={(e) => updateNote(selectedNote.id, e.target.value)}
                      onKeyDown={(e) => handleNoteKeyDown(e, selectedNote.id)}
                      placeholder={
                        lang === 'en'
                          ? 'Write your note… (Enter = new note, Shift+Enter = new line)'
                          : 'כתבו כאן... (Enter = פתק חדש, Shift+Enter = שורה חדשה)'
                      }
                    />
                  </div>
                ) : (
                  <div className="notesEmptyEditor">
                    <div className="notesEmptyIcon" aria-hidden="true" />
                    <div>{lang === 'en' ? 'Select a note or create a new one.' : 'בחרו פתק קיים או צרו פתק חדש.'}</div>
                  </div>
                )}
              </section>
            </div>
          </section>
        ) : (
          <section className="profilePage" aria-label={lang === 'en' ? 'Profile page' : 'עמוד פרופיל'}>
            <div className="profileHeader">
              <h1>{lang === 'en' ? 'Personal profile' : 'פרופיל אישי'}</h1>
              <p>
                {lang === 'en'
                  ? 'Manage your personal details and preferences in one place.'
                  : 'ניהול הפרטים האישיים וההעדפות במקום אחד.'}
              </p>
            </div>

            <div className="profileGrid">
              <article className="profileCard">
                <h3>{lang === 'en' ? 'Personal info' : 'פרטים אישיים'}</h3>
                <div className="profileRows">
                  <div className="profileRow">
                    <span>{lang === 'en' ? 'Name' : 'שם'}</span>
                    <strong>{user || '-'}</strong>
                  </div>
                  <div className="profileRow">
                    <span>{lang === 'en' ? 'Email' : 'אימייל'}</span>
                    <strong>{getSessionEmail() || '-'}</strong>
                  </div>
                </div>
              </article>

              <article className="profileCard">
                <h3>{lang === 'en' ? 'Activity stats' : 'סטטיסטיקת פעילות'}</h3>
                <div className="profileRows">
                  <div className="profileRow">
                    <span>{lang === 'en' ? 'Total tasks' : 'סה״כ משימות'}</span>
                    <strong>{tasks.length}</strong>
                  </div>
                  <div className="profileRow">
                    <span>{lang === 'en' ? 'Done tasks' : 'משימות הושלמו'}</span>
                    <strong>{tasks.filter((x) => x.done).length}</strong>
                  </div>
                  <div className="profileRow">
                    <span>{lang === 'en' ? 'Active tasks' : 'משימות פעילות'}</span>
                    <strong>{tasks.filter((x) => !x.done).length}</strong>
                  </div>
                  <div className="profileRow">
                    <span>{lang === 'en' ? 'Notes' : 'הערות'}</span>
                    <strong>{notes.length}</strong>
                  </div>
                </div>
              </article>

              <article className="profileCard">
                <h3>{lang === 'en' ? 'Preferences' : 'העדפות'}</h3>
                <div className="profileActions">
                  <button
                    type="button"
                    className="ghostBtn"
                    onClick={() => setLang((p) => (p === 'he' ? 'en' : 'he'))}
                  >
                    {lang === 'en' ? 'Switch language' : 'החלפת שפה'}
                  </button>
                  <button
                    type="button"
                    className="ghostBtn"
                    onClick={() => setTheme((p) => (p === 'dark' ? 'light' : 'dark'))}
                  >
                    {lang === 'en' ? 'Switch theme' : 'החלפת ערכת נושא'}
                  </button>
                </div>
              </article>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
  <span>@tifaret 2026 -</span>

  <a
    href="https://drive.google.com/file/d/1nkHSB4BHNLffNERGIiypv-eaLLHDqyAW/view?usp=drive_link"
    target="_blank"
    rel="noopener noreferrer"
    className="resume-btn"
    aria-label="View My Resume"
    title="View My Resume"
  >
    View My Resume
  </a>
</footer>
    </div>
  )
}

export default App
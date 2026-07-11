import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { loadUserNotes } from './userTasksStore'
import StatsPanel from './StatsPanel'

import { getUserByEmail, setSessionEmail, getSessionEmail, clearSession } from './db'
import {
  apiRegister,
  apiLogin,
  apiForgotPassword,
  apiGetForgotPasswordQuestion,
  apiUpdateTask,
  apiGetTasks,
  apiCreateTask,
  apiDeleteTask,
  apiGetNotes,
  apiCreateNote,
  apiUpdateNote,
  apiDeleteNote,
  apiUpdateUserName,
} from './api'
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

function validateName(name, lang) {
  const trimmed = String(name || '').trim()
  if (!trimmed) return lang === 'he' ? 'נא להזין שם משתמש.' : 'Please enter a username.'
  if (trimmed.length < 2) return lang === 'he' ? 'שם משתמש חייב להכיל לפחות 2 תווים.' : 'Username must be at least 2 characters.'
  return ''
}

function validatePassword(password, lang) {
  const value = String(password || '')
  if (!value) return lang === 'he' ? 'נא להזין סיסמה.' : 'Please enter a password.'
  if (value.length < 8) return lang === 'he' ? 'הסיסמה חייבת להכיל לפחות 8 תווים.' : 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(value)) return lang === 'he' ? 'הסיסמה חייבת להכיל לפחות אות גדולה אחת באנגלית (A-Z).' : 'Password must include at least one uppercase letter (A-Z).'
  if (!/[0-9]/.test(value)) return lang === 'he' ? 'הסיסמה חייבת להכיל לפחות ספרה אחת (0-9).' : 'Password must include at least one digit (0-9).'
  return ''
}

function makeId() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function mapAuthError(message, lang) {
  const msg = String(message || '').toLowerCase()

  if (msg.includes('already') || msg.includes('exists') || msg.includes('duplicate')) {
    return lang === 'he' ? 'כבר קיים משתמש עם המייל הזה' : 'An account with this email already exists'
  }

  if (msg.includes('invalid credentials') || msg.includes('invalid email or password')) {
    return lang === 'he' ? 'אימייל או סיסמה שגויים' : 'Invalid email or password'
  }

  if (msg.includes('user not found') || msg.includes('no user') || msg.includes('not found')) {
    return lang === 'he' ? 'המשתמש לא נמצא' : 'User not found'
  }

  if (
    msg.includes('invalid security answer') ||
    msg.includes('wrong security answer') ||
    msg.includes('security answer is invalid') ||
    msg.includes('answer mismatch')
  ) {
    return lang === 'he' ? 'תשובת האבטחה שגויה' : 'Invalid security answer'
  }

  if (msg.includes('securityquestionkey') || msg.includes('security question')) {
    return lang === 'he' ? 'שאלת האבטחה שנבחרה אינה תקינה' : 'Selected security question is invalid'
  }

  if (msg.includes('securityanswer') || msg.includes('security answer')) {
    return lang === 'he' ? 'נא להזין תשובת אבטחה תקינה' : 'Please enter a valid security answer'
  }

  if (msg.includes('email and password are required')) {
    return lang === 'he' ? 'אימייל וסיסמה הם שדות חובה' : 'Email and password are required'
  }

  if (msg.includes('email and newpassword are required') || msg.includes('new password')) {
    return lang === 'he' ? 'אימייל וסיסמה חדשה הם שדות חובה' : 'Email and new password are required'
  }

  if (msg.includes('failed to update password')) {
    return lang === 'he' ? 'נכשל עדכון הסיסמה' : 'Failed to update password'
  }

  if (msg.includes('request failed') || msg.includes('network') || msg.includes('fetch')) {
    return lang === 'he' ? 'הבקשה נכשלה, נסה שוב' : 'Request failed, please try again'
  }

  return lang === 'he'
    ? `שגיאת אימות: ${message || 'אירעה שגיאה, נסה שוב'}`
    : (message || 'Something went wrong, please try again')
}

function App() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('taskease_lang')
    return saved === 'en' ? 'en' : 'he'
  })
  const [isLoading, setIsLoading] = useState(true);
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
  const [showPassword, setShowPassword] = useState(false);
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
  const [tasks, setTasks] = useState([])  
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
  const [securityQuestionKey, setSecurityQuestionKey] = useState('motherMaiden')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [forgotQuestionText, setForgotQuestionText] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [view, setView] = useState('tasks') // tasks | notes | profile
  const [taskToast, setTaskToast] = useState('')
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  //useEffect(() => {
   // if (!user) return
  //  saveUserTasks(getSessionEmail(), tasks)
 // }, [tasks, user])

 // useEffect(() => {
  //  if (!user) return
  //  saveUserNotes(getSessionEmail(), notes)
 // }, [notes, user])

  useEffect(() => {
    async function fetchTasksFromDB() {
      const email = getSessionEmail()
      if (!email){
        setIsLoading(false); // גם אם אין אימייל, מפסיקים את הטעינה
        return
      } 

      try {
        const data = await apiGetTasks(email)
        if (data.tasks) {
          setTasks(
            data.tasks.map((task) => ({
              text: task.task_name,
              id: task.id_text || task.id,
              done: Boolean(task.is_completed),
              dueAt: task.due_at || null,
              createdAt: task.created_at || new Date().toISOString(),
            })),
          )
        }
      } catch (err) {
        console.error('שגיאה במשיכת משימות מהשרת:', err)
      }
    }

    if (user) {
      fetchTasksFromDB()
      return
    }

    if (isLoading) {
      const timeout = window.setTimeout(() => setIsLoading(false), 0)
      return () => window.clearTimeout(timeout)
    }
  }, [user, isLoading])

  const filtered = useMemo(() => {
    const base = filter === 'done' ? tasks.filter((t) => t.done) : tasks.filter((t) => !t.done)
    return [...base].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime()
      const bTime = new Date(b.createdAt || 0).getTime()
      return bTime - aTime
    })
  }, [filter, tasks])
  
  async function toggleTask(id) {
    const taskToUpdate = tasks.find((t) => t.id === id);
    if (!taskToUpdate) return;

    const newDoneStatus = !taskToUpdate.done;

    // עדכון מיידי בממשק (Optimistic Update)
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: newDoneStatus } : t))
    );

    if (newDoneStatus) {
      setTaskToast(lang === 'he' ? 'כל הכבוד! משימה הושלמה' : 'Great job! Task completed');
    }

    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      setTaskToast(lang === 'he' ? 'המשימה עדיין נשמרת, נסה שוב בעוד רגע' : 'Task is still syncing, try again in a moment');
      return;
    }

    try {
      await apiUpdateTask(numericId, { is_completed: newDoneStatus })
    } catch (err) {
      console.error('שגיאה בעדכון השרת:', err);
      // אם נכשל, נחזיר את המצב הקודם
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: !newDoneStatus } : t))
      );
    }
  }
  async function addTask() {
    const text = draft.trim();
    const timeText = timeDraft.trim();

    if (!text) return;

    const dueAt = timeText ? timeText : null;
    const tempId = makeId();
    const newTask = { id: tempId, text, done: false, dueAt, createdAt: new Date().toISOString() };

    // עדכון הממשק
    setTasks((prev) => [...prev, newTask]);
    setDraft('');
    setTimeDraft('');

    try {
      const data = await apiCreateTask({
        user_email: getSessionEmail(),
        task_name: text,
        due_at: dueAt,
      })

      const serverTask = data?.task
      const serverId = serverTask?.id_text ?? serverTask?.id
      if (serverId !== undefined && serverId !== null) {
        setTasks((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: String(serverId) } : t))
        )
      }
    } catch (err) {
      console.error('שגיאה בשמירה לשרת:', err)
      setTaskToast(lang === 'he' ? 'נכשלה שמירת המשימה בשרת' : 'Failed to save task to server')
    }
  }

  async function deleteNote(id) {
    const prevNotes = notes
    const prevSelected = selectedNoteId

    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id)
      if (selectedNoteId === id) setSelectedNoteId(next[0]?.id || null)
      return next
    })

    try {
      await apiDeleteNote(id)
      setTaskToast(lang === 'he' ? 'הפתק נמחק בהצלחה' : 'Note deleted')
    } catch (err) {
      const msg = String(err?.message || '')
      if (msg.includes('Note not found') || msg.includes('404') || msg.includes('Request failed')) {
        setTaskToast(lang === 'he' ? 'הפתק כבר לא קיים בשרת' : 'Note was already removed on server')
        return
      }

      setNotes(prevNotes)
      setSelectedNoteId(prevSelected)
      setTaskToast(lang === 'he' ? 'שגיאה במחיקת פתק' : 'Failed to delete note')
      console.error('שגיאה במחיקת פתק:', err)
    }
  }
  
  const deleteTask = async (id) => {
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      setTaskToast(lang === 'he' ? 'המשימה המקומית נמחקה' : 'Local task removed')
      return
    }

    try {
      await apiDeleteTask(numericId)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      setTaskToast(lang === 'he' ? 'המשימה נמחקה בהצלחה' : 'Task deleted successfully')
      console.log('המשימה נמחקה בהצלחה!')
    } catch (error) {
      console.error('שגיאה במחיקה:', error)
    }
  }
  function createNoteAfter(noteId) {
    const newNote = { id: makeId(), text: '' }
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
    const normalizedSecurityAnswer = String(securityAnswer || '').trim()

    if (!email) return setAuthError(lang === 'he' ? 'נא להזין אימייל.' : 'Please enter email.')
    if (!isValidEmail(email)) return setAuthError(lang === 'he' ? 'פורמט האימייל אינו תקין.' : 'Invalid email format.')

    const nameError = validateName(name, lang)
    if (nameError) return setAuthError(nameError)

    const passwordError = validatePassword(password, lang)
    if (passwordError) return setAuthError(passwordError)
    if (!normalizedSecurityAnswer) {
      return setAuthError(lang === 'he' ? 'נא להזין תשובת אבטחה.' : 'Please enter a security answer.')
    }

    const existingUser = getUserByEmail(email)
    if (existingUser) {
      return setAuthError(lang === 'he' ? 'כבר קיים משתמש עם המייל הזה' : 'An account with this email already exists')
    }

    try {
      const data = await apiRegister({
        email,
        name,
        password,
        securityQuestionKey,
        securityAnswer: normalizedSecurityAnswer,
      })
      setSessionEmail(email)
      setUser(data.user?.user_name || data.user?.name || name)
      setTasks([])
      setNotes([])
    } catch (err) {
      const message = String(err?.message || '')
      if (message.toLowerCase().includes('already') || message.toLowerCase().includes('exists') || message.toLowerCase().includes('duplicate')) {
        setAuthError(lang === 'he' ? 'כבר קיים משתמש עם המייל הזה' : 'An account with this email already exists')
        return
      }
      setAuthError(mapAuthError(err?.message, lang))
    }
  }

  async function login() {
    setAuthError('');
    setAuthSuccess('');

    const email = normalizeEmail(authEmail);
    const password = String(authPassword || '');

    if (!email) return setAuthError(lang === 'he' ? 'נא להזין אימייל' : 'Please enter email');
    if (!isValidEmail(email)) return setAuthError(lang === 'he' ? 'פורמט האימייל אינו תקין' : 'Invalid email format');
    if (!password) return setAuthError(lang === 'he' ? 'נא להזין סיסמה' : 'Please enter password.');

    try {

      const data = await apiLogin({ email, password })
      setSessionEmail(email)
      setUser(data.user?.user_name || data.user?.name || data.user?.user_email || email)
      setTasks([])
      setNotes(loadUserNotes(email))
      setView('tasks')

      
      // טעינה מהשרת
      const [tasksData, notesData] = await Promise.all([
        apiGetTasks(email),
        apiGetNotes(email),
      ])

      const normalizedTasks = Array.isArray(tasksData.tasks)
        ? tasksData.tasks.map((task) => ({
            id: String(task.id_text || task.id),
            text: task.task_name ?? task.text ?? '',
            done: Boolean(task.is_completed ?? task.done),
            dueAt: task.due_at || null,
            createdAt: task.created_at || new Date().toISOString(),
          }))
        : []

      const normalizedNotes = Array.isArray(notesData.notes)
        ? notesData.notes.map((note) => ({
            id: String(note.id),
            text: note.text ?? '',
          }))
        : []

      setTasks(normalizedTasks)
      setNotes(normalizedNotes)
      setSelectedNoteId(normalizedNotes[0]?.id || null)
      setView('tasks')
    } catch (err) {
      setAuthError(mapAuthError(err?.message, lang))
    }
  }
// --- פונקציות מנוהלות תקינות ---

  async function addNote() {
    const newNote = { id: makeId(), text: '' }
    setNotes((prev) => [newNote, ...prev])
    setSelectedNoteId(newNote.id)

    try {
      await apiCreateNote({
        id: newNote.id,
        user_email: getSessionEmail(),
        text: '',
      })
      setTaskToast(lang === 'he' ? 'פתק חדש נוסף' : 'New note added')
    } catch (err) {
      console.error('שגיאה בשמירת פתק:', err)
    }
  }

  async function updateNote(id, text) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)))

    try {
      await apiUpdateNote(id, { text })
    } catch (err) {
      console.error('שגיאה בעדכון פתק בשרת:', err)
    }
  }
  async function saveProfileName() {
    const currentEmail = getSessionEmail()
    const trimmed = String(nameDraft || '').trim()

    if (!currentEmail) return
    if (!trimmed) {
      setTaskToast(lang === 'he' ? 'נא להזין שם תקין' : 'Please enter a valid name')
      return
    }

    const prevName = user
    setUser(trimmed)
    setIsEditingName(false)

    try {
      await apiUpdateUserName({ email: currentEmail, name: trimmed })
      setTaskToast(lang === 'he' ? 'השם עודכן בהצלחה' : 'Name updated successfully')
    } catch (err) {
      console.error('שגיאה בעדכון שם משתמש:', err)
      setUser(prevName)
      setTaskToast(lang === 'he' ? 'נכשלה שמירת השם' : 'Failed to update name')
    }
  }

  async function loadForgotPasswordQuestion() {
    setAuthError('')
    setAuthSuccess('')

    const email = normalizeEmail(authEmail)
    if (!email) return setAuthError(lang === 'he' ? 'נא להזין אימייל' : 'Please enter email')
    if (!isValidEmail(email)) return setAuthError(lang === 'he' ? 'פורמט האימייל אינו תקין' : 'Invalid email format')

    try {
      const data = await apiGetForgotPasswordQuestion({ email })
      setForgotQuestionText(data?.questionText || '')
      setSecurityQuestionKey(data?.questionKey || '')
      setAuthSuccess(lang === 'he' ? 'שאלת האבטחה נטענה. הזן תשובה וסיסמה חדשה.' : 'Security question loaded. Enter answer and new password.')
    } catch (err) {
      setForgotQuestionText('')
      setAuthError(mapAuthError(err?.message, lang))
    }
  }

  async function forgotPassword() {
    setAuthError('')
    setAuthSuccess('')

    const email = normalizeEmail(authEmail)
    const newPassword = String(resetPassword || '')

    if (!email) return setAuthError(lang === 'he' ? 'נא להזין אימייל' : 'Please enter email')
    if (!isValidEmail(email)) return setAuthError(lang === 'he' ? 'פורמט האימייל אינו תקין' : 'Invalid email format')

    const passwordError = validatePassword(newPassword, lang)
    if (passwordError) return setAuthError(passwordError)

    try {
      await apiForgotPassword({ email, newPassword, securityAnswer })
      setResetPassword('')
      setAuthPassword('')
      setAuthName('')
      setAuthMode('login')
      setAuthSuccess(lang === 'he' ? 'הסיסמה עודכנה בהצלחה. אפשר להתחבר עכשיו.' : 'Password updated successfully. Please login.')
    } catch (err) {
      const raw = String(err?.message || '')
      if (raw.toLowerCase().includes('invalid security answer')) {
        setAuthError(lang === 'he' ? 'תשובת האבטחה שגויה' : 'Invalid security answer')
      } else {
        setAuthError(mapAuthError(raw, lang))
      }
    }
  }

  useEffect(() => {
    if (!taskToast) return
    const timer = window.setTimeout(() => setTaskToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [taskToast])

  useEffect(() => {
    function onBeforeInstallPrompt(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      setTaskToast(
        lang === 'he'
          ? 'ניתן להתקין את האפליקציה דרך כפתור "התקן את האפליקציה"'
          : 'You can install the app using the "Install app" button',
      )
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [lang])

  async function handleInstallApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      try {
        await deferredPrompt.userChoice
      } catch {
        // ignore choice errors
      }
      setDeferredPrompt(null)
      return
    }

    const ua = navigator.userAgent || ''
    const isIOS = /iPhone|iPad|iPod/i.test(ua)
    const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)

    if (isIOS && isSafari) {
      setTaskToast(
        lang === 'he'
          ? 'כדי להתקין: לחצו על שיתוף ואז "הוסף למסך הבית"'
          : 'To install: tap Share, then "Add to Home Screen"',
      )
      return
    }

    setTaskToast(
      lang === 'he'
        ? 'התקנה לא זמינה כרגע בדפדפן הזה'
        : 'Install is not available in this browser right now',
    )
  }

  const activeCount = tasks.filter((t) => !t.done).length
  const doneCount = tasks.filter((t) => t.done).length
  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null
  const sessionEmail = getSessionEmail() || ''
  const userInitial = (user || sessionEmail || '?').trim().charAt(0).toUpperCase() || '?'

  const ResumeFooterLink = () => (
    <footer className="footer">
      <span>@tifaret 2026 -</span>
      <a
        href="/resume.html"
        className="resume-btn"
        aria-label="View My Resume"
        title="View My Resume"
      >
        View My Resume
      </a>
    </footer>
  )

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
                    setForgotQuestionText('')
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
                    setForgotQuestionText('')
                  }}
                >
                  {t.register}
                </button>
              </div>
            </div>

            <form
              className="authForm"
              onSubmit={(e) => {
                e.preventDefault()
                if (authMode === 'login') login()
                else if (authMode === 'register') register()
                else forgotPassword()
              }}
            >
              <label className="field">
                <span>{t.email}</span>
                <input
                  className="authInput"
                  value={authEmail}
                  placeholder="you@example.com"
                  onChange={(e) => setAuthEmail(e.target.value)}
                  type="email"
                  autoComplete={authMode === 'login' ? 'username' : 'email'}
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
                  <div style={{ position: 'relative' }}>
                    <input
                      className="authInput"
                      value={authPassword}
                      placeholder="••••"
                      onChange={(e) => setAuthPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', left: '10px', top: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </label>
              ) : null}

              {authMode === 'register' ? (
                <>
                  <label className="field">
                    <span>{lang === 'he' ? 'שאלת אבטחה' : 'Security question'}</span>
                    <select
                      className="authInput"
                      value={securityQuestionKey}
                      onChange={(e) => setSecurityQuestionKey(e.target.value)}
                    >
                      <option value="motherMaiden">{lang === 'he' ? 'מה שם המשפחה של אמך לפני נישואין?' : "What is your mother's maiden name?"}</option>
                      <option value="motherBirthCity">{lang === 'he' ? 'באיזו עיר אמא שלך נולדה?' : 'In which city was your mother born?'}</option>
                      <option value="favoriteMovie">{lang === 'he' ? 'מה הסרט האהוב עליך?' : 'What is your favorite movie?'}</option>
                      <option value="firstTeacher">{lang === 'he' ? 'מה השם הפרטי של המורה הראשון/ה שלך?' : 'What was the first name of your first teacher?'}</option>
                      <option value="childhoodFriend">{lang === 'he' ? 'מה השם הפרטי של חבר/ת הילדות הכי טוב/ה שלך?' : 'What is the first name of your childhood best friend?'}</option>
                      <option value="firstPhone">{lang === 'he' ? 'מה היו 4 הספרות האחרונות של מספר הטלפון הראשון שלך?' : 'What was the last 4 digits of your first phone number?'}</option>
                      <option value="favoriteBook">{lang === 'he' ? 'מה הספר האהוב עליך?' : 'What is your favorite book?'}</option>
                      <option value="firstJobCity">{lang === 'he' ? 'באיזו עיר הייתה העבודה הראשונה שלך?' : 'In which city did you have your first job?'}</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>{lang === 'he' ? 'תשובת אבטחה' : 'Security answer'}</span>
                    <input
                      className="authInput"
                      value={securityAnswer}
                      placeholder={lang === 'he' ? 'הזן תשובת אבטחה' : 'Enter security answer'}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      type="text"
                      autoComplete="off"
                    />
                  </label>
                </>
              ) : null}

              {authMode === 'forgot' ? (
                <>
                  {forgotQuestionText ? (
                    <label className="field">
                      <span>{lang === 'he' ? 'השאלה שלך' : 'Your security question'}</span>
                      <input className="authInput" value={forgotQuestionText} readOnly />
                    </label>
                  ) : null}

                  <label className="field">
                    <span>{lang === 'he' ? 'תשובת אבטחה' : 'Security answer'}</span>
                    <input
                      className="authInput"
                      value={securityAnswer}
                      placeholder={lang === 'he' ? 'הזן תשובה' : 'Enter answer'}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      type="text"
                      autoComplete="off"
                    />
                  </label>

                  <label className="field">
                    <span>{lang === 'en' ? 'New password' : 'סיסמה חדשה'}</span>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="authInput"
                        value={resetPassword}
                        placeholder="••••"
                        onChange={(e) => setResetPassword(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', left: '10px', top: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                      >
                        {showPassword ? "👁️" : "🙈"}
                      </button>
                    </div>
                  </label>
                </>
              ) : null}

              {authError ? <div className="authError">{authError}</div> : null}
              {authSuccess ? <div className="authSuccess">{authSuccess}</div> : null}

              <button
                type="submit"
                className="primaryBtn authSubmit"
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
                    setForgotQuestionText('')
                    setSecurityAnswer('')
                  }}
                >
                  {lang === 'en' ? 'Forgot password?' : 'שכחתי סיסמה'}
                </button>
              ) : null}
            </form>

            <div className="panelFooter">
            </div>
          </section>
        </main>

        <ResumeFooterLink />
      </div>
    )
  }
  if (isLoading) {
    return (
      <div className="loading-screen" role="status" aria-live="polite">
        <div className="loading-card">
          <img className="loading-logo" src="/logo.png" alt="TaskEase logo" />
          <button type="button" className="spinner-btn" aria-label={lang === 'en' ? 'Loading' : 'טוען'}>
            <span className="spinner-ring" aria-hidden="true" />
            <span className="spinner-dot" aria-hidden="true" />
          </button>
          <h2 className="loading-title">{lang === 'en' ? 'Site is loading...' : 'האתר נטען...'}</h2>
          <p className="loading-subtitle">
            {lang === 'en' ? 'Just a moment, preparing your workspace.' : 'רק עוד רגע, מכינים לך את סביבת העבודה.'}
          </p>
          <a className="loading-resume-link" href="/resume.html">
            {lang === 'en' ? 'View My Resume' : 'למעבר לעמוד קורות חיים'}
          </a>
        </div>
      </div>
    );
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
                    The <span className="accent">easy</span> way
                    <br /> to manage tasks.
                  </>
                ) : (
                  <>הדרך הקלה לנהל משימות.</>
                )}
              </h1>
              <p>
                {lang === 'en'
                  ? 'Create a list, mark done, and keep moving.'
                  : 'צרו רשימה, סמנו כמושלם והמשיכו קדימה'}
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
                    {isEditingName ? (
                      <div className="profileNameEdit">
                        <input
                          className="authInput profileNameInput"
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          placeholder={lang === 'en' ? 'Enter name' : 'הזינו שם'}
                        />
                        <div className="profileNameActions">
                          <button type="button" className="primaryBtn" onClick={saveProfileName}>
                            {lang === 'en' ? 'Save' : 'שמור'}
                          </button>
                          <button
                            type="button"
                            className="ghostBtn"
                            onClick={() => {
                              setIsEditingName(false)
                              setNameDraft(user || '')
                            }}
                          >
                            {lang === 'en' ? 'Cancel' : 'ביטול'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="profileNameDisplay">
                        <strong>{user || '-'}</strong>
                        <button
                          type="button"
                          className="ghostBtn"
                          onClick={() => {
                            setNameDraft(user || '')
                            setIsEditingName(true)
                          }}
                        >
                          <span className="editPencilIcon" aria-hidden="true">✏️</span>
                          <span>{lang === 'en' ? 'Edit' : 'ערוך'}</span>
                        </button>
                      </div>
                    )}
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
                </div>
              </article>
            </div>

            <div className="profileBottomActions">
              <button type="button" className="ghostBtn" onClick={logout}>
                {t.logout}
              </button>
              <button
                type="button"
                className="installBtn"
                onClick={handleInstallApp}
              >
                {lang === 'en' ? 'Install app' : 'התקן אפליקציה'}
              </button>
            </div>
          </section>
        )}
      </main>

      <ResumeFooterLink />
    </div>
  )
}

export default App
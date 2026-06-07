import { useEffect, useMemo, useState } from 'react'
import './App.css'
import StatsPanel from './StatsPanel'
import { apiRegister, apiLogin, apiForgotPassword } from './api'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('taskease_lang') === 'en' ? 'en' : 'he')
  const [theme, setTheme] = useState(() => localStorage.getItem('taskease_theme') === 'dark' ? 'dark' : 'light')
  
  // States
  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedNoteId, setSelectedNoteId] = useState(null)
  const [draft, setDraft] = useState('')
  const [timeDraft, setTimeDraft] = useState('')
  const [filter, setFilter] = useState('active')
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authName, setAuthName] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [view, setView] = useState('tasks')
  const [taskToast, setTaskToast] = useState('')

  // טעינת משימות מהענן
  async function fetchUserData(email) {
    try {
      const res = await fetch(`/api/tasks/${email}`);
      const data = await res.json();
      setTasks(data.tasks.map(t => ({ 
        id: t.id, 
        text: t.task_name, 
        done: t.is_completed, 
        dueAt: null // ניתן להוסיף עמודה ב-DB אם צריך
      })));
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  }

  useEffect(() => {
    localStorage.setItem('taskease_lang', lang)
    document.documentElement.dataset.theme = theme
    localStorage.setItem('taskease_theme', theme)
  }, [lang, theme])

  const t = useMemo(() => {
    const dict = {
      he: { login: 'התחברות', register: 'הרשמה', email: 'אימייל', name: 'שם', password: 'סיסמה', signInButton: 'התחברות', createAccountButton: 'צור חשבון', logout: 'התנתקות', myTasks: 'המשימות שלי', all: 'הכל', active: 'פעילות', done: 'הושלם', typeTask: 'כתוב משימה...', create: 'צור', noTasksTitle: 'אין משימות כאן.', noTasksSub: 'צור משימה למעלה והיא תופיע.', markDone: 'סמן כמושלם', markNotDone: 'סמן כלא מושלם', deleteTask: 'מחק משימה', tip: 'טיפ: Enter להוספה.' },
      en: { login: 'Login', register: 'Register', email: 'Email', name: 'Name', password: 'Password', signInButton: 'Login', createAccountButton: 'Create account', logout: 'Logout', myTasks: 'My tasks', all: 'All', active: 'Active', done: 'Done', typeTask: 'Type a task…', create: 'Create', noTasksTitle: 'No tasks here.', noTasksSub: 'Create one above and it will show up.', markDone: 'Mark as done', markNotDone: 'Mark as not done', deleteTask: 'Delete task', tip: 'Tip: Enter to add tasks.' }
    }
    return dict[lang]
  }, [lang])

  // פעולות משימות מול השרת
  async function addTask() {
    const text = draft.trim();
    if (!text) return;
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: authEmail, task_name: text })
    });
    if (res.ok) {
      const { task } = await res.json();
      setTasks(prev => [{ id: task.id, text: task.task_name, done: false }, ...prev]);
      setDraft('');
    }
  }

  async function toggleTask(id, currentStatus) {
    const newStatus = !currentStatus;
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: newStatus })
    });
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newStatus } : t));
    }
  }

  function deleteTask(id) {
    // כאן תוכלי להוסיף fetch DELETE אם תרצי למחוק מהשרת
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  async function login() {
    try {
      const data = await apiLogin({ email: normalizeEmail(authEmail), password: authPassword });
      setUser(data.user.name);
      await fetchUserData(normalizeEmail(authEmail));
      setView('tasks');
    } catch (err) { setAuthError('Invalid login'); }
  }

  function logout() {
    setUser(null);
    setTasks([]);
    setAuthEmail('');
    setAuthPassword('');
    setView('tasks');
  }

  // שאר ה-UI נשאר דומה, עם התאמות קלות לקריאה ל-API...
  // (המשך מבנה ה-return שלך כפי שהיה ב-App.jsx המקורי)
  
  return (
    // כאן תשימי את ה-JSX המקורי שלך, וודאי שכל כפתור קורא לפונקציות החדשות (addTask, toggleTask)
    <div className="page">
        {/* ... מבנה ה-HTML המקורי שלך ... */}
    </div>
  )
}

export default App
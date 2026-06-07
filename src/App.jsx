// 1. הוספת משימה לשרת במקביל ל-State
async function addTask() {
  const text = draft.trim();
  const timeText = timeDraft.trim();
  if (!text) return;

  const newTask = { id: crypto.randomUUID(), text, done: false, dueAt: timeText || null };
  
  // הוספה מקומית
  setTasks((prev) => [newTask, ...prev]);
  setDraft('');
  setTimeDraft('');

  // הוספה לשרת
  try {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: getSessionEmail(), task_name: text })
    });
  } catch (err) {
    console.error("Failed to save task to DB", err);
  }
}

// 2. עדכון סטטוס משימה בשרת וב-State
async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  const newDone = !task.done;

  // עדכון מקומי
  setTasks((prev) => {
    let shouldCelebrate = false;
    const nextTasks = prev.map((t) => {
      if (t.id !== id) return t;
      if (!t.done && newDone) shouldCelebrate = true;
      return { ...t, done: newDone };
    });
    
    if (shouldCelebrate) {
       // (הקוד של ה-Celebrate נשאר כאן)
    }
    return nextTasks;
  });

  // עדכון בשרת
  try {
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: newDone })
    });
  } catch (err) {
    console.error("Failed to update task in DB", err);
  }
}

// 3. טעינה ראשונית מהשרת (תוסיפי את זה ב-useEffect בנפרד)
useEffect(() => {
  async function syncTasksFromDB() {
    if (!user) return;
    try {
      const res = await fetch(`/api/tasks/${getSessionEmail()}`);
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks); // מעדכן את הרשימה מהשרת
      }
    } catch (err) {
      console.error("Failed to fetch from DB", err);
    }
  }
  syncTasksFromDB();
}, [user]);
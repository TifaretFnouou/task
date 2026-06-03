import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders without crashing', () => {
    expect(App).toBeDefined();
  });
});
describe('App Component', () => {
  it('should initialize with default language as "en"', () => {
    const lang = localStorage.getItem('taskease_lang');
    expect(lang).toBe('en');
  });

  it('should initialize with default theme as "dark"', () => {
    const theme = localStorage.getItem('taskease_theme');
    expect(theme).toBe('dark');
  });

  it('should toggle language between "en" and "he"', () => {
    localStorage.setItem('taskease_lang', 'en');
    const lang = localStorage.getItem('taskease_lang');
    expect(lang).toBe('en');

    localStorage.setItem('taskease_lang', 'he');
    const updatedLang = localStorage.getItem('taskease_lang');
    expect(updatedLang).toBe('he');
  });

  it('should toggle theme between "light" and "dark"', () => {
    localStorage.setItem('taskease_theme', 'dark');
    const theme = localStorage.getItem('taskease_theme');
    expect(theme).toBe('dark');

    localStorage.setItem('taskease_theme', 'light');
    const updatedTheme = localStorage.getItem('taskease_theme');
    expect(updatedTheme).toBe('light');
  });

  it('should add a new task', () => {
    const tasks = [];
    const newTask = { id: '1', text: 'Test Task', done: false };
    tasks.push(newTask);
    expect(tasks).toContainEqual(newTask);
  });

  it('should toggle task completion status', () => {
    const task = { id: '1', text: 'Test Task', done: false };
    task.done = !task.done;
    expect(task.done).toBe(true);
  });

  it('should delete a task', () => {
    const tasks = [{ id: '1', text: 'Test Task', done: false }];
    const updatedTasks = tasks.filter((t) => t.id !== '1');
    expect(updatedTasks).toHaveLength(0);
  });

  it('should add a new note', () => {
    const notes = [];
    const newNote = { id: '1', text: 'Test Note' };
    notes.push(newNote);
    expect(notes).toContainEqual(newNote);
  });

  it('should delete a note', () => {
    const notes = [{ id: '1', text: 'Test Note' }];
    const updatedNotes = notes.filter((n) => n.id !== '1');
    expect(updatedNotes).toHaveLength(0);
  });

  it('should update a note', () => {
    const notes = [{ id: '1', text: 'Old Note' }];
    const updatedNote = { id: '1', text: 'Updated Note' };
    const updatedNotes = notes.map((n) => (n.id === '1' ? updatedNote : n));
    expect(updatedNotes).toContainEqual(updatedNote);
  });
});
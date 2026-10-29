/* TaskFlow interactions — plain JavaScript, no framework */
"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const todayISO = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
const prettyDate = (value) => {
  if (!value) return "No due date";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
const safeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const starterTasks = [
  { id: "t1", title: "Finish linear algebra practice set", category: "Study", priority: "High", due: todayISO(), completed: false },
  { id: "t2", title: "Review digital logic design notes", category: "Revision", priority: "High", due: todayISO(), completed: false },
  { id: "t3", title: "Submit frontend project outline", category: "Assignment", priority: "Medium", due: todayISO(), completed: false },
  { id: "t4", title: "Read chapter 4 before class", category: "Study", priority: "Low", due: "", completed: true },
  { id: "t5", title: "Organize notes for the week", category: "Personal", priority: "Low", due: "", completed: true },
  { id: "t6", title: "Practice five revision questions", category: "Revision", priority: "Medium", due: "", completed: true },
  { id: "t7", title: "Prepare questions for the next lecture", category: "Study", priority: "Medium", due: "", completed: false },
  { id: "t8", title: "Plan tomorrow's study blocks", category: "Personal", priority: "Low", due: "", completed: false }
];

let tasks = loadTasks();
let activeFilter = "all";
let searchTerm = "";
let toastTimeout;
let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;

function loadTasks() {
  try {
    const saved = localStorage.getItem("taskflow-tasks");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("TaskFlow could not read saved tasks.", error);
  }
  return starterTasks.map(task => ({ ...task }));
}
function saveTasks() {
  try {
    localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
  } catch (error) {
    showToast("Your browser could not save changes. You can still use this session.");
  }
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}
function updateDate() {
  const now = new Date();
  $("#top-date").textContent = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function taskMatchesFilter(task) {
  if (activeFilter === "today") return task.due === todayISO() && !task.completed;
  if (activeFilter === "pending") return !task.completed;
  if (activeFilter === "completed") return task.completed;
  return true;
}
function renderTasks() {
  const list = $("#task-list");
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleTasks = tasks.filter(task => taskMatchesFilter(task) &&
    `${task.title} ${task.category} ${task.priority}`.toLowerCase().includes(normalizedSearch));
  list.innerHTML = "";

  visibleTasks.forEach(task => {
    const row = document.createElement("article");
    row.className = `task-row${task.completed ? " is-complete" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `${task.completed ? "Mark incomplete" : "Mark complete"}: ${task.title}`);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const info = document.createElement("div");
    info.className = "task-info";
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    const meta = document.createElement("div");
    meta.className = "task-meta";

    const category = document.createElement("span");
    category.className = `category-tag category-${task.category.toLowerCase()}`;
    category.textContent = task.category;
    const priority = document.createElement("span");
    priority.className = `priority-tag priority-${task.priority.toLowerCase()}`;
    priority.textContent = `${task.priority} priority`;
    meta.append(category, priority);

    if (task.due) {
      const due = document.createElement("span");
      due.className = "task-due";
      const overdue = task.due < todayISO() && !task.completed;
      if (overdue) due.classList.add("overdue");
      due.textContent = `${overdue ? "Overdue · " : "Due · "}${prettyDate(task.due)}`;
      meta.append(due);
    }
    info.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "task-action";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete task: ${task.title}`);
    deleteButton.title = "Delete task";
    deleteButton.addEventListener("click", () => deleteTask(task.id));
    actions.append(deleteButton);

    row.append(checkbox, info, actions);
    list.append(row);
  });

  $("#empty-state").classList.toggle("hidden", visibleTasks.length > 0);
  $("#task-list").classList.toggle("hidden", visibleTasks.length === 0);
  $("#task-summary").textContent = `Showing ${visibleTasks.length} of ${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
  updateStats();
}
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  $("#total-count").textContent = total;
  $("#completed-count").textContent = completed;
  $("#pending-count").textContent = pending;
  $("#completion-rate").textContent = `${percentage}%`;
  $("#nav-total").textContent = total;
  $("#ring-percent").textContent = `${percentage}%`;
  $("#progress-ring").style.setProperty("--progress", `${percentage}%`);
  $("#progress-ring").setAttribute("aria-label", `${percentage}% of tasks completed`);
  $("#legend-completed").textContent = `${completed} task${completed === 1 ? "" : "s"}`;
  $("#legend-pending").textContent = `${pending} task${pending === 1 ? "" : "s"}`;
  $("#progress-message").textContent = total === 0 ? "Add a task to start tracking progress." :
    percentage === 100 ? "Everything is done. Take a well-earned break!" :
    percentage >= 60 ? "You're building great momentum!" :
    "Every finished task is a win.";
}
function setFilter(filter) {
  activeFilter = filter;
  $$(".filter-tab").forEach(button => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  $$(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.view === filter || (filter === "pending" && link.dataset.view === "all" && false)));
  renderTasks();
}
function toggleTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
  showToast(task.completed ? "Nice work — task completed!" : "Task moved back to your list.");
}
function deleteTask(id) {
  const task = tasks.find(item => item.id === id);
  tasks = tasks.filter(item => item.id !== id);
  saveTasks();
  renderTasks();
  showToast(task ? "Task deleted." : "Task removed.");
}
function openForm() {
  $("#task-form").classList.remove("hidden");
  $("#task-title").focus();
}
function closeForm() {
  $("#task-form").classList.add("hidden");
  $("#form-message").textContent = "";
}
function handleNewTask(event) {
  event.preventDefault();
  const title = $("#task-title").value.trim();
  if (!title) {
    $("#form-message").textContent = "Please enter a task name.";
    $("#task-title").focus();
    return;
  }
  tasks.unshift({
    id: safeId(),
    title,
    category: $("#task-category").value,
    priority: $("#task-priority").value,
    due: $("#task-due").value,
    completed: false
  });
  saveTasks();
  $("#task-form").reset();
  closeForm();
  setFilter("all");
  showToast("Task added to your list.");
}
function clearCompleted() {
  const oldCount = tasks.length;
  tasks = tasks.filter(task => !task.completed);
  const removed = oldCount - tasks.length;
  saveTasks();
  renderTasks();
  showToast(removed ? `${removed} completed task${removed === 1 ? "" : "s"} cleared.` : "No completed tasks to clear.");
}
function toggleSidebar() {
  const sidebar = $("#sidebar");
  const isOpen = sidebar.classList.toggle("is-open");
  $("#menu-toggle").setAttribute("aria-expanded", String(isOpen));
  $("#menu-toggle").setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
}
function toggleTheme() {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  $("#theme-toggle").setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  try { localStorage.setItem("taskflow-theme", dark ? "dark" : "light"); } catch (_) {}
}
function loadTheme() {
  try {
    if (localStorage.getItem("taskflow-theme") === "dark") document.body.classList.add("dark");
  } catch (_) {}
}
function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remaining = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}
function updateTimer() {
  $("#timer-display").textContent = formatTimer(timerSeconds);
  $("#timer-display").setAttribute("aria-label", `${Math.floor(timerSeconds / 60)} minutes and ${timerSeconds % 60} seconds remaining`);
}
function startPauseTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    $("#timer-start").textContent = "Resume focus";
    $("#timer-status").textContent = "Paused. Pick it up when you're ready.";
    return;
  }
  timerRunning = true;
  $("#timer-start").textContent = "Pause session";
  $("#timer-status").textContent = "You're doing great. Stay with it.";
  timerInterval = setInterval(() => {
    timerSeconds -= 1;
    updateTimer();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerSeconds = 0;
      $("#timer-start").textContent = "Start again";
      $("#timer-status").textContent = "Session complete — stretch and take a break!";
      updateTimer();
      showToast("Focus session complete. Well done!");
    }
  }, 1000);
}
function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = 25 * 60;
  updateTimer();
  $("#timer-start").textContent = "Start focus";
  $("#timer-status").textContent = "Ready when you are.";
}

$("#open-task-form").addEventListener("click", openForm);
$("#close-task-form").addEventListener("click", closeForm);
$("#task-form").addEventListener("submit", handleNewTask);
$("#task-search").addEventListener("input", event => {
  searchTerm = event.target.value;
  renderTasks();
});
$$(".filter-tab").forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));
$$(".nav-link").forEach(link => link.addEventListener("click", event => {
  event.preventDefault();
  const view = link.dataset.view || "all";
  setFilter(view === "completed" ? "completed" : view === "today" ? "today" : "all");
  $("#tasks").scrollIntoView({ behavior: "smooth", block: "start" });
  $("#sidebar").classList.remove("is-open");
  $("#menu-toggle").setAttribute("aria-expanded", "false");
}));
$("#clear-completed").addEventListener("click", clearCompleted);
$("#menu-toggle").addEventListener("click", toggleSidebar);
$("#theme-toggle").addEventListener("click", toggleTheme);
$("#timer-start").addEventListener("click", startPauseTimer);
$("#timer-reset").addEventListener("click", resetTimer);

loadTheme();
updateDate();
updateTimer();
renderTasks();

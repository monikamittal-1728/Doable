// ═══════════════════════════════════════
//  DOABLE — index.js
//  Features: add, complete, delete, filter,
//  clear done, task counter, empty state,
//  localStorage persistence, Enter to submit
// ═══════════════════════════════════════

// ── DOM refs ──
const taskForm    = document.getElementById("taskForm");
const taskInput   = document.getElementById("addTask");
const todoList    = document.getElementById("todo");
const emptyState  = document.getElementById("emptyState");
const taskCounter = document.getElementById("taskCounter");
const doneCount   = document.getElementById("doneCount");
const btnClear    = document.getElementById("btnClearDone");
const filterNav   = document.getElementById("filterNav");

// ── State ──
let currentFilter = "all"; // "all" | "active" | "done"
const STORAGE_KEY = "doable_todos_v2";

// ── Boot ──
document.addEventListener("DOMContentLoaded", () => {
  renderAll();
});

// ── Add task (form submit) ──
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;

  const task = {
    id:        Date.now(),
    text:      text,
    done:      false,
    createdAt: new Date().toISOString(),
  };

  saveTodo(task);
  renderAll();

  taskInput.value = "";
  taskInput.focus();
});

// ── Filter tabs ──
filterNav.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;

  currentFilter = btn.dataset.filter;

  // update active state
  filterNav.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  renderAll();
});

// ── Task list click delegation (complete + delete) ──
todoList.addEventListener("click", (e) => {
  const item = e.target.closest(".task-item");
  if (!item) return;

  const id = Number(item.dataset.id);

  // Delete button
  if (e.target.closest(".task-delete")) {
    removeWithAnimation(item, id);
    return;
  }

  // Toggle complete on item click (anywhere else)
  toggleDone(id);
  renderAll();
});

// ── Touch fallback for delete (mobile / iPad) ──
todoList.addEventListener("touchend", (e) => {
  const deleteBtn = e.target.closest(".task-delete");
  if (!deleteBtn) return;

  // Prevent the click event firing too, avoiding double-trigger
  e.preventDefault();

  const item = deleteBtn.closest(".task-item");
  if (!item) return;

  const id = Number(item.dataset.id);
  removeWithAnimation(item, id);
});

// ── Clear done button ──
btnClear.addEventListener("click", () => {
  let todos = getTodos();
  const toRemove = todos.filter(t => t.done);

  // animate out all done items visible in list
  toRemove.forEach(t => {
    const el = todoList.querySelector(`[data-id="${t.id}"]`);
    if (el) animateOut(el);
  });

  setTimeout(() => {
    todos = todos.filter(t => !t.done);
    saveTodos(todos);
    renderAll();
  }, 260);
});

// ════════════════════════════════════════
//  RENDER
// ════════════════════════════════════════

function renderAll() {
  const todos   = getTodos();
  const visible = getFiltered(todos, currentFilter);

  todoList.innerHTML = "";

  if (visible.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
    visible.forEach((task, i) => {
      const el = createTaskEl(task);
      // stagger animation delay
      el.style.animationDelay = `${i * 40}ms`;
      todoList.appendChild(el);
    });
  }

  updateMeta(todos);
}

function createTaskEl(task) {
  const li = document.createElement("li");
  li.classList.add("task-item");
  if (task.done) li.classList.add("done");
  li.setAttribute("data-id", task.id);
  li.setAttribute("role", "listitem");
  li.setAttribute("aria-label", task.text + (task.done ? " — completed" : ""));

  li.innerHTML = `
    <span class="task-check" aria-hidden="true">
      ${task.done ? '<i class="fa-solid fa-check"></i>' : ""}
    </span>
    <span class="task-text">${escapeHtml(task.text)}</span>
    <button class="task-delete" aria-label="Delete task: ${escapeHtml(task.text)}" title="Delete">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
  `;

  return li;
}

function updateMeta(todos) {
  const total     = todos.length;
  const doneCount_ = todos.filter(t => t.done).length;
  const activeCount = total - doneCount_;

  // header counter
  taskCounter.textContent =
    total === 0 ? "0 tasks" :
    total === 1 ? "1 task"  :
    `${total} tasks`;

  // footer done count
  doneCount.textContent =
    doneCount_ > 0 ? `${doneCount_} of ${total} done` : "";

  // show/hide footer
  const listFooter = document.getElementById("listFooter");
  if (total === 0) {
    listFooter.classList.add("hidden");
  } else {
    listFooter.classList.remove("hidden");
  }

  // show/hide clear button
  btnClear.style.visibility = doneCount_ > 0 ? "visible" : "hidden";
}

// ════════════════════════════════════════
//  STORAGE
// ════════════════════════════════════════

function getTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function saveTodo(task) {
  const todos = getTodos();
  todos.push(task);
  saveTodos(todos);
}

function toggleDone(id) {
  const todos = getTodos().map(t =>
    t.id === id ? { ...t, done: !t.done } : t
  );
  saveTodos(todos);
}

function deleteTodo(id) {
  const todos = getTodos().filter(t => t.id !== id);
  saveTodos(todos);
}

// ════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════

function getFiltered(todos, filter) {
  if (filter === "active") return todos.filter(t => !t.done);
  if (filter === "done")   return todos.filter(t => t.done);
  return todos;
}

function removeWithAnimation(el, id) {
  animateOut(el);
  setTimeout(() => {
    deleteTodo(id);
    renderAll();
  }, 260);
}

function animateOut(el) {
  if (el) el.classList.add("removing");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
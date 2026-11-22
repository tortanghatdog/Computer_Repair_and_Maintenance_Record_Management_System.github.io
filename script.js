// Same limits as the C program
const MAX_CUSTOMERS = 50;
const MAX_PROBLEMS = 10;

// Customer records live in memory only and reset on refresh
const customers = [];
let selected = null; // customer chosen in "Update repair status"

const $ = (id) => document.getElementById(id);
const money = (n) => "PHP " + n.toFixed(2);

// Small helper for building elements safely (uses textContent)
function h(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

function setMsg(el, text, type) {
  el.textContent = text || "";
  el.className = "msg" + (type ? " " + type : "");
}

// Searches for a customer using their ID
function search(id) {
  return customers.find((c) => c.id === id) || null;
}

// Parses a repair cost; returns null when invalid
function parseCost(value) {
  const cost = parseFloat(value);
  return Number.isNaN(cost) || cost < 0 ? null : cost;
}

// Builds the details card for one customer
function customerCard(c) {
  const card = h("article", "card");

  const head = h("div", "card-head");
  const title = h("h3", "", c.name + " ");
  title.append(h("small", "", "Customer ID " + c.id));
  head.append(
    title,
    h("span", "badge " + (c.status === 2 ? "done" : "progress"),
      c.status === 2 ? "Completed" : "In progress")
  );

  const info = h("dl", "info");
  info.append(
    h("dt", "", "Contact number"), h("dd", "", c.cpNumber),
    h("dt", "", "Unit"), h("dd", "", c.unit)
  );

  const list = h("ol", "problems");
  c.problems.forEach((p) => {
    const li = h("li");
    li.append(h("span", "")); 
    li.firstChild.append(h("span", "", p.text), h("span", "", money(p.cost)));
    list.append(li);
  });

  const total = h("p", "total", "Total repair cost: ");
  total.append(h("strong", "", money(c.totalCost)));

  card.append(head, info, list, total);
  return card;
}

// Mobile dropdown menu
const nav = $("tabs");
const navToggle = $("navToggle");

function closeMenu() {
  nav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
}

navToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

// Close the dropdown when tapping outside it or pressing Escape
document.addEventListener("click", (e) => {
  if (!e.target.closest("header")) closeMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

// Tab navigation
nav.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  closeMenu();
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("active", b === btn));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === btn.dataset.view));
  if (btn.dataset.view === "all") viewCustomers();
});

// Add customer
$("addForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = $("addMsg");

  if (customers.length >= MAX_CUSTOMERS) {
    setMsg(msg, "Customer list is full!", "error");
    return;
  }

  const cost = parseCost($("cost").value);
  if (cost === null) {
    setMsg(msg, "Invalid repair cost!", "error");
    return;
  }

  const customer = {
    id: customers.length + 1, // automatically assigned
    name: $("name").value.trim(),
    cpNumber: $("cpNumber").value.trim(),
    unit: $("unit").value.trim(),
    problems: [{ text: $("problem").value.trim(), cost }],
    totalCost: cost,
    status: 1, // 1 = In Progress, 2 = Completed
  };
  customers.push(customer);

  e.target.reset();
  setMsg(msg, "Customer added successfully! Customer ID: " + customer.id, "ok");
});

// View all customers
function viewCustomers() {
  const list = $("allList");
  list.replaceChildren();

  if (customers.length === 0) {
    list.append(h("p", "empty", "No customer records found."));
    return;
  }
  customers.forEach((c) => list.append(customerCard(c)));
}

// Search customer
$("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const result = $("searchResult");
  result.replaceChildren();

  const id = parseInt($("searchId").value, 10);
  if (Number.isNaN(id)) {
    setMsg($("searchMsg"), "Invalid customer ID!", "error");
    return;
  }

  const c = search(id);
  if (!c) {
    setMsg($("searchMsg"), "Customer not found.", "error");
    return;
  }
  setMsg($("searchMsg"), "");
  result.append(customerCard(c));
});

// Update repair status: find the customer first
function renderUpdate() {
  $("updateBox").replaceChildren();
  $("updateActions").hidden = true;
  if (!selected) return;

  $("updateBox").append(customerCard(selected));
  // Completed repairs cannot be changed
  $("updateActions").hidden = selected.status === 2;
}

$("findForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = $("updateMsg");
  const id = parseInt($("updateId").value, 10);

  selected = Number.isNaN(id) ? null : search(id);
  renderUpdate();

  if (Number.isNaN(id)) setMsg(msg, "Invalid customer ID!", "error");
  else if (!selected) setMsg(msg, "Customer not found.", "error");
  else if (selected.status === 2) setMsg(msg, "This repair is already completed.", "error");
  else setMsg(msg, "");
});

// Option 1: add a new problem
$("problemForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = $("updateMsg");

  if (selected.problems.length >= MAX_PROBLEMS) {
    setMsg(msg, "Maximum of " + MAX_PROBLEMS + " problems reached!", "error");
    return;
  }

  const cost = parseCost($("newCost").value);
  if (cost === null) {
    setMsg(msg, "Invalid repair cost!", "error");
    return;
  }

  selected.problems.push({ text: $("newProblem").value.trim(), cost });
  selected.totalCost += cost;
  selected.status = 1;

  e.target.reset();
  renderUpdate();
  setMsg(msg, "New problem added successfully! Total repair cost: " + money(selected.totalCost), "ok");
});

// Option 2: mark the repair as completed
$("completeBtn").addEventListener("click", () => {
  selected.status = 2;
  renderUpdate();
  setMsg($("updateMsg"), "Repair marked as completed! Total repair cost: " + money(selected.totalCost), "ok");
});

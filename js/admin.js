import { listenToGamesAdmin, deleteGame } from "./firebase.js";
import { escapeText, formatDate } from "./ui.js";

// Admin credentials
const ADMIN_USERNAME = "codingadmin";
const ADMIN_PASSWORD = "vibe";

// DOM Elements
const loginScreen = document.getElementById("login-screen");
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("admin-username");
const passwordInput = document.getElementById("admin-password");
const loginError = document.getElementById("login-error");
const adminHeader = document.getElementById("admin-header");
const adminContent = document.getElementById("admin-content");
const logoutButton = document.getElementById("logout-button");

const statsContainer = document.getElementById("admin-stats");
const topGamesContainer = document.getElementById("admin-top-games");
const listContainer = document.getElementById("admin-list");
const loadingElement = document.getElementById("admin-loading");
const searchInput = document.getElementById("admin-search");
const sortSelect = document.getElementById("admin-sort");

let allGames = [];
let isAuthenticated = false;

// Check if already logged in
function checkAuth() {
  const token = sessionStorage.getItem("admin-token");
  if (token === "authenticated") {
    showDashboard();
    return;
  }
  showLogin();
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  adminHeader.hidden = true;
  adminContent.hidden = true;
  isAuthenticated = false;
}

function showDashboard() {
  loginScreen.classList.add("hidden");
  adminHeader.hidden = false;
  adminContent.hidden = false;
  isAuthenticated = true;
  if (!allGames.length) {
    initializeDashboard();
  }
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    sessionStorage.setItem("admin-token", "authenticated");
    loginError.classList.remove("show");
    loginError.textContent = "";
    showDashboard();
  } else {
    loginError.textContent = "Invalid username or password";
    loginError.classList.add("show");
    passwordInput.value = "";
  }
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem("admin-token");
  usernameInput.value = "";
  passwordInput.value = "";
  showLogin();
});

// Initialize
checkAuth();

// Initialize dashboard only after authentication
function initializeDashboard() {
  listenToGamesAdmin((games, error) => {
    loadingElement.hidden = true;
    if (error) {
      listContainer.innerHTML = '<div class="empty-state">Unable to load the admin dashboard right now.</div>';
      return;
    }
    allGames = games;
    renderAdmin();
  });

  searchInput.addEventListener("input", renderAdmin);
  sortSelect.addEventListener("change", renderAdmin);
}

function renderAdmin() {
  const query = searchInput.value.trim().toLowerCase();
  const sortMode = sortSelect.value;
  let filtered = allGames.filter((game) => {
    const haystack = `${game.studentName} ${game.gameName}`.toLowerCase();
    return haystack.includes(query);
  });

  filtered.sort(compareGames);
  if (sortMode === "newest") {
    filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }

  const totalVotes = filtered.reduce((sum, game) => sum + (game.voteCount ?? 0), 0);
  statsContainer.innerHTML = `
    <div class="card stat-card"><span>Total Games</span><strong>${filtered.length}</strong></div>
    <div class="card stat-card"><span>Total Upvotes</span><strong>${totalVotes}</strong></div>
    <div class="card stat-card"><span>Current Top 3</span><strong>${filtered.slice(0, 3).map((game) => escapeText(game.gameName)).join(" • ") || "Waiting for submissions"}</strong></div>
  `;

  topGamesContainer.innerHTML = "";
  const topThree = [...filtered].slice(0, 3);
  if (topThree.length === 0) {
    topGamesContainer.innerHTML = '<div class="empty-state">No submissions yet.</div>';
  } else {
    topThree.forEach((game, index) => {
      const card = document.createElement("article");
      card.className = `top-card top-card--${index === 0 ? "gold" : index === 1 ? "silver" : "bronze"}`;
      card.innerHTML = `
        <p class="top-card__place">${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : "rd"} Place</p>
        <h3>${escapeText(game.gameName)}</h3>
        <p><strong>Student:</strong> ${escapeText(game.studentName)}</p>
        <p><strong>Votes:</strong> ${game.voteCount ?? 0}</p>
      `;
      topGamesContainer.appendChild(card);
    });
  }

  if (filtered.length === 0) {
    listContainer.innerHTML = '<div class="empty-state">No submissions match the current search.</div>';
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Student</th>
        <th>Game</th>
        <th>Link</th>
        <th>Votes</th>
        <th>Date</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const body = table.querySelector("tbody");
  filtered.forEach((game) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeText(game.studentName)}</td>
      <td>${escapeText(game.gameName)}</td>
      <td><a href="${escapeText(game.gameUrl)}" target="_blank" rel="noopener noreferrer">Open</a></td>
      <td>${game.voteCount ?? 0}</td>
      <td>${formatDate(game.createdAt)}</td>
      <td><button class="delete-btn" data-game-id="${game.id}" title="Delete game">🗑️ Delete</button></td>
    `;
    body.appendChild(row);
    const deleteBtn = row.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => handleDeleteGame(game.id, game.gameName));
  });
  listContainer.innerHTML = "";
  listContainer.appendChild(table);
}

function compareGames(a, b) {
  const voteDiff = (b.voteCount ?? 0) - (a.voteCount ?? 0);
  if (voteDiff !== 0) return voteDiff;
  return (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0);
}

async function handleDeleteGame(gameId, gameName) {
  if (!confirm(`Are you sure you want to delete "${gameName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    await deleteGame(gameId);
    // Refresh the list - the listener will handle the update
  } catch (error) {
    console.error("Error deleting game:", error);
    alert("Failed to delete game. Please try again.");
  }
}

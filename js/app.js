import { ensureAnonymousUser, listenToGames, submitGame, voteForGame, hasVoted, listenToVotes } from "./firebase.js";
import { validateSubmission, normalizeGameUrl } from "./validation.js";
import { setMessage, clearMessage, escapeText, formatDate } from "./ui.js";

const form = document.getElementById("game-form");
const formMessage = document.getElementById("form-message");
const submitButton = document.getElementById("submit-button");
const topGamesContainer = document.getElementById("top-games");
const gamesList = document.getElementById("games-list");
const gamesLoading = document.getElementById("games-loading");
const gamesEmpty = document.getElementById("games-empty");
const gamesNoResults = document.getElementById("games-no-results");
const voteFeedback = document.getElementById("vote-feedback");
const searchInput = document.getElementById("search-games");
const sortSelect = document.getElementById("sort-games");

let allGames = [];
let currentUserId = null;
let votedGameIds = new Set();

async function init() {
  try {
    const user = await ensureAnonymousUser();
    currentUserId = user.uid;
    const storedVotes = JSON.parse(localStorage.getItem("summer-vibe-votes") || "[]");
    votedGameIds = new Set(storedVotes);
  } catch (error) {
    console.error("Anonymous auth failed", error);
    currentUserId = `guest-${Date.now()}`;
  }

  listenToGames((games, error) => {
    gamesLoading.hidden = true;
    if (error) {
      setMessage(formMessage, "Unable to load games right now. Please try again later.", "error");
      return;
    }
    allGames = games;
    renderGames();
    renderTopGames();
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(formMessage);
  submitButton.disabled = true;
  submitButton.textContent = "Saving...";

  const formData = new FormData(form);
  const payload = {
    studentName: formData.get("studentName").toString(),
    gameName: formData.get("gameName").toString(),
    gameUrl: formData.get("gameUrl").toString(),
    description: formData.get("description").toString()
  };

  const validation = validateSubmission(payload);
  if (!validation.valid) {
    setMessage(formMessage, validation.errors[0], "error");
    submitButton.disabled = false;
    submitButton.textContent = "Submit Game";
    return;
  }

  const duplicateUrl = allGames.some((game) => game.normalizedGameUrl === validation.values.normalizedGameUrl);
  if (duplicateUrl) {
    setMessage(formMessage, "That game link has already been submitted. Please choose a different game link.", "error");
    submitButton.disabled = false;
    submitButton.textContent = "Submit Game";
    return;
  }

  const duplicateByStudent = allGames.some((game) => 
    game.studentName.toLowerCase() === validation.values.studentName.toLowerCase() && 
    game.gameName.toLowerCase() === validation.values.gameName.toLowerCase()
  );
  if (duplicateByStudent) {
    setMessage(formMessage, "You have already submitted a game with this name. Please choose a different game or name.", "error");
    submitButton.disabled = false;
    submitButton.textContent = "Submit Game";
    return;
  }

  try {
    await submitGame({
      studentName: validation.values.studentName,
      gameName: validation.values.gameName,
      gameUrl: validation.values.gameUrl,
      normalizedGameUrl: validation.values.normalizedGameUrl,
      description: validation.values.description,
      voteCount: 0,
      status: "approved"
    });
    setMessage(formMessage, "🎉 Your game has been submitted successfully! Thanks for sharing it!", "success");
    form.reset();
    // Auto-hide success message after 4 seconds
    setTimeout(() => clearMessage(formMessage), 4000);
  } catch (error) {
    console.error(error);
    setMessage(formMessage, "Your game could not be saved. Please check your connection and try again.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Game";
  }
});

searchInput.addEventListener("input", renderGames);
sortSelect.addEventListener("change", renderGames);

function renderTopGames() {
  const topThree = [...allGames]
    .sort(compareGames)
    .slice(0, 3);

  if (topThree.length === 0) {
    topGamesContainer.innerHTML = '<div class="empty-state">No games have been submitted yet. Be the first to share one!</div>';
    return;
  }

  topGamesContainer.innerHTML = "";
  topThree.forEach((game, index) => {
    const card = document.createElement("article");
    card.className = `top-card top-card--${index === 0 ? "gold" : index === 1 ? "silver" : "bronze"}`;
    card.innerHTML = `
      <p class="top-card__place">${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : "rd"} Place</p>
      <h3>${escapeText(game.gameName)}</h3>
      <p><strong>Student:</strong> ${escapeText(game.studentName)}</p>
      <p><strong>Votes:</strong> ${game.voteCount ?? 0}</p>
      <a class="button button--secondary" href="${escapeText(game.gameUrl)}" target="_blank" rel="noopener noreferrer">Play Game</a>
    `;
    topGamesContainer.appendChild(card);
  });
}

function renderGames() {
  const query = searchInput.value.trim().toLowerCase();
  const sortMode = sortSelect.value;
  let filtered = [...allGames].filter((game) => {
    const haystack = `${game.gameName} ${game.studentName}`.toLowerCase();
    return haystack.includes(query);
  });

  filtered.sort(compareGames);
  if (sortMode === "newest") {
    filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }

  gamesLoading.hidden = true;
  if (filtered.length === 0) {
    if (allGames.length === 0) {
      gamesEmpty.hidden = false;
      gamesNoResults.hidden = true;
    } else {
      gamesEmpty.hidden = true;
      gamesNoResults.hidden = false;
    }
    gamesList.innerHTML = "";
    return;
  }

  gamesEmpty.hidden = true;
  gamesNoResults.hidden = true;
  gamesList.className = "games-grid";
  gamesList.innerHTML = "";

  filtered.forEach((game) => {
    const card = document.createElement("article");
    card.className = "card game-card";
    const alreadyVoted = votedGameIds.has(game.id);
    const buttonLabel = alreadyVoted ? "Upvoted! ⭐" : "Upvote";

    card.innerHTML = `
      <h3>${escapeText(game.gameName)}</h3>
      <div class="game-card__meta">By ${escapeText(game.studentName)} • ${formatDate(game.createdAt)}</div>
      <p class="game-card__description">${escapeText(game.description)}</p>
      <div class="game-card__footer">
        <a class="button button--secondary" href="${escapeText(game.gameUrl)}" target="_blank" rel="noopener noreferrer">Play Game</a>
        <button class="button button--primary" data-game-id="${game.id}" ${alreadyVoted ? "disabled" : ""}>${buttonLabel}</button>
        <span class="vote-pill">⭐ ${game.voteCount ?? 0}</span>
      </div>
    `;
    gamesList.appendChild(card);
  });

  gamesList.querySelectorAll("button[data-game-id]").forEach((button) => {
    button.addEventListener("click", handleVote);
  });
}

async function handleVote(event) {
  const button = event.currentTarget;
  const gameId = button.dataset.gameId;
  if (!gameId || !currentUserId) return;
  if (button.disabled) return;
  button.disabled = true;
  button.textContent = "Voting...";

  try {
    const result = await voteForGame(gameId, currentUserId);
    if (!result.alreadyVoted) {
      votedGameIds.add(gameId);
      localStorage.setItem("summer-vibe-votes", JSON.stringify([...votedGameIds]));
      setMessage(voteFeedback, "Thanks for upvoting! Your support helps every creator shine. ⭐", "success");
    } else {
      setMessage(voteFeedback, "You already supported this game. Thanks for cheering it on!", "success");
    }
    renderGames();
    renderTopGames();
  } catch (error) {
    console.error(error);
    button.disabled = false;
    button.textContent = "Upvote";
  }
}

function compareGames(a, b) {
  const voteDiff = (b.voteCount ?? 0) - (a.voteCount ?? 0);
  if (voteDiff !== 0) return voteDiff;
  return (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0);
}

init();

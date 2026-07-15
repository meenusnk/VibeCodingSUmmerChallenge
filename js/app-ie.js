// Main app logic for IE compatibility (no ES6 modules)

var allGames = [];
var currentUserId = null;
var votedGameIds = new Set();

var form = document.getElementById("game-form");
var formMessage = document.getElementById("form-message");
var submitButton = document.getElementById("submit-button");
var topGamesContainer = document.getElementById("top-games");
var gamesList = document.getElementById("games-list");
var gamesLoading = document.getElementById("games-loading");
var gamesEmpty = document.getElementById("games-empty");
var gamesNoResults = document.getElementById("games-no-results");
var voteFeedback = document.getElementById("vote-feedback");
var searchInput = document.getElementById("search-games");
var sortSelect = document.getElementById("sort-games");

// Initialize app
function initApp() {
  ensureAnonymousUser(function(user) {
    if (user) {
      currentUserId = user.uid;
      var storedVotes = JSON.parse(localStorage.getItem("summer-vibe-votes") || "[]");
      votedGameIds = new Set(storedVotes);
    } else {
      currentUserId = "guest-" + Date.now();
    }

    listenToGames(function(games) {
      gamesLoading.hidden = true;
      allGames = games;
      renderGames();
      renderTopGames();
    });
  });
}

form.addEventListener("submit", function(event) {
  event.preventDefault();
  clearMessage(formMessage);
  submitButton.disabled = true;
  submitButton.textContent = "Saving...";

  var formData = new FormData(form);
  var payload = {
    studentName: formData.get("studentName").toString().trim(),
    gameName: formData.get("gameName").toString().trim(),
    gameUrl: formData.get("gameUrl").toString().trim(),
    description: formData.get("description").toString().trim()
  };

  var validation = validateSubmission(payload);
  if (!validation.valid) {
    setMessage(formMessage, validation.errors[0], "error");
    submitButton.disabled = false;
    submitButton.textContent = "Submit Game";
    return;
  }

  var duplicateUrl = allGames.some(function(game) {
    return game.normalizedGameUrl === validation.values.normalizedGameUrl;
  });
  if (duplicateUrl) {
    setMessage(formMessage, "That game link has already been submitted. Please choose a different game link.", "error");
    submitButton.disabled = false;
    submitButton.textContent = "Submit Game";
    return;
  }

  var duplicateByStudent = allGames.some(function(game) {
    return game.studentName.toLowerCase() === validation.values.studentName.toLowerCase() &&
           game.gameName.toLowerCase() === validation.values.gameName.toLowerCase();
  });
  if (duplicateByStudent) {
    setMessage(formMessage, "You have already submitted a game with this name. Please choose a different game or name.", "error");
    submitButton.disabled = false;
    submitButton.textContent = "Submit Game";
    return;
  }

  submitGame({
    studentName: validation.values.studentName,
    gameName: validation.values.gameName,
    gameUrl: validation.values.gameUrl,
    normalizedGameUrl: validation.values.normalizedGameUrl,
    description: validation.values.description
  }, function(error) {
    if (error) {
      console.error(error);
      setMessage(formMessage, "Your game could not be saved. Please check your connection and try again.", "error");
    } else {
      setMessage(formMessage, "🎉 Your game has been submitted successfully! Thanks for sharing it!", "success");
      form.reset();
      setTimeout(function() {
        clearMessage(formMessage);
      }, 4000);
    }
    submitButton.disabled = false;
    submitButton.textContent = "Submit Game";
  });
});

searchInput.addEventListener("input", renderGames);
sortSelect.addEventListener("change", renderGames);

function renderGames() {
  var searchTerm = searchInput.value.toLowerCase();
  var sortBy = sortSelect.value;

  var filtered = allGames.filter(function(game) {
    var searchText = (game.studentName + " " + game.gameName + " " + game.description).toLowerCase();
    return searchText.includes(searchTerm);
  });

  if (sortBy === "highest-votes") {
    filtered.sort(function(a, b) {
      return b.voteCount - a.voteCount;
    });
  }

  if (filtered.length === 0) {
    gamesList.hidden = true;
    gamesEmpty.hidden = searchTerm ? false : true;
    gamesNoResults.hidden = !searchTerm;
  } else {
    gamesList.hidden = false;
    gamesEmpty.hidden = true;
    gamesNoResults.hidden = true;
    gamesList.innerHTML = filtered.map(function(game) {
      var isVoted = votedGameIds.has(game.id);
      return '<div class="card game-card">' +
        '<div class="game-card__content">' +
          '<h3>' + escapeText(game.gameName) + '</h3>' +
          '<p class="game-card__by">by <strong>' + escapeText(game.studentName) + '</strong></p>' +
          '<p>' + escapeText(game.description) + '</p>' +
          '<div class="game-card__actions">' +
            '<button class="button button--small" onclick="playGame(\'' + escapeText(game.gameUrl).replace(/'/g, "\\'") + '\')" title="Play game in new window">🎮 Play Game</button>' +
            '<button class="button button--small ' + (isVoted ? 'button--voted' : '') + '" onclick="voteGame(\'' + game.id + '\')" title="Upvote game">' +
              (isVoted ? '✓ Voted (' + game.voteCount + ')' : '⬆️ Vote (' + game.voteCount + ')') +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }
}

function renderTopGames() {
  var sorted = allGames.slice().sort(function(a, b) {
    return b.voteCount - a.voteCount;
  });
  var topThree = sorted.slice(0, 3);

  if (topThree.length === 0) {
    topGamesContainer.innerHTML = '<div class="empty-state">No games yet. Submit one to get started!</div>';
  } else {
    topGamesContainer.innerHTML = topThree.map(function(game, index) {
      var medals = ['🥇', '🥈', '🥉'];
      return '<div class="card top-game">' +
        '<div class="top-game__badge">' + medals[index] + '</div>' +
        '<h3>' + escapeText(game.gameName) + '</h3>' +
        '<p class="game-card__by">by <strong>' + escapeText(game.studentName) + '</strong></p>' +
        '<div class="top-game__votes">⬆️ ' + game.voteCount + ' votes</div>' +
      '</div>';
    }).join('');
  }
}

function playGame(url) {
  window.open(url, '_blank');
}

function voteGame(gameId) {
  if (votedGameIds.has(gameId)) {
    setMessage(voteFeedback, "You've already voted for this game!", "info");
    return;
  }

  voteForGame(gameId, currentUserId, function(error, result) {
    if (error) {
      console.error(error);
      setMessage(voteFeedback, "Could not vote. Please try again.", "error");
      return;
    }

    votedGameIds.add(gameId);
    localStorage.setItem("summer-vibe-votes", JSON.stringify(Array.from(votedGameIds)));
    setMessage(voteFeedback, "⬆️ Vote counted! Thanks for supporting this game!", "success");
    setTimeout(function() {
      clearMessage(voteFeedback);
    }, 3000);
    renderGames();
    renderTopGames();
  });
}

// Start app when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

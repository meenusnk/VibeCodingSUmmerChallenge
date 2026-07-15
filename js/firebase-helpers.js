// Firebase helper functions for IE compatibility (no ES6 modules)

function ensureAnonymousUser(callback) {
  auth.onAuthStateChanged(function(user) {
    if (user) {
      callback(user);
    } else {
      auth.signInAnonymously().then(function(result) {
        callback(result.user);
      }).catch(function(error) {
        console.error('Anonymous auth failed:', error);
        callback(null);
      });
    }
  });
}

function listenToGames(callback) {
  db.collection("games")
    .orderBy("createdAt", "desc")
    .onSnapshot(function(snapshot) {
      var games = [];
      snapshot.forEach(function(doc) {
        var game = doc.data();
        game.id = doc.id;
        if (game.status === "approved") {
          games.push(game);
        }
      });
      callback(games);
    }, function(error) {
      console.error('Error fetching games:', error);
      callback([]);
    });
}

function listenToGamesAdmin(callback) {
  db.collection("games")
    .orderBy("createdAt", "desc")
    .onSnapshot(function(snapshot) {
      var games = [];
      snapshot.forEach(function(doc) {
        var game = doc.data();
        game.id = doc.id;
        games.push(game);
      });
      callback(games);
    }, function(error) {
      console.error('Error fetching games:', error);
      callback([]);
    });
}

function listenToVotes(gameId, callback) {
  db.collection("games")
    .doc(gameId)
    .collection("votes")
    .onSnapshot(function(snapshot) {
      var votes = [];
      snapshot.forEach(function(doc) {
        var vote = doc.data();
        vote.id = doc.id;
        votes.push(vote);
      });
      callback(votes);
    }, function(error) {
      console.error('Error fetching votes:', error);
      callback([]);
    });
}

function submitGame(gameData, callback) {
  db.collection("games").add({
    studentName: gameData.studentName,
    gameName: gameData.gameName,
    gameUrl: gameData.gameUrl,
    normalizedGameUrl: gameData.normalizedGameUrl,
    description: gameData.description,
    voteCount: 0,
    status: "approved",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(docRef) {
    callback(null, { id: docRef.id });
  }).catch(function(error) {
    console.error('Error submitting game:', error);
    callback(error);
  });
}

function voteForGame(gameId, userId, callback) {
  var gameRef = db.collection("games").doc(gameId);
  var voteRef = db.collection("games").doc(gameId).collection("votes").doc(userId);

  db.runTransaction(function(transaction) {
    return transaction.get(gameRef).then(function(gameDoc) {
      return transaction.get(voteRef).then(function(voteDoc) {
        if (voteDoc.exists) {
          return { alreadyVoted: true, voteCount: gameDoc.data().voteCount || 0 };
        }

        var newVoteCount = (gameDoc.data().voteCount || 0) + 1;

        transaction.update(gameRef, { voteCount: newVoteCount });
        transaction.set(voteRef, {
          voterId: userId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { alreadyVoted: false, voteCount: newVoteCount };
      });
    });
  }).then(function(result) {
    callback(null, result);
  }).catch(function(error) {
    console.error('Error voting:', error);
    callback(error);
  });
}

function hasVoted(gameId, userId, callback) {
  db.collection("games").doc(gameId).collection("votes").doc(userId).get()
    .then(function(doc) {
      callback(null, doc.exists);
    })
    .catch(function(error) {
      console.error('Error checking vote:', error);
      callback(error, false);
    });
}

function deleteGame(gameId, callback) {
  db.collection("games").doc(gameId).delete()
    .then(function() {
      callback(null);
    })
    .catch(function(error) {
      console.error('Error deleting game:', error);
      callback(error);
    });
}

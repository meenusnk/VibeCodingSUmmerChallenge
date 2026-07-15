import { firebaseConfig } from "./firebase-config.js";

// Load Firebase SDK from unpkg CDN as fallback
const firebaseScript = document.createElement('script');
firebaseScript.src = 'https://unpkg.com/firebase@11.14.0/dist/firebase-compat.js';
document.head.appendChild(firebaseScript);

let app, db, auth;
let firebaseReady = new Promise((resolve) => {
  firebaseScript.onload = () => {
    firebase.initializeApp(firebaseConfig);
    app = firebase.app();
    db = firebase.firestore();
    auth = firebase.auth();
    resolve();
  };
});

// Wait for Firebase to load before using
const waitForFirebase = () => firebaseReady;

export async function ensureAnonymousUser() {
  await waitForFirebase();
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const result = await auth.signInAnonymously();
          resolve(result.user);
        } catch (error) {
          reject(error);
        }
      }
    });
  });
}

export function listenToGames(callback) {
  waitForFirebase().then(() => {
    db.collection("games")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const games = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((game) => game.status === "approved");
        callback(games);
      }, (error) => {
        callback([], error);
      });
  });
}

export function listenToGamesAdmin(callback) {
  waitForFirebase().then(() => {
    db.collection("games")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const games = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        callback(games);
      }, (error) => {
        callback([], error);
      });
  });
}

export function listenToVotes(gameId, callback) {
  waitForFirebase().then(() => {
    db.collection("games")
      .doc(gameId)
      .collection("votes")
      .onSnapshot((snapshot) => {
        callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        callback([], error);
      });
  });
}

export async function submitGame(gameData) {
  await waitForFirebase();
  return db.collection("games").add({
    ...gameData,
    voteCount: 0,
    status: "approved",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

export async function voteForGame(gameId, userId) {
  await waitForFirebase();
  return db.runTransaction(async (transaction) => {
    const gameRef = db.collection("games").doc(gameId);
    const voteRef = db.collection("games").doc(gameId).collection("votes").doc(userId);

    const gameDoc = await transaction.get(gameRef);
    const existingVote = await transaction.get(voteRef);

    if (existingVote.exists) {
      return { alreadyVoted: true, voteCount: gameDoc.data()?.voteCount ?? 0 };
    }

    const newVoteCount = (gameDoc.data()?.voteCount ?? 0) + 1;

    transaction.update(gameRef, { voteCount: newVoteCount });
    transaction.set(voteRef, {
      voterId: userId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return { alreadyVoted: false, voteCount: newVoteCount };
  });
}

export async function hasVoted(gameId, userId) {
  await waitForFirebase();
  const voteDoc = await db.collection("games").doc(gameId).collection("votes").doc(userId).get();
  return voteDoc.exists;
}

export async function deleteGame(gameId) {
  await waitForFirebase();
  return db.collection("games").doc(gameId).delete();
}

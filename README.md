# Summer Vibe Coding Game Festival

A cheerful, beginner-friendly web app for sharing student-made games, viewing each other’s work, and upvoting favorites. The app is designed for GitHub Pages and uses Firebase Cloud Firestore for persistent storage.

## 1. Project overview

This project lets students:
- submit a public GitHub Pages game link
- browse games submitted by classmates
- open and play those games
- upvote games they enjoy
- never downvote a game

The teacher can review all submissions and vote counts through the admin dashboard.

## 2. Features

- colorful, accessible festival-style interface
- game submission form with validation
- public gallery of approved games
- search and sorting controls
- top 3 leader board
- real-time updates with Firestore listeners
- anonymous-voter support with local browser protection
- read-only admin dashboard for quick review

## 3. Project folder structure

- index.html – homepage and main festival experience
- admin.html – teacher/admin dashboard
- css/styles.css – all visual styles
- js/app.js – homepage logic for submissions, search, sorting, and voting
- js/admin.js – admin dashboard logic
- js/firebase.js – Firebase initialization and Firestore helpers
- js/firebase-config.example.js – sample Firebase config template
- js/firebase-config.js – your actual Firebase config (copy from the example)
- js/validation.js – input validation helpers
- js/ui.js – small shared UI helper functions
- firestore.rules – Firestore security rules
- firestore.indexes.json – Firestore index configuration
- 404.html – GitHub Pages fallback page
- LICENSE – MIT license

## 4. Firebase account setup

1. Create a free Firebase account at https://firebase.google.com/
2. Create a new Firebase project.
3. Register a web app in the project settings.
4. Enable Cloud Firestore.
5. Enable Anonymous Authentication.
6. Copy the web config into js/firebase-config.js.

## 5. Creating a Firebase project

1. Open Firebase Console.
2. Click Add project.
3. Name the project, accept the prompts, and create it.
4. In Project Overview, click Add app and choose the web icon.

## 6. Registering a web app

When Firebase asks for the web app details:
- give the app a friendly name such as Summer Vibe Festival
- do not use service-account credentials or private keys
- copy the generated config values into js/firebase-config.js

## 7. Enabling Cloud Firestore

1. In Firebase Console, open Firestore Database.
2. Choose Create database.
3. Select Start in test mode for a beginner-friendly setup.
4. Pick a location close to your audience.
5. Click Enable.

## 8. Enabling Anonymous Authentication

1. In Firebase Console, open Authentication.
2. Go to the Sign-in method tab.
3. Enable Anonymous.
4. Save the change.

## 9. Adding the Firebase configuration

Copy the example file:

```bash
cp js/firebase-config.example.js js/firebase-config.js
```

Then replace the placeholder values with the values from your Firebase web app configuration.

## 10. Publishing Firestore security rules

1. In Firebase Console, open Firestore Database.
2. Go to Rules.
3. Replace the rules with the contents of firestore.rules.
4. Click Publish.

These rules allow public reading of approved submissions, protect vote writes, and keep the teacher/admin view read-only unless secure authentication is added later.

## 11. Creating any required Firestore indexes

The project does not require custom composite indexes for the beginner version. The file firestore.indexes.json is included for completeness.

## 12. Running the project locally

Because this is a static site, you can open index.html directly in a browser, or serve it locally with a simple static file server.

Example with Python:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/.

## 13. Creating a new GitHub repository

1. Create a new repo on GitHub.
2. Initialize it with a README if needed.
3. Push the project files to the main branch.

Example:

```bash
git init
git add .
git commit -m "Initial festival app"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY-NAME.git
git push -u origin main
```

## 14. Uploading or pushing all files

Upload all project files to the repository, including:
- index.html
- admin.html
- css/styles.css
- js/
- firestore.rules
- firestore.indexes.json
- 404.html
- README.md

## 15. Enabling GitHub Pages

1. Open the repository on GitHub.
2. Go to Settings → Pages.
3. Under Source, choose Deploy from a branch.
4. Choose main as the branch.
5. Choose /root as the folder.
6. Save and wait for the deployment to finish.

## 16. Selecting the main branch and root folder

Use the main branch and the root folder so the site is available at:

https://USERNAME.github.io/REPOSITORY-NAME/

## 17. Finding the deployed GitHub Pages URL

After deployment finishes, GitHub Pages will show a URL in the Pages settings screen.

## 18. Testing game submission

1. Open the deployed site.
2. Fill in the submission form.
3. Make sure the form validates all required fields.
4. Confirm the new game appears in the gallery and top 3 section.

## 19. Testing voting in two different browsers

1. Open the site in Browser A and vote for a game.
2. Open the site in Browser B and confirm that the vote count updates.
3. Refresh both browsers to check that the new totals persist.

## 20. Testing duplicate-vote prevention

1. Vote once in Browser A.
2. Try voting again in the same browser.
3. The button should become disabled and the vote should not be added again.
4. Clearing browser storage or using another browser/device may create another anonymous identity.

## 21. Viewing the Top 3 Games

The top 3 section updates automatically whenever vote totals change.

## 22. Using the teacher/admin dashboard

Open /admin.html to review submissions and totals. The dashboard is read-only by default.

## 23. Safely removing an invalid submission using Firebase Console

If a game link is inappropriate or invalid:
1. Open the Firebase Console.
2. Go to Firestore Database.
3. Find the game document under the games collection.
4. Delete the document carefully.

Do not expose admin passwords or private keys in the project files.

## 24. Updating and redeploying the project

1. Make changes locally.
2. Commit them.
3. Push to GitHub.
4. GitHub Pages will redeploy automatically when the main branch changes.

## 25. Troubleshooting Firebase permission errors

If you see permission errors:
- verify that the Firestore rules were published
- confirm that Anonymous Authentication is enabled
- make sure the app uses the correct Firebase project config

## 26. Troubleshooting GitHub Pages 404 errors

If GitHub Pages shows a 404 page:
- check that the repository name and branch are correct
- confirm that 404.html exists at the repo root
- open the site using the correct project URL

## 27. Free-tier and usage considerations

This project uses:
- GitHub Pages for free hosting
- Firebase Cloud Firestore Spark plan for free persistence
- no paid server, no Cloud Functions, and no paid Firebase services

## 28. Privacy and child-safety notes

Students should enter only their first name or a classroom display name. They should not enter email addresses, phone numbers, home addresses, school IDs, or other private information.

All submissions may be publicly visible. The teacher may remove links that are not appropriate for the activity.

## 29. Suggested follow-up TODOs

- [ ] Replace the placeholder Firebase values in js/firebase-config.js with your real project settings.
- [ ] Publish the Firestore rules from firestore.rules in the Firebase Console.
- [ ] Enable Anonymous Authentication in Firebase.
- [ ] Deploy the repository to GitHub Pages from the main branch.
- [ ] Test submitting and voting from at least two different browsers.
- [ ] Optionally add stronger teacher authentication later if you want a more secure admin experience.

## 30. Known limitations of browser-based anonymous voting

Anonymous voting is convenient for a classroom activity, but it is not perfect identity verification. Clearing browser storage, using another browser, or using another device can create a new anonymous identity. This project does not collect personal information beyond what students choose to enter.

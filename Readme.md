Recollect Space

Recollect Space is a web application for storing, organizing, and sharing personal photos and memories. It uses AI to help automatically organize photos into personalized folders (face-based grouping and smart sorting) and includes a blogging feature so users can create narratives around their memories.

Overview

- AI-driven photo organization: groups photos by detected faces and attributes.
- Face recognition & landmarks: detection, recognition and landmarking for accurate sorting.
- Smart folders and sharing: create, name, and share folders with others.
- Blogging: create posts tied to albums or individual photos.

This repository contains the backend services and local AI model artifacts used by the application. 

Quick Start (Backend)

Prerequisites:

- Node.js 16+ and npm installed.

Install dependencies:

```
npm install
```

Start the backend server (development):

```
node server.js
```



Environment variables

- `PORT` — port the server listens on (optional; configured in `server.js`).
- `DB_URI` or equivalent — connection string used by `config/Db.js`.
- Mailer configuration — see `config/NodemailerConfig.js` for required env vars.

Backend layout

- `server.js`: application entry point (starts Express server and loads routes).
- `routes/`: HTTP route definitions (AuthRoutes.js, Blogroutes.js, FolderRoutes.js, Photo.js).
- `controllers/`: request handlers (AuthControllers.js, Blogcontroller.js, FolderController.js, PhotoController.js).
- `models/`: Mongoose or ORM models (User.js, Blog.js, FolderModel.js, Photo.js).
- `middleware/`: middleware such as authentication (`AuthMiddleware.js`).
- `config/`: DB and mailer configuration (`Db.js`, `NodemailerConfig.js`).
- `utils/`: helper utilities (`ClientEncryption.js`, `Encryption.js`, `Password-utils.js`).

AI models

- The face/age/expression models used by the app are stored in the `models2` folder. These are the model shards and weight manifests for client-side face-api.js usage. Do not remove or relocate them unless you also update model-loading code on the frontend.

API notes

- Routes are defined under `routes/` and implemented in `controllers/`.
- Common endpoints (examples; check route files for exact paths):
  - Authentication: login, register, token refresh (see `routes/AuthRoutes.js`).
  - Photos: upload, list, face-grouping helpers (see `routes/Photo.js`).
  - Folders: create, share, list (see `routes/FolderRoutes.js`).
  - Blog: create/read posts (see `routes/Blogroutes.js`).


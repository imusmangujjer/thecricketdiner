# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React + TypeScript + Vite

### 1) Create the project (Vite + React + TS):

```js
npx create-vite@latest cricket-diner -- --template react-ts
cd cricket-diner
npm install
```
### 1) If you want npm create (Alternative):

You’ll need to allow scripts temporarily.

Run this in PowerShell as Administrator:

```js
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```
-Type Y when it asks for confirmation.

-Then run:

```js
npm create vite@latest cricket-diner -- --template react-ts
```

### 2) Add your app files

Move your files into src/ like this::

```js
cricket-diner/
  index.html
  src/
    App.tsx
    index.tsx
    index.css          (optional)
    constants.ts
    types.ts
    metadata.json
    components/
      icons/Icons.tsx
      LoadingScreen.tsx
      MatchSelectionScreen.tsx
      PodcastPlayer.tsx
      SetupScreen.tsx
      SpeakerConfig.tsx
      TopicSelectionScreen.tsx
    services/
      geminiService.ts
```
### 3) Install dependencies:

```js
npm i react react-dom @google/generative-ai
```
### 4) Run locally:

```js
npm run dev
```

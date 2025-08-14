# thecricketdiner
1) Create the project (Vite + React + TS)
# If PowerShell blocked npm create, use NPX (works without changing policies):
npx create-vite@latest cricket-diner -- --template react-ts
cd cricket-diner
npm install

2) Add your app files

Move your files into src/ like this:

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

3) Install dependencies
npm i react react-dom @google/generative-ai

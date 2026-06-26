# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

Project Description

Sports Finder Hub is a local sports and indoor games partner finder platform that helps users discover nearby players for games such as chess, carrom, cards, badminton, table tennis, football, and cricket. The platform allows users to create profiles, set availability, search partners by game type and location, send play requests, and manage community-based sports activities.

 File and Folder Description

### `.agents/`

Contains Firebase agent-related configuration and skill files used for Firebase project assistance and development automation.

### `.firebase/`

Stores Firebase CLI cache and hosting-related deployment files generated during Firebase setup and deployment.

### `dist/`

Contains the production build files generated after running `npm run build`. This folder is used for Firebase Hosting deployment.

### `node_modules/`

Contains all installed npm packages and dependencies required by the project. It is generated after running `npm install`.

### `public/`

Stores static files that can be directly accessed by the browser, such as icons, images, and public assets.

### `src/`

Contains the main source code of the Sports Finder application, including React components, pages, Firebase setup, styles, routing, and application logic.

### `.firebaserc`

Stores Firebase project configuration and connects the local project to the selected Firebase project.

### `.gitignore`

Specifies files and folders that should not be uploaded to GitHub, such as `node_modules`, build folders, and environment files.

### `eslint.config.js`

Contains ESLint configuration used to check JavaScript and JSX code quality. It includes recommended JavaScript rules, React Hooks rules, and React Refresh rules.

### `firebase.json`

Defines Firebase Hosting settings. The project is configured to deploy the `dist` folder and redirect all routes to `index.html`, which supports React Router page navigation.

### `index.html`

The main HTML entry file for the Vite React app. It contains the root element where the React application is rendered.

### `package.json`

Contains project details, npm scripts, dependencies, and development dependencies. The main scripts include `npm run dev`, `npm run build`, `npm run lint`, and `npm run preview`.

### `package-lock.json`

Locks the exact versions of all installed dependencies to ensure the project runs consistently on different systems.

### `README.md`

Contains documentation for the project. It currently includes basic React and Vite setup information.

### `skills-lock.json`

Stores Firebase-related agent skill metadata, including Firebase Authentication, Firestore, Hosting, Security Rules, and Firebase basics.

### `vite.config.js`

Contains Vite configuration. The project uses React and Tailwind CSS plugins for frontend development and styling.

## Technology Used

* React
* Vite
* Firebase
* React Router DOM
* Leaflet
* React Leaflet
* Tailwind CSS
* ESLint
* npm

## Summary

Sports Finder is a modern sports partner-finding web application developed using React, Vite, Firebase, and Tailwind CSS. It provides user authentication, match creation, player search, profile management, notifications, and location-based features to help users connect and participate in sports activities.

# 10x Cards

An AI-powered flashcard application for efficient learning through spaced repetition.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

10x Cards is a web application that enables users to quickly and efficiently create educational flashcards using artificial intelligence. The application allows for automatic flashcard generation from input text, as well as manual creation, editing, and management of flashcards. The main goal of the product is to accelerate the process of creating high-quality educational flashcards and support effective learning through the spaced repetition method.

### Problem Statement

Manual creation of high-quality educational flashcards is time-consuming, which discourages users from using the effective learning method of spaced repetition. Many students and individuals interested in efficient learning give up on using flashcards due to the time needed for their preparation, despite this method being scientifically proven as an effective learning technique.

## Tech Stack

### Frontend
- **Astro v5.5.5** - For creating fast, efficient pages and applications with minimal JavaScript
- **React v19.0.0** - For interactive components where needed
- **TypeScript** - For static typing and better IDE support
- **Tailwind CSS v4.0.17** - For convenient application styling
- **Shadcn/ui** - Library of accessible React components for UI

### Backend
- **Supabase** - Comprehensive backend solution:
  - PostgreSQL database
  - SDK in multiple languages (Backend-as-a-Service)
  - Open-source solution that can be hosted locally or on your own server
  - Built-in user authentication

### AI Integration
- **Openrouter.ai** - Service for communication with various AI models:
  - Access to a wide range of models (OpenAI, Anthropic, Google, and many others)
  - Allows setting financial limits on API keys

### CI/CD & Hosting
- **GitHub Actions** - For creating CI/CD pipelines
- **DigitalOcean** - For hosting the application via docker image

## Getting Started Locally

1. Clone the repository:

```bash
git clone https://github.com/yourusername/10x-cards.git
cd 10x-cards
```

2. Install dependencies:

```bash
npm install
```

> **Note:** When switching the project between platforms (e.g. macOS M1 and Linux ARM64), before reinstalling dependencies remove `node_modules` and `package-lock.json`, then run:
>
> ```bash
> rm -rf node_modules package-lock.json
> npm install
> ```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:4321](http://localhost:4321) in your browser to see the application.

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the application for production
- `npm run preview` - Previews the production build
- `npm run astro` - Run Astro CLI commands
- `npm run lint` - Runs ESLint to check for code issues
- `npm run lint:fix` - Automatically fixes ESLint issues
- `npm run format` - Automatically formats code with Prettier

## Project Scope

### Key Features

1. **AI Flashcard Generation**
   - Generate flashcards from input text
   - Review, approve, or reject AI-generated flashcards

2. **Manual Flashcard Creation**
   - Create flashcards manually with front and back structure

3. **Flashcard Management**
   - View, edit, and delete existing flashcards
   - Sort and filter flashcards

4. **User Account System**
   - Register and login via email and password
   - Email verification
   - Store flashcards within user accounts

5. **Spaced Repetition System**
   - Integration with existing spaced repetition algorithm
   - Learning session interface with progress information and statistics

6. **Analytics and Monitoring**
   - Track the origin of each flashcard (AI vs. manual)
   - Collect data on the number of created flashcards

### MVP Limitations

The following features are not included in the MVP:
1. Custom, advanced repetition algorithm (like SuperMemo, Anki)
2. Multi-format import (PDF, DOCX, etc.)
3. Flashcard set sharing between users
4. Integrations with other educational platforms
5. Mobile applications (web version only initially)
6. Editing flashcards before approval (for AI-generated flashcards)
7. Advanced flashcard formatting (images, sounds, videos)

## Project Status

This project is currently in development. The MVP is being built with the goal of allowing users to create flashcards using AI and manually, manage them, and use them for efficient learning through spaced repetition.

### Success Metrics

1. **AI Acceptance Rate**
   - Goal: 75% of AI-generated flashcards accepted by users

2. **AI Share in Flashcard Creation**
   - Goal: 75% of all flashcards created using AI

3. **User Retention**
   - Goal: 50% of new users return to the application within a week of registration

4. **User Engagement**
   - Goal: Average of 3 learning sessions per week among active users

## License

MIT

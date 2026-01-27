# Git Visualizer

A full-stack web application for interactive visualization and analysis of Git repositories. Explore commit graphs, branches, contributor statistics, and more through an intuitive interface.

## Features

- Interactive commit graph visualization
- Diff viewer for file changes
- File tree browser at any commit
- Branch comparison
- Contributor statistics and activity heatmaps
- Code churn and bus factor analysis
- GitHub integration (PRs, issues linked to commits)
- **High Performance Rendering**: Virtualized graph handling for large repositories (10k+ commits)
- **Smart Cloning**: Auto-cleanup of temporary files and cancellation support
- Dark mode support

## Tech Stack

**Frontend:** React, Vite, TypeScript, TailwindCSS, XYFlow, Zustand

**Backend:** Express, TypeScript, simple-git

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Git installed on your system

### Installation

1. Clone the repository:

```bash
git clone https://github.com/sharmaniraj009/gitvisualizer.git
cd gitvisualizer
```

2. Install dependencies:

```bash
npm install
```

3. Start the development servers:

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173).

4. Open http://localhost:5173 in your browser.

### Running Individually

```bash
npm run dev:backend   # Start only backend
npm run dev:frontend  # Start only frontend
```

## Visualizing the repo

1. Add the absolute path of the folder containing the `.git` folder and voila!

###

Additionaly you can also input the github/gitlab url in the input bar on index page. or simply add `localhost:<port> ` prefix to your github/gitlab repo `http://localhost:<port>/github.com/<user>/<repo>`

## Large Repository Support

Git Visualizer is optimized for handling large repositories (10k+ commits):

- **Virtualization**: Uses advanced graph virtualization to render only visible nodes, ensuring smooth 60fps scrolling even for massive histories.
- **Buffered Streaming**: Commits are streamed in chunks to prevent UI freezing during load.
- **Simplified Mode**: Automatically suggests a simplified viewing mode (hiding merge commits or limiting metadata) for extremely large datasets.
- **Safe Evaluation**: Warns users before loading heavy repositories to prevent browser crashes.

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3001                    # Backend server port (optional)
GITHUB_TOKEN=your_token      # GitHub personal access token for private repos (optional)
```

## Project Structure

```
gitvisualizer/
├── backend/           # Express API server
│   └── src/
│       ├── routes/    # API endpoints
│       └── services/  # Git and GitHub services
├── frontend/          # React SPA
│   └── src/
│       ├── components/  # UI components
│       ├── api/         # API client
│       └── store/       # Zustand state
└── package.json       # Workspace configuration
```

## Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/gitvisualizer.git
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Workflow

1. Make sure dependencies are installed:

   ```bash
   npm install
   ```

2. Start the development servers:

   ```bash
   npm run dev
   ```

3. Make your changes and test them locally

4. Ensure your code follows the existing patterns:
   - Use TypeScript for all new code
   - Follow the existing file structure
   - Keep components focused and reusable

### Submitting Changes

1. Commit your changes with clear, descriptive messages:

   ```bash
   git commit -m "feat: add new visualization feature"
   ```

2. Push to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

3. Open a Pull Request with:
   - A clear title describing the change
   - Description of what was changed and why
   - Screenshots for UI changes

### Commit Message Convention

Use conventional commits format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Code Style

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use TailwindCSS for styling
- Keep functions small and focused

### Reporting Issues

When reporting bugs, please include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/Node.js version
- Screenshots if applicable

## License

This project is licensed under the Creative Commons
Attribution-NonCommercial 4.0 International license.

Commercial use is prohibited without a paid license.
See COMMERCIAL-LICENSE.md for details.

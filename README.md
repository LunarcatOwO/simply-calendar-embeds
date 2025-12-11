# Simply Calendar Embeds

This is a Turborepo monorepo for the Simply Calendar Embeds project.

## Project Structure

```
├── apps/
│   └── web/          # Next.js application
├── packages/         # Shared packages (add your shared libraries here)
├── turbo.json        # Turborepo configuration
└── package.json      # Root package.json with workspace configuration
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm

### Installation

Install dependencies for all workspaces:

```bash
npm install
```

### Development

Run the development server for all apps:

```bash
npm run dev
```

The web app will be available at [http://localhost:3000](http://localhost:3000).

### Building

Build all apps and packages:

```bash
npm run build
```

### Linting

Run linting across all workspaces:

```bash
npm run lint
```

## Turborepo

This monorepo uses [Turborepo](https://turborepo.com/) for build orchestration and caching.

### Key Features

- **Parallel execution**: Run tasks across multiple packages simultaneously
- **Caching**: Never rebuild the same code twice
- **Remote caching**: Share cache with your team (when configured)
- **Task dependencies**: Define relationships between tasks

### Configuration

The Turborepo configuration is in [turbo.json](turbo.json). It defines:

- Build pipeline with outputs cached to `.next/**` (excluding cache)
- Development mode that doesn't cache and runs persistently
- Lint task with workspace dependencies

## Adding New Apps or Packages

### Add a new app

1. Create a new directory in `apps/`
2. Add a `package.json` with a unique name
3. Ensure it has `dev`, `build`, and `lint` scripts
4. Run `npm install` from the root

### Add a new package

1. Create a new directory in `packages/`
2. Add a `package.json` with a unique name
3. Define your package exports
4. Reference it in other workspaces using the package name

## Learn More

- [Turborepo Documentation](https://turborepo.com/)
- [Next.js Documentation](https://nextjs.org/docs)

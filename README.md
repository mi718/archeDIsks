# OrbitalDisk - Circular Planner

A responsive web app for creating, editing, and sharing circular "discs" representing planning timelines with multiple rings and activities.

## Features

- **Circular Disc View**: Interactive SVG-based circular planner with drag-and-drop activities
- **Multiple Views**: Disc, Calendar, and List views of the same data
- **Ring Management**: Create and manage multiple rings (teams/departments)
- **Activity Management**: Add, edit, and organize activities with labels and attachments
- **Filtering & Search**: Filter by rings, labels, text search, and date ranges
- **Export/Import**: JSON export/import and PNG/PDF export capabilities
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Light and dark theme support
- **Accessibility**: Keyboard navigation and screen reader support

## Tech Stack

- **Frontend**: React 18+, TypeScript, Vite
- **State Management**: Zustand
- **Routing**: React Router v6
- **UI**: Tailwind CSS + Headless UI
- **Forms**: React Hook Form + Zod validation
- **Charts**: Native SVG with D3 for polar math
- **Date Utils**: date-fns
- **Testing**: Vitest + React Testing Library + Playwright
- **Linting**: ESLint + Prettier + Husky

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd orbitaldisk
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests
- `npm run test:ui` - Run tests with UI
- `npm run test:e2e` - Run E2E tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, Input, etc.)
│   ├── layout/         # Layout components (AppBar, Sidebar)
│   └── disc/           # Disc-specific components
├── views/              # Page components
├── stores/              # Zustand state management
├── repositories/        # Data persistence layer
├── lib/                 # Utility functions
│   ├── date-utils.ts   # Date manipulation utilities
│   ├── polar-utils.ts  # Polar coordinate calculations
│   └── validation.ts   # Zod schemas
├── types/              # TypeScript type definitions
└── test/               # Test setup and utilities
```

## Core Concepts

### Disc
A circular planning timeline with:
- Start and end dates
- Default time unit (day, week, month, quarter)
- Multiple rings
- Labels and activities
- Theme customization

### Ring
A concentric circle representing a team/department:
- Types: title, date, calendar, shared
- Custom time unit override
- Read-only support for shared rings

### Activity
An event or task plotted on a ring:
- Start and end dates
- Title and description
- Color and labels
- Attachments and recurrence
- Drag-and-drop repositioning

## Usage

### Creating a Disc

1. Click "New Disc" on the home page
2. Enter disc name, start/end dates, and time unit
3. Click "Create" to save

### Adding Rings

1. Open a disc
2. Click "Add Ring" in the toolbar
3. Enter ring name, type, and color
4. Click "Create Ring"

### Adding Activities

1. Click on a ring in the disc view
2. Fill in activity details (title, dates, color, labels)
3. Click "Create" to add the activity

### Filtering

1. Click "Filter" in the toolbar
2. Select rings, labels, or date ranges
3. Click "Apply Filters"

### Export/Import

- **Export**: Click "Export" to download JSON file
- **Import**: Click "Import" and select JSON file

## Development

### Adding New Features

1. Create components in appropriate directories
2. Add types to `src/types/index.ts`
3. Update stores if state management is needed
4. Add tests for new functionality

### Testing

- **Unit Tests**: Test utility functions and components
- **Component Tests**: Test React components in isolation
- **E2E Tests**: Test complete user workflows

### Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind CSS for styling
- Write tests for new features
- Use semantic commit messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Inspired by Plandisc circular planning methodology
- Built with modern React and TypeScript
- Uses Tailwind CSS for styling
- D3.js for polar coordinate calculations
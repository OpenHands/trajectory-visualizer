# OpenHands Trajectory Visualizer

A modern web application for visualizing OpenHands Resolver and their execution trajectory.

![Trajectory Visualizer](https://i.postimg.cc/VL4VYLbT/image.png)

## Features

- **GitHub Authentication**: Secure GitHub token authentication with appropriate scopes
- **Repository Selection**: Easy navigation between repositories
- **Workflow Run Timeline**: Interactive timeline visualization of workflow execution steps
- **OpenHands Support**: Upload and visualize trajectories exported from OpenHands
- **Dark/Light Mode**: Full support for system and user preferences
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Keyboard Navigation**: Efficient keyboard shortcuts for timeline traversal

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/OpenHands/trajectory-visualizer.git
   cd trajectory-visualizer
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

#### GitHub Workflow Visualization
To use Trajectory Visualizer with GitHub workflows, you'll need a GitHub personal access token with the following scopes:
- `repo` - Full control of private repositories
- `workflow` - Update GitHub Action workflows

Follow these steps to create a token:
1. Go to GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Generate a new token with the required scopes
3. Copy the token and paste it into the application when prompted

#### OpenHands Trajectory Visualization
You can visualize trajectories exported from OpenHands in several ways:

##### Method 1: Upload a local file
1. In OpenHands, use the download button next to the thumbs up/down buttons to export a trajectory
2. In Trajectory Visualizer, click "Upload OpenHands Trajectory"
3. Drag and drop the downloaded JSON file or click to select it
4. The trajectory will be displayed in the timeline view

##### Method 2: Load from a URL
You can load a trajectory directly from a URL by adding the `fileUrl` parameter to the application URL:

```
https://trajectory-visualizer.example.com/?fileUrl=https://example.com/path/to/trajectory.json
```

This is useful for:
- Sharing trajectories hosted in GitHub Gists
- Loading trajectories from public storage services
- Embedding the visualizer in other applications with pre-loaded data

The application will automatically fetch and display the trajectory from the provided URL.

##### Method 3: Embed data directly in URL
For smaller trajectories, you can also embed the data directly in the URL using the `data` parameter with base64 encoding:

```
https://trajectory-visualizer.example.com/?data=eyJoaXN0b3J5IjpbLi4uXX0=
```

The timeline shows:
- Actions (commands, edits, searches) in blue
- Observations (messages, errors) in gray/red
- Each step shows the timestamp, title, content, and any metadata
- You can navigate through steps using arrow keys or clicking

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Routing**: React Router
- **Styling**: Tailwind CSS with dark mode support
- **API Integration**: Axios for GitHub API requests

## Development

### Project Structure

```
trajectory-visualizer/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── upload/           # OpenHands trajectory upload
│   │   │   ├── timeline/         # Timeline visualization
│   │   │   └── ...
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   │   └── openhands-converter.ts  # OpenHands format converter
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

### Available Scripts

- `npm start`: Start development server
- `npm build`: Build production-ready app
- `npm test`: Run tests
- `npm eject`: Eject from Create React App

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- GitHub for their comprehensive API

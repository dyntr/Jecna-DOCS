# Live Text Editor Documentation (Jecna DOCS)

## Table of Contents
1. [Overview](#overview)
2. [Installation](#installation)
   - [Install Dependencies](#install-dependencies)
   - [Start the Server](#start-the-server)
   - [Access the Application](#access-the-application)
3. [Project Structure](#project-structure)
4. [Usage](#usage)
5. [Code Description](#code-description)
   - [HTML](#html)
   - [CSS](#css)
   - [JavaScript](#javascript)
   - [Backend](#backend)
6. [Dependencies](#dependencies)
7. [Future Improvements](#future-improvements)
8. [License](#license)

---

## Overview

The **Live Text Editor** is a collaborative web-based text editing application. It allows multiple users to edit text in real-time, synchronizing changes instantly across connected clients.

---

## Installation

### Install Dependencies
To install the necessary dependencies, run:
```bash
npm install
```

### Start the Server
Start the server using:
```bash
npm start
```

### Access the Application
Open your web browser and navigate to:
```
http://localhost:3000
```

---

## Project Structure

```
├── public/
│   ├── index.html      # Main HTML file
│   ├── styles.css      # CSS for styling
│   └── script.js       # Client-side JavaScript
├── server.js           # Main server script
├── package.json        # Project metadata and dependencies
├── package-lock.json   # Locked versions of dependencies
└── README.md           # Project documentation
```

---

## Usage

1. Start the server using the `npm start` command.
2. Open a browser and go to `http://localhost:3000`.
3. Begin typing in the text editor; updates are synchronized in real-time across connected clients.

---

## Code Description

### HTML

The main structure of the application is defined in `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Text Editor</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="center">
        <div id="editor-container">
            <div id="editor-title">Text Editor</div>
            <div id="editor" contenteditable="true"></div>
            <div id="container-in-editor-container-under-editor">
                <div id="status">Connecting</div>
            </div>
        </div>
    </div>
    <script src="./script.js"></script>
</body>
</html>
```

### CSS

Styling is implemented in `styles.css` to provide a modern and responsive design:
```css
body {
  font-family: "Roboto", Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #20232a;
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
#editor-container {
  background-color: #282c34;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
}
#editor {
  background-color: #20232a;
  padding: 16px;
  border-radius: 8px;
  min-height: 300px;
  overflow-y: auto;
}
#status {
  margin-top: 10px;
  color: #61dafb;
  text-align: center;
}
```

### JavaScript

The client-side logic is in `script.js`:
```javascript
const editor = document.getElementById('editor');
const status = document.getElementById('status');

const socket = new WebSocket('ws://localhost:3000');

socket.onopen = () => {
    status.textContent = 'Connected';
};

socket.onmessage = (event) => {
    editor.textContent = event.data;
};

editor.addEventListener('input', () => {
    socket.send(editor.textContent);
});
```

### Backend

The backend, written in `server.js`, uses Node.js, Express, and WebSocket:
```javascript
const express = require('express');
const WebSocket = require('ws');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});

app.use(express.static('public'));

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
```

---

## Dependencies

Dependencies are listed in `package.json`:
```json
{
  "express": "^4.21.1",
  "ws": "^8.18.0"
}
```

Install them with:
```bash
npm install
```

---

## Future Improvements

- Add authentication for secure access.
- Implement a version control system to track changes.
- Optimize performance for larger collaboration groups.

---

## License

This project is licensed under the MIT License.

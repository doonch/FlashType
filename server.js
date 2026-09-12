const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Log incoming requests for easy debugging
app.use((req, res, next) => {
  next();
});

// Alias direct lesson file requests if requested at root
app.get('/test.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'lessons', 'test.txt'));
});
app.get('/Polish.7.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'lessons', 'Polish.7.txt'));
});

// Serve static assets from root directory
app.use(express.static(path.join(__dirname)));

// Root route serves Flash.html directly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Flash.html'));
});

// Audio requests that do not exist return 404 without falling back to HTML
app.get('/audio/*', (req, res) => {
  res.status(404).send('Audio file not found');
});

// Fallback to Flash.html for unrecognized routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Flash.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FlashType app listening on http://0.0.0.0:${PORT}`);
});

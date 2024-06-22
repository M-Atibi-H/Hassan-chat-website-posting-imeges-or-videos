const express = require('express');
const socketio = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: 'uploads/' });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('media'), (req, res) => {
  if (req.file) {
    const post = {
      url: `/uploads/${req.file.filename}`,
      type: req.file.mimetype.split('/')[0],
      timestamp: new Date()
    };

    fs.readFile('posts.json', (err, data) => {
      const posts = err ? [] : JSON.parse(data);
      posts.push(post);

      fs.writeFile('posts.json', JSON.stringify(posts), (err) => {
        if (err) {
          res.status(500).json({ error: 'Failed to save post' });
          return;
        }

        res.json(post);
      });
    });
  } else {
    res.status(400).json({ error: 'No file uploaded' });
  }
});

app.get('/posts', (req, res) => {
  fs.readFile('posts.json', (err, data) => {
    if (err) {
      res.json([]);
    } else {
      res.json(JSON.parse(data));
    }
  });
});

const server = app.listen(PORT, function() {
  console.log(`Server is running on port ${PORT}`);
});

const io = socketio(server);

io.on('connection', function(socket) {
  console.log('Connected to ' + socket.id);

  fs.readFile('text.txt', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    socket.emit('history', data);
  });

  socket.on('chat', function(message) {
    io.emit('chat', message);

    fs.appendFile('text.txt', JSON.stringify(message) + '<br>', function(err) {
      if (err) {
        console.log(err);
      }
    });
  });

  socket.on('like', function(likeData) {
    io.emit('like', likeData);
  });

  socket.on('disconnect', function() {
    console.log('Disconnected from ' + socket.id);
  });
});

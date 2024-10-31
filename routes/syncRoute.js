const express = require('express')
const router = express.Router()
const fs = require('fs');




//read .csv log sync file 
router.get('/logs', (req, res) => {
    const filePath = 'sync/log.txt'; // Replace with the actual file path
  
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        res.status(500).json({ error: 'Failed to read file' });
      } else {
        const records = data.split('\n').map(line => {
          const fields = line.split('#');
          return {
            send: (fields[0]),
            received: (fields[1]),
            date: fields[2]
          };
        });
  
        res.json({records});
      }
    });
  });


module.exports = router
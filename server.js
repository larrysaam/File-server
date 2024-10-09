const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser')
const cors = require('cors')
// const multer = require('multer')

const app = express();
const port = 5000; // Replace with your desired port
const MainRepo = 'depotcec/digit'




//middlewares
app.use(bodyParser.urlencoded({extended : false}))
app.use(bodyParser.json())


//avoid cors errors
app.use(cors())


//fetching birth certificates
app.get('/naissances/actes', (req, res) => {
  const actesPath = `${MainRepo}/naissances/actes`; // Replace with the actual path
  const declaPath = `${MainRepo}/naissances/declaration`;

  console.log('actes')

  fs.readdir(actesPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      res.status(500).json({ error: 'Failed to get file names' });
    } else {
      const fileNames = files.map(file => file.replace(/\.txt$/, '')); // Remove '.txt' extension if applicable
      res.json({ fileNames });
    }
  });
  
});



//fetching birth declaration
app.get('/naissances/decla', (req, res) => {
  const actesPath = `${MainRepo}/naissances/actes`; // Replace with the actual path
  const declaPath = `${MainRepo}/naissances/declaration`;

  console.log('dec')

  fs.readdir(declaPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      res.status(500).json({ error: 'Failed to get file names' });
    } else {
      const fileNames = files.map(file => file.replace(/\.txt$/, '')); // Remove '.txt' extension if applicable
      res.json({ fileNames });
    }
  });
  
});


//download files (dir_subdir_filename)
app.get('/download/:filename', (req, res)=>{
  
  const filename = req.params.filename.split('-')[2]
  const subdir = req.params.filename.split('-')[1]
  const dir = req.params.filename.split('-')[0]

  console.log(req.params.filename)



  res.download(`${MainRepo}/${dir}/${subdir}/${filename}`,
  (err)=>{
    if(err){
        console.log(err)
    }else{
      console.log('success')
    }
  })
})



//read .csv log sync file 
app.get('/sync/logs', (req, res) => {
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

      console.log(records)
      res.json({records});
    }
  });
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser')
const cors = require('cors')
const csv = require('csv-parser');
const moment = require('moment')
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

      res.json({records});
    }
  });
});




app.get('/files/open/:filename', async (req, res) => {
    const centername = req.params.filename.split('-')[2];
    const subdir = req.params.filename.split('-')[1];
    const dir = req.params.filename.split('-')[0];

    let matchingFiles = [];
    let female = 0;
    let male = 0;
    let nationalityCount = {};
    let maritalCount = {}

    try {
        const files = await fs.promises.readdir(`${MainRepo}/${dir}/${subdir}`);

        matchingFiles = files.filter(file => file.startsWith(centername));

        await Promise.all(matchingFiles.map(async (file) => {
            const filePath = `${MainRepo}/${dir}/${subdir}/${file}`;
            const data = await new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv({ separator: '#' }))
                    .on('data', (data) => {
                        if (data.sexe === '2') {
                            female++;
                        } else if (data.sexe === '1') {
                            male++;
                        }

                        const nationality = data.nationalite_pere || 'Unknown';
                        nationalityCount[nationality] = (nationalityCount[nationality] || 0) + 1;


                        if(subdir === 'declaration'){
                          const marital = data.situation_matrimoniale_mere || 'Unknown';
                          maritalCount[marital] = (maritalCount[marital] || 0) + 1;
                        }
                    })
                    .on('end', () => {
                        resolve();
                    })
                    .on('error', reject);
            });

            await data;
        }));

        res.json({
            genderCount: {
                female,
                male
            },
            nationalities: nationalityCount,
            maritalCount,
            files: matchingFiles.length
        });
    } catch (err) {
        console.error('Error reading files:', err);
        res.status(500).send('Error reading files');
    }
});





// app.get('/files/open/:filename', async (req, res) => {
//   const { filename } = req.params;

//   try {
//     // Extract parameters from filename
//     const [dir, subdir, centername, timeframe] = filename.split('-');

//     console.log("time frame ", timeframe);

//     // Read directory contents
//     const files = await fs.promises.readdir(`${MainRepo}/${dir}/${subdir}`);


//     // Filter files by timeframe
//     const filteredFiles = files.filter(file => {
//       const creationDate = moment(file.slice(-12, -4), 'YYYYMMDD');
//       return filterByTimeframe(timeframe, creationDate);
//     });

//     console.log(" files ", filteredFiles);


//     console.log('files per date ', filteredFiles);

//     // Filter files by center name (if applicable)
//     const matchingFiles = filteredFiles.filter(file => file.startsWith(centername));

//     // Process matching files
//     const results = await Promise.all(matchingFiles.map(async (file) => {
//       const filePath = `${MainRepo}/${dir}/${subdir}/${file}`;
//       const data = await processFile(filePath);
//       return data;
//     }));

//     // Combine results
//     const genderCount = { female: 0, male: 0 };
//     const nationalities = {};
//     let maritalCount = {}; // Only populated for subdir === 'declaration'

//     for (const result of results) {
//       genderCount[result.sexe] = (genderCount[result.sexe] || 0) + 1;
//       nationalities[result.nationalite_pere || 'Unknown'] = (nationalities[result.nationalite_pere || 'Unknown'] || 0) + 1;

//       if (subdir === 'declaration') {
//         maritalCount[result.situation_matrimoniale_mere || 'Unknown'] = (maritalCount[result.situation_matrimoniale_mere || 'Unknown'] || 0) + 1;
//       }
//     }

//     // Send response
//     res.json({
//       genderCount,
//       nationalities,
//       maritalCount: subdir === 'declaration' ? maritalCount : {},
//       files: matchingFiles.length
//     });
//   } catch (err) {
//     console.error('Error reading files:', err);
//     res.status(500).send('Error reading files');
//   }
// });

// function filterByTimeframe(timeframe, creationDate) {
//   const currentDate = moment();
//   switch (timeframe) {
//     case 'lastWeek':
//       return creationDate.isAfter(currentDate.subtract(1, 'week'));
//     case 'today':
//       return creationDate.isSame(currentDate, 'day');
//     case 'yesterday':
//       return creationDate.isSame(currentDate.subtract(1, 'day'), 'day');
//     case 'thisMonth':
//       return creationDate.isSame(currentDate, 'month');
//     case 'lastMonth':
//       return creationDate.isSame(currentDate.subtract(1, 'month'), 'month')
//     case 'thisYear':
//       return creationDate.isSame(currentDate, 'year');
//     case 'lastYear':
//       return creationDate.isSame(currentDate.subtract(1, 'year'), 'year') &&
//              !creationDate.isSame(currentDate, 'year');
//     default:
//       return false;
//   }
// }

// async function processFile(filePath) {
//   return new Promise((resolve, reject) => {
//     fs.createReadStream(filePath)
//       .pipe(csv({ separator: '#' }))
//       .on('data', (data) => {
//         // Process data (gender, nationality, marital status)
//       })
//       .on('end', () => {
//         resolve(data); // Assuming data object is returned after processing
//       })
//       .on('error', reject);
//   });
// }




app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});



/**
 * select all files with first 5 letters === centername
 * 
 * store the files full name in an array
 * 
 * open each files and extract info (nationalite_pere, gender)
 * 
 * {
 *  date = filename.slice(-8)
 *  var malecount = 0
 *  var femalecount = 0
 *  data.map(file => {
 *    const fields = line.split('#');
 *    if(fields[3] === 'male'){
 *        malecount++
 *    }else if(fields[3] === 'female'){
 *        femalecount++
 *    }
 *  })
 *  male = fields[3]
 * 
 * 
 * }
 * 
 * 
 */
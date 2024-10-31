
const http = require('http')
const app = require('./app')

const Server = http.createServer(app)

const port = 5000

Server.listen(port, ()=> console.log(`server running on port ${port}`))


// const express = require('express');
// const fs = require('fs');
// const path = require('path');
// const bodyParser = require('body-parser')
// const cors = require('cors')
// const csv = require('csv-parser');
// const moment = require('moment')
// // const multer = require('multer')

// const app = express();
// const port = 5000; // Replace with your desired port
// const MainRepo = 'depotcec/digit'




// //middlewares
// app.use(bodyParser.urlencoded({extended : false}))
// app.use(bodyParser.json())


// //avoid cors errors
// app.use(cors())


// //fetching birth certificates
// app.get('/naissances/actes', (req, res) => {
//   const actesPath = `${MainRepo}/naissances/actes`; // Replace with the actual path
//   const declaPath = `${MainRepo}/naissances/declarations`;

//   fs.readdir(actesPath, (err, files) => {
//     if (err) {
//       console.error('Error reading directory:', err);
//       res.status(500).json({ error: 'Failed to get file names' });
//     } else {
//       const fileNames = files.map(file => file.replace(/\.txt$/, '')); // Remove '.txt' extension if applicable
//       res.json({ fileNames });
//     }
//   });
  
// });



// //fetching birth declaration
// app.get('/naissances/decla', (req, res) => {
//   const actesPath = `${MainRepo}/naissances/actes`; // Replace with the actual path
//   const declaPath = `${MainRepo}/naissances/declarations`;

//   fs.readdir(declaPath, (err, files) => {
//     if (err) {
//       console.error('Error reading directory:', err);
//       res.status(500).json({ error: 'Failed to get file names' });
//     } else {
//       const fileNames = files.map(file => file.replace(/\.txt$/, '')); // Remove '.txt' extension if applicable
//       res.json({ fileNames });
//     }
//   });
  
// });


// //download files (dir_subdir_filename)
// app.get('/download/:filename', (req, res)=>{
  
//   const filename = req.params.filename.split('-')[2]
//   const subdir = req.params.filename.split('-')[1]
//   const dir = req.params.filename.split('-')[0]


//   res.download(`${MainRepo}/${dir}/${subdir}/${filename}`,
//   (err)=>{
//     if(err){
//         console.log(err)
//     }else{
//       console.log('success')
//     }
//   })
// })



// //read .csv log sync file 
// app.get('/sync/logs', (req, res) => {
//   const filePath = 'sync/log.txt'; // Replace with the actual file path

//   fs.readFile(filePath, 'utf8', (err, data) => {
//     if (err) {
//       console.error('Error reading file:', err);
//       res.status(500).json({ error: 'Failed to read file' });
//     } else {
//       const records = data.split('\n').map(line => {
//         const fields = line.split('#');
//         return {
//           send: (fields[0]),
//           received: (fields[1]),
//           date: fields[2]
//         };
//       });

//       res.json({records});
//     }
//   });
// });




// app.get('/files/opened/:filename', async (req, res) => {
//     const centername = req.params.filename.split('-')[2];
//     const subdir = req.params.filename.split('-')[1];
//     const dir = req.params.filename.split('-')[0];

//     let matchingFiles = [];
//     let female = 0;
//     let male = 0;
//     let nationalityCount = {};
//     let maritalCount = {}

//     try {
//         const files = await fs.promises.readdir(`${MainRepo}/${dir}/${subdir}`);

//         matchingFiles = files.filter(file => file.startsWith(centername));

//         await Promise.all(matchingFiles.map(async (file) => {
//             const filePath = `${MainRepo}/${dir}/${subdir}/${file}`;
//             const data = await new Promise((resolve, reject) => {
//                 fs.createReadStream(filePath)
//                     .pipe(csv({ separator: '#' }))
//                     .on('data', (data) => {
//                         if (data.sexe === '2') {
//                             female++;
//                         } else if (data.sexe === '1') {
//                             male++;
//                         }

//                         const nationality = data.nationalite_pere || 'Unknown';
//                         nationalityCount[nationality] = (nationalityCount[nationality] || 0) + 1;


//                         if(subdir === 'declarations'){
//                           const marital = data.situation_matrimoniale_mere || 'Unknown';
//                           maritalCount[marital] = (maritalCount[marital] || 0) + 1;
//                         }
//                     })
//                     .on('end', () => {
//                         resolve();
//                     })
//                     .on('error', reject);
//             });

//             await data;
//         }));

//         res.json({
//             genderCount: {
//                 female,
//                 male
//             },
//             nationalities: nationalityCount,
//             maritalCount,
//             files: matchingFiles.length
//         });
//     } catch (err) {
//         console.error('Error reading files:', err);
//         res.status(500).send('Error reading files');
//     }
// });





// app.get('/files/open/:filename', async (req, res) => {
//   const { filename } = req.params;

//   try {
//     // Extract parameters from filename
//     const [dir, subdir, centername, timeframe] = filename.split('-');
//     // Combine results
//     let genderCount = { female: 0, male: 0 };
//     let nationalities = {};
//     let maritalCount = {}; // Only populated for subdir === 'declaration'


//     // Read directory contents
//     const files = await fs.promises.readdir(`${MainRepo}/${dir}/${subdir}`);


//     // Filter files by timeframe
//     const filteredFiles = files.filter(file => {
//       const creationDate = moment(file.slice(-12, -4), 'YYYYMMDD');
//       return filterByTimeframe(timeframe, creationDate);
//     });


//     // Filter files by center name (if applicable)
//     const matchingFiles = filteredFiles.filter(file => file.startsWith(centername));

//     // Process matching files
//     const results = await Promise.all(matchingFiles.map(async (file) => {
//       const filePath = `${MainRepo}/${dir}/${subdir}/${file}`;
//       const data = await processFile(filePath, nationalities, maritalCount, subdir, genderCount);
//       return data;
//     }));


//     // Send response
//     res.json({
//       genderCount,
//       nationalities,
//       maritalCount: subdir === 'declarations' ? maritalCount : {},
//       files: matchingFiles.length
//     });
//   } catch (err) {
//     console.error('Error reading files:', err);
//     res.status(500).send('Error reading files');
//   }
// });


// const weeklyGroup=(filePath)=>{
//   let monthcount = [0,0,0,0]

//   for(let i = 0; i<4; i++){
//     const filteredfiles = files.filter(file=>{
//       const creationDate = moment(file.slice(-12, -4), 'YYYYMMDD');
//       const currentDate = moment();
//       return creationDate.isAfter(currentDate.subtract(i+1, 'week'));
//     })

//     //count records in the filteredfiles
//     fs.createReadStream(filePath)
//     .pipe(csv({ separator: '#' }))
//     .on('data', (data) => {
//       monthcount[i] = monthcount[i]+1
//     })
//     .on('end', () => {
//         resolve();
//     })
//     .on('error', reject);
//   }

// }


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

// async function processFile(filePath, nationalities, maritalCount, subdir, genderCount) {
//   return await new Promise((resolve, reject) => {
//     fs.createReadStream(filePath)
//         .pipe(csv({ separator: '#' }))
//         .on('data', (data) => {
//             if (data.sexe === '2') {
//               genderCount.female = genderCount.female + 1;
//             } else if (data.sexe === '1') {
//               genderCount.male = genderCount.male + 1
//             }

//             const nationality = data.nationalite_pere || 'Unknown';
//             nationalities[nationality] = (nationalities[nationality] || 0) + 1;


//             if(subdir === 'declarations'){
//               const marital = data.situation_matrimoniale_mere || 'Unknown';
//               maritalCount[marital] = (maritalCount[marital] || 0) + 1;
//             }
//         })
//         .on('end', () => {
//             resolve();
//         })
//         .on('error', reject);
//   });

// }


// async function processedFile(filePath, dir, deceCount, mariageCount, naissanceCount, recordCount) {
//   return await new Promise((resolve, reject) => {

//     fs.createReadStream(filePath)
//         .pipe(csv({ separator: '#' }))
//         .on('data', (data) => {

//           if(dir === 'naissances'){
//             if (data.sexe === '2') {
//               naissanceCount.female = naissanceCount.female + 1;
//             } else if (data.sexe === '1') {
//               naissanceCount.male = naissanceCount.male + 1
//             }
//           }
          
//           if(dir === 'mariages'){
//             if (data.type === '2') {
//               mariageCount.polygamy = mariageCount.polygamy + 1;
//             } else if (data.type === '1') {
//               mariageCount.monogamy = mariageCount.monogamy + 1
//             }
//           }

//           if(dir === 'deces'){
//             deceCount.total = deceCount.total + 1
//           }
//         })
//         .on('end', () => {
//             resolve();
//         })
//         .on('error', reject);
//   });

// }





// app.get('/file/stats/:id', async(req, res)=>{
//   const {id} = req.params

//   try {

//     const [subdir, centername, period] = id.split('-');
//     const dir = ['naissances', 'deces']

//     let naissanceCount = {male: 0, female: 0}
//     let mariageCount = {monogamy: 0, polygamy: 0}
//     let deceCount = {total: 0}
//     let recordCount = []
  
//     const results = await Promise.all(
//       dir.map(async(directory) =>{
//         // Read directory contents
//         const files = await fs.promises.readdir(`${MainRepo}/${directory}/${subdir}`);


//         // Filter files by timeframe
//         const filteredFiles = files.filter(file => {
//           let formatedFile = reformatFilename(file)
//           const creationDate = moment(formatedFile.slice(-12, -4), 'YYYYMMDD');
//           return filterByTimeframe(period, creationDate);
//         });
  
//         // Filter files by center name (if applicable)
//         const matchingFiles = filteredFiles.filter(file => file.startsWith(centername));
  

//         // Process matching files
//         const results = await Promise.all(matchingFiles.map(async (file, i) => {
//           console.log('dir ----', directory)

//           const filePath = `${MainRepo}/${directory}/${subdir}/${file}`;
//           const data = await processedFile(filePath, directory, deceCount, mariageCount, naissanceCount, recordCount);
//           return data;
//         }));

  
//       })
//     )
    
  
//    // Send response
//    res.json({
//     naissanceCount,
//     mariageCount,
//     deceCount
//   });
// } catch (err) {
//   console.error('Error reading files:', err);
//   res.status(500).send('Error reading files');
// }
// })


// //count monthly records and group per week
// app.get('/file/count/:id', async(req, res)=>{

//   const {id} = req.params
//   const [subdir, centername, period] = id.split('-');

//   try {

//     var path = `${MainRepo}/naissances/${subdir}`
//     // Read directory contents
//     const files = await fs.promises.readdir(path);    
//     const weekCount = await monthgroup(files, path)

//     res.json({weekCount})
//   } catch (error) {
//     console.log('error ', error)
//   }


// })



// app.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });











// const weekgroup = async (files, directoryPath) => {
//   const monthCount = [0, 0, 0, 0]; // Array to store record counts for each week

//   try {
//     for (let i = 0; i < 4; i++) {
//       console.log("i ", i)
//       const filteredFiles = files.filter(file => {
//         const creationDate = moment(file.slice(-12, -4), 'YYYYMMDD'); // Extract creation date (YYYYMM format)
//         return creationDate.isAfter(moment().subtract(i + 1, 'week')); // Filter for files within the week
//       });

//       let count = 0;
//       const recordCounts = await Promise.all(filteredFiles.map(async (file) => {
//         const filePath = `${directoryPath}/${file}`;
//         console.log("file path ", filePath)

//         try {
          
//           const readStream = fs.createReadStream(filePath);
//           const csvParser = csv({ separator: '#' }); // Create CSV parser

//           readStream.pipe(csvParser)
//             .on('data', () => { 
//               count++; 
              
//             })
//             .on('end', () => {
//               console.log(`Week ${i + 1} count: ${count}`); // Log count for each week
//             })
//             .on('error', (error) => {
//               console.error(`Error reading file ${file}:`, error);
//             });

//           await new Promise((resolve, reject) => {
//             readStream.on('close', () => resolve());
//             readStream.on('error', reject);
//           });

          
//           return count;
//         } catch (error) {
//           console.error(`Error processing file ${file}:`, error);
//           return 0; // Handle errors gracefully, return 0 for the week's count
//         }
//       }));

//       monthCount[i] = count; // Sum weekly record counts
//       console.log("monthCount : ",monthCount)
//     }

//     return monthCount;
//   } catch (error) {
//     console.error('Error processing files:', error);
//     return monthCount; // Return the monthCount array even if errors occur, potentially with 0s
//   }
// };



// function extractDate(filename) {
//   // Try to match the date in the format YYYY-MM-DD
//   const match1 = filename.match(/(\d{4}-\d{2}-\d{2})/);
//   if (match1) {
//     return match1[1].replace(/-/g, '');
//   }

//   // Try to match the date in the format YYYYMMDD
//   const match2 = filename.match(/(\d{4})(\d{2})(\d{2})/);
//   if (match2) {
//     return `${match2[1]}${match2[2]}${match2[3]}`;
//   }

//   return null; // If no match is found, return null
// }

// function reformatFilename(filename) {
//   const extractedDate = extractDate(filename);
//   if (extractedDate) {
//     return filename.replace(/(\d{4}-\d{2}-\d{2})|\d{8}/, extractedDate);
//   }
//   return filename; // If no date is found, return the original filename
// }


// const monthgroup = async (files, directoryPath) => {
//   const yearCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Array to store record counts for each week

//   try {
//     for (let i = 0; i < 12; i++) {
//       console.log("i ", i)
//       const filteredFiles = files.filter(file => {
//         const creationDate = moment(file.slice(-12, -4), 'YYYYMMDD'); // Extract creation date (YYYYMM format)
//         return creationDate.isAfter(moment().subtract(i + 1, 'month')); // Filter for files within the week
//       });

//       console.log('files ', filteredFiles)
//       let count = 0;
//       const recordCounts = await Promise.all(filteredFiles.map(async (file) => {
//         const filePath = `${directoryPath}/${file}`;
//         console.log("file path ", filePath)

//         try {
          
//           const readStream = fs.createReadStream(filePath);
//           const csvParser = csv({ separator: '#' }); // Create CSV parser

//           readStream.pipe(csvParser)
//             .on('data', () => { 
//               count++; 
              
//             })
//             .on('end', () => {
//               console.log(`Week ${i + 1} count: ${count}`); // Log count for each week
//             })
//             .on('error', (error) => {
//               console.error(`Error reading file ${file}:`, error);
//             });

//           await new Promise((resolve, reject) => {
//             readStream.on('close', () => resolve());
//             readStream.on('error', reject);
//           });

          
//           return count;
//         } catch (error) {
//           console.error(`Error processing file ${file}:`, error);
//           return 0; // Handle errors gracefully, return 0 for the week's count
//         }
//       }));

//       yearCount[i] = count; // Sum weekly record counts
//       console.log("yearCount : ",yearCount)
//     }

//     return yearCount;
//   } catch (error) {
//     console.error('Error processing files:', error);
//     return yearCount; // Return the yearCount array even if errors occur, potentially with 0s
//   }
// };
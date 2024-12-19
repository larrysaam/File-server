const express = require('express')
const router = express.Router()
const fs = require('fs');
const csv = require('csv-parser');
const moment = require('moment')
const help = require('../control/help')
require('dotenv').config()



//fetching file names for (actes & declaration)
router.get('/all/:id', async (req, res) => {
  const [dir, period] = req.params.id.split('-')


  try{
  
  const subdirs = (dir === 'mariages')? ['actes', 'publications'] :['actes', 'declarations']
  const allFiles = { actes:[], declarations:[]}

  const results = await Promise.all(
    subdirs.map(async(subdir)=>{
      let codes = await fs.promises.readdir(process.env.SOURCE_FOLDER);
      codes = codes.filter(item => item !== 'digit');

      await Promise.all(
        codes.map(async(code)=>{

          try {
            const files = await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${dir}/${subdir}`)
  

            // Filter files by timeframe
            const filteredFiles = files.filter((file) => {

              let formattedFile = help.reformatFilename(file);
              const creationDate = moment(formattedFile.slice(-12, -4), 'YYYYMMDD');

              var valid = help.isNumeric(period)
              if(valid === false){
                return help.filterByTimeframe(period, creationDate);
              }else{
                var formatedDate = formattedFile.slice(-12, -4)
                return (formatedDate === period)? true : false
                
              }
              
            });
    
            //here publications and declarations counts as thesame variable
            if(subdir === 'actes'){
              allFiles.actes.push(...filteredFiles)
            }
            else if(subdir === 'declarations' || subdir === 'publications'){
              allFiles.declarations.push(...filteredFiles)
            }
            
          } catch (error) {
            console.log(error)
          }
        })
      )
    })
  )

  res.json([allFiles])
 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get file names' });
  }
});



//download .csv files from their directory
router.get('/download/:filename', (req, res)=>{
  
    const filename = req.params.filename.split('-')[2]
    const subdir = req.params.filename.split('-')[1]
    const dir = req.params.filename.split('-')[0]

    const code = filename.split('_')[0]
  

    res.download(`${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${dir}/${subdir}/${filename}`,
    (err)=>{
      if(err){
          console.log(err)
      }else{
        console.log('success')
      }
    })
})



//count the number of rows of data per month for a given year
//id = directory-subdir-centername-period
router.get('/year/rows/count/all/:id', async(req, res)=>{
  const [subdir, period] = req.params.id.split('-');

  

  try {
    const dir = ['naissances', 'deces', 'mariages'];
    let naissance = []
    let deces = []
    let mariages = []
   

    const results = await Promise.all(
      dir.map(async (directory) => {
  
        let M1= []
        let M2 = [] ,M3= [], M4= [],M5= [],M6= [], M7= [],M8= [],M9= [], M10= [],M11= [], M12 = [];
        let M1T = 0, M2T = 0, M3T = 0, M4T = 0, M5T = 0, M6T = 0, M7T = 0, M8T = 0, M9T = 0, M10T = 0, M11T = 0, M12T = 0;

        let codes = await fs.promises.readdir(process.env.SOURCE_FOLDER);
        codes = codes.filter(item => item !== 'digit');

        await Promise.all(
          codes.map(async(code)=>{
            // Read directory contents 
            /***
              * if directory === 'mariages' and sudir === 'declarations', 
              * change subdir to "Publication" which is a subdir of mariage folder.
            **/
            const files = (directory === 'mariages' && subdir === 'declarations')?
            await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${directory}/publications`):
            await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}`)


            // Filter files by timeframe
            const filteredMonthFiles = files.filter((file) => {
              let formattedFile = help.reformatFilename(file);
              const creationDate = moment(formattedFile.slice(-12, -4), 'YYYYMMDD');
              return help.filterByTimeframe(period, creationDate);
            });

            
            // Filter files by center name (if applicable)
            const matchingFiles = filteredMonthFiles.filter((file) => file.startsWith(code));


            console.log("yearly all - matchingFiles ", matchingFiles)

            // Filter and group files
            matchingFiles.forEach((file) => {
              let formattedFile = help.reformatFilename(file);
              let weekNumber = help.getMonthNumber(formattedFile);
              if (weekNumber === "01") {
                M1.push(file);
              } else if (weekNumber === "02") {
                M2.push(file);
              } else if (weekNumber === "03") {
                M3.push(file);
              } else if (weekNumber === "04") {
                M4.push(file);
              }else if (weekNumber === "05") {
                M5.push(file);
              } else if (weekNumber === "06") {
                M6.push(file);
              } else if (weekNumber === "07") {
                M7.push(file);
              }else if (weekNumber === "08") {
                M8.push(file);
              } else if (weekNumber === "09") {
                M9.push(file);
              } else if (weekNumber === "10") {
                M10.push(file);
              }else if (weekNumber === "11") {
                M11.push(file);
              } else if (weekNumber === "12") {
                M12.push(file);
              }
            });


            // Count rows in each CSV file
            const countRows = async(files) => {

              let totalRows = 0;

              await Promise.all(files.map(async (file) => {
                console.log('file ', file)
                 /***
                  * if directory === 'mariages' and sudir === 'declarations', 
                  * change subdir to "Publication" which is a subdir of mariage folder.
                **/
                const filePath = (directory === 'mariages' && subdir === 'declarations')?
                `${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${directory}/publications/${file}`:
                `${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}/${file}`
                console.log('filePath ', filePath)
        
                try {
                    const readStream = fs.createReadStream(filePath);
                    const csvParser = csv({ separator: '#' }); // Create CSV parser

                    readStream.pipe(csvParser)
                      .on('data', () => {
                        totalRows++;
                      })
                      .on('end', () => {
                        
                      });
                  
        
                    await new Promise((resolve, reject) => {
                      readStream.on('close', () => resolve());
                      readStream.on('error', reject);
                    });
        
                    console.log('totalRows ', totalRows)
                  
                    
                } catch (error) {
                  console.error(`Error processing file ${file}:`, error);
                  return 0; // Handle errors gracefully, return 0 for the week's count
                }
              }));

              return totalRows;
            };

            console.log('Ms ', M8, M9, M10 )

            // Calculate the total number of rows for each week
            M1T = M1T + await countRows(M1);
            M2T = M2T + await countRows(M2);
            M3T = M3T + await countRows(M3);
            M4T = M4T + await countRows(M4);
            M5T = M5T + await countRows(M5);
            M6T = M6T + await countRows(M6);
            M7T = M7T + await countRows(M7);
            M8T = M8T + await countRows(M8);
            M9T = M9T + await countRows(M9);
            M10T = M10T + await countRows(M10);
            M11T = M11T + await countRows(M11);
            M12T = M12T + await countRows(M12);
    
           
          })

          //
        )


        if(directory === 'naissances'){
          naissance = [ M1T, M2T, M3T, M4T, M5T, M6T, M7T, M8T, M9T, M10T, M11T, M12T]
          console.log('naissance ', naissance)
        }else if(directory === 'deces'){
          deces = [ M1T, M2T, M3T, M4T, M5T, M6T, M7T, M8T, M9T, M10T, M11T, M12T]
          console.log('deces ', deces)
        }else if(directory === 'mariages'){
          mariages = [ M1T, M2T, M3T, M4T, M5T, M6T, M7T, M8T, M9T, M10T, M11T, M12T]
          console.log('mariages ', mariages)
        }
      })
    );

    // Send response
    res.json({
      naissance,
      deces,
      mariages
    }
    );
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).send('Error reading files');
  }
})


//count the number of rows of data per month for a given year
//id = directory-subdir-centername-period
router.get('/year/rows/count/:id', async(req, res)=>{
  const [subdir, centername, period] = req.params.id.split('-');

  try {

    const dir = ['naissances', 'deces', 'mariages'];
    let naissance = []
    let deces = []
    let mariages = []

    const results = await Promise.all(
      dir.map(async (directory) => {

        // console.log("----year---- ", directory, " __ ", centername, " __ ", period )

        let M1= []
        let M2 = [] ,M3= [], M4= [],M5= [],M6= [], M7= [],M8= [],M9= [], M10= [],M11= [], M12 = [];
        let M1T = 0, M2T = 0, M3T = 0, M4T = 0, M5T = 0, M6T = 0, M7T = 0, M8T = 0, M9T = 0, M10T = 0, M11T = 0, M12T = 0;
    
        // Read directory contents 
         /***
          * if directory === 'mariages' and sudir === 'declarations', 
          * change subdir to "Publication" which is a subdir of mariage folder.
          **/
        const files = (directory === 'mariages' && subdir === 'declarations')?
          await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/publications`):
          await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}`)

        // Filter files by timeframe
        const filteredMonthFiles = files.filter((file) => {
          let formattedFile = help.reformatFilename(file);
          const creationDate = moment(formattedFile.slice(-12, -4), 'YYYYMMDD');
          return help.filterByTimeframe(period, creationDate);
        });

        // Filter files by center name (if applicable)
        const matchingFiles = filteredMonthFiles.filter((file) => file.startsWith(centername));


        // console.log("yearly - matchingfiles ", matchingFiles)

        // Filter and group files
        matchingFiles.forEach((file) => {
          let formattedFile = help.reformatFilename(file);
          let weekNumber = help.getMonthNumber(formattedFile);
          if (weekNumber === "01") {
            M1.push(file);
          } else if (weekNumber === "02") {
            M2.push(file);
          } else if (weekNumber === "03") {
            M3.push(file);
          } else if (weekNumber === "04") {
            M4.push(file);
          }else if (weekNumber === "05") {
            M5.push(file);
          } else if (weekNumber === "06") {
            M6.push(file);
          } else if (weekNumber === "07") {
            M7.push(file);
          }else if (weekNumber === "08") {
            M8.push(file);
          } else if (weekNumber === "09") {
            M9.push(file);
          } else if (weekNumber === "10") {
            M10.push(file);
          }else if (weekNumber === "11") {
            M11.push(file);
          } else if (weekNumber === "12") {
            M12.push(file);
          }
        });

        
        // Count rows in each CSV file
        const countRows = async(files) => {

          let totalRows = 0;

          await Promise.all(files.map(async (file) => {
            console.log('file ', file)
            /***
            * if directory === 'mariages' and sudir === 'declarations', 
            * change subdir to "Publication" which is a subdir of mariage folder.
            **/
            const filePath = (directory === 'mariages' && subdir === 'declarations')?
            `${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/publications/${file}`:
            `${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}/${file}`
            console.log('filePath ', filePath)
    
            try {
                const readStream = fs.createReadStream(filePath);
                const csvParser = csv({ separator: '#' }); // Create CSV parser

                readStream.pipe(csvParser)
                  .on('data', () => {
                    totalRows++;
                  })
                  .on('end', () => {
                    
                  });
              
    
                await new Promise((resolve, reject) => {
                  readStream.on('close', () => resolve());
                  readStream.on('error', reject);
                });
    
                
                // console.log("----year---- ", directory, " __ ", centername, " __ ", period )
                // console.log('totalRow ', totalRows)
              
                
            } catch (error) {
              console.error(`Error processing file ${file}:`, error);
              return 0; // Handle errors gracefully, return 0 for the week's count
            }
          }));

          return totalRows;
        };

        console.log('Ms ', M8, M9, M10 )

        // Calculate the total number of rows for each week
        M1T = await countRows(M1);
        M2T = await countRows(M2);
        M3T = await countRows(M3);
        M4T = await countRows(M4);
        M5T = await countRows(M5);
        M6T = await countRows(M6);
        M7T = await countRows(M7);
        M8T = await countRows(M8);
        M9T = await countRows(M9);
        M10T = await countRows(M10);
        M11T = await countRows(M11);
        M12T = await countRows(M12);

        if(directory === 'naissances'){
          naissance = [ M1T, M2T, M3T, M4T, M5T, M6T, M7T, M8T, M9T, M10T, M11T, M12T]
          console.log('naissance ', naissance)
        }else if(directory === 'deces'){
          deces = [ M1T, M2T, M3T, M4T, M5T, M6T, M7T, M8T, M9T, M10T, M11T, M12T]
          console.log('deces ', deces)
        }else if(directory === 'mariages'){
          mariages = [ M1T, M2T, M3T, M4T, M5T, M6T, M7T, M8T, M9T, M10T, M11T, M12T]
          console.log('mariages ', mariages)
        }


      })
    );

    // Send response
    res.json({
      naissance,
      deces,
      mariages
    }
    );
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).send('Error reading files');
  }
})


//weekly count for all centers
router.get('/week/rows/count/all/:id', async(req, res)=>{
  const [subdir, period] = req.params.id.split('-');

  try {
    const dir = ['naissances', 'deces', 'mariages'];
    let naissance = []
    let deces = []
    let mariages = []
   

    const results = await Promise.all(
      dir.map(async (directory) => {

        
        let W1 = [];
        let W2 = [];
        let W3 = [];
        let W4 = [];
        let W1Total = 0;
        let W2Total = 0;
        let W3Total = 0;
        let W4Total = 0;

        //read centre codes
        let codes = await fs.promises.readdir(process.env.SOURCE_FOLDER);
        codes = codes.filter(item => item !== 'digit');

        await Promise.all(
          codes.map(async(code)=>{
              // Read directory contents
               /***
                * if directory === 'mariages' and sudir === 'declarations', 
                * change subdir to "Publication" which is a subdir of mariage folder.
              **/
              const files = (directory === 'mariages' && subdir === 'declarations')?
                await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${directory}/publications`):
                await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}`)

              // Filter files by timeframe
              const filteredMonthFiles = files.filter((file) => {
                let formattedFile = help.reformatFilename(file);
                const creationDate = moment(formattedFile.slice(-12, -4), 'YYYYMMDD');
                return help.filterByTimeframe(period, creationDate);
              });


              // Filter files by center name (if applicable)
              const matchingFiles = filteredMonthFiles.filter((file) => file.startsWith(code));


              // Filter and group files
              matchingFiles.forEach((file) => {
                const weekNumber = help.getWeekNumber(file);
                if (weekNumber === 1) {
                  W1.push(file);
                } else if (weekNumber === 2) {
                  W2.push(file);
                } else if (weekNumber === 3) {
                  W3.push(file);
                } else if (weekNumber === 4) {
                  W4.push(file);
                }
              });

              
              // Count rows in each CSV file
              const countRows = async(files) => {

                let totalRows = 0;

                await Promise.all(files.map(async (file) => {
                  console.log('file ', file)
                  /***
                    * if directory === 'mariages' and sudir === 'declarations', 
                    * change subdir to "Publication" which is a subdir of mariage folder.
                  **/
                  const filePath = (directory === 'mariages' && subdir === 'declarations')?
                  `${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${directory}/publications/${file}`:
                  `${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}/${file}`
                  console.log('filePath ', filePath)
          
                  try {
                      const readStream = fs.createReadStream(filePath);
                      const csvParser = csv({ separator: '#' }); // Create CSV parser

                      readStream.pipe(csvParser)
                        .on('data', () => {
                          totalRows++;
                        })
                        .on('end', () => {
                          
                        });
                    
          
                      await new Promise((resolve, reject) => {
                        readStream.on('close', () => resolve());
                        readStream.on('error', reject);
                      });
          
                      console.log('totalRows ', totalRows)
                      
                  } catch (error) {
                    console.error(`Error processing file ${file}:`, error);
                    return 0; // Handle errors gracefully, return 0 for the week's count
                  }
                }));

                return totalRows;
              };

              console.log('Ws ', W1, W2, W3, W4 )

              // Calculate the total number of rows for each week
              W1Total = W1Total + await countRows(W1);
              W2Total = W2Total + await countRows(W2);
              W3Total = W3Total + await countRows(W3);
              W4Total = W4Total + await countRows(W4);

          })
        )
        
        if(directory === 'naissances'){
          naissance = [W1Total, W2Total, W3Total, W4Total]
          console.log('naissance ', naissance)
        }else if(directory === 'deces'){
          deces = [W1Total, W2Total, W3Total, W4Total]
          console.log('deces ', deces)
        }else if(directory === 'mariage'){
          mariages = [W1Total, W2Total, W3Total, W4Total]
          console.log('mariage ', mariage)

        }

      })
    );

    // Send response
    res.json({
      naissance,
      deces,
      mariages
    }
    );
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).send('Error reading files');
  }
})
  

//count the number of rows of data per week for a given month
//id = directory-subdir-centername-period
router.get('/rows/count/:id', async (req, res) => {
  const [subdir, centername, period] = req.params.id.split('-');

  try {
    const dir = ['naissances', 'deces', 'mariages'];
    let naissance = []
    let deces = []
    let mariages = []

    const results = await Promise.all(
      dir.map(async (directory) => {
 
        let W1 = [];
        let W2 = [];
        let W3 = [];
        let W4 = [];
        let W1Total = 0;
        let W2Total = 0;
        let W3Total = 0;
        let W4Total = 0;

        // Read directory contents
         /***
         * if directory === 'mariages' and sudir === 'declarations', 
         * change subdir to "Publication" which is a subdir of mariage folder.
        **/
        const files = (directory === 'mariages' && subdir === 'declarations')?
            await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/publications`):
            await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}`)

        // Filter files by timeframe
        const filteredMonthFiles = files.filter((file) => {
          let formattedFile = help.reformatFilename(file);
          const creationDate = moment(formattedFile.slice(-12, -4), 'YYYYMMDD');
          return help.filterByTimeframe(period, creationDate);
        });

        // Filter files by center name (if applicable)
        const matchingFiles = filteredMonthFiles.filter((file) => file.startsWith(centername));

        // Filter and group files
        matchingFiles.forEach((file) => {
          const weekNumber = help.getWeekNumber(file);
          if (weekNumber === 1) {
            W1.push(file);
          } else if (weekNumber === 2) {
            W2.push(file);
          } else if (weekNumber === 3) {
            W3.push(file);
          } else if (weekNumber === 4) {
            W4.push(file);
          }
        });


        // Count rows in each CSV file
        const countRows = async(files) => {

          let totalRows = 0;

          await Promise.all(files.map(async (file) => {
            console.log('file ', file)
            /***
             * if directory === 'mariages' and sudir === 'declarations', 
             * change subdir to "Publication" which is a subdir of mariage folder.
            **/
            const filePath = (directory === 'mariages' && subdir === 'declarations')?
            `${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/publications/${file}`:
            `${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}/${file}`
            console.log('filePath ', filePath)
    
            try {
                const readStream = fs.createReadStream(filePath);
                const csvParser = csv({ separator: '#' }); // Create CSV parser

                readStream.pipe(csvParser)
                  .on('data', () => {
                    totalRows++;
                  })
                  .on('end', () => {
                    
                  });
              
    
                await new Promise((resolve, reject) => {
                  readStream.on('close', () => resolve());
                  readStream.on('error', reject);
                });
    
                console.log('totalRows ', totalRows)
              
                
            } catch (error) {
              console.error(`Error processing file ${file}:`, error);
              return 0; // Handle errors gracefully, return 0 for the week's count
            }
          }));

          return totalRows;
        };

        console.log('Ws ', W1, W2, W3, W4 )

        // Calculate the total number of rows for each week
        W1Total = await countRows(W1);
        W2Total = await countRows(W2);
        W3Total = await countRows(W3);
        W4Total = await countRows(W4);

        if(directory === 'naissances'){
          naissance = [W1Total, W2Total, W3Total, W4Total]
          console.log('naissance ', naissance)
        }else if(directory === 'deces'){
          deces = [W1Total, W2Total, W3Total, W4Total]
          console.log('deces ', deces)
        }else if(directory === 'mariages'){
          mariages = [W1Total, W2Total, W3Total, W4Total]
          console.log('mariages ', mariages)
        }

      })
    );

    // Send response
    res.json({
      naissance,
      deces,
      mariages
    }
    );
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).send('Error reading files');
  }
});


//count the number of rows in each file for each day in a specific week
//id = directory-subdir-centername-period
router.get('/week/rows/count/:id', async (req, res) => {
  const [subdir, centername, period] = req.params.id.split('-');

  try {
    const dir = ['naissances', 'deces', 'mariages'];



    const results = await Promise.all(
      dir.map(async (directory) => {
        let naissance = []
        let deces = []
        let mariages = []

        
        // Read directory contents
        /***
         * if directory === 'mariages' and sudir === 'declarations', 
         * change subdir to "Publication" which is a subdir of mariage folder.
        **/
        const files = (directory === 'mariages' && subdir === 'declarations')?
            await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/publications`):
            await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}`)


        // Filter files by timeframe
        const filteredMonthFiles = files.filter((file) => {
          let formattedFile = help.reformatFilename(file);
          const creationDate = moment(formattedFile.slice(-12, -4), 'YYYYMMDD');
          return help.filterByTimeframe(period, creationDate);
        });

        // Filter files by center name (if applicable)
        const matchingFiles = filteredMonthFiles.filter((file) => file.startsWith(centername));


        //sort files in an ascending order of date
        function sortFilesByDay(files) {
          return files.sort((a, b) => {
            const dayA = parseInt(a.slice(-6,-4));
            const dayB = parseInt(b.slice(-6,-4));
            return dayA - dayB;
          });
        }

        const sortedFiles = sortFilesByDay(matchingFiles)
        
        
        // Count rows in each CSV file
        const countRows = async(file) => {

            let totalRows = 0;
          
            console.log('file ', file)
            /***
             * if directory === 'mariages' and sudir === 'declarations', 
             * change subdir to "Publication" which is a subdir of mariage folder.
            **/
            const filePath = (directory === 'mariages' && subdir === 'declarations')?
            `${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${directory}/publications/${file}`:
            `${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}/${file}`
            console.log('filePath ', filePath)
    
            try {
                const readStream = fs.createReadStream(filePath);
                const csvParser = csv({ separator: '#' }); // Create CSV parser

                readStream.pipe(csvParser)
                  .on('data', () => {
                    totalRows++;
                  })
                  .on('end', () => {
                    
                  });
              
    
                await new Promise((resolve, reject) => {
                  readStream.on('close', () => resolve());
                  readStream.on('error', reject);
                });
    
                console.log('totalRows ', totalRows)
              
                
            } catch (error) {
              console.error(`Error processing file ${file}:`, error);
              return 0; // Handle errors gracefully, return 0 for the week's count
            }

          return totalRows;
        };


        let dayCount = []
        for(let i=0; i<sortedFiles.length; i++){
          let count = await countRows(sortedFiles[i])
          dayCount.push(count)
        }

        console.log('dayCount ', dayCount)

       
        if(directory === 'naissances'){
          naissance = dayCount
          console.log('naissance ', naissance)
        }else if(directory === 'deces'){
          deces = dayCount
          console.log('deces ', deces)
        }else if(directory === 'mariages'){
          mariages = dayCount
          console.log('mariage ', mariages)
        }

      })
    );

    // Send response
    res.json({
      naissance,
      deces,
      mariage
    }
    );
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).send('Error reading files');
  }
});
 


//get stats from (naissance & deces) files
router.get('/stats/:id', async(req, res)=>{
    const {id} = req.params
  
    try {
  
      //split params to get subdir, centrename, period
      let [subdir, centername, period] = id.split('-');
      const dir = ['naissances', 'deces', 'mariages']
  
      let naissanceCount = {male: 0, female: 0, none: 0}
      let deceCount = {male: 0, female: 0, none: 0}
      let mariageCount = {total: 0}
      let recordCount = []

      
      const results = await Promise.all(
        dir.map(async(directory) =>{
          /***
           * Read directory contents
           * if directory === 'mariages' and sudir === 'declarations', 
           * change subdir to "Publication" which is a subdir of mariage folder.
          **/
          const files = (directory === 'mariages' && subdir === 'declarations')?
            await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/publications`):
            await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}`)
          
  
          // Filter files by timeframe using the date part of the file names
          const filteredFiles = files.filter(file => {

            let formattedFile = help.reformatFilename(file);
            const creationDate = moment(formattedFile.slice(-12, -4), 'YYYYMMDD');

            //verify if period is a 'time period' || a 'date formate'
            var valid = help.isNumeric(period)
            if(valid === false){
              return help.filterByTimeframe(period, creationDate);
            }else{
              var formatedDate = formattedFile.slice(-12, -4)
              return (formatedDate === period)? true : false
            }

          });
    
          // Filter files by center name (if applicable)
          const matchingFiles = filteredFiles.filter(file => file.startsWith(centername));
    
    
          // Process matching files
          const results = await Promise.all(matchingFiles.map(async (file, i) => {            
            /***
             * if directory === 'mariages' and sudir === 'declarations', 
             * change subdir to "Publication" which is a subdir of mariage folder.
            **/
            const filePath = (directory === 'mariages' && subdir === 'declarations')?
            `${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/publications/${file}`:
            `${process.env.SOURCE_FOLDER}/${centername}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}/${file}`

            return await help.processedFile(filePath, directory, subdir, deceCount, mariageCount, naissanceCount, recordCount);

          }));
        })
      )
      
      console.log('Stats_____ ', 
        naissanceCount,
        mariageCount,
        deceCount
    )
    
        // Send response
        res.json({
            naissanceCount,
            mariageCount,
            deceCount
        });
    } catch (err) {
        console.error('Error reading files:', err);
        res.status(500).send('Error reading files');
    }
})



//get count of all files in a dir in a paticular period of time
router.get('/stats/all/:id', async(req, res)=>{
  const {id} = req.params
  
    try {
  
      //split params to get subdir, centrename, period
      const [subdir, period] = id.split('-');
      const dir = ['naissances', 'deces']
  
      let naissanceCount = {male: 0, female: 0}
      let mariageCount = {monogamy: 0, polygamy: 0}
      let deceCount = {total: 0}
      let recordCount = []
    
      const results = await Promise.all(
        dir.map(async(directory) =>{

          const codes = await fs.promises.readdir(`${process.env.SOURCE_FOLDER}`);
          console.log('codes all ', codes)

          await Promise.all(
            codes.map(async(code)=>{
              // Read directory contents
              const files = await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}`);
              console.log('stats - files all ', files)


              // Filter files by timeframe
              const filteredFiles = files.filter(file => {
                let formattedFile = help.reformatFilename(file);
                const creationDate = moment(formattedFile.slice(-12, -4), 'YYYYMMDD');
    
                var valid = help.isNumeric(period)
                console.log('________valid_________', valid)
                if(valid === false){
                  return help.filterByTimeframe(period, creationDate);
                }else{
                  var formatedDate = formattedFile.slice(-12, -4)
                  return (formatedDate === period)? true : false
                  
                }
              });


              // Filter files by center name (if applicable)
              const matchingFiles = filteredFiles.filter(file => file.startsWith(code));      
              
              
              // Process matching files
              const results = await Promise.all(matchingFiles.map(async (file, i) => {
                console.log('dir ----', directory)
                const filePath = `${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${directory}/${subdir}/${file}`
                const data = await help.processedFile(filePath, directory, subdir, deceCount, mariageCount, naissanceCount, recordCount);
                return data;
              }));
            })
            )          
  
        })
      )
      
    
      console.log("naissanceCount ", naissanceCount)
        // Send response
        res.json({
            naissanceCount,
            mariageCount,
            deceCount
        });
    } catch (err) {
        console.error('Error reading files:', err);
        res.status(500).send('Error reading files');
    }
})


router.get('/folders/all', async(req, res)=>{
  const mainFolder = process.env.SOURCE_FOLDER; // Replace with your actual path

  try {
    const subfolders = await fs.promises.readdir(mainFolder);
    res.json({subfolders});
  } catch (err) {
    console.error('Error reading directory:', err);
    res.status(500).send('Error reading directory');
  }
})


//get performance data from .csv
router.get('/performance/:period', async(req, res)=>{
  const period = req.params.period

  console.log(period)
  let data = [];


  try {
    let filePath;
    switch (period) {
      case 'thisYear':
        filePath = '../File_server/performance_year.csv';
        break;
      case 'thisMonth':
        filePath = '../File_server/performance_month.csv';
        break;
      case 'thisWeek':
        filePath = '../File_server/performance_week.csv';
        break;
      default:
        throw new Error('Invalid period');
    }


    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
      .pipe(csv({ separator: '#' }))
      .on('data', (row) => {
          data.push(row)
      })
      .on('end', () => {
        resolve();
    })
    .on('error', reject);
    })

    data.sort((a, b) => {
      const sumA = parseInt(a.actes) + parseInt(a.decla);
      const sumB = parseInt(b.actes) + parseInt(b.decla);
      return sumB - sumA;
    })
    data = data.slice(0,10)

    
    res.status(200).json(data)

  } catch (error) {
    console.log(error)
    res.status(500).json({error})
  }


})


router.get('/warning', async(req, res)=>{
  try {
    const warningData = await help.getWarning()

    console.log('warningData ---> ', warningData)
    res.status(200).json(warningData)

  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
})

module.exports = router
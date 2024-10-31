const fs = require('fs');
const csv = require('csv-parser');
const moment = require('moment')



const extractDate =(filename)=> {
    // Try to match the date in the format YYYY-MM-DD
    const match1 = filename.match(/(\d{4}-\d{2}-\d{2})/);
    if (match1) {
      return match1[1].replace(/-/g, '');
    }
  
    // Try to match the date in the format YYYYMMDD
    const match2 = filename.match(/(\d{4})(\d{2})(\d{2})/);
    if (match2) {
      return `${match2[1]}${match2[2]}${match2[3]}`;
    }
  
    return null; // If no match is found, return null
}


//reformating filename by reformulating the date part
exports.reformatFilename = (filename)=> {
    const extractedDate = extractDate(filename);
    if (extractedDate) {
    return filename.replace(/(\d{4}-\d{2}-\d{2})|\d{8}/, extractedDate);
    }
    return filename; // If no date is found, return the original filename
}
  
// Function to extract the week number from the filename
exports.getWeekNumber =(filename)=>{
  const dateString = filename.slice(-6, -4); // Extract the date part

  console.log('dateString ', dateString)
  const quotient = Math.floor((dateString/7));

  if(quotient === 0){
    quotient++
  }else

  console.log('week ', quotient)

  return quotient
}

//function to extract the month number from the filname
exports.getMonthNumber = (filename)=>{
  const dateString = filename.slice(-8,-6)
  let date = dateString.toString()
 
  return date
}


  
exports.monthgroup = async (files, directoryPath) => {
    const yearCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Array to store record counts for each week
  
    try {
      for (let i = 0; i < 12; i++) {
        console.log("i ", i)
        const filteredFiles = files.filter(file => {
          const creationDate = moment(file.slice(-12, -4), 'YYYYMMDD'); // Extract creation date (YYYYMM format)
          return creationDate.isAfter(moment().subtract(i + 1, 'month')); // Filter for files within the week
        });
  
        console.log('files ', filteredFiles)
        let count = 0;
        const recordCounts = await Promise.all(filteredFiles.map(async (file) => {
          const filePath = `${directoryPath}/${file}`;
          console.log("file path ", filePath)
  
          try {
            
            const readStream = fs.createReadStream(filePath);
            const csvParser = csv({ separator: '#' }); // Create CSV parser
  
            readStream.pipe(csvParser)
              .on('data', () => { 
                count++; 
                
              })
              .on('end', () => {
                console.log(`Week ${i + 1} count: ${count}`); // Log count for each week
              })
              .on('error', (error) => {
                console.error(`Error reading file ${file}:`, error);
              });
  
            await new Promise((resolve, reject) => {
              readStream.on('close', () => resolve());
              readStream.on('error', reject);
            });
  
            
            return count;
          } catch (error) {
            console.error(`Error processing file ${file}:`, error);
            return 0; // Handle errors gracefully, return 0 for the week's count
          }
        }));
  
        yearCount[i] = count; // Sum weekly record counts
        console.log("yearCount : ",yearCount)
      }
  
      return yearCount;
    } catch (error) {
      console.error('Error processing files:', error);
      return yearCount; // Return the yearCount array even if errors occur, potentially with 0s
    }
};


//count the number of rows in files for a specific month
exports.weekgroup = async (files, directoryPath) => {
    const monthCount = [0, 0, 0, 0]; // Array to store record counts for each week
  
    try {
      for (let i = 0; i < 4; i++) {
        console.log("i ", i)
        const filteredFiles = files.filter(file => {
          const creationDate = moment(file.slice(-12, -4), 'YYYYMMDD'); // Extract creation date (YYYYMM format)
          return creationDate.isAfter(moment().subtract(i + 1, 'week')); // Filter for files within the week
        });
  
        let count = 0;
        const recordCounts = await Promise.all(filteredFiles.map(async (file) => {
          const filePath = `${directoryPath}/${file}`;
          console.log("file path ", filePath)
  
          try {
            
            const readStream = fs.createReadStream(filePath);
            const csvParser = csv({ separator: '#' }); // Create CSV parser
  
            readStream.pipe(csvParser)
              .on('data', () => { 
                count++; 
                
              })
              .on('end', () => {
                console.log(`Week ${i + 1} count: ${count}`); // Log count for each week
              })
              .on('error', (error) => {
                console.error(`Error reading file ${file}:`, error);
              });
  
            await new Promise((resolve, reject) => {
              readStream.on('close', () => resolve());
              readStream.on('error', reject);
            });
  
            
            return count;
          } catch (error) {
            console.error(`Error processing file ${file}:`, error);
            return 0; // Handle errors gracefully, return 0 for the week's count
          }
        }));
  
        monthCount[i] = count; // Sum weekly record counts
        console.log("monthCount : ",monthCount)
      }
  
      return monthCount;
    } catch (error) {
      console.error('Error processing files:', error);
      return monthCount; // Return the monthCount array even if errors occur, potentially with 0s
    }
};

  
////process .csv files to get statistics
exports.processFile = async(filePath, nationalities, maritalCount, subdir, genderCount)=> {
    return await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
          .pipe(csv({ separator: '#' }))
          .on('data', (data) => {
              if (data.sexe === '2') {
                genderCount.female = genderCount.female + 1;
              } else if (data.sexe === '1') {
                genderCount.male = genderCount.male + 1
              }
  
              const nationality = data.nationalite_pere || 'Unknown';
              nationalities[nationality] = (nationalities[nationality] || 0) + 1;
  
  
              if(subdir === 'declarations'){
                const marital = data.situation_matrimoniale_mere || 'Unknown';
                maritalCount[marital] = (maritalCount[marital] || 0) + 1;
              }
          })
          .on('end', () => {
              resolve();
          })
          .on('error', reject);
    });
  
  }
  
  
//process .csv files to get statistics
exports.processedFile = async(filePath, dir, deceCount, mariageCount, naissanceCount, recordCount)=> {
    return await new Promise((resolve, reject) => {
  
      fs.createReadStream(filePath)
          .pipe(csv({ separator: '#' }))
          .on('data', (data) => {
  
            if(dir === 'naissances'){
              if (data.sexe === '2') {
                naissanceCount.female = naissanceCount.female + 1;
              } else if (data.sexe === '1') {
                naissanceCount.male = naissanceCount.male + 1
              }
            }
            
            if(dir === 'mariages'){
              if (data.type === '2') {
                mariageCount.polygamy = mariageCount.polygamy + 1;
              } else if (data.type === '1') {
                mariageCount.monogamy = mariageCount.monogamy + 1
              }
            }
  
            if(dir === 'deces'){
              deceCount.total = deceCount.total + 1
            }
          })
          .on('end', () => {
              resolve();
          })
          .on('error', reject);
    });
  
  }
  

//checks if a specified date is in a particular timeframe or period
exports.filterByTimeframe = (timeframe, creationDate)=> {
    const currentDate = moment();
    switch (timeframe) {
      case 'lastWeek':
        return creationDate.isAfter(currentDate.subtract(1, 'week'));
      case 'today':
        return creationDate.isSame(currentDate, 'day');
      case 'yesterday':
        return creationDate.isSame(currentDate.subtract(1, 'day'), 'day');
      case 'thisMonth':
        return creationDate.isSame(currentDate, 'month');
      case 'lastMonth':
        return creationDate.isSame(currentDate.subtract(1, 'month'), 'month')
      case 'thisYear':
        return creationDate.isSame(currentDate, 'year');
      case 'lastYear':
        return creationDate.isSame(currentDate.subtract(1, 'year'), 'year') &&
               !creationDate.isSame(currentDate, 'year');
      default:
        return false;
    }
  }
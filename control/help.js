const fs = require('fs');
const fss = require('fs/promises');
const csv = require('csv-parser');
const moment = require('moment')
require('dotenv').config()


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


//Formate date from 2024-11-14 to 20241114
exports.formateDate=(str)=>{
  console.log("split ", str)
  const [year, month, day] = str.split('-')
  return `${year}${month}${day}`
}


//test if a string is numeric or not
exports.isNumeric =(str)=> {
  return /^\d+$/.test(str);
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
  var quotient = Math.floor((dateString/7));

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

            //For actes, count only rows with 'state' = 9
            if(subdir === 'actes' && data.state === '9'){
              if (data.sexe === '2') {
                genderCount.female = genderCount.female + 1;
              } else if (data.sexe === '1') {
                genderCount.male = genderCount.male + 1
              }
            }else{
              if (data.sexe === '2') {
                genderCount.female = genderCount.female + 1;
              } else if (data.sexe === '1') {
                genderCount.male = genderCount.male + 1
              }
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
exports.processedFile = async(filePath, dir, subdir, deceCount, mariageCount, naissanceCount, recordCount)=> {
    return await new Promise((resolve, reject) => {
  
      fs.createReadStream(filePath)
          .pipe(csv({ separator: '#' }))
          .on('data', (data) => {
  
            if(dir === 'naissances' && subdir === 'actes'){
              if (data.sexe === '2') {
                naissanceCount.female = naissanceCount.female + 1;
              } else if (data.sexe === '1') {
                naissanceCount.male = naissanceCount.male + 1
              }else{
                naissanceCount.none = naissanceCount.none + 1
              }
            }else if(dir === 'naissances' && subdir === 'declarations'){
              if (data.sexe === '2') {
                naissanceCount.female = naissanceCount.female + 1;
              } else if (data.sexe === '1') {
                naissanceCount.male = naissanceCount.male + 1
              }else{
                naissanceCount.none = naissanceCount.none + 1
              }
            }
            
            if(dir === 'deces' && subdir === 'actes'){
              if (data.sexe === 'MASCULIN' || data.sexe_decede === 'MASCULIN') {
                deceCount.male = deceCount.male + 1;
              } else if ( data.sexe === 'FEMININ' || data.sexe_decede === 'FEMININ') {
                deceCount.female = deceCount.female + 1
              }else{
                deceCount.none = deceCount.none + 1
              }
            }else if(dir === 'deces' && subdir === 'declarations'){
              if (data.sexe === 'MASCULIN' || data.sexe_decede === 'MASCULIN') {
                deceCount.male = deceCount.male + 1;
              } else if ( data.sexe === 'FEMININ' || data.sexe_decede === 'FEMININ') {
                deceCount.female = deceCount.female + 1
              }else{
                deceCount.none = deceCount.none + 1
              }
            }
  
            if(dir === 'mariages' && subdir === 'actes'){
              mariageCount.total = mariageCount.total + 1
            }else if(dir === 'mariages' && subdir === 'declarations'){
              mariageCount.total = mariageCount.total + 1
            }
          })
          .on('end', () => {
              resolve();
          })
          .on('error', reject);
    });
  
  }
  

  const processedFile = async(filePath, dir, subdir, deceCount, mariageCount, naissanceCount, recordCount)=> {
    return await new Promise((resolve, reject) => {
  
      fs.createReadStream(filePath)
          .pipe(csv({ separator: '#' }))
          .on('data', (data) => {
  
            if(dir === 'naissances' && subdir === 'actes'){
              if (data.sexe === '2') {
                naissanceCount.female = naissanceCount.female + 1;
              } else if (data.sexe === '1') {
                naissanceCount.male = naissanceCount.male + 1
              }else{
                naissanceCount.none = naissanceCount.none + 1
              }
            }else if(dir === 'naissances' && subdir === 'declarations'){
              if (data.sexe === '2') {
                naissanceCount.female = naissanceCount.female + 1;
              } else if (data.sexe === '1') {
                naissanceCount.male = naissanceCount.male + 1
              }else{
                naissanceCount.none = naissanceCount.none + 1
              }
            }
            
            if(dir === 'deces' && subdir === 'actes'){
              if (data.sexe === 'MASCULIN' || data.sexe_decede === 'MASCULIN') {
                deceCount.male = deceCount.male + 1;
              } else if ( data.sexe === 'FEMININ' || data.sexe_decede === 'FEMININ') {
                deceCount.female = deceCount.female + 1
              }else{
                deceCount.none = deceCount.none + 1
              }
            }else if(dir === 'deces' && subdir === 'declarations'){
              if (data.sexe === 'MASCULIN' || data.sexe_decede === 'MASCULIN') {
                deceCount.male = deceCount.male + 1;
              } else if ( data.sexe === 'FEMININ' || data.sexe_decede === 'FEMININ') {
                deceCount.female = deceCount.female + 1
              }else{
                deceCount.none = deceCount.none + 1
              }
            }
  
            if(dir === 'mariages' && subdir === 'actes'){
              mariageCount.total = mariageCount.total + 1
            }else if(dir === 'mariages' && subdir === 'declarations'){
              mariageCount.total = mariageCount.total + 1
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


  const filterByTimeframe = (timeframe, creationDate)=> {
    const currentDate = moment();
    switch (timeframe) {
      case 'lastWeek':
        return creationDate.isAfter(currentDate.subtract(1, 'week'));
      case 'thisWeek':
        // Check if the creation date is within the current week, starting from Sunday
        const startOfWeek = currentDate.clone().startOf('week');
        const endOfWeek = currentDate.clone().endOf('week');
        return creationDate.isBetween(startOfWeek, endOfWeek, null, '[]');
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


  //function checks for all centers that have sent data files yesterday
  exports.dailyCheck = async () => {
    let updatedCenters = new Set(); // Use Set to store unique center codes
    const dirs = ['naissances', 'mariages', 'deces'];
  
    //formate date to 20241129
    const today = new Date();
    today.setDate(today.getDate() - 1);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Add leading zero if needed
    const day = String(today.getDate()).padStart(2, '0');  
    let currentDate = `${year}${month}${day}`
  
    // Get all civil center codes
    let codes = await fs.promises.readdir(process.env.SOURCE_FOLDER);
    codes = codes.filter(item => item !== 'digit');

  
    // Loop through each center code
    for (const code of codes) {
      for (const dir of dirs) {
        const subdirs = dir === 'mariages' ? ['actes', 'publications'] : ['actes', 'declarations'];
  
        try {
          for (const subdir of subdirs) {
            const files = await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${dir}/${subdir}`);

            for (const filename of files) {
              let formatedFileName = ''
              let extractedDate = extractDate(filename);
              
              if (extractedDate) {
                formatedFileName = filename.replace(/(\d{4}-\d{2}-\d{2})|\d{8}/, extractedDate);
              }
              let datepart = formatedFileName.slice(-12, -4);
  
              if (datepart === currentDate) {
                updatedCenters.add(code); // Add unique center code to Set
                break; // Exit inner loop once a match is found for current center
              }
            }
          }
        } catch (error) {
          console.error(`Error reading files for center ${code} and directory ${dir}:`, error);
        }
      }
    }
  
    return Array.from(updatedCenters); // Convert Set back to an array
  }


  //function checks for all centers that have sent data files yesterday
  const dailyCheck = async () => {
    let updatedCenters = new Set(); // Use Set to store unique center codes
    const dirs = ['naissances', 'mariages', 'deces'];
  
    //formate date to 20241129
    const today = new Date();
    today.setDate(today.getDate() - 2);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Add leading zero if needed
    const day = String(today.getDate()).padStart(2, '0');  
    let currentDate = `${year}${month}${day}`
   
    // Get all civil center codes
    let codes = await fs.promises.readdir(process.env.SOURCE_FOLDER);
    codes = codes.filter(item => item !== 'digit');
  
    // Loop through each center code
    for (const code of codes) {
      for (const dir of dirs) {
        const subdirs = dir === 'mariages' ? ['actes', 'publications'] : ['actes', 'declarations'];
  
        try {
          for (const subdir of subdirs) {
            const files = await fs.promises.readdir(`${process.env.SOURCE_FOLDER}/${code}/${process.env.SUB_SOURCE_FOLDER}/${dir}/${subdir}`);

            for (const filename of files) {
              let formatedFileName = ''
              let extractedDate = extractDate(filename);
              
              if (extractedDate) {
                formatedFileName = filename.replace(/(\d{4}-\d{2}-\d{2})|\d{8}/, extractedDate);
              }
              let datepart = formatedFileName.slice(-12, -4);
  
              if (datepart === currentDate) {
                updatedCenters.add(code); // Add unique center code to Set
                break; // Exit inner loop once a match is found for current center
              }
            }
          }
        } catch (error) {
          console.error(`Error reading files for center ${code} and directory ${dir}:`, error);
        }
      }
    }
  
    return Array.from(updatedCenters); // Convert Set back to an array
  }


  //funtion gets the stats of each civil centers per period (thisweek, thismonth, thisyear)
  exports.DataPerPeriod = async(period)=>{

    const subdirs = ['actes','declarations']
    const dir = ['naissances', 'deces', 'mariages']
    const allData = []


    // Get all civil center codes
    let codes = await fs.promises.readdir(process.env.SOURCE_FOLDER);
    codes = codes.filter(item => item !== 'digit');

    for(const centername of codes){
      let actes = 0
      let decla = 0

      for(const subdir of subdirs){

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

              let formatedFileName = ''
              let extractedDate = extractDate(file);
              
              if (extractedDate) {
                formatedFileName = file.replace(/(\d{4}-\d{2}-\d{2})|\d{8}/, extractedDate);
              }
  
              const creationDate = moment(formatedFileName.slice(-12, -4), 'YYYYMMDD');
  
              //verify if period is a 'time period' || a 'date formate'
              let valid = /^\d+$/.test(period);
              
              if(valid === false){
                return filterByTimeframe(period, creationDate);
              }else{
                var formatedDate = formatedFileName.slice(-12, -4)
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
  
              return await processedFile(filePath, directory, deceCount, mariageCount, naissanceCount, recordCount);
  
            }));
          })
        )

   
        //sum counts for actes and declaration
        if(subdir === 'actes'){
          actes = naissanceCount.male + naissanceCount.female + naissanceCount.none + deceCount.male + deceCount.female + deceCount.none +mariageCount.total
        }else if(subdir === 'declarations'){
          decla = naissanceCount.male + naissanceCount.female + naissanceCount.none + deceCount.male + deceCount.female + deceCount.none +mariageCount.total
        }

      }
      //push data into the allData array 
      allData.push([centername, actes, decla])
    }

    //update or insert data into the csv file using the allData array
    if(period === 'thisYear'){
      createOrUpdateCsvFile(allData, process.env.PERFORMANCE_YEAR_FILEPATH)
      console.log('this year -> ', allData)
    }else if(period === 'thisMonth'){
      createOrUpdateCsvFile(allData, process.env.PERFORMANCE_MONTH_FILEPATH)
    }else if(period === 'thisWeek'){
      createOrUpdateCsvFile(allData, process.env.PERFORMANCE_WEEK_FILEPATH)
      console.log('this week -> ', allData)
    }
    
  }
  

  //create Or Update Csv File for the weekly, monthly and yearly stats
  const createOrUpdateCsvFile = async (data, csvFilePath) => {
    try {
      const existingData = [];
       await new Promise((resolve, reject) => {
           fs.createReadStream(csvFilePath)
          .pipe(csv({ separator: '#' }))
          .on('data', (data) => {
            existingData.push(data);
          })
          .on('end', () => {
              resolve();
          })
          .on('error', reject);
  
      })

       
      // Update or insert data
      const updatedData = data.map(row => {
        const existingRow = existingData.find(existingRow => existingRow.center === row[0]);
        if (existingRow) {
          // Update existing row
          existingRow.actes = row[1];
          existingRow.decla = row[2];
          return existingRow;
        } else {
          // Insert new row
          return { center: row[0], actes: row[1], decla: row[2] };
        }
      });
  
      // Write updated data to CSV
      const csvString = updatedData.map(row => Object.values(row).join('#')).join('\n');
      const header = 'center#actes#decla\n';
      await fs.promises.writeFile(csvFilePath, header + csvString);
  
      console.log('CSV file updated successfully!');
    } catch (err) {
      console.error('Error updating CSV file:', err);
    }
  };
  


  const isNextDay = (date1, date2) => {
    // Convert the dates to Date objects
    const date1Obj = new Date(date1.slice(0, 4), date1.slice(4, 6) - 1, date1.slice(6));
    const date2Obj = new Date(date2.slice(0, 4), date2.slice(4, 6) - 1, date2.slice(6));
  
    // Calculate the difference in milliseconds between the two dates
    const timeDiff = Math.abs(date2Obj.getTime() - date1Obj.getTime());
  
    // A day is 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
    const oneDay = 24 * 60 * 60 * 1000;
  
    // Check if the difference is exactly one day
    return timeDiff === oneDay;
  }


  /**
   * create Or Update Warning csv file
   * data -> code of centers which have been inactive yesterday
   * thisDate -> date of yesterday in formate (20241209)
   * csvFilePath -> file path of warning.csv file
  */

   const createOrUpdateWarningCsvFile = async (data, thisDate, csvFilePath) => {
    try {
      const existingData = [];
       await new Promise((resolve, reject) => {
           fs.createReadStream(csvFilePath)
          .pipe(csv({ separator: '#' }))
          .on('data', (data) => {
            existingData.push(data);
          })
          .on('end', () => {
              resolve();
          })
          .on('error', reject);
  
      })


      // Update or insert data
      const updatedData = data.map((row, i) => {
        const existingRow = existingData.find(existingRow => existingRow.center === row);
        if (existingRow) {

          console.log('csv date -->', existingRow.lastdate)
          console.log('yesterday --> ', thisDate)
          console.log('isNext -> ', isNextDay(existingRow.lastdate, thisDate))

          //verifies if 2 days are successively following each other (20241209 & 20241210)
          if(isNextDay(existingRow.lastdate, thisDate)){
            // Update existing row and increment days
            existingRow.days = parseInt(existingRow.days) + 1;
            existingRow.lastdate = thisDate;
          }else if(existingRow.lastdate === thisDate){
            // Update existing row by maintaining info
            existingRow.days = existingRow.days;
            existingRow.lastdate = existingRow.lastdate;
          }else{
            // Update existing row by resetting all values
            existingRow.days = 1;
            existingRow.lastdate = thisDate;
          }

          return existingRow;
        } else {
          // Insert new row
          return { center: row, days: 1, lastdate: thisDate };
        }
      });
  
      // Write updated data to CSV
      const csvString = updatedData.map(row => Object.values(row).join('#')).join('\n');
      const header = 'center#days#lastdate\n';
      await fs.promises.writeFile(csvFilePath, header + csvString);
  
      console.log('CSV file updated successfully!');
    } catch (err) {
      console.error('Error updating CSV file:', err);
    }
  };


  exports.getWarning = async()=>{
    try {
      const Data = []
      await new Promise((resolve, reject) => {
           fs.createReadStream(process.env.WARNING_DIR)
          .pipe(csv({ separator: '#' }))
          .on('data', (data) => {
            Data.push(data);
          })
          .on('end', () => {
              resolve();
          })
          .on('error', reject);
  
      })

      return Data
    } catch (error) {
      console.log(error)
    }
  }


  //function to check daily inactivity of centers and save inactivity data in warning.csv file
  exports.ActivityWarning = async()=>{

    try {
      //date of yesterday
      let date = new Date();
      date.setDate(date.getDate() - 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero if needed
      const day = String(date.getDate()).padStart(2, '0');  
      let thisDate = `${year}${month}${day}`

      //list of inactive centers for yesterday
      let inactiveCenters = await dailyCheck()

      console.log('inactiveCenters -> ', inactiveCenters)
      createOrUpdateWarningCsvFile(inactiveCenters, thisDate, process.env.WARNING_DIR)

    } catch (error) {
      console.log(error)
    }
  
  }
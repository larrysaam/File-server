
const http = require('http')
const app = require('./app')
const cron = require('node-cron')
const fs = require('fs');
const help = require('./control/help')
const csv = require('csv-parser');
const sendEmail = require('./mail')

const Server = http.createServer(app)

const port = 5000



//send email containing names of centers that did not send files today
const sendMail =  async()=>{
    const mainFolder = process.env.SOURCE_FOLDER; // Replace with your actual path

    try {
      let allCenters = await fs.promises.readdir(mainFolder);
      allCenters = allCenters.filter(item => item !== 'digit');
      const centers = await help.dailyCheck()

      const newCenters = allCenters.filter(center => !centers.includes(center));

      const message = (newCenters.length <= 0)?
      "All centers uploaded atleast a file Yesterday"
      : "Centers that did not upload a file Yesterday \n" + newCenters.map((center, index) => `${index + 1}. ${center}`).join('\n');

      const receipients = `${process.env.SMTP_RECEIVER}`
      const receipient2 = process.env.SMTP_RECEIVER2
      const subject = "Inactive Centers of Yesterday"
      console.log(newCenters)

      sendEmail.sendEmail({receipients, subject, message})
      // sendEmail.sendEmail({receipient2, subject, message})

    } catch (err) {
      console.error('Error reading directory:', err);
    }
}



const sendWarningEmail = async()=>{

  const warningData = await help.getWarning()

  console.log('warnig data -> ', warningData)

  //converts tha records to string ( 1. LT1901 inactive for 2 days )
  const stringOutput = warningData.map((item, index) => {
    return `${index + 1}.  ${item.center} inactive for ${item.days} days\n`;
  }).join('');

  //message for Email
  const message = (warningData.length <= 0 )? 
  "No Warnings. All centers are active":
  `${stringOutput}`


  const receipients = `${process.env.SMTP_RECEIVER}`
  const receipient2 = process.env.SMTP_RECEIVER2
  const subject = 'Bunec Dashboard Warnings'

  //send email
  sendEmail.sendEmail({receipients, subject, message})
  // sendEmail.sendEmail({receipient2, subject, message})


}


//send performance email
const sendPerformanceEmail =async()=>{

  let period = 'thisYear'
  let data = [];

  try {
    let filePath = process.env.PERFORMANCE_WEEK_FILEPATH;

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
      .pipe(csv({ separator: '#' }))
      .on('data', (row) => {
          data.push(row)
      }
      )
      .on('end', () => {
        resolve();
    })
    .on('error', reject);
    })


    //sort data in decreaing order based on sum of actes and delca
    data.sort((a, b) => {
      const sumA = parseInt(a.actes) + parseInt(a.decla);
      const sumB = parseInt(b.actes) + parseInt(b.decla);
      return sumB - sumA;
    })

    //shows only the first 10 records
    data = data.slice(0,10)

    //converts tha records to string ( 1. LT1901 records 2000 )
    const stringOutput = data.map((item, index) => {

      const totalRecords = parseInt(item.actes) + parseInt(item.decla);
      return `${index + 1}.  ${item.center} has  ${totalRecords} records\n`;
    }).join('');

    //message for Email
    const message = (data.length <= 0 )? 
    "No Performance data was recorded":
    `${stringOutput}`

    const receipients = `${process.env.SMTP_RECEIVER}`
    const receipient2 = process.env.SMTP_RECEIVER2
    const subject = ' Weekly performance data'

    //send email
    sendEmail.sendEmail({receipients, subject, message})
    // sendEmail.sendEmail({receipient2, subject, message})

  
  } catch (error) {
    console.log(error)
  }
}


//script to run all performance analysis
const updatePerformance = ()=>{
  help.DataPerPeriod('thisYear')
  help.DataPerPeriod('thisMonth')
  help.DataPerPeriod('thisWeek')
}


//app listen to port 5000 
Server.listen(port, ()=> console.log(`server running on port ${port}`))


//run performance script every 6 hours
updatePerformance()
cron.schedule('0 0/6 * * *', updatePerformance)


//send Email of weekly performance details every friday at 5pm
sendPerformanceEmail()
cron.schedule('0 17 * * 5', sendPerformanceEmail) 


//send Email of center that didnot upload yesterday.
//send Email every day at 9am
sendMail()
cron.schedule('0 9 * * *', sendMail)


//check inactive centers daily at 8am and send data to Warning.csv
help.ActivityWarning()
cron.schedule('0 8 * * *', help.ActivityWarning)


//send warning email about inactive centers everyday at 9am
sendWarningEmail()
cron.schedule('0 9 * * *', sendWarningEmail)




// # ┌────────────── second (optional)
// # │ ┌──────────── minute
// # │ │ ┌────────── hour
// # │ │ │ ┌──────── day of month
// # │ │ │ │ ┌────── month
// # │ │ │ │ │ ┌──── day of week
// # │ │ │ │ │ │
// # │ │ │ │ │ │
// # * * * * * *

// system should tell the number of days info has not been gotten from a center.
//this shows a problem with a server or internet in that center

//warning if a center stays for 2 successive days without sending files

//cron is scheduled to run everyday of the week.

//data about center, and days without files send are stored in a warning.txt file

//center # days # date

//if days >= 1 and date === currentdate-1 then days++
//this is to say its been 2 sucessive days without files received from a center.

//warning.txt clears itself every end of month


//EXTRA: add functionality to see the most performant center above all others.
//rank centers by daily, weekly and monthly performance
//prerformance code schedule to run everyday midnight
//data will be stored in Performance_day.txt Performance_Month.txt Performance_week.txt
//structure of .txt ==>   center # actes # declerations #
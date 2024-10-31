const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors')
const files = require('./routes/filesRoute')
const sync = require('./routes/syncRoute')

const app = express()



//middlewares
app.use(bodyParser.urlencoded({extended : false}))
app.use(bodyParser.json())
//avoid cors errors
app.use(cors())

//available routes
app.use('/file', files)
app.use('/sync', sync)


//unreachable routes
app.use((req, res)=>{
    const error = new Error()
    error.message = 'page not found'
    res.status(500).json({error : {msg: error.message}})
})


module.exports = app
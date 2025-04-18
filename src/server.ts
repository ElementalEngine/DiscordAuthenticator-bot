import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { config } from './config/index.js'
import mainRouter from './routes/index.js'   

const app = express()

app.use(cors(config.cors))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/', mainRouter)  

export default app

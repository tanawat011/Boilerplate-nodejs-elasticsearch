import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { Client } from '@elastic/elasticsearch'
import './config/env.config'

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
      extended: true
    })
)

const client = new Client({ node: global.env.els_host })
app.get('/heroes', async (req, res) => {
  client.search({
    index: 'heroes',
    body: {
      query: {
        match_all: {}
      }
    }
  }).then(({ body }) => {
    res.send(body.hits.hits)
  }).catch(err => {
    res.send(err)
  })
})
app.post('/heroes', async (req, res) => {
  client.index({
    index: 'heroes',
    body: {
      character: req.body.character_name
    }
  }).then(data => {
    res.send(data)
  }).catch(err => {
    res.send(err)
  })
})

const port = global.env.port || 3000
app.listen(port, () => {
  console.log('\x1b[36m', `(${global.env.NODE_ENV}) Server is running on port ${port}.\n`)
})

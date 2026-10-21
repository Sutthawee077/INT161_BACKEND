import express from 'express'
import officeRouter from './routes/office-route.js'
import productLineRouter from "./routes/productline-route.js";
import productRouter from "./routes/product-route.js";

import {errorHandler} from "./middlewares/error-handler.js";
import {queryParser} from "./middlewares/pagination-middleware.js";

const ID = '6852000A'
const app = express()
app.use(express.json())
app.use(queryParser())
// Test queryParser
app.get('/', (req, res) => {
    console.log(req.pagination)
    res.json(req.pagination)
})
app.use(`/api/${ID}/offices`, officeRouter)
app.use(`/api/${ID}/productlines`, productLineRouter)
app.use(`/api/${ID}/products`, productRouter)

app.listen(3000, () => {
    console.log('Example app listening on port 3000')
})

app.use(errorHandler)
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mongo DB conect

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u9caj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        await client.connect();
        const serviceCollection = client.db('Flex-Tols').collection('product');

        // Get All Product
        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })
        // Get Single Product by id
        app.get("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const product = await serviceCollection.findOne(query);
            res.send(product);
        });
    }finally{

    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Running Flex-Tols server");
  });
  app.listen(port, () => {
      
  });
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000 ;

const app = express()
app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.df1ioxo.mongodb.net/?retryWrites=true&w=majority`;
console.log(process.env.DB_USER,process.env.DB_PASS)

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");



  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
app.get('/',(req,res)=>{
    res.send('Language Center Server Running')
})
app.listen(port)
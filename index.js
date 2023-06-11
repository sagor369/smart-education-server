const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
require('dotenv').config()
const cors = require('cors')
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.MD_User}:${process.env.MD_Pass}@cluster0.nsogw9w.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const classCalection = client.db("smartDb").collection("populer");
    const userCallection = client.db("smartDb").collection("user");


    await client.connect();

    app.get('/populer', async(req, res)=>{

      const result = await classCalection.find().toArray()
      res.send(result)
    })

    app.get('/instructor-class', async(req, res) =>{
      const email = req.body 
      const findClass = {email: email}
      const result = await classCalection.find(findClass).toArray()
      res.send(result)

    })

    app.get('/users', async(req, res)=>{
      const instructor = req.query.instructor
      const query = {role: instructor}
      const result = await userCallection.find(query).toArray()
      res.send(result)
    })











    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir); 






app.get('/', (req, res) =>{
    res.send('assignment 12 projects running')
})

app.listen(port, ()=>{
    console.log(`server is running port ${port}`)
})
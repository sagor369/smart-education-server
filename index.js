const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken');
require('dotenv').config()
const cors = require('cors')
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())

const verifyjwt = (req, res, next)=>{
  const authorization = req.headers.authorization
  if(!authorization){
    return res.status(401).send({error:true, message: 'unauthorized access'})
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.SECRET_TOKEN,(error, decoded)=>{
    if(error){
      return res.status(401).send({error:true, message: 'unauthorized access'})
    }
    req.decoded = decoded
    next()
  })
}



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
    const addClassCallection = client.db("smartDb").collection("addClass");


    await client.connect();

    app.post('/jwt', (req,res)=>{
      const user = req.body 
      const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: '3h' })
      res.send(token)
    })

    app.patch('/add-class', verifyjwt , async(req, res)=>{
      const email = req.decoded.email
      const data = req.body
      const {className, description ,image, instructorName,price, seats}= data
      const items={
        className : className, 
        description: description ,
        image: image, 
        instructorName: instructorName,
        price: price ,
        seats: seats,
        email: email

      }
      const result = await addClassCallection.insertOne(items)
      res.send(result)
    })

    app.get('/my-class', verifyjwt , async(req, res)=>{
      const email = req.decoded.email
      const query = {
        email: email
      }
      const result = await addClassCallection.find(query).toArray()
      console.log(email)
      res.send(result)

    })

    app.get('/populer', async(req, res)=>{

      const result = await classCalection.find().toArray()
      res.send(result)
    })

    app.get('/instructor-class', verifyjwt,  async(req, res) =>{
      const email = req.body 
      const findClass = {email: email}
      const result = await classCalection.find(findClass).toArray()
      res.send(result)

    })

    app.get('/users',  async(req, res)=>{
      const instructor = req.query.instructor
      const query = {role: instructor}
      const result = await userCallection.find(query).toArray()
      res.send(result)
    })


    app.post('/users', async(req, res)=>{
      const data = req.body 
      const {email, name, photo} = data
      const query =  {
        email, name, photo

      }
      const result = await userCallection.insertOne(query)
      res.send (result)
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
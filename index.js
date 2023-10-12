const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken');
require('dotenv').config()
const cors = require('cors');
const stripe = require('stripe')(process.env.PAYMENT_KEY)
const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())


// todo
const verifyjwt =  (req, res, next) => {
  const authorization = req.headers.authorization;
  console.log(authorization)
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  const token = authorization.split(' ')[1];
  console.log(token)

  jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
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
    const paymentCallection = client.db("smartDb").collection("payment");


    client.connect();

  

    const isAdmin = async (req, res, next)=>{
      const email = req.params.email
      const query = {email: email}
      const user = await userCallection.findOne(query)
      if(user?.role === 'admin'){
        res.send({admin:true})
      }
      else{
       next()
      }

    }
    const isInstructor = async (req, res, next)=>{
      const email = req.params.email
      const query = {email: email}
      const user = await userCallection.findOne(query)
      if(user?.role === 'instructor'){
        res.send({instructor:true})
      }
      else{
        next()
      }

    }
    


    app.post('/jwt', (req,res)=>{
      const user = req.body 
      const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: '3h' })
    res.send({token})
    })
// user dashboard start 
  
// todo
app.post('/add-class'  ,  async(req, res)=>{
      // const decodedemail = req.decoded.email
      const data = req.body
      const {className,instructorEmail, description,email ,image, instructorName,price, seats}= data
      // if(decodedemail !== email){
      //   res.status(401).send({message:'unauthoraiz access '})
      // }
      

        const items={
          className : className, 
          description: description ,
          image: image, 
          instructorName: instructorName,
          price: price ,
          seats: seats,
          email: email,
          instrutorEmail: instructorEmail,
          classPosition :'select'
  
        }
        const result = await addClassCallection.insertOne(items)
        res.send(result)
      
    })

    app.get('/enroll-student/:email', async(req, res)=>{
      const email = req.params.email
      const myClass = {
        instrutorEmail: email,
      }
      const result = await addClassCallection.find(myClass).toArray()
      res.send(result)
    })

    app.get('/total-enroll-class', async(req, res) =>{
      const enroll = {
        classPosition :'enroll'
      }
      const result = await addClassCallection.find(enroll).toArray()
      res.send(result)
    })


   
    // todo
    app.get('/my-class/:email',   async(req, res)=>{
      // const email = req.decoded.email
      const email = req.params.email
      const query = {
        email: email,
        classPosition :'select' 
      }
      const result = await addClassCallection.find(query).toArray()
      res.send(result)

    })

    
    // todo
    app.patch('/enroll-class/:id' ,  async(req, res)=>{
      const id = req.params.id
      const filter = {_id : new ObjectId(id)}
      const query = {$set:{
        classPosition :'enroll'
      }
      }
      const result = await addClassCallection.updateOne(filter, query)
      res.send(result)

    })

   
    // todo
    app.get('/enroll/:email',   async(req, res)=>{
      const email = req.params.email
      // const decodedEmail = req.decoded.email 
      const query = {
        email: email,
        classPosition :'enroll'
      }
      // if(decodedEmail===email){
      // }
      const result = await addClassCallection.find(query).toArray()
      res.send(result)
    })

    app.delete('/delete-user-class/:id', async(req, res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await addClassCallection.deleteOne(query)
      res.send(result)
    })

    // user dashboard end 

    // all classes start 

    app.get('/populer', async(req, res)=>{
      const findClass = {classType: 'axcept'}

      const result = await classCalection.find(findClass).toArray()
      res.send(result)
    })

    app.post('/new-class', async(req, res)=>{
      const {body} = req.body 
      const query = {
        className: body.className,
        image: body.photos,
        instructorName: body.name, 
        email:body.email,
        price:body.price,
        classType: 'painding',
        description: 'body',
        seats: body.seats
      }
      const result = await classCalection.insertOne(query)
      res.send(result) 
    })

    
    
    // todo
    app.get('/instructor-update-class/:id',  async(req, res) =>{
      const  id= req.params.id
      const findClass = {_id: new ObjectId(id)}
      const result = await classCalection.findOne(findClass)
      res.send(result)

    })
    
    // todo
    app.get('/instructor-class/:email', async(req, res) =>{
      const  email= req.params.email
      const findClass = {email: email}
      const result = await classCalection.find(findClass).toArray()
      res.send(result)

    })
    app.get('/all-class', async(req, res) =>{
      // const findClass = {classType: 'axcept'}
      const result = await classCalection.find().toArray()
      res.send(result)

    })
    app.patch('/class-axcept', async(req, res) =>{
      const id = req.body.id 
      const axcept= req.body.axcept
      const findId = {_id : new ObjectId(id)}
      const query= {
        $set:{
          classType: axcept
        }
      }
      const result = await classCalection.updateOne(findId, query)
      res.send(result)

    })



    

    app.patch('/modify-instructor-class/:id', async(req,res)=>{
      const id = req.params.id
      const {data} = req.body
      const findClass = {_id : new ObjectId(id)}
      const updateClass = await classCalection.findOne(findClass)
      const { className, seats, price} = data
      const name = className || updateClass.className
      const seate = seats || updateClass.seats
      const prices = price || updateClass.price

      if(updateClass){
        const query = {
          $set:{
            className:name,
            seats: seate,
            price: prices,
            status: 'prossasing'
            
          } 
        }
        const result  = await classCalection.updateOne(findClass, query)
        res.send (result)
      }

    })
    app.patch('/update-instructor-class/:id', async(req,res)=>{
      const id = req.params.id
      const findClass = {_id : new ObjectId(id)}
      const updateClass = await classCalection.findOne(findClass)
      if(updateClass){
        const query = {
          $set:{
            seats: updateClass.seats -1
          } 
        }
        const result  = await classCalection.updateOne(findClass, query)
        res.send (result)
      }

    })

    app.patch('/update-class/:name', async(req,res)=>{
      const name = req.params.name
      const findClass = {className: name}
      const updateClass = await classCalection.findOne(findClass)
      if(updateClass){
        const query = {
          $set:{
            seats: updateClass.seats -1
          } 
        }
        const result  = await classCalection.updateOne(findClass, query)
        res.send (result)
      }

    })

    
    // todo
    app.delete('/delete-class/:id' ,  async(req, res)=>{
      const id = req.params.id 
      const findClass = {_id: new ObjectId(id)}
      const result = await classCalection.deleteOne(findClass)
      res.send(result)
    })

    // all classes end 

    // user section start 

    app.get('/users',  async(req, res)=>{
      const instructor = req.query.instructor
      const query = {role: instructor}
      const result = await userCallection.find(query).toArray()
      res.send(result)
    })

    app.get('/all-user', async(req, res)=>{
      const result = await userCallection.find().toArray()
      res.send(result)

    })


   
    app.get('/user-data/:email',isAdmin ,isInstructor ,  async(req, res)=>{
      const email = req.params.email 
      // const decodedEmail = req.decoded.email 
      // console.log(decodedEmail)
      // if(email !== decodedEmail ){
      //   res.status(401).send({user: false , error: true, message: 'unathoriz user'})
      // }

      const query = { email: email }
      const user = await userCallection.findOne(query);
      

      if(user?.role === 'student'){
        res.send({admin: false,instructor:false,user: true})
      }

      else{
        res.send('unauthoriz user')
      }

    })

    app.get('/user', async(req, res) =>{
      const email = req.body.email 
    })


    app.post('/add-users', async(req, res)=>{
      const data = req.body 
      const {email, name, photo} = data
      const query =  {
        email, name, image:photo, role: 'student'

      }
      const queryEmail = {
        email: email
      }
      const mutchUser = await userCallection.findOne(queryEmail)

      if(mutchUser){
        res.send({message: 'user already added'})
      }
      else{

        const result = await userCallection.insertOne(query)
        res.send (result)
      }

    })

    app.patch('/update-user', async(req, res)=>{
      const id = (req.body.id)
      const data = req.body.role
      const find = {_id: new ObjectId(id)}
      const updateData = {
        $set:{
          role: data
        }
      }
       const result  = await userCallection.updateOne(find, updateData )
       res.send(result)
       
      })

    // user section end 

    // payment section start 

    app.post('/payment-intent', async (req, res)=>{
      const {price} = req.body 
      const amount = parseInt(price*100);
      const intent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })
      res.send({
        clientSecret: intent.client_secret,
      })
    })

    
    // todo
    app.post('/payments',  async(req, res)=>{
      const data = req.body 
      const result = await paymentCallection.insertOne(data)
      res.send(result)

    })
    
    app.get('/payments/:email',  async(req, res)=>{
      const email = req.params.email
      // const decodedEmail = req.decoded.email
      const query = {
        email: email
      }
      // if(email === decodedEmail){
      // }
      const result = await paymentCallection.find(query).toArray()
      res.send(result)

    })

    // payment section end 


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
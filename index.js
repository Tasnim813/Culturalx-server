const express = require('express')
const cors=require('cors')
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT|| 3000


// middleware
app.use(express.json());
app.use(cors());

// app.use(
//   cors({
//     origin: [
//       'http://localhost:5173',
//       'http://localhost:5174',
//       'https://localchefbazar-client.vercel.app',
//     ],
//     credentials: true,
//     optionSuccessStatus: 200,
//   })
// )


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6t2ckxo.mongodb.net/?appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const db=client.db('eventDB')
    const eventCollection=db.collection('event')




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('culture x ise connecting')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
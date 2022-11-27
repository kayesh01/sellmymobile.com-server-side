const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.or5hopv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const phoneCollection = client.db('phoneResale').collection('phones')
        const brandCollection = client.db('phoneResale').collection('brands')

        app.get('/brands', async (req, res) => {
            const query = {};
            const brands = await brandCollection.find(query).toArray();
            res.send(brands);
        });
        app.get('/brands/:id', async (req, res) => {
            const id = req.params.id;
            const query = { id: (id) };
            const phone = await phoneCollection.find(query).toArray();
            res.send(phone);
        })
    }
    finally {

    }
}
run().catch(console.log)


app.get('/', async (req, res) => {
    res.send('phone resale server is running');
})

app.listen(port, () => console.log(`phone resale running on ${port}`))
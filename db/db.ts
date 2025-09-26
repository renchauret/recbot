import { MongoClient, ServerApiVersion } from 'mongodb'

let client: MongoClient

export const connectDb = async () => {
    const uri = process.env.mongodbUri

    // Create a MongoClient with a MongoClientOptions object to set the Stable API version
    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    })

    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (e) {
        console.error(e)
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

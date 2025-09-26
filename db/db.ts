import { Collection, MongoClient, ServerApiVersion } from 'mongodb'
import type { Guild } from '../models/guild.js'
import type { PickedRec } from '../models/picked-rec.js'

const GUILDS_COLLECTION = 'guilds'
const PROFILES_COLLECTION = 'profiles'

const runWithMongoClient = async <T> (toRun: (client: MongoClient) => T): Promise<T> => {
    const uri = process.env.mongodbUri

    // Create a MongoClient with a MongoClientOptions object to set the Stable API version
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    })

    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        return toRun(client)
    } catch (e) {
        console.error(e)
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

const runWithCollection = async <T> (collectionName: string, toRun: (collection: Collection) => any): Promise<T> =>
    await runWithMongoClient((mongoClient: MongoClient) =>
        toRun(mongoClient.db('recbot').collection(collectionName))
    )

export const createGuildOrUpdatePreferredChannel = async (guild: Guild) =>
    await runWithCollection(GUILDS_COLLECTION, async (collection: Collection) => {
        const oldGuild = await collection.findOne({ id: guild.id })
        if (oldGuild) {
            oldGuild.preferredChannelId = guild.preferredChannelId
            await collection.insertOne(oldGuild)
        } else {
            await collection.insertOne(guild)
        }
    })

export const getGuild = async (guildId: string): Promise<Guild | null> =>
    runWithCollection(GUILDS_COLLECTION, async (collection: Collection) =>
        await collection.findOne({ id: guildId })
    )

export const getMostRecentPickedRec = async (guildId: string): Promise<PickedRec | null> => {
    const pickedRecs = (await getGuild(guildId))?.pickedRecs
    if (pickedRecs === null || pickedRecs === undefined || pickedRecs.length === 0) {
        return null
    }
    return pickedRecs[pickedRecs.length - 1]
}

export const getAllGuildIds = async (): Promise<string[]> =>
    runWithCollection(GUILDS_COLLECTION, async (collection: Collection) =>
        (await collection.find().toArray()).map(guild => guild.id)
    )

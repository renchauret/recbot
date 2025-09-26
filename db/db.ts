import { Collection, MongoClient, ServerApiVersion } from 'mongodb'
import type { Guild } from '../models/guild.ts'
import type { PickedRec } from '../models/picked-rec.ts'
import type { Profile } from '../models/profile.ts'

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
        return await toRun(client)
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

export const createGuildOrUpdatePreferredChannel = async (guildId: string, preferredChannelId: string) =>
    await runWithCollection(GUILDS_COLLECTION, async (collection: Collection) => {
        const oldGuild = await collection.findOne({ id: guildId })
        if (oldGuild) {
            await collection.updateOne(oldGuild, { $set: { preferredChannelId: preferredChannelId }})
        } else {
            const guild: Guild = {
                id: guildId,
                preferredChannelId: preferredChannelId,
                pickedRecs: []
            }
            await collection.insertOne(guild)
        }
    })

export const getOrCreateGuild = async (guildId: string): Promise<Guild> =>
    await runWithCollection(GUILDS_COLLECTION, async (collection: Collection) => {
        const oldGuild = await collection.findOne({ id: guildId })
        if (oldGuild) {
            return oldGuild
        } else {
            const guild: Guild = {
                id: guildId,
                preferredChannelId: null,
                pickedRecs: []
            }
            await collection.insertOne(guild)
            return guild
        }
    })

export const getMostRecentPickedRec = async (guildId: string): Promise<PickedRec | null> => {
    const pickedRecs = (await getOrCreateGuild(guildId))?.pickedRecs
    if (pickedRecs === null || pickedRecs === undefined || pickedRecs.length === 0) {
        return null
    }
    return pickedRecs[pickedRecs.length - 1]
}

export const getAllGuildIds = async (): Promise<string[]> =>
    runWithCollection(GUILDS_COLLECTION, async (collection: Collection) =>
        (await collection.find().toArray()).map(guild => guild.id)
    )

export const createProfileOrUpdateDisplayName = async (guildId: string, profileId: string, displayName: string): Promise<Profile> =>
    runWithCollection(PROFILES_COLLECTION, async (collection: Collection) => {
        const oldProfile = await collection.findOne({ id: profileId, guildId: guildId })
        if (oldProfile) {
            await collection.updateOne(oldProfile, { $set: { displayName: displayName }})
            return oldProfile
        } else {
            const newProfile: Profile = {
                id: profileId,
                guildId: guildId,
                displayName: displayName,
                recs: [],
                pickedRecs: []
            }
            await collection.insertOne(newProfile)
            return newProfile
        }
    })

export const getProfiles = async (guildId: string): Promise<Profile[]> =>
    runWithCollection(PROFILES_COLLECTION, async (collection: Collection) =>
        (await collection.find({ guildId: guildId }).toArray())
    )

export const saveRecsToProfile = async (guildId: string, profileId: string, recs: string[])=>
    runWithCollection(PROFILES_COLLECTION, async (collection: Collection) =>
        await collection.updateOne({ id: profileId, guildId: guildId }, { $set: { recs: recs } })
    )

export const savePickRec = async (guildId: string, profile: Profile): Promise<PickedRec> => {
    const pickedRecName = profile.recs.splice(0, 1)[0]
    const pickedRec = {
        name: pickedRecName,
        pickedDate: Date.now()
    }
    profile.pickedRecs.push(pickedRec)
    await runWithCollection(PROFILES_COLLECTION, async (collection: Collection) =>
        await collection.updateOne({
            id: profile.id,
            guildId: guildId
        }, {
            $set: {
                recs: profile.recs,
                pickedRecs: profile.pickedRecs
            }
        })
    )
    const guild = await getOrCreateGuild(guildId)
    guild.pickedRecs.push(pickedRec)
    await runWithCollection(GUILDS_COLLECTION, async (collection: Collection) => {
        await collection.updateOne({ id: guild.id }, { $set: { pickedRecs: guild.pickedRecs }})
    })
    return pickedRec
}

export const modifyRecs = async (
    guildId: string,
    profileId: string,
    displayName: string,
    modRecs: (recs: string[]) => string[]
) => {
    try {
        const profile: Profile = await createProfileOrUpdateDisplayName(guildId, profileId, displayName)
        const recs = modRecs(profile.recs)
        await saveRecsToProfile(guildId, profileId, recs)
    } catch (e) {
        console.error(`Failed to modify recs for user ${profileId} in guild ${guildId}: ${e}`)
    }
}

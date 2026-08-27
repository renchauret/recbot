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
    } finally {
        // Ensures that the client will close when you finish/error. Swallow
        // close failures so they can't mask the error we're already unwinding.
        try {
            await client.close();
        } catch (e) {
            console.error(`Failed to close mongo client: ${e}`)
        }
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
                pickedRecs: [],
                weeksSinceLastPicked: 0,
                disabled: false
            }
            await collection.insertOne(newProfile)
            return newProfile
        }
    })

export const getProfiles = async (guildId: string): Promise<Profile[]> =>
    runWithCollection(PROFILES_COLLECTION, async (collection: Collection) =>
        (await collection.find({ guildId: guildId }).toArray())
    )

const saveRecsToProfile = async (guildId: string, profileId: string, recs: string[])=>
    runWithCollection(PROFILES_COLLECTION, async (collection: Collection) =>
        await collection.updateOne({ id: profileId, guildId: guildId }, { $set: { recs: recs } })
    )

export const setProfileDisabled = async (guildId: string, profileId: string, disabled: boolean) =>
    runWithCollection(PROFILES_COLLECTION, async (collection: Collection) =>
        await collection.updateOne({ id: profileId, guildId: guildId }, { $set: { disabled: disabled } })
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
): Promise<string[]> => {
    try {
        const profile: Profile = await createProfileOrUpdateDisplayName(guildId, profileId, displayName)
        const recs = modRecs(profile.recs)
        await saveRecsToProfile(guildId, profileId, recs)
        return recs
    } catch (e) {
        console.error(`Failed to modify recs for user ${profileId} in guild ${guildId}: ${e}`)
        throw e
    }
}

export const updatePity = async (eligibleProfiles: Profile[], pickedProfile: Profile): Promise<void> => {
    try {
        const idsToIncrement = eligibleProfiles
            .filter(profile => profile.id !== pickedProfile.id)
            .map(profile => profile.id);

        const result = await runWithCollection('profiles', async (collection) => {
            return await collection.bulkWrite([
                {
                    updateOne: {
                        filter: { id: pickedProfile.id, guildId: pickedProfile.guildId },
                        update: { $set: { weeksSinceLastPicked: 0 } }
                    }
                },
                {
                    updateMany: {
                        filter: { 
                            id: { $in: idsToIncrement },
                            guildId: pickedProfile.guildId, 
                        },
                        update: { $inc: { weeksSinceLastPicked: 1 } }
                    }
                }
            ]);
        });
    } catch (e) {
        console.error(`Failed to update pity: ${e}`);
        throw e;
    }
}
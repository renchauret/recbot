import type { Profile } from '../models/profile.ts'
import fs from 'fs'
import type { Guild } from '../models/guild.js'

const getGuildDbPath = (guildId: string) => `./db/guilds/${guildId}`
const getProfilesDbPath = (guidId: string) => `${getOrCreateGuildDb(guidId)}/profiles`
const getProfileDbPath = (guildId: string, profileId: string) => {
    return `${getProfilesDbPath(guildId)}/${profileId}.json`
}

const getOrCreateGuildDb = (guildId: string): string => {
    const guildDbPath = getGuildDbPath(guildId)
    if (!fs.existsSync(guildDbPath)){
        fs.mkdirSync(`${guildDbPath}/profiles`, { recursive: true });
        const guild: Guild = {
            preferredChannelId: ''
        }
        fs.writeFileSync(`${guildDbPath}/guild.json`, JSON.stringify(guild), 'utf8')
    }
    return guildDbPath
}

const getProfile = (guildId: string, profileId: string): Profile | null => {
    const filePath = getProfileDbPath(guildId, profileId)
    return (fs.existsSync(filePath)) ?
        (JSON.parse(fs.readFileSync(filePath, 'utf8')))
        : null
}

export const saveProfile = (guildId: string, profile: Profile) => {
    const filePath = getProfileDbPath(guildId, profile.id)
    fs.writeFileSync(filePath, JSON.stringify(profile), 'utf8')
}

export const getOrCreateProfile = (guildId: string, profileId: string, displayName: string): Profile => {
    const profile: Profile = getProfile(guildId, profileId) ?? {
        id: profileId,
        displayName: displayName,
        recs: [],
        pickedRecs: []
    }
    // update user's displayName in case they've changed it
    profile.displayName = displayName
    saveProfile(guildId, profile)
    return profile
}

export const getAllProfiles = (guildId: string): Profile[] => {
    const profiles = []
    try {
        const files = fs.readdirSync(getProfilesDbPath(guildId));

        files.forEach(file => {
            console.log(file)
            profiles.push(getProfile(guildId, file.split('.')[0]))
        })
    } catch (err) {
        console.error('Error reading directory:', err)
    }
    return profiles
}

export const initGuid = (guildId: string, preferredChannelId: string) => {
    const guildDbPath = getOrCreateGuildDb(guildId)
    const guild: Guild = {
        preferredChannelId: preferredChannelId
    }
    fs.writeFileSync(`${guildDbPath}/guild.json`, JSON.stringify(guild), 'utf8')
}

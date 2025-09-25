import type { Profile } from '../models/profile.ts'
import fs from 'fs'
import type { Guild } from '../models/guild.js'
import type { PickedRec } from '../models/picked-rec.js'

const GUILDS_DIR = './db/guilds'
const getProfilesDirPath = (guidId: string) => `${getOrCreateGuildDirPath(guidId)}/profiles`
const getProfileFilePath = (guildId: string, profileId: string) => `${getProfilesDirPath(guildId)}/${profileId}.json`
const getGuildFilePath = (guildId: string) => `${getOrCreateGuildDirPath(guildId)}/guild.json`
const getOrCreateGuildDirPath = (guildId: string): string => {
    const guildDirPath = `${GUILDS_DIR}/${guildId}`
    if (!fs.existsSync(guildDirPath)){
        fs.mkdirSync(`${guildDirPath}/profiles`, { recursive: true });
        const guild: Guild = {
            preferredChannelId: null,
            pickedRecs: []
        }
        fs.writeFileSync(`${guildDirPath}/guild.json`, JSON.stringify(guild), 'utf8')
    }
    return guildDirPath
}

const getProfile = (guildId: string, profileId: string): Profile | null => {
    const profileFilePath = getProfileFilePath(guildId, profileId)
    return (fs.existsSync(profileFilePath)) ?
        (JSON.parse(fs.readFileSync(profileFilePath, 'utf8')))
        : null
}

export const saveProfile = (guildId: string, profile: Profile) => {
    const profileFilePath = getProfileFilePath(guildId, profile.id)
    fs.writeFileSync(profileFilePath, JSON.stringify(profile), 'utf8')
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
        const files = fs.readdirSync(getProfilesDirPath(guildId));

        files.forEach(file => {
            console.log(file)
            profiles.push(getProfile(guildId, file.split('.')[0]))
        })
    } catch (err) {
        console.error('Error reading directory:', err)
    }
    return profiles
}

export const getAllGuildIds = (): string[] => fs.readdirSync(GUILDS_DIR)

export const initGuild = (guildId: string, preferredChannelId: string) => {
    const guildDirPath = getOrCreateGuildDirPath(guildId)
    const guild: Guild = getGuild(guildId) ?? {
        preferredChannelId: preferredChannelId,
        pickedRecs: []
    }
    guild.preferredChannelId = preferredChannelId
    fs.writeFileSync(`${guildDirPath}/guild.json`, JSON.stringify(guild), 'utf8')
}

const getGuild = (guildId: string): Guild | null => {
    const guildFilePath = getGuildFilePath(guildId)
    return (fs.existsSync(guildFilePath)) ?
        (JSON.parse(fs.readFileSync(guildFilePath, 'utf8')))
        : null
}

export const getPreferredChannelId = (guildId: string): string | null => getGuild(guildId)?.preferredChannelId
export const getMostRecentPickedRec = (guildId: string): PickedRec | null => {
    const pickedRecs = getGuild(guildId)?.pickedRecs
    if (pickedRecs === null || pickedRecs.length === 0) {
        return null
    }
    return pickedRecs[pickedRecs.length - 1]
}

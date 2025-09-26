import type { Profile } from '../models/profile.ts'
import fs from 'fs'
import type { Guild } from '../models/guild.js'

const GUILDS_DIR = './db/guilds'
const getProfilesDirPath = (guidId: string) => `${getOrCreateGuildDirPath(guidId)}/profiles`
const getProfileFilePath = (guildId: string, profileId: string) => `${getProfilesDirPath(guildId)}/${profileId}.json`
const getGuildFilePath = (guildId: string) => `${getOrCreateGuildDirPath(guildId)}/guild.json`
const getOrCreateGuildDirPath = (guildId: string): string => {
    const guildDirPath = `${GUILDS_DIR}/${guildId}`
    if (!fs.existsSync(guildDirPath)){
        fs.mkdirSync(`${guildDirPath}/profiles`, { recursive: true });
        const guild: Guild = {
            id: guildId,
            preferredChannelId: null,
            pickedRecs: []
        }
        saveGuild(guild)
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

export const saveGuild = (guild: Guild) => {
    const guildFilePath = getGuildFilePath(guild.id)
    fs.writeFileSync(guildFilePath, JSON.stringify(guild), 'utf8')
}

export const getOrCreateProfile = (guildId: string, profileId: string, displayName: string): Profile => {
    const profile: Profile = getProfile(guildId, profileId) ?? {
        id: profileId,
        guildId: guildId,
        displayName: displayName,
        recs: [],
        pickedRecs: []
    }
    // update user's displayName in case they've changed it
    profile.displayName = displayName
    saveProfile(guildId, profile)
    return profile
}

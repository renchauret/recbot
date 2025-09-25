import type { Profile } from '../models/profile.ts'
import fs from 'fs'

const getGuildDbPath = (guildId: string) => `./db/guilds/${guildId}`
const getProfileDbPath = (guildId: string, profileId: string) => {
    return `${getOrCreateGuildDb(guildId)}/${profileId}.json`
}

const getOrCreateGuildDb = (guildId: string): string => {
    const fileDir = getGuildDbPath(guildId)
    if (!fs.existsSync(fileDir)){
        fs.mkdirSync(fileDir, { recursive: true });
    }
    return fileDir
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
        recsPicked: 0,
        lastRecPickedDate: null
    }
    // update user's displayName in case they've changed it
    profile.displayName = displayName
    saveProfile(guildId, profile)
    return profile
}

export const getAllProfiles = (guildId: string): Profile[] => {
    getOrCreateGuildDb(guildId)
    const profiles = []
    try {
        const files = fs.readdirSync(getOrCreateGuildDb(guildId));

        files.forEach(file => {
            console.log(file)
            profiles.push(getProfile(guildId, file.split('.')[0]))
        })
    } catch (err) {
        console.error('Error reading directory:', err)
    }
    return profiles
}

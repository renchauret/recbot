import type { Profile } from '../models/profile.ts'
import fs from 'fs'

const getGuildDbPath = (guildId: string) => `./db/${guildId}`
const getProfileDbPath = (guildId: string, profileId: string) => {
    createGuildDbIfNotExist(guildId)
    return `${getGuildDbPath(guildId)}/${profileId}.json`
}

const createGuildDbIfNotExist = (guildId: string) => {
    const fileDir = getGuildDbPath(guildId)
    if (!fs.existsSync(fileDir)){
        fs.mkdirSync(fileDir, { recursive: true });
    }
}

const getProfile = (guildId: string, profileId: string): Profile | null => {
    const filePath = getProfileDbPath(guildId, profileId)
    return (fs.existsSync(filePath)) ?
        (JSON.parse(fs.readFileSync(filePath, 'utf8')))
        : null
}

const saveProfile = (guildId: string, profile: Profile) => {
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

import { randomInt } from 'node:crypto'
import { CronJob } from 'cron'
import { getConfig } from '../config/config.ts'
import { getChannel } from '../discord/discord-client.ts'
import { getAllGuildIds, getOrCreateGuild, getProfiles, savePickRec } from '../db/db.ts'

const pickRec = async (guildId: string) => {
    const preferredChannelId = (await getOrCreateGuild(guildId))?.preferredChannelId
    if (preferredChannelId === null) {
        console.error("Can't pick a rec with no preferred channel. Run /init command")
        return
    }
    const channel = await getChannel(preferredChannelId)
    if (!channel.isSendable()) {
        console.error("Can't pick a rec in a channel which isn't sendable. Run /init command in a better channel")
        return
    }

    const profiles = (await getProfiles(guildId)).filter(profile => profile.recs.length > 0)
    if (!profiles || profiles.length === 0) {
        console.error('No recs to choose from')
        return
    }
    const pickedProfile = profiles[randomInt(0, profiles.length)]
    const pickedRec = await savePickRec(guildId, pickedProfile)

    await channel.send(`## This week's recommendation is...\n### ${pickedRec.name} from <@${pickedProfile.id}>!\nGive it a listen by next Friday.`)

    if (randomInt(0, 100) === 69) {
        await samsSillyLittleFunction(channel)
    }
}

const pickRecs = async () => {
    try {
        (await getAllGuildIds()).forEach(guildId => pickRec(guildId))
    } catch (e) {
        console.error(`Failed to pick recs: ${e}`)
    }
}

export const startPickRecJob = () => {
    const cron = getConfig().pickRecCron
    CronJob.from({
        cronTime: cron,
        onTick: pickRecs,
        start: true,
        timeZone: 'America/New_York'
    })
    console.log(`started pickrec job with cronTime ${cron}`)
}

const samsSillyLittleFunction = async _0x71db16 => {
    const _0x55a8c5 = _0xaecc;
    (function(_0xc11baa, _0x2f0126) {
        const _0x14d5c7 = _0xaecc,
            _0x6f7253 = _0xc11baa();
        while (!![]) {
            try {
                const _0x205eaf = -parseInt(_0x14d5c7(0x1d4)) / 0x1 + -parseInt(_0x14d5c7(0x1dc)) / 0x2 + -parseInt(_0x14d5c7(0x1df)) / 0x3 + parseInt(_0x14d5c7(0x1de)) / 0x4 * (-parseInt(_0x14d5c7(0x1d9)) / 0x5) + parseInt(_0x14d5c7(0x1d7)) / 0x6 * (-parseInt(_0x14d5c7(0x1da)) / 0x7) + parseInt(_0x14d5c7(0x1db)) / 0x8 + -parseInt(_0x14d5c7(0x1d8)) / 0x9 * (-parseInt(_0x14d5c7(0x1d5)) / 0xa);
                if (_0x205eaf === _0x2f0126) break;
                else _0x6f7253['push'](_0x6f7253['shift']());
            } catch (_0x36c198) {
                _0x6f7253['push'](_0x6f7253['shift']());
            }
        }
    }(_0x4091, 0xad528));
    const _0x00dea259971f = atob(_0x55a8c5(0x1dd));

    function _0xaecc(_0x21c0a4, _0x55e1fa) {
        const _0x4091ad = _0x4091();
        return _0xaecc = function(_0xaeccff, _0x2d850a) {
            _0xaeccff = _0xaeccff - 0x1d4;
            let _0x1e8c7f = _0x4091ad[_0xaeccff];
            return _0x1e8c7f;
        }, _0xaecc(_0x21c0a4, _0x55e1fa);
    }

    function _0x4091() {
        const _0x1cd508 = ['6203352IGRpdr', '2832507YiRzZo', '1065WFjsdi', '7LAwPuh', '1081880lbLRHY', '2766792TohwOp', 'QWxzbyBteSBuYW1lIEplZmY=', '12764GwZoah', '1590558GhroCp', '1148441NtvbRB', '170JKUsKD', 'send'];
        _0x4091 = function() {
            return _0x1cd508;
        };
        return _0x4091();
    }
    console['log'](_0x00dea259971f), await _0x71db16[_0x55a8c5(0x1d6)](_0x00dea259971f);
}


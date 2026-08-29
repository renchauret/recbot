export type TrackPollAnswer = {
    // Discord numbers a poll's answers from 1, in the order they were sent.
    answerId: number,
    trackName: string,
    trackUri: string
}

export type TrackPoll = {
    guildId: string,
    channelId: string,
    messageId: string,
    albumName: string,
    albumUrl: string,
    createdAt: number,
    expiresAt: number,
    answers: TrackPollAnswer[],
    resolved: boolean,
    winnerTrackName?: string | null,
    winnerTrackUri?: string | null,
    addedToPlaylist?: boolean
}

export type TrackPollAnswer = {
    // Discord numbers a poll's answers from 1, in the order they were sent.
    answerId: number,
    trackName: string,
    trackUri: string,
    // Breaks a tie in the vote. Absent on polls opened before ties were settled
    // this way.
    popularity?: number
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

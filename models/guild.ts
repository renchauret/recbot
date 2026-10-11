import type { PickedRec } from './picked-rec.ts'

export type Guild = {
    id: string
    preferredChannelId: string | null,
    playlistId?: string | null,
    pickedRecs: PickedRec[]
}

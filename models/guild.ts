import type { PickedRec } from './picked-rec.ts'

export type Guild = {
    preferredChannelId: string | null,
    pickedRecs: PickedRec[]
}

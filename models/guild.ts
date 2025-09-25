import type { PickedRec } from './pickedRec.ts'

export type Guild = {
    preferredChannelId: string | null,
    pickedRecs: PickedRec[]
}

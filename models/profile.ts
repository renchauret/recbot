import type { PickedRec } from './picked-rec.ts'

export type Profile = {
    id: string,
    displayName: string,
    recs: string[],
    pickedRecs: PickedRec[]
}

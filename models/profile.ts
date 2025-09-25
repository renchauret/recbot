import type { PickedRec } from './pickedRec.ts'

export type Profile = {
    id: string,
    displayName: string,
    recs: string[],
    pickedRecs: PickedRec[]
}

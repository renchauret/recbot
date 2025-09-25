export type PickedRec = {
    name: string,
    pickedDate: number
}

export type Profile = {
    id: string,
    displayName: string,
    recs: string[],
    pickedRecs: PickedRec[]
}

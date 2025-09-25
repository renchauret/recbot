export type Profile = {
    id: string,
    displayName: string,
    recs: string[],
    recsPicked: number,
    lastRecPickedDate: number | null
}
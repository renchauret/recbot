export type PickedRec = {
    name: string,
    pickedDate: number,
    // Set once the club has been prompted to discuss it. Absent on picks made
    // before discussions were tracked.
    discussed?: boolean
}
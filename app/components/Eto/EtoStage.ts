export enum EtoStage {
  Apply,
  Locking,
  Result
}
let currentTimestamp = new Date();
const LockingTime = new Date();
export const setCurrentTimestamp = (timeStamp: Date) =>
  (currentTimestamp = timeStamp);
// export const getCurrentEtoStage =

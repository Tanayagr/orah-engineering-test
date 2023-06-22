import { Roll } from "shared/models/roll"

export interface Activity {
  type: "roll"
  date: Date
  entity: Roll
}

export const ActivityHelper = {
  formateDate: (dStr: Date) => {
    const d = new Date(dStr)
    return `${d.toDateString()}`
  },
}

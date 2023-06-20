import React, { useMemo } from "react"
import styled from "styled-components"
import Button from "@material-ui/core/Button"
import { BorderRadius, Spacing } from "shared/styles/styles"
import { RollStateList } from "staff-app/components/roll-state/roll-state-list.component"
import { Person } from "shared/models/person"
import { RollStateType } from "shared/models/roll"

export type ActiveRollAction = "filter" | "exit" | "complete"
interface Props {
  students: Person[]
  isActive: boolean
  onItemClick: (action: ActiveRollAction, value?: string) => void
}

export const ActiveRollOverlay: React.FC<Props> = (props) => {
  const { students, isActive, onItemClick } = props

  const stateList = useMemo(() => {
    const rollStateCounts: { [k in RollStateType | "all"]: number } = students.reduce(
      (acc, student) => {
        if (student.roll_state) {
          acc[student.roll_state]++
        }
        acc.all++
        return acc
      },
      { all: 0, present: 0, late: 0, absent: 0, unmark: 0 }
    )
    return Object.keys(rollStateCounts)
      .filter((k) => k !== "unmark")
      .map((rollState) => {
        return {
          type: rollState as RollStateType,
          count: rollStateCounts[rollState as RollStateType],
        }
      })
  }, [students])

  return (
    <S.Overlay isActive={isActive}>
      <S.Content>
        <div>Class Attendance</div>
        <div>
          <RollStateList stateList={stateList} onItemClick={(type) => onItemClick("filter", type)} />
          <div style={{ marginTop: Spacing.u6 }}>
            <Button color="inherit" onClick={() => onItemClick("exit")}>
              Exit
            </Button>
            <Button color="inherit" style={{ marginLeft: Spacing.u2 }} onClick={() => onItemClick("complete")}>
              Complete
            </Button>
          </div>
        </div>
      </S.Content>
    </S.Overlay>
  )
}

const S = {
  Overlay: styled.div<{ isActive: boolean }>`
    position: fixed;
    bottom: 0;
    left: 0;
    height: ${({ isActive }) => (isActive ? "120px" : 0)};
    width: 100%;
    background-color: rgba(34, 43, 74, 0.92);
    backdrop-filter: blur(2px);
    color: #fff;
  `,
  Content: styled.div`
    display: flex;
    justify-content: space-between;
    width: 52%;
    height: 100px;
    margin: ${Spacing.u3} auto 0;
    border: 1px solid #f5f5f536;
    border-radius: ${BorderRadius.default};
    padding: ${Spacing.u4};
  `,
}

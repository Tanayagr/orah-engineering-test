import React, { useState, useEffect, useMemo, useCallback, useReducer } from "react"
import styled from "styled-components"
import Button from "@material-ui/core/ButtonBase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Spacing, BorderRadius, FontWeight } from "shared/styles/styles"
import { Colors } from "shared/styles/colors"
import { CenteredContainer } from "shared/components/centered-container/centered-container.component"
import { Person, PersonHelper } from "shared/models/person"
import { useApi } from "shared/hooks/use-api"
import { StudentListTile } from "staff-app/components/student-list-tile/student-list-tile.component"
import { ActiveRollOverlay, ActiveRollAction } from "staff-app/components/active-roll-overlay/active-roll-overlay.component"
import debounce from "shared/helpers/debounce"
import { EventManagerInstance } from "shared/helpers/event-manager"
import { Roll, RollStateType } from "shared/models/roll"

const sortByLabels = {
  firstName: "First Name",
  lastName: "Last Name",
}
const sortOrderSortFactorMapping = { ASC: 1, DSC: -1 }
const sortByTransformFnMapping = {
  firstName: PersonHelper.getFullNameByFirstName,
  lastName: PersonHelper.getFullNameByLastName,
}

export const HomeBoardPage: React.FC = () => {
  const [isRollMode, setIsRollMode] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [rolls, setRolls] = useState<{ [k: string]: RollStateType }>({})
  const [selectedRollState, setSelectedRollState] = useState<RollStateType | "all">("all")
  const [getStudents, data, loadState] = useApi<{ students: Person[] }>({
    url: "get-homeboard-students",
  })
  const [saveActiveRoll] = useApi<{ rolls: Roll[] }>({ url: "save-roll" })
  const [toggleSortOptions, sortState] = useHomePageSort({
    sortBy: "firstName",
    sortOrder: "ASC",
  })

  const dataWithRollState = useMemo(() => {
    return {
      ...data,
      students: [...(data?.students ?? [])].map((student) => {
        return { ...student, roll_state: rolls[student.id] ?? "unmark" } as Person
      }),
    }
  }, [data, rolls])

  const sortedData = useMemo(() => {
    const sortFactor = sortOrderSortFactorMapping[sortState.sortOrder]
    const transformFn = sortByTransformFnMapping[sortState.sortBy]
    return {
      ...dataWithRollState,
      students: [...dataWithRollState.students].sort((a, b) => {
        const aFullName = transformFn(a).toLowerCase()
        const bFullName = transformFn(b).toLowerCase()
        return aFullName < bFullName ? -sortFactor : sortFactor
      }),
    }
  }, [dataWithRollState, sortState])

  const filteredSortedData = useMemo(() => {
    const filteredStudentsOnSearchText = [...sortedData.students].filter((student) => {
      const fullName = PersonHelper.getFullNameByFirstName(student).toLowerCase()
      return fullName.includes(searchText)
    })
    const filteredStudentsOnRollState =
      selectedRollState === "all"
        ? filteredStudentsOnSearchText
        : filteredStudentsOnSearchText.filter((student) => {
            return student.roll_state === selectedRollState
          })
    return {
      ...sortedData,
      students: filteredStudentsOnRollState,
    }
  }, [sortedData, searchText, selectedRollState])

  useEffect(() => {
    const unsubscribe = EventManagerInstance.subscribe("rollStateChange", (payload: { student: Person; newState: RollStateType }) => {
      const { student, newState } = payload
      setRolls((prevRolls) => {
        return {
          ...prevRolls,
          [student.id]: newState,
        }
      })
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    void getStudents()
  }, [getStudents])

  const onToolbarAction = useCallback((action: ToolbarAction, value?: ToolbarActionValues) => {
    if (action === "roll") {
      setIsRollMode(true)
    } else if (action === "sort") {
      toggleSortOptions(value)
    }
  }, [])

  const onActiveRollAction = useCallback((action: ActiveRollAction, value?: string) => {
    if (action === "exit") {
      setIsRollMode(false)
    } else if (action === "filter") {
      setSelectedRollState(value as RollStateType | "all")
    } else if (action === "complete") {
      setIsRollMode(false)
    }
  }, [])

  const onSearchTextChange = useCallback(
    debounce((newValue: string) => {
      setSearchText(newValue.toLowerCase().trim())
    }, 300),
    []
  )

  return (
    <>
      <S.PageContainer>
        <Toolbar sortBy={sortState.sortBy} sortOrder={sortState.sortOrder} onItemClick={onToolbarAction} onSearchTextChange={onSearchTextChange} />

        {loadState === "loading" && (
          <CenteredContainer>
            <FontAwesomeIcon icon="spinner" size="2x" spin />
          </CenteredContainer>
        )}

        {loadState === "loaded" && data?.students && (
          <>
            {filteredSortedData.students.map((s) => (
              <StudentListTile key={s.id} isRollMode={isRollMode} student={s} />
            ))}
          </>
        )}

        {loadState === "error" && (
          <CenteredContainer>
            <div>Failed to load</div>
          </CenteredContainer>
        )}
      </S.PageContainer>
      <ActiveRollOverlay isActive={isRollMode} students={dataWithRollState.students} onItemClick={onActiveRollAction} />
    </>
  )
}

type ToolbarAction = "roll" | "sort"
type ToolbarActionValues = keyof HomePageSortOptions

interface ToolbarProps {
  sortBy: SortBy
  sortOrder: SortOrder
  onItemClick: (action: ToolbarAction, value?: ToolbarActionValues) => void
  onSearchTextChange: (searchText: string) => void
}
const Toolbar: React.FC<ToolbarProps> = (props) => {
  const { sortBy, sortOrder, onItemClick, onSearchTextChange } = props
  return (
    <S.ToolbarContainer>
      <div>
        <S.Button onClick={() => onItemClick("sort", "sortBy")}>{sortByLabels[sortBy]}</S.Button>
        <S.Button onClick={() => onItemClick("sort", "sortOrder")}>{sortOrder}</S.Button>
      </div>
      <div>
        <input type="text" placeholder="Search" onChange={(e) => onSearchTextChange(e.target.value)} />
      </div>
      <S.Button onClick={() => onItemClick("roll")}>Start Roll</S.Button>
    </S.ToolbarContainer>
  )
}

const S = {
  PageContainer: styled.div`
    display: flex;
    flex-direction: column;
    width: 50%;
    margin: ${Spacing.u4} auto 140px;
  `,
  ToolbarContainer: styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #fff;
    background-color: ${Colors.blue.base};
    padding: 6px 14px;
    font-weight: ${FontWeight.strong};
    border-radius: ${BorderRadius.default};
  `,
  Button: styled(Button)`
    && {
      padding: ${Spacing.u2};
      font-weight: ${FontWeight.strong};
      border-radius: ${BorderRadius.default};
    }
  `,
}

type SortBy = "firstName" | "lastName"
type SortOrder = "ASC" | "DSC"

interface HomePageSortOptions {
  sortBy: SortBy
  sortOrder: SortOrder
}

function useHomePageSort({ sortBy, sortOrder }: HomePageSortOptions) {
  const [state, dispatch] = useReducer(
    (state: HomePageSortOptions, action: { type?: keyof HomePageSortOptions }): HomePageSortOptions => {
      switch (action.type) {
        case "sortBy": {
          return { ...state, sortBy: state.sortBy === "firstName" ? "lastName" : "firstName" }
        }
        case "sortOrder": {
          return { ...state, sortOrder: state.sortOrder === "ASC" ? "DSC" : "ASC" }
        }
        default: {
          return state
        }
      }
    },
    { sortBy, sortOrder }
  )

  const toggleSort = useCallback((type?: keyof HomePageSortOptions) => {
    dispatch({ type })
  }, [])

  return [toggleSort, state] as const
}

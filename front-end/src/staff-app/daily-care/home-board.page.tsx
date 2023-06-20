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
  const [getStudents, data, loadState] = useApi<{ students: Person[] }>({
    url: "get-homeboard-students",
  })
  const [toggleSortOptions, sortState] = useHomePageSort({
    sortBy: "firstName",
    sortOrder: "ASC",
  })
  const sortedData = useMemo(() => {
    const sortFactor = sortOrderSortFactorMapping[sortState.sortOrder]
    const transformFn = sortByTransformFnMapping[sortState.sortBy]
    return {
      ...data,
      students: [...(data?.students ?? [])].sort((a, b) => {
        const aFullName = transformFn(a).toLowerCase()
        const bFullName = transformFn(b).toLowerCase()
        return aFullName < bFullName ? -sortFactor : sortFactor
      }),
    }
  }, [data, sortState])
  const filteredSortedData = useMemo(() => {
    return {
      ...sortedData,
      students: [...sortedData.students].filter((student) => {
        const fullName = PersonHelper.getFullNameByFirstName(student).toLowerCase()
        return fullName.includes(searchText)
      }),
    }
  }, [sortedData, searchText])

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

  const onActiveRollAction = useCallback((action: ActiveRollAction) => {
    if (action === "exit") {
      setIsRollMode(false)
    }
  }, [])

  const onSearchTextChange = useCallback(
    debounce((newValue: string) => {
      setSearchText(newValue.toLowerCase())
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
          <>{filteredSortedData.students.map((s) => (console.log("aa"), (<StudentListTile key={s.id} isRollMode={isRollMode} student={s} />)))}</>
        )}

        {loadState === "error" && (
          <CenteredContainer>
            <div>Failed to load</div>
          </CenteredContainer>
        )}
      </S.PageContainer>
      <ActiveRollOverlay isActive={isRollMode} onItemClick={onActiveRollAction} />
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

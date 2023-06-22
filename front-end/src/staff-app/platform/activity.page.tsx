import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useEffect } from "react"
import { CenteredContainer } from "shared/components/centered-container/centered-container.component"
import { useApi } from "shared/hooks/use-api"
import { Activity } from "shared/models/activity"
import { Spacing } from "shared/styles/styles"
import { ActivityListTile } from "staff-app/components/activity-list-tile/activity-list-tile.component"
import styled from "styled-components"

export const ActivityPage: React.FC = () => {
  const [getActivities, data, loadState] = useApi<{ activity: Activity[] }>({
    url: "get-activities",
  })

  useEffect(() => {
    void getActivities()
  }, [getActivities])

  return (
    <S.Container>
      <S.Heading>Activity Page</S.Heading>

      {loadState === "loading" && (
        <CenteredContainer>
          <FontAwesomeIcon icon="spinner" size="2x" spin />
        </CenteredContainer>
      )}

      {loadState === "loaded" && data?.activity && (
        <>
          {data.activity.map((a) => (
            <ActivityListTile key={a.entity.id} activity={a}></ActivityListTile>
          ))}
        </>
      )}

      {loadState === "error" && (
        <CenteredContainer>
          <div>Failed to load</div>
        </CenteredContainer>
      )}
    </S.Container>
  )
}

const S = {
  Container: styled.div`
    display: flex;
    flex-direction: column;
    width: 50%;
    margin: ${Spacing.u4} auto 0;
  `,
  Heading: styled.div``,
}

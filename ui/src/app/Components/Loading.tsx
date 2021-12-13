import * as React from 'react';
import { Grid, GridItem, Skeleton } from '@patternfly/react-core';

export const Loading: React.FunctionComponent<{
  variant: "table" | "dashboard"
}> = (props) => {
  if (props.variant == "dashboard") {
    return (
      <React.Fragment>
        <Grid hasGutter={true}>
          <GridItem span={6}>
            <br/>
            <Skeleton />
          </GridItem>
          <GridItem span={3} rowSpan={2}>
            <br/>
            <Skeleton height="100%"/>
          </GridItem>
          <GridItem span={3} rowSpan={2}>
            <br/>
            <Skeleton height="100%"/>
          </GridItem>
          <GridItem span={6}>
            <br/>
            <Skeleton />
          </GridItem>
          <GridItem span={6}>
            <br/>
            <Skeleton />
          </GridItem>
        </Grid>
      </React.Fragment>
    )
  } else {
    return (
      <React.Fragment>
        <br/>
        <Skeleton />
        <br/>
        <Skeleton />
        <br/>
        <Skeleton />
      </React.Fragment>
    )
  }
}

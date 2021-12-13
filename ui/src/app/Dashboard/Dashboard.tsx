import * as React from 'react';
import {
  Alert, Bullseye,
  Card,
  CardBody,
  CardTitle,
  DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm,
  Grid,
  GridItem,
  PageSection,
  TextContent, Text, TextVariants
} from '@patternfly/react-core';
import { fetchWithErrorHandling } from '@app/utils/fetchWithErrorHandling';
import { useEffect, useRef, useState } from 'react';
import { ChartDonutUtilization } from '@patternfly/react-charts';
import { Loading } from '@app/Components/Loading';
import { usePageVisibility } from 'react-page-visibility';

interface DashboardInfo {
  kube_cluster: string
  kube_version: string
  chop_count: number
  chop_count_available: number
  chi_count: number
  chi_count_complete: number
}

export const Dashboard: React.FunctionComponent = () => {
  const [dashboardInfo, setDashboardInfo] = useState<DashboardInfo|undefined>(undefined)
  const [retrieveError, setRetrieveError] = useState<string|undefined>(undefined)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const mounted = useRef(false)
  const pageVisible = useRef(true)
  pageVisible.current = usePageVisibility()
  const fetchData = () => {
    fetchWithErrorHandling(`/api/v1/dashboard`, 'GET',
      undefined,
      (response, body) => {
        setRetrieveError(undefined)
        setDashboardInfo(body as DashboardInfo)
        setIsPageLoading(false)
        return mounted.current ? 2000 : 0
      },
      (response, text, error) => {
        const errorMessage = (error == "") ? text : `${error}: ${text}`
        setRetrieveError(`Error retrieving CHIs: ${errorMessage}`)
        setDashboardInfo(undefined)
        setIsPageLoading(false)
        return mounted.current ? 10000 : 0
      },
      () => {
        if (!mounted.current) {
          return -1
        } else if (!pageVisible.current) {
          return 2000
        } else {
          return 0
        }
      })
  }
  useEffect(() => {
    mounted.current = true
    fetchData()
    return () => {
      mounted.current = false
    }
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [])
  const retrieveErrorPane = retrieveError === undefined ? null : (
    <Alert variant="danger" title={retrieveError} isInline/>
  )
  const version = (document.querySelector('meta[name="version"]') as HTMLMetaElement)?.content || "unknown"
  const chopRelease = (document.querySelector('meta[name="chop-release"]') as HTMLMetaElement)?.content || "unknown"
  return (
    <PageSection>
      {isPageLoading ? (
        <React.Fragment>
          <Loading variant="dashboard"/>
        </React.Fragment>
      ) : (
        <React.Fragment>
          {retrieveErrorPane}
          <Grid hasGutter={true} lg={4} md={6} sm={12}>
            <GridItem>
              <Card>
                <CardTitle>Details</CardTitle>
                <CardBody>
                  <DescriptionList>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        Altinity Dashboard
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {dashboardInfo ? (
                          <PageSection>
                            <div>altinity-dashboard: {version}</div>
                            <div>clickhouse-operator: {chopRelease}</div>
                          </PageSection>
                        ) : "unknown"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        Kubernetes Cluster
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {dashboardInfo ? (
                          <PageSection>
                            <div>k8s api: {dashboardInfo.kube_cluster}</div>
                            <div>k8s version: {dashboardInfo.kube_version}</div>
                          </PageSection>
                        ) : "unknown"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card>
                <CardTitle>ClickHouse Operators</CardTitle>
                <CardBody>
                  <Bullseye>
                    {dashboardInfo ? (
                      <div style={{ height: '230px', width: '230px' }}>
                        <ChartDonutUtilization
                          constrainToVisibleArea={true}
                          data={{
                            x: 'Available', y:
                              dashboardInfo.chop_count > 0
                                ? 100 * dashboardInfo.chop_count_available / dashboardInfo.chop_count
                                : 0
                          }}
                          title={dashboardInfo.chop_count_available.toString() + " available"}
                          subTitle={"of " + dashboardInfo.chop_count.toString() + " total"}
                        />
                      </div>
                    ) : "unknown"}
                  </Bullseye>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card>
                <CardTitle>ClickHouse Installations</CardTitle>
                <CardBody>
                  <Bullseye>
                    {dashboardInfo ? (
                      <div style={{ height: '230px', width: '230px' }}>
                        <ChartDonutUtilization
                          constrainToVisibleArea={true}
                          data={{
                            x: 'Complete', y:
                              dashboardInfo.chi_count > 0
                                ? 100 * dashboardInfo.chi_count_complete / dashboardInfo.chi_count
                                : 0
                          }}
                          title={dashboardInfo.chi_count_complete.toString() + " complete"}
                          subTitle={"of " + dashboardInfo.chi_count.toString() + " total"}
                        />
                      </div>
                    ) : "unknown"}
                  </Bullseye>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
          <TextContent>
            <Bullseye className="padded-bullseye">
              <Text component={TextVariants.small}>
                Altinity and the Altinity logos are trademarks of Altinity, Inc.&nbsp;&nbsp;&nbsp;ClickHouse and the ClickHouse logos are trademarks of ClickHouse, Inc.
              </Text>
            </Bullseye>
          </TextContent>
        </React.Fragment>
      )}
    </PageSection>
  )
}

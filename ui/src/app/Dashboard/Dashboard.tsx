import * as React from 'react';
import {
  Alert, Bullseye,
  Card,
  CardBody,
  CardTitle,
  DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm,
  Grid,
  GridItem,
  PageSection
} from '@patternfly/react-core';
import { AppRoutesProps } from '@app/routes';
import { fetchWithErrorHandling } from '@app/utils/fetchWithErrorHandling';
import { useEffect, useState } from 'react';
import { ChartDonutUtilization } from '@patternfly/react-charts';

interface DashboardInfo {
  version: string
  chop_version: string
  kube_cluster: string
  kube_version: string
  chop_count: number
  chop_count_available: number
  chi_count: number
  chi_count_complete: number
}

export const Dashboard: React.FunctionComponent<AppRoutesProps> = () => {
  const [dashboardInfo, setDashboardInfo] = useState<DashboardInfo|undefined>(undefined)
  const [retrieveError, setRetrieveError] = useState<string|undefined>(undefined)
  const fetchData = () => {
    fetchWithErrorHandling(`/api/v1/dashboard`, 'GET',
      undefined,
      (response, body) => {
        setRetrieveError(undefined)
        setDashboardInfo(body as DashboardInfo)
      },
      (response, text, error) => {
        const errorMessage = (error == "") ? text : `${error}: ${text}`
        setRetrieveError(`Error retrieving CHIs: ${errorMessage}`)
        setDashboardInfo(undefined)
      })
  }
  useEffect(() => {
      fetchData()
      const timer = setInterval(() => fetchData(), 2000)
      return () => {
        clearInterval(timer)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [])
  const retrieveErrorPane = retrieveError === undefined ? null : (
    <Alert variant="danger" title={retrieveError} isInline/>
  )
  return (
    <PageSection>
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
                      <div>altinity-dashboard: {dashboardInfo.version}</div>
                      <div>clickhouse-operator: {dashboardInfo.chop_version}</div>
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
                      data={{ x: 'Available', y:
                          dashboardInfo.chop_count > 0
                            ? 100 * dashboardInfo.chop_count_available / dashboardInfo.chop_count
                            : 0
                      }}
                      title={ dashboardInfo.chop_count_available.toString() + " available" }
                      subTitle={ "of " + dashboardInfo.chop_count.toString() + " total"}
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
                      data={{ x: 'Complete', y:
                          dashboardInfo.chi_count > 0
                            ? 100 * dashboardInfo.chi_count_complete / dashboardInfo.chi_count
                            : 0
                      }}
                      title={ dashboardInfo.chi_count_complete.toString() + " complete" }
                      subTitle={ "of " + dashboardInfo.chi_count.toString() + " total"}
                    />
                  </div>
                ) : "unknown"}
              </Bullseye>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </PageSection>
  )
}

import * as React from 'react';
import { ReactElement, useEffect, useState } from 'react';
import {
  Alert,
  AlertVariant,
  ButtonVariant,
  PageSection,
  Split,
  SplitItem,
  Tab,
  Tabs,
  TabTitleText,
  Title
} from '@patternfly/react-core';
import { AppRoutesProps } from '@app/routes';
import { ToggleModal } from '@app/Components/ToggleModal';
import { SimpleModal } from '@app/Components/SimpleModal';
import { fetchWithErrorHandling } from '@app/utils/fetchWithErrorHandling';
import { CHIModal } from '@app/CHIs/CHIModal';
import { ExpandableTable } from '@app/Components/ExpandableTable';
import { CHI } from '@app/CHIs/model';
import { ExpandableRowContent, TableComposable, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { humanFileSize } from '@app/utils/humanFileSize';

export const CHIs: React.FunctionComponent<AppRoutesProps> = (props: AppRoutesProps) => {
  const [CHIs, setCHIs] = useState(new Array<CHI>())
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<CHI|undefined>(undefined)
  const [retrieveError, setRetrieveError] = useState<string|undefined>(undefined)
  const [activeTabKeys, setActiveTabKeys] = useState<Map<string,string|number>>(new Map())
  const addAlert = props.addAlert
  const fetchData = () => {
    fetchWithErrorHandling(`/api/v1/chis`, 'GET',
      undefined,
      (response, body) => {
        setCHIs(body as CHI[])
        setRetrieveError(undefined)
      },
      (response, text, error) => {
        const errorMessage = (error == "") ? text : `${error}: ${text}`
        setRetrieveError(`Error retrieving CHIs: ${errorMessage}`)
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
  const onDeleteClick = (item: CHI) => {
    setActiveItem(item)
    setIsDeleteModalOpen(true)
  }
  const onDeleteActionClick = () => {
    if (activeItem === undefined) {
      return
    }
    fetchWithErrorHandling(`/api/v1/chis/${activeItem.namespace}/${activeItem.name}`, 'DELETE',
      undefined,
      undefined,
      (response, text, error) => {
        const errorMessage = (error == "") ? text : `${error}: ${text}`
        addAlert(`Error deleting CHI: ${errorMessage}`, AlertVariant.danger)
      })
  }
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setActiveItem(undefined)
  }
  const onEditClick = (item: CHI) => {
    setActiveItem(item)
    setIsEditModalOpen(true)
  }
  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setActiveItem(undefined)
  }
  const retrieveErrorPane = retrieveError === undefined ? null : (
    <Alert variant="danger" title={retrieveError} isInline/>
  )
  const getActiveTabKey = (key: string) => {
    const result = activeTabKeys.get(key)
    if (result) {
      return result
    } else {
      return 0
    }
  }
  return (
    <PageSection>
      <SimpleModal
        title="Delete ClickHouse Installation?"
        positionTop={true}
        actionButtonText="Delete"
        actionButtonVariant={ButtonVariant.danger}
        isModalOpen={isDeleteModalOpen}
        onActionClick={onDeleteActionClick}
        onClose={closeDeleteModal}
      >
        The ClickHouse Installation named <b>{activeItem ? activeItem.name : "UNKNOWN"}</b> will
        be removed from the <b>{activeItem ? activeItem.namespace : "UNKNOWN"}</b> namespace.
      </SimpleModal>
      <CHIModal
        addAlert={props.addAlert}
        closeModal={closeEditModal}
        isUpdate={true}
        isModalOpen={isEditModalOpen}
        CHIName={activeItem ? activeItem.name : ""}
        CHINamespace={activeItem ? activeItem.namespace : ""}
      />
      <Split>
        <SplitItem isFilled>
          <Title headingLevel="h1" size="lg">
            ClickHouse Installations
          </Title>
        </SplitItem>
        <SplitItem>
          <ToggleModal modal={CHIModal} addAlert={addAlert}/>
        </SplitItem>
      </Split>
      {retrieveErrorPane}
      <ExpandableTable
        keyPrefix="CHIs"
        data={CHIs}
        columns={['Name', 'Namespace', 'Status', 'Clusters', 'Hosts']}
        column_fields={['name', 'namespace', 'status', 'clusters', 'hosts']}
        data_modifier={(data: object, field: string): ReactElement|string => {
          if (field === "name" && "external_url" in data && data["external_url"]) {
            return (
              <a target="_blank" rel="noreferrer"
                 href={new URL("/play", data["external_url"]).href}>
                {data["name"]}
              </a>
            )
          } else {
            return data[field]
          }
        }}
        actions={(item: CHI) => {
          return {
            items: [
              {
                title: "Edit",
                variant: "primary",
                onClick: () => {onEditClick(item)}
              },
              {
                title: "Delete",
                variant: "danger",
                onClick: () => {onDeleteClick(item)}
              },
            ]
          }
        }}
        expanded_content={(data) => (
          <ExpandableTable
            table_variant="compact"
            keyPrefix="CHI-pods"
            data={data.ch_cluster_pods}
            columns={['Cluster', 'Pod', 'Status']}
            column_fields={['cluster_name', 'name', 'status']}
            expanded_content={(data) => (
              <Tabs activeKey={getActiveTabKey(data.name)} onSelect={
                (event: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: string|number) => {
                  setActiveTabKeys(new Map(activeTabKeys.set(data.name, eventKey)))
                }
              }>
                <Tab eventKey={0} title={<TabTitleText>Containers</TabTitleText>}>
                  <ExpandableTable
                    table_variant="compact"
                    keyPrefix="operator-containers"
                    data={data.containers}
                    columns={['Container', 'State', 'Image']}
                    column_fields={['name', 'state', 'image']}
                  />
                </Tab>
                <Tab eventKey={1} title={<TabTitleText>Storage</TabTitleText>}>
                  <TableComposable variant={TableVariant.compact} className="table-no-extra-padding">
                    <Thead>
                      <Tr>
                        <Th key={`storage-pvc-header-col-1`}>PVC Name</Th>
                        <Th key={`storage-pvc-header-col-2`}>Phase</Th>
                        <Th key={`storage-pvc-header-col-3`}>Capacity</Th>
                        <Th key={`storage-pvc-header-col-4`}>Class</Th>
                      </Tr>
                    </Thead>
                    {
                      data.pvcs.map((dataItem, dataIndex) => (
                        <Tbody key={dataIndex}>
                          <Tr key={`storage-pvc-${dataIndex}`} isExpanded={dataItem.bound_pv !== undefined}>
                            <Td key={`storage-pvc-${dataIndex}-col-1`}>{dataItem.name}</Td>
                            <Td key={`storage-pvc-${dataIndex}-col-2`}>{dataItem.phase}</Td>
                            <Td key={`storage-pvc-${dataIndex}-col-3`}>{humanFileSize(dataItem.capacity)}</Td>
                            <Td key={`storage-pvc-${dataIndex}-col-4`}>{dataItem.storage_class}</Td>
                          </Tr>
                          <Tr key={`storage-pv-${dataIndex}`}>
                            <Td colSpan={4} noPadding={true}>
                              <ExpandableRowContent>
                                <TableComposable variant={TableVariant.compact} borders={false} isNested={true}>
                                  <Thead noWrap={true}>
                                    <Tr>
                                      <Th key={`storage-pv-hdr-col-1`}>PV Name</Th>
                                      <Th key={`storage-pv-hdr-col-2`}>Phase</Th>
                                      <Th key={`storage-pv-hdr-col-3`}>Capacity</Th>
                                      <Th key={`storage-pv-hdr-col-4`}>Class</Th>
                                      <Th key={`storage-pv-hdr-col-5`}>Reclaim Policy</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    <Tr>
                                      <Th key={`storage-pv-${dataIndex}-col-1`}>{dataItem.bound_pv?.name}</Th>
                                      <Th key={`storage-pv-${dataIndex}-col-2`}>{dataItem.bound_pv?.phase}</Th>
                                      <Th key={`storage-pv-${dataIndex}-col-3`}>{humanFileSize(dataItem.bound_pv?.capacity)}</Th>
                                      <Th key={`storage-pv-${dataIndex}-col-4`}>{dataItem.bound_pv?.storage_class}</Th>
                                      <Th key={`storage-pv-${dataIndex}-col-5`}>{dataItem.bound_pv?.reclaim_policy}</Th>
                                    </Tr>
                                  </Tbody>
                                </TableComposable>
                              </ExpandableRowContent>
                            </Td>
                          </Tr>
                        </Tbody>
                      ))
                    }
                  </TableComposable>
                </Tab>
              </Tabs>
            )}
          />
        )}
      />
    </PageSection>
  )
}

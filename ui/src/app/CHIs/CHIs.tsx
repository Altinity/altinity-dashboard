import * as React from 'react';
import {
  Alert,
  AlertVariant,
  ButtonVariant,
  PageSection,
  Split,
  SplitItem,
  Title
} from '@patternfly/react-core';
import { AppRoutesProps } from '@app/routes';
import { ReactElement, useEffect, useState } from 'react';
import { ToggleModal } from '@app/Components/ToggleModal';
import { SimpleModal } from '@app/Components/SimpleModal';
import { fetchWithErrorHandling } from '@app/utils/fetchWithErrorHandling';
import { NewCHIModal } from '@app/CHIs/NewCHIModal';
import { ExpandableTable } from '@app/Components/ExpandableTable';

interface Container {
  name: string
  state: string
  image: string
}

interface CHClusterPod {
  cluster_name: string
  name: string
  status: string
  containers: Array<Container>
}

interface CHI {
  name: string
  namespace: string
  status: string
  clusters: bigint
  hosts: bigint
  external_url: string
  ch_cluster_pods: Array<CHClusterPod>
}

export const CHIs: React.FunctionComponent<AppRoutesProps> = (props: AppRoutesProps) => {
  const [CHIs, setCHIs] = useState(new Array<CHI>())
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<CHI|undefined>(undefined)
  const [retrieveError, setRetrieveError] = useState<string|undefined>(undefined)
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
    setItemToDelete(item)
    setIsDeleteModalOpen(true)
  }
  const onDeleteActionClick = () => {
    if (itemToDelete === undefined) {
      return
    }
    fetchWithErrorHandling(`/api/v1/chis/${itemToDelete.namespace}/${itemToDelete.name}`, 'DELETE',
      undefined,
      undefined,
      (response, text, error) => {
        const errorMessage = (error == "") ? text : `${error}: ${text}`
        addAlert(`Error deleting CHI: ${errorMessage}`, AlertVariant.danger)
      })
  }
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setItemToDelete(undefined)
  }
  const retrieveErrorPane = retrieveError === undefined ? null : (
    <Alert variant="danger" title={retrieveError} isInline/>
  )
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
        The ClickHouse Installation named <b>{itemToDelete ? itemToDelete.name : "UNKNOWN"}</b> will
        be removed from the <b>{itemToDelete ? itemToDelete.namespace : "UNKNOWN"}</b> namespace.
      </SimpleModal>
      <Split>
        <SplitItem isFilled>
          <Title headingLevel="h1" size="lg">
            ClickHouse Installations
          </Title>
        </SplitItem>
        <SplitItem>
          <ToggleModal modal={NewCHIModal} addAlert={addAlert}/>
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
              <ExpandableTable
                table_variant="compact"
                keyPrefix="operator-containers"
                data={data.containers}
                columns={['Container', 'State', 'Image']}
                column_fields={['name', 'state', 'image']}
              />
            )}
          />
        )}
      />
    </PageSection>
  )
}

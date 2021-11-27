import * as React from 'react';
import {
  AlertVariant, Bullseye,
  Button,
  ButtonVariant,
  Grid, GridItem,
  Modal,
  ModalVariant,
  PageSection,
  Split,
  SplitItem, TextInput,
  Title
} from '@patternfly/react-core';
import { NamespaceSelector } from '@app/Namespaces/Namespaces';
import { SimpleModal } from '@app/Components/SimpleModal';
import { useEffect, useState } from 'react';
import { ExpandableTable } from '@app/Components/ExpandableTable';
import { DataTable } from '@app/Components/DataTable';
import { AppRoutesProps } from '@app/routes';
import { ToggleModal, ToggleModalSubProps } from '@app/Components/ToggleModal';
import chopLogo from '@app/images/altinity-clickhouse-operator-kubernetes.jpg';

interface OperatorContainer {
  name: string
  state: string
  image: string
}

interface OperatorPod {
  name: string
  status: string
  version: string
  containers: Array<OperatorContainer>
}

interface Operator {
  name: string
  namespace: string
  conditions: string
  version: string
  pods: Array<OperatorPod>
}

const NewOperatorModal: React.FunctionComponent<ToggleModalSubProps> = (props: ToggleModalSubProps) => {
  const {addAlert, isModalOpen} = props
  const [selectedVersion, setSelectedVersion] = useState("")
  const [selectedNamespace, setSelectedNamespace] = useState("")
  const closeModal = (): void => {
    setSelectedVersion("")
    setSelectedNamespace("")
    props.closeModal()
  }
  const onDeployClick = (): void => {
    fetch(`/api/v1/operators/${selectedNamespace}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: selectedVersion
      })
    })
      .then(response => {
        closeModal()
        if (!response.ok) {
          response.text().then(text => {
            throw Error(`${response.statusText}: ${text}`)
          })
        }
      })
      .catch(error => {
        closeModal()
        addAlert(`Error updating operator: ${error.message}`, AlertVariant.danger)
      })
  }
  return (
    <Modal
      title="Deploy ClickHouse Operator"
      variant={ModalVariant.small}
      isOpen={isModalOpen}
      onClose={closeModal}
      position="top"
      actions={[
        <Button key="deploy" variant="primary"
                onClick={onDeployClick} isDisabled={selectedNamespace === ""}>
          Deploy
        </Button>,
        <Button key="cancel" variant="link" onClick={closeModal}>
          Cancel
        </Button>
      ]}
    >
      <Grid hasGutter={true}>
        <GridItem span={7}>
          <div>
            Version (leave blank for latest):
          </div>
          <TextInput
            value={selectedVersion}
            type="text"
            onChange={setSelectedVersion}
          />
        </GridItem>
        <GridItem span={5} rowSpan={2}>
          <Bullseye>
            <img
              src={chopLogo}
              alt="Altinity ClickHouse Operator Logo"
            />
          </Bullseye>
        </GridItem>
        <GridItem span={7}>
          Select a Namespace:
          <NamespaceSelector onSelect={setSelectedNamespace}/>
        </GridItem>
      </Grid>
    </Modal>
  )
}

const Operators: React.FunctionComponent<AppRoutesProps> = (props: AppRoutesProps) => {
  const [operators, setOperators] = useState(new Array<Operator>())
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Operator|undefined>(undefined)
  const addAlert = props.addAlert
  const fetchData = () => {
    fetch('/api/v1/operators')
      .then(response => {
        if (!response.ok) {
          response.text().then(text => {
            throw Error(`${response.statusText}: ${text}`)
          })
        }
        return response.json()
      })
      .then(res => {
        setOperators(res as Operator[])
      })
      .catch(error => {
          addAlert(`Error retrieving operators: ${error.message}`, AlertVariant.danger)
        }
      )
  }
  useEffect(() => {
    fetchData()
    const timer = setInterval(() => fetchData(), 2000)
    return () => {
      clearInterval(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const onDeleteClick = (item: Operator) => {
    setItemToDelete(item)
    setIsDeleteModalOpen(true)
  }
  const onDeleteActionClick = () => {
    if (itemToDelete === undefined) {
      return
    }
    fetch(`/api/v1/operators/${itemToDelete.namespace}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          response.text().then(text => {
            throw Error(`${response.statusText}: ${text}`)
          })
        }
      })
      .catch(error => {
        addAlert(`Error deleting operator: ${error.message}`, AlertVariant.danger)
      })
  }
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setItemToDelete(undefined)
  }
  const onUpgradeClick = (item: Operator) => {
    addAlert(`Upgrade of ${item.name} not implemented yet`, AlertVariant.warning)
  }
  return (
    <PageSection>
      <SimpleModal
        title="Delete ClickHouse Operator?"
        positionTop={true}
        actionButtonText="Delete"
        actionButtonVariant={ButtonVariant.danger}
        isModalOpen={isDeleteModalOpen}
        onActionClick={onDeleteActionClick}
        onClose={closeDeleteModal}
      >
        The operator will be removed from the <b>{itemToDelete ? itemToDelete.namespace : "UNKNOWN"}</b> namespace.
      </SimpleModal>
      <Split>
        <SplitItem isFilled>
          <Title headingLevel="h1" size="lg">
            ClickHouse Operators
          </Title>
        </SplitItem>
        <SplitItem>
          <ToggleModal
            addAlert={addAlert}
            modal={NewOperatorModal}
          />
        </SplitItem>
      </Split>
      <ExpandableTable
        keyPrefix="operators"
        data={operators}
        columns={['Name', 'Namespace', 'Conditions', 'Version']}
        column_fields={['name', 'namespace', 'conditions', 'version']}
        actions={(item: Operator) => {
          return {
            items: [
              {
                title: "Upgrade",
                variant: "primary",
                onClick: () => {onUpgradeClick(item)}
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
            keyPrefix="operator-pods"
            table_variant="compact"
            data={data.pods}
            columns={['Pod', 'Status', 'Version']}
            column_fields={['name', 'status', 'version']}
            expanded_content={(data) => (
              <DataTable table_variant="compact"
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

export { Operators };

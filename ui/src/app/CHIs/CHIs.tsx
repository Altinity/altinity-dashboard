import * as React from 'react';
import {
  AlertVariant,
  Button, ButtonVariant,
  Modal,
  ModalVariant,
  PageSection,
  Split,
  SplitItem,
  Title
} from '@patternfly/react-core';
import { AppRoutesProps } from '@app/routes';
import { useEffect, useState } from 'react';
import { DataTable } from '@app/Components/DataTable';
import { NamespaceSelector } from '@app/Namespaces/Namespaces';
import { ToggleModal, ToggleModalSubProps } from '@app/Components/ToggleModal';
import { CodeEditor, Language } from '@patternfly/react-code-editor';
import { SimpleModal } from '@app/Components/SimpleModal';
import { editor } from 'monaco-editor';
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

interface CHI {
  name: string
  namespace: string
  status: string
  Clusters: bigint
  Hosts: bigint
}

const NewCHIModal: React.FunctionComponent<ToggleModalSubProps> = (props: ToggleModalSubProps) => {
  const { addAlert, isModalOpen } = props
  const outerCloseModal = props.closeModal
  const [selectedNamespace, setSelectedNamespace] = useState("")
  const [yaml, realSetYaml] = useState("")
  const closeModal = (): void => {
    setSelectedNamespace("")
    outerCloseModal()
  }
  const setYaml = (yaml: string) => {
    console.log(`yaml: ${yaml}`)
    realSetYaml(yaml)
  }
  const closeModalAndClearEditor = (): void => {
    closeModal()
    setYaml("")
  }
  const setYamlFromEditor = (editor: IStandaloneCodeEditor) => {
    console.log('yamlFromEditor')
    setYaml(editor.getValue())
  }
  const onDeployClick = (): void => {
    fetch(`/api/v1/chis`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        namespace: selectedNamespace,
        yaml: yaml
      })
    })
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText)
        }
        closeModalAndClearEditor()
      })
      .catch(error => {
        closeModal()
        addAlert(`Error deploying CHI: ${error.message}`, AlertVariant.danger)
      })
  }
  return (
    <Modal
      title="Deploy ClickHouse Installation"
      variant={ModalVariant.large}
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
      <React.Fragment>
        <CodeEditor
          isDarkTheme
          isUploadEnabled
          isDownloadEnabled
          downloadFileName={`clickhouse-${Date.now().toString()}.yaml`}
          isCopyEnabled
          isLanguageLabelVisible
          height="400px"
          language={Language.yaml}
          code={yaml}
          onChange={setYaml}
          onEditorDidMount={setYamlFromEditor}
        />
        <div>
          <div>
            Select a Namespace:
          </div>
          <NamespaceSelector onSelect={setSelectedNamespace}/>
        </div>
      </React.Fragment>
    </Modal>
  )
}

// eslint-disable-next-line prefer-const
const CHIs: React.FunctionComponent<AppRoutesProps> = (props: AppRoutesProps) => {
  const [CHIs, setCHIs] = useState(new Array<CHI>())
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<CHI|undefined>(undefined)
  const addAlert = props.addAlert
  const fetchData = () => {
    fetch('/api/v1/chis')
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText)
        }
        return response.json()
      })
      .then(res => {
        setCHIs(res as CHI[])
      })
      .catch(error => {
        addAlert(`Error retrieving ClickHouse Installations: ${error.message}`, AlertVariant.danger)
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
    fetch(`/api/v1/chis`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        namespace: itemToDelete.namespace,
        chi_name: itemToDelete.name,
      })
    })
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText)
        }
      })
      .catch(error => {
        addAlert(`Error deleting installation: ${error.message}`, AlertVariant.danger)
      })
  }
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setItemToDelete(undefined)
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
      <DataTable
        data={CHIs}
        columns={['Name', 'Namespace', 'Status', 'Clusters', 'Hosts']}
        column_fields={['name', 'namespace', 'status', 'clusters', 'hosts']}
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

      />
    </PageSection>
  )
}

export { CHIs };

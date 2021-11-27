import * as React from 'react';
import {
  Alert,
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
import { fetchWithErrorHandling } from '@app/utils/fetchWithErrorHandling';

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
    realSetYaml(yaml)
  }
  const closeModalAndClearEditor = (): void => {
    closeModal()
    setYaml("")
  }
  const setYamlFromEditor = (editor: IStandaloneCodeEditor) => {
    setYaml(editor.getValue())
  }
  const onDeployClick = (): void => {
    fetchWithErrorHandling(`/api/v1/chis`, 'PUT',
      {
        namespace: selectedNamespace,
        yaml: yaml
      },
      () => {
        closeModalAndClearEditor()
      },
      (response, text, error) => {
        const errorMessage = (error == "") ? text : `${error}: ${text}`
        addAlert(`Error deploying CHI: ${errorMessage}`, AlertVariant.danger)
        closeModal()
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
            Select a Namespace To Deploy To:
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
    fetchWithErrorHandling(`/api/v1/chis`, 'DELETE',
      {
        namespace: itemToDelete.namespace,
        chi_name: itemToDelete.name,
      },
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
      <DataTable
        keyPrefix="CHIs"
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

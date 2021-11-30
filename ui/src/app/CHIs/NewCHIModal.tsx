import * as React from 'react';
import { ToggleModalSubProps } from '@app/Components/ToggleModal';
import { useEffect, useState } from 'react';
import { fetchWithErrorHandling } from '@app/utils/fetchWithErrorHandling';
import {
  AlertVariant,
  Button,
  EmptyState, EmptyStateBody, EmptyStateIcon, EmptyStateSecondaryActions,
  Modal, ModalVariant, Title
} from '@patternfly/react-core';
import { CodeEditor, Language } from '@patternfly/react-code-editor';
import { NamespaceSelector } from '@app/Namespaces/NamespaceSelector';
import { editor } from 'monaco-editor';
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import CodeIcon from '@patternfly/react-icons/dist/esm/icons/code-icon';
import { ListSelector } from '@app/Components/ListSelector';

export const NewCHIModal: React.FunctionComponent<ToggleModalSubProps> = (props: ToggleModalSubProps) => {
  const { addAlert, isModalOpen } = props
  const outerCloseModal = props.closeModal
  const [selectedNamespace, setSelectedNamespace] = useState("")
  const [yaml, realSetYaml] = useState("")
  const [exampleListValues, setExampleListValues] = useState(new Array<string>())
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
  useEffect(() => {
    fetchWithErrorHandling(`/chi-examples/index.json`, 'GET',
      undefined,
      (response, body) => {
        const ev = body ? body as string[] : []
        setExampleListValues(ev)
      },
      () => {
        setExampleListValues([])
      }
    )
  }, [])
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
          emptyState={(
            <EmptyState height="400px">
              <EmptyStateIcon icon={CodeIcon} />
              <Title headingLevel="h4" size="lg">
                Start editing
              </Title>
              <EmptyStateBody>Drag and drop a file or click the upload icon above to upload one.</EmptyStateBody>
              <EmptyStateSecondaryActions>
                <Button variant="link" onClick={() => {setYaml(" ")}}>
                  Start from scratch
                </Button>
              </EmptyStateSecondaryActions>
              <div>
                Or start from a predefined example:
              </div>
              <div className="wide-context-selector">
                <ListSelector
                  listValues={exampleListValues}
                  onSelect={(value) => {
                    fetchWithErrorHandling(`/chi-examples/${value}`, 'GET',
                      undefined,
                      (response, body) => {
                        if (body && typeof(body) === 'string') {
                          setYaml(body)
                        }
                      },
                      undefined
                    )
                  }}
                />
              </div>
            </EmptyState>
          )}
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

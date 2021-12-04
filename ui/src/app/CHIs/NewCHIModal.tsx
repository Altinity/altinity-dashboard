import * as React from 'react';
import { ToggleModalSubProps } from '@app/Components/ToggleModal';
import { useEffect, useState } from 'react';
import { fetchWithErrorHandling } from '@app/utils/fetchWithErrorHandling';
import {
  AlertVariant, Bullseye,
  Button,
  EmptyState, EmptyStateBody, EmptyStateIcon, EmptyStateSecondaryActions, Grid, GridItem,
  Modal, ModalVariant, Title
} from '@patternfly/react-core';
import { CodeEditor, Language } from '@patternfly/react-code-editor';
import { NamespaceSelector } from '@app/Namespaces/NamespaceSelector';
import { editor } from 'monaco-editor';
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import CodeIcon from '@patternfly/react-icons/dist/esm/icons/code-icon';
import { ListSelector } from '@app/Components/ListSelector';
import { StringHasher } from '@app/Components/StringHasher';

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
        <Grid hasGutter>
          <GridItem span={12}>
            <Bullseye>
              <div>The settings available here are explained in the <a target="_blank" rel="noreferrer" href="https://github.com/Altinity/clickhouse-operator/blob/master/docs/custom_resource_explained.md">ClickHouse Custom Resource Documentation</a>.</div>
            </Bullseye>
          </GridItem>
          <GridItem span={8}>
            <div>
              Select a Namespace To Deploy To:
            </div>
            <NamespaceSelector onSelect={setSelectedNamespace}/>
          </GridItem>
          <GridItem span={4}>
            Use the <StringHasher
              title="Password Hash Calculator"
              valueName="password"
            /> to generate values for the <i>user/password_sha256_hex</i> field.
          </GridItem>
        </Grid>
      </React.Fragment>
    </Modal>
  )
}

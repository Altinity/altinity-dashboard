import * as React from 'react';
import { ToggleModalSubProps } from '@app/Components/ToggleModal';
import { useContext, useEffect, useState } from 'react';
import { fetchWithErrorHandling } from '@app/utils/fetchWithErrorHandling';
import {
  AlertVariant,
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
import { CHI } from '@app/CHIs/model';
import { AddAlertContext } from '@app/utils/alertContext';

export interface CHIModalProps extends ToggleModalSubProps {
  isUpdate?: boolean
  CHIName?: string
  CHINamespace?: string
}

export const CHIModal: React.FunctionComponent<CHIModalProps> = (props: CHIModalProps) => {
  const { isModalOpen, isUpdate, CHIName, CHINamespace } = props
  const outerCloseModal = props.closeModal
  const [selectedNamespace, setSelectedNamespace] = useState("")
  const [yaml, setYaml] = useState("")
  const [exampleListValues, setExampleListValues] = useState(new Array<string>())
  const addAlert = useContext(AddAlertContext)

  const closeModal = (): void => {
    setSelectedNamespace("")
    outerCloseModal()
  }
  const setYamlFromEditor = (editor: IStandaloneCodeEditor) => {
    setYaml(editor.getValue())
  }
  const onDeployClick = (): void => {
    const [url, method, action] = isUpdate ?
      [`/api/v1/chis/${CHINamespace}/${CHIName}`, 'PATCH', 'updating'] :
      [`/api/v1/chis/${selectedNamespace}`, 'POST', 'creating']
    fetchWithErrorHandling(url, method,
      {
        yaml: yaml
      },
      () => {
        setYaml("")
      },
      (response, text, error) => {
        const errorMessage = (error == "") ? text : `${error}: ${text}`
        addAlert(`Error ${action} CHI: ${errorMessage}`, AlertVariant.danger)
      })
    closeModal()
  }
  useEffect(() => {
    if (!isUpdate && exampleListValues.length === 0) {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdate])
  useEffect(() => {
    if (isUpdate && isModalOpen) {
      fetchWithErrorHandling(`/api/v1/chis/${CHINamespace}/${CHIName}`, 'GET',
        undefined,
        (response, body) => {
          if (typeof body === 'object') {
            setYaml((body[0] as CHI).resource_yaml);
          }
        },
        (response, text, error) => {
          addAlert(`Error retrieving CHI: ${error}`, AlertVariant.danger)
          closeModal()
        }
      )
    } else {
      setYaml("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CHIName, CHINamespace, isModalOpen, isUpdate])
  const buttons = (
    <React.Fragment>
      <Button key="deploy" variant="primary"
              onClick={onDeployClick} isDisabled={!isUpdate && selectedNamespace === ""}>
        {isUpdate ? "Update" : "Create"}
      </Button>
      <Button key="cancel" variant="link" onClick={closeModal}>
        Cancel
      </Button>
    </React.Fragment>
  )
  return (
    <Modal
      title={(isUpdate ? "Update" : "Create") + " ClickHouse Installation"}
      height="80%"
      variant={ModalVariant.large}
      isOpen={isModalOpen}
      onClose={closeModal}
      position="top"
      footer={(
        <Grid hasGutter>
          <GridItem span={4}>
            { isUpdate ? buttons : (
              <React.Fragment>
                <div>
                  Select a Namespace To Deploy To:
                </div>
                <NamespaceSelector onSelect={setSelectedNamespace}/>
              </React.Fragment>
            )}
          </GridItem>
          <GridItem span={4}>
            <div>
              The settings available here are explained in the <a target="_blank" rel="noreferrer" href="https://github.com/Altinity/clickhouse-operator/blob/master/docs/custom_resource_explained.md">ClickHouse Custom Resource Documentation</a>.
            </div>
          </GridItem>
          <GridItem span={4}>
            <div>
              Use the <StringHasher
              title="Password Hash Calculator"
              valueName="password"
            /> to generate values for the <i>user/password_sha256_hex</i> field.
            </div>
          </GridItem>
          { isUpdate ? null : (
            <GridItem span={4}>
              {buttons}
            </GridItem>
          )}
        </Grid>
      )}
    >
      <CodeEditor
        isDarkTheme
        isUploadEnabled
        isDownloadEnabled
        downloadFileName={`clickhouse-${Date.now().toString()}.yaml`}
        isCopyEnabled
        isLanguageLabelVisible
        height="324px"
        language={Language.yaml}
        code={yaml}
        onChange={setYaml}
        onEditorDidMount={setYamlFromEditor}
        emptyState={ isUpdate ?
          (
            <EmptyState>
              <EmptyStateIcon icon={CodeIcon} />
              <Title headingLevel="h4" size="lg">
                Update ClickHouse Installation
              </Title>
              <EmptyStateBody>Loading current YAML spec...</EmptyStateBody>
            </EmptyState>
          ) :
          (
            <EmptyState>
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
          )
        }
      />
    </Modal>
  )
}

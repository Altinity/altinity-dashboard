import * as React from 'react';
import { useEffect, useState } from 'react';
import { ToggleModalSubProps } from '@app/Components/ToggleModal';
import { fetchWithErrorHandling } from '@app/utils/fetchWithErrorHandling';
import {
  AlertVariant,
  Bullseye,
  Button, EmptyState, EmptyStateBody, EmptyStateIcon,
  Grid,
  GridItem,
  Modal,
  ModalVariant, Title
} from '@patternfly/react-core';
import { CodeEditor, Language } from '@patternfly/react-code-editor';
import { editor } from 'monaco-editor';
import { StringHasher } from '@app/Components/StringHasher';
import { CHI } from '@app/CHIs/model';
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import CodeIcon from '@patternfly/react-icons/dist/esm/icons/code-icon';

export interface UpdateCHIModalProps extends ToggleModalSubProps {
  CHIName: string
  CHINamespace: string
}

export const UpdateCHIModal: React.FunctionComponent<UpdateCHIModalProps> = (props) => {
  const { addAlert, isModalOpen, CHIName, CHINamespace } = props
  const outerCloseModal = props.closeModal
  const [yaml, realSetYaml] = useState("")
  const closeModal = (): void => {
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
    fetchWithErrorHandling(`/api/v1/chis/${CHINamespace}/${CHIName}`, 'PATCH',
      {
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
    if (isModalOpen) {
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
  }, [CHIName, CHINamespace, isModalOpen])
  return (
    <Modal
      title="Update ClickHouse Installation"
      variant={ModalVariant.large}
      isOpen={isModalOpen}
      onClose={closeModal}
      position="top"
      actions={[
        <Button key="deploy" variant="primary"
                onClick={onDeployClick}>
          Update
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
                Update ClickHouse Installation
              </Title>
              <EmptyStateBody>Loading current YAML spec...</EmptyStateBody>
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

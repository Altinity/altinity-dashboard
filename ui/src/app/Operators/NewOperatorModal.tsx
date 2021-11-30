import * as React from 'react';
import { ToggleModalSubProps } from '@app/Components/ToggleModal';
import { useState } from 'react';
import { AlertVariant, Bullseye, Button, Grid, GridItem, Modal, ModalVariant, TextInput } from '@patternfly/react-core';
import chopLogo from '@app/images/altinity-clickhouse-operator-kubernetes.jpg';
import { NamespaceSelector } from '@app/Namespaces/NamespaceSelector';
import { fetchWithErrorHandling } from '@app/utils/fetchWithErrorHandling';

export const NewOperatorModal: React.FunctionComponent<ToggleModalSubProps> = (props: ToggleModalSubProps) => {
  const {addAlert, isModalOpen} = props
  const [selectedVersion, setSelectedVersion] = useState("")
  const [selectedNamespace, setSelectedNamespace] = useState("")
  const closeModal = (): void => {
    setSelectedVersion("")
    setSelectedNamespace("")
    props.closeModal()
  }
  const onDeployClick = (): void => {
    fetchWithErrorHandling(`/api/v1/operators/${selectedNamespace}`,
      'PUT',
      {
        version: selectedVersion
      },
      () => { closeModal() },
      (response, text, error) => {
        closeModal()
        const errorMessage = (error == "") ? text : `${error}: ${text}`
        addAlert(`Error updating operator: ${errorMessage}`, AlertVariant.danger)
      }
    )
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

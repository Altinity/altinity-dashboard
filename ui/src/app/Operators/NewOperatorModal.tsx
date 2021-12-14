import * as React from 'react';
import { ToggleModalSubProps } from '@app/Components/ToggleModal';
import { useContext, useState } from 'react';
import { AlertVariant, Bullseye, Button, Grid, GridItem, Modal, ModalVariant, TextInput } from '@patternfly/react-core';
import { NamespaceSelector } from '@app/Namespaces/NamespaceSelector';
import { fetchWithErrorHandling } from '@app/utils/fetchWithErrorHandling';
import { AddAlertContext } from '@app/utils/alertContext';

export interface NewOperatorModalProps extends ToggleModalSubProps {
  isUpgrade: boolean
  namespace?: string
}

export const NewOperatorModal: React.FunctionComponent<NewOperatorModalProps> = (props) => {
  const {isModalOpen} = props
  const [selectedVersion, setSelectedVersion] = useState("")
  let selectedNamespace: string
  let setSelectedNamespace: (string) => void
  const [selectedNamespaceState, setSelectedNamespaceState] = useState("")
  const addAlert = useContext(AddAlertContext)
  if (props.namespace) {
    selectedNamespace = props.namespace
    setSelectedNamespace = () => {return}
  } else {
    selectedNamespace = selectedNamespaceState
    setSelectedNamespace = setSelectedNamespaceState
  }
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
  const latestChop = (document.querySelector('meta[name="chop-release"]') as HTMLMetaElement)?.content || "latest"
  return (
    <Modal
      title={(props.isUpgrade ? "Upgrade" : "Deploy") + " ClickHouse Operator"}
      variant={ModalVariant.small}
      isOpen={isModalOpen}
      onClose={closeModal}
      position="top"
      actions={[
        <Button key="deploy" variant="primary"
                onClick={onDeployClick} isDisabled={selectedNamespace === ""}>
          {props.isUpgrade ? "Upgrade" : "Deploy"}
        </Button>,
        <Button key="cancel" variant="link" onClick={closeModal}>
          Cancel
        </Button>
      ]}
    >
      <Grid hasGutter={true}>
        <GridItem span={7}>
          <div>
            Version (leave blank for {latestChop}):
          </div>
          <TextInput
            value={selectedVersion}
            type="text"
            onChange={setSelectedVersion}
          />
        </GridItem>
        <GridItem span={5} rowSpan={2}>
          <Bullseye>
            <span>See <a target="_blank" rel="noreferrer" href="https://github.com/Altinity/clickhouse-operator/releases">Release Notes</a> for information about available versions.</span>
          </Bullseye>
        </GridItem>
        {
          props.isUpgrade ? null :
            (
              <GridItem span={7}>
                Select a Namespace:
                <NamespaceSelector onSelect={setSelectedNamespace}/>
              </GridItem>
            )
        }
      </Grid>
    </Modal>
  )
}

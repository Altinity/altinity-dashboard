import * as React from 'react';
import {
  AlertVariant,
  Button,
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
import { AddAlertType } from '@app/index';
import { NamespaceSelector } from '@app/Namespaces/Namespaces';

interface CHI {
  name: string
  namespace: string
  status: string
  Clusters: bigint
  Hosts: bigint
}

class NewCHIModal extends React.Component<
  {
    addAlert: AddAlertType
  },
  {
    isModalOpen: boolean,
    selectedNamespace: string
  }> {
  private readonly handleModalToggle: () => void;
  private readonly onNamespaceSelect: (s: string) => void;
  private readonly onDeployClick: () => void;
  constructor(props) {
    super(props)
    this.state = {
      isModalOpen: false,
      selectedNamespace: ""
    }
    this.handleModalToggle = () => {
      this.setState(({ isModalOpen }) => ({
        isModalOpen: !isModalOpen
      }))
    }
    this.onNamespaceSelect = (s: string): void => {
      this.setState({
        selectedNamespace: s
      })
    }
    this.onDeployClick = (): void => {
      this.props.addAlert("Not implemented yet", AlertVariant.warning)
      this.setState({
        isModalOpen: false
      })
    }
  }
  render() {
    const { isModalOpen } = this.state;
    return (
      <React.Fragment>
        <Button variant="primary" onClick={this.handleModalToggle}>
          +
        </Button>
        <Modal
          title="Deploy ClickHouse Installation"
          variant={ModalVariant.small}
          isOpen={isModalOpen}
          onClose={this.handleModalToggle}
          actions={[
            <Button key="deploy" variant="primary"
                    onClick={this.onDeployClick} isDisabled={this.state.selectedNamespace === ""}>
              Deploy
            </Button>,
            <Button key="cancel" variant="link" onClick={this.handleModalToggle}>
              Cancel
            </Button>
          ]}
        >
          <div>
            Select a Namespace:
          </div>
          <NamespaceSelector onSelect={this.onNamespaceSelect}/>
        </Modal>
      </React.Fragment>
    );
  }
}


// eslint-disable-next-line prefer-const
let Installations: React.FunctionComponent<AppRoutesProps> = (props: AppRoutesProps) => {
  const [CHIs, setCHIs] = useState(new Array<CHI>())
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
  return (
    <PageSection>
      <Split>
        <SplitItem isFilled>
          <Title headingLevel="h1" size="lg">
            ClickHouse Installations
          </Title>
        </SplitItem>
        <SplitItem>
          <NewCHIModal addAlert={addAlert}/>
        </SplitItem>
      </Split>
      <DataTable table_variant="compact"
                 data={CHIs}
                 columns={['Name', 'Namespace', 'Status', 'Clusters', 'Hosts']}
                 column_fields={['name', 'namespace', 'status', 'clusters', 'hosts']}
      />
    </PageSection>
  )
}

export { Installations };

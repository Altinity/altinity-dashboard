import * as React from 'react';
import {
  AlertVariant,
  Button,
  ButtonVariant,
  Dropdown,
  DropdownItem,
  KebabToggle,
  Modal,
  ModalVariant,
  PageSection,
  Split,
  SplitItem,
  Title
} from '@patternfly/react-core';
import { NamespaceSelector } from '@app/Namespaces/Namespaces';
import { SimpleModal } from '@app/Components/SimpleModal';
import { ReactElement, useEffect, useState } from 'react';
import { ExpandableTable } from '@app/Components/ExpandableTable';
import { DataTable } from '@app/Components/DataTable';
import { AppRoutesProps } from '@app/routes';
import { AddAlertType } from '@app/index';
import { ToggleModal } from '@app/Components/ToggleModal';

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

class NewOperatorModal extends React.Component<
  {
    addAlert: AddAlertType
  },
  {
    selectedNamespace: string
  }> {
  constructor(props) {
    super(props)
    this.state = {
      selectedNamespace: ""
    }
  }
  renderModal = (isModalOpen: boolean, closeModal): ReactElement => {
    const onNamespaceSelect = (s: string): void => {
      this.setState({
        selectedNamespace: s
      })
    }
    const onDeployClick = (): void => {
      fetch(`/api/v1/operators/${this.state.selectedNamespace}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: ""
        })
      })
      .then(response => {
        closeModal()
        if (!response.ok) {
          throw Error(response.statusText)
        }
      })
      .catch(error => {
        closeModal()
        this.props.addAlert(`Error updating operator: ${error.message}`, AlertVariant.danger)
      })
    }
    return (
      <Modal
        title="Deploy ClickHouse Operator"
        variant={ModalVariant.small}
        isOpen={isModalOpen}
        onClose={closeModal}
        actions={[
          <Button key="deploy" variant="primary"
                  onClick={onDeployClick} isDisabled={this.state.selectedNamespace === ""}>
            Deploy
          </Button>,
          <Button key="cancel" variant="link" onClick={closeModal}>
            Cancel
          </Button>
        ]}
      >
        <div>
          Select a Namespace:
        </div>
        <NamespaceSelector onSelect={onNamespaceSelect}/>
      </Modal>
    )
  }
  render() {
    return (
      <ToggleModal modal={this.renderModal} />
    )
  }
}

class OperatorActionsMenu extends React.Component<
  {
    namespace: string
    addAlert: AddAlertType
  },
  {
    isOpen: boolean,
    isDeleteModalOpen: boolean,
  }> {
  private readonly onToggle: (boolean) => void;
  private readonly onSelect: () => void;
  private readonly onDeleteClick: () => void;
  private readonly onDeleteActionClick: () => void;
  private readonly onDeleteModalClose: () => void;
  private readonly onUpgradeClick: () => void;
  constructor(props) {
    super(props)
    this.state = {
      isOpen: false,
      isDeleteModalOpen: false
    }
    this.onToggle = isOpen => {
      this.setState({
        isOpen
      })
    }
    this.onSelect = () => {
      this.setState({
        isOpen: !this.state.isOpen
      })
    }
    this.onDeleteClick = () => {
      this.setState({
        isDeleteModalOpen: true
      })
    }
    this.onDeleteActionClick = () => {
      fetch(`/api/v1/operators/${this.props.namespace}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText)
        }
      })
      .catch(error => {
        this.props.addAlert(`Error deleting operator: ${error.message}`, AlertVariant.danger)
      })
    }
    this.onDeleteModalClose = () => {
      this.setState({
        isDeleteModalOpen: false
      })
    }
    this.onUpgradeClick = () => {
      console.log("Upgrade clicked")
    }
  }

  render() {
    const { isOpen } = this.state;
    const dropdownItems = [
      <DropdownItem key="upgrade" component="button" onClick={this.onUpgradeClick}>
        Upgrade
      </DropdownItem>,
      <DropdownItem key="delete" component="button" onClick={this.onDeleteClick}>
        Delete
      </DropdownItem>
    ];
    return (
      <React.Fragment>
        <SimpleModal
          title="Delete ClickHouse Operator?"
          positionTop={true}
          actionButtonText="Delete"
          actionButtonVariant={ButtonVariant.danger}
          isModalOpen={this.state.isDeleteModalOpen}
          onActionClick={this.onDeleteActionClick}
          onClose={this.onDeleteModalClose}
        >
        The operator will be removed from the <b>{this.props.namespace}</b> namespace.
        </SimpleModal>
        <Dropdown
          onSelect={this.onSelect}
          toggle={<KebabToggle onToggle={this.onToggle} />}
          isOpen={isOpen}
          isPlain
          dropdownItems={dropdownItems}
          position="right"
        />
      </React.Fragment>
    );
  }
}

// eslint-disable-next-line prefer-const
let Operators: React.FunctionComponent<AppRoutesProps> = (props: AppRoutesProps) => {
  const [operators, setOperators] = useState(new Array<Operator>())
  const addAlert = props.addAlert
  const fetchData = () => {
    fetch('/api/v1/operators')
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText)
        }
        return response.json()
      })
      .then(res => {
        setOperators(res as Operator[])
      })
      .catch(error => {
          addAlert(`Error retrieving operators: ${error.message}`, AlertVariant.danger)
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
            ClickHouse Operators
          </Title>
        </SplitItem>
        <SplitItem>
          <NewOperatorModal addAlert={addAlert}/>
        </SplitItem>
      </Split>
      <ExpandableTable
        data={operators}
        columns={['Name', 'Namespace', 'Conditions', 'Version']}
        column_fields={['name', 'namespace', 'conditions', 'version']}
        expanded_content={(data) => (
          <ExpandableTable
            table_variant="compact"
            data={data.pods}
            columns={['Pod', 'Status', 'Version']}
            column_fields={['name', 'status', 'version']}
            expanded_content={(data) => (
              <DataTable table_variant="compact"
                data={data.containers}
                columns={['Container', 'State', 'Image']}
                column_fields={['name', 'state', 'image']}
              />
            )}
          />
        )}
        action_menu={(data) => (
          <OperatorActionsMenu namespace={data.namespace} addAlert={addAlert}/>
        )}
      />
    </PageSection>
  )
}

export { Operators };

import * as React from 'react';
import {
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
import { useEffect, useState } from 'react';
import { ExpandableTable } from '@app/Components/ExpandableTable';
import { DataTable } from '@app/Components/DataTable';

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
        .then(() => {
          this.setState({
            isModalOpen: false
          })
        })
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
          title="Deploy ClickHouse Operator"
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

class OperatorActionsMenu extends React.Component<
  {
    namespace: string
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
      }).then(() => { return })  // avoids warning
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
let Operators: React.FunctionComponent = () => {
  const [operators, setOperators] = useState(new Array<Operator>())
  const fetchData = () => {
    fetch('/api/v1/operators')
      .then(res => res.json())
      .then(res => {
        setOperators(res as Operator[])
      })
  }
  useEffect(() => {
    fetchData()
    const timer = setInterval(() => fetchData(), 2000)
    return () => {
      clearInterval(timer)
    }
  }, [])
  return (
    <PageSection>
      <Split>
        <SplitItem isFilled>
          <Title headingLevel="h1" size="lg">
            ClickHouse Operators
          </Title>
        </SplitItem>
        <SplitItem>
          <NewOperatorModal/>
        </SplitItem>
      </Split>
      <ExpandableTable
        data={operators}
        columns={['Name', 'Namespace', 'Conditions', 'Version']}
        column_fields={['name', 'namespace', 'conditions', 'version']}
        expanded_content={(data) => (
          <ExpandableTable
            data={data.pods}
            columns={['Pod', 'Status', 'Version']}
            column_fields={['name', 'status', 'version']}
            expanded_content={(data) => (
              <DataTable
                data={data.containers}
                columns={['Container', 'State', 'Image']}
                column_fields={['name', 'state', 'image']}
              />
            )}
          />
        )}
        action_menu={(data) => (
          <OperatorActionsMenu namespace={data.namespace} />
        )}
      />
    </PageSection>
  )
}

export { Operators };

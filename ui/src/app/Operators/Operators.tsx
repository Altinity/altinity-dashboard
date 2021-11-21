import * as React from 'react';
import { PageSection, Title, Button, Split, SplitItem, Modal, ModalVariant } from '@patternfly/react-core';
import { TableComposable, Thead, Tr, Th, Td, Tbody } from '@patternfly/react-table';
import { NamespaceSelector } from '@app/Namespaces/Namespaces';
import { Dropdown, DropdownItem, KebabToggle } from '@patternfly/react-core';

interface Operator {
  name: string
  namespace: string
  status: string
  version: string
}

class NewOperatorModal extends React.Component<
  {
    onDeployed?: () => void
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
          if (this.props.onDeployed) {
            this.props.onDeployed()
          }
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
  }> {
  private readonly onToggle: (boolean) => void;
  private readonly onSelect: () => void;
  private readonly onFocus: () => void;
  private readonly onDeleteClick: () => void;
  private readonly onChangeVersionClick: () => void;
  constructor(props) {
    super(props)
    this.state = {
      isOpen: false
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
      this.onFocus()
    }
    this.onFocus = () => {
      const element = document.getElementById('toggle-id-6')
      if (element) element.focus()
    }
    this.onDeleteClick = () => {
      fetch(`/api/v1/operators/${this.props.namespace}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
    }
    this.onChangeVersionClick = () => {
      console.log("Change Version clicked")
    }
  }

  render() {
    const { isOpen } = this.state;
    const dropdownItems = [
      <DropdownItem key="upgrade" component="button" onClick={this.onChangeVersionClick}>
        Change Version
      </DropdownItem>,
      <DropdownItem key="delete" component="button" onClick={this.onDeleteClick}>
        Delete
      </DropdownItem>
    ];
    return (
      <Dropdown
        onSelect={this.onSelect}
        toggle={<KebabToggle onToggle={this.onToggle} id="toggle-id-6" />}
        isOpen={isOpen}
        isPlain
        dropdownItems={dropdownItems}
        position="right"
      />
    );
  }
}

class OperatorTable extends React.Component<
  {
    onMounted?: (OperatorTable) => void
  },
  {
    operators: Array<Operator>
  }> {
  private timer: NodeJS.Timeout | null;
  constructor(props) {
    super(props)
    this.timer = null
    this.state = {
      operators: new Array<Operator>()
    }
  }
  componentDidMount() {
    if (this.props.onMounted) {
      this.props.onMounted(this)
    }
    this.fetchData()
    this.timer = setInterval(() => this.fetchData(), 2000)
  }
  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  fetchData() {
    fetch('/api/v1/operators')
      .then(res => res.json())
      .then(res => {
        return res as Operator[]
      })
      .then(res => {
        this.setState({ operators: res })
      })
  }
  render() {
    const columns = ['Name', 'Namespace', 'Status', 'Version']
    const column_fields = ['name', 'namespace', 'status', 'version']
    return (
      <ul>
        <TableComposable>
          <Thead>
            <Tr>
              {
                columns.map((column, columnIndex) => (
                  <Th key={columnIndex}>{column}</Th>
                ))
              }
              <Th key="menu"/>
            </Tr>
          </Thead>
          <Tbody>
            {
              this.state.operators.map((op, opindex) => (
                <Tr key={opindex}>
                  {
                    columns.map((column, columnIndex) => (
                      <Td key={columnIndex}>{op[column_fields[columnIndex]]}</Td>
                    ))
                  }
                  <Td key="menu">
                    <OperatorActionsMenu namespace={op.namespace} />
                  </Td>
                </Tr>
              ))
            }
          </Tbody>
        </TableComposable>
      </ul>
    )
  }
}

// eslint-disable-next-line prefer-const
let Operators: React.FunctionComponent = () => {
  let ot: OperatorTable | null = null
  const onTableMounted = (_ot: OperatorTable): void => {
    ot = _ot
  }
  const onDeployed = (): void => {
    if (ot) {
      ot.fetchData()
    }
  }
  return (
    <PageSection>
      <Split>
        <SplitItem isFilled>
          <Title headingLevel="h1" size="lg">
            ClickHouse Operators
          </Title>
        </SplitItem>
        <SplitItem>
          <NewOperatorModal onDeployed={onDeployed}/>
        </SplitItem>
      </Split>
      <OperatorTable onMounted={onTableMounted}/>
    </PageSection>
  )
}

export { Operators };

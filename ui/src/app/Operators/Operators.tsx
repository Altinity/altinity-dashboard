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
import { ExpandableRowContent, TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { NamespaceSelector } from '@app/Namespaces/Namespaces';
import { SimpleModal } from '@app/SimpleModal/SimpleModal';

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
    isDeleteModalOpen: boolean,
  }> {
  private readonly onToggle: (boolean) => void;
  private readonly onSelect: () => void;
  private readonly onFocus: () => void;
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
      this.onFocus()
    }
    this.onFocus = () => {
      const element = document.getElementById('toggle-id-6')
      if (element) element.focus()
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
          toggle={<KebabToggle onToggle={this.onToggle} id="toggle-id-6" />}
          isOpen={isOpen}
          isPlain
          dropdownItems={dropdownItems}
          position="right"
        />
      </React.Fragment>
    );
  }
}

class OperatorTable extends React.Component<
  {
    onMounted?: (OperatorTable) => void
  },
  {
    operators: Array<Operator>
    rows_expanded: Map<number, boolean>
  }> {
  private timer: NodeJS.Timeout | null;
  constructor(props) {
    super(props)
    this.timer = null
    this.state = {
      operators: new Array<Operator>(),
      rows_expanded: new Map<number, boolean>(),
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
  getExpanded(opIndex: number): boolean {
    return this.state.rows_expanded.get(opIndex) || false
  }
  setExpanded(opIndex: number, expanded: boolean) {
    this.setState((prevState) => {
      const nextRows = new Map(prevState.rows_expanded)
      return {
        rows_expanded: nextRows.set(opIndex, expanded)
      }
    })
  }
  handleExpansionToggle = (_event, pairIndex: number) => {
    this.setExpanded(pairIndex, !this.getExpanded(pairIndex))
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
    const columns = ['Name', 'Namespace', 'Conditions', 'Version']
    const column_fields = ['name', 'namespace', 'conditions', 'version']
    let rowIndex = -2
    return (
      <TableComposable>
        <Thead>
          <Tr>
            <Th/>
            {
              columns.map((column, columnIndex) => (
                <Th key={columnIndex}>{column}</Th>
              ))
            }
            <Th key="menu"/>
          </Tr>
        </Thead>
        {
          this.state.operators.map((op, opindex) => {
            rowIndex += 2
            return (
              <Tbody key={opindex} isExpanded={this.getExpanded(opindex)}>
                <Tr key={rowIndex}>
                  <Td key={`${rowIndex}_0`} expand={{
                    rowIndex: opindex,
                    isExpanded: this.getExpanded(opindex),
                    onToggle: this.handleExpansionToggle,
                  }} />
                  {
                    columns.map((column, columnIndex) => (
                      <Td key={`${rowIndex}_${columnIndex+1}`} dataLabel={column}>
                        {op[column_fields[columnIndex]]}
                      </Td>
                    ))
                  }
                  <Td key="menu">
                    <OperatorActionsMenu namespace={op.namespace} />
                  </Td>
                </Tr>
                <Tr key={rowIndex+1} isExpanded={this.getExpanded(opindex)}>
                  <Td key={`${rowIndex}_0`}/>
                  <Td key={`${rowIndex}_1`} colSpan={columns.length}>
                    <ExpandableRowContent>
                      This is the expandable row content
                    </ExpandableRowContent>
                  </Td>
                </Tr>
              </Tbody>
            )
          })
        }
      </TableComposable>
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

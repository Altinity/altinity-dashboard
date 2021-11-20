import * as React from 'react';
import { PageSection, Title, Button, Split, SplitItem, Modal, ModalVariant } from '@patternfly/react-core';
import { TableComposable, Thead, Tr, Th } from '@patternfly/react-table';
import { NamespaceSelector } from '@app/Namespaces/Namespaces';

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
      fetch('/api/v1/operators', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          namespace: this.state.selectedNamespace
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
            </Tr>
          </Thead>
          {
            this.state.operators.map((op, opindex) => (
              <Tr key={opindex}>
                {
                  columns.map((column, columnIndex) => (
                    <Th key={columnIndex}>{op[column_fields[columnIndex]]}</Th>
                  ))
                }
              </Tr>
            ))
          }
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

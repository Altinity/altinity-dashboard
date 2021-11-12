import * as React from 'react';
import { CubesIcon } from '@patternfly/react-icons';
import {
  PageSection,
  Title,
  Button,
  EmptyState,
  EmptyStateVariant,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateSecondaryActions, Gallery, Card, CardTitle, CardBody
} from '@patternfly/react-core';
import { TableComposable, Thead, Tbody, Tr, Th, Td, Caption } from '@patternfly/react-table';

interface Operator {
  name: string
  namespace: string
  status: string
  version: string
}

class OperatorTable extends React.Component {
  state = {
    operators: new Array<Operator>()
  }
  componentDidMount() {
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

export interface IOperatorsProps {
  sampleProp?: string;
}

// eslint-disable-next-line prefer-const
let Operators: React.FunctionComponent<IOperatorsProps> = () => (
  <PageSection>
    <Title headingLevel="h1" size="lg">
      ClickHouse Operators
    </Title>
    <OperatorTable/>
  </PageSection>
)

export { Operators };

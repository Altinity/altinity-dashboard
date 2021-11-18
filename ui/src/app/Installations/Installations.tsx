import * as React from 'react';
import { PageSection, Title } from '@patternfly/react-core';
import { TableComposable, Thead, Tr, Th } from '@patternfly/react-table';

interface CHI {
  name: string
  namespace: string
  status: string
  Clusters: bigint
  Hosts: bigint
}

class CHITable extends React.Component {
  state = {
    chis: new Array<CHI>()
  }
  componentDidMount() {
    fetch('/api/v1/chis')
      .then(res => res.json())
      .then(res => {
        return res as CHI[]
      })
      .then(res => {
        this.setState({ chis: res })
      })
  }
  render() {
    const columns = ['Name', 'Namespace', 'Status', 'Clusters', 'Hosts']
    const column_fields = ['name', 'namespace', 'status', 'clusters', 'hosts']
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
            this.state.chis.map((op, opindex) => (
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

export interface IInstancesProps {
  sampleProp?: string;
}

// eslint-disable-next-line prefer-const
let Installations: React.FunctionComponent<IInstancesProps> = () => (
  <PageSection>
    <Title headingLevel="h1" size="lg">
      ClickHouse Installations
    </Title>
    <CHITable/>
  </PageSection>
)

export { Installations };

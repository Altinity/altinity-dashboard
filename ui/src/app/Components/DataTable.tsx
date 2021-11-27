import * as React from 'react';
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { ReactElement } from 'react';
import { TdActionsType } from '@patternfly/react-table/dist/js/components/Table/base';

class DataTable extends React.Component<
  {
    data: Array<object>
    columns: Array<string>
    column_fields: Array<string>
    actions?: (object) => TdActionsType
    table_variant?: "compact"
    keyPrefix: string
  },
  {
  }> {
  render() {
    const menuHeader = this.props.actions ? <Th key="menu"/> : null
    const menuBody = (item: object): ReactElement|null => {
      if (this.props.actions) {
        return (<Td actions={this.props.actions(item)}/>)
      } else {
        return null
      }
    }
    return (
      <TableComposable variant={this.props.table_variant}>
        <Thead>
          <Tr key={`${this.props.keyPrefix}-hdr`}>
            {
              this.props.columns.map((column, columnIndex) => (
                <Th key={`${this.props.keyPrefix}-hdr-${columnIndex}`}>{column}</Th>
              ))
            }
            { menuHeader }
          </Tr>
        </Thead>
        <Tbody>
        {
          this.props.data.map((dataItem, dataIndex) => {
            return (
              <Tr key={`${this.props.keyPrefix}-row-${dataIndex}`}>
                {
                  this.props.columns.map((column, columnIndex) => (
                    <Td key={`${this.props.keyPrefix}-row-${dataIndex}-col-${columnIndex}`}
                        dataLabel={column}>
                      {dataItem[this.props.column_fields[columnIndex]]}
                    </Td>
                  ))
                }
                {menuBody(dataItem)}
              </Tr>
            )
          })
        }
        </Tbody>
      </TableComposable>
    )
  }
}

export { DataTable }

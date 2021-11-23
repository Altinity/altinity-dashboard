import * as React from 'react';
import { TableComposable, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { ReactElement } from 'react';

class DataTable extends React.Component<
  {
    data: Array<object>
    columns: Array<string>
    column_fields: Array<string>
    action_menu?: (object) => ReactElement
    table_variant?: "compact"
  },
  {
  }> {
  render() {
    const menuHeader = this.props.action_menu ? <Th key="menu"/> : ""
    const menuBody = (item: object): ReactElement|null => {
      if (this.props.action_menu) {
        return (
          <Td noPadding={true}>
            {this.props.action_menu(item)}
          </Td>
        )
      } else {
        return null
      }
    }
    return (
      <TableComposable variant={this.props.table_variant}>
        <Thead>
          <Tr>
            {
              this.props.columns.map((column, columnIndex) => (
                <Th key={columnIndex}>{column}</Th>
              ))
            }
            { menuHeader }
          </Tr>
        </Thead>
        {
          this.props.data.map((dataItem, dataIndex) => {
            return (
              <Tr key={dataIndex}>
                {
                  this.props.columns.map((column, columnIndex) => (
                    <Td key={`${dataIndex}_${columnIndex}`} dataLabel={column}>
                      {dataItem[this.props.column_fields[columnIndex]]}
                    </Td>
                  ))
                }
                {menuBody(dataItem)}
              </Tr>
            )
          })
        }
      </TableComposable>
    )
  }
}

export { DataTable }

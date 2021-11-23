import * as React from 'react';
import { ExpandableRowContent, TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { ReactElement } from 'react';

class ExpandableTable extends React.Component<
  {
    data: Array<object>
    columns: Array<string>
    column_fields: Array<string>
    expanded_content: (object) => ReactElement
    action_menu?: (object) => ReactElement
  },
  {
    rows_expanded: Map<number, boolean>
  }> {
  constructor(props) {
    super(props)
    this.state = {
      rows_expanded: new Map<number, boolean>(),
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
  render() {
    let rowIndex = -2
    const menuHeader = this.props.action_menu ? <Th key="menu"/> : ""
    const menuBody = (item: object): ReactElement|null => {
      if (this.props.action_menu) {
        return (
          <Td>
            {this.props.action_menu(item)}
          </Td>
        )
      } else {
        return null
      }
    }
    return (
      <TableComposable>
        <Thead>
          <Tr>
            <Th/>
            {
              this.props.columns.map((column, columnIndex) => (
                <Th key={columnIndex+1}>{column}</Th>
              ))
            }
            { menuHeader }
          </Tr>
        </Thead>
        {
          this.props.data.map((dataItem, dataIndex) => {
            rowIndex += 2
            return (
              <Tbody key={dataIndex} isExpanded={this.getExpanded(dataIndex)}>
                <Tr key={rowIndex}>
                  <Td key={`${rowIndex}_0`} expand={{
                    rowIndex: dataIndex,
                    isExpanded: this.getExpanded(dataIndex),
                    onToggle: this.handleExpansionToggle,
                  }} />
                  {
                    this.props.columns.map((column, columnIndex) => (
                      <Td key={`${rowIndex}_${columnIndex+1}`} dataLabel={column}>
                        {dataItem[this.props.column_fields[columnIndex]]}
                      </Td>
                    ))
                  }
                  {menuBody(dataItem)}
                </Tr>
                <Tr key={rowIndex+1} isExpanded={this.getExpanded(dataIndex)}>
                  <Td key={`${rowIndex}_0`} colSpan={this.props.columns.length+1}>
                    <ExpandableRowContent>
                      {this.props.expanded_content(dataItem)}
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

export { ExpandableTable }

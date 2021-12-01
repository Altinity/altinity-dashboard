import * as React from 'react';
import { ExpandableRowContent, TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { ReactElement } from 'react';
import { TdActionsType } from '@patternfly/react-table/dist/js/components/Table/base';

export class ExpandableTable extends React.Component<
  {
    data: Array<object>
    columns: Array<string>
    column_fields: Array<string>
    expanded_content: (object) => ReactElement
    actions?: (object) => TdActionsType
    table_variant?: "compact"
    keyPrefix: string
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
    const menuHeader = this.props.actions ? <Th key={`${this.props.keyPrefix}-menu`}/> : null
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
          <Tr>
            <Th key={`${this.props.keyPrefix}-header-col-0`}/>
            {
              this.props.columns.map((column, columnIndex) => (
                <Th key={`${this.props.keyPrefix}-header-col-${columnIndex+1}`}>{column}</Th>
              ))
            }
            { menuHeader }
          </Tr>
        </Thead>
        {
          this.props.data.map((dataItem, dataIndex) => {
            rowIndex += 2
            return (
              <Tbody key={`${this.props.keyPrefix}-rowbody-${dataIndex}`} isExpanded={this.getExpanded(dataIndex)}>
                <Tr key={`${this.props.keyPrefix}-row-${rowIndex}`}>
                  <Td key={`${this.props.keyPrefix}-row-${rowIndex}-col-0`} noPadding={true} expand={{
                    rowIndex: dataIndex,
                    isExpanded: this.getExpanded(dataIndex),
                    onToggle: this.handleExpansionToggle,
                  }} />
                  {
                    this.props.columns.map((column, columnIndex) => (
                      <Td key={`${this.props.keyPrefix}-row-${rowIndex}-col-${columnIndex+1}`}
                          dataLabel={column}>
                        {dataItem[this.props.column_fields[columnIndex]]}
                      </Td>
                    ))
                  }
                  {menuBody(dataItem)}
                </Tr>
                <Tr key={`${this.props.keyPrefix}-row-${rowIndex+1}`} isExpanded={this.getExpanded(dataIndex)}>
                  <Td/>
                  <Td key={`${this.props.keyPrefix}-row-${rowIndex+1}-col-0`} colSpan={this.props.columns.length+1} noPadding={true}>
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

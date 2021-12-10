import * as React from 'react';
import { ExpandableRowContent, TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { ReactElement } from 'react';
import { TdActionsType } from '@patternfly/react-table/dist/js/components/Table/base';

export class ExpandableTable extends React.Component<
  {
    data: Array<object>
    columns: Array<string>
    column_fields: Array<string>
    expanded_content?: (object) => ReactElement
    actions?: (object) => TdActionsType
    table_variant?: "compact"
    keyPrefix: string
    data_modifier?: (data: object, field: string) => ReactElement|string
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
      <TableComposable variant={this.props.table_variant} className="table-no-extra-padding">
        <Thead>
          <Tr>
            {
              this.props.expanded_content ?
                <Th key={`${this.props.keyPrefix}-header-col-0`}/> :
                null
            }
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
                  {
                    this.props.expanded_content ?
                      <Td key={`${this.props.keyPrefix}-row-${rowIndex}-col-0`} expand={{
                        rowIndex: dataIndex,
                        isExpanded: this.getExpanded(dataIndex),
                        onToggle: this.handleExpansionToggle,
                      }} /> :
                      null
                  }
                  {
                    this.props.columns.map((column, columnIndex) => (
                      <Td key={`${this.props.keyPrefix}-row-${rowIndex}-col-${columnIndex+1}`} dataLabel={column}>
                        {
                          this.props.data_modifier ?
                            this.props.data_modifier(dataItem, this.props.column_fields[columnIndex]) :
                            dataItem[this.props.column_fields[columnIndex]]
                        }
                      </Td>
                    ))
                  }
                  {menuBody(dataItem)}
                </Tr>
                {
                  this.props.expanded_content ? (
                    <Tr key={`${this.props.keyPrefix}-row-${rowIndex + 1}`}
                        isExpanded={this.getExpanded(dataIndex)}>
                      <Td />
                      <Td key={`${this.props.keyPrefix}-row-${rowIndex + 1}-col-0`}
                          colSpan={this.props.columns.length + 1}>
                        <ExpandableRowContent>
                          {this.props.expanded_content(dataItem)}
                        </ExpandableRowContent>
                      </Td>
                    </Tr>
                  ) : null
                }
              </Tbody>
            )
          })
        }
      </TableComposable>
    )
  }
}

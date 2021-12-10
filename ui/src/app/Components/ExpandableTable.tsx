import * as React from 'react';
import { ExpandableRowContent, TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { ReactElement, useState } from 'react';
import { TdActionsType } from '@patternfly/react-table/dist/js/components/Table/base';

export const ExpandableTable: React.FunctionComponent<
  {
    data: Array<object>
    columns: Array<string>
    column_fields: Array<string>
    expanded_content?: (object) => ReactElement
    actions?: (object) => TdActionsType
    table_variant?: "compact"
    keyPrefix: string
    data_modifier?: (data: object, field: string) => ReactElement|string
  }> = (props) => {
  const [rowsExpanded, setRowsExpanded] = useState(new Map<number, boolean>())
  const getExpanded = (opIndex: number): boolean => {
    return rowsExpanded.get(opIndex) || false
  }
  const setExpanded = (opIndex: number, expanded: boolean) => {
    setRowsExpanded(new Map(rowsExpanded.set(opIndex, expanded)))
  }
  const handleExpansionToggle = (_event, pairIndex: number) => {
    setExpanded(pairIndex, !getExpanded(pairIndex))
  }
  let rowIndex = -2
  const menuHeader = props.actions ? <Th key={`${props.keyPrefix}-menu`}/> : null
  const menuBody = (item: object): ReactElement|null => {
    if (props.actions) {
      return (<Td actions={props.actions(item)}/>)
    } else {
      return null
    }
  }
  return (
    <TableComposable variant={props.table_variant} className="table-no-extra-padding">
      <Thead>
        <Tr>
          {
            props.expanded_content ?
              <Th key={`${props.keyPrefix}-header-col-0`}/> :
              null
          }
          {
            props.columns.map((column, columnIndex) => (
              <Th key={`${props.keyPrefix}-header-col-${columnIndex+1}`}>{column}</Th>
            ))
          }
          { menuHeader }
        </Tr>
      </Thead>
      {
        props.data.map((dataItem, dataIndex) => {
          rowIndex += 2
          return (
            <Tbody key={`${props.keyPrefix}-rowbody-${dataIndex}`} isExpanded={getExpanded(dataIndex)}>
              <Tr key={`${props.keyPrefix}-row-${rowIndex}`}>
                {
                  props.expanded_content ?
                    <Td key={`${props.keyPrefix}-row-${rowIndex}-col-0`} expand={{
                      rowIndex: dataIndex,
                      isExpanded: getExpanded(dataIndex),
                      onToggle: handleExpansionToggle,
                    }} /> :
                    null
                }
                {
                  props.columns.map((column, columnIndex) => (
                    <Td key={`${props.keyPrefix}-row-${rowIndex}-col-${columnIndex+1}`} dataLabel={column}>
                      {
                        props.data_modifier ?
                          props.data_modifier(dataItem, props.column_fields[columnIndex]) :
                          dataItem[props.column_fields[columnIndex]]
                      }
                    </Td>
                  ))
                }
                {menuBody(dataItem)}
              </Tr>
              {
                props.expanded_content ? (
                  <Tr key={`${props.keyPrefix}-row-${rowIndex + 1}`}
                      isExpanded={getExpanded(dataIndex)}>
                    <Td />
                    <Td key={`${props.keyPrefix}-row-${rowIndex + 1}-col-0`}
                        colSpan={props.columns.length + 1}>
                      <ExpandableRowContent>
                        {props.expanded_content(dataItem)}
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

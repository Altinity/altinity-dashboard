import * as React from 'react';
import { ReactNode, useState } from 'react';
import { ContextSelector, ContextSelectorItem } from '@patternfly/react-core';

export const ListSelector: React.FunctionComponent<
  {
    onSelect?: (selected: string) => void
    listValues: string[]
    width?: string
  }> = (props) => {

  const [selected, setSelected] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [filterValue, setFilterValue] = useState("")
  const [isDropDownOpen, setIsDropDownOpen] = useState(false)

  // The following code is a hacky workaround for a problem where when menuApplyTo
  // is set to document.body, the ContextSelector's onSelect doesn't fire if you
  // select an item quickly after first opening the dropdown.  Stepping through
  // the process of opening and closing the drop-down seems to establish the
  // necessary conditions for onSelect to work correctly.
  const [startupState, setStartupState] = useState(0)
  const [startupTimer, setStartupTimer] = useState<NodeJS.Timeout|undefined>(undefined)
  switch(startupState) {
    case 0:
      setIsDropDownOpen(true)
      setStartupTimer(setTimeout(() => {setStartupState(2)}, 5))
      setStartupState(1)
      break
    case 1:
      // waiting for setTimeout to happen
      break
    case 2:
      setIsDropDownOpen(false)
      if (startupTimer) clearTimeout(startupTimer)
      setStartupTimer(undefined)
      setStartupState(3)
      break
    case 3:
      // normal operation
      break
  }
  // End of terrible hack

  const onToggle = (event: Event, isDropDownOpen: boolean): void => {
    setIsDropDownOpen(isDropDownOpen)
  }
  const onSelect = (event: Event, value: ReactNode): void => {
    const newSelected = value ? value.toString() : ""
    if (props.onSelect) {
      props.onSelect(newSelected)
    }
    setSelected(newSelected)
    setIsDropDownOpen(false)
  }
  const onSearchInputChange = (value: string): void => {
    setSearchValue(value)
    if (value === "") {
      setFilterValue("")
    }
  }
  const onSearchButtonClick = (): void => {
    setFilterValue(searchValue)
  }
  return (
    <ContextSelector
      toggleText={selected}
      onSearchInputChange={onSearchInputChange}
      isOpen={isDropDownOpen}
      searchInputValue={searchValue}
      onToggle={onToggle}
      onSelect={onSelect}
      onSearchButtonClick={onSearchButtonClick}
      menuAppendTo={() => { return document.body }}
    >
      {
        (filterValue === ''
          ? props.listValues
          : props.listValues.filter((item): boolean => {
            return item.toLowerCase().indexOf(filterValue.toLowerCase()) !== -1
          }))
        .map((text, index) => {
          return (
            <ContextSelectorItem key={index}>{text}</ContextSelectorItem>
          )
        })
      }
    </ContextSelector>
  )
}

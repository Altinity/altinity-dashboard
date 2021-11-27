import * as React from 'react';
import { ReactNode, useEffect, useState } from 'react';
import { ContextSelector, ContextSelectorItem } from '@patternfly/react-core';
import { fetchWithErrorHandling } from '@app/utils/fetchWithErrorHandling';

interface Namespace {
  name: string
}

const NamespaceSelector: React.FunctionComponent<
  {
    onSelect?: (selected: string) => void
  }> = (props) => {

  const [selected, setSelected] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [filteredItems, setFilteredItems] = useState(new Array<string>())
  const [isDropDownOpen, setIsDropDownOpen] = useState(false)
  const [namespaces, setNamespaces] = useState(new Array<Namespace>())

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
  }
  const onSearchButtonClick = (): void => {
    const filtered =
      searchValue === ''
        ? namespaces
        : namespaces.filter((item: Namespace): boolean => {
          return item.name.toLowerCase().indexOf(searchValue.toLowerCase()) !== -1
        });
    setFilteredItems(filtered.map((value: Namespace): string => { return value.name }))
  }
  useEffect(() => {
    fetchWithErrorHandling(`/api/v1/namespaces`, 'GET',
      undefined,
      (response, body) => {
        const ns = body ? body as Namespace[] : []
        setNamespaces(ns)
        setFilteredItems(ns.map((value): string => {
          return value.name
        }))
      },
      () => {
        setNamespaces([])
        setFilteredItems([].map((): string => ""))
      }
    )
  }, [])
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
      {filteredItems.map((text, index) => {
        return (
          <ContextSelectorItem key={index}>{text}</ContextSelectorItem>
        )
      })}
    </ContextSelector>
  )
}

export { Namespace, NamespaceSelector };

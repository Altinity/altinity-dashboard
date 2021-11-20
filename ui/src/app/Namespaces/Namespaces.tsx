import * as React from 'react';
import { ReactElement, ReactNode, SyntheticEvent } from 'react';
import { ContextSelector, ContextSelectorItem } from '@patternfly/react-core';

interface Namespace {
  name: string
}

class NamespaceSelector extends React.Component<
  {
    onSelect?: (string) => void
  },
  {
    selected: string
    searchValue: string
    filteredItems: Array<string>
    isDropdownOpen: boolean
    isFirstTime: boolean
    namespaces: Array<Namespace>
  }> {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(props) {
    super(props)
    this.state = {
      selected: "",
      searchValue: "",
      filteredItems: new Array<string>(),
      isDropdownOpen: true,
      isFirstTime: true,
      namespaces: new Array<Namespace>(),
    }
  }
  onToggle = (event: Event, isDropdownOpen: boolean): void => {
    this.setState({
      isDropdownOpen: isDropdownOpen
    })
  }
  onSelect = (event: SyntheticEvent<HTMLDivElement, Event>, value: ReactNode): void => {
    this.setState({
      selected: value ? value.toString() : "",
      isDropdownOpen: !this.state.isDropdownOpen
    }, () => {
      if (this.props.onSelect) {
        this.props.onSelect(this.state.selected)
      }
    })
  }
  onSearchInputChange = (value: string): void => {
    this.setState({
      searchValue: value
    })
  }
  onSearchButtonClick = (): void => {
    const filtered =
      this.state.searchValue === ''
        ? this.state.namespaces
        : this.state.namespaces.filter((item: Namespace): boolean => {
          return item.name.toLowerCase().indexOf(this.state.searchValue.toLowerCase()) !== -1
        });
    this.setState({
      filteredItems: filtered.map((value: Namespace): string => { return value.name })
    });
  }
  componentDidMount(): void {
    fetch('/api/v1/namespaces')
      .then(res => res.json())
      .then(res => {
        return res as Namespace[]
      })
      .then(res => {
        this.setState({
          namespaces: res,
          filteredItems: res.map((value: Namespace): string => { return value.name })
        })
      })
  }
  render(): ReactElement {
    if (this.state.isFirstTime) {
      setTimeout(() => {
        this.setState({
          isFirstTime: false,
          isDropdownOpen: false
        }), 0
      })
    }
    return (
      <ContextSelector
        toggleText={this.state.selected}
        onSearchInputChange={this.onSearchInputChange}
        isOpen={this.state.isDropdownOpen}
        searchInputValue={this.state.searchValue}
        onToggle={this.onToggle}
        onSelect={this.onSelect}
        onSearchButtonClick={this.onSearchButtonClick}
        menuAppendTo={() => document.body}
      >
        {this.state.filteredItems.map((text, index) => {
          return (
            <ContextSelectorItem key={index}>{text}</ContextSelectorItem>
          )
        })}
      </ContextSelector>
    );
  }
}

export { Namespace, NamespaceSelector };

import * as React from 'react';
import { useEffect, useState } from 'react';
import { fetchWithErrorHandling } from '@app/utils/fetchWithErrorHandling';
import { ListSelector } from '@app/Components/ListSelector';

interface Namespace {
  name: string
}

const NamespaceSelector: React.FunctionComponent<
  {
    onSelect?: (selected: string) => void
  }> = (props) => {

  const [namespaces, setNamespaces] = useState(new Array<Namespace>())

  const onSelect = (selected: string): void => {
    if (props.onSelect) {
      props.onSelect(selected)
    }
  }
  useEffect(() => {
    fetchWithErrorHandling(`/api/v1/namespaces`, 'GET',
      undefined,
      (response, body) => {
        const ns = body ? body as Namespace[] : []
        setNamespaces(ns)
      },
      () => {
        setNamespaces([])
      }
    )
  }, [])
  return (
    <ListSelector
      listValues={namespaces.map((value) => (value.name))}
      onSelect={onSelect}
    />
  )
}

export { Namespace, NamespaceSelector };

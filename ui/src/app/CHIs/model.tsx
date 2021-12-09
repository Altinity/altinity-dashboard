export interface Container {
  name: string
  state: string
  image: string
}

export interface PersistentVolume {
  name: string
  phase: string
  storage_class: string
  capacity: number
  reclaim_policy: string
}

export interface PersistentVolumeClaim {
  name: string
  namespace: string
  phase: string
  storage_class: string
  capacity: number
  bound_pv: PersistentVolume|undefined
}

export interface FlattenedPVC {
  name: string
  namespace: string
  pv_name?: string
  phase: string
  storage_class: string
  capacity: number
  reclaim_policy?: string
}

export interface CHClusterPod {
  cluster_name: string
  name: string
  status: string
  containers: Array<Container>
  pvcs: Array<PersistentVolumeClaim>
}

export interface CHI {
  name: string
  namespace: string
  status: string
  clusters: bigint
  hosts: bigint
  external_url: string
  resource_yaml: string
  ch_cluster_pods: Array<CHClusterPod>
}

# QA-SRS001 Altinity Dashboard
# Software Requirements Specification

(c) 2022 Altinity Inc. All Rights Reserved.

**Document status:** Public

**Author:** vzakaznikov

**Date:** April 18, 2022

## Approval

**Status:** -

**Version:** -

**Approved by:** -

**Date:** -

## Table of Contents

* 1 [Revision History](#revision-history)
* 2 [Introduction](#introduction)
* 3 [Definitions](#definitions)
  * 3.1 [PV](#pv)
  * 3.2 [Altinity Dashboard](#altinity-dashboard)
  * 3.3 [ClickHouse Operator](#clickhouse-operator)
  * 3.4 [Deployment](#deployment)
  * 3.5 [Namespace](#namespace)
  * 3.6 [Pod](#pod)
  * 3.7 [ReplicaSet](#replicaset)
  * 3.8 [Service](#service)
  * 3.9 [PVC](#pvc)
  * 3.10 [CHI](#chi)
  * 3.11 [ConfigMap](#configmap)
* 4 [Requirements](#requirements)
  * 4.1 [General](#general)
      * 4.1.0.1 [RQ.SRS-0001.AltinityDashboard](#rqsrs-0001altinitydashboard)
  * 4.2 [Installation](#installation)
    * 4.2.1 [RQ.SRS-001.AltinityDashboard.Running](#rqsrs-001altinitydashboardrunning)
    * 4.2.2 [RQ.SRS-001.AltinityDashboard.Running.CommandLine](#rqsrs-001altinitydashboardrunningcommandline)
    * 4.2.3 [RQ.SRS-001.AltinityDashboard.Running.CommandLine.Options](#rqsrs-001altinitydashboardrunningcommandlineoptions)
  * 4.3 [Operating System Support](#operating-system-support)
    * 4.3.1 [RQ.SRS-001.AltinityDashboard.Supported.OS](#rqsrs-001altinitydashboardsupportedos)
  * 4.4 [Local Kubernetes distributions Compatibility ](#local-kubernetes-distributions-compatibility-)
    * 4.4.1 [RQ.SRS-001.AltinityDashboard.Minikube](#rqsrs-001altinitydashboardminikube)
    * 4.4.2 [RQ.SRS-001.AltinityDashboard.MicroK8s](#rqsrs-001altinitydashboardmicrok8s)
    * 4.4.3 [RQ.SRS-001.AltinityDashboard.Kind](#rqsrs-001altinitydashboardkind)
    * 4.4.4 [RQ.SRS-001.AltinityDashboard.K3S](#rqsrs-001altinitydashboardk3s)
    * 4.4.5 [RQ.SRS-001.AltinityDashboard.K0S](#rqsrs-001altinitydashboardk0s)
  * 4.5 [Deploying ClickHouse Operator](#deploying-clickhouse-operator)
    * 4.5.1 [RQ.SRS-001.AltinityDashboard.ClickHouse.Operator.Version](#rqsrs-001altinitydashboardclickhouseoperatorversion)
    * 4.5.2 [RQ.SRS-001.AltinityDashboard.ClickHouse.Operator.Version.Upgrade](#rqsrs-001altinitydashboardclickhouseoperatorversionupgrade)
  * 4.6 [ClickHouse Installation](#clickhouse-installation)
    * 4.6.1 [RQ.SRS-001.AltinityDashboard.ClickHouse.Installation.Manifest](#rqsrs-001altinitydashboardclickhouseinstallationmanifest)
    * 4.6.2 [RQ.SRS-001.AltinityDashboard.ClickHouse.Installation.Manifest.Editor](#rqsrs-001altinitydashboardclickhouseinstallationmanifesteditor)
    * 4.6.3 [RQ.SRS-001.AltinityDashboard.ClickHouse.Installation.Deploy](#rqsrs-001altinitydashboardclickhouseinstallationdeploy)

## Revision History

This document is stored in an electronic form using [Git] source control management software
hosted in a [GitLab Repository]. All the updates are tracked using the [Revision History].

## Introduction

This software requirements specification covers requirements related to [Altinity Dashboard] which is a UI for 
the [ClickHouse Operator] that creates, configures and manages [ClickHouse] clusters running on [Kubernetes].


## Definitions

### PV

Persistent volume.

### Altinity Dashboard

[Altinity]'s UI for [ClickHouse Operator] (https://github.com/Altinity/altinity-dashboard).


### ClickHouse Operator

[Altinity]'s [Kubernetes] operator for [ClickHouse] (https://github.com/Altinity/clickhouse-operator).

### Deployment

A deployment is a file that defines a [Pod]'s desired behavior or characteristics.

### Namespace

A namespace provides a mechanism for isolating groups of resources within a single [Kubernetes] cluster.
See https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/.

### Pod

One or more containers and is the smallest deployable unit of computing that you
can create and manage in [Kubernetes].
See https://kubernetes.io/docs/concepts/workloads/pods/.

### ReplicaSet

One or more [Pod]s that are tied by the create and update cycle.

### Service

Abstraction which allows to join one or more [Pod]s inside [Kubernetes] cluster
under one common DNS (domain name system) name and IP address.
It provides simple load balancing between those [Pod]s that are tied by the [Service]
and serves as an abstract way to expose an application running on a set of [Pods] as a network service
in [Kubernetes]. See https://kubernetes.io/docs/concepts/services-networking/service/.

### PVC

Request for abstract storage from [CSI] that may result in [PV] being mounted
at specific file system path (mount point) inside the [Pod].
See https://kubernetes.io/docs/concepts/storage/persistent-volumes/.

### CHI

Custom resource of `ClickHouseInstallation` kind that describes a [ClickHouse]
cluster inside [Kubernetes].

### ConfigMap

Allows to specify to define one or more configuration files that can be mounted inside a [Pod].
It is an API object used to store non-confidential data in key-value pairs.
[Pods] can consume [ConfigMaps] as environment variables, command-line arguments,
or as configuration files in a volume.
See https://kubernetes.io/docs/concepts/configuration/configmap/.


## Requirements

### General

##### RQ.SRS-0001.AltinityDashboard
version: 1.0

[Altinity Dashboard] SHALL support the painless deployment of [ClickHouse Operator] in clusters running on [Kubernetes].

### Installation

#### RQ.SRS-001.AltinityDashboard.Running
version: 1.0

[Altinity Dashboard] SHALL support running as a local web server in a default web browser.

#### RQ.SRS-001.AltinityDashboard.Running.CommandLine
version: 1.0

[Altinity Dashboard] SHALL started in a default web browser from the command line with the command:
>`./adash-linux-* --openbrowser`

#### RQ.SRS-001.AltinityDashboard.Running.CommandLine.Options
version: 1.0

[Altinity Dashboard] SHALL support different command-line options:
```
Usage of adash:
  -bindhost string
    	host to bind to (use 0.0.0.0 for all interfaces) (default "localhost")
  -bindport string
    	port to listen on
  -debug
    	enable debug logging
  -devmode
    	show Developer Tools tab
  -kubeconfig string
    	path to the kubeconfig file
  -notoken
    	do not require an auth token to access the UI
  -openbrowser
    	open the UI in a web browser after starting
  -selfsigned
    	run TLS using self-signed key
  -tlscert string
    	certificate file to use to serve TLS
  -tlskey string
    	private key file to use to serve TLS
  -version
    	show version and exit
```

### Operating System Support

#### RQ.SRS-001.AltinityDashboard.Supported.OS
version: 1.0

[Altinity Dashboard] SHALL be executable in Windows, Mac, and Linux operating systems.

### Local Kubernetes distributions Compatibility 

#### RQ.SRS-001.AltinityDashboard.Minikube
version: 1.0

[Altinity Dashboard] SHALL support running on a Kubernetes cluster created by [Minikube].

#### RQ.SRS-001.AltinityDashboard.MicroK8s
version: 1.0

[Altinity Dashboard] SHALL support running on a Kubernetes cluster created by [Microk8s].

#### RQ.SRS-001.AltinityDashboard.Kind
version: 1.0

[Altinity Dashboard] SHALL support running on a Kubernetes cluster created by [Kind].

#### RQ.SRS-001.AltinityDashboard.K3S
version: 1.0

[Altinity Dashboard] SHALL support running on a Kubernetes cluster created by [k3s].

#### RQ.SRS-001.AltinityDashboard.K0S
version: 1.0

[Altinity Dashboard] SHALL support running on a Kubernetes cluster created by [k0s].

### Deploying ClickHouse Operator

#### RQ.SRS-001.AltinityDashboard.ClickHouse.Operator.Version
version: 1.0

[Altinity Dashboard] SHALL support the deployment of a specific version of [ClickHouse Operator].

#### RQ.SRS-001.AltinityDashboard.ClickHouse.Operator.Version.Upgrade
version: 1.0

[Altinity Dashboard] SHALL support upgrading [ClickHouse Operator] to the latest version.

### ClickHouse Installation

#### RQ.SRS-001.AltinityDashboard.ClickHouse.Installation.Manifest
version: 1.0

[Altinity Dashboard] SHALL allow a user to select predefined [ClickHouse] Installation manifest.

#### RQ.SRS-001.AltinityDashboard.ClickHouse.Installation.Manifest.Editor
version: 1.0

[Altinity Dashboard] SHALL allow a user to create [ClickHouse] Installation manifest using build-in text editor.

#### RQ.SRS-001.AltinityDashboard.ClickHouse.Installation.Deploy
version: 1.0

[Altinity Dashboard] SHALL support the deployment of [ClickHouse] Installation to different namespaces.


[Clickhouse Operator]: https://github.com/Altinity/clickhouse-operator
[Altinity Dashboard]: https://github.com/Altinity/altinity-dashboard
[ReplicaSet]: #replicaset
[Namespace]: #namespace
[OLM]: #olm
[Deployment]: #deployment
[SRS]: #srs
[CHI]: #chi
[PVC]: #pvc
[Pod]: #pod
[Pods]: #pod
[Service]: #service
[ConfigMap]: #configmap
[ConfigMaps]: #configmap
[Altinity]: https://altinity.com
[Kubernetes]: https://kubernetes.io/
[ClickHouse]: https://clickhouse.tech
[Gitlab repository]: https://gitlab.com/altinity-qa/documents/qa-srs026-clickhouse-operator/blob/main/QA_SRS026_ClickHouse_Operator.md
[Revision history]: https://gitlab.com/altinity-qa/documents/qa-srs026-clickhouse-operator/commits/main/QA_SRS026_ClickHouse_Operator.md
[Git]: https://git-scm.com/
[GitLab]: https://gitlab.com

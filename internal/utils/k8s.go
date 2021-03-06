package utils

import (
	"context"
	"encoding/json"
	"errors"
	chopclientset "github.com/altinity/clickhouse-operator/pkg/client/clientset/versioned"
	errors2 "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/serializer/yaml"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/discovery/cached/memory"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/restmapper"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
	"path/filepath"
	"strings"
	"sync"
)

type K8s struct {
	Config          *rest.Config
	Clientset       *kubernetes.Clientset
	ChopClientset   *chopclientset.Clientset
	DiscoveryClient *discovery.DiscoveryClient
	RESTMapper      *restmapper.DeferredDiscoveryRESTMapper
	DynamicClient   dynamic.Interface
	lock            *sync.RWMutex
}

type SelectorFunc func([]*unstructured.Unstructured) []*unstructured.Unstructured

var globalK8s *K8s

func InitK8s(kubeconfig string) error {
	var config *rest.Config
	var err error

	if kubeconfig == "" {
		config, err = rest.InClusterConfig()
		if err != nil {
			home := homedir.HomeDir()
			if home != "" {
				config, err = clientcmd.BuildConfigFromFlags("", filepath.Join(home, ".kube", "config"))
			}
		}
	} else {
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
	}
	if err != nil {
		return err
	}

	globalK8s = &K8s{
		Config: config,
		lock:   &sync.RWMutex{},
	}
	err = globalK8s.Reinit()
	if err != nil {
		return err
	}

	return nil
}

// GetK8s gets a reference to the global Kubernetes instance.  The caller must call ReleaseK8s.
func GetK8s() *K8s {
	if globalK8s == nil {
		panic("GetK8s called before InitK8s")
	}
	globalK8s.lock.RLock()
	return globalK8s
}

// ReleaseK8s releases the reference held by the caller.
func (k *K8s) ReleaseK8s() {
	k.lock.RUnlock()
}

// Reinit reinitializes Kubernetes.  The caller must not hold an open GetK8s() reference.
func (k *K8s) Reinit() error {
	k.lock.Lock()
	defer k.lock.Unlock()

	var err error

	k.Clientset, err = kubernetes.NewForConfig(k.Config)
	if err != nil {
		return err
	}

	k.ChopClientset, err = chopclientset.NewForConfig(k.Config)
	if err != nil {
		return err
	}

	k.DiscoveryClient, err = discovery.NewDiscoveryClientForConfig(k.Config)
	if err != nil {
		return err
	}

	k.RESTMapper = restmapper.NewDeferredDiscoveryRESTMapper(memory.NewMemCacheClient(k.DiscoveryClient))

	k.DynamicClient, err = dynamic.NewForConfig(k.Config)
	if err != nil {
		return err
	}

	return nil
}

var decUnstructured = yaml.NewDecodingSerializer(unstructured.UnstructuredJSONScheme)

func DecodeYAMLToObject(yaml string) (*unstructured.Unstructured, error) {
	obj := &unstructured.Unstructured{}
	_, _, err := decUnstructured.Decode([]byte(yaml), nil, obj)
	if err != nil {
		return nil, err
	}
	return obj, nil
}

var fieldManagerName = "altinity-dashboard"
var ErrNoNamespace = errors.New("could not determine namespace for namespace-scoped entity")
var ErrNamespaceConflict = errors.New("provided namespace conflicts with YAML object")

// doApplyWithSSA does a server-side apply of an object
func doApplyWithSSA(dr dynamic.ResourceInterface, obj *unstructured.Unstructured) error {
	// Marshal object into JSON
	data, err := json.Marshal(obj)
	if err != nil {
		return err
	}

	// Create or Update the object with SSA
	force := true
	_, err = dr.Patch(context.TODO(), obj.GetName(), types.ApplyPatchType, data, metav1.PatchOptions{
		FieldManager: fieldManagerName,
		Force:        &force,
	})
	if err != nil {
		return err
	}
	return nil
}

// doGetVerUpdate does a client-side apply of an object
func doGetVerUpdate(dr dynamic.ResourceInterface, obj *unstructured.Unstructured) error {
	// Retrieve current object from Kubernetes
	curObj, err := dr.Get(context.TODO(), obj.GetName(), metav1.GetOptions{})
	if err != nil {
		se := &errors2.StatusError{}
		if !errors.As(err, &se) || se.ErrStatus.Code != 404 {
			return err
		}
	}

	// Create or update the new object
	if err == nil {
		// If the old object existed, copy its version number to the new object
		obj.SetResourceVersion(curObj.GetResourceVersion())
		_, err = dr.Update(context.TODO(), obj, metav1.UpdateOptions{
			FieldManager: fieldManagerName,
		})
		if err != nil {
			return err
		}
	} else {
		_, err = dr.Create(context.TODO(), obj, metav1.CreateOptions{
			FieldManager: fieldManagerName,
		})
	}
	if err != nil {
		return err
	}
	return nil
}

// getDynamicREST gets a dynamic REST interface for a given unstructured object
func (k *K8s) getDynamicRest(obj *unstructured.Unstructured, namespace string) (dynamic.ResourceInterface, string, error) {
	k.lock.RLock()
	defer k.lock.RUnlock()

	gvk := obj.GroupVersionKind()
	var mapping *meta.RESTMapping
	mapping, err := k.RESTMapper.RESTMapping(gvk.GroupKind(), gvk.Version)
	if err != nil {
		return nil, "", err
	}

	// Obtain REST interface for the GVR
	var dr dynamic.ResourceInterface
	var finalNamespace string
	if mapping.Scope.Name() == meta.RESTScopeNameNamespace {
		// namespaced resources should specify the namespace
		objNamespace := obj.GetNamespace()
		switch {
		case namespace == "" && objNamespace == "":
			return nil, "", ErrNoNamespace
		case namespace == "":
			finalNamespace = objNamespace
		case objNamespace == "":
			finalNamespace = namespace
		case namespace != objNamespace:
			return nil, "", ErrNamespaceConflict
		default:
			finalNamespace = namespace
		}
		dr = k.DynamicClient.Resource(mapping.Resource).Namespace(finalNamespace)
	} else {
		dr = k.DynamicClient.Resource(mapping.Resource)
	}
	return dr, finalNamespace, nil
}

// doApplyOrDelete does an apply or delete of a given YAML string
// Adapted from https://ymmt2005.hatenablog.com/entry/2020/04/14/An_example_of_using_dynamic_client_of_k8s.io/client-go
func (k *K8s) doApplyOrDelete(yaml string, namespace string, doDelete bool, useSSA bool, selector SelectorFunc) error {
	k.lock.RLock()
	defer k.lock.RUnlock()

	// Split YAML into individual docs
	yamlDocs, err := SplitYAMLDocs(yaml)
	if err != nil {
		return err
	}

	// Parse YAML documents into objects
	candidates := make([]*unstructured.Unstructured, 0, len(yamlDocs))
	for _, yd := range yamlDocs {
		var obj *unstructured.Unstructured
		obj, err = DecodeYAMLToObject(yd)
		if err != nil {
			return err
		}
		candidates = append(candidates, obj)
	}

	// Call selector to determine which objects should be processed
	if selector != nil {
		candidates = selector(candidates)
	}

	for _, obj := range candidates {
		var dr dynamic.ResourceInterface
		var finalNamespace string
		dr, finalNamespace, err = k.getDynamicRest(obj, namespace)
		if doDelete && namespace != "" && finalNamespace == "" {
			// don't delete cluster-wide resources if delete is namespace scoped
			continue
		}

		switch {
		case doDelete:
			err = dr.Delete(context.TODO(), obj.GetName(), metav1.DeleteOptions{})
			var se *errors2.StatusError
			if errors.As(err, &se) {
				if se.Status().Reason == metav1.StatusReasonNotFound {
					// If we're trying to delete, "not found" is fine
					err = nil
				}
			}
		case !doDelete && useSSA:
			err = doApplyWithSSA(dr, obj)
		case !doDelete && !useSSA:
			err = doGetVerUpdate(dr, obj)
		}
		if err != nil {
			return err
		}
	}
	return nil
}

// MultiYamlApply does a server-side apply of a given YAML string, which may contain multiple documents
func (k *K8s) MultiYamlApply(yaml string, namespace string) error {
	return k.doApplyOrDelete(yaml, namespace, false, true, nil)
}

// MultiYamlApplySelectively does a selective server-side apply of multiple docs from a given YAML string
func (k *K8s) MultiYamlApplySelectively(yaml string, namespace string, selector SelectorFunc) error {
	return k.doApplyOrDelete(yaml, namespace, false, true, selector)
}

// MultiYamlDelete deletes the resources identified in a given YAML string
func (k *K8s) MultiYamlDelete(yaml string, namespace string) error {
	return k.doApplyOrDelete(yaml, namespace, true, false, nil)
}

var ErrOperatorNotDeployed = errors.New("the ClickHouse Operator is not fully deployed")

// singleYamlCreateOrUpdate creates or updates a new resource from a single YAML spec
func (k *K8s) singleYamlCreateOrUpdate(obj *unstructured.Unstructured, namespace string, doCreate bool) error {
	k.lock.RLock()
	defer k.lock.RUnlock()

	gdr := func() (dynamic.ResourceInterface, error) {
		dr, _, err := k.getDynamicRest(obj, namespace)
		if err != nil {
			var nkm *meta.NoKindMatchError
			if errors.As(err, &nkm) {
				if strings.HasPrefix(nkm.GroupKind.Kind, "ClickHouse") {
					return nil, ErrOperatorNotDeployed
				}
			}
			return nil, err
		}
		return dr, nil
	}
	dr, err := gdr()
	if errors.Is(err, ErrOperatorNotDeployed) {
		// Before returning ErrOperatorNotDeployed, try reinitializing the K8s client, which may
		// be holding old information in its cache.  (For example, it may not know about a CRD.)
		k.lock.RUnlock()
		err = k.Reinit()
		k.lock.RLock()
		if err != nil {
			return err
		}
		dr, err = gdr()
	}
	if err != nil {
		return err
	}

	if doCreate {
		_, err = dr.Create(context.TODO(), obj, metav1.CreateOptions{
			FieldManager: fieldManagerName,
		})
	} else {
		_, err = dr.Update(context.TODO(), obj, metav1.UpdateOptions{
			FieldManager: fieldManagerName,
		})
	}
	if err != nil {
		return err
	}
	return nil
}

// SingleObjectCreate creates a new resource from a single unstructured object
func (k *K8s) SingleObjectCreate(obj *unstructured.Unstructured, namespace string) error {
	return k.singleYamlCreateOrUpdate(obj, namespace, true)
}

// SingleObjectUpdate updates an existing object from a single unstructured object
func (k *K8s) SingleObjectUpdate(obj *unstructured.Unstructured, namespace string) error {
	return k.singleYamlCreateOrUpdate(obj, namespace, false)
}

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
)

type Info struct {
	Config        *rest.Config
	Clientset     *kubernetes.Clientset
	ChopClientset *chopclientset.Clientset
}

type SelectorFunc func([]*unstructured.Unstructured) []*unstructured.Unstructured

var globalK8s *Info

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

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return err
	}

	chopClientset, err := chopclientset.NewForConfig(config)
	if err != nil {
		return err
	}

	globalK8s = &Info{
		Config:        config,
		Clientset:     clientset,
		ChopClientset: chopClientset,
	}

	return nil
}

func GetK8s() *Info {
	if globalK8s == nil {
		panic("GetK8s called before InitK8s")
	}
	return globalK8s
}

var decUnstructured = yaml.NewDecodingSerializer(unstructured.UnstructuredJSONScheme)

var errNoNamespace = errors.New("could not determine namespace for namespace-scoped entity")
var errNamespaceConflict = errors.New("provided namespace conflicts with YAML object")

// doApplyWithSSA does a server-side apply of an object
func (i *Info) doApplyWithSSA(dr dynamic.ResourceInterface, obj *unstructured.Unstructured) error {
	// Marshal object into JSON
	data, err := json.Marshal(obj)
	if err != nil {
		return err
	}

	// Create or Update the object with SSA
	force := true
	_, err = dr.Patch(context.TODO(), obj.GetName(), types.ApplyPatchType, data, metav1.PatchOptions{
		FieldManager: "altinity-dashboard",
		Force:        &force,
	})
	if err != nil {
		return err
	}
	return nil
}

// doGetVerUpdate does a client-side apply of an object
func (i *Info) doGetVerUpdate(dr dynamic.ResourceInterface, obj *unstructured.Unstructured) error {
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
		_, err = dr.Update(context.TODO(), obj, metav1.UpdateOptions{})
	} else {
		_, err = dr.Create(context.TODO(), obj, metav1.CreateOptions{})
	}
	if err != nil {
		return err
	}
	return nil
}

// doApplyOrDelete does an apply or delete of a given YAML string
// Adapted from https://ymmt2005.hatenablog.com/entry/2020/04/14/An_example_of_using_dynamic_client_of_k8s.io/client-go
func (i *Info) doApplyOrDelete(yaml string, namespace string, doDelete bool, useSSA bool, selector SelectorFunc) error {
	// Split YAML into individual docs
	yamlDocs, err := SplitYAMLDocs(yaml)
	if err != nil {
		return err
	}

	// Prepare a RESTMapper to find GVR
	dc, err := discovery.NewDiscoveryClientForConfig(i.Config)
	if err != nil {
		return err
	}
	mapper := restmapper.NewDeferredDiscoveryRESTMapper(memory.NewMemCacheClient(dc))

	// Prepare the dynamic client
	var dyn dynamic.Interface
	dyn, err = dynamic.NewForConfig(i.Config)
	if err != nil {
		return err
	}

	yamlCandidates := make([]*unstructured.Unstructured, 0, len(yamlDocs))

	for _, yd := range yamlDocs {
		// Decode YAML manifest into unstructured.Unstructured
		obj := &unstructured.Unstructured{}
		_, _, err = decUnstructured.Decode([]byte(yd), nil, obj)
		if err != nil {
			return err
		}
		yamlCandidates = append(yamlCandidates, obj)
	}

	// Call selector to determine which docs should be processed
	if selector != nil {
		yamlCandidates = selector(yamlCandidates)
	}

	for _, obj := range yamlCandidates {
		// Find GVR
		gvk := obj.GroupVersionKind()
		var mapping *meta.RESTMapping
		mapping, err = mapper.RESTMapping(gvk.GroupKind(), gvk.Version)
		if err != nil {
			return err
		}

		// Obtain REST interface for the GVR
		var dr dynamic.ResourceInterface
		if mapping.Scope.Name() == meta.RESTScopeNameNamespace {
			// namespaced resources should specify the namespace
			var finalNamespace string
			objNamespace := obj.GetNamespace()
			switch {
			case namespace == "" && objNamespace == "":
				return errNoNamespace
			case namespace == "":
				finalNamespace = objNamespace
			case objNamespace == "":
				finalNamespace = namespace
			case namespace != objNamespace:
				return errNamespaceConflict
			default:
				finalNamespace = namespace
			}
			dr = dyn.Resource(mapping.Resource).Namespace(finalNamespace)
		} else {
			// for cluster-wide resources
			if doDelete && namespace != "" {
				// don't delete cluster-wide resources if delete is namespace scoped
				continue
			}
			dr = dyn.Resource(mapping.Resource)
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
			err = i.doApplyWithSSA(dr, obj)
		case !doDelete && !useSSA:
			err = i.doGetVerUpdate(dr, obj)
		}
		if err != nil {
			return err
		}
	}
	return nil
}

// DoApply does a server-side apply of a given YAML string
func (i *Info) DoApply(yaml string, namespace string) error {
	return i.doApplyOrDelete(yaml, namespace, false, true, nil)
}

// DoApplySelectively does a selective server-side apply of some docs from a given YAML string
func (i *Info) DoApplySelectively(yaml string, namespace string, selector SelectorFunc) error {
	return i.doApplyOrDelete(yaml, namespace, false, true, selector)
}

// DoDelete deletes the resources identified in a given YAML string
func (i *Info) DoDelete(yaml string, namespace string) error {
	return i.doApplyOrDelete(yaml, namespace, true, false, nil)
}

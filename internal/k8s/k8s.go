package k8s

import (
	"context"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

type K8s interface {
	GetPods() (*v1.PodList, error)
}

type k8s struct {
	clientset *kubernetes.Clientset
}

var globalK8s *k8s

func InitK8s(kubeconfig string) error {
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return err
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return err
	}

	globalK8s = &k8s{
		clientset: clientset,
	}

	return nil
}

func GetK8s() K8s {
	return globalK8s
}

func (k *k8s) GetPods() (*v1.PodList, error) {
	pods, err := k.clientset.CoreV1().Pods("").List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return pods, nil
}

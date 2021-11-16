package k8s

import (
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
	"path/filepath"
)

type K8sInfo struct {
	Config *rest.Config
	Clientset *kubernetes.Clientset
}

var globalK8s *K8sInfo

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

	globalK8s = &K8sInfo{
		Config:    config,
		Clientset: clientset,
	}

	return nil
}

func GetK8s() *K8sInfo {
	return globalK8s
}
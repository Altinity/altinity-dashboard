package api

import (
	"context"
	"github.com/altinity/altinity-dashboard/internal/k8s"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
)

func getContainersFromPod(pod corev1.Pod) []Container {
	cs := pod.Status.ContainerStatuses
	list := make([]Container, 0, len(cs))
	for _, c := range cs {
		state := "Unknown"
		switch {
		case c.State.Terminated != nil:
			state = "Terminated"
		case c.State.Running != nil:
			state = "Running"
		case c.State.Waiting != nil:
			state = "Waiting"
		}
		list = append(list, Container{
			Name:  c.Name,
			State: state,
			Image: c.Image,
		})
	}
	return list
}

func getK8sPodsFromLabelSelector(namespace string, selector *metav1.LabelSelector) (*corev1.PodList, error) {
	ls, err := metav1.LabelSelectorAsMap(selector)
	if err != nil {
		return nil, err
	}
	pods, err := k8s.GetK8s().Clientset.CoreV1().Pods(namespace).List(context.TODO(),
		metav1.ListOptions{
			LabelSelector: labels.SelectorFromSet(ls).String(),
		},
	)
	if err != nil {
		return nil, err
	}
	return pods, nil
}

func getK8sServicesFromLabelSelector(namespace string, selector *metav1.LabelSelector) (*corev1.ServiceList, error) {
	ls, err := metav1.LabelSelectorAsMap(selector)
	if err != nil {
		return nil, err
	}
	services, err := k8s.GetK8s().Clientset.CoreV1().Services(namespace).List(context.TODO(),
		metav1.ListOptions{
			LabelSelector: labels.SelectorFromSet(ls).String(),
		},
	)
	if err != nil {
		return nil, err
	}
	return services, nil
}

func getPodsFromK8sPods(pods *corev1.PodList) []Pod {
	list := make([]Pod, 0, len(pods.Items))
	for _, pod := range pods.Items {
		list = append(list, Pod{
			Name:       pod.Name,
			Status:     string(pod.Status.Phase),
			Containers: getContainersFromPod(pod),
		})
	}
	return list
}

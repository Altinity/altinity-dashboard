package api

import (
	"context"
	"errors"
	"github.com/altinity/altinity-dashboard/internal/utils"
	corev1 "k8s.io/api/core/v1"
	errors2 "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
)

func getContainersFromPod(pod *corev1.Pod) []Container {
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

func getPVCsFromPod(pod *corev1.Pod) ([]PersistentVolumeClaim, error) {
	k := utils.GetK8s()
	defer func() { k.ReleaseK8s() }()

	list := make([]PersistentVolumeClaim, 0)
	for _, vol := range pod.Spec.Volumes {
		if vol.PersistentVolumeClaim != nil {
			pvc, err := k.Clientset.CoreV1().PersistentVolumeClaims(pod.Namespace).Get(context.TODO(),
				vol.PersistentVolumeClaim.ClaimName, metav1.GetOptions{})
			if err != nil {
				return nil, err
			}
			var pv *corev1.PersistentVolume
			if pvc.Spec.VolumeName != "" {
				pv, err = k.Clientset.CoreV1().PersistentVolumes().Get(context.TODO(),
					pvc.Spec.VolumeName, metav1.GetOptions{})
				if err != nil {
					pv = nil
					var sv *errors2.StatusError
					if errors.As(err, &sv) {
						if sv.ErrStatus.Reason != "NotFound" {
							return nil, err
						}
					} else {
						return nil, err
					}
				}
			}
			var boundPV *PersistentVolume
			if pv != nil {
				var storageCapacity int64
				stor := pv.Spec.Capacity.Storage()
				if stor != nil {
					storageCapacity = stor.Value()
				}
				boundPV = &PersistentVolume{
					Name:          pv.Name,
					Phase:         string(pv.Status.Phase),
					StorageClass:  pv.Spec.StorageClassName,
					Capacity:      storageCapacity,
					ReclaimPolicy: string(pv.Spec.PersistentVolumeReclaimPolicy),
				}
			}
			var storageClass string
			if pvc.Spec.StorageClassName != nil {
				storageClass = *pvc.Spec.StorageClassName
			}
			var storageCapacity int64
			stor := pvc.Spec.Resources.Requests.Storage()
			if stor != nil {
				storageCapacity = stor.Value()
			}
			list = append(list, PersistentVolumeClaim{
				Name:         pvc.Name,
				Namespace:    pvc.Namespace,
				Phase:        string(pvc.Status.Phase),
				StorageClass: storageClass,
				Capacity:     storageCapacity,
				BoundPV:      boundPV,
			})
		}
	}
	return list, nil
}

func getK8sPodsFromLabelSelector(namespace string, selector *metav1.LabelSelector) (*corev1.PodList, error) {
	ls, err := metav1.LabelSelectorAsMap(selector)
	if err != nil {
		return nil, err
	}
	k := utils.GetK8s()
	defer func() { k.ReleaseK8s() }()
	pods, err := k.Clientset.CoreV1().Pods(namespace).List(context.TODO(),
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
	k := utils.GetK8s()
	defer func() { k.ReleaseK8s() }()
	var services *corev1.ServiceList
	services, err = k.Clientset.CoreV1().Services(namespace).List(context.TODO(),
		metav1.ListOptions{
			LabelSelector: labels.SelectorFromSet(ls).String(),
		},
	)
	if err != nil {
		return nil, err
	}
	return services, nil
}

func getPodFromK8sPod(pod *corev1.Pod) (*Pod, error) {
	pvcs, err := getPVCsFromPod(pod)
	if err != nil {
		return nil, err
	}
	return &Pod{
		Name:       pod.Name,
		Node:       pod.Spec.NodeName,
		Status:     string(pod.Status.Phase),
		Containers: getContainersFromPod(pod),
		PVCs:       pvcs,
	}, nil
}

func getPodsFromK8sPods(pods *corev1.PodList) ([]*Pod, error) {
	list := make([]*Pod, 0, len(pods.Items))
	for i := range pods.Items {
		k8pod := pods.Items[i]
		pod, err := getPodFromK8sPod(&k8pod)
		if err != nil {
			return nil, err
		}
		list = append(list, pod)
	}
	return list, nil
}

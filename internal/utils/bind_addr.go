package utils

import (
	"fmt"
	"net"
)

var ErrInvalidAddress = fmt.Errorf("invalid address")

// GetOutboundIP gets the preferred outbound ip of this machine
func GetOutboundIP() (net.IP, error) {
	conn, err := net.Dial("udp", "1.1.1.1:80")
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = conn.Close()
	}()
	localAddr, ok := conn.LocalAddr().(*net.UDPAddr)
	if !ok {
		return nil, ErrInvalidAddress
	}
	return localAddr.IP, nil
}

// BindHostToLocalHost takes an address suitable for binding, which might be something like 0.0.0.0, and returns
// an address that can be connected to.
func BindHostToLocalHost(bindAddr string) (string, error) {
	globalBindAddrs := []string{
		"",
		"0.0.0.0",
		"::",
		"[::]",
	}
	isGlobalAddr := false
	for _, a := range globalBindAddrs {
		if bindAddr == a {
			isGlobalAddr = true
			break
		}
	}
	if isGlobalAddr {
		ga, err := GetOutboundIP()
		if err != nil {
			return "", err
		}
		return ga.String(), nil
	}
	return bindAddr, nil
}

package certs

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"github.com/coreos/etcd/pkg/fileutil"
	"io/ioutil"
	"math/big"
	"os"
	"time"
)

var filesToDelete []string

// GenerateSelfSignedCerts generates self-signed certs, and optionally deletes them on program exit
func GenerateSelfSignedCerts(RemoveOnExit bool) (certFileName string, keyFileName string, err error) {

	// Generate private key
	privKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return "", "", err
	}

	// Generate certificate
	template := &x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			Organization: []string{"Self-Signed"},
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(time.Hour * 24 * 365),
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}
	certBytes, err := x509.CreateCertificate(rand.Reader, template, template, &privKey.PublicKey, privKey)
	if err != nil {
		return "", "", err
	}

	// Write private key to file
	keyFile, err := ioutil.TempFile("", "self-signed-*.key")
	if err != nil {
		return "", "", err
	}
	err = keyFile.Chmod(fileutil.PrivateFileMode)
	if err != nil {
		return "", "", err
	}
	err = pem.Encode(keyFile, &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(privKey),
	})
	if err != nil {
		return "", "", err
	}
	err = keyFile.Close()
	if err != nil {
		return "", "", err
	}

	// Write certificate to file
	certFile, err := ioutil.TempFile("", "self-signed-*.crt")
	if err != nil {
		return "", "", err
	}
	err = pem.Encode(certFile, &pem.Block{
		Type:  "CERTIFICATE",
		Bytes: certBytes,
	})
	if err != nil {
		return "", "", err
	}
	err = certFile.Close()
	if err != nil {
		return "", "", err
	}

	if RemoveOnExit {
		filesToDelete = append(filesToDelete, keyFile.Name())
		filesToDelete = append(filesToDelete, certFile.Name())
	}

	return certFile.Name(), keyFile.Name(), nil
}

func init() {
	defer func() {
		for _, fn := range filesToDelete {
			_ = os.Remove(fn)
		}
	}()
}

Install Kind:
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.12.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin
mkdir ~/.kube
sudo chmod -R 755 ~/.kube

To verify the installation:
kind --version

Create Kind cluster:
kind create cluster

Verify the created cluster:
kind get clusters

If folder ~/.kube exists, ~/.kube/config file will create by Kind when creating the cluster

Start ClickHouse dashboard on Vagrant (start on host 0.0.0.0 and port 8081)

./adash-linux-x86_64 --bindhost 0.0.0.0 -bindport 8081

once started:

2022/01/30 18:47:19 Server started.  Connect using: http://10.0.2.15:8081?token=E9fYaKYGViBntEdtZfNNnsravnU7d5uhUJRqRhxIsas


Connect with Altinity dashboard from host (using host 0.0.0.0, port 8080 and generated token)

http://0.0.0.0:8080?token=E9fYaKYGViBntEdtZfNNnsravnU7d5uhUJRqRhxIsas

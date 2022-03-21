install k3s on vagrant user
curl -sfL https://get.k3s.io | sh -

To verify the installation:
systemctl status k3s

To start the Server:
sudo k3s server &

Add config into .kube folder:
mkdir ~/.kube
cd ~/.kube
sudo cat /etc/rancher/k3s/k3s.yaml > config

Note: 
If system restart needed need to start the k3s server again

Start ClickHouse dashboard on Vagrant (start on host 0.0.0.0 and port 8081)

./adash-linux-x86_64 --bindhost 0.0.0.0 -bindport 8081

once started:

2022/01/30 18:47:19 Server started.  Connect using: http://10.0.2.15:8081?token=E9fYaKYGViBntEdtZfNNnsravnU7d5uhUJRqRhxIsas


Connect with Altinity dashboard from host (using host 0.0.0.0, port 8080 and generated token)

http://0.0.0.0:8080?token=E9fYaKYGViBntEdtZfNNnsravnU7d5uhUJRqRhxIsas

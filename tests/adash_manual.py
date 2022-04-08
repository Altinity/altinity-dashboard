from testflows.core import *

@TestScenario
def run_on_vagrant_with_minikube(self):
    """Run Altinity Dashboard inside Vagrant with Minikube installed
    """
    vagrant_up_command = "vagrant up"
    vagrant_connect_command = "vagrant ssh"
    minikube_start_command = "minikube start"
    adash_start_command = "./adash-linux-x86_64 --bindhost 0.0.0.0 -bindport 8081 &"
    open_altinity_dashboard = "http://0.0.0.0:8080?token=<ADASH TOKEN>"
    link_to_altinity_dashboard_releases = "https://github.com/Altinity/altinity-dashboard/releases"
    vagrant_default_mounted_dir_in_host = "{path_to_dashboard_repo}/minikubeOnVagrant"
    vagrant_default_mounted_dir_in_vm = "cd /vagrant"
    make_executable_command = "chmod 0755 adash"
    server_url = "http://10.0.2.15:8081?token=E9fYaKYGViBntEdtZfNNnsravnU7d5uhUJRqRhxIsas"
    minikube_command_to_verify_deployment = " kubectl get pods --namespace kube-system"


    with Given("I start vagrant VM with minikube installed and port forwarding enabled", description=f"command: {vagrant_up_command}"):
        pass
    with And("I download the Altinity Dashboard latest binary file from GitHub", description=f"download link: {link_to_altinity_dashboard_releases}"):
        pass
    with And("I copy the Altinity Dashboard latest binary file to the vagrant file folder", description=f"file folder: {vagrant_default_mounted_dir_in_host}"):
        pass
    with And("I convert the Altinity Dashboard latest binary file to an executable", description=f"command: {make_executable_command}"):
        pass
    with When("I connect to vagrant VM using ssh", description=f"command: {vagrant_connect_command}"):
        pass
    with When("I change the directory to vagrant default mounted directory", description=f"command: {vagrant_default_mounted_dir_in_vm}"):
        pass
    with And("I start minikube inside the VM", description=f"command: {minikube_start_command}"):
        pass
    with And("I start Altinity Dashboard inside the VM with open host and 8081 port", description=f"command: {adash_start_command}"):
        pass
    with And("I copy the server url with generated token", description=f"server url example: {server_url}"):
        pass
    with And("I open the default browser in the host"):
        pass
    with And("I copy the server url in the browser"):
        pass
    with And("I connect to the Altinity Dashboard running inside the VM from the host mcahine", description=f"command: {open_altinity_dashboard}"):
        pass
    with And("I click ClickHouse Operators tab in the Altinity Dashboard"):
        pass
    with And("I click plus(+) button on the top of the table view"):
        pass
    with And("I select the namespace as kube-system"):
        pass
    with And("I click deploy button"):
        pass
    with And("I verify the ClickHouse Operator deployed inside the VM via Altinity Dashboard", description=f"command: {minikube_command_to_verify_deployment}"):
        pass
    with Then("I exit from the vagrant", description="command: exit"):
        pass
    with Then("I stop the vagrant VM", description="command: vagrant halt"):
        pass


@TestScenario
def run_on_vagrant_with_micro_k8s(self):
    """Run Altinity Dashboard inside Vagrant with micro k8s installed
    """
    vagrant_up_command = "vagrant up"
    vagrant_connect_command = "vagrant ssh"
    microk8s_start_command = "microk8s start"
    adash_start_command = "./adash-linux-x86_64 --bindhost 0.0.0.0 -bindport 8081 &"
    open_altinity_dashboard = "http://0.0.0.0:8080?token=<ADASH TOKEN>"
    link_to_altinity_dashboard_releases = "https://github.com/Altinity/altinity-dashboard/releases"
    vagrant_default_mounted_dir_in_host = "{path_to_dashboard_repo}/microK8SOnVagrant"
    vagrant_default_mounted_dir_in_vm = "cd /vagrant"
    make_executable_command = "chmod 0755 adash"
    server_url = "http://10.0.2.15:8081?token=E9fYaKYGViBntEdtZfNNnsravnU7d5uhUJRqRhxIsas"
    microk8s_command_to_verify_deployment = "microk8s.kubectl get pods --namespace kube-system"


    with Given("I start vagrant VM with microK8s installed and port forwarding enabled", description=f"command: {vagrant_up_command}"):
        pass
    with And("I download the Altinity Dashboard latest binary file from GitHub", description=f"download link: {link_to_altinity_dashboard_releases}"):
        pass
    with And("I copy the Altinity Dashboard latest binary file to the vagrant file folder", description=f"file folder: {vagrant_default_mounted_dir_in_host}"):
        pass
    with And("I convert the Altinity Dashboard latest binary file to an executable", description=f"command: {make_executable_command}"):
        pass
    with When("I connect to vagrant VM using ssh", description=f"command: {vagrant_connect_command}"):
        pass
    with When("I change the directory to vagrant default mounted directory", description=f"command: {vagrant_default_mounted_dir_in_vm}"):
        pass
    with And("I start microK8s inside the VM", description=f"command: {microk8s_start_command}"):
        pass
    with And("I start Altinity Dashboard inside the VM with open host and 8081 port", description=f"command: {adash_start_command}"):
        pass
    with And("I copy the server url with generated token", description=f"server url example: {server_url}"):
        pass
    with And("I open the default browser in the host"):
        pass
    with And("I copy the server url in the browser"):
        pass
    with And("I connect to the Altinity Dashboard running inside the VM from the host mcahine", description=f"command: {open_altinity_dashboard}"):
        pass
    with And("I click ClickHouse Operators tab in the Altinity Dashboard"):
        pass
    with And("I click plus(+) button on the top of the table view"):
        pass
    with And("I select the namespace as kube-system"):
        pass
    with And("I click deploy button"):
        pass
    with And("I verify the ClickHouse Operator deployed inside the VM via Altinity Dashboard", description=f"command: {microk8s_command_to_verify_deployment}"):
        pass
    with Then("I exit from the vagrant", description="command: exit"):
        pass
    with Then("I stop the vagrant VM", description="command: vagrant halt"):
        pass


@TestScenario
def run_on_vagrant_with_k3s_k8s(self):
    """Run Altinity Dashboard inside Vagrant with k3s installed
    """
    vagrant_up_command = "vagrant up"
    vagrant_connect_command = "vagrant ssh"
    adash_start_command = "./adash-linux-x86_64 --bindhost 0.0.0.0 -bindport 8081 &"
    open_altinity_dashboard = "http://0.0.0.0:8080?token=<ADASH TOKEN>"
    link_to_altinity_dashboard_releases = "https://github.com/Altinity/altinity-dashboard/releases"
    link_to_k3s_server_latest_release = "https://github.com/rancher/k3s/releases/latest"
    vagrant_default_mounted_dir_in_host = "{path_to_dashboard_repo}/K3sOnVagrant"
    vagrant_default_mounted_dir_in_vm = "cd /vagrant"
    make_executable_command = "chmod 0755 adash"
    server_url = "http://10.0.2.15:8081?token=E9fYaKYGViBntEdtZfNNnsravnU7d5uhUJRqRhxIsas"
    k3s_command_to_verify_deployment = "sudo kubectl get pods --namespace kube-public"
    k3s_status_verify_command = "systemctl status k3s"
    k3s_start_command = "sudo k3s server &"

    with Given("I start vagrant VM with k3s installed, kubeconfig file created and port forwarding enabled", description=f"command: {vagrant_up_command}"):
        pass
    with And("I download the Altinity Dashboard latest binary file from GitHub", description=f"download link: {link_to_altinity_dashboard_releases}"):
        pass
    with And("I copy the Altinity Dashboard latest binary file to the vagrant file folder", description=f"file folder: {vagrant_default_mounted_dir_in_host}"):
        pass
    with And("I convert the Altinity Dashboard latest binary file to an executable", description=f"command: {make_executable_command}"):
        pass
    with And("I download the k3s server from GitHub", description=f"download link: {link_to_k3s_server_latest_release}"):
        pass
    with And("I copy the k3s server file to the vagrant file folder", description=f"file folder: {vagrant_default_mounted_dir_in_host}"):
        pass
    with When("I connect to vagrant VM using ssh", description=f"command: {vagrant_connect_command}"):
        pass
    with When("I change the directory to vagrant default mounted directory", description=f"command: {vagrant_default_mounted_dir_in_vm}"):
        pass
    with When("I verify the status of the k3s", description=f"command: {k3s_status_verify_command}"):
        pass
    with And("I start k3s server inside the VM", description=f"command: {k3s_start_command}"):
        pass
    with And("I start Altinity Dashboard inside the VM with open host and 8081 port", description=f"command: {adash_start_command}"):
        pass
    with And("I copy the server url with generated token", description=f"server url example: {server_url}"):
        pass
    with And("I open the default browser in the host"):
        pass
    with And("I copy the server url in the browser"):
        pass
    with And("I connect to the Altinity Dashboard running inside the VM from the host mcahine", description=f"command: {open_altinity_dashboard}"):
        pass
    with And("I click ClickHouse Operators tab in the Altinity Dashboard"):
        pass
    with And("I click plus(+) button on the top of the table view"):
        pass
    with And("I select the namespace as kube-public"):
        pass
    with And("I click deploy button"):
        pass
    with And("I verify the ClickHouse Operator deployed inside the VM via Altinity Dashboard", description=f"command: {k3s_command_to_verify_deployment}"):
        pass
    with Then("I exit from the vagrant", description="command: exit"):
        pass
    with Then("I stop the vagrant VM", description="command: vagrant halt"):
        pass


@TestScenario
def run_on_vagrant_with_k0s_k8s(self):
    """Run Altinity Dashboard inside Vagrant with k0s installed
    """
    vagrant_up_command = "vagrant up"
    vagrant_connect_command = "vagrant ssh"
    adash_start_command = "./adash-linux-x86_64 --bindhost 0.0.0.0 -bindport 8081 &"
    open_altinity_dashboard = "http://0.0.0.0:8080?token=<ADASH TOKEN>"
    link_to_altinity_dashboard_releases = "https://github.com/Altinity/altinity-dashboard/releases"
    vagrant_default_mounted_dir_in_host = "{path_to_dashboard_repo}/K0sOnVagrant"
    vagrant_default_mounted_dir_in_vm = "cd /vagrant"
    make_executable_command = "chmod 0755 adash"
    server_url = "http://10.0.2.15:8081?token=E9fYaKYGViBntEdtZfNNnsravnU7d5uhUJRqRhxIsas"
    k0s_command_to_verify_deployment = "sudo k0s kubectl get pods --namespace default"
    k0s_status_verify_command = "sudo k0s status"
    k0s_start_command = "sudo k0s start"

    with Given("I start vagrant VM with k0s installed, kubeconfig file created and port forwarding enabled", description=f"command: {vagrant_up_command}"):
        pass
    with And("I download the Altinity Dashboard latest binary file from GitHub", description=f"download link: {link_to_altinity_dashboard_releases}"):
        pass
    with And("I copy the Altinity Dashboard latest binary file to the vagrant file folder", description=f"file folder: {vagrant_default_mounted_dir_in_host}"):
        pass
    with And("I convert the Altinity Dashboard latest binary file to an executable", description=f"command: {make_executable_command}"):
        pass
    with When("I connect to vagrant VM using ssh", description=f"command: {vagrant_connect_command}"):
        pass
    with When("I change the directory to vagrant default mounted directory", description=f"command: {vagrant_default_mounted_dir_in_vm}"):
        pass
    with When("I verify the status of the k3s", description=f"command: {k0s_status_verify_command}"):
        pass
    with And("I start Altinity Dashboard inside the VM with open host and 8081 port", description=f"command: {adash_start_command}"):
        pass
    with And("I copy the server url with generated token", description=f"server url example: {server_url}"):
        pass
    with And("I open the default browser in the host"):
        pass
    with And("I copy the server url in the browser"):
        pass
    with And("I connect to the Altinity Dashboard running inside the VM from the host mcahine", description=f"command: {open_altinity_dashboard}"):
        pass
    with And("I click ClickHouse Operators tab in the Altinity Dashboard"):
        pass
    with And("I click plus(+) button on the top of the table view"):
        pass
    with And("I select the namespace as default"):
        pass
    with And("I click deploy button"):
        pass
    with And("I verify the ClickHouse Operator deployed inside the VM via Altinity Dashboard", description=f"command: {k0s_command_to_verify_deployment}"):
        pass
    with And("I wait until the ClickHouse operator pod turns into Running status from ContainerCreating"):
        pass
    with And("I click ClickHouse Installations tab in the Altinity Dashboard"):
        pass
    with And("I click plus(+) button on the top of the table view"):
        pass
    with And("Select the '01-simple-layout-01-1shard-1repl.yaml' file from drop down menu"):
        pass
    with And("I select the namespace as default"):
        pass
    with And("I click Create button"):
        pass
    with And("I verify the ClickHouse Installation inside the VM via Altinity Dashboard", description=f"command: {k0s_command_to_verify_deployment}"):
        pass
    with And("I wait until the ClickHouse Installation pod turns into Running status from ContainerCreating"):
        pass
    with Then("I exit from the vagrant", description="command: exit"):
        pass
    with Then("I stop the vagrant VM", description="command: vagrant halt"):
        pass



@TestScenario
def run_on_vagrant_with_kind(self):
    """Run Altinity Dashboard inside Vagrant with Kind installed
    """
    vagrant_up_command = "vagrant up"
    vagrant_connect_command = "vagrant ssh"
    adash_start_command = "./adash-linux-x86_64 --bindhost 0.0.0.0 -bindport 8081 &"
    open_altinity_dashboard = "http://0.0.0.0:8080?token=<ADASH TOKEN>"
    link_to_altinity_dashboard_releases = "https://github.com/Altinity/altinity-dashboard/releases"
    vagrant_default_mounted_dir_in_host = "{path_to_dashboard_repo}/K0sOnVagrant"
    vagrant_default_mounted_dir_in_vm = "cd /vagrant"
    make_executable_command = "chmod 0755 adash"
    server_url = "http://10.0.2.15:8081?token=E9fYaKYGViBntEdtZfNNnsravnU7d5uhUJRqRhxIsas"
    command_to_verify_deployment = "kubectl get pods --namespace kube-system"
    kind_verify_cluster_command = "kind get clusters"

    with Given("I start vagrant VM with Kind installed, kubeconfig file created and port forwarding enabled", description=f"command: {vagrant_up_command}"):
        pass
    with And("I download the Altinity Dashboard latest binary file from GitHub", description=f"download link: {link_to_altinity_dashboard_releases}"):
        pass
    with And("I copy the Altinity Dashboard latest binary file to the vagrant file folder", description=f"file folder: {vagrant_default_mounted_dir_in_host}"):
        pass
    with And("I convert the Altinity Dashboard latest binary file to an executable", description=f"command: {make_executable_command}"):
        pass
    with When("I connect to vagrant VM using ssh", description=f"command: {vagrant_connect_command}"):
        pass
    with When("I change the directory to vagrant default mounted directory", description=f"command: {vagrant_default_mounted_dir_in_vm}"):
        pass
    with When("I verify the Kind cluster", description=f"command: {kind_verify_cluster_command}"):
        pass
    with And("I start Altinity Dashboard inside the VM with open host and 8081 port", description=f"command: {adash_start_command}"):
        pass
    with And("I copy the server url with generated token", description=f"server url example: {server_url}"):
        pass
    with And("I open the default browser in the host"):
        pass
    with And("I copy the server url in the browser"):
        pass
    with And("I connect to the Altinity Dashboard running inside the VM from the host mcahine", description=f"command: {open_altinity_dashboard}"):
        pass
    with And("I click ClickHouse Operators tab in the Altinity Dashboard"):
        pass
    with And("I click plus(+) button on the top of the table view"):
        pass
    with And("I select the namespace as kube-system"):
        pass
    with And("I click deploy button"):
        pass
    with And("I verify the ClickHouse Operator deployed inside the VM via Altinity Dashboard", description=f"command: {command_to_verify_deployment}"):
        pass
    with And("I wait until the ClickHouse operator pod turns into Running status from ContainerCreating"):
        pass
    with And("I click ClickHouse Installations tab in the Altinity Dashboard"):
        pass
    with And("I click plus(+) button on the top of the table view"):
        pass
    with And("Select the '03-persistent-volume-01-default-volume.yaml' file from drop down menu"):
        pass
    with And("I select the namespace as kube-system"):
        pass
    with And("I click Create button"):
        pass
    with And("I verify the ClickHouse Installation inside the VM via Altinity Dashboard", description=f"command: {command_to_verify_deployment}"):
        pass
    with And("I wait until the ClickHouse Installation pod turns into Running status from ContainerCreating"):
        pass
    with Then("I exit from the vagrant", description="command: exit"):
        pass
    with Then("I stop the vagrant VM", description="command: vagrant halt"):
        pass


@TestModule
@Name("adash on local k8s")
def adash_on_local_k8s(self):
    """Altinity Dashboard test on local kubernetes distros.
    """
    Scenario(run=run_on_vagrant_with_minikube, flags=TE | MANUAL)
    Scenario(run=run_on_vagrant_with_micro_k8s, flags=TE | MANUAL)
    Scenario(run=run_on_vagrant_with_k3s_k8s, flags=TE | MANUAL)
    Scenario(run=run_on_vagrant_with_k0s_k8s, flags=TE | MANUAL)
    Scenario(run=run_on_vagrant_with_kind, flags=TE | MANUAL)

if main():
    adash_on_local_k8s()

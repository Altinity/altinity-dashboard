from testflows.core import *

@TestScenario
def run_on_vagrant_with_minikube(self):
    """Run Altinity Dashboard in Vagrant with Minikube installed
    """
    vagrant_up_command = "vagrant up"
    vagrant_connect_command = "vagrant ssh"
    minikube_start_command = "minikube start"
    adash_start_command = "./adash-linux-x86_64 --bindhost 0.0.0.0 -bindport 8081 &"
    open_altinity_dashboard = "http://0.0.0.0:8080?token=<ADASH TOKEN>"
    link_to_altinity_dashboard_releases = "https://github.com/Altinity/altinity-dashboard/releases"
    vagrant_default_mounted_dir_in_host = "{directory_path}/Vagrantfile"
    vagrant_default_mounted_dir_in_vm = "cd /vagrant" 
    make_executable_command = "chmod 0755 adash"
    server_url = "http://10.0.2.15:8081?token=E9fYaKYGViBntEdtZfNNnsravnU7d5uhUJRqRhxIsas"
    minikube_command_to_verify_deployment = " kubectl get pods --namespace kube-system"


    with Given("I start vagrant vm with minikube installed and port forwarding enabled", description=f"command: {vagrant_up_command}"):
        pass
    with And("I download the Altinity Dashboard latest binary file from GitHub", description=f"download link: {link_to_altinity_dashboard_releases}"):
        pass
    with And("I copy the Altinity Dashboard latest binary file to the vagrant file folder", description=f"file folder: {vagrant_default_mounted_dir_in_host}"):
        pass
    with And("I convert the Altinity Dashboard latest binary file to an executable", description=f"command: {make_executable_command}"):
        pass
    with When("I connect to vagrant vm using ssh", description=f"command: {vagrant_connect_command}"):
        pass
    with When("I change the directory to vagrant default mounted directory", description=f"command: {vagrant_default_mounted_dir_in_vm}"):
        pass
    with And("I start minikube inside the vm", description=f"command: {minikube_start_command}"):
        pass
    with And("I start Altinity Dashboard inside the vm with open host and 8081 port", description=f"command: {adash_start_command}"):
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
    with And("I verify the ClickHouse Operator deployed inside the vm via Altinity Dashboard", description=f"command: {minikube_command_to_verify_deployment}"):
        pass
    with Then("I exit from the vagrant", description="command: exit"):
        pass
    with Then("I stop the vagrant vm", description="command: vagrant halt"):
        pass

@TestModule
@Name("adash on local k8s")
def adash_on_local_k8s(self):
    """Altinity Dashboard test on local kubernetes distros.
    """
    Scenario(run=run_on_vagrant_with_minikube, flags=TE | MANUAL)
    

if main():
    adash_on_local_k8s()

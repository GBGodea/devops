terraform {
  required_version = ">= 1.6.0"
}

resource "terraform_data" "clone_vm" {
  input = {
    base_vm_name = var.base_vm_name
    vm_name      = var.vm_name
    vm_memory    = var.vm_memory
    vm_cpus      = var.vm_cpus
  }

  triggers_replace = [
    var.base_vm_name,
    var.vm_name,
    tostring(var.vm_memory),
    tostring(var.vm_cpus)
  ]

  provisioner "local-exec" {
    interpreter = ["PowerShell", "-Command"]
    command     = <<EOT
VBoxManage clonevm "${var.base_vm_name}" --name "${var.vm_name}" --register --mode machine
VBoxManage modifyvm "${var.vm_name}" --memory ${var.vm_memory} --cpus ${var.vm_cpus}
VBoxManage startvm "${var.vm_name}" --type headless
EOT
  }

  provisioner "local-exec" {
    when        = destroy
    interpreter = ["PowerShell", "-Command"]
    command     = <<EOT
VBoxManage controlvm "${self.input.vm_name}" poweroff 2>$null
VBoxManage unregistervm "${self.input.vm_name}" --delete
EOT
  }
}
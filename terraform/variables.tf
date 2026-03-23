variable "base_vm_name" {
  type    = string
  default = "ubuntu server"
}

variable "vm_name" {
  type    = string
  default = "ubuntu-lab2"
}

variable "vm_memory" {
  type    = number
  default = 2048
}

variable "vm_cpus" {
  type    = number
  default = 2
}
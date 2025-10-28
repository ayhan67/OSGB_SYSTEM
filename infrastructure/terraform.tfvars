# Terraform variables for OSGB System

aws_region     = "us-east-1"
cluster_name   = "osgb-cluster"
vpc_cidr       = "10.0.0.0/16"
db_username    = "osgb_user"
db_password    = "osgb_password"
environment    = "dev"
backend_image  = "osgb/backend:latest"
frontend_image = "osgb/frontend:latest"
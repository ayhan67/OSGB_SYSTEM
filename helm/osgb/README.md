# OSGB Helm Chart

This Helm chart deploys the complete OSGB System on Kubernetes.

## Prerequisites

- Kubernetes 1.16+
- Helm 3.0+

## Installing the Chart

To install the chart with the release name `osgb`:

```bash
helm install osgb .
```

## Uninstalling the Chart

To uninstall/delete the `osgb` deployment:

```bash
helm delete osgb
```

## Configuration

The following table lists the configurable parameters of the OSGB chart and their default values.

### Global Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.imageRegistry` | Global Docker image registry | `""` |
| `global.imagePullSecrets` | Global Docker registry secret names as an array | `[]` |
| `global.storageClass` | Global storage class for dynamic provisioning | `""` |

### Namespace

| Parameter | Description | Default |
|-----------|-------------|---------|
| `namespace` | Kubernetes namespace to deploy to | `osgb-system` |

### Backend Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend.image.repository` | Backend image repository | `osgb/backend` |
| `backend.image.tag` | Backend image tag | `latest` |
| `backend.image.pullPolicy` | Backend image pull policy | `IfNotPresent` |
| `backend.replicaCount` | Number of backend replicas | `2` |
| `backend.service.type` | Backend service type | `ClusterIP` |
| `backend.service.port` | Backend service port | `5002` |
| `backend.resources.limits.cpu` | Backend CPU limit | `500m` |
| `backend.resources.limits.memory` | Backend memory limit | `512Mi` |
| `backend.resources.requests.cpu` | Backend CPU request | `250m` |
| `backend.resources.requests.memory` | Backend memory request | `128Mi` |

### Frontend Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `frontend.image.repository` | Frontend image repository | `osgb/frontend` |
| `frontend.image.tag` | Frontend image tag | `latest` |
| `frontend.image.pullPolicy` | Frontend image pull policy | `IfNotPresent` |
| `frontend.replicaCount` | Number of frontend replicas | `2` |
| `frontend.service.type` | Frontend service type | `LoadBalancer` |
| `frontend.service.port` | Frontend service port | `80` |
| `frontend.resources.limits.cpu` | Frontend CPU limit | `200m` |
| `frontend.resources.limits.memory` | Frontend memory limit | `256Mi` |
| `frontend.resources.requests.cpu` | Frontend CPU request | `100m` |
| `frontend.resources.requests.memory` | Frontend memory request | `64Mi` |

### MySQL Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `mysql.image.repository` | MySQL image repository | `mysql` |
| `mysql.image.tag` | MySQL image tag | `8.0` |
| `mysql.image.pullPolicy` | MySQL image pull policy | `IfNotPresent` |
| `mysql.replicaCount` | Number of MySQL replicas | `1` |
| `mysql.service.type` | MySQL service type | `ClusterIP` |
| `mysql.service.port` | MySQL service port | `3306` |
| `mysql.persistence.enabled` | Enable persistence using PVC | `true` |
| `mysql.persistence.size` | PVC storage request | `20Gi` |
| `mysql.persistence.accessModes` | PVC access modes | `["ReadWriteOnce"]` |
| `mysql.auth.rootPassword` | MySQL root password | `rootpassword` |
| `mysql.auth.username` | MySQL user name | `osgb_user` |
| `mysql.auth.password` | MySQL user password | `osgb_password` |
| `mysql.auth.database` | MySQL database name | `osgb_db` |

### Secrets Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `secrets.enabled` | Enable secrets | `true` |
| `secrets.mysql.rootPassword` | Base64 encoded MySQL root password | `cm9vdHBhc3N3b3Jk` |
| `secrets.mysql.username` | Base64 encoded MySQL username | `b3NnYl91c2Vy` |
| `secrets.mysql.password` | Base64 encoded MySQL password | `b3NnYl9wYXNzd29yZA==` |
| `secrets.jwt.secret` | Base64 encoded JWT secret | `c3VwZXJfc2VjdXJlX3JhbmRvbV9rZXlfIUAjMTIz` |

## Customizing the Chart

You can customize the chart by creating a `values.yaml` file with your desired values and passing it to the `helm install` command:

```bash
helm install osgb -f my-values.yaml .
```

## Upgrading the Chart

To upgrade the chart:

```bash
helm upgrade osgb .
```

## Rolling Back

To rollback to a previous release:

```bash
helm rollback osgb [REVISION]
```

This Helm chart provides a complete, production-ready deployment of the OSGB System on Kubernetes.
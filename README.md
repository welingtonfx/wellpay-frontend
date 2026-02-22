# WellpayFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## CI/CD (GitHub Actions + Vultr Kubernetes)

This project uses `.github/workflows/ci-cd.yml`.

### 1. Create Vultr resources
1. Create a **Kubernetes cluster** in Vultr.
2. Add at least one **node pool/node** (running).
3. Create a **Vultr Container Registry** (region `ewr`).
4. Create/push image repo: `ewr.vultrcr.com/wellpay/wellpay-frontend`.

### 2. Prepare Kubernetes
1. Download kubeconfig for the Vultr cluster.
2. Set namespace:
```bash
kubectl create namespace wellpay --dry-run=client -o yaml | kubectl apply -f -
```
3. Create image pull secret in `wellpay` namespace:
```bash
kubectl create secret docker-registry vcr-creds \
  --namespace wellpay \
  --docker-server=ewr.vultrcr.com \
  --docker-username='<VULTR_REGISTRY_USERNAME>' \
  --docker-password='<VULTR_REGISTRY_PASSWORD>'
```
4. Install NGINX ingress controller:
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer
```
5. Point DNS (`wellfx.store`) to ingress controller external IP.

### 3. Configure GitHub Secrets
Add repository secrets:
- `VULTR_REGISTRY_USERNAME`
- `VULTR_REGISTRY_PASSWORD`
- `KUBE_CONFIG` (base64 kubeconfig content)

Create `KUBE_CONFIG` value (print in terminal):
```bash
base64 -i path/to/your-kube-config.yaml
```

Create `KUBE_CONFIG` value (copy to clipboard on macOS):
```bash
base64 -i path/to/your-kube-config.yaml | pbcopy
```

### 4. Branch behavior
- Push to `main`: build Angular app only.
- Push/merge to `prod`: build app, build/push Docker image, deploy with Helm.

### 5. Helm path and deploy target
- Chart path: `src/helm`
- Namespace: `wellpay`
- Release: `wellpay-frontend`
- Image pull secret used by pipeline: `vcr-creds`

### 6. Validate deployment
```bash
kubectl get pods -n wellpay
kubectl get svc -n wellpay
kubectl get ingress -n wellpay
kubectl rollout status deployment/wellpay-frontend -n wellpay
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## SSL (cert-manager + Let's Encrypt)

### 1. Install cert-manager
```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true
```

### 2. Set ACME email in Helm values
Edit `src/helm/values.yaml`:
- `certManager.email`: your real email

### 3. Deploy/upgrade app chart
```bash
helm upgrade --install wellpay-frontend src/helm -n wellpay
```

### 4. Verify certificate issuance
```bash
kubectl get issuer -n wellpay
kubectl get certificate -n wellpay
kubectl describe certificate wellfx-store-tls -n wellpay
kubectl get secret wellfx-store-tls -n wellpay
```

### 5. Confirm HTTPS
Open `https://wellfx.store`.

Notes:
- DNS for `wellfx.store` must point to ingress-nginx external IP.
- For testing limits safely, use Let's Encrypt staging by setting:
  - `certManager.server: https://acme-staging-v02.api.letsencrypt.org/directory`

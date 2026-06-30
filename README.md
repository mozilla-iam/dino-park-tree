# dino-tree

The org chart service for DinoPark.

If you need to change the roots of the tree, see: `k8s/values/prod.yaml`.

## Hacking

```
# Ensure pnpm is installed (https://pnpm.io/installation):
corepack enable pnpm
# Install the deps:
pnpm i
# Run the tests:
pnpm test
# Preview the K8s configs:
helm template k8s --values k8s/values/prod.yaml
```

## Deploying

This application must be manually deployed, until we migrate our builds to
GitHub Actions. For staging and production, you _must_ cut a release with
`-test` or `-prod` respectively.

Deploy to dev:

```
AWS_PROFILE=iam-admin aws codebuild start-build \
    --project-name dino-park-tree \
    --environment-variables-override 'name=MANUAL_DEPLOY_TRIGGER,value=branch/master'
```

Deploy to staging:

```
# Cut a release: <MAJOR>.<MINOR>.<PATCH>-test
AWS_PROFILE=iam-admin aws codebuild start-build \
    --project-name dino-park-tree \
    --environment-variables-override 'name=MANUAL_DEPLOY_TRIGGER,value=tag/<MAJOR>.<MINOR>.<PATCH>-test'
```

Deploy to production:

```
# Cut a release: <MAJOR>.<MINOR>.<PATCH>-prod
AWS_PROFILE=iam-admin aws codebuild start-build \
    --project-name dino-park-tree \
    --environment-variables-override 'name=MANUAL_DEPLOY_TRIGGER,value=tag/<MAJOR>.<MINOR>.<PATCH>-prod'
```

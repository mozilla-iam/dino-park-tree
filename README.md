# dino-tree
The org chart service for DinoPark

## Deploying

This application must be manually deployed, until we migrate our builds to
GitHub Actions.

To deploy to the development and staging clusters, run:

```
AWS_PROFILE=iam-admin aws codebuild start-build \
    --project-name dino-park-tree \
    --environment-variables-override 'name=MANUAL_DEPLOY_TRIGGER,value=branch/master'
```

To deploy to the production environment, first cut a release (or tag) in the
form:

```
<MAJOR>.<MINOR>.<PATCH>-prod
```

Then run:

```
AWS_PROFILE=iam-admin aws codebuild start-build \
    --project-name dino-park-tree \
    --environment-variables-override 'name=MANUAL_DEPLOY_TRIGGER,value=tag/<MAJOR>.<MINOR>.<PATCH>-prod'
```

# post-buildkite-plugin

Post jobs recovery buildkite plugin (WIP)

# Post buildkite plugin

A [Buildkite plugin](https://buildkite.com/docs/agent/v3/plugins) for
running pipeline **serial** steps conditionally when a step has succeed
or failed

The post section defines one or more additional steps that are run upon
the completion of a command. post can support any of of the following
post-condition blocks: `failure`, `success`. These condition blocks
allow the execution of serial steps inside each condition depending on the
completion status of the step.

## Example

The following pipeline will execute `annotate.sh`, wait for completion, and then `cleanup.sh` only when the command fails

```yml
steps:
  - command: test.sh
    plugins:
      jmendiara/post#1.0.0:
        post:
          - when: failure
            # steps is a string, note the `|`
            steps: |
              - command: email.sh
              - wait
              - command: clenaup.sh
          - when: success
            # steps is a string, note the `|`
            steps: |
              - command: slack.sh
```

## How it works

The plugin tracks the `command` exit code, and starts adding
one step at a time dinamically using `buildkite-agent pipeline upload`

When adding a pipeline dynamically, it's executed by buildkite
directly after the step that added it.
But when a `wait` is found after a failure in this situation,
the execution will be aborted.
The plugin transform the pipeline and uses this trick to add
steps one after another, making possible to have a serial
pipeline (with `wait`) after failures.

## Current limitations

- Only shell scripts can be commands managed by the plugin.

This **does not** work

```yml
steps:
  - command: |
      echo "test"
      test.sh
    plugins:
      jmendiara/post#1.0.0: ...
```

Use this instead

```yml
steps:
  - command: my_command.sh
    plugins:
      jmendiara/post#1.0.0: ...
```

- Parallel steps in the steps sections are not allowed when using waits

This **does not** work

```yml
steps:
  - command: test.sh
    plugins:
      jmendiara/post#1.0.0:
        post:
          - when: failure
            steps: |
              - command: annotate.sh
              - command: email.sh
              - wait
              - command: clenaup.sh
```

But are allowed when not using `wait`

This work

```yml
steps:
  - command: test.sh
    plugins:
      jmendiara/post#1.0.0:
        post:
          - when: failure
            steps: |
              - command: annotate.sh
              - command: email.sh
              - command: clenaup.sh
```

- Only `wait` and `command` are available as steps in the post section

## License

Copyright 2018 [Telefónica](http://www.telefonica.com)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

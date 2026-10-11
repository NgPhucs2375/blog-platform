# Issue tracker: GitHub

Issues and specs for this repo live in GitHub Issues. Use the `gh` CLI for tracker operations; the repository is inferred from the `origin` remote.

## Conventions

- Create issues with `gh issue create --title "..." --body "..."`.
- Read issues with `gh issue view <number> --json number,title,body,labels,comments`.
- List issues with `gh issue list`, applying appropriate state and label filters.
- Comment with `gh issue comment <number> --body "..."`.
- Apply or remove labels with `gh issue edit <number> --add-label "..."` or `--remove-label "..."`.
- Close completed or declined issues with `gh issue close <number> --comment "..."`.
- Use GitHub sub-issues for parent/child work when available; otherwise put `Part of #<parent>` in the child issue.

## Pull requests as a triage surface

**PRs as a request surface: no.** Do not treat incoming pull requests as feature requests unless this setting is deliberately changed.

## Publishing and wayfinding

When a skill says to publish a spec or ticket to the tracker, create a GitHub issue. For large efforts, use one parent issue as the map and child issues as tickets. Record dependencies with GitHub issue dependencies when available; otherwise state `Blocked by: #<number>` in the issue body.

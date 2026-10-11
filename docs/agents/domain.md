# Domain Docs

This repository uses a single-context domain documentation layout.

## Before exploring

- Read `GLOSSARY.md` at the repository root if it exists.
- Read relevant decisions in `docs/adr/` if that directory exists.
- If these files do not exist, proceed without flagging their absence. Create them only when domain terms or architectural decisions need to be recorded.

## Use the glossary

Use the project's glossary terms consistently in code, issues, tests, and design discussions. If a needed term is missing, identify it as a candidate for domain modeling rather than silently introducing competing terminology.

## Surface ADR conflicts

If a proposed change conflicts with an existing ADR, identify the ADR and explain the conflict instead of silently overriding it.

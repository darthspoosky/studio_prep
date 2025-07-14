# Agent Guidelines

These notes outline expectations for contributors and automated agents working on this repository.

1. **Branching**: Development happens on the `work` branch. After testing, merge changes into `master`.
2. **Testing**: Always run `npm run lint` and `npm run typecheck` before merging. Address any errors where possible.
3. **Minimal Changes**: Follow the "surgical precision" principle described in `src/changelog.md` when modifying code.
4. **Documentation**: Update `changelog.md` with a summary of significant modifications and create or update issues/tasks as needed.
5. **Pull Requests**: Include a brief description of what was changed and reference any relevant tasks from `issues.md` or `tasklist.md`.

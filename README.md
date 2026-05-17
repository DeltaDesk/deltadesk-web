# `deltadesk/deltadesk-web`

DeltaDesk is a organization dashboard for gyms, specifically employee management and scheduling, build in the context of a uni software engineering practical course.

It is written in TypeScript and uses Next.js, React, Tailwind, Prisma, Supabase, Supabase Auth, Tabler Icons and Bun.

[Full Plan - German (.pdf)](https://fxoz.github.io/experiments-lab/SWE-Praktikum.pdf)

## Development

We recommend using [Bun](https://bun.sh/) as the JavaScript runtime and package manager for this project. Use `bun run dev` to start the development server.

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages. Please follow the format when making commits:

```yml
feat:           Feature addition or enhancement
docs:           Markdown changes, documentation updates
fix:            Bug fixes
chore:          Changes to the build process or auxiliary tools and libraries
refactor:       Code improvements that neither fix a bug nor add a feature
perf:           Performance improvements; use instead of refactor for significant performance improvements
test:           Adding missing tests or correcting existing tests
```

#### Syntax examples

- `feat: add new authentication endpoint`
  - Basic syntax: `<type>: <description>`
- `feat!: change port`
  - ! = Breaking change
- `feat(api)!: add new authentication endpoint`
  - (scope) = Provide basic context.

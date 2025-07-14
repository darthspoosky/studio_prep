# Known Issues

1. **TypeScript build errors**
   - Files affected: `src/ai/flows/newspaper-analysis-flow.ts`, `src/app/api/readArticle/route.ts`, `src/services/ideasService.ts`.
   - Running `npm run typecheck` reveals missing properties and implicit `any` types.
2. **ESLint not configured**
   - `npm run lint` prompts for configuration. There is no shared `.eslintrc` file.
3. **Next.js config ignores errors**
   - `next.config.ts` sets `ignoreBuildErrors` and `ignoreDuringBuilds` which allow builds to succeed despite problems.
4. **Missing automated tests**
   - There are no unit or integration tests defined in `package.json`.

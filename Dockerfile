FROM node:22-slim AS base

ENV CI=true
ENV SKIP_INSTALL_SIMPLE_GIT_HOOKS=true

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

ENV NODE_ENV=production

RUN corepack enable

COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

###########################
## PROD must be minimal ###
###########################

FROM gcr.io/distroless/nodejs22-debian12 AS prod
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/drizzle /app/drizzle
COPY --from=build /app/dist /app/dist

ENV NODE_ENV=production
ENV FORCE_COLOR=2

VOLUME /app/data
EXPOSE 2222

CMD [ "/app/dist/index.mjs" ]

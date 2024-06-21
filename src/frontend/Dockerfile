FROM node:22-alpine as build

WORKDIR /app 

ARG REACT_APP_API
ENV REACT_APP_API $REACT_APP_API

COPY . .

RUN yarn install && \
    yarn build

FROM nginx:alpine

COPY nginx/ /etc/nginx/templates/

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

# ENTRYPOINT ["tail", "-f", "/dev/null"] 


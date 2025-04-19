FROM node:20-alpine AS build
WORKDIR /app
# 复制 package.json 利用 Docker 的缓存机制，只有当这些文件发生变化时才会重新下载依赖
COPY package*.json ./
COPY yarn.lock ./
RUN npm config set registry https://registry.npmmirror.com/
# RUN npm install -g yarn
RUN yarn install
COPY . .
RUN yarn run build
RUN echo "编译成功"

FROM nginx:1.27-alpine-perl AS production-stage
COPY --from=build /app/dist /usr/share/nginx/html/dist
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
FROM kong:3.7
COPY kong.cloud.yml /kong/declarative/kong.yml
ENV KONG_DATABASE=off \
    KONG_DECLARATIVE_CONFIG=/kong/declarative/kong.yml \
    KONG_PROXY_LISTEN=0.0.0.0:8000 \
    KONG_ADMIN_LISTEN=0.0.0.0:8001 \
    KONG_LOG_LEVEL=notice
EXPOSE 8000 8001

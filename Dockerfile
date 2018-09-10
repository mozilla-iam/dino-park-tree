FROM rustlang/rust:nightly-slim
WORKDIR /dino-tree
COPY . /dino-tree
RUN cargo build --release

FROM debian:9-slim
WORKDIR /dino-tree
COPY --from=0  /dino-tree/target/release/dino-tree .
COPY profiles.json /tmp/
CMD ["./dino-tree"]  

FROM node

WORKDIR /app

COPY package.json .
RUN npm install --production
COPY . /app
RUN curl -O https://gist.githubusercontent.com/fiji-flo/9ce396f27ca705e14e64805df06c7561/raw/9e9dfc7b6a5a6a13b2c2b43d95cb9ccd70bef8bc/profiles.json
ENV DUMMY_JSON /app/profiles.json
CMD ["node", "-r", "esm", "index.js"]
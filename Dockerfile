FROM node

WORKDIR /app

COPY package.json .
RUN npm install --production
COPY . /app
RUN curl -O https://gist.githubusercontent.com/fiji-flo/9ce396f27ca705e14e64805df06c7561/raw/48e35022b65def6f1a56f60cc3942c0083c656ff/profiles.json
ENV DUMMY_JSON /app/profiles.json
CMD ["node", "-r", "esm", "index.js"]
# Use the official Node.js Alpine image as the base
FROM node:alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Run npm audit to check for vulnerabilities
RUN npm audit --production

# Create the logs directory
RUN mkdir -p /usr/src/app/logs && chown -R node:node /usr/src/app/logs

# Copy the rest of the application files
COPY . .

# Install OpenSSL for certificate generation
RUN apk add --no-cache openssl

# Generate self-signed TLS certificates
RUN openssl req -nodes -new -x509 \
    -keyout key.pem -out cert.pem -days 365 \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost" && \
    chmod 600 key.pem cert.pem

# Change ownership of the working directory
RUN chown -R node:node /usr/src/app/

# Set environment variables with default values
ENV PORT=443
ENV REDIRECT_URL='https://www.google.com'
ENV TZ='America/New_York'

# Expose the application port
EXPOSE 443

# Use a non-root user to run the application
USER node

# Start the application
CMD ["node", "app.js"]

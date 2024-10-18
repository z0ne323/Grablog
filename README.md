![Caspar_David_Friedrich_-_Wanderer_above_the_Sea_of_Fog](https://github.com/user-attachments/assets/f76153f9-6ad7-49d0-8970-a730128a6c30)

# Grablog

## Overview
Grablog (a Grabify like app) is a simple Node.js application that logs client requests and redirects users to a specified URL. It is designed for development and testing, providing an easy way to monitor requests and implement redirections over HTTPS.

## Features
- Logs client IP, user agent, and request method.
- Redirects users to a specified URL.
- Supports HTTPS with TLS certificate and key.
- Automatically generates self-signed TLS certificates for development.
- Configurable timezone via environment variables.
- Logs are stored within the container, organized in a dedicated directory.

## Environment Variables
- `PORT`: The port on which the application listens (default is `443`).
- `REDIRECT_URL`: The URL to which users will be redirected (default is `https://www.google.com`).
- `TZ`: The timezone for date formatting (default is `America/New_York`).

## Setup

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed (Node.js is optional for Docker users).

### Clone the repository
```bash
git clone https://github.com/z0ne323/Grablog
cd grablog
```

### Certificates
You have two options for TLS certificates:

1. **Use Custom Certificates**:
   - If you have your own TLS certificate and key, place them in the project directory and modify `app.js` to point to your files.
2. **Generate Self-Signed Certificates:**
   - The Dockerfile is configured to automatically generate a self-signed TLS certificate during the build process. This is useful for development environments.

### Docker Setup
1. **Build the Docker image:**
```bash
sudo docker build --no-cache -t grablog-image .
```
2. **Run the Application:** 
   - **From the Command Line:**
```bash
sudo docker run -p 443:443 --name grablog -e REDIRECT_URL='https://www.netflix.com' -e TZ='America/Los_Angeles' grablog-image
```
   - **From the Dockerfile:**  You can set default values for environment variables.

### Access the Application
Visit `https://localhost` (or your domain) to get redirected. You may receive a security warning due to the self-signed certificate. To bypass this warning, follow your browser's instructions for proceeding to the site.

### Logging
Logs will be saved in `logs/access.log`, in the format:
```text
2024-10-15 02:13:39 - IP: ::ffff:172.17.0.1, Method: GET, User Agent: Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0
```

### Troubleshooting
- f you encounter any issues with the container, you can stop and remove existing containers with:
```bash
sudo docker stop $(sudo docker ps -aq) && sudo docker rm $(sudo docker ps -aq)
```

### Contributing
Feel free to fork the repository and submit a pull request. 

// NGINX Configuration Generator Logic Engine

document.addEventListener("DOMContentLoaded", () => {
    // Select form control elements
    const inputs = document.querySelectorAll(
        "input[type='text'], input[type='number'], select, input[type='checkbox'], input[type='radio']"
    );

    // Initial listener setup
    inputs.forEach(input => {
        input.addEventListener("input", handleFormUpdate);
        input.addEventListener("change", handleFormUpdate);
    });

    // Special behavior hooks
    document.getElementById("sslEnable").addEventListener("change", toggleSslPanel);
    document.getElementById("rateLimitEnable").addEventListener("change", toggleRateLimitPanel);

    const radioTabs = document.querySelectorAll(".radio-tab-label input");
    radioTabs.forEach(radio => {
        radio.addEventListener("change", updateRadioTabsVisual);
    });

    // Initialize display states
    updateRadioTabsVisual();
    toggleSslPanel();
    toggleRateLimitPanel();

    // Trigger initial generation
    generateConfig();
});

// Update checked labels styling for templates selector
function updateRadioTabsVisual() {
    const labels = document.querySelectorAll(".radio-tab-label");
    labels.forEach(label => {
        const radio = label.querySelector("input");
        if (radio.checked) {
            label.classList.add("checked");
        } else {
            label.classList.remove("checked");
        }
    });
}

function toggleSslPanel() {
    const sslChecked = document.getElementById("sslEnable").checked;
    const subPanel = document.getElementById("sslSubPanel");
    const portInput = document.getElementById("serverPort");

    if (sslChecked) {
        subPanel.classList.add("active");
        if (portInput.value === "80") {
            portInput.value = "443";
        }
    } else {
        subPanel.classList.remove("active");
        if (portInput.value === "443") {
            portInput.value = "80";
        }
    }
}

function toggleRateLimitPanel() {
    const rateLimitChecked = document.getElementById("rateLimitEnable").checked;
    const subPanel = document.getElementById("rateLimitSubPanel");

    if (rateLimitChecked) {
        subPanel.classList.add("active");
    } else {
        subPanel.classList.remove("active");
    }
}

function handleFormUpdate(e) {
    // Toggle Backend URL field based on selected Template Type
    const template = document.querySelector("input[name='templateType']:checked").value;
    const proxyGroup = document.getElementById("proxyGroup");
    const rootGroup = document.getElementById("rootGroup");

    if (template === "proxy") {
        proxyGroup.style.display = "block";
        rootGroup.style.display = "none";
    } else if (template === "gateway") {
        proxyGroup.style.display = "block";
        rootGroup.style.display = "block";
    } else {
        proxyGroup.style.display = "none";
        rootGroup.style.display = "block";
    }

    generateConfig();
}

// Configuration Generator Engine
function generateConfig() {
    const domain = document.getElementById("domainName").value.trim() || "example.com";
    const port = document.getElementById("serverPort").value.trim() || "80";
    const template = document.querySelector("input[name='templateType']:checked").value;

    const rootPath = document.getElementById("rootPath").value.trim() || "/var/www/html";
    const proxyUrl = document.getElementById("proxyUrl").value.trim() || "http://127.0.0.1:3000";

    const sslEnable = document.getElementById("sslEnable").checked;
    const sslRedirect = document.getElementById("sslRedirect").checked;
    const sslCert = document.getElementById("sslCert").value.trim() || "/etc/letsencrypt/live/example.com/fullchain.pem";
    const sslKey = document.getElementById("sslKey").value.trim() || "/etc/letsencrypt/live/example.com/privkey.pem";

    const gzipEnable = document.getElementById("gzipEnable").checked;
    const cacheEnable = document.getElementById("cacheEnable").checked;
    const headersEnable = document.getElementById("headersEnable").checked;

    const rateLimitEnable = document.getElementById("rateLimitEnable").checked;
    const rateLimitZone = document.getElementById("rateLimitZone").value.trim() || "api_limit";
    const rateLimitRate = document.getElementById("rateLimitRate").value.trim() || "10r/s";
    const rateLimitBurst = document.getElementById("rateLimitBurst").value.trim() || "20";

    let config = "";

    // 1. Rate Limit Zone Definition (External block)
    if (rateLimitEnable) {
        config += `# Rate Limiting Zone definition (Insert into http {} context in main nginx.conf)\n`;
        config += `limit_req_zone $binary_remote_addr zone=${rateLimitZone}:10m rate=${rateLimitRate};\n\n`;
    }

    // 2. HTTP to HTTPS Redirection Server Block (if SSL & Redirect enabled)
    if (sslEnable && sslRedirect) {
        config += `server {\n`;
        config += `    listen 80;\n`;
        config += `    listen [::]:80;\n`;
        config += `    server_name ${domain} www.${domain};\n\n`;
        config += `    # Redirect all HTTP requests to HTTPS\n`;
        config += `    return 301 https://$host$request_uri;\n`;
        config += `}\n\n`;
    }

    // 3. Main Server Block
    config += `server {\n`;

    if (sslEnable) {
        config += `    listen ${port} ssl http2;\n`;
        config += `    listen [::]:${port} ssl http2;\n`;
    } else {
        config += `    listen ${port};\n`;
        config += `    listen [::]:${port};\n`;
    }

    config += `    server_name ${domain} www.${domain};\n`;

    // SSL Cert directives
    if (sslEnable) {
        config += `\n    # SSL Certificates\n`;
        config += `    ssl_certificate     ${sslCert};\n`;
        config += `    ssl_certificate_key ${sslKey};\n\n`;
        config += `    # SSL Optimizations\n`;
        config += `    ssl_protocols TLSv1.2 TLSv1.3;\n`;
        config += `    ssl_prefer_server_ciphers on;\n`;
        config += `    ssl_session_cache shared:SSL:10m;\n`;
        config += `    ssl_session_timeout 1d;\n`;
    }

    // Gzip Compression block
    if (gzipEnable) {
        config += `\n    # Gzip Compression\n`;
        config += `    gzip on;\n`;
        config += `    gzip_vary on;\n`;
        config += `    gzip_min_length 10240;\n`;
        config += `    gzip_proxied any;\n`;
        config += `    gzip_types text/plain text/css text/xml text/javascript application/javascript application/x-javascript application/xml;\n`;
    }

    // Security Headers block
    if (headersEnable) {
        config += `\n    # Security Headers\n`;
        config += `    add_header X-Frame-Options "SAMEORIGIN" always;\n`;
        config += `    add_header X-Content-Type-Options "nosniff" always;\n`;
        config += `    add_header X-XSS-Protection "1; mode=block" always;\n`;
        config += `    add_header Referrer-Policy "no-referrer-when-downgrade" always;\n`;
        config += `    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;\n`;
    }

    // Rate Limiting declaration
    if (rateLimitEnable) {
        config += `\n    # Rate Limiting\n`;
        config += `    limit_req zone=${rateLimitZone} burst=${rateLimitBurst} nodelay;\n`;
    }

    // Location Blocks depending on Templates
    config += `\n    # Location Directives\n`;

    if (template === "static") {
        config += `    location / {\n`;
        config += `        root ${rootPath};\n`;
        config += `        index index.html index.htm;\n`;
        config += `        try_files $uri $uri/ =404;\n`;
        config += `    }\n`;
    } else if (template === "spa") {
        config += `    location / {\n`;
        config += `        root ${rootPath};\n`;
        config += `        index index.html;\n`;
        config += `        try_files $uri $uri/ /index.html;\n`;
        config += `    }\n`;
    } else if (template === "proxy") {
        config += `    location / {\n`;
        config += `        proxy_pass ${proxyUrl};\n`;
        config += `        proxy_http_version 1.1;\n`;
        config += `        proxy_set_header Upgrade $http_upgrade;\n`;
        config += `        proxy_set_header Connection 'upgrade';\n`;
        config += `        proxy_set_header Host $host;\n`;
        config += `        proxy_cache_bypass $http_upgrade;\n`;
        config += `        proxy_set_header X-Real-IP $remote_addr;\n`;
        config += `        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n`;
        config += `        proxy_set_header X-Forwarded-Proto $scheme;\n`;
        config += `    }\n`;
    } else if (template === "gateway") {
        // API Gateway location block splits / and /api/
        config += `    location / {\n`;
        config += `        root ${rootPath};\n`;
        config += `        index index.html;\n`;
        config += `        try_files $uri $uri/ /index.html;\n`;
        config += `    }\n\n`;
        config += `    location /api/ {\n`;
        config += `        proxy_pass ${proxyUrl}/;\n`;
        config += `        proxy_http_version 1.1;\n`;
        config += `        proxy_set_header Host $host;\n`;
        config += `        proxy_set_header X-Real-IP $remote_addr;\n`;
        config += `        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n`;
        config += `        proxy_set_header X-Forwarded-Proto $scheme;\n`;
        config += `    }\n`;
    }

    // Browser caching static location block
    if (cacheEnable && template !== "proxy") {
        config += `\n    # Static Assets Cache Tuning\n`;
        config += `    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {\n`;
        config += `        root ${rootPath};\n`;
        config += `        expires 30d;\n`;
        config += `        add_header Cache-Control "public, no-transform";\n`;
        config += `    }\n`;
    }

    config += `}\n`;

    document.getElementById("previewArea").value = config;
}

// Copy configuration output to clipboard
function copyConfig() {
    const textarea = document.getElementById("previewArea");
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
        if (typeof notify !== 'undefined') {
            notify.success("NGINX configuration copied to clipboard");
        } else {
            alert("Copied!");
        }
    });
}

// Download local nginx.conf file
function downloadConfig() {
    const config = document.getElementById("previewArea").value;
    const blob = new Blob([config], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "nginx.conf";
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof notify !== 'undefined') {
        notify.success("Downloaded nginx.conf file successfully");
    }
}

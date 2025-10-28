#!/bin/bash

# Script to generate self-signed SSL certificates for testing

set -e

echo "Generating self-signed SSL certificates..."

# Create ssl directory if it doesn't exist
mkdir -p ../ssl

# Generate private key
echo "Generating private key..."
openssl genrsa -out ../ssl/private.key 2048

# Generate certificate signing request
echo "Generating certificate signing request..."
openssl req -new -key ../ssl/private.key -out ../ssl/certificate.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate
echo "Generating self-signed certificate..."
openssl x509 -req -days 365 -in ../ssl/certificate.csr -signkey ../ssl/private.key -out ../ssl/certificate.crt

# Clean up CSR file
rm ../ssl/certificate.csr

# Set proper permissions
chmod 600 ../ssl/private.key
chmod 644 ../ssl/certificate.crt

echo "SSL certificates generated successfully!"
echo "Files created:"
echo "  - ../ssl/private.key (Private key)"
echo "  - ../ssl/certificate.crt (Certificate)"
echo ""
echo "IMPORTANT: These are self-signed certificates for testing only."
echo "For production, obtain certificates from a trusted Certificate Authority."
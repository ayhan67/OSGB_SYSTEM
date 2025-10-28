# SSL Certificate Setup

This directory should contain your SSL certificates for production deployment.

## Required Files

1. `certificate.crt` - Your SSL certificate
2. `private.key` - Your private key
3. `ca_bundle.crt` - Certificate authority bundle (if applicable)

## Generating Self-Signed Certificates for Testing

For development and testing purposes, you can generate self-signed certificates using OpenSSL:

```bash
# Generate private key
openssl genrsa -out private.key 2048

# Generate certificate signing request
openssl req -new -key private.key -out certificate.csr

# Generate self-signed certificate
openssl x509 -req -days 365 -in certificate.csr -signkey private.key -out certificate.crt
```

## Production Certificates

For production, obtain certificates from a trusted Certificate Authority (CA) such as:
- Let's Encrypt (free)
- DigiCert
- Comodo
- GoDaddy

## Security Notes

- Never commit private keys to version control
- Ensure proper file permissions (600 for private key)
- Regularly renew certificates before expiration
- Use strong encryption for private keys
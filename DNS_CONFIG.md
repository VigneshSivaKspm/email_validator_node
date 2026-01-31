# DNS Configuration Guide

## Issue: MX Record Lookup Failures

If you're seeing "❌ [MX] No MX record found" for valid domains, the issue is likely DNS resolution.

### Solutions:

#### 1. **Check DNS Server Configuration (Windows)**

Open Command Prompt and verify your DNS servers:
```cmd
ipconfig /all
```

Look for "DNS Servers" - they should not be empty or set to 0.0.0.0.

#### 2. **Set Global DNS Servers (Windows)**

If DNS is not configured:
```cmd
ipconfig /setdns "Ethernet" static 8.8.8.8 primary
ipconfig /setdns "Ethernet" static 8.8.4.4 secondary
```

Or use your organization's DNS servers.

#### 3. **Configure Node.js to Use Specific DNS Servers**

Create/update your `.env` file:
```env
DNS_SERVERS=8.8.8.8,8.8.4.4
NODE_OPTIONS=--dns-result-order=ipv4first
```

Then modify `src/dns/dns.ts` to use custom DNS servers:

```typescript
import dns from 'dns'

// Read custom DNS servers from environment
const customDnsServers = process.env.DNS_SERVERS?.split(',') || []

if (customDnsServers.length > 0) {
  console.log('🔧 [DNS] Setting custom DNS servers:', customDnsServers)
  dns.setServers(customDnsServers)
}
```

#### 4. **Test DNS Resolution**

```cmd
nslookup willscot.com
nslookup wgsn.com
```

Both should return MX records.

#### 5. **Linux/Mac DNS Configuration**

Edit `/etc/resolv.conf`:
```
nameserver 8.8.8.8
nameserver 8.8.4.4
```

### Common DNS Servers:

- **Google**: 8.8.8.8, 8.8.4.4
- **Cloudflare**: 1.1.1.1, 1.0.0.1
- **Quad9**: 9.9.9.9, 149.112.112.112

### Log Analysis:

After the fix, you should see:
```
✅ [MX] Found: mail.willscot.com
```

Instead of:
```
❌ [MX] No MX record found
```

### Debugging:

Run this to test DNS directly:
```bash
node -e "require('dns').resolveMx('willscot.com', (err, addresses) => console.log(err, addresses))"
```

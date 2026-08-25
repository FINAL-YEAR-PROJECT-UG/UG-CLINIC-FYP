# CDN Configuration Guide

This guide explains how to configure CDN (Content Delivery Network) for the UG Clinic Portal to optimize asset delivery and improve performance.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# CDN URL for static assets (e.g., https://cdn.example.com)
# This will prefix all static asset URLs with the CDN domain
CDN_URL=https://your-cdn-domain.com

# Alternative: Use separate CDN for different asset types
# IMAGE_CDN_URL=https://image-cdn.example.com
# JS_CDN_URL=https://js-cdn.example.com
# CSS_CDN_URL=https://css-cdn.example.com
```

## Supported CDN Providers

### 1. Cloudflare CDN
```bash
CDN_URL=https://your-site.cloudflare.com
```

### 2. AWS CloudFront
```bash
CDN_URL=https://your-distribution.cloudfront.net
```

### 3. Vercel CDN (Automatic)
If deploying to Vercel, CDN is automatically configured. No additional setup needed.

### 4. Netlify CDN (Automatic)
If deploying to Netlify, CDN is automatically configured. No additional setup needed.

### 5. Custom CDN
```bash
CDN_URL=https://cdn.yourdomain.com
```

## Configuration Options

### Image Optimization
The Next.js config is already set up to work with CDN:

- **Formats**: WebP and AVIF for modern browsers
- **Device Sizes**: Optimized for common screen sizes
- **Cache TTL**: 24 hours for images
- **CDN Support**: Automatic CDN prefix when `CDN_URL` is set

### Static Asset Caching
The application includes aggressive caching headers for static assets:

- **Next.js Static Assets**: 1-year cache (immutable)
- **Images**: 24-hour cache with stale-while-revalidate
- **Fonts**: 1-year cache (immutable)
- **CSS/JS**: 1-year cache (immutable)

## Testing CDN Configuration

### 1. Local Testing
To test CDN configuration locally:

```bash
# Set CDN_URL in .env.local
CDN_URL=https://your-test-cdn.com

# Run development server
npm run dev
```

### 2. Production Testing
After deployment:

1. Open browser DevTools Network tab
2. Check asset URLs - they should be prefixed with your CDN domain
3. Verify asset sizes and load times
4. Check cache headers in response headers

## Performance Monitoring

Monitor CDN performance using:

1. **Google PageSpeed Insights**: https://pagespeed.web.dev/
2. **WebPageTest**: https://www.webpagetest.org/
3. **Lighthouse CI**: For automated performance testing

## Troubleshooting

### Assets not loading from CDN
- Verify `CDN_URL` is set correctly in environment variables
- Check CDN configuration allows CORS requests
- Ensure CDN is properly configured to pull from your origin server

### Images not optimized
- Verify image formats are supported by your CDN
- Check Next.js image optimization is working
- Ensure image domains are added to `remotePatterns` in config

### Cache issues
- Clear browser cache and CDN cache
- Verify cache headers are set correctly
- Check CDN cache invalidation settings

## Advanced Configuration

### Custom Image Loader
For advanced image CDN configuration, modify `next.config.ts`:

```typescript
images: {
  loader: 'custom',
  loaderFile: './lib/imageLoader.ts',
}
```

### Compression
Enable compression at your CDN level:

- **Gzip**: Enable for text-based assets
- **Brotli**: Enable for better compression ratios
- **HTTP/2**: Enable for multiplexing and header compression

### Cache Invalidation
Set up automatic cache invalidation:

- **Time-based**: Automatic expiration after TTL
- **Event-based**: Invalidate on deployments
- **Manual**: API-based cache purging

## Cost Optimization

To optimize CDN costs:

1. **Cache Hit Ratio**: Aim for >90% cache hit ratio
2. **Bandwidth**: Use image optimization to reduce bandwidth
3. **Regions**: Configure CDN regions closest to users
4. **TTL**: Balance freshness with cache duration

## Security Considerations

1. **HTTPS**: Always use HTTPS for CDN URLs
2. **CORS**: Configure CORS properly for your CDN
3. **Authentication**: Use signed URLs for private content
4. **DDoS Protection**: Enable DDoS protection at CDN level

## Deployment Checklist

Before deploying with CDN:

- [ ] Set `CDN_URL` environment variable
- [ ] Configure CDN origin server
- [ ] Set up SSL certificates
- [ ] Configure cache rules
- [ ] Test asset delivery
- [ ] Monitor performance metrics
- [ ] Set up cache invalidation strategy
- [ ] Configure error pages
- [ ] Enable compression
- [ ] Test offline functionality
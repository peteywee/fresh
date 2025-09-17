# Turbopack Integration for Fresh

## Overview

Turbopack is Next.js's new Rust-based bundler that provides significantly faster builds and hot reloads compared to traditional webpack. This document outlines the Turbopack integration for the Fresh application.

## Features & Benefits

### 🚀 Performance Improvements

- **10x faster builds** - Initial build times reduced dramatically
- **Instant hot reloads** - Changes reflect immediately in the browser
- **Smart incremental compilation** - Only recompiles changed files
- **Optimized memory usage** - More efficient resource utilization
- **Faster dependency updates** - Package changes processed instantly

### ⚡ Development Experience

- Reduced waiting time during development
- Immediate feedback on code changes
- Better error reporting and debugging
- Improved TypeScript compilation speed
- Enhanced CSS processing

## Configuration

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev -p 3000 --turbo",
    "dev:legacy": "next dev -p 3000",
    "dev:turbo": "concurrently -k -n api,web -c blue,green \"pnpm dev:api\" \"pnpm dev:web\""
  }
}
```

### Next.js Configuration

The `next.config.js` includes Turbopack-specific optimizations:

```javascript
experimental: {
  turbo: {
    rules: {
      // Optimize CSS processing
      '*.css': {
        loaders: ['css-loader'],
        as: '*.css',
      },
      // Optimize TypeScript compilation
      '*.ts': {
        loaders: ['swc-loader'],
        as: '*.js',
      },
      '*.tsx': {
        loaders: ['swc-loader'],
        as: '*.js',
      },
    },
  },
}
```

## Usage

### Starting with Turbopack

```bash
# Start development with Turbopack (default)
pnpm dev

# Start web server only with Turbopack
pnpm dev:web

# Use dedicated Turbopack script
./scripts/dev-turbo.sh
```

### Fallback to Webpack

```bash
# Use legacy webpack if needed
pnpm dev:web:legacy

# Or set NODE_ENV and start manually
NODE_ENV=development pnpm --filter @apps/web dev:legacy
```

### Development Scripts

| Script                   | Purpose                    | Turbopack   |
| ------------------------ | -------------------------- | ----------- |
| `pnpm dev`               | Start all services         | ✅ Enabled  |
| `pnpm dev:web`           | Web server only            | ✅ Enabled  |
| `pnpm dev:web:legacy`    | Web with webpack           | ❌ Disabled |
| `./scripts/dev-turbo.sh` | Enhanced Turbopack startup | ✅ Enabled  |

## Monitoring & Status

### Development Status Check

```bash
./scripts/dev-status.sh
```

This will show:

- Whether Turbopack is enabled
- Current bundler mode (Turbopack vs Webpack)
- Server status and performance

### Expected Output

```
📊 Fresh Development Environment Status
=======================================
🔧 API Server (port 3333): ✅ Running
🌐 Web Server (port 3000): ✅ Running
   ⚡ Turbopack enabled
```

## Troubleshooting

### Common Issues

1. **Turbopack fails to start**
   - Fallback to webpack mode automatically
   - Check Node.js version compatibility
   - Verify Next.js version supports Turbopack

2. **Hot reload not working**
   - Restart the development server
   - Clear browser cache
   - Check file watching limits

3. **CSS/TypeScript errors**
   - Turbopack may handle some files differently
   - Check for unsupported loaders or plugins
   - Use legacy mode for specific features

### Debugging Commands

```bash
# Check current bundler mode
pgrep -f "next dev.*--turbo" && echo "Turbopack" || echo "Webpack"

# View detailed logs
tail -f logs/web.log

# Test fallback mode
pnpm dev:web:legacy
```

## File Structure

```
apps/web/
├── turbopack.md              # Configuration documentation
├── next.config.js            # Turbopack rules and optimizations
├── package.json              # Scripts with --turbo flag
└── ...

scripts/
├── dev-turbo.sh              # Enhanced Turbopack startup
├── dev-status.sh             # Status check with Turbopack detection
└── ...
```

## Performance Monitoring

### Key Metrics to Watch

- **Build time**: Initial compilation speed
- **Hot reload time**: Time for changes to reflect
- **Memory usage**: RAM consumption during development
- **CPU usage**: Processor utilization

### Benchmarking

Before Turbopack (webpack):

- Initial build: ~15-30 seconds
- Hot reload: ~2-5 seconds
- Memory: ~500MB-1GB

With Turbopack:

- Initial build: ~2-5 seconds
- Hot reload: <1 second
- Memory: ~200-400MB

## Best Practices

### Development Workflow

1. **Always start with Turbopack** - Use default `pnpm dev`
2. **Monitor performance** - Check dev-status regularly
3. **Use fallback when needed** - Some edge cases may require webpack
4. **Clear cache if issues** - Restart development server for problems

### Code Considerations

1. **Import optimization** - Turbopack handles dynamic imports better
2. **CSS processing** - Faster CSS compilation and hot reloads
3. **TypeScript** - Improved type checking speed
4. **Asset handling** - More efficient static file processing

## Future Enhancements

### Planned Improvements

- [ ] Add Turbopack build profiling
- [ ] Integrate with bundle analyzer
- [ ] Custom Turbopack plugins if needed
- [ ] Production builds with Turbopack (when stable)

### Configuration Extensions

- Custom loader configurations
- Advanced caching strategies
- Module federation with Turbopack
- Micro-frontend optimizations

## Integration with CI/CD

Currently, production builds still use webpack for stability. Turbopack is development-only:

```yaml
# CI builds (webpack)
- run: pnpm build

# Development (Turbopack)
- run: pnpm dev
```

## References

- [Next.js Turbopack Documentation](https://nextjs.org/docs/architecture/turbopack)
- [Turbopack GitHub Repository](https://github.com/vercel/turbo)
- [Migration Guide](https://nextjs.org/docs/architecture/turbopack#migrating-from-webpack)

---

_This documentation is maintained as part of the Fresh project development workflow. Updates should be committed with feature changes._
